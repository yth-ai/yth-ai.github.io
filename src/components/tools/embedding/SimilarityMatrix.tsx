/**
 * Tab 3: 相似度矩阵（Similarity Matrix）
 *
 * N×N cosine similarity 热力图，支持预设对比组和自选词
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ALL_VECTORS, cosineSim } from './embeddingData';
import { CATEGORIES, CAT_COLORS } from './constants';

interface Preset { label: string; words: string[]; description: string; }

const PRESETS: Preset[] = [
  { label: '情感光谱', words: ['快乐', '悲伤', '愤怒', '恐惧', '惊讶', '期待', '信任', '厌恶', '温暖', '孤独', '焦虑', '平静'], description: '12 种情感词之间的语义距离' },
  { label: '技术栈', words: ['算法', '模型', '训练', '推理', '参数', '梯度', '损失', '优化', '网络', '注意力', 'Transformer', '微调'], description: 'AI/ML 核心术语的语义关系' },
  { label: '动物 vs 食物', words: ['猫', '狗', '鱼', '鸟', '虎', '象', '米饭', '面条', '苹果', '蛋糕', '寿司', '披萨'], description: '跨类别相似度分布' },
  { label: '职业全景', words: ['程序员', '医生', '教师', '律师', '工程师', '科学家', '画家', '记者', '厨师', '飞行员', '建筑师', '音乐家'], description: '12 种职业的语义关系' },
  { label: '自然元素', words: ['山', '水', '河', '海', '云', '风', '雨', '雪', '森林', '草原', '沙漠', '冰川'], description: '自然界元素的语义距离图' },
  { label: '跨域混合', words: ['猫', '快乐', '算法', '山', '足球', '程序员', '诗词', '蛋糕', '论文', '电影'], description: '9 个类别各取代表词' },
];

function simToColor(sim: number, isDark: boolean): string {
  const t = Math.max(0, Math.min(1, sim));
  if (t < 0.25) { const s = t / 0.25; return isDark ? `rgb(${30+s*10},${41+s*30},${59+s*80})` : `rgb(${219-s*30},${234-s*20},${254-s*40})`; }
  if (t < 0.5) { const s = (t - 0.25) / 0.25; return isDark ? `rgb(${40+s*20},${71+s*60},${139-s*20})` : `rgb(${189-s*50},${214-s*40},${214-s*60})`; }
  if (t < 0.75) { const s = (t - 0.5) / 0.25; return isDark ? `rgb(${60+s*100},${131+s*60},${119-s*70})` : `rgb(${139+s*60},${174-s*50},${154-s*80})`; }
  const s = (t - 0.75) / 0.25;
  return isDark ? `rgb(${160+s*80},${191-s*80},${49-s*20})` : `rgb(${199+s*56},${124-s*70},${74-s*50})`;
}

function avgSim(mat: number[][]): number {
  const n = mat.length; if (n < 2) return 0;
  let sum = 0, count = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { sum += mat[i][j]; count++; }
  return sum / count;
}

function topPair(mat: number[][], infos: { word: string }[], isMax: boolean): string {
  const n = mat.length; if (n < 2) return '-';
  let best = isMax ? -Infinity : Infinity; let bi = 0, bj = 1;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (isMax ? mat[i][j] > best : mat[i][j] < best) { best = mat[i][j]; bi = i; bj = j; }
  }
  return `${infos[bi].word} ↔ ${infos[bj].word}`;
}

export default function SimilarityMatrix() {
  const [activePreset, setActivePreset] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customSelection, setCustomSelection] = useState<string[]>([]);
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);
  const [sorted, setSorted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const words = useMemo(() => customMode ? customSelection : PRESETS[activePreset].words, [customMode, customSelection, activePreset]);

  const { matrix, wordInfos, sortedIndices } = useMemo(() => {
    const infos = words.map((w) => { const v = ALL_VECTORS.find((v) => v.word === w); return { word: w, vec: v?.vec || [], category: v?.category || 'tech' }; });
    const n = infos.length;
    const mat: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) mat[i][j] = i === j ? 1 : cosineSim(infos[i].vec, infos[j].vec);
    const avg = mat.map((row) => row.reduce((s, v) => s + v, 0) / n);
    const sortIdx = Array.from({ length: n }, (_, i) => i).sort((a, b) => avg[b] - avg[a]);
    return { matrix: mat, wordInfos: infos, sortedIndices: sortIdx };
  }, [words]);

  const displayIndices = sorted ? sortedIndices : Array.from({ length: words.length }, (_, i) => i);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || words.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width, H = rect.height;
    const isDark = document.documentElement.classList.contains('dark');
    const n = words.length;
    const labelW = 60;
    const cellSize = Math.min((W - labelW - 20) / n, (H - labelW - 20) / n, 50);
    const gridW = cellSize * n;
    const offsetX = labelW + (W - labelW - gridW) / 2;
    const offsetY = labelW + (H - labelW - gridW) / 2;

    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc'; ctx.fillRect(0, 0, W, H);

    for (let ri = 0; ri < n; ri++) for (let ci = 0; ci < n; ci++) {
      const i = displayIndices[ri], j = displayIndices[ci];
      const sim = matrix[i][j];
      const x = offsetX + ci * cellSize, y = offsetY + ri * cellSize;
      ctx.fillStyle = simToColor(sim, isDark);
      ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
      if (hoveredCell && hoveredCell.i === ri && hoveredCell.j === ci) {
        ctx.strokeStyle = isDark ? '#ffffff' : '#000000'; ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
      }
      if (cellSize >= 35) {
        ctx.fillStyle = sim > 0.5 ? '#ffffff' : (isDark ? '#e2e8f0' : '#1e293b');
        ctx.font = `${Math.min(10, cellSize / 4)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(sim.toFixed(2), x + cellSize / 2, y + cellSize / 2);
      }
    }

    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let ri = 0; ri < n; ri++) {
      const i = displayIndices[ri];
      ctx.fillStyle = CAT_COLORS[wordInfos[i].category] || (isDark ? '#e2e8f0' : '#1e293b');
      ctx.font = '11px system-ui';
      ctx.fillText(wordInfos[i].word, offsetX - 6, offsetY + ri * cellSize + cellSize / 2);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (let ci = 0; ci < n; ci++) {
      const j = displayIndices[ci];
      const x = offsetX + ci * cellSize + cellSize / 2;
      ctx.save(); ctx.translate(x, offsetY - 6); ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = CAT_COLORS[wordInfos[j].category] || (isDark ? '#e2e8f0' : '#1e293b');
      ctx.font = '11px system-ui'; ctx.textAlign = 'left'; ctx.fillText(wordInfos[j].word, 0, 0); ctx.restore();
    }

    const barX = offsetX + gridW + 16, barY = offsetY, barW = 14, barH = Math.min(gridW, 200);
    for (let i = 0; i < barH; i++) { ctx.fillStyle = simToColor(1 - i / barH, isDark); ctx.fillRect(barX, barY + i, barW, 1); }
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b'; ctx.font = '10px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('1.0', barX + barW + 4, barY); ctx.fillText('0.5', barX + barW + 4, barY + barH / 2); ctx.fillText('0.0', barX + barW + 4, barY + barH - 10);
  }, [words, matrix, wordInfos, displayIndices, sorted, hoveredCell]);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const n = words.length, labelW = 60;
    const cellSize = Math.min((rect.width - labelW - 20) / n, (rect.height - labelW - 20) / n, 50);
    const gridW = cellSize * n;
    const offsetX = labelW + (rect.width - labelW - gridW) / 2;
    const offsetY = labelW + (rect.height - labelW - gridW) / 2;
    const ci = Math.floor((mx - offsetX) / cellSize), ri = Math.floor((my - offsetY) / cellSize);
    if (ci >= 0 && ci < n && ri >= 0 && ri < n) setHoveredCell({ i: ri, j: ci });
    else setHoveredCell(null);
  }, [words]);

  const toggleWord = (word: string) => {
    setCustomSelection((prev) => prev.includes(word) ? prev.filter((w) => w !== word) : prev.length >= 16 ? prev : [...prev, word]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => { setCustomMode(false); setActivePreset(i); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!customMode && activePreset === i ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
          >{p.label}</button>
        ))}
        <button onClick={() => setCustomMode(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${customMode ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        >自选</button>
        <div className="ml-auto">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input type="checkbox" checked={sorted} onChange={(e) => setSorted(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500" />
            聚类排序
          </label>
        </div>
      </div>

      {!customMode && <p className="text-xs text-slate-500 dark:text-slate-400">{PRESETS[activePreset].description}</p>}

      {customMode && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">点选词语构建矩阵（最多 16 个）：</p>
          <div className="space-y-2">
            {Object.entries(CATEGORIES).map(([cat, info]) => {
              const catWords = ALL_VECTORS.filter((v) => v.category === cat).map((v) => v.word);
              return (
                <div key={cat} className="flex flex-wrap gap-1 items-center">
                  <span className="text-xs w-10 shrink-0" style={{ color: CAT_COLORS[cat] }}>{info}</span>
                  {catWords.map((w) => (
                    <button key={w} onClick={() => toggleWord(w)}
                      className={`px-2 py-0.5 rounded text-xs transition-all ${customSelection.includes(w) ? 'text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                      style={customSelection.includes(w) ? { backgroundColor: CAT_COLORS[cat] } : {}}
                    >{w}</button>
                  ))}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2">已选 {customSelection.length}/16</p>
        </div>
      )}

      <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <canvas ref={canvasRef} className="w-full" style={{ height: '480px' }} onMouseMove={handleCanvasMove} onMouseLeave={() => setHoveredCell(null)} />
        {hoveredCell && (
          <div className="absolute bottom-3 left-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 shadow-lg text-xs">
            <span style={{ color: CAT_COLORS[wordInfos[displayIndices[hoveredCell.i]]?.category] }}>{wordInfos[displayIndices[hoveredCell.i]]?.word}</span>
            <span className="text-slate-400 mx-1.5">↔</span>
            <span style={{ color: CAT_COLORS[wordInfos[displayIndices[hoveredCell.j]]?.category] }}>{wordInfos[displayIndices[hoveredCell.j]]?.word}</span>
            <span className="ml-2 font-mono text-cyan-600 dark:text-cyan-400">{matrix[displayIndices[hoveredCell.i]][displayIndices[hoveredCell.j]].toFixed(4)}</span>
          </div>
        )}
      </div>

      {words.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
            <div className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{avgSim(matrix).toFixed(4)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">平均相似度</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
            <div className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 truncate">{topPair(matrix, wordInfos, true)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">最相似词对</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
            <div className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 truncate">{topPair(matrix, wordInfos, false)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">最不相似词对</div>
          </div>
        </div>
      )}
    </div>
  );
}
