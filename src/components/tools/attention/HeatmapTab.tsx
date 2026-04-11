import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { interpolateColor, type ColorScale } from './utils/color-scales';
import {
  PATTERN_CATALOG,
  generateAttentionPattern,
  generateMultiLayerAttention,
  classifyHeadPattern,
  type PatternType,
} from './utils/attention-patterns';

interface DemoSentence {
  sentence: string;
  tokens: string[];
}

const DEMO_SENTENCES: DemoSentence[] = [
  { sentence: '大语言模型正在改变人工智能的发展方向', tokens: ['大', '语言', '模型', '正在', '改变', '人工', '智能', '的', '发展', '方向'] },
  { sentence: 'The cat sat on the mat and looked at the bird', tokens: ['The', 'cat', 'sat', 'on', 'the', 'mat', 'and', 'looked', 'at', 'the', 'bird'] },
  { sentence: '预训练数据的质量直接决定了模型的性能上限', tokens: ['预', '训练', '数据', '的', '质量', '直接', '决定', '了', '模型', '的', '性能', '上限'] },
  { sentence: 'Attention is all you need for sequence modeling', tokens: ['Attention', 'is', 'all', 'you', 'need', 'for', 'sequence', 'modeling'] },
];

const N_LAYERS = 6;
const N_HEADS = 8;

type ViewMode = 'heatmap' | 'flow' | 'overview';

export default function HeatmapTab() {
  const [sentIdx, setSentIdx] = useState(0);
  const [customText, setCustomText] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [layerIdx, setLayerIdx] = useState(0);
  const [headIdx, setHeadIdx] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const [colorScale, setColorScale] = useState<ColorScale>('viridis');
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const flowCanvasRef = useRef<HTMLCanvasElement>(null);
  const overviewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Tokenize custom text
  const customTokens = useMemo(() => {
    if (!customText.trim()) return [];
    // Simple tokenization: split CJK chars individually, English by space
    const result: string[] = [];
    const parts = customText.trim().split(/(\s+)/);
    for (const part of parts) {
      if (/\s+/.test(part)) continue;
      // Split CJK
      const chars = [...part];
      let buf = '';
      for (const ch of chars) {
        if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch)) {
          if (buf) { result.push(buf); buf = ''; }
          result.push(ch);
        } else {
          buf += ch;
        }
      }
      if (buf) result.push(buf);
    }
    return result.slice(0, 20); // cap at 20 tokens
  }, [customText]);

  const tokens = useCustom && customTokens.length > 0 ? customTokens : DEMO_SENTENCES[sentIdx].tokens;

  // Generate all attention data
  const allAttention = useMemo(() => {
    return generateMultiLayerAttention(tokens, N_LAYERS, N_HEADS, sentIdx * 1000 + (useCustom ? 999 : 0));
  }, [tokens, sentIdx, useCustom]);

  const weights = allAttention[layerIdx][headIdx];

  // Head classification for current layer
  const headClassifications = useMemo(() => {
    return allAttention[layerIdx].map(hw => classifyHeadPattern(hw));
  }, [allAttention, layerIdx]);

  // Flow view rendering
  useEffect(() => {
    if (viewMode !== 'flow') return;
    const canvas = flowCanvasRef.current;
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
    const n = tokens.length;
    const leftX = 120;
    const rightX = W - 120;
    const topY = 40;
    const gap = (H - 2 * topY) / Math.max(n - 1, 1);

    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const w = weights[i][j];
        if (w < 0.02) continue;
        const alpha = Math.min(w * 2, 0.9);
        const lineWidth = w * 8;
        const y1 = topY + i * gap;
        const y2 = topY + j * gap;
        if (selectedToken !== null && selectedToken !== i) continue;

        ctx.strokeStyle = interpolateColor(colorScale, w);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(leftX + 10, y1);
        const cpx = (leftX + rightX) / 2;
        ctx.bezierCurveTo(cpx, y1, cpx, y2, rightX - 10, y2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Token labels
    const textColor = isDark ? '#e2e8f0' : '#334155';
    const dimColor = isDark ? '#64748b' : '#94a3b8';
    ctx.font = '13px system-ui';

    for (let i = 0; i < n; i++) {
      const y = topY + i * gap;
      const isSelected = selectedToken === i;
      ctx.fillStyle = isSelected ? '#60a5fa' : textColor;
      ctx.font = isSelected ? 'bold 14px system-ui' : '13px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(tokens[i], leftX - 5, y + 4);
      ctx.fillStyle = isSelected ? '#3b82f6' : dimColor;
      ctx.beginPath(); ctx.arc(leftX + 5, y, 4, 0, Math.PI * 2); ctx.fill();
    }

    ctx.textAlign = 'left';
    for (let i = 0; i < n; i++) {
      const y = topY + i * gap;
      ctx.fillStyle = textColor;
      ctx.font = '13px system-ui';
      ctx.fillText(tokens[i], rightX + 10, y + 4);
      ctx.fillStyle = dimColor;
      ctx.beginPath(); ctx.arc(rightX - 5, y, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Labels
    ctx.fillStyle = dimColor;
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Query', leftX, 20);
    ctx.fillText('Key', rightX, 20);
  }, [viewMode, weights, tokens, colorScale, selectedToken]);

  // Overview (bird's-eye) rendering
  useEffect(() => {
    if (viewMode !== 'overview') return;
    const canvas = overviewCanvasRef.current;
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
    const isDark = document.documentElement.classList.contains('dark');

    ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const n = tokens.length;
    const pad = 40;
    const cellW = (W - pad * 2) / N_HEADS;
    const cellH = (H - pad * 2) / N_LAYERS;
    const innerPad = 3;

    // Layer labels
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';
    for (let l = 0; l < N_LAYERS; l++) {
      ctx.fillText(`L${l}`, pad - 5, pad + cellH * l + cellH / 2 + 3);
    }

    // Head labels
    ctx.textAlign = 'center';
    for (let h = 0; h < N_HEADS; h++) {
      ctx.fillText(`H${h}`, pad + cellW * h + cellW / 2, pad - 8);
    }

    // Draw mini heatmaps
    for (let l = 0; l < N_LAYERS; l++) {
      for (let h = 0; h < N_HEADS; h++) {
        const x0 = pad + cellW * h + innerPad;
        const y0 = pad + cellH * l + innerPad;
        const w = cellW - innerPad * 2;
        const hh = cellH - innerPad * 2;
        const hw = allAttention[l][h];
        const pixW = w / n;
        const pixH = hh / n;

        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            ctx.fillStyle = interpolateColor(colorScale, hw[i][j]);
            ctx.fillRect(x0 + j * pixW, y0 + i * pixH, pixW + 0.5, pixH + 0.5);
          }
        }

        // Highlight current selection
        if (l === layerIdx && h === headIdx) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.strokeRect(x0 - 1, y0 - 1, w + 2, hh + 2);
        }
      }
    }
  }, [viewMode, allAttention, layerIdx, headIdx, colorScale, tokens]);

  const handleFlowClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = flowCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const my = e.clientY - rect.top;
      const n = tokens.length;
      const topY = 40;
      const gap = (rect.height - 2 * topY) / Math.max(n - 1, 1);
      let closest = -1;
      let minDist = 15;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(my - (topY + i * gap));
        if (d < minDist) { minDist = d; closest = i; }
      }
      setSelectedToken(prev => prev === closest ? null : closest);
    },
    [tokens],
  );

  const handleOverviewClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = overviewCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pad = 40;
      const cellW = (rect.width - pad * 2) / N_HEADS;
      const cellH = (rect.height - pad * 2) / N_LAYERS;
      const h = Math.floor((x - pad) / cellW);
      const l = Math.floor((y - pad) / cellH);
      if (h >= 0 && h < N_HEADS && l >= 0 && l < N_LAYERS) {
        setLayerIdx(l);
        setHeadIdx(h);
      }
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* Input section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setUseCustom(false)}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              !useCustom ? 'bg-purple-500 text-white border-purple-500' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
            }`}
          >
            示例句子
          </button>
          <button
            onClick={() => setUseCustom(true)}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              useCustom ? 'bg-purple-500 text-white border-purple-500' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
            }`}
          >
            自定义输入
          </button>
        </div>

        {useCustom ? (
          <input
            type="text"
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder="输入句子，按空格和汉字自动分词（最多 20 tokens）..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        ) : (
          <select
            value={sentIdx}
            onChange={e => { setSentIdx(Number(e.target.value)); setSelectedToken(null); }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            {DEMO_SENTENCES.map((s, i) => (
              <option key={i} value={i}>{s.sentence}</option>
            ))}
          </select>
        )}

        {/* Token pills */}
        <div className="mt-3 flex flex-wrap gap-1">
          {tokens.map((tok, i) => (
            <span
              key={i}
              onClick={() => setSelectedToken(prev => prev === i ? null : i)}
              className={`px-2 py-0.5 rounded text-xs cursor-pointer transition-all ${
                selectedToken === i
                  ? 'bg-purple-500 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-slate-600'
              }`}
            >
              {tok}
            </span>
          ))}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* View mode */}
        <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
          {([['heatmap', '热力图'], ['flow', '流向图'], ['overview', '全景鸟瞰']] as [ViewMode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === m
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Layer selector */}
        {viewMode !== 'overview' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Layer</span>
            <div className="flex gap-0.5">
              {Array.from({ length: N_LAYERS }, (_, l) => (
                <button
                  key={l}
                  onClick={() => setLayerIdx(l)}
                  className={`w-7 h-6 text-xs rounded transition-colors ${
                    layerIdx === l
                      ? 'bg-purple-500 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color scale */}
        <select
          value={colorScale}
          onChange={e => setColorScale(e.target.value as ColorScale)}
          className="px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
        >
          {(['viridis', 'magma', 'inferno', 'plasma', 'blues', 'reds'] as ColorScale[]).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Main visualization */}
      {viewMode === 'heatmap' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="flex">
              <div className="w-20 shrink-0" />
              {tokens.map((tok, j) => (
                <div key={j} className="flex-1 text-center text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 truncate px-0.5" title={tok}>
                  {tok}
                </div>
              ))}
            </div>

            {tokens.map((rowTok, i) => (
              <div key={i} className="flex items-center">
                <div className="w-20 shrink-0 text-right pr-3 text-xs font-medium text-slate-500 dark:text-slate-400 truncate" title={rowTok}>{rowTok}</div>
                {tokens.map((_, j) => {
                  const w = weights[i][j];
                  const isHov = hoveredCell?.i === i && hoveredCell?.j === j;
                  const isRowSelected = selectedToken === i;
                  return (
                    <div
                      key={j}
                      className="flex-1 aspect-square m-0.5 rounded-sm cursor-crosshair relative transition-transform"
                      style={{
                        backgroundColor: interpolateColor(colorScale, w),
                        opacity: selectedToken !== null && !isRowSelected ? 0.3 : 1,
                        transform: isHov ? 'scale(1.2)' : 'scale(1)',
                        zIndex: isHov ? 10 : 1,
                      }}
                      onMouseEnter={() => setHoveredCell({ i, j })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${rowTok} → ${tokens[j]}: ${(w * 100).toFixed(1)}%`}
                    >
                      {isHov && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 shadow-lg">
                          {(w * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            <div className="flex mt-3">
              <div className="w-20 shrink-0 text-right pr-3 text-xs text-slate-400">Query ↓</div>
              <div className="flex-1 text-center text-xs text-slate-400">Key →</div>
            </div>

            <div className="flex items-center gap-2 mt-4 justify-center">
              <span className="text-xs text-slate-400">0%</span>
              <div className="flex h-3 rounded overflow-hidden" style={{ width: 200 }}>
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: interpolateColor(colorScale, i / 19) }} />
                ))}
              </div>
              <span className="text-xs text-slate-400">100%</span>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'flow' && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <canvas
            ref={flowCanvasRef}
            className="w-full cursor-pointer"
            style={{ height: Math.max(400, tokens.length * 40) }}
            onClick={handleFlowClick}
          />
          <div className="px-4 py-2 text-xs text-slate-500 text-center">点击左侧 Query token 查看注意力分布</div>
        </div>
      )}

      {viewMode === 'overview' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {N_LAYERS} 层 × {N_HEADS} 头鸟瞰图 — 点击任意格子切换到对应层头的详细视图
          </div>
          <canvas
            ref={overviewCanvasRef}
            className="w-full cursor-pointer rounded-lg"
            style={{ height: 320 }}
            onClick={handleOverviewClick}
          />
        </div>
      )}

      {/* Head analysis cards */}
      {viewMode !== 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {Array.from({ length: N_HEADS }, (_, hi) => {
            const cls = headClassifications[hi];
            const patternInfo = PATTERN_CATALOG.find(p => p.id === cls.type);
            const hw = allAttention[layerIdx][hi];
            // Entropy
            let totalEntropy = 0;
            for (const row of hw) {
              let h = 0;
              for (const w of row) { if (w > 1e-10) h -= w * Math.log2(w); }
              totalEntropy += h;
            }
            const avgEntropy = totalEntropy / hw.length;
            const maxEntropy = Math.log2(tokens.length);
            const focus = 1 - avgEntropy / maxEntropy;

            return (
              <button
                key={hi}
                onClick={() => setHeadIdx(hi)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  headIdx === hi
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">H{hi}</div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                  {patternInfo?.label || cls.type}
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${focus * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-400">{(focus * 100).toFixed(0)}%</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Explanation */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-purple-200 dark:border-slate-700 p-5">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">模拟 vs 真实注意力</h4>
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
          <p>本工具展示的是 8 种模式的<strong>模拟注意力权重</strong>，基于启发式规则生成。真实模型中，每层每头的模式由训练数据和损失函数共同决定。</p>
          <p>观察重点：浅层（L0-L2）倾向局部/句法模式，深层（L3-L5）倾向全局/语义模式——这是真实模型中反复被验证的规律。</p>
          <p>Head 分类基于三个特征自动判断：<strong>熵</strong>（分散度）、<strong>对角线集中度</strong>（自指程度）、<strong>首 token 吸引度</strong>（Sink 特征）。</p>
        </div>
      </div>
    </div>
  );
}
