import { useMemo } from 'react';
import type { EquivalentItem } from './types';

interface EquivalentCardsProps {
  equivalents: EquivalentItem[];
  co2Grams: number;
  /** true = show "how many requests = 1 unit" (inverted), false = show fractional units */
  invertMode?: boolean;
}

export default function EquivalentCards({ equivalents, co2Grams, invertMode = true }: EquivalentCardsProps) {
  const computed = useMemo(() => {
    return equivalents.map(eq => {
      const value = co2Grams / eq.perGramCO2;
      // Inverted: how many requests to make 1 unit
      const inverted = eq.perGramCO2 / co2Grams;

      if (invertMode && co2Grams > 0) {
        // Show "N 次请求 = 1 杯咖啡" style
        const invertDisplay = inverted < 1
          ? `${(1 / inverted).toFixed(1)} ${eq.unit}`
          : `${Math.round(inverted).toLocaleString()} 次请求`;
        const invertSub = inverted < 1
          ? `每次请求 = ${value.toFixed(1)} ${eq.unit}`
          : `= 1 ${eq.unit === '%' ? '杯' : eq.unit.replace('次', '').replace('秒', '秒').replace('米', '米')}${eq.label}`;
        return { ...eq, display: invertDisplay, sub: invertSub, value, inverted };
      }

      let display: string;
      if (eq.unit === '%') {
        display = `${value.toFixed(3)}%`;
      } else if (value < 0.01) {
        display = `${value.toExponential(1)} ${eq.unit}`;
      } else if (value < 1) {
        display = `${value.toFixed(3)} ${eq.unit}`;
      } else {
        display = `${value.toFixed(1)} ${eq.unit}`;
      }
      return { ...eq, display, sub: eq.label, value, inverted };
    });
  }, [equivalents, co2Grams, invertMode]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {computed.map((eq, i) => (
        <div key={i} className="text-center p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="text-2xl mb-1">{eq.icon}</div>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white leading-tight">{eq.display}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">{eq.sub}</div>
        </div>
      ))}
    </div>
  );
}
