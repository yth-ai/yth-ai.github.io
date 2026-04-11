import { useState, useMemo, useRef, useEffect, useCallback } from 'react';

// ============================================================
// Scaling Laws 游乐场 2.0 — 训练 + 推理双范式
// ============================================================

// === 暗色模式色彩系统 ===
interface ThemeColors {
  bg: string;
  grid: string;
  text: string;
  border: string;
  axisLabel: string;
  userPoint: string;
}

function getThemeColors(): ThemeColors {
  const isDark = typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  return isDark ? {
    bg: '#0f172a',
    grid: '#334155',
    text: '#94a3b8',
    border: '#475569',
    axisLabel: '#cbd5e1',
    userPoint: '#fb7185',
  } : {
    bg: '#f8fafc',
    grid: '#e2e8f0',
    text: '#94a3b8',
    border: '#cbd5e1',
    axisLabel: '#64748b',
    userPoint: '#f43f5e',
  };
}

// === Scaling Law 配置 ===
interface ScalingConfig {
  label: string;
  description: string;
  E: number;
  A: number;
  alpha: number;
  B: number;
  beta: number;
  color: string;
  colorHex: string;
}

const SCALING_LAWS: Record<string, ScalingConfig> = {
  kaplan: {
    label: 'Kaplan (2020)',
    description: '最早的 Scaling Laws 论文，建议将更多算力分配给模型大小',
    E: 1.69, A: 406.4, alpha: 0.34, B: 410.7, beta: 0.283,
    color: 'blue', colorHex: '#3b82f6',
  },
  chinchilla: {
    label: 'Chinchilla (2022)',
    description: 'DeepMind 修正版，建议 N 和 D 等比增长：D ≈ 20N',
    E: 1.69, A: 406.4, alpha: 0.34, B: 410.7, beta: 0.28,
    color: 'emerald', colorHex: '#10b981',
  },
};

// === 模型数据（2026年最新） ===
interface RealModelPoint {
  name: string;
  params: number;         // total params in billions
  activeParams?: number;  // for MoE: active params in billions
  tokens: number;         // in billions
  loss: number | null;
  color: string;
  description: string;
  isMoE?: boolean;
  isEstimated?: boolean;  // whether loss is estimated
}

const REAL_MODELS: RealModelPoint[] = [
  { name: 'GPT-3', params: 175, tokens: 300, loss: 2.0, color: '#10b981', description: '175B, 300B tokens', isEstimated: false },
  { name: 'Chinchilla', params: 70, tokens: 1400, loss: 1.94, color: '#f59e0b', description: '70B, 1.4T tokens (compute-optimal)', isEstimated: false },
  { name: 'LLaMA 2 7B', params: 7, tokens: 2000, loss: null, color: '#6366f1', description: '7B, 2T tokens', isEstimated: true },
  { name: 'LLaMA 2 70B', params: 70, tokens: 2000, loss: null, color: '#8b5cf6', description: '70B, 2T tokens', isEstimated: true },
  { name: 'LLaMA 3 8B', params: 8, tokens: 15000, loss: null, color: '#3b82f6', description: '8B, 15T tokens (50x over-train)', isEstimated: true },
  { name: 'LLaMA 3 70B', params: 70, tokens: 15000, loss: null, color: '#2563eb', description: '70B, 15T tokens', isEstimated: true },
  { name: 'LLaMA 3 405B', params: 405, tokens: 15000, loss: null, color: '#0ea5e9', description: '405B, 15T tokens', isEstimated: true },
  { name: 'Llama 4 Scout', params: 109, activeParams: 17, tokens: 40000, loss: null, color: '#06b6d4', description: '109B MoE (17B active), ~40T tokens', isMoE: true, isEstimated: true },
  { name: 'Llama 4 Maverick', params: 400, activeParams: 17, tokens: 22000, loss: null, color: '#0891b2', description: '400B MoE (17B active), ~22T tokens', isMoE: true, isEstimated: true },
  { name: 'DeepSeek V3', params: 671, activeParams: 37, tokens: 14800, loss: null, color: '#ec4899', description: '671B MoE (37B active), 14.8T tokens', isMoE: true, isEstimated: true },
  { name: 'DeepSeek R1', params: 671, activeParams: 37, tokens: 14800, loss: null, color: '#f472b6', description: '671B MoE (37B active), 推理模型', isMoE: true, isEstimated: true },
  { name: 'Qwen 2.5 72B', params: 72, tokens: 18000, loss: null, color: '#f97316', description: '72B, 18T tokens', isEstimated: true },
  { name: 'Gemini 2.5 Pro', params: 540, activeParams: 60, tokens: 12000, loss: null, color: '#14b8a6', description: '~540B MoE (~60B active), ~12T tokens', isMoE: true, isEstimated: true },
  { name: 'Mistral Large', params: 123, tokens: 12000, loss: null, color: '#a855f7', description: '123B, ~12T tokens', isEstimated: true },
];

// === 预设场景 ===
interface PresetScenario {
  label: string;
  params: number;
  tokens: number;
  description: string;
  emoji: string;
}

const PRESETS: PresetScenario[] = [
  { label: 'GPT-3', params: 175, tokens: 300, description: '175B, 300B tokens (2020)', emoji: '🔵' },
  { label: 'Chinchilla', params: 70, tokens: 1400, description: '70B, 1.4T tokens (2022)', emoji: '🟢' },
  { label: 'LLaMA 2 7B', params: 7, tokens: 2000, description: '7B, 2T tokens (2023)', emoji: '🟣' },
  { label: 'LLaMA 3 8B', params: 8, tokens: 15000, description: '8B, 15T tokens (2024)', emoji: '🔷' },
  { label: 'DeepSeek V3', params: 671, tokens: 14800, description: '671B MoE, 14.8T tokens (2024)', emoji: '💎' },
  { label: 'GPT-4 级别', params: 540, tokens: 12000, description: '~540B MoE, ~12T tokens', emoji: '🌟' },
];

// === 推理 Scaling Laws 数据 ===
interface InferenceStrategy {
  name: string;
  color: string;
  colorHex: string;
  description: string;
  // accuracy = maxAcc - A * exp(-rate * log_compute)
  // simplified: accuracy = maxAcc * (1 - exp(-rate * (compute / baseline)))
  maxAcc: number;
  rate: number;
  baselineCost: number; // relative thinking tokens
}

const INFERENCE_STRATEGIES: InferenceStrategy[] = [
  {
    name: 'Greedy (直接回答)',
    color: 'slate', colorHex: '#64748b',
    description: '不做额外推理，直接输出答案',
    maxAcc: 0.55, rate: 2.0, baselineCost: 1,
  },
  {
    name: 'Best-of-N (采样N次)',
    color: 'blue', colorHex: '#3b82f6',
    description: '采样 N 次取最优结果',
    maxAcc: 0.72, rate: 0.8, baselineCost: 5,
  },
  {
    name: 'Chain-of-Thought',
    color: 'emerald', colorHex: '#10b981',
    description: '逐步推理，展开思维链',
    maxAcc: 0.85, rate: 1.2, baselineCost: 10,
  },
  {
    name: 'Tree Search (搜索树)',
    color: 'violet', colorHex: '#8b5cf6',
    description: '构建推理搜索树，剪枝+回溯',
    maxAcc: 0.95, rate: 0.5, baselineCost: 50,
  },
];

// 推理模型预设对比
interface InferenceModelPreset {
  name: string;
  strategy: string;
  thinkingTokens: number;
  accuracy: number;
  costPer1K: number; // $ per 1K output tokens
  color: string;
}

const INFERENCE_MODEL_PRESETS: InferenceModelPreset[] = [
  { name: 'GPT-4o', strategy: 'Greedy', thinkingTokens: 0, accuracy: 0.52, costPer1K: 0.01, color: '#10b981' },
  { name: 'Claude 3.5', strategy: 'Greedy', thinkingTokens: 0, accuracy: 0.58, costPer1K: 0.015, color: '#d97706' },
  { name: 'o1-mini', strategy: 'CoT', thinkingTokens: 3000, accuracy: 0.80, costPer1K: 0.012, color: '#3b82f6' },
  { name: 'o3', strategy: 'Tree Search', thinkingTokens: 15000, accuracy: 0.90, costPer1K: 0.06, color: '#6366f1' },
  { name: 'DeepSeek R1', strategy: 'CoT', thinkingTokens: 8000, accuracy: 0.86, costPer1K: 0.004, color: '#ec4899' },
  { name: 'Gemini 2.5 Pro', strategy: 'CoT', thinkingTokens: 12000, accuracy: 0.88, costPer1K: 0.02, color: '#14b8a6' },
];

// === 工具函数 ===
function computeLoss(config: ScalingConfig, paramsB: number, tokensB: number): number {
  const N = paramsB * 1e9;
  const D = tokensB * 1e9;
  return config.E + config.A / Math.pow(N, config.alpha) + config.B / Math.pow(D, config.beta);
}

function chinchillaOptimal(computeFLOPs: number): { paramsB: number; tokensB: number } {
  const N = Math.sqrt(computeFLOPs / 120);
  const D = 20 * N;
  return { paramsB: N / 1e9, tokensB: D / 1e9 };
}

function formatNum(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  if (n >= 1) return n.toFixed(1);
  return n.toFixed(3);
}

function formatBigNum(n: number): string {
  if (n >= 1e15) return (n / 1e15).toFixed(1) + 'P';
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return n.toFixed(0);
}

function formatDollars(n: number): string {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}

function formatTime(hours: number): string {
  if (hours >= 8760) return (hours / 8760).toFixed(1) + ' 年';
  if (hours >= 720) return (hours / 720).toFixed(1) + ' 月';
  if (hours >= 24) return (hours / 24).toFixed(0) + ' 天';
  return hours.toFixed(0) + ' 小时';
}

// === 暗色模式 hook ===
function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

// ============ Training Scaling Chart (Canvas) ============

function TrainingChart({
  paramsBudget, tokensBudget, computeBudget,
  showKaplan, showChinchilla, showModels, mode,
  width = 640, height = 400, isDark,
}: {
  paramsBudget: number; tokensBudget: number; computeBudget: number;
  showKaplan: boolean; showChinchilla: boolean; showModels: boolean;
  mode: 'params' | 'tokens' | 'compute';
  width?: number; height?: number; isDark: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; model: RealModelPoint } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getThemeColors();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 20, right: 30, bottom: 50, left: 60 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    let xMin: number, xMax: number, xLabel: string;
    if (mode === 'params') {
      xMin = 0.1; xMax = 1000; xLabel = '模型参数量 (B)';
    } else if (mode === 'tokens') {
      xMin = 10; xMax = 50000; xLabel = '训练 Token 数 (B)';
    } else {
      xMin = 1e19; xMax = 1e26; xLabel = '算力预算 (FLOPs)';
    }

    const yMin = 1.7, yMax = 4.0;
    const logX = (v: number) => Math.log10(v);
    const logY = (v: number) => Math.log10(v);
    const toScreenX = (v: number) => pad.left + ((logX(v) - logX(xMin)) / (logX(xMax) - logX(xMin))) * plotW;
    const toScreenY = (v: number) => pad.top + plotH - ((logY(v) - logY(yMin)) / (logY(yMax) - logY(yMin))) * plotH;

    // Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(pad.left, pad.top, plotW, plotH);

    // Grid lines
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;

    const yTicks = [1.8, 2.0, 2.2, 2.5, 3.0, 3.5];
    yTicks.forEach(y => {
      if (y < yMin || y > yMax) return;
      const sy = toScreenY(y);
      ctx.beginPath(); ctx.moveTo(pad.left, sy); ctx.lineTo(pad.left + plotW, sy); ctx.stroke();
      ctx.fillStyle = colors.text;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(y.toFixed(1), pad.left - 8, sy);
    });

    let xTicks: number[];
    if (mode === 'params') xTicks = [0.1, 1, 7, 13, 70, 175, 405, 671];
    else if (mode === 'tokens') xTicks = [10, 100, 300, 1000, 2000, 5000, 15000, 40000];
    else xTicks = [1e19, 1e20, 1e21, 1e22, 1e23, 1e24, 1e25];

    xTicks.forEach(x => {
      if (x < xMin || x > xMax) return;
      const sx = toScreenX(x);
      ctx.beginPath(); ctx.moveTo(sx, pad.top); ctx.lineTo(sx, pad.top + plotH); ctx.stroke();
      ctx.fillStyle = colors.text;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(mode === 'compute' ? formatBigNum(x) : formatNum(x), sx, pad.top + plotH + 6);
    });

    // Axis labels
    ctx.fillStyle = colors.axisLabel;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, pad.left + plotW / 2, height - 8);
    ctx.save();
    ctx.translate(14, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Loss (cross-entropy)', 0, 0);
    ctx.restore();

    // Draw scaling curves
    const drawCurve = (lawKey: string) => {
      const law = SCALING_LAWS[lawKey];
      if (!law) return;
      ctx.beginPath();
      ctx.strokeStyle = law.colorHex;
      ctx.lineWidth = 2.5;

      const steps = 200;
      let first = true;
      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        let x: number, loss: number;
        if (mode === 'params') {
          x = Math.pow(10, logX(xMin) + t * (logX(xMax) - logX(xMin)));
          const tokens = lawKey === 'chinchilla' ? x * 20 : tokensBudget;
          loss = computeLoss(law, x, tokens);
        } else if (mode === 'tokens') {
          x = Math.pow(10, logX(xMin) + t * (logX(xMax) - logX(xMin)));
          loss = computeLoss(law, paramsBudget, x);
        } else {
          x = Math.pow(10, logX(xMin) + t * (logX(xMax) - logX(xMin)));
          const opt = chinchillaOptimal(x);
          loss = computeLoss(law, opt.paramsB, opt.tokensB);
        }
        if (loss < yMin || loss > yMax) { first = true; continue; }
        const sx = toScreenX(x);
        const sy = toScreenY(loss);
        if (first) { ctx.moveTo(sx, sy); first = false; } else { ctx.lineTo(sx, sy); }
      }
      ctx.stroke();
    };

    if (showKaplan) drawCurve('kaplan');
    if (showChinchilla) drawCurve('chinchilla');

    // Draw real model points
    if (showModels) {
      REAL_MODELS.forEach(model => {
        let x: number;
        const effectiveParams = model.isMoE && model.activeParams ? model.activeParams : model.params;
        if (mode === 'params') x = model.params;
        else if (mode === 'tokens') x = model.tokens;
        else x = 6 * effectiveParams * 1e9 * model.tokens * 1e9;

        if (x < xMin || x > xMax) return;
        const loss = model.loss || computeLoss(SCALING_LAWS.chinchilla, effectiveParams, model.tokens);
        if (loss < yMin || loss > yMax) return;

        const sx = toScreenX(x);
        const sy = toScreenY(loss);

        // MoE models: draw outer ring for total params
        if (model.isMoE && mode === 'params' && model.activeParams) {
          const activeX = toScreenX(model.activeParams);
          // dashed line connecting total → active
          ctx.save();
          ctx.setLineDash([2, 2]);
          ctx.strokeStyle = model.color + '60';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(activeX, sy); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          // Active params dot
          const activeLoss = computeLoss(SCALING_LAWS.chinchilla, model.activeParams, model.tokens);
          const asy = toScreenY(activeLoss);
          ctx.beginPath();
          ctx.arc(activeX, asy, 4, 0, Math.PI * 2);
          ctx.fillStyle = model.color;
          ctx.fill();
          ctx.strokeStyle = isDark ? '#1e293b' : '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Main point - hollow circle for estimated, filled for reported
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        if (model.isEstimated || model.loss === null) {
          ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
          ctx.fill();
          ctx.strokeStyle = model.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = model.color;
          ctx.fill();
          ctx.strokeStyle = isDark ? '#1e293b' : '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = model.color;
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(model.name, sx + 8, sy - 2);
      });
    }

    // Draw user's current point
    {
      let x: number;
      if (mode === 'params') x = paramsBudget;
      else if (mode === 'tokens') x = tokensBudget;
      else x = computeBudget;

      if (x >= xMin && x <= xMax) {
        const loss = computeLoss(SCALING_LAWS.chinchilla, paramsBudget, tokensBudget);
        if (loss >= yMin && loss <= yMax) {
          const sx = toScreenX(x);
          const sy = toScreenY(loss);

          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = colors.userPoint;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx, pad.top); ctx.lineTo(sx, pad.top + plotH); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pad.left, sy); ctx.lineTo(pad.left + plotW, sy); ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.arc(sx, sy, 8, 0, Math.PI * 2);
          ctx.fillStyle = colors.userPoint;
          ctx.fill();
          ctx.strokeStyle = isDark ? '#1e293b' : '#fff';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = colors.userPoint;
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
          ctx.fillText(`你的模型 (Loss: ${loss.toFixed(3)})`, sx + 12, sy - 4);
        }
      }
    }

    // Border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.left, pad.top, plotW, plotH);
  }, [paramsBudget, tokensBudget, computeBudget, showKaplan, showChinchilla, showModels, mode, width, height, isDark]);

  useEffect(() => { draw(); }, [draw]);

  // Hover detection
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const pad = { top: 20, right: 30, bottom: 50, left: 60 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    let xMin: number, xMax: number;
    if (mode === 'params') { xMin = 0.1; xMax = 1000; }
    else if (mode === 'tokens') { xMin = 10; xMax = 50000; }
    else { xMin = 1e19; xMax = 1e26; }

    const yMin = 1.7, yMax = 4.0;
    const logX = (v: number) => Math.log10(v);
    const logY = (v: number) => Math.log10(v);
    const toScreenX = (v: number) => pad.left + ((logX(v) - logX(xMin)) / (logX(xMax) - logX(xMin))) * plotW;
    const toScreenY = (v: number) => pad.top + plotH - ((logY(v) - logY(yMin)) / (logY(yMax) - logY(yMin))) * plotH;

    let closest: { dist: number; model: RealModelPoint; sx: number; sy: number } | null = null;

    REAL_MODELS.forEach(model => {
      const effectiveParams = model.isMoE && model.activeParams ? model.activeParams : model.params;
      let x: number;
      if (mode === 'params') x = model.params;
      else if (mode === 'tokens') x = model.tokens;
      else x = 6 * effectiveParams * 1e9 * model.tokens * 1e9;

      if (x < xMin || x > xMax) return;
      const loss = model.loss || computeLoss(SCALING_LAWS.chinchilla, effectiveParams, model.tokens);
      if (loss < yMin || loss > yMax) return;

      const sx = toScreenX(x);
      const sy = toScreenY(loss);
      const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);

      if (dist < 20 && (!closest || dist < closest.dist)) {
        closest = { dist, model, sx, sy };
      }
    });

    if (closest) {
      setTooltip({ x: (closest as any).sx, y: (closest as any).sy, model: (closest as any).model });
    } else {
      setTooltip(null);
    }
  }, [mode, width, height]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="w-full rounded-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none px-3 py-2 rounded-lg shadow-lg text-xs max-w-[220px]
                     bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600"
          style={{ left: tooltip.x + 15, top: tooltip.y - 60 }}
        >
          <div className="font-bold text-slate-900 dark:text-white">{tooltip.model.name}</div>
          <div className="text-slate-500 dark:text-slate-400 mt-0.5">{tooltip.model.description}</div>
          {tooltip.model.isMoE && (
            <div className="text-violet-600 dark:text-violet-400 mt-0.5">MoE 架构</div>
          )}
          {(tooltip.model.isEstimated || tooltip.model.loss === null) && (
            <div className="text-amber-600 dark:text-amber-400 mt-0.5 text-[10px]">⚠ Loss 为估算值</div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Inference Scaling Chart (Canvas) ============

function InferenceChart({
  width = 640, height = 400, isDark,
  selectedStrategies,
}: {
  width?: number; height?: number; isDark: boolean;
  selectedStrategies: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getThemeColors();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 20, right: 30, bottom: 50, left: 60 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    // X: thinking tokens (1 to 100000), log scale
    const xMin = 1, xMax = 100000;
    // Y: accuracy (0 to 1), linear scale
    const yMin = 0, yMax = 1.0;

    const logX = (v: number) => Math.log10(v);
    const toScreenX = (v: number) => pad.left + ((logX(v) - logX(xMin)) / (logX(xMax) - logX(xMin))) * plotW;
    const toScreenY = (v: number) => pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

    // Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(pad.left, pad.top, plotW, plotH);

    // Grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;

    const yTicks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    yTicks.forEach(y => {
      const sy = toScreenY(y);
      ctx.beginPath(); ctx.moveTo(pad.left, sy); ctx.lineTo(pad.left + plotW, sy); ctx.stroke();
      ctx.fillStyle = colors.text;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText((y * 100).toFixed(0) + '%', pad.left - 8, sy);
    });

    const xTicks = [1, 10, 100, 1000, 10000, 100000];
    xTicks.forEach(x => {
      if (x < xMin || x > xMax) return;
      const sx = toScreenX(x);
      ctx.beginPath(); ctx.moveTo(sx, pad.top); ctx.lineTo(sx, pad.top + plotH); ctx.stroke();
      ctx.fillStyle = colors.text;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(formatNum(x), sx, pad.top + plotH + 6);
    });

    // Axis labels
    ctx.fillStyle = colors.axisLabel;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('推理 Token 数 (thinking tokens)', pad.left + plotW / 2, height - 8);
    ctx.save();
    ctx.translate(14, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('准确率 (MATH 基准)', 0, 0);
    ctx.restore();

    // Draw strategy curves
    INFERENCE_STRATEGIES.forEach((strategy, idx) => {
      if (!selectedStrategies.includes(strategy.name)) return;

      ctx.beginPath();
      ctx.strokeStyle = strategy.colorHex;
      ctx.lineWidth = 2.5;

      const steps = 200;
      let first = true;

      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        const x = Math.pow(10, logX(xMin) + t * (logX(xMax) - logX(xMin)));
        // Accuracy model: maxAcc * (1 - exp(-rate * x / baselineCost))
        const acc = strategy.maxAcc * (1 - Math.exp(-strategy.rate * x / (strategy.baselineCost * 100)));
        const clampedAcc = Math.min(Math.max(acc, yMin), yMax);

        const sx = toScreenX(x);
        const sy = toScreenY(clampedAcc);

        if (first) { ctx.moveTo(sx, sy); first = false; }
        else { ctx.lineTo(sx, sy); }
      }
      ctx.stroke();

      // Label at end of curve
      const endAcc = strategy.maxAcc * (1 - Math.exp(-strategy.rate * xMax / (strategy.baselineCost * 100)));
      const clampedEnd = Math.min(Math.max(endAcc, yMin), yMax);
      ctx.fillStyle = strategy.colorHex;
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(strategy.name.split('(')[0].trim(), toScreenX(xMax) - 5, toScreenY(clampedEnd));
    });

    // Plot inference model presets
    INFERENCE_MODEL_PRESETS.forEach(model => {
      const x = Math.max(1, model.thinkingTokens || 1);
      if (x < xMin || x > xMax) return;

      const sx = toScreenX(x);
      const sy = toScreenY(model.accuracy);

      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fillStyle = model.color;
      ctx.fill();
      ctx.strokeStyle = isDark ? '#1e293b' : '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = model.color;
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(model.name, sx + 10, sy - 3);
    });

    // "Crossover" annotation - where small+think beats big+greedy
    const crossoverX = 2000;
    const crossoverY = 0.65;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isDark ? '#f59e0b80' : '#f59e0b80';
    ctx.lineWidth = 1;
    const csx = toScreenX(crossoverX);
    const csy = toScreenY(crossoverY);
    ctx.beginPath(); ctx.moveTo(csx, pad.top); ctx.lineTo(csx, pad.top + plotH); ctx.stroke();
    ctx.setLineDash([]);

    // Annotation
    ctx.fillStyle = isDark ? '#fbbf24' : '#d97706';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('← 小模型+思考 > 大模型+直答 →', csx, pad.top + 15);
    ctx.restore();

    // Border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.left, pad.top, plotW, plotH);

  }, [width, height, isDark, selectedStrategies]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="w-full rounded-lg"
    />
  );
}

// ============ Cost Calculator Panel ============

function CostCalculator({ paramsBudget, tokensBudget }: { paramsBudget: number; tokensBudget: number }) {
  const computeFLOPs = 6 * paramsBudget * 1e9 * tokensBudget * 1e9;

  // H100: ~1979 TFLOPS FP16, cloud price ~$2-3/h
  const GPU_TFLOPS = 1979e12; // FLOPs per second
  const GPU_PRICE_PER_HOUR = 2.5; // USD
  const MFU = 0.45; // Model FLOPs Utilization

  const effectiveFlopsPerGpu = GPU_TFLOPS * MFU;
  const totalGpuSeconds = computeFLOPs / effectiveFlopsPerGpu;
  const totalGpuHours = totalGpuSeconds / 3600;

  // Assume 1024 GPUs for training
  const numGPUs = 1024;
  const wallclockHours = totalGpuHours / numGPUs;
  const totalCost = totalGpuHours * GPU_PRICE_PER_HOUR;

  // Fun comparisons
  const teslaModelY = 35000; // USD
  const teslas = totalCost / teslaModelY;
  const avgYearlySalary = 150000; // senior engineer
  const salaryYears = totalCost / avgYearlySalary;

  // Inference cost per 1M tokens
  // Rough: per token inference ≈ 2 * params FLOPs, on H100 at $2.5/h
  const flopsPerToken = 2 * paramsBudget * 1e9;
  const tokensPerSecond = effectiveFlopsPerGpu / flopsPerToken;
  const costPerMToken = (1e6 / tokensPerSecond) / 3600 * GPU_PRICE_PER_HOUR;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
      <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
        <span className="text-base">💰</span> 成本估算
        <span className="text-[10px] font-normal text-amber-500 dark:text-amber-500">（基于 H100 云端价格）</span>
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-0.5">
          <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70">训练成本</div>
          <div className="text-lg font-bold font-mono text-amber-800 dark:text-amber-200">
            {formatDollars(totalCost)}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70">1024×H100 训练时间</div>
          <div className="text-lg font-bold font-mono text-amber-800 dark:text-amber-200">
            {formatTime(wallclockHours)}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70">GPU 总时</div>
          <div className="text-lg font-bold font-mono text-amber-800 dark:text-amber-200">
            {formatBigNum(totalGpuHours)} h
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70">推理价格</div>
          <div className="text-lg font-bold font-mono text-amber-800 dark:text-amber-200">
            ${costPerMToken.toFixed(2)}<span className="text-xs font-normal">/1M</span>
          </div>
        </div>
      </div>

      {totalCost > 10000 && (
        <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-700/50 text-[11px] text-amber-600 dark:text-amber-400">
          <span className="font-medium">换算</span>：
          {teslas >= 1 && <span>≈ {teslas.toFixed(0)} 辆特斯拉 Model Y</span>}
          {teslas >= 1 && salaryYears >= 1 && <span> · </span>}
          {salaryYears >= 1 && <span>≈ {salaryYears.toFixed(1)} 年高级工程师薪资</span>}
        </div>
      )}
    </div>
  );
}

// ============ Main Component ============

type TabMode = 'training' | 'inference';

export default function ScalingLawsPlayground() {
  const [tab, setTab] = useState<TabMode>('training');
  const [paramsBudget, setParamsBudget] = useState(70);
  const [tokensBudget, setTokensBudget] = useState(2000);
  const [showKaplan, setShowKaplan] = useState(true);
  const [showChinchilla, setShowChinchilla] = useState(true);
  const [showModels, setShowModels] = useState(true);
  const [mode, setMode] = useState<'params' | 'tokens' | 'compute'>('params');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(
    INFERENCE_STRATEGIES.map(s => s.name)
  );

  const isDark = useDarkMode();

  const computeBudget = 6 * paramsBudget * 1e9 * tokensBudget * 1e9;
  const chinchilla = chinchillaOptimal(computeBudget);

  const currentLoss = useMemo(() =>
    computeLoss(SCALING_LAWS.chinchilla, paramsBudget, tokensBudget),
  [paramsBudget, tokensBudget]);

  const chinchillaLoss = useMemo(() =>
    computeLoss(SCALING_LAWS.chinchilla, chinchilla.paramsB, chinchilla.tokensB),
  [chinchilla]);

  const overTrainRatio = tokensBudget / (paramsBudget * 20);

  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(640);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setChartWidth(Math.min(containerRef.current.offsetWidth, 800));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const applyPreset = (preset: PresetScenario) => {
    setParamsBudget(preset.params);
    setTokensBudget(preset.tokens);
  };

  const toggleStrategy = (name: string) => {
    setSelectedStrategies(prev =>
      prev.includes(name)
        ? prev.filter(s => s !== name)
        : [...prev, name]
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative">
          <div className="text-3xl mb-2">📐</div>
          <h2 className="text-xl font-bold mb-2">Scaling Laws 游乐场</h2>
          <p className="text-white/80 text-sm max-w-xl">
            从训练 Scaling Laws 到推理时计算——双范式时代的算力分配探索。
            拖动滑块，感受幂律曲线的魔力；切换到推理标签页，看看"让模型多想一会"能带来多大提升。
          </p>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 w-fit">
        <button
          onClick={() => setTab('training')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'training'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          🏋️ 训练 Scaling
        </button>
        <button
          onClick={() => setTab('inference')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'inference'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          🧠 推理 Scaling
        </button>
      </div>

      {/* ==================== TRAINING TAB ==================== */}
      {tab === 'training' && (
        <>
          {/* Preset Scenarios */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 self-center mr-1">快速跳转：</span>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                title={p.description}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                  ${paramsBudget === p.params && tokensBudget === p.tokens
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Params slider */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                模型参数量
              </label>
              <div className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mb-2">
                {paramsBudget >= 1000 ? (paramsBudget / 1000).toFixed(1) + 'T' : paramsBudget + 'B'}
              </div>
              <input
                type="range"
                min={0.5} max={1000} step={0.5}
                value={paramsBudget}
                onChange={(e) => setParamsBudget(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #6366f1 ${(Math.log10(paramsBudget) - Math.log10(0.5)) / (Math.log10(1000) - Math.log10(0.5)) * 100}%, ${isDark ? '#334155' : '#e2e8f0'} 0%)`,
                }}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0.5B</span><span>1000B</span>
              </div>
            </div>

            {/* Tokens slider */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                训练 Token 数
              </label>
              <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mb-2">
                {tokensBudget >= 1000 ? (tokensBudget / 1000).toFixed(1) + 'T' : tokensBudget + 'B'}
              </div>
              <input
                type="range"
                min={10} max={50000} step={10}
                value={tokensBudget}
                onChange={(e) => setTokensBudget(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 ${(tokensBudget - 10) / (50000 - 10) * 100}%, ${isDark ? '#334155' : '#e2e8f0'} 0%)`,
                }}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>10B</span><span>50T</span>
              </div>
            </div>

            {/* Derived metrics */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">总算力</div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {formatBigNum(computeBudget)} FLOPs
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">预估 Loss</div>
                <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                  {currentLoss.toFixed(3)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Over-training 倍率</div>
                <div className={`text-lg font-bold font-mono ${overTrainRatio > 5 ? 'text-amber-600 dark:text-amber-400' : overTrainRatio > 1.2 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {overTrainRatio.toFixed(1)}x
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    {overTrainRatio <= 1.2 ? '(Chinchilla 最优)' : overTrainRatio <= 5 ? '(适度 over-train)' : '(激进 over-train)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Calculator */}
          <CostCalculator paramsBudget={paramsBudget} tokensBudget={tokensBudget} />

          {/* Chinchilla Optimal Analysis */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
              Chinchilla 最优分配建议
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-emerald-600 dark:text-emerald-400">同等算力下最优参数量：</span>
                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-200 ml-1">
                  {formatBigNum(chinchilla.paramsB * 1e9)}
                </span>
              </div>
              <div>
                <span className="text-emerald-600 dark:text-emerald-400">最优训练 Token 数：</span>
                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-200 ml-1">
                  {formatBigNum(chinchilla.tokensB * 1e9)}
                </span>
              </div>
              <div>
                <span className="text-emerald-600 dark:text-emerald-400">最优 Loss：</span>
                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-200 ml-1">
                  {chinchillaLoss.toFixed(3)}
                  {currentLoss > chinchillaLoss * 1.01 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                      (你的配置高 {((currentLoss - chinchillaLoss) / chinchillaLoss * 100).toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div ref={containerRef} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">X 轴:</span>
                {[
                  { key: 'params' as const, label: '参数量' },
                  { key: 'tokens' as const, label: 'Token 数' },
                  { key: 'compute' as const, label: '算力' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      mode === key
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={showKaplan} onChange={(e) => setShowKaplan(e.target.checked)} className="rounded text-blue-500" />
                  <span className="w-3 h-0.5 bg-blue-500 rounded" /> Kaplan
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={showChinchilla} onChange={(e) => setShowChinchilla(e.target.checked)} className="rounded text-emerald-500" />
                  <span className="w-3 h-0.5 bg-emerald-500 rounded" /> Chinchilla
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={showModels} onChange={(e) => setShowModels(e.target.checked)} className="rounded text-rose-500" />
                  真实模型
                </label>
              </div>
            </div>

            <TrainingChart
              paramsBudget={paramsBudget} tokensBudget={tokensBudget} computeBudget={computeBudget}
              showKaplan={showKaplan} showChinchilla={showChinchilla} showModels={showModels}
              mode={mode} width={chartWidth} height={400} isDark={isDark}
            />

            <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-slate-500" />
                空心 = 估算 Loss
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                实心 = 已报告 Loss
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-6 h-0 border-t-2 border-dashed border-slate-400" />
                MoE: 总参数 → 活跃参数
              </span>
            </div>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">📜 Kaplan vs Chinchilla 之争</h4>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                2020 年 OpenAI 的 Kaplan 论文认为应该优先增大模型、少用数据。
                2022 年 DeepMind 的 Chinchilla 论文推翻了这个结论：模型大小和数据量应该<strong>等比增长</strong>。
                这直接催生了 LLaMA——一个"小但训练充分"的模型家族。
              </p>
            </div>
            <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
              <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">🚀 Over-training 策略</h4>
              <p className="text-xs text-violet-600 dark:text-violet-400">
                LLaMA 3 用了 50 倍于 Chinchilla 最优的数据量来训练 8B 模型。
                这牺牲了训练效率，但得到了一个<strong>推理更便宜</strong>的小模型。
                当部署成本远大于训练成本时，over-training 反而是最优策略。
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">⚠️ Scaling Laws 的局限</h4>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Scaling Laws 预测的是<strong>交叉熵 loss</strong>，不是下游任务表现。
                低 loss 不一定意味着更好的推理能力或更少的幻觉。
                而且，数据质量的变化可以让同样参数量的模型表现相差巨大。
              </p>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
              <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-2">🔮 幂律的哲学</h4>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Loss 以幂律下降意味着：每提升 1% 的能力，需要的算力是上一次的好几倍。
                这就是为什么 GPT-5 比 GPT-4 难这么多。
                有人认为 Scaling Laws 会持续到 AGI，也有人认为我们正在接近一堵数据墙。
              </p>
            </div>
          </div>

          {/* Formulas */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              数学公式 ↓
            </summary>
            <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 space-y-2 font-mono">
              <p>L(N, D) = E + A / N^α + B / D^β</p>
              <p>其中 E ≈ 1.69 (不可约 loss), α ≈ 0.34, β ≈ 0.28</p>
              <p>算力: C = 6 × N × D</p>
              <p>Chinchilla 最优: D_opt ≈ 20 × N, 即 N_opt = √(C/120)</p>
              <p>Over-training ratio = D / (20 × N)</p>
              <p className="pt-2 border-t border-slate-200 dark:border-slate-700">训练成本 = C / (GPU_FLOPs × MFU) × GPU_Price</p>
              <p>H100: 1979 TFLOPS FP16, MFU ≈ 45%, 云端 ≈ $2.5/h</p>
            </div>
          </details>
        </>
      )}

      {/* ==================== INFERENCE TAB ==================== */}
      {tab === 'inference' && (
        <>
          {/* Introduction */}
          <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
            <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
              🧠 推理时计算：2024-2026 最大的范式转变
            </h4>
            <p className="text-xs text-violet-600 dark:text-violet-400">
              o1、DeepSeek R1、Gemini 2.5 Pro 证明了：<strong>让模型花更多时间"思考"，就能得到更好的答案</strong>。
              这是一条全新的 Scaling 曲线——X 轴不再是训练算力，而是推理算力。
              核心发现：<strong>小模型 + 大量推理 Token</strong> 有时比<strong>大模型 + 直接回答</strong>更准、更便宜。
            </p>
          </div>

          {/* Strategy selector */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 self-center mr-1">推理策略：</span>
            {INFERENCE_STRATEGIES.map(s => (
              <button
                key={s.name}
                onClick={() => toggleStrategy(s.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  selectedStrategies.includes(s.name)
                    ? 'border-current'
                    : 'border-slate-200 dark:border-slate-700 opacity-50'
                }`}
                style={{ color: s.colorHex }}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Inference Chart */}
          <div ref={tab === 'inference' ? containerRef : undefined}
               className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <InferenceChart
              width={chartWidth}
              height={400}
              isDark={isDark}
              selectedStrategies={selectedStrategies}
            />
            <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
              * 曲线基于 ICLR 2025 论文的经验公式简化，实际模型数据点来自公开报告
            </div>
          </div>

          {/* Model Comparison Table */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              推理模型对比（MATH 基准）
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400">模型</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400">策略</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400 text-right">Thinking Tokens</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400 text-right">准确率</th>
                    <th className="py-2 text-xs font-medium text-slate-500 dark:text-slate-400 text-right">价格/1K out</th>
                  </tr>
                </thead>
                <tbody>
                  {INFERENCE_MODEL_PRESETS.map(m => (
                    <tr key={m.name} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-4 font-medium" style={{ color: m.color }}>{m.name}</td>
                      <td className="py-2 pr-4 text-xs text-slate-500 dark:text-slate-400">{m.strategy}</td>
                      <td className="py-2 pr-4 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                        {m.thinkingTokens === 0 ? '—' : formatNum(m.thinkingTokens)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {(m.accuracy * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 text-right font-mono text-xs text-amber-600 dark:text-amber-400">
                        ${m.costPer1K}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Insights - Inference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">💡 核心发现</h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                给 8B 模型 10000 个 thinking tokens，在数学推理任务上可以超过 70B 模型的直接回答。
                <strong>推理算力是新的 Scaling 维度</strong>——而且对用户来说更灵活，因为可以按需调节。
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">⚖️ 训练 vs 推理的权衡</h4>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                训练一次的成本是固定的，推理的成本随使用量线性增长。
                如果模型被调用<strong>数十亿次</strong>，省下每次推理 0.01 秒的延迟，
                总节省远超增加训练投入。这就是 LLaMA 3 over-training 策略的经济学本质。
              </p>
            </div>
            <div className="p-4 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800">
              <h4 className="text-sm font-semibold text-pink-700 dark:text-pink-300 mb-2">🔥 DeepSeek R1 的启示</h4>
              <p className="text-xs text-pink-600 dark:text-pink-400">
                DeepSeek R1 证明了推理能力可以通过<strong>蒸馏</strong>传递：671B 的推理模型可以把"思考方式"
                蒸馏到 7B 模型中。这意味着小模型也能获得大模型级别的推理深度——推理 Scaling 的民主化。
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">🎯 什么时候需要"深度思考"</h4>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                不是所有任务都需要推理 scaling。<strong>简单事实查询</strong>用 greedy 就够了，
                <strong>复杂推理</strong>（数学、代码、逻辑分析）才是推理模型的主场。
                2026 年的最佳实践：路由器模型自动判断问题复杂度，按需分配推理预算。
              </p>
            </div>
          </div>

          {/* Inference Formulas */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              推理 Scaling 公式 ↓
            </summary>
            <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 space-y-2 font-mono">
              <p>Accuracy(c) = A_max × (1 - exp(-rate × c / c_baseline))</p>
              <p>其中 c = thinking tokens, A_max = 策略天花板准确率</p>
              <p>Greedy: A_max ≈ 55%, CoT: A_max ≈ 85%, Tree Search: A_max ≈ 95%</p>
              <p className="pt-2 border-t border-slate-200 dark:border-slate-700">
                关键论文：Snell et al. "Scaling LLM Test-Time Compute" (ICLR 2025)
              </p>
              <p>核心结论：test-time compute 的投资回报率在中等难度任务上最高</p>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
