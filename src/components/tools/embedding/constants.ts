/** Embedding 全景工作台 — 常量配置 */

export const EMBEDDING_DIM = 50;

export const CATEGORIES: Record<string, string> = {
  animals: '🐾 动物',
  food: '🍜 食物',
  tech: '💻 科技',
  emotion: '❤️ 情感',
  nature: '🌿 自然',
  sports: '⚽ 运动',
  career: '🏢 职业',
  academic: '📚 学术',
  culture: '🎭 文化',
};

export const CAT_COLORS: Record<string, string> = {
  animals: '#f97316',
  food: '#ef4444',
  tech: '#3b82f6',
  emotion: '#ec4899',
  nature: '#22c55e',
  sports: '#a855f7',
  career: '#f59e0b',
  academic: '#06b6d4',
  culture: '#8b5cf6',
};

export const CANVAS_THEME = {
  light: { bg: '#f8fafc', grid: '#e2e8f0', text: '#334155', subtext: '#94a3b8' },
  dark: { bg: '#0f172a', grid: '#1e293b', text: '#e2e8f0', subtext: '#64748b' },
};

export type TabId = 'constellation' | 'algebra' | 'similarity' | 'intuition';

export const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'constellation', label: '向量星图', icon: '✦' },
  { id: 'algebra', label: '向量算术', icon: '±' },
  { id: 'similarity', label: '相似度矩阵', icon: '▦' },
  { id: 'intuition', label: '训练直觉', icon: '🧠' },
];

export type ReductionMethod = 'pca' | 'tsne' | 'umap';

export const METHOD_LABELS: Record<ReductionMethod, string> = {
  pca: 'PCA',
  tsne: 't-SNE',
  umap: 'UMAP',
};

/** 向量类比预设 */
export interface AnalogyPreset {
  label: string;
  a: string;
  b: string;
  c: string;
  expectedHint: string;
}

export const ANALOGY_PRESETS: AnalogyPreset[] = [
  { label: '动物对照', a: '虎', b: '狮', c: '猫', expectedHint: '狗' },
  { label: '食物配对', a: '米饭', b: '面条', c: '蛋糕', expectedHint: '面包' },
  { label: '情感反转', a: '快乐', b: '悲伤', c: '愤怒', expectedHint: '平静' },
  { label: '职业迁移', a: '程序员', b: '算法', c: '医生', expectedHint: '实验' },
  { label: '自然极端', a: '山', b: '水', c: '沙漠', expectedHint: '冰川' },
  { label: '球类映射', a: '足球', b: '篮球', c: '乒乓球', expectedHint: '羽毛球' },
  { label: '学术流程', a: '假设', b: '实验', c: '摘要', expectedHint: '结论' },
  { label: '文化媒介', a: '诗词', b: '书法', c: '电影', expectedHint: '摄影' },
];

/** 热力图预设分组 */
export interface SimilarityPreset {
  label: string;
  words: string[];
}

export const SIMILARITY_PRESETS: SimilarityPreset[] = [
  { label: '情感光谱', words: ['快乐', '悲伤', '愤怒', '恐惧', '惊讶', '期待', '信任', '厌恶', '喜欢', '讨厌', '温暖', '孤独'] },
  { label: '技术栈', words: ['算法', '模型', '训练', '推理', '参数', '梯度', '损失', '优化', '网络', '卷积', '注意力', '编码器'] },
  { label: '动物 vs 食物', words: ['猫', '狗', '鱼', '鸟', '虎', '象', '米饭', '面条', '饺子', '苹果', '蛋糕', '面包'] },
  { label: '自然 vs 运动', words: ['山', '水', '河', '海', '森林', '沙漠', '足球', '篮球', '游泳', '跑步', '滑雪', '攀岩'] },
];
