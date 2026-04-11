/**
 * Embedding 全景工作台 — Tab2: 向量算术 (Vector Algebra)
 * king - man + woman = queen 经典演示 + 自由实验
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { CAT_COLORS, CANVAS_THEME, ANALOGY_PRESETS, CATEGORIES } from './constants';
import { ALL_VECTORS, vectorArithmetic, cosineSim, findNearest } from './embeddingData';
import { pca2D, normalize2D } from './reductionAlgorithms';

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function getCatColor(cat: string) { return CAT_COLORS[cat] || '#94a3b8'; }
function findVec(word: string) { return ALL_VECTORS.find((v) => v.word === word); }

const allWords = ALL_VECTORS.map((v) => v.word);

interface AlgebraResult {
  resultVec: number[];
  topK: { word: string; category: string; similarity: number }[];
  aWord: string;
  bWord: string;
  cWord: string;
}

export default function VectorAlgebra() {
  const [wordA, setWordA] = useState('');
  const [wordB, setWordB] = useState('');
  const [wordC, setWordC] = useState('');
  const [result, setResult] = useState<AlgebraResult | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dark = useDarkMode();

  const compute = useCallback(() => {
    const a = findVec(wordA);
    const b = findVec(wordB);
    const c = findVec(wordC);
    if (!a || !b || !c) { setResult(null); return; }
    const resultVec = vectorArithmetic(a.vec, b.vec, c.vec);
    const nearest = findNearest(resultVec, ALL_VECTORS, [wordA, wordB, wordC], 5);
    const topK = nearest.map((n) => ({ word: n.word, category: n.category, similarity: n.sim }));
    setResult({ resultVec, topK, aWord: wordA, bWord: wordB, cWord: wordC });
  }, [wordA, wordB, wordC]);

  const applyPreset = (idx: number) => {
    setSelectedPreset(idx);
    const p = ANALOGY_PRESETS[idx];
    setWordA(p.a);
    setWordB(p.b);
    setWordC(p.c);
  };

  useEffect(() => {
    if (wordA && wordB && wordC) compute();
  }, [wordA, wordB, wordC, compute]);

  // Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = 60;
    const theme = dark ? CANVAS_THEME.dark : CANVAS_THEME.light;

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 8; i++) {
      const x = pad + (i / 8) * (W - 2 * pad);
      const y = pad + (i / 8) * (H - 2 * pad);
      ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    }

    const a = findVec(result.aWord);
    const b = findVec(result.bWord);
    const c = findVec(result.cWord);
    if (!a || !b || !c) return;

    const allVecsArr = [a, b, c];
    const topKVecs = result.topK.map((t) => findVec(t.word)).filter(Boolean) as typeof ALL_VECTORS;
    allVecsArr.push(...topKVecs);

    const vecs = [...allVecsArr.map((v) => v.vec), result.resultVec];
    const coords2d = normalize2D(pca2D(vecs));

    const toScreen = (idx: number) => ({
      x: pad + coords2d[idx][0] * (W - 2 * pad),
      y: pad + coords2d[idx][1] * (H - 2 * pad),
    });

    const drawArrow = (fromIdx: number, toIdx: number, color: string, label: string) => {
      const f = toScreen(fromIdx);
      const t = toScreen(toIdx);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
      const angle = Math.atan2(t.y - f.y, t.x - f.x);
      const headLen = 10;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x - headLen * Math.cos(angle - 0.4), t.y - headLen * Math.sin(angle - 0.4));
      ctx.lineTo(t.x - headLen * Math.cos(angle + 0.4), t.y - headLen * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
      const mx = (f.x + t.x) / 2;
      const my = (f.y + t.y) / 2 - 8;
      ctx.fillStyle = color;
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(label, mx, my);
      ctx.restore();
    };

    drawArrow(0, 1, '#ef4444', '-' + result.bWord);
    drawArrow(1, 2, '#22c55e', '+' + result.cWord);
    const resultIdx = allVecsArr.length;
    drawArrow(0, resultIdx, '#f59e0b', '= ?');

    const drawPoint = (idx: number, word: string, cat: string, special?: string) => {
      const p = toScreen(idx);
      const color = special === 'result' ? '#f59e0b' : special === 'topk' ? '#38bdf8' : getCatColor(cat);
      const r = special === 'result' ? 8 : special === 'topk' ? 5 : 7;

      if (special === 'result') {
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        grd.addColorStop(0, color + '50');
        grd.addColorStop(1, color + '00');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme.text;
      ctx.font = special === 'result' ? 'bold 14px system-ui' : special === 'topk' ? '11px system-ui' : 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(word, p.x, p.y - r - 5);
    };

    drawPoint(0, result.aWord, a.category);
    drawPoint(1, result.bWord, b.category);
    drawPoint(2, result.cWord, c.category);
    for (let i = 0; i < topKVecs.length; i++) {
      drawPoint(3 + i, topKVecs[i].word, topKVecs[i].category, 'topk');
    }
    drawPoint(resultIdx, '?', '', 'result');

    ctx.fillStyle = theme.subtext;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(result.aWord + ' - ' + result.bWord + ' + ' + result.cWord + ' = ?   (PCA)', W / 2, H - 12);
  }, [result, dark]);

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">经典类比（点击尝试）</div>
        <div className="flex flex-wrap gap-2">
          {ANALOGY_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => applyPreset(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                selectedPreset === i
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-cyan-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Free input */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <WordSelect value={wordA} onChange={setWordA} label="A" color="#3b82f6" />
          <span className="text-xl font-bold text-slate-400">-</span>
          <WordSelect value={wordB} onChange={setWordB} label="B" color="#ef4444" />
          <span className="text-xl font-bold text-slate-400">+</span>
          <WordSelect value={wordC} onChange={setWordC} label="C" color="#22c55e" />
          <span className="text-xl font-bold text-slate-400">=</span>
          <span className="text-lg font-bold text-amber-500">?</span>
        </div>
      </div>

      {result && (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <canvas ref={canvasRef} className="w-full" style={{ height: '380px' }} />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Top-5 最近邻
            </h4>
            <div className="space-y-2">
              {result.topK.map((t, i) => (
                <div key={t.word} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="font-medium text-slate-900 dark:text-white text-sm">{t.word}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: getCatColor(t.category) + '20', color: getCatColor(t.category) }}>
                    {CATEGORIES[t.category] || t.category}
                  </span>
                  <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-mono">cos = {t.similarity.toFixed(4)}</span>
                  <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.max(0, t.similarity) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedPreset !== null && (
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-800/50 rounded-xl border border-cyan-200 dark:border-slate-700 p-4">
              <h4 className="text-sm font-semibold text-cyan-800 dark:text-cyan-300 mb-2">为什么这能工作？</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                向量算术的核心思想：在训练良好的 Embedding 空间中，语义关系被编码为向量方向。
                <strong> {result.aWord} - {result.bWord}</strong> 提取了语义差异方向，
                加到 <strong>{result.cWord}</strong> 上就能找到具有类似关系的词。
                这说明 Embedding 不仅捕获了词义，还捕获了词与词之间的<em>关系结构</em>。
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                注：本工具使用 50 维伪向量演示。预期答案方向：{ANALOGY_PRESETS[selectedPreset].expectedHint}
              </p>
            </div>
          )}
        </>
      )}

      {!result && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <div className="text-3xl mb-2">+/-</div>
          <p className="text-sm">选择一个预设或自由输入三个词来体验向量算术</p>
        </div>
      )}
    </div>
  );
}

function WordSelect({ value, onChange, label, color }: { value: string; onChange: (v: string) => void; label: string; color: string }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = filter ? allWords.filter((w) => w.includes(filter)) : allWords;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm hover:border-cyan-400 transition-colors min-w-[80px]"
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-medium text-slate-900 dark:text-white">{value || label}</span>
        <svg className="w-3 h-3 text-slate-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-48 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl">
          <input
            type="text"
            placeholder="筛选..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border-b border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none"
            autoFocus
          />
          {filtered.slice(0, 30).map((w) => (
            <button
              key={w}
              onClick={() => { onChange(w); setOpen(false); setFilter(''); }}
              className="w-full text-left px-3 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              {w}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
