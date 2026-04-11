// ============================================================
// 6 个管线预设配置
// ============================================================

import type { PipelinePreset } from './types';

export const pipelinePresets: PipelinePreset[] = [
  {
    id: 'fineweb',
    name: 'FineWeb 标准管线',
    description: 'HuggingFace FineWeb 风格：URL 过滤 → HTML 提取 → 语种检测 → C4 规则 → 精确去重 → 近似去重',
    icon: '🕸',
    color: 'blue',
    steps: ['url', 'html', 'lang-detect', 'quality-filter', 'dedup-lines', 'minhash-dedup', 'whitespace'],
    configs: {
      'quality-filter': { ruleSet: 'fineweb', minLineLength: 5 },
      'minhash-dedup': { threshold: 0.7, ngramSize: 5 },
      'lang-detect': { targetLangs: 'zh,en', filterNonTarget: false },
    },
  },
  {
    id: 'dolma',
    name: 'Dolma 管线',
    description: 'AI2 Dolma 风格：带 Perplexity 过滤 + PII 脱敏 + 文档质量评分',
    icon: '🦙',
    color: 'emerald',
    steps: ['html', 'url', 'boilerplate', 'pii', 'dedup-lines', 'perplexity', 'doc-quality', 'whitespace'],
    configs: {
      'perplexity': { lowThreshold: 1.5, highThreshold: 6.0 },
      'doc-quality': { minScore: 40 },
    },
  },
  {
    id: 'lightweight',
    name: '轻量快速管线',
    description: '仅基础清洗 + 精确去重，速度优先',
    icon: '⚡',
    color: 'amber',
    steps: ['html', 'whitespace', 'special-chars', 'dedup-lines'],
  },
  {
    id: 'code',
    name: '代码数据管线',
    description: '保留代码格式，清理注释/license/auto-generated 标记',
    icon: '💻',
    color: 'cyan',
    steps: ['url', 'special-chars', 'dedup-lines', 'whitespace', 'quality-filter'],
    configs: {
      'quality-filter': { ruleSet: 'c4', minLineLength: 3 },
    },
  },
  {
    id: 'multilingual',
    name: '多语言管线',
    description: '语种检测优先 + 每语种独立阈值 + 近似去重',
    icon: '🌍',
    color: 'violet',
    steps: ['html', 'url', 'lang-detect', 'boilerplate', 'pii', 'minhash-dedup', 'quality-filter', 'whitespace'],
    configs: {
      'lang-detect': { targetLangs: 'zh,en,ja', filterNonTarget: true },
      'minhash-dedup': { threshold: 0.6, ngramSize: 4 },
    },
  },
  {
    id: 'custom',
    name: '自定义管线',
    description: '从工作台保存的自定义配置',
    icon: '🔧',
    color: 'slate',
    steps: ['html', 'url', 'whitespace', 'special-chars', 'pii', 'dedup-lines', 'quality-filter'],
  },
];
