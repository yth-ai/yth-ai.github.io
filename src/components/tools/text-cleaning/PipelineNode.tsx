// ============================================================
// 单个步骤节点组件
// ============================================================

import { useState } from 'react';
import type { PipelineStep, PipelineResult, StepConfig } from './types';

interface Props {
  step: PipelineStep;
  index: number;
  result?: PipelineResult;
  onToggle: () => void;
  onConfigChange?: (config: StepConfig) => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
}

const NODE_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  rose:    { bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-300 dark:border-rose-800', badge: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-300 dark:border-blue-800', badge: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-300 dark:border-indigo-800', badge: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-300' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-300 dark:border-amber-800', badge: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  teal:    { bg: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-teal-300 dark:border-teal-800', badge: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-300' },
  cyan:    { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-300 dark:border-cyan-800', badge: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-300' },
  slate:   { bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-300 dark:border-slate-700', badge: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-300' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-300 dark:border-orange-800', badge: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  red:     { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-300 dark:border-red-800', badge: 'bg-red-500', text: 'text-red-700 dark:text-red-300' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-300 dark:border-violet-800', badge: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-300 dark:border-emerald-800', badge: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  pink:    { bg: 'bg-pink-50 dark:bg-pink-950/20', border: 'border-pink-300 dark:border-pink-800', badge: 'bg-pink-500', text: 'text-pink-700 dark:text-pink-300' },
};

export default function PipelineNode({
  step, index, result, onToggle, onConfigChange,
  onDragStart, onDragOver, onDrop,
}: Props) {
  const [showConfig, setShowConfig] = useState(false);
  const colors = NODE_COLORS[step.color] || NODE_COLORS.slate;
  const hasEffect = result && result.removed > 0;

  return (
    <div
      draggable
      onDragStart={e => onDragStart?.(e, index)}
      onDragOver={e => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={e => onDrop?.(e, index)}
      className={`relative flex-shrink-0 w-36 rounded-xl border-2 transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        step.enabled
          ? `${colors.bg} ${colors.border} shadow-sm`
          : 'bg-slate-100 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-50'
      }`}
    >
      {/* Header */}
      <div className="p-3 pb-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">{step.icon}</span>
          <span className={`text-xs font-bold ${step.enabled ? colors.text : 'text-slate-400 dark:text-slate-500 line-through'}`}>
            {step.name}
          </span>
        </div>
        <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400 line-clamp-2">
          {step.description}
        </p>
      </div>

      {/* Stats */}
      {hasEffect && step.enabled && (
        <div className="px-3 pb-1">
          <span className={`inline-block px-1.5 py-0.5 rounded-full ${colors.badge} text-white text-[10px] font-semibold`}>
            -{result!.removed > 999 ? `${(result!.removed / 1000).toFixed(1)}K` : result!.removed}
          </span>
          {result!.retentionRate < 1 && (
            <span className="ml-1 text-[10px] text-slate-500 dark:text-slate-400">
              {(result!.retentionRate * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-slate-200/50 dark:border-slate-700/50">
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
            step.enabled
              ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-500/30'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-slate-300'
          }`}
        >
          {step.enabled ? 'ON' : 'OFF'}
        </button>
        {step.configurable && step.enabled && (
          <button
            onClick={e => { e.stopPropagation(); setShowConfig(!showConfig); }}
            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            {showConfig ? '收起' : '配置'}
          </button>
        )}
      </div>

      {/* Config Panel */}
      {showConfig && step.configurable && step.configSchema && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-200/50 dark:border-slate-700/50">
          {step.configSchema.map(field => (
            <div key={field.key} className="flex flex-col gap-0.5">
              <label className="text-[9px] font-medium text-slate-500 dark:text-slate-400">{field.label}</label>
              {field.type === 'boolean' && (
                <button
                  onClick={() => onConfigChange?.({ ...step.config, [field.key]: !step.config?.[field.key] })}
                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                    step.config?.[field.key]
                      ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {step.config?.[field.key] ? '是' : '否'}
                </button>
              )}
              {field.type === 'number' && (
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={(step.config?.[field.key] as number) ?? field.min}
                  onChange={e => onConfigChange?.({ ...step.config, [field.key]: Number(e.target.value) })}
                  className="w-full h-1 accent-teal-500"
                />
              )}
              {field.type === 'select' && field.options && (
                <select
                  value={(step.config?.[field.key] as string) ?? field.options[0].value}
                  onChange={e => onConfigChange?.({ ...step.config, [field.key]: e.target.value })}
                  className="text-[10px] px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  {field.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
              {field.type === 'number' && (
                <span className="text-[9px] text-slate-400">{String(step.config?.[field.key] ?? '')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
