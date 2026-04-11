/**
 * Embedding 全景工作台 — 主容器
 *
 * 四个 Tab：
 * 1. 向量星图（Constellation）
 * 2. 向量算术（Algebra）
 * 3. 相似度矩阵（Similarity）
 * 4. 训练直觉（Intuition）
 */
import { useState } from 'react';
import { TABS, type TabId } from './constants';
import ConstellationView from './ConstellationView';
import VectorAlgebra from './VectorAlgebra';
import SimilarityMatrix from './SimilarityMatrix';
import IntuitionLab from './IntuitionLab';

export default function EmbeddingVisualizer() {
  const [activeTab, setActiveTab] = useState<TabId>('constellation');

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'constellation' && <ConstellationView />}
        {activeTab === 'algebra' && <VectorAlgebra />}
        {activeTab === 'similarity' && <SimilarityMatrix />}
        {activeTab === 'intuition' && <IntuitionLab />}
      </div>

      {/* Knowledge Footer */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-cyan-200 dark:border-slate-700 p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">关于 Embedding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div>
            <p className="mb-2">
              <strong>Embedding</strong>（嵌入）是将离散符号（词、句子、图像）映射到连续向量空间的技术。
              在这个空间中，语义相似的对象距离更近。这是现代 AI 理解世界的基础。
            </p>
            <p>
              从 2013 年 Word2Vec 到 2026 年的多模态统一 Embedding（如 Gemini Embedding），
              这项技术已经从"词"扩展到文本、图像、音频、视频的统一表示。
            </p>
          </div>
          <div>
            <p className="mb-2">
              <strong>为什么重要？</strong>Embedding 是 RAG、语义搜索、推荐系统、多模态理解的核心。
              理解 Embedding 空间的几何结构，有助于理解 LLM 如何"思考"。
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              ⚠️ 本工具使用 50 维确定性伪向量用于教学演示。实际 Embedding 模型（如 text-embedding-3-large）使用 3072 维，
              在真实语料上训练后，类比和聚类效果远比此处精确。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
