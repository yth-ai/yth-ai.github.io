import { useMemo } from 'react';

// ============================================================
// 五维雷达图 (SVG)
// ============================================================

interface RadarChartProps {
  dimensions: {
    clarity: number;
    structure: number;
    guidance: number;
    robustness: number;
    efficiency: number;
  };
  size?: number;
  color?: string;
  label?: string;
}

const LABELS = ['清晰度', '结构性', '引导性', '鲁棒性', '效率'];
const KEYS: (keyof RadarChartProps['dimensions'])[] = ['clarity', 'structure', 'guidance', 'robustness', 'efficiency'];

export default function RadarChart({ dimensions, size = 200, color = '#f59e0b', label }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const levels = 4;

  const angles = useMemo(() =>
    KEYS.map((_, i) => (Math.PI * 2 * i) / KEYS.length - Math.PI / 2),
    []
  );

  const getPoint = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  // Grid rings
  const rings = Array.from({ length: levels }, (_, i) => {
    const r = maxR * ((i + 1) / levels);
    const points = angles.map(a => getPoint(a, r));
    return points.map(p => `${p.x},${p.y}`).join(' ');
  });

  // Axis lines
  const axisLines = angles.map(a => getPoint(a, maxR));

  // Data polygon
  const values = KEYS.map(k => dimensions[k]);
  const dataPoints = values.map((v, i) => {
    const r = (v / 20) * maxR;
    return getPoint(angles[i], r);
  });
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Label positions
  const labelPositions = angles.map((a, i) => {
    const p = getPoint(a, maxR + 22);
    return { ...p, label: LABELS[i], value: values[i] };
  });

  return (
    <div className="flex flex-col items-center">
      {label && <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</div>}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {rings.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth="0.5"
          />
        ))}

        {/* Axes */}
        {axisLines.map((p, i) => (
          <line
            key={i}
            x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth="0.5"
          />
        ))}

        {/* Data area */}
        <polygon
          points={dataPath}
          fill={color}
          fillOpacity="0.15"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
        ))}

        {/* Labels */}
        {labelPositions.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-600 dark:fill-slate-400"
            fontSize="10"
            fontWeight="500"
          >
            {p.label} {p.value}
          </text>
        ))}
      </svg>
    </div>
  );
}
