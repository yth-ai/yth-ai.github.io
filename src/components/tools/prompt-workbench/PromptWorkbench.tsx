import { useState } from 'react';
import TemplateWorkshop from './TemplateWorkshop';
import PromptArena from './PromptArena';
import ChainBuilder from './ChainBuilder';
import TechniqueAtlas from './TechniqueAtlas';

// ============================================================
// Prompt 工程全景工作台 — 主组件
// ============================================================

type TabId = 'workshop' | 'arena' | 'chain' | 'atlas';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  { id: 'workshop', label: '模板工坊', icon: '📝', description: '16 种 Prompt 模板 + 变量填充 + 五维分析' },
  { id: 'arena', label: 'Prompt 对决', icon: '⚔️', description: '5 组经典对比，直观感受技巧差异' },
  { id: 'chain', label: '链式构建器', icon: '🔗', description: '可视化 Prompt Chain，模拟数据流动' },
  { id: 'atlas', label: '技术图鉴', icon: '🗺️', description: '12 种技术 + 决策向导 + 演化时间线' },
];

export default function PromptWorkbench() {
  const [activeTab, setActiveTab] = useState<TabId>('workshop');

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'workshop' && <TemplateWorkshop />}
        {activeTab === 'arena' && <PromptArena />}
        {activeTab === 'chain' && <ChainBuilder />}
        {activeTab === 'atlas' && <TechniqueAtlas />}
      </div>
    </div>
  );
}
