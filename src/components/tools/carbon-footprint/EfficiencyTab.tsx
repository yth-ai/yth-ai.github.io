import { useState, useMemo } from 'react';
import { AI_MODELS, CARBON_INTENSITY } from './data';

// SVG Scatter plot: Carbon (X) vs Capability (Y), bubble size = price
function ScatterPlot({ region }: { region: string }) {
  const regionInfo = CARBON_INTENSITY[region];
  const padding = { top: 30, right: 30, bottom: 50, left: 55 };
  const w = 520, h = 340;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  const dataPoints = AI_MODELS.map(m => ({
    ...m,
    co2PerMToken: m.energyPerMToken * regionInfo.gCO2perKWh,
    bubbleR: Math.max(Math.sqrt(m.pricePerMToken) * 2.5, 5),
  }));

  const maxCO2 = Math.max(...dataPoints.map(d => d.co2PerMToken)) * 1.15;
  const minCap = Math.min(...dataPoints.map(d => d.capabilityScore)) - 5;
  const maxCap = Math.max(...dataPoints.map(d => d.capabilityScore)) + 3;

  const xScale = (v: number) => padding.left + (v / maxCO2) * plotW;
  const yScale = (v: number) => padding.top + plotH - ((v - minCap) / (maxCap - minCap)) * plotH;

  const greenX1 = xScale(0);
  const greenX2 = xScale(maxCO2 * 0.4);
  const greenY1 = yScale(maxCap);
  const greenY2 = yScale((minCap + maxCap) / 2);

  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: 600 }}>
      {/* Green efficient zone */}
      <rect x={greenX1} y={greenY1} width={greenX2 - greenX1} height={greenY2 - greenY1}
        fill="#22c55e" opacity={0.08} rx={6} />
      <text x={greenX1 + 8} y={greenY1 + 16} fill="#22c55e" fontSize={10} opacity={0.6}>
        绿色高效区
      </text>

      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const x = padding.left + t * plotW;
        const y = padding.top + t * plotH;
        return (
          <g key={t}>
            <line x1={x} y1={padding.top} x2={x} y2={padding.top + plotH}
              stroke="currentColor" strokeOpacity={0.08} strokeDasharray="2,3" />
            <line x1={padding.left} y1={y} x2={padding.left + plotW} y2={y}
              stroke="currentColor" strokeOpacity={0.08} strokeDasharray="2,3" />
          </g>
        );
      })}

      {/* Axes */}
      <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH}
        stroke="currentColor" strokeOpacity={0.2} />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH}
        stroke="currentColor" strokeOpacity={0.2} />

      {/* X labels */}
      {[0, maxCO2 * 0.25, maxCO2 * 0.5, maxCO2 * 0.75, maxCO2].map((v, i) => (
        <text key={i} x={xScale(v)} y={padding.top + plotH + 18} textAnchor="middle"
          fill="currentColor" opacity={0.4} fontSize={10}>
          {v.toFixed(0)}
        </text>
      ))}
      <text x={padding.left + plotW / 2} y={h - 5} textAnchor="middle"
        fill="currentColor" opacity={0.5} fontSize={11}>
        碳排放 (gCO₂/1M tokens)
      </text>

      {/* Y labels */}
      {[minCap, (minCap + maxCap) / 2, maxCap].map((v, i) => (
        <text key={i} x={padding.left - 8} y={yScale(v) + 4} textAnchor="end"
          fill="currentColor" opacity={0.4} fontSize={10}>
          {Math.round(v)}
        </text>
      ))}
      <text x={15} y={padding.top + plotH / 2} textAnchor="middle"
        fill="currentColor" opacity={0.5} fontSize={11}
        transform={`rotate(-90, 15, ${padding.top + plotH / 2})`}>
        能力评分
      </text>

      {/* Data points */}
      {dataPoints.map(d => {
        const cx = xScale(d.co2PerMToken);
        const cy = yScale(d.capabilityScore);
        const isHovered = hoveredModel === d.id;
        return (
          <g key={d.id}
            onMouseEnter={() => setHoveredModel(d.id)}
            onMouseLeave={() => setHoveredModel(null)}
            style={{ cursor: 'pointer' }}>
            <circle cx={cx} cy={cy} r={isHovered ? d.bubbleR + 3 : d.bubbleR}
              fill={d.color} opacity={isHovered ? 0.9 : 0.7}
              stroke={isHovered ? '#fff' : 'none'} strokeWidth={2}
              style={{ transition: 'all 0.2s' }} />
            <text x={cx} y={cy - d.bubbleR - 4} textAnchor="middle"
              fill="currentColor" opacity={isHovered ? 0.9 : 0.5} fontSize={9}
              style={{ transition: 'opacity 0.2s' }}>
              {d.name}
            </text>
            {isHovered && (
              <g>
                <rect x={cx + d.bubbleR + 6} y={cy - 30} width={150} height={52} rx={6}
                  fill="rgba(15,23,42,0.92)" />
                <text x={cx + d.bubbleR + 14} y={cy - 14} fill="#fff" fontSize={10} fontWeight="bold">
                  {d.name}
                </text>
                <text x={cx + d.bubbleR + 14} y={cy} fill="#94a3b8" fontSize={9}>
                  {d.co2PerMToken.toFixed(1)} gCO₂ · 能力 {d.capabilityScore}
                </text>
                <text x={cx + d.bubbleR + 14} y={cy + 14} fill="#94a3b8" fontSize={9}>
                  ${d.pricePerMToken}/1M tokens{d.isMoE ? ' · MoE' : ''}
                </text>
              </g>
            )}
          </g>
        );
      })}

      <text x={w - padding.right} y={padding.top + 10} textAnchor="end"
        fill="currentColor" opacity={0.35} fontSize={9}>
        气泡大小 = 价格
      </text>
    </svg>
  );
}

export default function EfficiencyTab() {
  const [region, setRegion] = useState('us');
  const regionInfo = CARBON_INTENSITY[region];

  const modelTable = useMemo(() => {
    return AI_MODELS
      .map(m => ({
        ...m,
        co2: m.energyPerMToken * regionInfo.gCO2perKWh,
        efficiency: m.capabilityScore / (m.energyPerMToken * regionInfo.gCO2perKWh),
      }))
      .sort((a, b) => b.efficiency - a.efficiency);
  }, [regionInfo]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">模型效能全景图</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          X 轴碳排放、Y 轴能力评分、气泡大小代表价格——找到绿色高效区
        </p>
      </div>

      {/* Region selector */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">区域：</span>
        {Object.entries(CARBON_INTENSITY).map(([key, info]) => (
          <button key={key} onClick={() => setRegion(key)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              region === key
                ? 'text-white font-medium shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={region === key ? { backgroundColor: info.color } : undefined}>
            {info.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Scatter plot */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex justify-center">
        <ScatterPlot region={region} />
      </div>

      {/* Efficiency ranking table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">模型</th>
              <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">能力</th>
              <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">gCO₂/1M</th>
              <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">$/1M</th>
              <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">效能比</th>
            </tr>
          </thead>
          <tbody>
            {modelTable.map((m, i) => (
              <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: m.color }} />
                  {m.name}
                  {m.isMoE && <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">MoE</span>}
                  {i === 0 && <span className="ml-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">最佳</span>}
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{m.capabilityScore}</td>
                <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{m.co2.toFixed(1)}</td>
                <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">${m.pricePerMToken}</td>
                <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{m.efficiency.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        效能比 = 能力评分 ÷ 碳排放 (gCO₂/1M tokens)。越高越好。能力评分为 MMLU/Arena ELO 综合简化指标，仅供相对参考。
      </p>
    </div>
  );
}
