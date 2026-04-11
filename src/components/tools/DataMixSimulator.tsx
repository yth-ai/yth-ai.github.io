import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// ============================================================
// "如果你来训 GPT-5" — 预训练数据配比模拟器
// ============================================================

interface DataSource {
  key: string;
  label: string;
  emoji: string;
  color: string;        // Tailwind color for display
  colorHex: string;     // Hex for canvas
  description: string;
}

interface Capability {
  key: string;
  label: string;
  max: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (mix: number[]) => boolean;
}

interface RealModel {
  name: string;
  mix: number[];       // same order as DATA_SOURCES
  description: string;
  color: string;
}

const DATA_SOURCES: DataSource[] = [
  { key: 'web',      label: '网页文本',   emoji: '🌐', color: 'blue',    colorHex: '#3b82f6', description: 'Common Crawl、网页正文' },
  { key: 'book',     label: '书籍',       emoji: '📚', color: 'amber',   colorHex: '#f59e0b', description: '电子书、学术专著' },
  { key: 'wiki',     label: '百科知识',   emoji: '📖', color: 'emerald', colorHex: '#10b981', description: 'Wikipedia、百科全书' },
  { key: 'code',     label: '代码',       emoji: '💻', color: 'violet',  colorHex: '#8b5cf6', description: 'GitHub、StackOverflow' },
  { key: 'math',     label: '数学',       emoji: '🔢', color: 'rose',    colorHex: '#f43f5e', description: 'arXiv、数学教材、合成数学题' },
  { key: 'conv',     label: '对话数据',   emoji: '💬', color: 'cyan',    colorHex: '#06b6d4', description: '多轮对话、论坛、社交' },
  { key: 'multi',    label: '多语言',     emoji: '🌍', color: 'orange',  colorHex: '#f97316', description: '非英语语料（中/日/韩/欧等）' },
];

const CAPABILITIES: Capability[] = [
  { key: 'coding',       label: '编程能力',   max: 100 },
  { key: 'math_reason',  label: '数学推理',   max: 100 },
  { key: 'knowledge',    label: '常识问答',   max: 100 },
  { key: 'multilingual', label: '多语言',     max: 100 },
  { key: 'instruction',  label: '指令跟随',   max: 100 },
  { key: 'creative',     label: '创意写作',   max: 100 },
  { key: 'reasoning',    label: '逻辑推理',   max: 100 },
  { key: 'factual',      label: '事实准确',   max: 100 },
];

// Influence matrix: how each data source affects each capability
// Rows = data sources (web, book, wiki, code, math, conv, multi)
// Cols = capabilities (coding, math_reason, knowledge, multilingual, instruction, creative, reasoning, factual)
// Values are influence weights (can be > 1 for strong effects)
const INFLUENCE: number[][] = [
  // web:   coding  math  knowledge  multi  instruction  creative  reasoning  factual
  [          0.3,   0.2,   0.8,      0.3,     0.6,        0.7,      0.4,      0.6  ],
  // book:
  [          0.1,   0.3,   0.9,      0.2,     0.4,        0.9,      0.6,      0.8  ],
  // wiki:
  [          0.05,  0.1,   1.0,      0.3,     0.3,        0.3,      0.3,      1.0  ],
  // code:
  [          1.0,   0.5,   0.15,     0.1,     0.5,        0.1,      0.7,      0.2  ],
  // math:
  [          0.3,   1.0,   0.1,      0.05,    0.3,        0.05,     0.9,      0.3  ],
  // conv:
  [          0.05,  0.05,  0.4,      0.2,     1.0,        0.6,      0.2,      0.3  ],
  // multi:
  [          0.15,  0.15,  0.5,      1.0,     0.4,        0.5,      0.3,      0.4  ],
];

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'deepseek',
    title: '🔥 DeepSeek 配方',
    description: '代码 ≥ 30% — 代码是推理的燃料，DeepSeek 深谙此道',
    icon: '🔥',
    condition: (mix) => mix[3] >= 30,
  },
  {
    id: 'reasoning_awakening',
    title: '🧠 推理觉醒',
    description: '代码 + 数学 ≥ 45% — 当这两个加在一起，推理能力开始涌现',
    icon: '🧠',
    condition: (mix) => mix[3] + mix[4] >= 45,
  },
  {
    id: 'polyglot',
    title: '🌍 多语言大师',
    description: '多语言 ≥ 25% — 你的模型可以说地球上大部分语言了',
    icon: '🌍',
    condition: (mix) => mix[6] >= 25,
  },
  {
    id: 'bookworm',
    title: '📚 书虫模型',
    description: '书籍 + 百科 ≥ 40% — 知识储备堪比图书馆',
    icon: '📚',
    condition: (mix) => mix[1] + mix[2] >= 40,
  },
  {
    id: 'chatbot_supreme',
    title: '💬 聊天之王',
    description: '对话数据 ≥ 20% — 你在训练一个超级聊天机器人',
    icon: '💬',
    condition: (mix) => mix[5] >= 20,
  },
  {
    id: 'balanced',
    title: '⚖️ 完美均衡',
    description: '每个数据源都在 10%-20% 之间 — 均衡配方，大厂的选择',
    icon: '⚖️',
    condition: (mix) => mix.every(v => v >= 10 && v <= 20),
  },
  {
    id: 'math_god',
    title: '🔢 数学之神',
    description: '数学 ≥ 25% — 比大部分模型都更擅长数学了',
    icon: '🔢',
    condition: (mix) => mix[4] >= 25,
  },
  {
    id: 'web_heavy',
    title: '🌐 互联网之子',
    description: '网页 ≥ 50% — 经典配方，但也会学到很多垃圾',
    icon: '🌐',
    condition: (mix) => mix[0] >= 50,
  },
];

const REAL_MODELS: RealModel[] = [
  {
    name: 'Llama 3 (405B)',
    mix: [50, 7, 5, 17, 5, 6, 10],
    description: '15T tokens，代码占比高是亮点',
    color: '#3b82f6',
  },
  {
    name: 'DeepSeek V3',
    mix: [30, 8, 5, 30, 12, 5, 10],
    description: '14.8T tokens，代码+数学特别重',
    color: '#8b5cf6',
  },
  {
    name: 'Qwen 2.5',
    mix: [35, 8, 5, 20, 10, 7, 15],
    description: '18T tokens，多语言占比较高',
    color: '#f97316',
  },
  {
    name: 'GPT-4 (推测)',
    mix: [40, 10, 5, 20, 8, 7, 10],
    description: '约 13T tokens，非公开数据',
    color: '#10b981',
  },
];

function computeCapabilities(mix: number[]): number[] {
  return CAPABILITIES.map((_, ci) => {
    let score = 0;
    mix.forEach((pct, si) => {
      const fraction = pct / 100;
      // Non-linear: diminishing returns after ~30%, slight bonus for variety
      const effective = fraction > 0.3
        ? 0.3 + (fraction - 0.3) * 0.5
        : fraction;
      score += effective * INFLUENCE[si][ci];
    });
    // Normalize to 0-100, with a curve
    return Math.min(100, Math.round(score * 120));
  });
}

// ============ Radar Chart (Canvas) ============

function RadarChart({
  capabilities,
  comparisonModel,
  size = 320,
}: {
  capabilities: number[];
  comparisonModel: RealModel | null;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 40;
    const n = CAPABILITIES.length;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    // Draw grid rings
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    for (let ring = 1; ring <= 5; ring++) {
      const r = (ring / 5) * maxR;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = startAngle + i * angleStep;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axis lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
      ctx.stroke();
    }

    // Draw comparison model if selected
    if (comparisonModel) {
      const compCaps = computeCapabilities(comparisonModel.mix);
      ctx.beginPath();
      compCaps.forEach((val, i) => {
        const r = (val / 100) * maxR;
        const angle = startAngle + i * angleStep;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = comparisonModel.color + '15';
      ctx.fill();
      ctx.strokeStyle = comparisonModel.color + '60';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw user's capabilities
    ctx.beginPath();
    capabilities.forEach((val, i) => {
      const r = (val / 100) * maxR;
      const angle = startAngle + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw dots on vertices
    capabilities.forEach((val, i) => {
      const r = (val / 100) * maxR;
      const angle = startAngle + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Draw labels
    ctx.fillStyle = '#475569';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    CAPABILITIES.forEach((cap, i) => {
      const angle = startAngle + i * angleStep;
      const labelR = maxR + 24;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);
      ctx.fillText(cap.label, x, y);
    });

  }, [capabilities, comparisonModel, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="mx-auto"
    />
  );
}

// ============ Donut Chart ============

function DonutChart({ mix, size = 200 }: { mix: number[]; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 4;
    const innerR = outerR * 0.6;

    let currentAngle = -Math.PI / 2;
    mix.forEach((pct, i) => {
      if (pct <= 0) return;
      const sliceAngle = (pct / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, currentAngle, currentAngle + sliceAngle);
      ctx.arc(cx, cy, innerR, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = DATA_SOURCES[i].colorHex;
      ctx.fill();
      currentAngle += sliceAngle;
    });

    // Inner circle (white/dark)
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }, [mix, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="mx-auto dark:opacity-90"
    />
  );
}

// ============ Main Component ============

export default function DataMixSimulator() {
  // Default mix: a reasonable starting point
  const [mix, setMix] = useState<number[]>([35, 10, 8, 15, 7, 10, 15]);
  const [comparisonIdx, setComparisonIdx] = useState<number | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);

  const total = mix.reduce((a, b) => a + b, 0);

  const updateMix = useCallback((index: number, newValue: number) => {
    setMix(prev => {
      const next = [...prev];
      const oldValue = next[index];
      const clampedValue = Math.max(0, Math.min(100, newValue));
      const diff = clampedValue - oldValue;

      // Redistribute the difference proportionally among other sliders
      if (diff !== 0) {
        next[index] = clampedValue;
        const othersTotal = prev.reduce((sum, v, i) => i !== index ? sum + v : sum, 0);

        if (othersTotal > 0) {
          let remaining = -diff;
          for (let i = 0; i < next.length; i++) {
            if (i === index) continue;
            const share = (prev[i] / othersTotal) * remaining;
            next[i] = Math.max(0, Math.round(prev[i] + share));
          }
        }

        // Fix rounding to ensure sum = 100
        const newTotal = next.reduce((a, b) => a + b, 0);
        if (newTotal !== 100) {
          // Find the largest non-target slice and adjust
          let maxIdx = -1;
          let maxVal = -1;
          next.forEach((v, i) => {
            if (i !== index && v > maxVal) {
              maxVal = v;
              maxIdx = i;
            }
          });
          if (maxIdx >= 0) {
            next[maxIdx] += 100 - newTotal;
            next[maxIdx] = Math.max(0, next[maxIdx]);
          }
        }
      }

      return next;
    });
  }, []);

  const capabilities = useMemo(() => computeCapabilities(mix), [mix]);

  const unlockedAchievements = useMemo(() =>
    ACHIEVEMENTS.filter(a => a.condition(mix)),
  [mix]);

  const comparisonModel = comparisonIdx !== null ? REAL_MODELS[comparisonIdx] : null;

  // Overall score (average of capabilities)
  const overallScore = useMemo(() =>
    Math.round(capabilities.reduce((a, b) => a + b, 0) / capabilities.length),
  [capabilities]);

  // Quick presets
  const applyPreset = useCallback((model: RealModel) => {
    setMix([...model.mix]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="relative">
          <div className="text-3xl mb-2">🧪</div>
          <h2 className="text-xl font-bold mb-2">如果你来训 GPT-5</h2>
          <p className="text-white/80 text-sm max-w-xl">
            恭喜，你被任命为 GPT-5 的预训练数据负责人。你有 15T tokens 的预算，需要决定数据配比。
            调整下面的滑块，看看你的选择如何影响模型的各项能力。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Sliders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">数据配比 (总计需 = 100%)</h3>
            <span className={`text-sm font-mono font-bold ${total === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {total}%
            </span>
          </div>

          {DATA_SOURCES.map((source, i) => (
            <div key={source.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span>{source.emoji}</span>
                  <span className="font-medium">{source.label}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                    {source.description}
                  </span>
                </label>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white w-12 text-right">
                  {mix[i]}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={mix[i]}
                  onChange={(e) => updateMix(i, parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${source.colorHex} ${mix[i]}%, #e2e8f0 ${mix[i]}%)`,
                  }}
                />
              </div>
            </div>
          ))}

          {/* Donut */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 text-center">配比分布</h4>
            <DonutChart mix={mix} size={180} />
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
              {DATA_SOURCES.map((s, i) => mix[i] > 0 && (
                <span key={s.key} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.colorHex }} />
                  {s.label} {mix[i]}%
                </span>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">一键加载真实模型配方</h4>
            <div className="flex flex-wrap gap-2">
              {REAL_MODELS.map((model) => (
                <button
                  key={model.name}
                  onClick={() => applyPreset(model)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                >
                  {model.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              注：真实配比均为公开信息的近似值，非官方精确数据
            </p>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800 text-center">
            <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">综合能力评分</div>
            <div className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400">{overallScore}</div>
            <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">/ 100</div>
          </div>

          {/* Radar Chart */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">能力雷达图</h4>
              <select
                value={comparisonIdx ?? ''}
                onChange={(e) => setComparisonIdx(e.target.value === '' ? null : parseInt(e.target.value))}
                className="text-xs px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              >
                <option value="">不对比</option>
                {REAL_MODELS.map((m, i) => (
                  <option key={m.name} value={i}>对比: {m.name}</option>
                ))}
              </select>
            </div>
            <RadarChart capabilities={capabilities} comparisonModel={comparisonModel} size={320} />
            {comparisonModel && (
              <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-indigo-500 rounded" /> 你的配方
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded" style={{ backgroundColor: comparisonModel.color, opacity: 0.6 }} />
                  <span className="border-b border-dashed" style={{ borderColor: comparisonModel.color }}>{comparisonModel.name}</span>
                </span>
              </div>
            )}
          </div>

          {/* Capability Bars */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">各项能力详情</h4>
            <div className="space-y-2.5">
              {CAPABILITIES.map((cap, i) => {
                const compCaps = comparisonModel ? computeCapabilities(comparisonModel.mix) : null;
                return (
                  <div key={cap.key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">{cap.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{capabilities[i]}</span>
                        {compCaps && (
                          <span className="font-mono text-slate-400 dark:text-slate-500">
                            vs {compCaps[i]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                      {compCaps && (
                        <div
                          className="absolute inset-y-0 rounded-full opacity-30"
                          style={{
                            width: `${compCaps[i]}%`,
                            backgroundColor: comparisonModel!.color,
                          }}
                        />
                      )}
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 relative z-10"
                        style={{ width: `${capabilities[i]}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievements */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowAchievements(!showAchievements)}
            >
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                🏆 隐藏成就 ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
              </h4>
              <span className="text-xs text-slate-400">{showAchievements ? '收起' : '展开'}</span>
            </div>

            {showAchievements && (
              <div className="mt-3 space-y-2">
                {ACHIEVEMENTS.map((achievement) => {
                  const unlocked = unlockedAchievements.includes(achievement);
                  return (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border transition-all duration-300 ${
                        unlocked
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{unlocked ? achievement.icon : '🔒'}</span>
                        <div>
                          <div className={`text-sm font-semibold ${unlocked ? 'text-amber-700 dark:text-amber-300' : 'text-slate-400 dark:text-slate-500'}`}>
                            {unlocked ? achievement.title : '???'}
                          </div>
                          <div className={`text-xs ${unlocked ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {unlocked ? achievement.description : '继续调整配比来解锁...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educational Insights */}
      <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
        <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">💡 你可能不知道的数据配比冷知识</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-indigo-600 dark:text-indigo-400">
          <div className="p-2.5 rounded-lg bg-white/60 dark:bg-slate-800/60">
            <span className="font-semibold">代码提升推理能力：</span>
            代码训练不只是让模型会写程序——大量研究表明，代码数据可以显著提升模型的逻辑推理和数学能力。DeepSeek 的成功很大程度上归功于此。
          </div>
          <div className="p-2.5 rounded-lg bg-white/60 dark:bg-slate-800/60">
            <span className="font-semibold">数据质量 &gt; 数据数量：</span>
            FineWeb-Edu 证明了，10% 的高质量数据可以训出媲美 100% 原始数据的模型。配比只是第一步，质量过滤才是关键。
          </div>
          <div className="p-2.5 rounded-lg bg-white/60 dark:bg-slate-800/60">
            <span className="font-semibold">多语言的代价：</span>
            增加非英语数据会稀释英语能力，但跨语言迁移效应意味着中文数据也能提升英语推理——只是最优配比因模型大小而异。
          </div>
          <div className="p-2.5 rounded-lg bg-white/60 dark:bg-slate-800/60">
            <span className="font-semibold">对话数据的陷阱：</span>
            过多的对话数据会让模型变得"话痨"但不准确。大部分前沿模型的对话数据占比不超过 10%，指令跟随主要靠后训练。
          </div>
        </div>
      </div>

      {/* Real Models Comparison Table */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">真实模型数据配比参考</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="pb-2 pr-3 font-semibold">模型</th>
                {DATA_SOURCES.map(s => (
                  <th key={s.key} className="pb-2 px-2 font-semibold text-center">{s.emoji} {s.label}</th>
                ))}
                <th className="pb-2 pl-3 font-semibold">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {REAL_MODELS.map((model) => (
                <tr key={model.name} className="text-slate-700 dark:text-slate-300">
                  <td className="py-2 pr-3 font-medium whitespace-nowrap">{model.name}</td>
                  {model.mix.map((pct, i) => (
                    <td key={i} className="py-2 px-2 text-center font-mono">
                      <span className={pct >= 20 ? 'font-bold text-indigo-600 dark:text-indigo-400' : ''}>
                        {pct}%
                      </span>
                    </td>
                  ))}
                  <td className="py-2 pl-3 text-slate-500 dark:text-slate-400">{model.description}</td>
                </tr>
              ))}
              <tr className="text-indigo-700 dark:text-indigo-300 font-medium">
                <td className="py-2 pr-3 whitespace-nowrap">你的配方 ✨</td>
                {mix.map((pct, i) => (
                  <td key={i} className="py-2 px-2 text-center font-mono font-bold">{pct}%</td>
                ))}
                <td className="py-2 pl-3">综合评分: {overallScore}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          方法论说明 ↓
        </summary>
        <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 space-y-2">
          <p>本模拟器基于公开研究（Data Mixing Laws, DoReMi, Llama 3 技术报告等）的定性结论构建影响力矩阵。</p>
          <p>能力分数通过 <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-xs">影响力矩阵 × 数据配比</code> 计算，加入递减收益曲线（&gt;30% 部分效果减半），并归一化到 0-100。</p>
          <p>真实模型配比来自官方技术报告或可靠推测，不代表精确值。这是一个教学工具，不是精确预测器。</p>
          <p className="font-medium">核心洞察：没有完美的配比，每个选择都是 trade-off。</p>
        </div>
      </details>
    </div>
  );
}
