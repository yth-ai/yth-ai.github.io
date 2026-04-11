/**
 * Embedding 全景工作台 — 词向量数据
 *
 * 126 中文词 × 50 维伪向量，9 个语义类别。
 * 确定性种子 + 类别质心确保同类别词在向量空间中聚类。
 */
import { EMBEDDING_DIM } from './constants';

export interface WordVec {
  word: string;
  category: string;
  vec: number[];
}

// Deterministic seeded PRNG
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const WORD_LISTS: Record<string, string[]> = {
  animals: ['猫', '狗', '鱼', '鸟', '马', '牛', '羊', '兔', '鹿', '虎', '狮', '象', '鹰', '蛇'],
  food: ['米饭', '面条', '饺子', '豆腐', '牛肉', '鸡蛋', '苹果', '香蕉', '葡萄', '西瓜', '蛋糕', '面包', '寿司', '披萨'],
  tech: ['算法', '模型', '训练', '推理', '参数', '梯度', '损失', '优化', '网络', '卷积', '注意力', '编码器', 'Transformer', '微调'],
  emotion: ['快乐', '悲伤', '愤怒', '恐惧', '惊讶', '期待', '信任', '厌恶', '喜欢', '讨厌', '温暖', '孤独', '焦虑', '平静'],
  nature: ['山', '水', '河', '海', '云', '风', '雨', '雪', '森林', '草原', '沙漠', '冰川', '火山', '瀑布'],
  sports: ['足球', '篮球', '网球', '游泳', '跑步', '跳高', '拳击', '滑雪', '攀岩', '射箭', '击剑', '赛车', '乒乓球', '羽毛球'],
  career: ['程序员', '医生', '教师', '律师', '工程师', '科学家', '画家', '记者', '厨师', '飞行员', '建筑师', '音乐家', '作家', '企业家'],
  academic: ['论文', '数据集', '实验', '假设', '引用', '综述', '方法论', '结论', '摘要', '期刊', '会议', '同行评审', '基准', '消融'],
  culture: ['诗词', '电影', '音乐', '小说', '书法', '舞蹈', '戏剧', '绘画', '雕塑', '摄影', '钢琴', '吉他', '茶道', '围棋'],
};

function generateVectors(): WordVec[] {
  const dim = EMBEDDING_DIM;
  const result: WordVec[] = [];
  const catKeys = Object.keys(WORD_LISTS);

  for (let ci = 0; ci < catKeys.length; ci++) {
    const cat = catKeys[ci];
    const words = WORD_LISTS[cat];
    const rng = seededRandom(ci * 1000 + 42);

    const centroid = Array.from({ length: dim }, () => (rng() - 0.5) * 4);
    centroid[ci % dim] += 4;
    centroid[(ci * 7 + 3) % dim] += 3;
    centroid[(ci * 11 + 5) % dim] += 2;

    for (let i = 0; i < words.length; i++) {
      const vec = centroid.map((c) => c + (rng() - 0.5) * 1.8);
      result.push({ word: words[i], category: cat, vec });
    }
  }
  return result;
}

/** 全部 126 个预计算词向量 */
export const ALL_VECTORS: WordVec[] = generateVectors();

/** 类别名 → 该类质心 */
export function getCentroids(): Record<string, number[]> {
  const groups: Record<string, number[][]> = {};
  for (const v of ALL_VECTORS) {
    (groups[v.category] ??= []).push(v.vec);
  }
  const centroids: Record<string, number[]> = {};
  for (const [cat, vecs] of Object.entries(groups)) {
    const n = vecs.length;
    centroids[cat] = Array.from({ length: EMBEDDING_DIM }, (_, d) =>
      vecs.reduce((s, v) => s + v[d], 0) / n,
    );
  }
  return centroids;
}

/** Cosine similarity */
export function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

/** 欧氏距离 */
export function euclidean(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/** 向量运算：result = a - b + c */
export function vectorArithmetic(a: number[], b: number[], c: number[]): number[] {
  return a.map((v, i) => v - b[i] + c[i]);
}

/** 在词表中找最近邻（排除指定词）*/
export function findNearest(
  target: number[],
  pool: WordVec[],
  excludeWords: string[],
  topK = 5,
): { word: string; category: string; sim: number }[] {
  const excludeSet = new Set(excludeWords);
  return pool
    .filter((w) => !excludeSet.has(w.word))
    .map((w) => ({ word: w.word, category: w.category, sim: cosineSim(target, w.vec) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, topK);
}

/** 经典向量算术案例 */
export interface AnalogyCase {
  label: string;
  a: string;
  b: string;
  c: string;
  expected: string;
  explanation: string;
}

export const ANALOGY_CASES: AnalogyCase[] = [
  { label: '动物对照', a: '虎', b: '狮', c: '猫', expected: '狗', explanation: '虎之于狮，就像猫之于狗——不同的猛兽对应不同的宠物' },
  { label: '食物配对', a: '米饭', b: '面条', c: '蛋糕', expected: '面包', explanation: '米饭和面条是主食对，蛋糕和面包是烘焙对' },
  { label: '情感反转', a: '快乐', b: '悲伤', c: '愤怒', expected: '平静', explanation: '快乐与悲伤相对，愤怒与平静相对' },
  { label: '职业迁移', a: '程序员', b: '算法', c: '医生', expected: '实验', explanation: '程序员的核心是算法，医生的核心是实验/诊断' },
  { label: '自然极端', a: '山', b: '水', c: '沙漠', expected: '冰川', explanation: '山与水形成经典对比，沙漠与冰川形成冷热极端' },
  { label: '球类映射', a: '足球', b: '篮球', c: '乒乓球', expected: '羽毛球', explanation: '足球对篮球（大球），乒乓球对羽毛球（小球）' },
  { label: '学术流程', a: '假设', b: '实验', c: '摘要', expected: '结论', explanation: '假设引导实验，摘要引导结论——研究的前后对应' },
  { label: '文化媒介', a: '诗词', b: '书法', c: '电影', expected: '摄影', explanation: '诗词用书法记录，电影用摄影呈现——文本与视觉的平行' },
];
