// ============================================================
// Tab 1：流水线工作台
// ============================================================

import { useState, useCallback, useMemo, useRef } from 'react';
import type { PipelineStep, PipelineResult, StepConfig } from './types';
import { createSteps } from './steps';
import { sampleDatasets } from './samples';
import PipelineNode from './PipelineNode';
import SankeyFunnel from './SankeyFunnel';

interface Props {
  onPipelineChange?: (steps: PipelineStep[]) => void;
}

export default function PipelineWorkbench({ onPipelineChange }: Props) {
  const [pipeline, setPipeline] = useState<PipelineStep[]>(createSteps);
  const [rawText, setRawText] = useState('');
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  // Run pipeline
  const pipelineResults: PipelineResult[] = useMemo(() => {
    if (!rawText) return [];
    const results: PipelineResult[] = [];
    let current = rawText;
    for (const step of pipeline) {
      if (!step.enabled) continue;
      const result = step.process(current, step.config);
      results.push({
        step,
        input: current,
        output: result.text,
        removed: result.removed,
        details: result.details,
        retentionRate: rawText.length > 0 ? result.text.length / rawText.length : 1,
      });
      current = result.text;
    }
    return results;
  }, [rawText, pipeline]);

  const finalOutput = pipelineResults.length > 0 ? pipelineResults[pipelineResults.length - 1].output : rawText;
  const totalRemoved = rawText.length - finalOutput.length;

  // Handlers
  const toggleStep = useCallback((index: number) => {
    setPipeline(prev => {
      const next = prev.map((step, i) => i === index ? { ...step, enabled: !step.enabled } : step);
      onPipelineChange?.(next);
      return next;
    });
  }, [onPipelineChange]);

  const updateStepConfig = useCallback((index: number, config: StepConfig) => {
    setPipeline(prev => {
      const next = prev.map((step, i) => i === index ? { ...step, config } : step);
      onPipelineChange?.(next);
      return next;
    });
  }, [onPipelineChange]);

  // Drag & drop reorder
  const handleDragStart = useCallback((_e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDrop = useCallback((_e: React.DragEvent, dropIndex: number) => {
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) return;
    setPipeline(prev => {
      const next = [...prev];
      const [item] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, item);
      onPipelineChange?.(next);
      return next;
    });
    dragIndexRef.current = null;
  }, [onPipelineChange]);

  const loadSample = useCallback((text: string) => {
    setRawText(text);
    setShowSamplePicker(false);
  }, []);

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowSamplePicker(!showSamplePicker)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-200"
          >
            加载样本
          </button>
          {showSamplePicker && (
            <div className="absolute top-full left-0 mt-2 w-72 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-50">
              {sampleDatasets.map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSample(s.text)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{s.icon}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-6">{s.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setRawText('')}
          className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          清空
        </button>
        {rawText && (
          <button
            onClick={() => navigator.clipboard.writeText(finalOutput)}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            复制结果
          </button>
        )}
        {rawText && (
          <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">
            {rawText.length.toLocaleString()} → {finalOutput.length.toLocaleString()} 字符
            <span className={`ml-2 font-semibold ${totalRemoved > 0 ? 'text-teal-600 dark:text-teal-400' : ''}`}>
              (-{totalRemoved.toLocaleString()}, {rawText.length > 0 ? ((totalRemoved / rawText.length) * 100).toFixed(1) : 0}%)
            </span>
          </span>
        )}
      </div>

      {/* Pipeline Visual — Horizontal scroll */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">清洗流水线</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">拖拽节点可重排顺序</span>
        </div>
        <div className="flex items-start gap-1 overflow-x-auto pb-2 scrollbar-thin">
          {pipeline.map((step, i) => {
            const result = pipelineResults.find(r => r.step.id === step.id);
            return (
              <div key={step.id} className="flex items-center gap-1">
                <PipelineNode
                  step={step}
                  index={i}
                  result={result}
                  onToggle={() => toggleStep(i)}
                  onConfigChange={config => updateStepConfig(i, config)}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                />
                {i < pipeline.length - 1 && (
                  <div className="flex items-center w-4 flex-shrink-0 relative">
                    <div className="w-full h-0.5 bg-gradient-to-r from-teal-400/60 to-cyan-400/60 dark:from-teal-600/60 dark:to-cyan-600/60 rounded" />
                    <svg className="w-1.5 h-1.5 text-cyan-400 dark:text-cyan-600 absolute -right-0.5" viewBox="0 0 8 8">
                      <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sankey Funnel */}
      {pipelineResults.length > 0 && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">数据衰减漏斗</h3>
          <SankeyFunnel results={pipelineResults} inputLength={rawText.length} />
        </div>
      )}

      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">原始文本</label>
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder="粘贴需要清洗的原始文本（HTML、带噪声的网页文本等），或选择一个样本..."
          className="w-full h-40 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
          spellCheck={false}
        />
      </div>

      {/* Step-by-step details */}
      {pipelineResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">逐步清洗过程</h3>
          {pipelineResults.map((result, i) => {
            const isOpen = activeDetail === result.step.id;
            return (
              <div key={result.step.id} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => setActiveDetail(isOpen ? null : result.step.id)}
                  className={`w-full flex items-center gap-3 p-3 transition-colors text-left ${
                    result.removed > 0
                      ? 'bg-teal-50/50 dark:bg-teal-950/10 hover:bg-teal-50 dark:hover:bg-teal-950/20'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-base w-6 text-center">{result.step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Step {i + 1}: {result.step.name}
                    </span>
                    {result.details.length > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        {result.details.join(', ')}
                      </span>
                    )}
                  </div>
                  {result.removed > 0 ? (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-teal-500 text-white text-xs font-medium">
                      -{result.removed > 999 ? `${(result.removed / 1000).toFixed(1)}K` : result.removed}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-400">无变化</span>
                  )}
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isOpen && result.removed > 0 && (
                  <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">此步骤输出:</div>
                    <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto scrollbar-thin">
                      {result.output.slice(0, 2000)}
                      {result.output.length > 2000 && '\n... (省略)'}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Final Output */}
      {rawText && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">清洗结果</label>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {finalOutput.length.toLocaleString()} 字符 · 保留率 {rawText.length > 0 ? ((finalOutput.length / rawText.length) * 100).toFixed(1) : 100}%
            </span>
          </div>
          <textarea
            value={finalOutput}
            readOnly
            className="w-full h-40 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>
      )}

      {/* Empty state */}
      {!rawText && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">粘贴原始文本或选择一个样本</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">12 步可视化管线 · 拖拽重排 · 参数可调 · 8 种真实数据样本</p>
        </div>
      )}
    </div>
  );
}
