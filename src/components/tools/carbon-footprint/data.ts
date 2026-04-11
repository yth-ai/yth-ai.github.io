import type { AIModel, PresetScenario, EquivalentItem, RegionInfo, TaskType, DayActivity } from './types';

// Energy per 1M tokens (kWh) — estimates based on:
// - Nature 2025: "The energy footprint of AI inference"
// - IEEE 2026 survey: "Carbon accounting for large language models"
// - arXiv 2505.09598: "How Hungry is AI?" (30+ models benchmarked)
// - arXiv 2512.03024: TokenPowerBench (per-token power measurements)
// - Public sustainability reports from Microsoft, Google, Meta (2025)
// Note: these are rough estimates with significant uncertainty ranges

export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt5',
    name: 'GPT-5.4',
    provider: 'OpenAI',
    color: '#10b981',
    energyPerMToken: 0.4,
    uncertaintyRange: 0.5,
    capabilityScore: 93,
    pricePerMToken: 30,
    notes: '推测值，基于 GPT-4 能耗 ×1.5-2x 推断。实际数据未公开。',
  },
  {
    id: 'gpt4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    color: '#34d399',
    energyPerMToken: 0.2,
    uncertaintyRange: 0.35,
    capabilityScore: 85,
    pricePerMToken: 10,
    notes: '基于 Nature 2025 论文对 GPT-4 级模型推理能耗的估算',
  },
  {
    id: 'gpt4o-mini',
    name: 'GPT-4o mini',
    provider: 'OpenAI',
    color: '#6ee7b7',
    energyPerMToken: 0.03,
    uncertaintyRange: 0.3,
    capabilityScore: 72,
    pricePerMToken: 0.6,
    notes: '小模型推理效率高约 6-8 倍',
  },
  {
    id: 'claude-opus',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    color: '#d4a574',
    energyPerMToken: 0.45,
    uncertaintyRange: 0.5,
    capabilityScore: 94,
    pricePerMToken: 75,
    notes: '推测值。Anthropic 未公开能耗数据，基于模型规模推断。',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    color: '#e8c9a0',
    energyPerMToken: 0.15,
    uncertaintyRange: 0.4,
    capabilityScore: 88,
    pricePerMToken: 15,
    notes: '推测值，中等规模模型',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    color: '#4285f4',
    energyPerMToken: 0.25,
    uncertaintyRange: 0.35,
    capabilityScore: 90,
    pricePerMToken: 10,
    notes: '基于 Google 2025 环境报告推算。Google 数据中心大量使用可再生能源。',
  },
  {
    id: 'llama4-405b',
    name: 'Llama 4 405B',
    provider: 'Meta (self-hosted)',
    color: '#0084ff',
    energyPerMToken: 0.6,
    uncertaintyRange: 0.45,
    capabilityScore: 86,
    pricePerMToken: 5,
    notes: '自建部署。能耗取决于硬件配置，此处假设 8×H100 集群。',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    color: '#6366f1',
    energyPerMToken: 0.12,
    isMoE: true,
    activeParams: '37B active / 671B total',
    uncertaintyRange: 0.35,
    capabilityScore: 84,
    pricePerMToken: 1.1,
    notes: 'MoE 架构，实际激活参数少，推理能效较高',
  },
  {
    id: 'qwen3',
    name: 'Qwen 3',
    provider: 'Alibaba',
    color: '#f97316',
    energyPerMToken: 0.18,
    isMoE: true,
    activeParams: '约 30B active',
    uncertaintyRange: 0.45,
    capabilityScore: 83,
    pricePerMToken: 1.6,
    notes: '推测值。MoE 架构，基于公开参数规模估算。',
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large 3',
    provider: 'Mistral',
    color: '#a78bfa',
    energyPerMToken: 0.22,
    uncertaintyRange: 0.4,
    capabilityScore: 81,
    pricePerMToken: 8,
    notes: '推测值。欧洲数据中心，绿色能源占比较高。',
  },
  {
    id: 'grok3',
    name: 'Grok 3',
    provider: 'xAI',
    color: '#ec4899',
    energyPerMToken: 0.55,
    uncertaintyRange: 0.5,
    capabilityScore: 91,
    pricePerMToken: 20,
    notes: '推测值。Colossus 集群 (100K GPU) 的高性能推理。',
  },
];

export const PRESET_SCENARIOS: PresetScenario[] = [
  { label: '一条聊天消息', description: '约 50 tokens', tokens: 50, icon: '💬' },
  { label: '写一篇摘要', description: '约 500 tokens 输入 + 300 输出', tokens: 800, icon: '📝' },
  { label: '翻译一篇文章', description: '约 2000 tokens', tokens: 2000, icon: '🌐' },
  { label: '长文档分析', description: '约 50K tokens', tokens: 50000, icon: '📄' },
  { label: '代码生成', description: '约 10K tokens', tokens: 10000, icon: '💻' },
  { label: '生成一张图片', description: '等效约 30K tokens 能耗', tokens: 30000, icon: '🖼' },
];

// Task types for "My AI Day" tab
export const TASK_TYPES: TaskType[] = [
  { id: 'chat', label: '对话/问答', description: '每次约 800 tokens', tokensEquivalent: 800, icon: '💬' },
  { id: 'code', label: '代码辅助', description: '每次约 3000 tokens', tokensEquivalent: 3000, icon: '💻' },
  { id: 'image', label: '图像生成', description: '每张约 30K tokens 等效能耗', tokensEquivalent: 30000, icon: '🎨' },
  { id: 'translate', label: '翻译', description: '每次约 2000 tokens', tokensEquivalent: 2000, icon: '🌐' },
  { id: 'doc', label: '文档分析', description: '每次约 20K tokens', tokensEquivalent: 20000, icon: '📄' },
  { id: 'search', label: 'AI 搜索', description: '每次约 500 tokens', tokensEquivalent: 500, icon: '🔍' },
];

// Carbon intensity (gCO2 per kWh) by region
// Source: IEA 2025 Global Energy Review
export const CARBON_INTENSITY: Record<string, RegionInfo> = {
  us: { label: '美国 (平均)', gCO2perKWh: 380, color: '#3b82f6' },
  eu: { label: '欧洲 (平均)', gCO2perKWh: 230, color: '#10b981' },
  cn: { label: '中国 (平均)', gCO2perKWh: 540, color: '#ef4444' },
  india: { label: '印度', gCO2perKWh: 710, color: '#f97316' },
  japan: { label: '日本', gCO2perKWh: 450, color: '#8b5cf6' },
  iceland: { label: '冰岛 (地热)', gCO2perKWh: 28, color: '#06b6d4' },
  renewable: { label: '100% 可再生能源', gCO2perKWh: 20, color: '#22c55e' },
};

// Water Usage Effectiveness: L per kWh (datacenter cooling)
// Based on Microsoft & Google 2025 sustainability reports
// Range: 0.5-5.0 L/kWh depending on datacenter (arXiv 2505.09598)
export const WATER_PER_KWH = 1.8; // liters per kWh (median estimate)

export const EQUIVALENTS: EquivalentItem[] = [
  { label: '充手机', icon: '📱', perGramCO2: 8.5, unit: '次' },
  { label: '汽车行驶', icon: '🚗', perGramCO2: 0.21, unit: '米' },
  { label: 'LED 灯泡点亮', icon: '💡', perGramCO2: 0.1, unit: '秒' },
  { label: '一棵树每天吸收', icon: '🌳', perGramCO2: 60, unit: '秒' },
  { label: '一杯咖啡', icon: '☕', perGramCO2: 21, unit: '%' },
];

// Daily activity presets for "My AI Day"
export const DAY_PRESETS: Record<string, { label: string; description: string; activities: Omit<DayActivity, 'id'>[] }> = {
  light: {
    label: '轻度用户',
    description: '偶尔搜索、简单问答',
    activities: [
      { taskTypeId: 'chat', modelId: 'gpt4o-mini', quantity: 5, label: '早间 5 条简单问答' },
      { taskTypeId: 'search', modelId: 'gpt4o-mini', quantity: 3, label: '3 次 AI 搜索' },
    ],
  },
  moderate: {
    label: '中度用户',
    description: '每天用 AI 处理工作',
    activities: [
      { taskTypeId: 'chat', modelId: 'gpt4o', quantity: 20, label: '20 轮对话' },
      { taskTypeId: 'code', modelId: 'claude-sonnet', quantity: 10, label: '10 次代码辅助' },
      { taskTypeId: 'translate', modelId: 'gpt4o-mini', quantity: 3, label: '翻译 3 篇文章' },
    ],
  },
  heavy: {
    label: '重度用户',
    description: '全天候 AI 协作',
    activities: [
      { taskTypeId: 'chat', modelId: 'gpt5', quantity: 50, label: '50 轮深度对话' },
      { taskTypeId: 'code', modelId: 'claude-opus', quantity: 30, label: '30 次代码生成' },
      { taskTypeId: 'doc', modelId: 'gpt4o', quantity: 5, label: '5 份文档分析' },
      { taskTypeId: 'image', modelId: 'gpt4o', quantity: 10, label: '生成 10 张图片' },
      { taskTypeId: 'translate', modelId: 'gpt4o', quantity: 5, label: '翻译 5 篇文章' },
    ],
  },
  researcher: {
    label: '研究员',
    description: '论文阅读 + 代码实验',
    activities: [
      { taskTypeId: 'doc', modelId: 'claude-opus', quantity: 8, label: '8 篇论文分析' },
      { taskTypeId: 'code', modelId: 'claude-sonnet', quantity: 20, label: '20 次代码实验' },
      { taskTypeId: 'chat', modelId: 'gpt4o', quantity: 30, label: '30 轮讨论' },
    ],
  },
};
