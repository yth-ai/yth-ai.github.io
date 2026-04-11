import { useState } from 'react';
import SingleQueryTab from './SingleQueryTab';
import MyAIDayTab from './MyAIDayTab';
import EfficiencyTab from './EfficiencyTab';

const TABS = [
  { id: 'single', label: '单次查询', icon: '⚡' },
  { id: 'myday', label: '我的 AI 日', icon: '📅' },
  { id: 'efficiency', label: '模型效能图', icon: '📊' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function CarbonFootprintCalculator() {
  const [activeTab, setActiveTab] = useState<TabId>('single');

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'single' && <SingleQueryTab />}
      {activeTab === 'myday' && <MyAIDayTab />}
      {activeTab === 'efficiency' && <EfficiencyTab />}

      {/* Educational footer */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">你可以做什么</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex gap-2">
            <span className="shrink-0 w-5 h-5 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-[10px] font-bold">1</span>
            <span><strong className="text-slate-700 dark:text-slate-300">选择更小的模型</strong>——GPT-4o mini 的碳排放仅为 GPT-5.4 的 1/13，对于简单任务绰绰有余</span>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0 w-5 h-5 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-[10px] font-bold">2</span>
            <span><strong className="text-slate-700 dark:text-slate-300">优化 Prompt</strong>——更短更精确的 prompt 既省钱也省碳</span>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0 w-5 h-5 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-[10px] font-bold">3</span>
            <span><strong className="text-slate-700 dark:text-slate-300">关注可再生能源</strong>——选择在绿色数据中心运行的服务商，碳排放可减少 95%</span>
          </div>
        </div>
      </div>

      {/* Data source disclaimer */}
      <div className="text-xs text-slate-400 dark:text-slate-500 text-center space-y-0.5">
        <p>能耗数据为估算值，基于 Nature 2025、IEEE 2026 综述、arXiv 2505.09598 及各厂商公开报告。实际值因硬件、负载、优化策略不同而有显著差异（±30-50%）。</p>
        <p>碳强度数据来源：IEA 2025 Global Energy Review。水消耗基于 Microsoft/Google 2025 可持续发展报告（中位估算 1.8 L/kWh，实际范围 0.5-5.0）。</p>
      </div>
    </div>
  );
}
