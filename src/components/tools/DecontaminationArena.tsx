import { useState, useMemo, useCallback } from 'react';

// ============================================================
// Benchmark Contamination Arena
// 污染注入模拟 · 检测器挑战赛 · 信任度计算器
// ============================================================

// ---- Types ----
interface Benchmark {
  id: string;
  name: string;
  fullName: string;
  baseScore: number;      // GPT-4 class baseline
  maxBoost: number;       // max contamination boost (%)
  category: string;
  sampleQuestion: string;
  sampleAnswer: string;
}

interface DetectionMethod {
  id: string;
  name: string;
  description: string;
  // Detection rates: [no_wash, sft_wash, grpo_wash]
  rates: [number, number, number];
  color: string;
}

interface WashStrategy {
  id: string;
  name: string;
  description: string;
}

// ---- Data ----
const BENCHMARKS: Benchmark[] = [
  {
    id: 'mmlu',
    name: 'MMLU',
    fullName: 'Massive Multitask Language Understanding',
    baseScore: 86.4,
    maxBoost: 5.2,
    category: '知识',
    sampleQuestion: 'In the context of machine learning, what does the bias-variance tradeoff refer to?',
    sampleAnswer: 'The balance between model simplicity (high bias) and sensitivity to training data (high variance).',
  },
  {
    id: 'gsm8k',
    name: 'GSM8K',
    fullName: 'Grade School Math 8K',
    baseScore: 92.0,
    maxBoost: 6.8,
    category: '数学',
    sampleQuestion: 'Janet has 5 ducks that lay 16 eggs per day. She eats 3 for breakfast and sells the rest at $2 each. How much does she make per day?',
    sampleAnswer: '(16 * 5 - 3) * 2 = $154',
  },
  {
    id: 'humaneval',
    name: 'HumanEval',
    fullName: 'HumanEval Code Generation',
    baseScore: 87.1,
    maxBoost: 8.8,
    category: '代码',
    sampleQuestion: 'Write a function that returns the n-th Fibonacci number.',
    sampleAnswer: 'def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)',
  },
  {
    id: 'gpqa',
    name: 'GPQA',
    fullName: 'Graduate-level Google-Proof QA',
    baseScore: 53.6,
    maxBoost: 12.4,
    category: '推理',
    sampleQuestion: 'Consider a quantum system with Hamiltonian H = -J * sum(sigma_z_i * sigma_z_{i+1}). What is the ground state degeneracy?',
    sampleAnswer: '2-fold degenerate (all spins up or all spins down)',
  },
  {
    id: 'arc',
    name: 'ARC-C',
    fullName: 'AI2 Reasoning Challenge (Challenge)',
    baseScore: 96.3,
    maxBoost: 3.1,
    category: '科学',
    sampleQuestion: 'A student added an acid to a beaker of water and noticed the water got warmer. What type of reaction occurred?',
    sampleAnswer: 'Exothermic reaction (releases heat)',
  },
];

const DETECTION_METHODS: DetectionMethod[] = [
  { id: 'ngram', name: 'N-gram Overlap', description: '比较训练集与测试题的 n-gram 重叠度', rates: [0.89, 0.42, 0.08], color: 'bg-blue-500' },
  { id: 'perplexity', name: 'Perplexity', description: '被污染的样本 perplexity 异常低', rates: [0.82, 0.35, 0.11], color: 'bg-indigo-500' },
  { id: 'mink', name: 'Min-K%', description: '检测 token 概率分布中的异常低概率尾部', rates: [0.76, 0.31, 0.09], color: 'bg-violet-500' },
  { id: 'mia', name: 'Membership Inference', description: '用影子模型判断数据是否见过', rates: [0.71, 0.28, 0.12], color: 'bg-purple-500' },
  { id: 'cdd', name: 'CDD', description: 'Contamination Detection via Distribution', rates: [0.68, 0.24, 0.07], color: 'bg-fuchsia-500' },
  { id: 'llm-judge', name: 'LLM Judge', description: '让另一个 LLM 判断回答是否像"背答案"', rates: [0.62, 0.38, 0.14], color: 'bg-pink-500' },
];

const WASH_STRATEGIES: WashStrategy[] = [
  { id: 'none', name: '不洗白', description: '直接混入 SFT 数据训练' },
  { id: 'sft-wash', name: 'SFT 洗白', description: '用干净数据做额外 SFT 轮次覆盖痕迹' },
  { id: 'grpo-wash', name: 'GRPO 洗白', description: '用 GRPO/DPO 强化学习消除记忆痕迹（最隐蔽）' },
];

// ---- Radar chart helper (SVG) ----
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function RadarChart({ values, labels, maxValue = 100, size = 240 }: { values: number[]; labels: string[]; maxValue?: number; size?: number }) {
  const cx = size / 2, cy = size / 2, maxR = size / 2 - 30;
  const n = values.length;
  const angleStep = 360 / n;

  const points = values.map((v, i) => {
    const r = (v / maxValue) * maxR;
    return polarToCartesian(cx, cy, r, i * angleStep);
  });

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid */}
      {gridLevels.map((level) => {
        const r = level * maxR;
        const ps = Array.from({ length: n }, (_, i) => polarToCartesian(cx, cy, r, i * angleStep));
        return (
          <polygon
            key={level}
            points={ps.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth={0.5}
          />
        );
      })}
      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const end = polarToCartesian(cx, cy, maxR, i * angleStep);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={0.5} />;
      })}
      {/* Data polygon */}
      <polygon
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(239, 68, 68, 0.15)"
        stroke="rgb(239, 68, 68)"
        strokeWidth={2}
      />
      {/* Data dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="rgb(239, 68, 68)" />
      ))}
      {/* Labels */}
      {labels.map((label, i) => {
        const pos = polarToCartesian(cx, cy, maxR + 18, i * angleStep);
        return (
          <text
            key={i}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[10px] fill-slate-500 dark:fill-slate-400"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function DecontaminationArena() {
  const [activeTab, setActiveTab] = useState<'inject' | 'detect' | 'trust'>('inject');

  return (
    <div className="space-y-6">
      {/* Header with dramatic styling */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 via-amber-50 to-red-50 dark:from-red-950/20 dark:via-amber-950/20 dark:to-red-950/20 border border-red-200 dark:border-red-900/50">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          基于 <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">arXiv:2510.02386</span> 等研究：
          模型开发者可以在 SFT 阶段混入 benchmark 数据获得 +8.82% 提升，然后用 GRPO 训练消除所有检测痕迹。
          这是 LLM 评测领域最尖锐的信任危机。
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
        {([
          { id: 'inject' as const, label: '污染注入模拟器', icon: '💉' },
          { id: 'detect' as const, label: '检测器挑战赛', icon: '🔍' },
          { id: 'trust' as const, label: '信任度计算器', icon: '🛡' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'inject' && <InjectionSimulator />}
      {activeTab === 'detect' && <DetectorChallenge />}
      {activeTab === 'trust' && <TrustCalculator />}
    </div>
  );
}

// ============================================================
// Tab 1: Injection Simulator
// ============================================================
function InjectionSimulator() {
  const [injected, setInjected] = useState<Set<string>>(new Set());
  const [leakRate, setLeakRate] = useState(0.3); // 30% of benchmark mixed in

  const toggleBenchmark = useCallback((id: string) => {
    setInjected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const results = useMemo(() => {
    return BENCHMARKS.map(b => {
      const isInjected = injected.has(b.id);
      const boost = isInjected ? b.maxBoost * leakRate : 0;
      const score = Math.min(b.baseScore + boost, 100);
      return { ...b, score, boost, isInjected };
    });
  }, [injected, leakRate]);

  const avgBoost = useMemo(() => {
    const boosts = results.filter(r => r.boost > 0).map(r => r.boost);
    return boosts.length > 0 ? boosts.reduce((a, b) => a + b, 0) / boosts.length : 0;
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Leak rate slider */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">泄露率</span>
          <span className="text-sm font-mono text-red-600 dark:text-red-400">{(leakRate * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={leakRate}
          onChange={e => setLeakRate(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-slate-200 dark:bg-slate-700 accent-red-500"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>5% (微量泄露)</span>
          <span>100% (全量泄露)</span>
        </div>
      </div>

      {/* Benchmark cards */}
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">点击 Benchmark 将其混入训练集</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map(b => (
          <button
            key={b.id}
            onClick={() => toggleBenchmark(b.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all duration-300 ${
              b.isInjected
                ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/20 shadow-lg shadow-red-200/30 dark:shadow-red-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{b.name}</span>
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{b.category}</span>
              </div>
              {b.isInjected && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">已注入</span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{b.fullName}</div>

            {/* Score bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">得分</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {b.score.toFixed(1)}%
                  {b.boost > 0 && (
                    <span className="text-red-500 ml-1">(+{b.boost.toFixed(1)})</span>
                  )}
                </span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 bg-slate-300 dark:bg-slate-500 rounded-full transition-all duration-500"
                  style={{ width: `${b.baseScore}%` }}
                />
                {b.boost > 0 && (
                  <div
                    className="absolute inset-y-0 bg-red-400 dark:bg-red-500 rounded-r-full transition-all duration-500"
                    style={{ left: `${b.baseScore}%`, width: `${b.boost}%` }}
                  />
                )}
              </div>
            </div>

            {/* Sample question */}
            <details className="mt-3">
              <summary className="text-[10px] text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">查看样题</summary>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded">
                <div className="font-medium mb-1">Q: {b.sampleQuestion}</div>
                <div className="text-slate-400 dark:text-slate-500">A: {b.sampleAnswer}</div>
              </div>
            </details>
          </button>
        ))}
      </div>

      {/* Summary dashboard */}
      {injected.size > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/20 dark:to-amber-950/20 border border-red-200 dark:border-red-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{injected.size}/{BENCHMARKS.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">注入的 Benchmark</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">+{avgBoost.toFixed(1)}%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">平均得分提升</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{(leakRate * 100).toFixed(0)}%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">泄露率</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
            在真实场景中，仅 5% 的泄露率就能让排行榜排名发生显著变化
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab 2: Detector Challenge
// ============================================================
function DetectorChallenge() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        6 种主流污染检测方法 vs 3 种洗白策略。选择一种检测方法，看它在不同洗白策略下的检出率。
      </p>

      {/* Detection methods */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {DETECTION_METHODS.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMethod(selectedMethod === m.id ? null : m.id)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedMethod === m.id
                ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 shadow-md'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="text-sm font-medium text-slate-900 dark:text-white">{m.name}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">{m.description}</div>
          </button>
        ))}
      </div>

      {/* Heat map: methods x strategies */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">检测率热力图：检测方法 × 洗白策略</h4>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">检测方法</th>
              {WASH_STRATEGIES.map(s => (
                <th key={s.id} className="text-center py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DETECTION_METHODS.map(m => (
              <tr
                key={m.id}
                className={`transition-colors ${selectedMethod === m.id ? 'bg-indigo-50 dark:bg-indigo-950/20' : ''}`}
              >
                <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{m.name}</td>
                {m.rates.map((rate, i) => {
                  const hue = rate > 0.6 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                              rate > 0.3 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                  return (
                    <td key={i} className="text-center py-2 px-3">
                      <span className={`inline-block px-2 py-1 rounded font-mono font-bold ${hue}`}>
                        {(rate * 100).toFixed(0)}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
            &gt;60% 有效
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700" />
            30-60% 部分有效
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" />
            &lt;30% 几乎失效
          </span>
        </div>
      </div>

      {/* Selected method detail */}
      {selectedMethod && (() => {
        const method = DETECTION_METHODS.find(m => m.id === selectedMethod)!;
        return (
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{method.name} 检测效果</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{method.description}</p>
            <div className="space-y-2">
              {WASH_STRATEGIES.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-slate-600 dark:text-slate-400 shrink-0">{s.name}</span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        method.rates[i] > 0.6 ? 'bg-green-500' : method.rates[i] > 0.3 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${method.rates[i] * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 text-right tabular-nums">
                    {(method.rates[i] * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded">
              经过 GRPO 洗白后，{method.name} 的检出率从 {(method.rates[0] * 100).toFixed(0)}% 降至 {(method.rates[2] * 100).toFixed(0)}%
              ——接近随机猜测水平
            </div>
          </div>
        );
      })()}

      {/* Key insight */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-800">
        <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">核心洞察</div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          GRPO（Group Relative Policy Optimization）洗白后，<strong>所有 6 种主流检测方法的检出率都降到了 7-14%</strong>——
          与随机猜测（~10%）几乎没有区别。这意味着当前的污染检测方法论在面对精心设计的洗白策略时近乎完全失效。
          Benchmark 排行榜的可信度面临系统性危机。
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Tab 3: Trust Calculator
// ============================================================
function TrustCalculator() {
  const [scores, setScores] = useState<Record<string, number>>({
    mmlu: 88, gsm8k: 95, humaneval: 90, gpqa: 60, arc: 97,
  });
  const [modelName, setModelName] = useState('My-Model-7B');

  const updateScore = useCallback((id: string, value: number) => {
    setScores(prev => ({ ...prev, [id]: value }));
  }, []);

  // Anomaly detection
  const analysis = useMemo(() => {
    const benchmarks = BENCHMARKS.map(b => ({
      ...b,
      userScore: scores[b.id] ?? b.baseScore,
    }));

    // 1. Cross-benchmark consistency (z-score-like)
    const deltas = benchmarks.map(b => b.userScore - b.baseScore);
    const meanDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const stdDelta = Math.sqrt(deltas.reduce((a, d) => a + (d - meanDelta) ** 2, 0) / deltas.length) || 1;
    const zScores = deltas.map(d => Math.abs(d - meanDelta) / stdDelta);
    const maxZ = Math.max(...zScores);

    // 2. Implausibly high scores
    const suspiciouslyHigh = benchmarks.filter(b => b.userScore > b.baseScore + b.maxBoost * 0.8);

    // 3. GPQA anomaly (hardest benchmark, disproportionate improvement is fishy)
    const gpqaResult = benchmarks.find(b => b.id === 'gpqa')!;
    const gpqaAnomaly = gpqaResult.userScore - gpqaResult.baseScore;

    // 4. Overall suspicion score (0-100)
    let suspicion = 0;
    // High GPQA relative gain
    if (gpqaAnomaly > 10) suspicion += 30;
    else if (gpqaAnomaly > 5) suspicion += 15;
    // Inconsistent performance profile
    if (maxZ > 2) suspicion += 25;
    else if (maxZ > 1.5) suspicion += 15;
    // Suspiciously high on multiple
    suspicion += suspiciouslyHigh.length * 10;
    // All scores above baseline
    if (deltas.every(d => d > 2)) suspicion += 10;

    suspicion = Math.min(suspicion, 100);

    const level = suspicion > 60 ? 'high' : suspicion > 30 ? 'medium' : 'low';
    const label = level === 'high' ? '高可疑' : level === 'medium' ? '中等可疑' : '低可疑';
    const color = level === 'high' ? 'text-red-600 dark:text-red-400' : level === 'medium' ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400';
    const bgColor = level === 'high' ? 'from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-950/30' : level === 'medium' ? 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-950/30' : 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-950/30';

    const radarValues = benchmarks.map(b => b.userScore);
    const radarLabels = benchmarks.map(b => b.name);

    const reasons: string[] = [];
    if (gpqaAnomaly > 10) reasons.push(`GPQA 得分异常高（+${gpqaAnomaly.toFixed(1)}），该 Benchmark 最难，不成比例的提升是典型污染信号`);
    if (maxZ > 2) reasons.push('各 Benchmark 得分变化高度不一致，某些 Benchmark 可能被选择性污染');
    if (suspiciouslyHigh.length > 0) reasons.push(`${suspiciouslyHigh.map(b => b.name).join('、')} 的得分超过了已知最佳模型的合理范围`);
    if (deltas.every(d => d > 2)) reasons.push('所有 Benchmark 均高于 GPT-4 级基线，全面超越需要非常充分的证据');
    if (reasons.length === 0) reasons.push('得分分布在合理范围内，未检测到明显异常');

    return { suspicion, level, label, color, bgColor, radarValues, radarLabels, reasons, benchmarks };
  }, [scores]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        输入模型在各 Benchmark 上的分数，基于统计异常检测给出"可疑度"评分。
      </p>

      {/* Model name */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600 dark:text-slate-400 shrink-0">模型名称</label>
        <input
          value={modelName}
          onChange={e => setModelName(e.target.value)}
          className="flex-1 max-w-xs px-3 py-1.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Score inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BENCHMARKS.map(b => (
          <div key={b.id} className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{b.name}</span>
              <span className="text-xs text-slate-400">{b.category}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={scores[b.id] ?? b.baseScore}
                onChange={e => updateScore(b.id, Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none bg-slate-200 dark:bg-slate-700 accent-indigo-500"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={scores[b.id] ?? b.baseScore}
                onChange={e => updateScore(b.id, Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-16 px-2 py-1 text-sm font-mono text-center rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>GPT-4 级基线: {b.baseScore}%</span>
              <span className={scores[b.id] > b.baseScore + b.maxBoost * 0.8 ? 'text-red-500' : ''}>
                {scores[b.id] > b.baseScore ? `+${(scores[b.id] - b.baseScore).toFixed(1)}` : (scores[b.id] - b.baseScore).toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      <div className={`p-6 rounded-xl bg-gradient-to-br ${analysis.bgColor} border border-slate-200 dark:border-slate-700`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Score + Reasons */}
          <div className="space-y-4">
            <div className="text-center lg:text-left">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{modelName} 可疑度评分</div>
              <div className={`text-5xl font-bold ${analysis.color} tabular-nums`}>{analysis.suspicion}</div>
              <div className={`text-sm font-medium ${analysis.color} mt-1`}>{analysis.label}</div>
            </div>

            {/* Suspicion gauge */}
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  analysis.level === 'high' ? 'bg-red-500' : analysis.level === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${analysis.suspicion}%` }}
              />
            </div>

            <div className="space-y-1.5">
              {analysis.reasons.map((r, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                    analysis.level === 'high' ? 'bg-red-500' : analysis.level === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  <span className="text-slate-600 dark:text-slate-400">{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Radar chart */}
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center mb-2">各维度表现雷达图</div>
            <RadarChart values={analysis.radarValues} labels={analysis.radarLabels} />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center px-8">
        * 此工具基于简化的统计启发式方法，仅供教育目的。真实的污染检测需要访问模型权重和训练数据的统计特征。
        数据基于公开论文和排行榜数据。
      </div>
    </div>
  );
}
