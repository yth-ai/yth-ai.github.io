/**
 * Tab 1: 向量星图（Constellation View）
 *
 * Canvas 2D 渲染 + 动画过渡 + 搜索高亮 + 相似度弧线
 * 支持 PCA / t-SNE / UMAP 三种降维方法切换
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ALL_VECTORS, cosineSim, type WordVec, getCentroids } from './embeddingData';
import { pca2D, tsne2D, umap2D, normalize2D } from './reductionAlgorithms';
import { CATEGORIES, CAT_COLORS, type ReductionMethod, METHOD_LABELS } from './constants';

interface Point {
  x: number;
  y: number;
  word: string;
  cat: string;
  idx: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function ConstellationView() {
  const [method, setMethod] = useState<ReductionMethod>('tsne');
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(Object.keys(CATEGORIES)));
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [computing, setComputing] = useState(false);
  const [showEdges, setShowEdges] = useState(false);
  const [customWords, setCustomWords] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; word: string; cat: string; sim?: number } | null>(null);

  const pointsRef = useRef<Point[]>([]);
  const targetPointsRef = useRef<Point[]>([]);
  const animProgressRef = useRef(1);
  const prevPointsRef = useRef<Point[]>([]);
  const animFrameRef = useRef<number>(0);
  const [pointsVersion, setPointsVersion] = useState(0);

  const filteredVectors = useMemo(() => {
    const vecs = ALL_VECTORS.filter((v) => selectedCats.has(v.category));
    if (customWords.trim()) {
      const centroids = getCentroids();
      const words = customWords.split(/[,，\s]+/).filter(Boolean);
      for (const w of words) {
        let bestCat = 'tech';
        let bestDist = Infinity;
        for (const [cat, c] of Object.entries(centroids)) {
          if (!selectedCats.has(cat)) continue;
          const d = c.reduce((s, v) => s + v * v, 0);
          if (d < bestDist) { bestDist = d; bestCat = cat; }
        }
        const seed = w.split('').reduce((s, c) => s * 31 + c.charCodeAt(0), 0);
        let rng = seed;
        const nextR = () => { rng = (rng * 16807) % 2147483647; return (rng - 1) / 2147483646; };
        const centroid = centroids[bestCat] || centroids.tech;
        const vec = centroid.map((c: number) => c + (nextR() - 0.5) * 2);
        vecs.push({ word: w, category: bestCat, vec });
      }
    }
    return vecs;
  }, [selectedCats, customWords]);

  const computeReduction = useCallback(() => {
    if (filteredVectors.length < 3) {
      targetPointsRef.current = [];
      pointsRef.current = [];
      setPointsVersion((v) => v + 1);
      return;
    }
    setComputing(true);
    setTimeout(() => {
      const vecs = filteredVectors.map((v) => v.vec);
      let coords: number[][];
      switch (method) {
        case 'pca': coords = pca2D(vecs); break;
        case 'tsne': coords = tsne2D(vecs, 12, 350); break;
        case 'umap': coords = umap2D(vecs, 12, 150); break;
      }
      const normalized = normalize2D(coords);
      const newPoints: Point[] = normalized.map(([x, y], i) => ({
        x, y, word: filteredVectors[i].word, cat: filteredVectors[i].category, idx: i,
      }));
      prevPointsRef.current = [...pointsRef.current];
      targetPointsRef.current = newPoints;
      if (prevPointsRef.current.length === newPoints.length) {
        animProgressRef.current = 0;
      } else {
        pointsRef.current = newPoints;
        animProgressRef.current = 1;
      }
      setComputing(false);
      setPointsVersion((v) => v + 1);
    }, 30);
  }, [method, filteredVectors]);

  useEffect(() => { computeReduction(); }, [computeReduction]);

  const searchMatches = useMemo(() => {
    if (!searchTerm.trim()) return new Set<number>();
    const term = searchTerm.toLowerCase();
    const matches = new Set<number>();
    const pts = animProgressRef.current >= 1 ? targetPointsRef.current : pointsRef.current;
    pts.forEach((p, i) => { if (p.word.toLowerCase().includes(term)) matches.add(i); });
    return matches;
  }, [searchTerm, pointsVersion]);

  const neighbors = useMemo(() => {
    if (selected === null) return new Set<number>();
    const pts = targetPointsRef.current;
    if (!pts[selected]) return new Set<number>();
    const selVec = filteredVectors[pts[selected].idx]?.vec;
    if (!selVec) return new Set<number>();
    const sims = pts.map((p, i) => ({
      i, sim: i === selected ? -1 : cosineSim(selVec, filteredVectors[p.idx]?.vec || []),
    }));
    sims.sort((a, b) => b.sim - a.sim);
    return new Set(sims.slice(0, 5).map((s) => s.i));
  }, [selected, filteredVectors, pointsVersion]);

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let running = true;
    const render = () => {
      if (!running) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = rect.width, H = rect.height, pad = 50;
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 10; i++) {
        const x = pad + (i / 10) * (W - 2 * pad);
        const y = pad + (i / 10) * (H - 2 * pad);
        ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
      }
      if (animProgressRef.current < 1) {
        animProgressRef.current = Math.min(1, animProgressRef.current + 0.04);
        const t = easeInOutCubic(animProgressRef.current);
        const prev = prevPointsRef.current;
        const target = targetPointsRef.current;
        pointsRef.current = target.map((tp, i) => {
          const pp = prev[i] || tp;
          return { ...tp, x: pp.x + (tp.x - pp.x) * t, y: pp.y + (tp.y - pp.y) * t };
        });
      } else {
        pointsRef.current = targetPointsRef.current;
      }
      const points = pointsRef.current;
      const labelColor = isDark ? '#e2e8f0' : '#1e293b';
      const subtleColor = isDark ? '#64748b' : '#94a3b8';

      // Edges
      if (showEdges && points.length > 0) {
        ctx.lineWidth = 1;
        for (let i = 0; i < points.length; i++) {
          const pi = points[i];
          const viVec = filteredVectors[pi.idx]?.vec;
          if (!viVec) continue;
          const sims: { j: number; sim: number }[] = [];
          for (let j = i + 1; j < points.length; j++) {
            const vjVec = filteredVectors[points[j].idx]?.vec;
            if (!vjVec) continue;
            sims.push({ j, sim: cosineSim(viVec, vjVec) });
          }
          sims.sort((a, b) => b.sim - a.sim);
          for (const { j, sim } of sims.slice(0, 3)) {
            if (sim < 0.6) continue;
            const pj = points[j];
            const px1 = pad + pi.x * (W - 2 * pad), py1 = pad + pi.y * (H - 2 * pad);
            const px2 = pad + pj.x * (W - 2 * pad), py2 = pad + pj.y * (H - 2 * pad);
            const alpha = Math.round((sim - 0.6) / 0.4 * 40 + 10).toString(16).padStart(2, '0');
            ctx.strokeStyle = (isDark ? '#ffffff' : '#000000') + alpha;
            ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2); ctx.stroke();
          }
        }
      }

      // Neighbor connections
      if (selected !== null && points[selected]) {
        const sp = points[selected];
        const spx = pad + sp.x * (W - 2 * pad), spy = pad + sp.y * (H - 2 * pad);
        for (const ni of neighbors) {
          if (ni === selected || !points[ni]) continue;
          const np = points[ni];
          const npx = pad + np.x * (W - 2 * pad), npy = pad + np.y * (H - 2 * pad);
          ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(spx, spy); ctx.lineTo(npx, npy); ctx.stroke(); ctx.setLineDash([]);
          const selVec = filteredVectors[sp.idx]?.vec;
          const nVec = filteredVectors[np.idx]?.vec;
          if (selVec && nVec) {
            const sim = cosineSim(selVec, nVec);
            ctx.fillStyle = '#06b6d4'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(sim.toFixed(3), (spx + npx) / 2, (spy + npy) / 2 - 6);
          }
        }
      }

      // Points
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const px = pad + p.x * (W - 2 * pad), py = pad + p.y * (H - 2 * pad);
        const color = CAT_COLORS[p.cat] || '#94a3b8';
        const isHov = hovered === i, isSel = selected === i;
        const isNeighbor = neighbors.has(i), isSearchMatch = searchMatches.has(i);
        const dimmed = searchTerm.trim() && !isSearchMatch;
        if (isHov || isSel || isSearchMatch) {
          const grd = ctx.createRadialGradient(px, py, 0, px, py, isSearchMatch ? 16 : 22);
          grd.addColorStop(0, color + (isSearchMatch ? '60' : '80'));
          grd.addColorStop(1, color + '00');
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.arc(px, py, isSearchMatch ? 16 : 22, 0, Math.PI * 2); ctx.fill();
        }
        const radius = isHov || isSel ? 8 : isNeighbor || isSearchMatch ? 6 : 4;
        ctx.fillStyle = color + (dimmed ? '40' : 'ff');
        ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
        if (isSel) {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.stroke();
        }
        const showLabel = isHov || isSel || isNeighbor || isSearchMatch || points.length < 50;
        if (showLabel) {
          ctx.fillStyle = dimmed ? subtleColor + '60' : labelColor;
          ctx.font = (isHov || isSel) ? 'bold 13px system-ui' : '11px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(p.word, px, py - (radius + 5));
        }
      }
      ctx.fillStyle = subtleColor; ctx.font = '12px system-ui';
      ctx.textAlign = 'left'; ctx.fillText(`${METHOD_LABELS[method]} 投影`, pad, H - 12);
      ctx.textAlign = 'right';
      ctx.fillText(`${points.length} 个词向量`, W - pad, H - 12);
      if (animProgressRef.current < 1) animFrameRef.current = requestAnimationFrame(render);
    };
    animFrameRef.current = requestAnimationFrame(render);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [pointsVersion, hovered, selected, method, showEdges, searchTerm, searchMatches, neighbors, selectedCats, filteredVectors]);

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const pad = 50, W = rect.width, H = rect.height;
      const points = pointsRef.current;
      let closest = -1, minDist = 20;
      for (let i = 0; i < points.length; i++) {
        const px = pad + points[i].x * (W - 2 * pad);
        const py = pad + points[i].y * (H - 2 * pad);
        const d = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
        if (d < minDist) { minDist = d; closest = i; }
      }
      setHovered(closest >= 0 ? closest : null);
      if (closest >= 0) {
        const p = points[closest];
        let sim: number | undefined;
        if (selected !== null && selected !== closest) {
          const selVec = filteredVectors[pointsRef.current[selected]?.idx]?.vec;
          const hovVec = filteredVectors[p.idx]?.vec;
          if (selVec && hovVec) sim = cosineSim(selVec, hovVec);
        }
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, word: p.word, cat: p.cat, sim });
      } else { setTooltip(null); }
    }, [selected, filteredVectors],
  );

  const handleCanvasClick = useCallback(() => {
    if (hovered !== null) setSelected((prev) => (prev === hovered ? null : hovered));
    else setSelected(null);
  }, [hovered]);

  const toggleCat = (cat: string) => {
    setSelectedCats((prev) => { const next = new Set(prev); if (next.has(cat)) next.delete(cat); else next.add(cat); return next; });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
          {(['tsne', 'pca', 'umap'] as ReductionMethod[]).map((m) => (
            <button key={m} onClick={() => setMethod(m)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${method === m ? 'bg-cyan-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >{METHOD_LABELS[m]}</button>
          ))}
        </div>
        <input type="text" placeholder="搜索词语..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-36" />
        <input type="text" placeholder="添加自定义词（逗号分隔）" value={customWords} onChange={(e) => setCustomWords(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <input type="checkbox" checked={showEdges} onChange={(e) => setShowEdges(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500" />
          相似度连线
        </label>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(CATEGORIES).map(([key, info]) => (
          <button key={key} onClick={() => toggleCat(key)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${selectedCats.has(key) ? 'text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}
            style={selectedCats.has(key) ? { backgroundColor: CAT_COLORS[key] } : {}}
          >{info}</button>
        ))}
      </div>
      <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {computing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10">
            <div className="flex items-center gap-3 text-cyan-600 dark:text-cyan-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">正在计算 {METHOD_LABELS[method]} 降维...</span>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="w-full cursor-crosshair" style={{ height: '520px' }}
          onMouseMove={handleCanvasMove}
          onMouseLeave={() => { setHovered(null); setTooltip(null); }}
          onClick={handleCanvasClick} />
        {tooltip && (
          <div className="absolute pointer-events-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 shadow-xl z-20"
            style={{ left: Math.min(tooltip.x + 12, (canvasRef.current?.getBoundingClientRect().width || 600) - 160), top: tooltip.y - 50 }}>
            <div className="text-slate-900 dark:text-white font-medium text-sm">{tooltip.word}</div>
            <div className="text-xs flex items-center gap-1.5" style={{ color: CAT_COLORS[tooltip.cat] }}>
              {CATEGORIES[tooltip.cat]}
            </div>
            {tooltip.sim !== undefined && (
              <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-1 border-t border-slate-200 dark:border-slate-700 pt-1">
                cosine similarity: {tooltip.sim.toFixed(4)}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        点击选中一个词，查看 Top-5 最近邻和 cosine similarity。Hover 两个词可实时显示相似度。
      </p>
    </div>
  );
}
