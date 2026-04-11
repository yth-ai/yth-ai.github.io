import { useState, useMemo, useRef, useEffect } from 'react';
import { MODEL_PRESETS, ARCHITECTURE_INFO, type ModelPreset } from './utils/model-presets';
import { calcAllArchitectures, formatBytes, type Precision } from './utils/kv-cache-calc';

type ArchType = 'MHA' | 'GQA' | 'MQA' | 'MLA';
const ARCH_TYPES: ArchType[] = ['MHA', 'GQA', 'MQA', 'MLA'];

interface Config {
  nHeads: number;
  nKVHeads: number;
  dModel: number;
  dHead: number;
  nLayers: number;
  seqLen: number;
  precision: Precision;
}

const DEFAULT_CONFIG: Config = {
  nHeads: 32,
  nKVHeads: 8,
  dModel: 4096,
  dHead: 128,
  nLayers: 32,
  seqLen: 8192,
  precision: 'fp16',
};

export default function ArchitectureTab() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [selectedArch, setSelectedArch] = useState<ArchType>('GQA');
  const [hoveredArch, setHoveredArch] = useState<ArchType | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const kvResults = useMemo(() => calcAllArchitectures({
    nHeads: config.nHeads,
    nKVHeads: config.nKVHeads,
    dHead: config.dHead,
    seqLen: config.seqLen,
    nLayers: config.nLayers,
    precision: config.precision,
  }), [config]);

  const maxKV = kvResults.MHA.bytes;

  function applyPreset(key: string) {
    const p = MODEL_PRESETS[key];
    if (!p) return;
    setConfig({
      nHeads: p.nHeads,
      nKVHeads: p.nKVHeads,
      dModel: p.dModel,
      dHead: p.dHead,
      nLayers: p.nLayers,
      seqLen: p.defaultSeqLen,
      precision: 'fp16',
    });
    setSelectedArch(p.architecture);
  }

  // Compute effective KV heads for diagram
  const diagramKVHeads: Record<ArchType, number> = {
    MHA: Math.min(config.nHeads, 16),
    GQA: Math.min(config.nKVHeads, 16),
    MQA: 1,
    MLA: 1, // latent compression
  };

  const diagramQHeads = Math.min(config.nHeads, 16);

  // Throughput estimation for batch sizes 1-64
  const batchSizes = [1, 2, 4, 8, 16, 32, 48, 64];
  const throughputData = useMemo(() => {
    const GPU_MEM_GB = 80;
    const GPU_BW_GBS = 2039; // A100 HBM bandwidth
    return ARCH_TYPES.map(arch => {
      const kvPerToken = kvResults[arch].bytes / config.seqLen; // per-token KV bytes
      return batchSizes.map(bs => {
        const kvTotal = kvResults[arch].bytes * bs;
        const modelMem = config.nLayers * config.dModel * config.dModel * 4 * 2; // rough
        const totalMemGB = (kvTotal + modelMem) / (1024 ** 3);
        if (totalMemGB > GPU_MEM_GB) return null; // OOM
        const bytesPerStep = kvTotal / config.seqLen;
        const tps = Math.min((GPU_BW_GBS * 1e9) / Math.max(bytesPerStep, 1) / 1000, 30000);
        return Math.round(tps * bs / Math.max(bs, 1));
      });
    });
  }, [kvResults, config]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw throughput chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = { top: 30, right: 20, bottom: 40, left: 60 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const isDark = document.documentElement.classList.contains('dark');
    const bg = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Find max throughput
    let maxThroughput = 0;
    throughputData.forEach(archData => {
      archData.forEach(v => { if (v !== null && v > maxThroughput) maxThroughput = v; });
    });
    maxThroughput = Math.ceil(maxThroughput / 5000) * 5000 || 10000;

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      const val = Math.round(maxThroughput * (1 - i / 4));
      ctx.fillStyle = textColor;
      ctx.font = '11px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(val.toLocaleString(), pad.left - 8, y + 4);
    }

    // X axis labels
    ctx.textAlign = 'center';
    ctx.font = '11px system-ui';
    batchSizes.forEach((bs, i) => {
      const x = pad.left + (plotW / (batchSizes.length - 1)) * i;
      ctx.fillStyle = textColor;
      ctx.fillText(String(bs), x, H - pad.bottom + 18);
    });

    // Axis titles
    ctx.fillStyle = textColor;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Batch Size', W / 2, H - 4);
    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Tokens/s', 0, 0);
    ctx.restore();

    // Draw lines
    ARCH_TYPES.forEach((arch, ai) => {
      const color = ARCHITECTURE_INFO[arch].color;
      const data = throughputData[ai];

      ctx.strokeStyle = color;
      ctx.lineWidth = hoveredArch === arch || selectedArch === arch ? 3 : 1.5;
      ctx.globalAlpha = (hoveredArch && hoveredArch !== arch) ? 0.3 : 1;
      ctx.beginPath();

      let lastValidX = 0, lastValidY = 0;
      data.forEach((v, i) => {
        const x = pad.left + (plotW / (batchSizes.length - 1)) * i;
        if (v === null) {
          // OOM — draw X mark
          ctx.stroke();
          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.5;
          const size = 4;
          ctx.moveTo(x - size, lastValidY - size);
          ctx.lineTo(x + size, lastValidY + size);
          ctx.moveTo(x + size, lastValidY - size);
          ctx.lineTo(x - size, lastValidY + size);
          ctx.stroke();
          ctx.beginPath();
          return;
        }
        const y = pad.top + plotH * (1 - v / maxThroughput);
        lastValidX = x;
        lastValidY = y;
        if (i === 0 || data[i - 1] === null) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Label at end
      const lastValid = data.filter(v => v !== null);
      if (lastValid.length > 0) {
        const lastIdx = data.lastIndexOf(lastValid[lastValid.length - 1]);
        const lx = pad.left + (plotW / (batchSizes.length - 1)) * lastIdx;
        const ly = pad.top + plotH * (1 - (lastValid[lastValid.length - 1] || 0) / maxThroughput);
        ctx.fillStyle = color;
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(arch, lx + 6, ly + 4);
      }
    });
  }, [throughputData, selectedArch, hoveredArch]);

  return (
    <div className="space-y-6">
      {/* Architecture info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ARCH_TYPES.map(arch => {
          const info = ARCHITECTURE_INFO[arch];
          const isActive = selectedArch === arch;
          return (
            <button
              key={arch}
              onClick={() => setSelectedArch(arch)}
              onMouseEnter={() => setHoveredArch(arch)}
              onMouseLeave={() => setHoveredArch(null)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isActive
                  ? 'border-2 shadow-lg scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              style={{
                borderColor: isActive ? info.color : undefined,
                backgroundColor: isActive ? `${info.color}10` : undefined,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span className="font-bold text-sm text-slate-900 dark:text-white">{arch}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
                {info.label}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                {info.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Preset buttons */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">模型预设</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(MODEL_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="font-medium">{preset.name}</span>
              <span className="ml-1.5 opacity-60">({preset.architecture})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Architecture SVG Diagram */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            {selectedArch} 架构示意图
            <span className="ml-2 text-xs font-normal text-slate-500">
              {ARCHITECTURE_INFO[selectedArch].label}
            </span>
          </h3>
          <svg ref={svgRef} viewBox="0 0 400 300" className="w-full" style={{ maxHeight: 300 }}>
            {/* Background */}
            <rect x="0" y="0" width="400" height="300" fill="none" />

            {/* Query heads (left) */}
            <text x="80" y="20" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="12" fontWeight="bold">Query Heads</text>
            {Array.from({ length: diagramQHeads }, (_, i) => {
              const y = 40 + (240 / Math.max(diagramQHeads - 1, 1)) * i;
              const kvIdx = selectedArch === 'MHA'
                ? i % diagramKVHeads[selectedArch]
                : selectedArch === 'GQA'
                  ? Math.floor(i / (diagramQHeads / diagramKVHeads[selectedArch]))
                  : 0;
              const kvY = selectedArch === 'MLA'
                ? 160 // single latent point
                : 40 + (240 / Math.max(diagramKVHeads[selectedArch] - 1, 1)) * kvIdx;
              const midX = selectedArch === 'MLA' ? 200 : 200;
              const color = ARCHITECTURE_INFO[selectedArch].color;

              return (
                <g key={i}>
                  {/* Connection line */}
                  <path
                    d={selectedArch === 'MLA'
                      ? `M 110 ${y} C ${midX} ${y}, ${midX} ${kvY}, 240 ${kvY}`
                      : `M 110 ${y} C ${midX} ${y}, ${midX} ${kvY}, 290 ${kvY}`
                    }
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.4"
                  />
                  {/* Q head dot */}
                  <circle cx="100" cy={y} r="6" fill={color} opacity="0.8" />
                  <text x="70" y={y + 4} textAnchor="end" fontSize="9" className="fill-slate-400 dark:fill-slate-500">
                    Q{i}
                  </text>
                </g>
              );
            })}

            {/* MLA compression node */}
            {selectedArch === 'MLA' && (
              <g>
                <rect x="220" y="130" width="60" height="60" rx="8" fill={ARCHITECTURE_INFO.MLA.color} opacity="0.15" stroke={ARCHITECTURE_INFO.MLA.color} strokeWidth="1.5" />
                <text x="250" y="157" textAnchor="middle" fontSize="10" fontWeight="bold" className="fill-slate-700 dark:fill-slate-300">压缩</text>
                <text x="250" y="172" textAnchor="middle" fontSize="8" className="fill-slate-500 dark:fill-slate-400">d=512</text>
                {/* Arrow from compression to KV */}
                <path d="M 280 160 L 310 160" stroke={ARCHITECTURE_INFO.MLA.color} strokeWidth="2" markerEnd="url(#arrowhead)" />
              </g>
            )}

            {/* KV heads (right) */}
            <text x="320" y="20" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="12" fontWeight="bold">KV Heads</text>
            {Array.from({ length: diagramKVHeads[selectedArch] }, (_, i) => {
              const totalKV = diagramKVHeads[selectedArch];
              const y = totalKV === 1 ? 160 : 40 + (240 / Math.max(totalKV - 1, 1)) * i;
              const color = ARCHITECTURE_INFO[selectedArch].color;
              const x = selectedArch === 'MLA' ? 320 : 300;

              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="8" fill={color} opacity="0.9" />
                  <text x={x} y={y + 3} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">
                    {selectedArch === 'MLA' ? 'C' : `K${i}`}
                  </text>
                  <text x={x + 18} y={y + 4} textAnchor="start" fontSize="9" className="fill-slate-400 dark:fill-slate-500">
                    {selectedArch === 'MQA' ? 'KV₀ (shared)' :
                     selectedArch === 'MLA' ? 'Latent' : `KV${i}`}
                  </text>
                </g>
              );
            })}

            {/* Arrow marker */}
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={ARCHITECTURE_INFO[selectedArch].color} />
              </marker>
            </defs>

            {/* Ratio label */}
            <text x="200" y="295" textAnchor="middle" fontSize="11" className="fill-slate-600 dark:fill-slate-300" fontWeight="bold">
              {selectedArch === 'MHA' ? `${config.nHeads}Q : ${config.nHeads}KV (1:1)` :
               selectedArch === 'GQA' ? `${config.nHeads}Q : ${config.nKVHeads}KV (${config.nHeads / config.nKVHeads}:1)` :
               selectedArch === 'MQA' ? `${config.nHeads}Q : 1KV (${config.nHeads}:1)` :
               `${config.nHeads}Q → Latent(512) → KV`}
            </text>
          </svg>
        </div>

        {/* Parameter controls */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">参数配置</h3>

          {[
            { key: 'nHeads', label: 'n_heads (Query)', min: 8, max: 128, step: 8 },
            { key: 'nKVHeads', label: 'n_kv_heads', min: 1, max: 128, step: 1 },
            { key: 'dHead', label: 'd_head', min: 64, max: 256, step: 64 },
            { key: 'nLayers', label: 'n_layers', min: 12, max: 120, step: 4 },
            { key: 'seqLen', label: 'seq_len', min: 1024, max: 131072, step: 1024 },
          ].map(({ key, label, min, max, step }) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-mono">{label}</span>
                <span className="text-slate-900 dark:text-white font-bold">
                  {(config[key as keyof Config] as number).toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={config[key as keyof Config] as number}
                onChange={(e) => setConfig(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          ))}

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400 font-mono">precision</span>
            </div>
            <div className="flex gap-2">
              {(['fp16', 'fp8', 'fp32'] as Precision[]).map(p => (
                <button
                  key={p}
                  onClick={() => setConfig(prev => ({ ...prev, precision: p }))}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                    config.precision === p
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KV Cache comparison */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">KV Cache 内存对比</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          公式: <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">2 × n_kv_heads × d_head × seq_len × n_layers × precision_bytes</code>
        </p>

        <div className="space-y-3">
          {ARCH_TYPES.map(arch => {
            const info = ARCHITECTURE_INFO[arch];
            const result = kvResults[arch];
            const pct = (result.bytes / maxKV) * 100;
            const isSelected = arch === selectedArch;

            return (
              <div
                key={arch}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                  isSelected ? 'bg-slate-50 dark:bg-slate-700/50 ring-1' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
                style={{ ringColor: isSelected ? info.color : undefined }}
                onClick={() => setSelectedArch(arch)}
              >
                <div className="w-12 text-center">
                  <div className="text-xs font-bold" style={{ color: info.color }}>{arch}</div>
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        backgroundColor: info.color,
                        opacity: 0.8,
                      }}
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-white mix-blend-difference">
                      {result.label}
                    </span>
                  </div>
                </div>
                <div className="w-24 text-right">
                  {arch === 'MHA' ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">基线</span>
                  ) : (
                    <span className="text-xs font-bold" style={{ color: info.color }}>
                      -{result.savingPct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Throughput chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">吞吐量估算（A100 80GB）</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          基于 HBM 带宽和 KV Cache 大小的简化估算。曲线中断表示超出 GPU 显存（OOM）。
        </p>
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg"
          style={{ height: 280 }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const w = rect.width;
            // Determine which arch curve is closest
            if (x < 60 || x > w - 20) { setHoveredArch(null); return; }
            // Simple: no hover logic for throughput, just use arch cards
          }}
          onMouseLeave={() => setHoveredArch(null)}
        />
        <div className="flex justify-center gap-4 mt-3">
          {ARCH_TYPES.map(arch => (
            <div key={arch} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: ARCHITECTURE_INFO[arch].color }} />
              <span className="text-xs text-slate-500 dark:text-slate-400">{arch}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-purple-200 dark:border-slate-700 p-5">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">为什么注意力架构如此重要</h4>
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
          <p>推理阶段，KV Cache 是内存消耗的主要来源。以 Llama 3 70B 为例，在 8K 序列长度下：</p>
          <p>MHA 需要 <strong>~20 GB</strong> KV Cache，GQA (8:1) 只需 <strong>~2.5 GB</strong>——节省 87.5%。</p>
          <p>这直接决定了同一块 GPU 能同时服务多少用户（batch size），从而决定推理成本。</p>
          <p className="text-slate-400 dark:text-slate-500 mt-2">
            所有数值基于简化模型估算，实际部署还需考虑模型权重、激活值、系统开销等因素。
          </p>
        </div>
      </div>
    </div>
  );
}
