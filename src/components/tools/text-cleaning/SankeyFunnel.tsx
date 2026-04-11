// ============================================================
// Sankey 漏斗图 — SVG 实现
// ============================================================

import { useMemo } from 'react';
import type { PipelineResult } from './types';

interface Props {
  results: PipelineResult[];
  inputLength: number;
}

const STEP_COLORS: Record<string, string> = {
  rose: '#f43f5e', blue: '#3b82f6', indigo: '#6366f1', amber: '#f59e0b',
  teal: '#14b8a6', cyan: '#06b6d4', slate: '#64748b', orange: '#f97316',
  red: '#ef4444', violet: '#8b5cf6', emerald: '#10b981', pink: '#ec4899',
};

export default function SankeyFunnel({ results, inputLength }: Props) {
  const data = useMemo(() => {
    if (results.length === 0 || inputLength === 0) return [];

    const points: { label: string; chars: number; color: string; ratio: number }[] = [
      { label: '原始', chars: inputLength, color: '#94a3b8', ratio: 1 },
    ];

    for (const r of results) {
      const remaining = r.output.length;
      points.push({
        label: r.step.name.length > 6 ? r.step.name.slice(0, 6) : r.step.name,
        chars: remaining,
        color: STEP_COLORS[r.step.color] || '#64748b',
        ratio: remaining / inputLength,
      });
    }

    return points;
  }, [results, inputLength]);

  if (data.length < 2) return null;

  const width = 800;
  const height = 100;
  const padding = 20;
  const barWidth = Math.min(60, (width - padding * 2) / data.length - 8);
  const gap = (width - padding * 2 - barWidth * data.length) / (data.length - 1);
  const maxBarH = height - 40;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px]" preserveAspectRatio="xMidYMid meet">
        {data.map((d, i) => {
          const x = padding + i * (barWidth + gap);
          const barH = Math.max(4, d.ratio * maxBarH);
          const y = height - 16 - barH;

          // Draw flow path to next bar
          const nextPath = i < data.length - 1 ? (() => {
            const nextD = data[i + 1];
            const nextX = padding + (i + 1) * (barWidth + gap);
            const nextBarH = Math.max(4, nextD.ratio * maxBarH);
            const nextY = height - 16 - nextBarH;
            return `M ${x + barWidth} ${y} L ${nextX} ${nextY} L ${nextX} ${height - 16} L ${x + barWidth} ${height - 16} Z`;
          })() : null;

          return (
            <g key={i}>
              {nextPath && (
                <path
                  d={nextPath}
                  fill={d.color}
                  opacity={0.15}
                />
              )}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={3}
                fill={d.color}
                opacity={0.8}
              />
              <text
                x={x + barWidth / 2}
                y={height - 4}
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400"
                fontSize={9}
              >
                {d.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300"
                fontSize={8}
                fontWeight={600}
              >
                {d.ratio < 0.01 ? '<1%' : `${(d.ratio * 100).toFixed(0)}%`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
