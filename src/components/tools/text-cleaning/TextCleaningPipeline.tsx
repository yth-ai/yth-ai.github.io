// ============================================================
// LLM 预训练数据工坊 — 主容器 + Tab 切换
// ============================================================

import { useState } from 'react';
import type { TabId } from './types';
import PipelineWorkbench from './PipelineWorkbench';
import PresetComparison from './PresetComparison';
import DataInsights from './DataInsights';

const tabs: { id: TabId; label: string; icon: string; description: string }[] = [
  { id: 'workbench', label: '流水线工作台', icon: '⚙️', description: '12 步可视化管线 · 拖拽编排 · 参数可调' },
  { id: 'presets',   label: '管线预设对比',   icon: '📊', description: '6 种真实管线 · 全景排行 · A/B 对比' },
  { id: 'insights',  label: '数据洞察',       icon: '💡', description: '5 篇交互教程 · 统计仪表盘' },
];

export default function TextCleaningPipeline() {
  const [activeTab, setActiveTab] = useState<TabId>('workbench');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab description */}
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center -mt-3">
        {tabs.find(t => t.id === activeTab)?.description}
      </p>

      {/* Tab Content */}
      {activeTab === 'workbench' && <PipelineWorkbench />}
      {activeTab === 'presets' && <PresetComparison />}
      {activeTab === 'insights' && <DataInsights />}
    </div>
  );
}
