import { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================
// Simulated training curves with realistic patterns
// ============================================================

interface TrainingRun {
  id: string;
  name: string;
  description: string;
  steps: number[];
  loss: number[];
  lr: number[];
  gradNorm: number[];
  anomalies: { step: number; type: string; description: string }[];
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateTrainingRun(
  id: string,
  name: string,
  desc: string,
  config: {
    totalSteps: number;
    initLoss: number;
    finalLoss: number;
    lrMax: number;
    warmupRatio: number;
    seed: number;
    spikes?: { step: number; magnitude: number }[];
    plateau?: { start: number; end: number };
  },
): TrainingRun {
  const rng = seededRandom(config.seed);
  const steps: number[] = [];
  const loss: number[] = [];
  const lr: number[] = [];
  const gradNorm: number[] = [];
  const anomalies: { step: number; type: string; description: string }[] = [];

  const warmupSteps = config.totalSteps * config.warmupRatio;

  for (let i = 0; i <= config.totalSteps; i += Math.max(1, Math.floor(config.totalSteps / 500))) {
    steps.push(i);

    // Learning rate schedule (cosine with warmup)
    let currentLr: number;
    if (i < warmupSteps) {
      currentLr = config.lrMax * (i / warmupSteps);
    } else {
      const progress = (i - warmupSteps) / (config.totalSteps - warmupSteps);
      currentLr = config.lrMax * 0.5 * (1 + Math.cos(Math.PI * progress));
    }
    lr.push(currentLr);

    // Base loss curve (power law decay + noise)
    const progress = i / config.totalSteps;
    let baseLoss = config.initLoss * Math.pow(config.finalLoss / config.initLoss, Math.pow(progress, 0.7));

    // Add plateau effect
    if (config.plateau && i >= config.plateau.start && i <= config.plateau.end) {
      const plateauProgress = (i - config.plateau.start) / (config.plateau.end - config.plateau.start);
      baseLoss *= 1 + 0.03 * Math.sin(plateauProgress * Math.PI);
    }

    // Add noise
    baseLoss += (rng() - 0.5) * baseLoss * 0.04;

    // Add spikes
    if (config.spikes) {
      for (const spike of config.spikes) {
        const dist = Math.abs(i - spike.step);
        if (dist < config.totalSteps * 0.01) {
          const spikeVal = spike.magnitude * Math.exp(-dist / (config.totalSteps * 0.003));
          baseLoss += spikeVal;
          if (dist === 0) {
            anomalies.push({
              step: spike.step,
              type: 'spike',
              description: `Loss 突增 ${spike.magnitude.toFixed(2)}，可能是数据批次异常或梯度爆炸`,
            });
          }
        }
      }
    }

    loss.push(Math.max(baseLoss, config.finalLoss * 0.8));

    // Gradient norm
    let gn = 0.5 + (rng() - 0.5) * 0.3;
    if (config.spikes) {
      for (const spike of config.spikes) {
        if (Math.abs(i - spike.step) < config.totalSteps * 0.005) {
          gn += spike.magnitude * 2;
        }
      }
    }
    gradNorm.push(gn);
  }

  // Detect plateau anomaly
  if (config.plateau) {
    anomalies.push({
      step: Math.floor((config.plateau.start + config.plateau.end) / 2),
      type: 'plateau',
      description: `Loss 在 step ${config.plateau.start}-${config.plateau.end} 出现平台期，建议检查学习率或数据配比`,
    });
  }

  return { id, name, description: desc, steps, loss, lr, gradNorm, anomalies };
}

const RUNS: TrainingRun[] = [
  generateTrainingRun('normal', '正常训练', 'LLaMA-7B 风格的标准预训练曲线', {
    totalSteps: 100000,
    initLoss: 10.5,
    finalLoss: 2.1,
    lrMax: 3e-4,
    warmupRatio: 0.01,
    seed: 42,
  }),
  generateTrainingRun('spike', '含 Loss Spike', '训练中出现 loss spike 的异常曲线', {
    totalSteps: 100000,
    initLoss: 10.5,
    finalLoss: 2.15,
    lrMax: 3e-4,
    warmupRatio: 0.01,
    seed: 77,
    spikes: [
      { step: 25000, magnitude: 1.5 },
      { step: 60000, magnitude: 2.0 },
    ],
  }),
  generateTrainingRun('plateau', '含平台期', '训练中期出现 loss 平台的曲线', {
    totalSteps: 100000,
    initLoss: 10.5,
    finalLoss: 2.3,
    lrMax: 3e-4,
    warmupRatio: 0.01,
    seed: 123,
    plateau: { start: 40000, end: 60000 },
  }),
  generateTrainingRun('fast', '快速收敛', '高学习率 + 大 batch 的快速收敛曲线', {
    totalSteps: 50000,
    initLoss: 10.5,
    finalLoss: 2.0,
    lrMax: 1e-3,
    warmupRatio: 0.02,
    seed: 256,
  }),
];

// ============================================================
// Canvas chart drawing utilities
// ============================================================

type ChartType = 'loss' | 'lr' | 'gradNorm';

const CHART_CONFIGS: Record<ChartType, { label: string; color: string; yLabel: string }> = {
  loss: { label: 'Training Loss', color: '#3b82f6', yLabel: 'Loss' },
  lr: { label: 'Learning Rate', color: '#22c55e', yLabel: 'LR' },
  gradNorm: { label: 'Gradient Norm', color: '#f97316', yLabel: 'Grad Norm' },
};

// ============================================================
// Component
// ============================================================

export default function TrainingLossVisualizer() {
  const [selectedRuns, setSelectedRuns] = useState<Set<string>>(new Set(['normal']));
  const [chartType, setChartType] = useState<ChartType>('loss');
  const [logScale, setLogScale] = useState(false);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ step: number; value: number; run: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; step: number; value: number; run: string } | null>(null);

  const selectedRunData = RUNS.filter((r) => selectedRuns.has(r.id));

  const RUN_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];

  // Draw chart
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
    const padL = 70, padR = 30, padT = 30, padB = 50;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    if (selectedRunData.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('请选择至少一个训练曲线', W / 2, H / 2);
      return;
    }

    // Compute data ranges
    const dataKey = chartType === 'loss' ? 'loss' : chartType === 'lr' ? 'lr' : 'gradNorm';
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const run of selectedRunData) {
      for (let i = 0; i < run.steps.length; i++) {
        xMin = Math.min(xMin, run.steps[i]);
        xMax = Math.max(xMax, run.steps[i]);
        const val = logScale && run[dataKey][i] > 0 ? Math.log10(run[dataKey][i]) : run[dataKey][i];
        yMin = Math.min(yMin, val);
        yMax = Math.max(yMax, val);
      }
    }
    const yPad = (yMax - yMin) * 0.1;
    yMin -= yPad;
    yMax += yPad;

    const toX = (step: number) => padL + ((step - xMin) / (xMax - xMin || 1)) * plotW;
    const toY = (val: number) => {
      const v = logScale && val > 0 ? Math.log10(val) : val;
      return padT + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
    };

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridLines = 8;
    for (let i = 0; i <= gridLines; i++) {
      const y = padT + (i / gridLines) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();

      // Y labels
      const val = yMax - (i / gridLines) * (yMax - yMin);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'right';
      if (logScale) {
        ctx.fillText(Math.pow(10, val).toFixed(val < 0 ? 4 : 2), padL - 8, y + 4);
      } else {
        ctx.fillText(val < 0.001 ? val.toExponential(1) : val.toFixed(val < 1 ? 4 : 2), padL - 8, y + 4);
      }
    }

    // X labels
    for (let i = 0; i <= 5; i++) {
      const step = xMin + (i / 5) * (xMax - xMin);
      const x = toX(step);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(step >= 1000 ? `${(step / 1000).toFixed(0)}K` : step.toFixed(0), x, H - padB + 20);
    }

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Training Steps', W / 2, H - 8);

    ctx.save();
    ctx.translate(15, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(CHART_CONFIGS[chartType].yLabel + (logScale ? ' (log₁₀)' : ''), 0, 0);
    ctx.restore();

    // Plot lines
    selectedRunData.forEach((run, ri) => {
      const color = RUN_COLORS[ri % RUN_COLORS.length];
      const data = run[dataKey];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < run.steps.length; i++) {
        const x = toX(run.steps[i]);
        const y = toY(data[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Anomaly markers
      if (showAnomalies && chartType === 'loss') {
        for (const anomaly of run.anomalies) {
          const idx = run.steps.findIndex((s) => s >= anomaly.step);
          if (idx < 0) continue;
          const ax = toX(run.steps[idx]);
          const ay = toY(data[idx]);

          // Red circle
          ctx.fillStyle = '#ef444480';
          ctx.beginPath();
          ctx.arc(ax, ay, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ax, ay, 8, 0, Math.PI * 2);
          ctx.stroke();

          // Label
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(anomaly.type === 'spike' ? '!' : '▬', ax, ay + 3);
        }
      }
    });

    // Hovered point
    if (hoveredPoint) {
      const run = RUNS.find((r) => r.id === hoveredPoint.run);
      if (run) {
        const x = toX(hoveredPoint.step);
        const y = toY(hoveredPoint.value);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Legend
    ctx.font = '12px system-ui';
    let legendX = padL + 10;
    selectedRunData.forEach((run, ri) => {
      const color = RUN_COLORS[ri % RUN_COLORS.length];
      ctx.fillStyle = color;
      ctx.fillRect(legendX, padT + 5, 16, 3);
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'left';
      ctx.fillText(run.name, legendX + 22, padT + 12);
      legendX += ctx.measureText(run.name).width + 40;
    });
  }, [selectedRunData, chartType, logScale, showAnomalies, hoveredPoint]);

  // Mouse tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || selectedRunData.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const padL = 70, padR = 30, padT = 30, padB = 50;
      const plotW = rect.width - padL - padR;

      if (mx < padL || mx > rect.width - padR) {
        setHoveredPoint(null);
        setTooltip(null);
        return;
      }

      let xMin = Infinity, xMax = -Infinity;
      for (const run of selectedRunData) {
        xMin = Math.min(xMin, run.steps[0]);
        xMax = Math.max(xMax, run.steps[run.steps.length - 1]);
      }

      const step = xMin + ((mx - padL) / plotW) * (xMax - xMin);
      const dataKey = chartType === 'loss' ? 'loss' : chartType === 'lr' ? 'lr' : 'gradNorm';

      // Find closest point
      let bestRun = '';
      let bestStep = 0;
      let bestVal = 0;
      let bestDist = Infinity;

      for (const run of selectedRunData) {
        for (let i = 0; i < run.steps.length; i++) {
          const d = Math.abs(run.steps[i] - step);
          if (d < bestDist) {
            bestDist = d;
            bestRun = run.id;
            bestStep = run.steps[i];
            bestVal = run[dataKey][i];
          }
        }
      }

      if (bestDist < (xMax - xMin) * 0.02) {
        setHoveredPoint({ step: bestStep, value: bestVal, run: bestRun });
        setTooltip({
          x: mx,
          y: e.clientY - rect.top,
          step: bestStep,
          value: bestVal,
          run: RUNS.find((r) => r.id === bestRun)?.name || '',
        });
      } else {
        setHoveredPoint(null);
        setTooltip(null);
      }
    },
    [selectedRunData, chartType],
  );

  const toggleRun = (id: string) => {
    setSelectedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Compute summary stats
  const summaryStats = selectedRunData.map((run) => {
    const finalLoss = run.loss[run.loss.length - 1];
    const minLoss = Math.min(...run.loss);
    const maxLoss = Math.max(...run.loss);
    const totalSteps = run.steps[run.steps.length - 1];
    return { name: run.name, finalLoss, minLoss, maxLoss, totalSteps, anomalyCount: run.anomalies.length };
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Chart type */}
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
            {(['loss', 'lr', 'gradNorm'] as ChartType[]).map((t) => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  chartType === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {CHART_CONFIGS[t].label}
              </button>
            ))}
          </div>

          {/* Log scale */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={logScale}
              onChange={(e) => setLogScale(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">对数坐标</span>
          </label>

          {/* Show anomalies */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAnomalies}
              onChange={(e) => setShowAnomalies(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">标注异常</span>
          </label>
        </div>

        {/* Run selector */}
        <div className="flex flex-wrap gap-2">
          {RUNS.map((run, i) => (
            <button
              key={run.id}
              onClick={() => toggleRun(run.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                selectedRuns.has(run.id)
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              style={selectedRuns.has(run.id) ? { backgroundColor: RUN_COLORS[i % RUN_COLORS.length] } : {}}
            >
              {run.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: '450px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHoveredPoint(null);
            setTooltip(null);
          }}
        />
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl z-20"
            style={{ left: tooltip.x + 15, top: tooltip.y - 50 }}
          >
            <div className="text-white font-medium text-sm">{tooltip.run}</div>
            <div className="text-xs text-slate-400">Step: {tooltip.step.toLocaleString()}</div>
            <div className="text-xs text-blue-400">{CHART_CONFIGS[chartType].yLabel}: {tooltip.value < 0.001 ? tooltip.value.toExponential(3) : tooltip.value.toFixed(4)}</div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {summaryStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat, i) => (
            <div
              key={stat.name}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RUN_COLORS[i % RUN_COLORS.length] }} />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{stat.name}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">最终 Loss</span>
                  <span className="font-mono text-slate-900 dark:text-white">{stat.finalLoss.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">最低 Loss</span>
                  <span className="font-mono text-slate-900 dark:text-white">{stat.minLoss.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">总步数</span>
                  <span className="font-mono text-slate-900 dark:text-white">{(stat.totalSteps / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">异常事件</span>
                  <span className={`font-mono ${stat.anomalyCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {stat.anomalyCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Anomaly log */}
      {showAnomalies && selectedRunData.some((r) => r.anomalies.length > 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">异常事件日志</h3>
          <div className="space-y-2">
            {selectedRunData.flatMap((run) =>
              run.anomalies.map((a, i) => (
                <div key={`${run.id}-${i}`} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      [{run.name}] Step {a.step.toLocaleString()} — {a.type === 'spike' ? 'Loss Spike' : 'Plateau'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.description}</div>
                  </div>
                </div>
              )),
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-green-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">关于训练 Loss 曲线</h3>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p>
            <strong>Training Loss</strong> 是监控 LLM 预训练最重要的指标。
            正常的 loss 曲线应该呈现平滑的下降趋势 (近似幂律衰减)。
          </p>
          <p>
            <strong>Loss Spike</strong> (损失突增) 通常由数据批次异常、梯度爆炸或学习率过大导致。
            轻微的 spike 通常会自动恢复，严重的可能需要从 checkpoint 回滚。
          </p>
          <p>
            <strong>Loss Plateau</strong> (平台期) 表示模型暂时停止学习，可能的原因包括：
            学习率过低、数据配比不合理、或模型容量已接近上限。
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            💡 本工具展示的是模拟的训练曲线。实际训练中可以通过 WandB/TensorBoard 等工具实时监控。
          </p>
        </div>
      </div>
    </div>
  );
}
