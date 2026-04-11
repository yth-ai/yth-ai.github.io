// ============================================================
// Prompt 工程技术图鉴数据
// ============================================================

export interface Technique {
  id: string;
  name: string;
  nameEn: string;
  year: number;
  paper?: string;
  oneLiner: string;
  description: string;
  difficulty: number; // 1-5
  useCases: string[];
  category: string;
  color: string;
  relatedTemplateId?: string;
}

export const TECHNIQUES: Technique[] = [
  {
    id: 'zero-shot',
    name: 'Zero-Shot',
    nameEn: 'Zero-Shot Prompting',
    year: 2020,
    paper: 'GPT-3 (Brown et al.)',
    oneLiner: '直接给指令，不给示例',
    description: '最基础的提示方式。依赖模型的预训练知识，直接理解并执行任务指令。简单任务效果好，复杂任务可能需要更多引导。',
    difficulty: 1,
    useCases: ['简单分类', '翻译', '摘要'],
    category: '基础',
    color: '#3b82f6',
    relatedTemplateId: 'zero-shot',
  },
  {
    id: 'few-shot',
    name: 'Few-Shot',
    nameEn: 'Few-Shot Learning',
    year: 2020,
    paper: 'GPT-3 (Brown et al.)',
    oneLiner: '给几个示例，让模型"照猫画虎"',
    description: '通过 2-5 个输入-输出示例，让模型理解任务的模式和格式。是最实用的提示技术之一，几乎适用于所有任务类型。',
    difficulty: 2,
    useCases: ['格式敏感任务', '分类', '信息抽取', 'NER'],
    category: '基础',
    color: '#3b82f6',
    relatedTemplateId: 'few-shot',
  },
  {
    id: 'cot',
    name: 'Chain-of-Thought',
    nameEn: 'Chain-of-Thought',
    year: 2022,
    paper: 'Wei et al., 2022',
    oneLiner: '"让我们一步步思考"',
    description: '引导模型显式展开推理过程，而不是直接给出答案。在数学、逻辑、多步推理任务中效果显著，是推理类提示的基石。',
    difficulty: 2,
    useCases: ['数学推理', '逻辑推理', '多步决策'],
    category: '推理',
    color: '#8b5cf6',
    relatedTemplateId: 'cot',
  },
  {
    id: 'self-consistency',
    name: 'Self-Consistency',
    nameEn: 'Self-Consistency',
    year: 2022,
    paper: 'Wang et al., 2022',
    oneLiner: '多次推理 + 投票取最一致的答案',
    description: '在 CoT 基础上，对同一问题进行多次采样推理，然后通过多数投票选择最一致的答案。可以显著过滤随机错误。',
    difficulty: 3,
    useCases: ['数学题', '事实问答', '有确定答案的任务'],
    category: '推理',
    color: '#8b5cf6',
    relatedTemplateId: 'self-consistency',
  },
  {
    id: 'react',
    name: 'ReAct',
    nameEn: 'ReAct',
    year: 2022,
    paper: 'Yao et al., 2022',
    oneLiner: '思考 → 行动 → 观察，循环往复',
    description: '结合推理（Reasoning）和行动（Acting），让模型交替进行思考和工具调用。是几乎所有 Agent 框架的基础范式。',
    difficulty: 3,
    useCases: ['工具调用', 'Agent', '信息检索', '问答'],
    category: 'Agent',
    color: '#10b981',
    relatedTemplateId: 'react',
  },
  {
    id: 'tot',
    name: 'Tree-of-Thought',
    nameEn: 'Tree-of-Thought',
    year: 2023,
    paper: 'Yao et al., 2023',
    oneLiner: '多条路径并行探索 + 评估 + 回溯',
    description: '将推理组织为树结构，在每个节点生成多个候选思路，评估后选择最优路径继续探索。适合复杂开放性问题。',
    difficulty: 4,
    useCases: ['复杂规划', '创意写作', '博弈策略'],
    category: '推理',
    color: '#8b5cf6',
    relatedTemplateId: 'tree-of-thought',
  },
  {
    id: 'self-refine',
    name: '自我修正',
    nameEn: 'Self-Refine / Reflexion',
    year: 2023,
    paper: 'Madaan et al., 2023',
    oneLiner: '生成 → 评估 → 修正，自我迭代',
    description: '让模型生成初始输出后自我评估，发现问题后进行修正。类似人类的"写完检查"流程，可以显著提升输出质量。',
    difficulty: 3,
    useCases: ['代码审查', '文章润色', '翻译校对'],
    category: '推理',
    color: '#8b5cf6',
    relatedTemplateId: 'self-refine',
  },
  {
    id: 'meta-prompting',
    name: 'Meta-Prompting',
    nameEn: 'Meta-Prompting',
    year: 2024,
    paper: 'Suzgun & Kalai, 2024',
    oneLiner: '用 Prompt 来写 Prompt',
    description: '让模型作为 Prompt 工程专家，为特定任务自动生成最优 Prompt。元提示方法可以显著降低手写 Prompt 的门槛。',
    difficulty: 4,
    useCases: ['Prompt 优化', '自动化工作流', '批量任务'],
    category: '推理',
    color: '#8b5cf6',
    relatedTemplateId: 'meta-prompting',
  },
  {
    id: 'costar',
    name: 'COSTAR',
    nameEn: 'COSTAR Framework',
    year: 2024,
    oneLiner: 'Context-Objective-Style-Tone-Audience-Response',
    description: '六维结构化提示框架，确保 Prompt 覆盖所有必要维度。特别适合内容创作和报告编写类任务。',
    difficulty: 2,
    useCases: ['内容创作', '报告编写', '营销文案'],
    category: '框架',
    color: '#f59e0b',
    relatedTemplateId: 'costar',
  },
  {
    id: 'risen',
    name: 'RISEN',
    nameEn: 'RISEN Framework',
    year: 2024,
    oneLiner: 'Role-Instructions-Steps-End goal-Narrowing',
    description: '任务分解型提示框架，通过明确步骤和约束来引导模型。特别适合复杂工程任务和方案设计。',
    difficulty: 2,
    useCases: ['方案设计', '工程任务', '系统设计'],
    category: '框架',
    color: '#f59e0b',
    relatedTemplateId: 'risen',
  },
  {
    id: 'structured-output',
    name: '结构化输出',
    nameEn: 'Structured Output',
    year: 2022,
    oneLiner: '用 JSON/XML Schema 约束输出格式',
    description: '通过提供明确的输出格式模板（JSON Schema、XML Tag 等），确保模型输出结构化且可程序化解析。',
    difficulty: 2,
    useCases: ['信息抽取', 'API 响应', '数据转换'],
    category: '格式',
    color: '#06b6d4',
    relatedTemplateId: 'structured',
  },
  {
    id: 'adversarial-guard',
    name: '对抗防护',
    nameEn: 'Adversarial Guard',
    year: 2024,
    oneLiner: 'System Prompt 防注入，安全第一',
    description: '在 System Prompt 中设置安全规则，防止 Prompt 注入攻击。是生产环境 AI 应用的必备防护。',
    difficulty: 3,
    useCases: ['生产 AI 应用', '客服机器人', '开放 API'],
    category: '安全',
    color: '#ef4444',
    relatedTemplateId: 'adversarial-guard',
  },
];

// 演化时间线数据
export interface TimelineEvent {
  year: number;
  month?: number;
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  color: string;
}

export const TIMELINE: TimelineEvent[] = [
  { year: 2020, month: 5, name: 'Few-Shot Prompting', description: 'GPT-3 论文展示了 In-Context Learning 的惊人能力', impact: 'high', category: '基础', color: '#3b82f6' },
  { year: 2022, month: 1, name: 'Chain-of-Thought', description: 'Wei et al. 发现"让模型一步步思考"能大幅提升推理能力', impact: 'high', category: '推理', color: '#8b5cf6' },
  { year: 2022, month: 3, name: 'Self-Consistency', description: '多路径采样 + 投票机制，CoT 的重要增强', impact: 'medium', category: '推理', color: '#8b5cf6' },
  { year: 2022, month: 10, name: 'ReAct', description: '推理 + 行动交替，开启 Agent 时代', impact: 'high', category: 'Agent', color: '#10b981' },
  { year: 2023, month: 5, name: 'Tree-of-Thought', description: '多路径并行探索 + 评估回溯，系统化推理', impact: 'medium', category: '推理', color: '#8b5cf6' },
  { year: 2023, month: 6, name: 'Self-Refine', description: '生成 → 评估 → 修正的自我迭代范式', impact: 'medium', category: '推理', color: '#8b5cf6' },
  { year: 2023, month: 11, name: 'System Prompt 标准化', description: 'OpenAI GPT-4 Turbo 确立 System/User/Assistant 三段式', impact: 'high', category: '格式', color: '#06b6d4' },
  { year: 2024, month: 1, name: 'Meta-Prompting', description: '用 LLM 自动生成和优化 Prompt', impact: 'medium', category: '推理', color: '#8b5cf6' },
  { year: 2024, month: 3, name: 'COSTAR & RISEN', description: '结构化提示框架流行，降低 Prompt 编写门槛', impact: 'medium', category: '框架', color: '#f59e0b' },
  { year: 2024, month: 6, name: 'DSPy', description: '将 Prompt 编程化，自动优化 Prompt 管线', impact: 'high', category: 'Agent', color: '#10b981' },
  { year: 2025, month: 1, name: 'Prompt Chaining', description: '多步 Prompt 串联，构建复杂 AI 工作流', impact: 'high', category: 'Agent', color: '#10b981' },
  { year: 2025, month: 6, name: 'Adaptive Prompting', description: '根据任务难度自动调整提示策略', impact: 'medium', category: '推理', color: '#8b5cf6' },
];

// 决策树数据
export interface DecisionNode {
  id: string;
  question: string;
  yes?: string; // node id
  no?: string;  // node id
  result?: string; // technique id if leaf
  resultLabel?: string;
}

export const DECISION_TREE: DecisionNode[] = [
  { id: 'root', question: '你的任务需要多步推理吗？', yes: 'reasoning-depth', no: 'need-format' },
  { id: 'reasoning-depth', question: '推理链条超过 3 步吗？', yes: 'open-ended', no: 'cot-result' },
  { id: 'open-ended', question: '问题是开放性的（多个合理答案）吗？', yes: 'tot-result', no: 'need-tools' },
  { id: 'need-tools', question: '需要调用外部工具获取信息吗？', yes: 'react-result', no: 'sc-result' },
  { id: 'need-format', question: '需要特定格式输出（JSON/表格）吗？', yes: 'structured-result', no: 'need-role' },
  { id: 'need-role', question: '需要专业领域知识吗？', yes: 'role-result', no: 'complexity' },
  { id: 'complexity', question: '任务描述比较复杂吗？', yes: 'costar-result', no: 'few-shot-check' },
  { id: 'few-shot-check', question: '你有示例数据吗？', yes: 'few-shot-result', no: 'zero-shot-result' },
  // Leaf nodes
  { id: 'cot-result', question: '', result: 'cot', resultLabel: 'Chain-of-Thought' },
  { id: 'tot-result', question: '', result: 'tot', resultLabel: 'Tree-of-Thought' },
  { id: 'react-result', question: '', result: 'react', resultLabel: 'ReAct' },
  { id: 'sc-result', question: '', result: 'self-consistency', resultLabel: 'Self-Consistency' },
  { id: 'structured-result', question: '', result: 'structured-output', resultLabel: '结构化输出' },
  { id: 'role-result', question: '', result: 'role-play', resultLabel: 'Role Playing' },
  { id: 'costar-result', question: '', result: 'costar', resultLabel: 'COSTAR 框架' },
  { id: 'few-shot-result', question: '', result: 'few-shot', resultLabel: 'Few-Shot' },
  { id: 'zero-shot-result', question: '', result: 'zero-shot', resultLabel: 'Zero-Shot' },
];
