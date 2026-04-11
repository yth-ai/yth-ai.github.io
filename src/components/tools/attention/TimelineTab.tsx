import { useState } from 'react';
import { ATTENTION_TIMELINE, type TimelineEntry } from './data/timeline-data';

export default function TimelineTab() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">注意力机制进化时间线</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">从 2017 年 Attention Is All You Need 到 2026 年的稀疏注意力</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 lg:left-1/2 lg:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500" />

        <div className="space-y-8">
          {ATTENTION_TIMELINE.map((entry, idx) => {
            const isExpanded = expandedIdx === idx;
            const isLeft = idx % 2 === 0;

            return (
              <div
                key={idx}
                className={`relative flex items-start ${
                  // On mobile: all right. On desktop: alternate
                  'lg:flex-row'
                }`}
              >
                {/* Desktop: left side content (even items) */}
                <div className={`hidden lg:block lg:w-1/2 ${isLeft ? 'pr-12 text-right' : ''}`}>
                  {isLeft && (
                    <TimelineCard
                      entry={entry}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedIdx(isExpanded ? null : idx)}
                      align="right"
                    />
                  )}
                </div>

                {/* Center dot */}
                <div className="absolute left-6 lg:left-1/2 -translate-x-1/2 z-10">
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                    className="group relative"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-md transition-transform ${
                        isExpanded ? 'scale-125' : 'group-hover:scale-110'
                      }`}
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.isCurrent && (
                      <div
                        className="absolute -inset-1.5 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: entry.color }}
                      />
                    )}
                  </button>
                </div>

                {/* Desktop: right side content (odd items) */}
                <div className={`hidden lg:block lg:w-1/2 ${!isLeft ? 'pl-12' : ''}`}>
                  {!isLeft && (
                    <TimelineCard
                      entry={entry}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedIdx(isExpanded ? null : idx)}
                      align="left"
                    />
                  )}
                </div>

                {/* Mobile: always right */}
                <div className="lg:hidden ml-14 flex-1">
                  <TimelineCard
                    entry={entry}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedIdx(isExpanded ? null : idx)}
                    align="left"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-indigo-200 dark:border-slate-700 p-5 mt-8">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">九年演化的核心主线</h4>
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
          <p><strong>效率驱动</strong>：从 MHA 到 MQA/GQA/MLA，核心目标是减少 KV Cache，降低推理成本。</p>
          <p><strong>长度扩展</strong>：从 512 tokens 到 128K+，SWA 和 Hybrid 策略让长上下文成为可能。</p>
          <p><strong>系统协同</strong>：Flash Attention 证明了算法-硬件协同设计的巨大潜力。</p>
          <p><strong>2026 趋势</strong>：GQA 仍是主流，MLA 是高效推理的新方向，混合架构（SSM+Attention）探索仍在继续。</p>
        </div>
      </div>
    </div>
  );
}

function TimelineCard({
  entry,
  isExpanded,
  onToggle,
  align,
}: {
  entry: TimelineEntry;
  isExpanded: boolean;
  onToggle: () => void;
  align: 'left' | 'right';
}) {
  return (
    <div
      onClick={onToggle}
      className={`cursor-pointer group rounded-xl border transition-all ${
        isExpanded
          ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-lg'
          : 'bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
      } p-4`}
    >
      {/* Header */}
      <div className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <div
          className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: entry.color }}
        >
          {entry.year}{entry.month ? `-${String(entry.month).padStart(2, '0')}` : ''}
        </div>
        <div className={`flex-1 ${align === 'right' ? 'text-right' : ''}`}>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {entry.shortName}
            {entry.isCurrent && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                当前主流
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{entry.name}</p>
        </div>
      </div>

      {/* Collapsed: one-line verdict */}
      {!isExpanded && (
        <p className={`text-xs text-slate-500 dark:text-slate-400 mt-2 ${align === 'right' ? 'text-right' : ''}`}>
          {entry.verdict}
        </p>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 space-y-3 animate-in fade-in duration-200">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{entry.description}</p>

          <div className="flex flex-wrap gap-2">
            <div className="text-xs">
              <span className="text-slate-400">论文: </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{entry.paper}</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400">代表模型: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {entry.representativeModels.map(m => (
                <span key={m} className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <span className="text-xs text-slate-400">KV Cache: </span>
            <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">{entry.kvCacheCharacteristic}</span>
          </div>

          <p className="text-xs font-medium" style={{ color: entry.color }}>{entry.verdict}</p>
        </div>
      )}
    </div>
  );
}
