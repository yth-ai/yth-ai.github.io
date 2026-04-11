import { useState, useRef, useEffect, useMemo } from 'react';
import { interpolateColor, type ColorScale } from './utils/color-scales';

type WindowStrategy = 'full' | 'causal' | 'sliding' | 'hybrid';

interface StrategyInfo {
  id: WindowStrategy;
  label: string;
  description: string;
  complexity: string;
  models: string[];
  color: string;
}

const STRATEGIES: StrategyInfo[] = [
  {
    id: 'full',
    label: '全注意力 (Full)',
    description: '完整 N×N 矩阵，所有位置互相可见。用于编码器（BERT）或短序列场景。',
    complexity: 'O(N²)',
    models: ['BERT', 'T5 Encoder'],
    color: '#6366f1',
  },
  {
    id: 'causal',
    label: '因果掩码 (Causal)',
    description: '下三角矩阵——每个 token 只能看到自己和之前的 token。所有自回归 LLM 的标准配置。',
    complexity: 'O(N²/2)',
    models: ['GPT', 'Llama', 'DeepSeek'],
    color: '#10b981',
  },
  {
    id: 'sliding',
    label: '滑动窗口 (SWA)',
    description: '每个 token 只关注窗口范围内的邻居。超出窗口的 token 不可见，但信息可通过层间传播。',
    complexity: 'O(N×W)',
    models: ['Gemma 3', 'Mistral', 'OLMo 3'],
    color: '#f59e0b',
  },
  {
    id: 'hybrid',
    label: '混合策略 (Hybrid)',
    description: '大部分层用 SWA，每 N 层穿插一个 Full Attention 层。全局信息通过 Full 层在远距离 token 间传播。',
    complexity: 'O(N×W + N²/K)',
    models: ['Gemma 3 (5:1)', 'InternLM3'],
    color: '#ec4899',
  },
];

export default function WindowStrategyTab() {
  const [strategy, setStrategy] = useState<WindowStrategy>('causal');
  const [gridSize, setGridSize] = useState(48);
  const [windowSize, setWindowSize] = useState(8);
  const [hybridRatio, setHybridRatio] = useState(5); // every Nth layer is Full
  const [currentLayer, setCurrentLayer] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [colorScale] = useState<ColorScale>('viridis');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalLayers = 32;

  // Generate mask matrix
  const mask = useMemo(() => {
    const n = gridSize;
    const m: boolean[][] = [];

    for (let i = 0; i < n; i++) {
      const row: boolean[] = [];
      for (let j = 0; j < n; j++) {
        let visible = false;
        switch (strategy) {
          case 'full':
            visible = true;
            break;
          case 'causal':
            visible = j <= i;
            break;
          case 'sliding':
            visible = j <= i && (i - j) < windowSize;
            break;
          case 'hybrid':
            if (currentLayer % hybridRatio === 0) {
              // Full attention layer
              visible = j <= i;
            } else {
              // SWA layer
              visible = j <= i && (i - j) < windowSize;
            }
            break;
        }
        row.push(visible);
      }
      m.push(row);
    }
    return m;
  }, [strategy, gridSize, windowSize, hybridRatio, currentLayer]);

  // Compute stats
  const stats = useMemo(() => {
    let visible = 0;
    const total = gridSize * gridSize;
    for (const row of mask) {
      for (const cell of row) {
        if (cell) visible++;
      }
    }
    const sparsity = 1 - visible / total;
    const effectiveReceptiveField = strategy === 'sliding' || (strategy === 'hybrid' && currentLayer % hybridRatio !== 0)
      ? windowSize
      : gridSize;
    const theoreticalFLOPs = visible * 2; // simplified: 2 FLOPs per visible cell
    return { visible, total, sparsity, effectiveReceptiveField, theoreticalFLOPs };
  }, [mask, gridSize, windowSize, strategy, hybridRatio, currentLayer]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const isDark = document.documentElement.classList.contains('dark');
    const bg = isDark ? '#1e293b' : '#ffffff';
    const emptyColor = isDark ? '#0f172a' : '#f1f5f9';
    const gridLineColor = isDark ? '#334155' : '#e2e8f0';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    const cellSize = size / gridSize;

    // Draw cells
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = j * cellSize;
        const y = i * cellSize;

        if (mask[i][j]) {
          // Visible cell — color intensity based on distance
          const dist = Math.abs(i - j);
          const maxDist = strategy === 'sliding' || (strategy === 'hybrid' && currentLayer % hybridRatio !== 0)
            ? windowSize
            : gridSize;
          const t = 1 - Math.min(dist / maxDist, 1);
          ctx.fillStyle = interpolateColor(colorScale, t * 0.8 + 0.2);
        } else {
          ctx.fillStyle = emptyColor;
        }
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    // Grid lines (only if cellSize > 4)
    if (cellSize > 4) {
      ctx.strokeStyle = gridLineColor;
      ctx.lineWidth = 0.3;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(size, i * cellSize);
        ctx.stroke();
      }
    }

    // Hover highlight
    if (hoveredCell) {
      const { r, c } = hoveredCell;
      ctx.strokeStyle = isDark ? '#f59e0b' : '#d97706';
      ctx.lineWidth = 2;
      // Highlight row
      ctx.strokeRect(0, r * cellSize, size, cellSize);
      // Highlight col
      ctx.strokeRect(c * cellSize, 0, cellSize, size);
      // Highlight cell
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }

    // Diagonal indicator line
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    ctx.stroke();
    ctx.setLineDash([]);

    // Window boundary (for sliding/hybrid)
    if (strategy === 'sliding' || (strategy === 'hybrid' && currentLayer % hybridRatio !== 0)) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      // Draw window boundary line
      for (let i = 0; i < gridSize; i++) {
        const boundaryJ = Math.max(0, i - windowSize + 1);
        const x = boundaryJ * cellSize;
        const y = i * cellSize + cellSize;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        ctx.lineTo(x, y - cellSize);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [mask, gridSize, hoveredCell, colorScale, strategy, windowSize, hybridRatio, currentLayer]);

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const cellSize = size / gridSize;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      setHoveredCell({ r, c });
    } else {
      setHoveredCell(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Strategy selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STRATEGIES.map(s => (
          <button
            key={s.id}
            onClick={() => setStrategy(s.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              strategy === s.id
                ? 'border-2 shadow-lg'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            style={{
              borderColor: strategy === s.id ? s.color : undefined,
              backgroundColor: strategy === s.id ? `${s.color}10` : undefined,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="font-bold text-xs text-slate-900 dark:text-white">{s.label}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{s.description}</div>
            <div className="flex items-center gap-2">
              <code className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono text-slate-600 dark:text-slate-300">
                {s.complexity}
              </code>
              <span className="text-xs text-slate-400">{s.models.slice(0, 2).join(', ')}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas — attention mask */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Attention Mask ({gridSize}×{gridSize})
            </h3>
            {hoveredCell && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ({hoveredCell.r}, {hoveredCell.c}) → {mask[hoveredCell.r][hoveredCell.c] ? '可见' : '不可见'}
              </span>
            )}
          </div>
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="cursor-crosshair rounded-lg"
              style={{ width: 400, height: 400 }}
              onMouseMove={handleCanvasMove}
              onMouseLeave={() => setHoveredCell(null)}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-400">
            <span>↓ Query (i)</span>
            <span>→ Key (j)</span>
          </div>
        </div>

        {/* Controls & stats */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">参数控制</h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">序列长度</span>
                <span className="text-slate-900 dark:text-white font-bold">{gridSize}</span>
              </div>
              <input
                type="range" min={16} max={96} step={8} value={gridSize}
                onChange={e => setGridSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {(strategy === 'sliding' || strategy === 'hybrid') && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">窗口大小 (W)</span>
                  <span className="text-slate-900 dark:text-white font-bold">{windowSize}</span>
                </div>
                <input
                  type="range" min={2} max={Math.min(32, gridSize)} step={1} value={windowSize}
                  onChange={e => setWindowSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            )}

            {strategy === 'hybrid' && (
              <>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Full 层间隔 (1:{hybridRatio})</span>
                    <span className="text-slate-900 dark:text-white font-bold">{hybridRatio}</span>
                  </div>
                  <input
                    type="range" min={2} max={10} step={1} value={hybridRatio}
                    onChange={e => setHybridRatio(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">当前层</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      Layer {currentLayer}
                      {currentLayer % hybridRatio === 0
                        ? ' (Full)'
                        : ' (SWA)'}
                    </span>
                  </div>
                  <input
                    type="range" min={0} max={totalLayers - 1} step={1} value={currentLayer}
                    onChange={e => setCurrentLayer(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex gap-0.5 mt-2">
                    {Array.from({ length: totalLayers }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-2 rounded-sm cursor-pointer transition-all"
                        style={{
                          backgroundColor: i % hybridRatio === 0 ? '#ec4899' : '#64748b',
                          opacity: i === currentLayer ? 1 : 0.3,
                        }}
                        onClick={() => setCurrentLayer(i)}
                        title={`Layer ${i}${i % hybridRatio === 0 ? ' (Full)' : ' (SWA)'}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Layer 0</span>
                    <span>Layer {totalLayers - 1}</span>
                  </div>
                </div>
              </>
            )}

            {/* Preset configs */}
            {(strategy === 'sliding' || strategy === 'hybrid') && (
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">真实配置参考</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Gemma 3', w: 8, ratio: 5 },
                    { label: 'Mistral', w: 4, ratio: 6 },
                    { label: 'OLMo 3', w: 8, ratio: 4 },
                  ].map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setWindowSize(p.w);
                        setHybridRatio(p.ratio);
                        if (strategy === 'sliding') setStrategy('hybrid');
                      }}
                      className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      {p.label} (W={p.w}, 1:{p.ratio})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">统计面板</h3>
            <div className="space-y-2">
              {[
                { label: '可见位置', value: stats.visible.toLocaleString(), sub: `/ ${stats.total.toLocaleString()}` },
                { label: '稀疏度', value: `${(stats.sparsity * 100).toFixed(1)}%`, sub: '不可见占比' },
                { label: '有效感受野', value: `${stats.effectiveReceptiveField}`, sub: 'tokens' },
                { label: '理论 FLOPs', value: `${(stats.theoreticalFLOPs / 1000).toFixed(1)}K`, sub: '简化估算' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{s.value}</span>
                    <span className="text-xs text-slate-400 ml-1">{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-amber-200 dark:border-slate-700 p-5">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">混合策略：最佳工程实践</h4>
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
          <p>Gemma 3 采用 5:1 混合策略——每 5 层 SWA 之后穿插 1 层 Full Attention。SWA 层负责高效的局部特征提取，Full 层负责全局信息汇聚。</p>
          <p>这种设计的关键洞察：信息可以通过层间传播扩散。即使 SWA 窗口只有 4096 tokens，经过多层传播后，位置 0 的信息理论上可以到达位置 N——只是衰减了。</p>
          <p>Full Attention 层的作用就是"跳板"：确保长距离依赖不被彻底切断。</p>
        </div>
      </div>
    </div>
  );
}
