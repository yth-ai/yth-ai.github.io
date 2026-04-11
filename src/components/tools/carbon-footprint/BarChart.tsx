export default function BarChart({ data, maxValue }: { data: { label: string; value: number; color: string; suffix?: string }[]; maxValue: number }) {
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-28 shrink-0 text-slate-600 dark:text-slate-400 truncate" title={d.label}>{d.label}</span>
          <div className="flex-1 h-5 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-700 ease-out flex items-center justify-end pr-1"
              style={{
                width: `${Math.max((d.value / maxValue) * 100, 3)}%`,
                backgroundColor: d.color,
                transitionDelay: `${i * 60}ms`,
              }}>
              {d.value / maxValue > 0.15 && (
                <span className="text-[10px] text-white font-mono whitespace-nowrap">
                  {d.value < 0.01 ? d.value.toExponential(1) : d.value.toFixed(3)}{d.suffix}
                </span>
              )}
            </div>
          </div>
          <span className="w-20 text-right font-mono text-slate-600 dark:text-slate-300 shrink-0 text-[11px]">
            {d.value < 0.001 ? d.value.toExponential(1) : d.value < 1 ? d.value.toFixed(4) : d.value.toFixed(2)}{d.suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
