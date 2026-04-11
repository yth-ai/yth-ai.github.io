// ============================================================
// LLM Architecture Workbench 2.0 — Main Component (3 Tabs)
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import type { ModelConfig } from './types';
import { PRESETS, PRESET_GROUPS } from './presets';
import { calculateParams } from './calculations';
import ArchitectureExplorer from './ArchitectureExplorer';
import InferenceAnalyzer from './InferenceAnalyzer';
import ModelDuel from './ModelDuel';

type TabKey = 'architecture' | 'inference' | 'duel';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'architecture', label: '架构探索', icon: '🧱' },
  { key: 'inference', label: 'KV Cache 与推理', icon: '⚡' },
  { key: 'duel', label: '模型对决', icon: '⚔️' },
];

export default function LLMCalculator() {
  const [activeTab, setActiveTab] = useState<TabKey>('architecture');
  const [selectedPreset, setSelectedPreset] = useState('llama3-8b');
  const [config, setConfig] = useState<ModelConfig>(PRESETS['llama3-8b']);
  const [tiedEmbedding, setTiedEmbedding] = useState(false);

  const selectPreset = useCallback((key: string) => {
    setSelectedPreset(key);
    if (key !== 'custom') {
      setConfig(PRESETS[key]);
    }
  }, []);

  const updateConfig = useCallback((field: keyof ModelConfig, value: number | boolean) => {
    setSelectedPreset('custom');
    setConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  const params = useMemo(() => calculateParams(config, tiedEmbedding), [config, tiedEmbedding]);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}>
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Shared model config (Tab 1 & 2) */}
      {activeTab !== 'duel' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">模型预设</label>
            <div className="space-y-2">
              {PRESET_GROUPS.map(group => (
                <div key={group.label}>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-1">
                    {group.label}
                    {group.label === 'MoE' && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded normal-case">Mixture of Experts</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.keys.map(key => {
                      const preset = PRESETS[key];
                      if (!preset) return null;
                      return (
                        <button key={key} onClick={() => selectPreset(key)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  selectedPreset === key
                                    ? preset.isMoE
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                                      : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}>
                          {preset.name}
                        </button>
                      );
                    })}
                    {group.label === 'Dense' && (
                      <button onClick={() => selectPreset('custom')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                selectedPreset === 'custom'
                                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}>
                        自定义
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Config grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: 'Hidden Size', field: 'hiddenSize' as const, value: config.hiddenSize },
              { label: 'Layers', field: 'numLayers' as const, value: config.numLayers },
              { label: 'Attention Heads', field: 'numHeads' as const, value: config.numHeads },
              { label: 'KV Heads (GQA)', field: 'numKVHeads' as const, value: config.numKVHeads },
              { label: 'FFN Hidden', field: 'intermediateSize' as const, value: config.intermediateSize },
              { label: 'Vocab Size', field: 'vocabSize' as const, value: config.vocabSize },
              { label: 'Max Seq Len', field: 'maxSeqLen' as const, value: config.maxSeqLen },
            ].map(({ label, field, value }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
                <input type="number" value={value}
                       onChange={e => updateConfig(field, parseInt(e.target.value) || 0)}
                       className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
              </div>
            ))}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={config.isMoE}
                       onChange={e => updateConfig('isMoE', e.target.checked)}
                       className="rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500/50" />
                MoE 架构
              </label>
              {config.isMoE && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">Experts</label>
                    <input type="number" value={config.numExperts || 8}
                           onChange={e => updateConfig('numExperts' as any, parseInt(e.target.value) || 8)}
                           className="w-full px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">Active</label>
                    <input type="number" value={config.activeExperts || 2}
                           onChange={e => updateConfig('activeExperts' as any, parseInt(e.target.value) || 2)}
                           className="w-full px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100" />
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={tiedEmbedding}
                       onChange={e => setTiedEmbedding(e.target.checked)}
                       className="rounded border-slate-300 dark:border-slate-600 text-indigo-500 focus:ring-indigo-500/50" />
                Tied Embedding
              </label>
            </div>
          </div>
        </>
      )}

      {/* Tab content */}
      {activeTab === 'architecture' && <ArchitectureExplorer config={config} tiedEmbedding={tiedEmbedding} />}
      {activeTab === 'inference' && <InferenceAnalyzer config={config} params={params} />}
      {activeTab === 'duel' && <ModelDuel />}
    </div>
  );
}
