import { useState } from 'react';
import HeatmapTab from './HeatmapTab';
import ArchitectureTab from './ArchitectureTab';
import WindowStrategyTab from './WindowStrategyTab';
import TimelineTab from './TimelineTab';

type TabId = 'heatmap' | 'architecture' | 'window' | 'timeline';

interface Tab {
  id: TabId;
  icon: string;
  label: string;
  sublabel: string;
}

const TABS: Tab[] = [
  { id: 'heatmap', icon: '🔥', label: '注意力热力图', sublabel: '多层多头可视化' },
  { id: 'architecture', icon: '🏗️', label: '架构对比器', sublabel: 'MHA/GQA/MQA/MLA' },
  { id: 'window', icon: '🪟', label: '窗口策略', sublabel: 'Full/Causal/SWA/Hybrid' },
  { id: 'timeline', icon: '📖', label: '进化时间线', sublabel: '2017-2026' },
];

export default function AttentionWorkbench() {
  const [activeTab, setActiveTab] = useState<TabId>('architecture');

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all ${
              activeTab === tab.id
                ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700 shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 hover:bg-purple-50/50 dark:hover:bg-purple-950/10'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <div className="text-left">
              <div className={`text-sm font-medium ${
                activeTab === tab.id
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {tab.label}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">{tab.sublabel}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'heatmap' && <HeatmapTab />}
      {activeTab === 'architecture' && <ArchitectureTab />}
      {activeTab === 'window' && <WindowStrategyTab />}
      {activeTab === 'timeline' && <TimelineTab />}
    </div>
  );
}
