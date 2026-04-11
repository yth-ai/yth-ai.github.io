/**
 * Tab 4: 训练直觉（Intuition Lab）
 *
 * 四个小实验帮助理解 Embedding 训练原理：
 * 1. One-hot vs Dense 对比
 * 2. 滑动窗口（Skip-gram 训练对生成）
 * 3. 维度影响实验
 * 4. 训练过程模拟
 */
import { useState, useMemo, useRef, useEffect } from 'react';

type LabSection = 'onehot' | 'window' | 'dimension' | 'training';

const SECTIONS: { id: LabSection; label: string; desc: string }[] = [
  { id: 'onehot', label: 'One-hot vs Dense', desc: '稀疏正交 vs 语义聚类' },
  { id: 'window', label: '滑动窗口', desc: 'Skip-gram 训练对生成' },
  { id: 'dimension', label: '维度探索', desc: '维度如何影响聚类质量' },
  { id: 'training', label: '训练模拟', desc: '观察 Loss 下降和聚类形成' },
];

export default function IntuitionLab() {
  const [section, setSection] = useState<LabSection>('onehot');

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              section === s.id
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {SECTIONS.find((s) => s.id === section)?.desc}
      </p>

      {section === 'onehot' && <OneHotDemo />}
      {section === 'window' && <WindowDemo />}
      {section === 'dimension' && <DimensionDemo />}
      {section === 'training' && <TrainingDemo />}
    </div>
  );
}

// ============================================================
// 1. One-hot vs Dense
// ============================================================

const DEMO_WORDS = ['猫', '狗', '鱼', '苹果', '香蕉', '西瓜', '算法', '模型', '训练', '快乐', '悲伤', '愤怒'];
const DEMO_CATS = ['动物', '动物', '动物', '食物', '食物', '食物', '科技', '科技', '科技', '情感', '情感', '情感'];
const CAT_COLORS_SIMPLE: Record<string, string> = { '动物': '#f97316', '食物': '#ef4444', '科技': '#3b82f6', '情感': '#ec4899' };

function OneHotDemo() {
  const [mode, setMode] = useState<'onehot' | 'dense'>('onehot');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width;
    const H = rect.height;
    const isDark = document.documentElement.classList.contains('dark');

    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    const pad = 50;
    const n = DEMO_WORDS.length;

    if (mode === 'onehot') {
      // One-hot: all points on axes, equidistant
      const cx = W / 2;
      const cy = H / 2;
      const r = Math.min(W, H) / 2 - pad;

      // Circle
      ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        const color = CAT_COLORS_SIMPLE[DEMO_CATS[i]] || '#94a3b8';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        const labelR = r + 20;
        ctx.fillText(DEMO_WORDS[i], cx + Math.cos(angle) * labelR, cy + Math.sin(angle) * labelR + 4);
      }

      // Center text
      ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('所有词等距分布', cx, cy - 8);
      ctx.fillText('无语义信息', cx, cy + 14);
    } else {
      // Dense: clustered by category
      const clusterCenters: Record<string, [number, number]> = {
        '动物': [W * 0.25, H * 0.3],
        '食物': [W * 0.75, H * 0.3],
        '科技': [W * 0.3, H * 0.7],
        '情感': [W * 0.7, H * 0.7],
      };

      // Draw cluster regions
      for (const [cat, [cx, cy]] of Object.entries(clusterCenters)) {
        ctx.fillStyle = (CAT_COLORS_SIMPLE[cat] || '#94a3b8') + '15';
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = (CAT_COLORS_SIMPLE[cat] || '#94a3b8') + '30';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Points
      const rng = seedRng(42);
      for (let i = 0; i < n; i++) {
        const cat = DEMO_CATS[i];
        const [cx, cy] = clusterCenters[cat];
        const px = cx + (rng() - 0.5) * 80;
        const py = cy + (rng() - 0.5) * 60;
        const color = CAT_COLORS_SIMPLE[cat] || '#94a3b8';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(DEMO_WORDS[i], px, py - 10);
      }

      // Category labels
      for (const [cat, [cx, cy]] of Object.entries(clusterCenters)) {
        ctx.fillStyle = (CAT_COLORS_SIMPLE[cat] || '#94a3b8') + '80';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(cat, cx, cy + 50);
      }
    }
  }, [mode]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setMode('onehot')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'onehot' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          }`}
        >
          One-hot 编码
        </button>
        <button
          onClick={() => setMode('dense')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'dense' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          }`}
        >
          Dense Embedding
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <canvas ref={canvasRef} className="w-full" style={{ height: '340px' }} />
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400">
        {mode === 'onehot' ? (
          <p><strong>One-hot</strong>：每个词是一个长度为 V（词表大小）的向量，只有自己的位置是 1，其余全是 0。所有词之间的距离完全相等——"猫"和"狗"的距离等于"猫"和"算法"的距离。这意味着 One-hot 编码<strong>不包含任何语义信息</strong>。</p>
        ) : (
          <p><strong>Dense Embedding</strong>：通过训练学习到的低维连续向量（如 768 维）。语义相似的词会自然聚集到一起——"猫""狗""鱼"形成动物簇，"算法""模型""训练"形成科技簇。这就是 Embedding 的核心价值：<strong>将离散符号映射到连续语义空间</strong>。</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 2. 滑动窗口
// ============================================================

const SAMPLE_TEXT = '大语言模型通过海量文本数据学习词语之间的语义关系';

function WindowDemo() {
  const [windowSize, setWindowSize] = useState(2);
  const [centerIdx, setCenterIdx] = useState(3);

  const chars = SAMPLE_TEXT.split('');
  const pairs = useMemo(() => {
    const result: { center: string; context: string; dist: number }[] = [];
    for (let d = -windowSize; d <= windowSize; d++) {
      if (d === 0) continue;
      const ci = centerIdx + d;
      if (ci >= 0 && ci < chars.length) {
        result.push({ center: chars[centerIdx], context: chars[ci], dist: Math.abs(d) });
      }
    }
    return result;
  }, [windowSize, centerIdx]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">窗口大小</span>
          <input
            type="range"
            min="1"
            max="5"
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
            className="w-24 accent-cyan-600"
          />
          <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{windowSize}</span>
        </div>
      </div>

      {/* Text with highlight */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-1">
          {chars.map((ch, i) => {
            const isCenter = i === centerIdx;
            const inWindow = Math.abs(i - centerIdx) <= windowSize && i !== centerIdx;
            const dist = Math.abs(i - centerIdx);

            return (
              <button
                key={i}
                onClick={() => setCenterIdx(i)}
                className={`w-10 h-10 rounded-lg text-lg font-medium transition-all flex items-center justify-center ${
                  isCenter
                    ? 'bg-cyan-600 text-white ring-2 ring-cyan-400 shadow-lg'
                    : inWindow
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700'
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
                title={isCenter ? '中心词' : inWindow ? `上下文词 (距离=${dist})` : '点击设为中心词'}
              >
                {ch}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-cyan-600 rounded" /> 中心词</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-200 dark:bg-amber-800 rounded" /> 上下文窗口</span>
        </div>
      </div>

      {/* Training Pairs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          生成的训练对（Skip-gram）
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pairs.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2"
            >
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{p.center}</span>
              <span className="text-slate-400">→</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{p.context}</span>
              <span className="text-xs text-slate-400 ml-auto">d={p.dist}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
          Skip-gram 目标：给定中心词，预测上下文窗口内的词。训练过程中，经常共现的词对会获得相似的向量。
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 3. 维度探索
// ============================================================

function DimensionDemo() {
  const [dim, setDim] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clusterQuality = useMemo(() => {
    // Simulate: higher dim → better separation up to a point
    const qualities = [
      { dim: 2, score: 0.35, label: '很差' },
      { dim: 5, score: 0.52, label: '一般' },
      { dim: 10, score: 0.71, label: '较好' },
      { dim: 25, score: 0.85, label: '好' },
      { dim: 50, score: 0.92, label: '很好' },
      { dim: 100, score: 0.95, label: '优秀' },
      { dim: 200, score: 0.96, label: '优秀' },
      { dim: 500, score: 0.96, label: '饱和' },
    ];
    const closest = qualities.reduce((best, q) =>
      Math.abs(q.dim - dim) < Math.abs(best.dim - dim) ? q : best
    );
    // Interpolate
    const score = Math.min(0.96, 0.2 + 0.76 * (1 - Math.exp(-dim / 30)));
    return { score, label: closest.label };
  }, [dim]);

  // Canvas: scatter plot with varying cluster tightness
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width;
    const H = rect.height;
    const isDark = document.documentElement.classList.contains('dark');

    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    // 4 clusters with tightness based on dim
    const spread = Math.max(5, 60 - dim * 0.8);
    const centers: [number, number, string, string][] = [
      [W * 0.3, H * 0.3, '#f97316', '动物'],
      [W * 0.7, H * 0.3, '#ef4444', '食物'],
      [W * 0.3, H * 0.7, '#3b82f6', '科技'],
      [W * 0.7, H * 0.7, '#ec4899', '情感'],
    ];

    const rng = seedRng(dim);
    for (const [cx, cy, color, cat] of centers) {
      // Cluster region
      ctx.fillStyle = color + '10';
      ctx.beginPath();
      ctx.arc(cx, cy, spread * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Points
      for (let i = 0; i < 8; i++) {
        const px = cx + (rng() - 0.5) * spread * 3;
        const py = cy + (rng() - 0.5) * spread * 3;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = color + '80';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(cat, cx, cy + spread * 2.5 + 16);
    }

    // Quality indicator
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`维度 = ${dim} | 聚类质量: ${clusterQuality.label} (${(clusterQuality.score * 100).toFixed(0)}%)`, W / 2, H - 12);
  }, [dim, clusterQuality]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-500 dark:text-slate-400">Embedding 维度</span>
        <input
          type="range"
          min="2"
          max="200"
          step="1"
          value={dim}
          onChange={(e) => setDim(Number(e.target.value))}
          className="flex-1 accent-cyan-600"
        />
        <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400 w-10 text-right">{dim}</span>
      </div>

      {/* Quality bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400 w-16">聚类质量</span>
        <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${clusterQuality.score * 100}%`,
              backgroundColor: clusterQuality.score > 0.8 ? '#22c55e' : clusterQuality.score > 0.5 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-16 text-right">
          {clusterQuality.label}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <canvas ref={canvasRef} className="w-full" style={{ height: '300px' }} />
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
        <p><strong>低维度（2-10）</strong>：表达能力不足，不同类别的词重叠严重</p>
        <p><strong>中等维度（50-100）</strong>：聚类清晰，语义关系充分编码——多数任务的最佳区间</p>
        <p><strong>高维度（200+）</strong>：边际收益递减，计算成本上升但质量提升有限</p>
        <p className="text-slate-400">实际应用中：Word2Vec 用 300 维，BERT 768 维，GPT-4 12288 维——维度随模型能力增长</p>
      </div>
    </div>
  );
}

// ============================================================
// 4. 训练过程模拟
// ============================================================

function TrainingDemo() {
  const [epoch, setEpoch] = useState(0);
  const [running, setRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const maxEpoch = 100;

  // Loss curve data
  const lossValues = useMemo(() => {
    return Array.from({ length: maxEpoch + 1 }, (_, e) => {
      return 4.5 * Math.exp(-e / 15) + 0.3 + Math.sin(e * 0.5) * 0.1 * Math.exp(-e / 30);
    });
  }, []);

  const handlePlay = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      if (epoch >= maxEpoch) setEpoch(0);
      setRunning(true);
    }
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setEpoch((e) => {
          if (e >= maxEpoch) {
            setRunning(false);
            return maxEpoch;
          }
          return e + 1;
        });
      }, 80);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width;
    const H = rect.height;
    const isDark = document.documentElement.classList.contains('dark');

    const halfW = W / 2;

    // === Left: Scatter plot ===
    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, halfW, H);

    // Points evolve from random to clustered
    const t = epoch / maxEpoch;
    const centers: [number, number, string][] = [
      [halfW * 0.3, H * 0.3, '#f97316'],
      [halfW * 0.7, H * 0.3, '#ef4444'],
      [halfW * 0.3, H * 0.7, '#3b82f6'],
      [halfW * 0.7, H * 0.7, '#ec4899'],
    ];

    const rng = seedRng(7);
    for (const [fx, fy, color] of centers) {
      const randCx = halfW * 0.5;
      const randCy = H * 0.5;
      const cx = randCx + (fx - randCx) * t;
      const cy = randCy + (fy - randCy) * t;
      const spread = 80 * (1 - t * 0.8);

      for (let i = 0; i < 6; i++) {
        const ox = (rng() - 0.5) * 2;
        const oy = (rng() - 0.5) * 2;
        const px = cx + ox * spread;
        const py = cy + oy * spread;
        ctx.fillStyle = color + (t > 0.3 ? 'ff' : '80');
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`Epoch ${epoch}/${maxEpoch}`, halfW / 2, H - 10);

    // === Right: Loss curve ===
    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.fillRect(halfW, 0, halfW, H);

    // Separator
    ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(halfW, H);
    ctx.stroke();

    const pad = 40;
    const chartX = halfW + pad;
    const chartW = halfW - 2 * pad;
    const chartY = pad;
    const chartH = H - 2 * pad;

    // Axes
    ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Epoch', chartX + chartW / 2, chartY + chartH + 24);
    ctx.save();
    ctx.translate(chartX - 24, chartY + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Loss', 0, 0);
    ctx.restore();

    // Loss curve
    const maxLoss = 5;
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let e = 0; e <= epoch; e++) {
      const x = chartX + (e / maxEpoch) * chartW;
      const y = chartY + chartH - (lossValues[e] / maxLoss) * chartH;
      if (e === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Current point
    if (epoch > 0) {
      const cx = chartX + (epoch / maxEpoch) * chartW;
      const cy = chartY + chartH - (lossValues[epoch] / maxLoss) * chartH;
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`Loss: ${lossValues[epoch].toFixed(3)}`, cx + 8, cy - 4);
    }

    // Y-axis ticks
    ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    for (let v = 0; v <= maxLoss; v++) {
      const y = chartY + chartH - (v / maxLoss) * chartH;
      ctx.fillText(v.toString(), chartX - 6, y + 3);
    }
  }, [epoch, lossValues]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            running
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-cyan-600 text-white hover:bg-cyan-700'
          }`}
        >
          {running ? '⏸ 暂停' : epoch >= maxEpoch ? '🔄 重来' : '▶ 开始训练'}
        </button>

        <input
          type="range"
          min="0"
          max={maxEpoch}
          value={epoch}
          onChange={(e) => { setRunning(false); setEpoch(Number(e.target.value)); }}
          className="flex-1 accent-cyan-600"
        />

        <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400">
          {epoch}/{maxEpoch}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <canvas ref={canvasRef} className="w-full" style={{ height: '340px' }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
          <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
            {lossValues[epoch].toFixed(3)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">当前 Loss</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {((1 - lossValues[epoch] / lossValues[0]) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Loss 下降幅度</div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400">
        <p>左图：词向量在 2D 空间中的位置随训练逐渐从<strong>随机分布</strong>收敛到<strong>语义聚类</strong>。</p>
        <p className="mt-1">右图：训练 Loss 曲线快速下降后趋于平缓——这就是 word2vec/GloVe 的典型训练轨迹。</p>
      </div>
    </div>
  );
}

// ============================================================
// Utility
// ============================================================

function seedRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
