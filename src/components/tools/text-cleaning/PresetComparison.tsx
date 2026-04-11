// ============================================================
// Tab 2：管线预设 & A/B 对比
// ============================================================

import { useState, useMemo } from 'react';
import type { PipelineResult } from './types';
import { getStepsByIds } from './steps';
import { pipelinePresets } from './presets';
import { sampleDatasets } from './samples';
import SankeyFunnel from './SankeyFunnel';

const PRESET_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-500' },
  cyan:    { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-300 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300', badge: 'bg-cyan-500' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-300 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-300', badge: 'bg-violet-500' },
  slate:   { bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', badge: 'bg-slate-500' },
};

function runPreset(presetId: string, text: string): { results: PipelineResult[]; output: string } {
  const preset = pipelinePresets.find(p => p.id === presetId);
  if (!preset || !text) return { results: [], output: text };

  const steps = getStepsByIds(preset.steps);
  const results: PipelineResult[] = [];
  let current = text;

  for (const step of steps) {
    const config = preset.configs?.[step.id] ?? step.config;
    const result = step.process(current, config);
    results.push({
      step,
      input: current,
      output: result.text,
      removed: result.removed,
      details: result.details,
      retentionRate: text.length > 0 ? result.text.length / text.length : 1,
    });
    current = result.text;
  }

  return { results, output: current };
}

export default function PresetComparison() {
  const [selectedSample, setSelectedSample] = useState(sampleDatasets[0].id);
  const [compareA, setCompareA] = useState('fineweb');
  const [compareB, setCompareB] = useState('dolma');
  const [mode, setMode] = useState<'overview' | 'compare'>('overview');

  const sampleText = sampleDatasets.find(s => s.id === selectedSample)?.text || '';

  // Overview: run all presets
  const overviewResults = useMemo(() => {
    if (mode !== 'overview' || !sampleText) return [];
    return pipelinePresets.filter(p => p.id !== 'custom').map(preset => {
      const { results, output } = runPreset(preset.id, sampleText);
      return {
        preset,
        retention: sampleText.length > 0 ? output.length / sampleText.length : 1,
        outputLen: output.length,
        inputLen: sampleText.length,
        stepsApplied: results.filter(r => r.removed > 0).length,
        totalSteps: results.length,
        results,
        output,
      };
    });
  }, [mode, sampleText]);

  // Compare: run two presets
  const compareResults = useMemo(() => {
    if (mode !== 'compare' || !sampleText) return null;
    const a = runPreset(compareA, sampleText);
    const b = runPreset(compareB, sampleText);
    return { a, b };
  }, [mode, sampleText, compareA, compareB]);

  return (
    <div className="space-y-5">
      {/* Sample selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">测试样本：</span>
        <div className="flex flex-wrap gap-1.5">
          {sampleDatasets.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSample(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSample === s.id
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'overview'
              ? 'bg-teal-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          全景对比
        </button>
        <button
          onClick={() => setMode('compare')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'compare'
              ? 'bg-teal-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          A/B 对比
        </button>
      </div>

      {/* Overview mode */}
      {mode === 'overview' && (
        <div className="space-y-4">
          {/* Retention bar chart */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">管线保留率排行</h3>
            <div className="space-y-3">
              {overviewResults
                .sort((a, b) => b.retention - a.retention)
                .map(r => {
                  const colors = PRESET_COLORS[r.preset.color] || PRESET_COLORS.slate;
                  return (
                    <div key={r.preset.id} className="flex items-center gap-3">
                      <div className="w-32 flex-shrink-0">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {r.preset.icon} {r.preset.name.replace(' 管线', '')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors.badge} rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
                            style={{ width: `${Math.max(r.retention * 100, 3)}%` }}
                          >
                            <span className="text-[10px] font-bold text-white">
                              {(r.retention * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-28 text-right flex-shrink-0">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {r.outputLen.toLocaleString()} / {r.inputLen.toLocaleString()} 字符
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Preset cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overviewResults.map(r => {
              const colors = PRESET_COLORS[r.preset.color] || PRESET_COLORS.slate;
              return (
                <div key={r.preset.id} className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{r.preset.icon}</span>
                    <h4 className={`text-sm font-bold ${colors.text}`}>{r.preset.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{r.preset.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                    <span>{r.totalSteps} 步</span>
                    <span>{r.stepsApplied} 步有效</span>
                    <span className="font-semibold">{(r.retention * 100).toFixed(1)}% 保留</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.results.map(res => (
                      <span
                        key={res.step.id}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          res.removed > 0
                            ? `${colors.badge} text-white`
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {res.step.name.slice(0, 4)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compare mode */}
      {mode === 'compare' && (
        <div className="space-y-4">
          {/* Preset selectors */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">管线 A</label>
              <select
                value={compareA}
                onChange={e => setCompareA(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300"
              >
                {pipelinePresets.filter(p => p.id !== 'custom').map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>
            <div className="text-lg font-bold text-slate-400 mt-5">vs</div>
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">管线 B</label>
              <select
                value={compareB}
                onChange={e => setCompareB(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300"
              >
                {pipelinePresets.filter(p => p.id !== 'custom').map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Side by side comparison */}
          {compareResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'A', data: compareResults.a, presetId: compareA },
                { label: 'B', data: compareResults.b, presetId: compareB },
              ].map(side => {
                const preset = pipelinePresets.find(p => p.id === side.presetId);
                const retention = sampleText.length > 0 ? side.data.output.length / sampleText.length : 1;
                return (
                  <div key={side.label} className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-white bg-teal-500 w-5 h-5 rounded-full flex items-center justify-center">{side.label}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{preset?.icon} {preset?.name}</span>
                      <span className="ml-auto text-sm font-semibold text-teal-600 dark:text-teal-400">{(retention * 100).toFixed(1)}%</span>
                    </div>
                    <SankeyFunnel results={side.data.results} inputLength={sampleText.length} />
                    <div className="mt-3 space-y-1">
                      {side.data.results.map(r => (
                        <div key={r.step.id} className="flex items-center gap-2 text-xs">
                          <span className="w-4 text-center">{r.step.icon}</span>
                          <span className="flex-1 text-slate-600 dark:text-slate-400">{r.step.name}</span>
                          <span className={r.removed > 0 ? 'font-medium text-teal-600 dark:text-teal-400' : 'text-slate-400'}>
                            {r.removed > 0 ? `-${r.removed}` : '--'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">清洗结果预览:</div>
                      <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all max-h-32 overflow-y-auto scrollbar-thin">
                        {side.data.output.slice(0, 800)}
                        {side.data.output.length > 800 && '\n...'}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
