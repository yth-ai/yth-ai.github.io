// ============================================================
// Prompt 链预设数据
// ============================================================

export interface ChainNode {
  id: string;
  type: 'prompt' | 'transform' | 'branch' | 'merge';
  label: string;
  description: string;
  template?: string;
  position: { x: number; y: number };
  connections: string[]; // target node ids
}

export interface ChainPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: ChainNode[];
  mockData: Record<string, { input: string; output: string }>;
}

export const CHAIN_PRESETS: ChainPreset[] = [
  {
    id: 'rag-pipeline',
    name: 'RAG 管线',
    description: '查询理解 → 检索改写 → 答案生成 → 事实核查',
    icon: '🔍',
    nodes: [
      { id: 'n1', type: 'prompt', label: '查询理解', description: '分析用户意图，提取关键实体', position: { x: 80, y: 60 }, connections: ['n2'], template: '分析以下查询的意图和关键实体：\n"{{query}}"' },
      { id: 'n2', type: 'transform', label: '检索改写', description: '将查询改写为多个检索子查询', position: { x: 280, y: 60 }, connections: ['n3'], template: '将以下查询拆解为 3 个精确的检索子查询：\n原始查询：{{parsed_query}}' },
      { id: 'n3', type: 'prompt', label: '答案生成', description: '基于检索结果生成答案', position: { x: 480, y: 60 }, connections: ['n4'], template: '基于以下参考资料回答问题：\n资料：{{retrieved_docs}}\n问题：{{original_query}}' },
      { id: 'n4', type: 'prompt', label: '事实核查', description: '验证答案中的事实是否有据可查', position: { x: 680, y: 60 }, connections: [], template: '检查以下答案中的每个事实性声明是否在参考资料中有依据：\n答案：{{answer}}\n资料：{{retrieved_docs}}' },
    ],
    mockData: {
      n1: { input: 'GPT-4 和 Claude 3 哪个推理能力更强？', output: '意图：模型对比\n实体：GPT-4, Claude 3\n维度：推理能力' },
      n2: { input: '意图：模型对比\n实体：GPT-4, Claude 3', output: '子查询 1: GPT-4 推理 benchmark 成绩\n子查询 2: Claude 3 推理能力评测\n子查询 3: GPT-4 vs Claude 3 对比测评' },
      n3: { input: '[检索到的 3 篇文档摘要]', output: '根据现有评测数据，GPT-4 在 MATH 和 HumanEval 上略优，Claude 3 Opus 在长文本推理和指令跟随上表现更好。两者差距不大，选择取决于具体场景。' },
      n4: { input: '答案 + 参考资料', output: '✅ GPT-4 MATH 成绩 — 有据\n✅ Claude 3 长文本 — 有据\n⚠️ "差距不大" — 主观判断，建议标注' },
    },
  },
  {
    id: 'code-review',
    name: '代码审查',
    description: '代码输入 → 缺陷检测 → 改进建议 → 改进代码 → 验证',
    icon: '🔧',
    nodes: [
      { id: 'n1', type: 'prompt', label: '代码输入', description: '接收待审查的代码', position: { x: 80, y: 60 }, connections: ['n2'] },
      { id: 'n2', type: 'prompt', label: '缺陷检测', description: '分析代码中的 Bug、安全问题、性能问题', position: { x: 280, y: 60 }, connections: ['n3', 'n3b'], template: '作为资深代码审查员，分析以下代码的潜在问题：\n```\n{{code}}\n```\n从以下维度检查：\n1. Bug 和逻辑错误\n2. 安全漏洞\n3. 性能问题\n4. 代码风格' },
      { id: 'n3', type: 'prompt', label: '改进建议', description: '针对检测到的问题给出具体建议', position: { x: 480, y: 20 }, connections: ['n4'], template: '针对以下代码问题，给出具体的改进建议：\n问题列表：{{issues}}\n原始代码：{{code}}' },
      { id: 'n3b', type: 'branch', label: '严重性判断', description: '问题是否为关键缺陷？', position: { x: 480, y: 110 }, connections: ['n4'] },
      { id: 'n4', type: 'merge', label: '输出报告', description: '汇总缺陷和改进建议', position: { x: 680, y: 60 }, connections: [] },
    ],
    mockData: {
      n1: { input: 'def process(data):\n  for i in range(len(data)):\n    if data[i] > 0:\n      data.append(data[i])', output: '代码已接收，共 4 行' },
      n2: { input: '代码分析中...', output: '🔴 关键 Bug：循环中修改列表长度，导致无限循环\n🟡 风格：range(len()) 应改为 enumerate\n🟢 建议：使用列表推导式更 Pythonic' },
      n3: { input: '问题列表', output: '1. 使用新列表收集结果，不在原地修改\n2. 用 enumerate 或直接迭代\n3. 考虑用列表推导式' },
      n3b: { input: '严重性评估', output: '🔴 发现关键缺陷（无限循环），标记为高优先级' },
      n4: { input: '汇总报告', output: '## 审查报告\n- 关键问题 1 个（无限循环）\n- 改进建议 2 个\n- 修复后代码已生成' },
    },
  },
  {
    id: 'content-creation',
    name: '内容创作',
    description: '主题输入 → 大纲生成 → 逐段扩展 → 风格统一 → 最终润色',
    icon: '✍️',
    nodes: [
      { id: 'n1', type: 'prompt', label: '主题输入', description: '定义文章主题和目标受众', position: { x: 80, y: 60 }, connections: ['n2'], template: '主题：{{topic}}\n受众：{{audience}}\n风格：{{style}}' },
      { id: 'n2', type: 'prompt', label: '大纲生成', description: '生成文章结构和核心论点', position: { x: 280, y: 60 }, connections: ['n3'], template: '为以下主题生成文章大纲：\n主题：{{topic}}\n要求：3-5 个主要章节，每章 2-3 个子点' },
      { id: 'n3', type: 'prompt', label: '逐段扩展', description: '按大纲逐段生成内容', position: { x: 480, y: 60 }, connections: ['n4'], template: '根据以下大纲，扩展第 {{section_num}} 章的内容：\n大纲：{{outline}}\n要求：每段 200-300 字，包含具体例子' },
      { id: 'n4', type: 'transform', label: '风格统一', description: '确保全文风格一致', position: { x: 680, y: 60 }, connections: ['n5'], template: '检查并统一以下文章的写作风格：\n目标风格：{{style}}\n文章：{{draft}}' },
      { id: 'n5', type: 'prompt', label: '最终润色', description: '最终审校和优化', position: { x: 880, y: 60 }, connections: [], template: '对以下文章进行最终润色：\n1. 检查事实准确性\n2. 优化过渡句\n3. 确保首尾呼应\n文章：{{article}}' },
    ],
    mockData: {
      n1: { input: '主题：RAG 入门指南\n受众：后端开发者', output: '确认：技术博客风格，面向有 Python 经验的后端开发者' },
      n2: { input: '生成大纲...', output: '1. 什么是 RAG？为什么需要它\n2. RAG 核心架构：索引-检索-生成\n3. 动手实现：用 LangChain 搭建\n4. 常见陷阱和优化技巧\n5. 总结与展望' },
      n3: { input: '扩展第 1 章...', output: 'RAG（Retrieval-Augmented Generation）的核心思想是让语言模型"开卷考试"...' },
      n4: { input: '风格统一检查...', output: '✅ 技术术语一致\n✅ 人称一致（第二人称）\n⚠️ 第 3 章偏口语化，已调整' },
      n5: { input: '最终润色...', output: '文章已完成润色，共 2400 字，阅读时间约 8 分钟' },
    },
  },
];
