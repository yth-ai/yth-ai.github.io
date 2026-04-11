import { useState, useMemo } from 'react';
import { TEMPLATES, type PromptTemplate } from './templates';
import { analyzePrompt } from './PromptAnalyzer';
import RadarChart from './RadarChart';

// ============================================================
// Tab 2: Prompt 对决 (A/B Arena)
// ============================================================

interface Duel {
  name: string;
  description: string;
  whyRight: string;
  whenLeft: string;
  leftId: string;
  rightId: string;
  sharedVars: Record<string, string>;
}

const PRESET_DUELS: Duel[] = [
  {
    name: 'Zero-Shot vs Few-Shot',
    description: '同一分类任务，有无示例的差异',
    whyRight: 'Few-Shot 通过示例明确了输出格式和分类标准，减少歧义。模型不需要猜测"积极"还是"正面"的用词。',
    whenLeft: '任务极其简单且格式不敏感时（如翻译），Zero-Shot 更高效，节省 Token。',
    leftId: 'zero-shot',
    rightId: 'few-shot',
    sharedVars: { task_instruction: '请判断以下文本的情感倾向（积极/消极/中性）', input: '今天天气还不错，适合出去走走。' },
  },
  {
    name: '裸 Prompt vs Chain-of-Thought',
    description: '同一数学题，是否引导逐步推理',
    whyRight: 'CoT 强制模型展示推理过程，避免"猜答案"。对于需要计算的问题，显式展开中间步骤大幅提升准确率。',
    whenLeft: '简单的事实查询（如"什么是 Transformer"），不需要推理步骤，CoT 反而浪费 Token。',
    leftId: 'zero-shot',
    rightId: 'cot',
    sharedVars: { task_instruction: '请计算以下问题', input: '如果训练一个 7B 参数的模型需要 1T tokens，按照 Chinchilla 最优比例（tokens ≈ 20 × params），训练一个 70B 的模型需要多少 tokens？' },
  },
  {
    name: '无角色 vs 角色设定',
    description: '同一代码审查任务，有无专家角色的差异',
    whyRight: '角色设定激活了模型关于"资深工程师"的知识路径，输出更专业、更有结构。相当于给模型一个"身份锚点"。',
    whenLeft: '客观事实任务（如数据转换），角色设定可能引入不必要的主观性。',
    leftId: 'zero-shot',
    rightId: 'role-play',
    sharedVars: { task_instruction: '审查以下代码并给出改进建议', input: 'def process(data):\n  result = []\n  for i in range(len(data)):\n    if data[i] > 0:\n      result.append(data[i] * 2)\n  return result' },
  },
  {
    name: '自由格式 vs JSON Schema',
    description: '同一信息抽取任务，有无格式约束',
    whyRight: '结构化输出确保每次返回格式一致，可以直接程序化解析。没有格式约束时，模型可能每次用不同格式回答。',
    whenLeft: '创意写作、开放式讨论等不需要程序化处理的场景，格式约束会限制表达。',
    leftId: 'zero-shot',
    rightId: 'structured',
    sharedVars: { task_instruction: '从以下文本中提取关键信息', input: 'OpenAI 于 2024年3月发布了 GPT-4o，支持 128K 上下文窗口，训练数据截止 2023 年 12 月。' },
  },
  {
    name: '单步 vs ReAct 循环',
    description: '同一搜索任务，直接回答 vs 思考-行动循环',
    whyRight: 'ReAct 让模型可以"查资料后再回答"，而不是凭记忆猜测。对于需要精确数据的任务，工具调用远比背诵可靠。',
    whenLeft: '纯创意任务（如写诗），不需要外部工具，ReAct 的格式开销是多余的。',
    leftId: 'zero-shot',
    rightId: 'react',
    sharedVars: { task_instruction: '回答以下问题', input: '训练一个 70B 参数的模型需要多少 GPU 显存？如果用 bf16 精度呢？' },
  },
];

export default function PromptArena() {
  const [activeDuel, setActiveDuel] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const duel = PRESET_DUELS[activeDuel];
  const leftTemplate = TEMPLATES.find(t => t.id === duel.leftId)!;
  const rightTemplate = TEMPLATES.find(t => t.id === duel.rightId)!;

  const renderPrompt = (template: PromptTemplate, extraVars: Record<string, string>) => {
    const mergedVars: Record<string, string> = {};
    template.variables.forEach(v => { mergedVars[v.key] = extraVars[v.key] || v.defaultValue; });
    return template.template.replace(/\{\{(\w+)\}\}/g, (_, key) => mergedVars[key] || `{{${key}}}`);
  };

  const leftPrompt = renderPrompt(leftTemplate, duel.sharedVars);
  const rightPrompt = renderPrompt(rightTemplate, duel.sharedVars);
  const leftAnalysis = useMemo(() => analyzePrompt(leftPrompt), [leftPrompt]);
  const rightAnalysis = useMemo(() => analyzePrompt(rightPrompt), [rightPrompt]);

  return (
    <div className="space-y-5">
      {/* Duel selector */}
      <div className="flex flex-wrap gap-2">
        {PRESET_DUELS.map((d, i) => (
          <button
            key={i}
            onClick={() => { setActiveDuel(i); setShowExplanation(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeDuel === i
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-300'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">{duel.description}</p>

      {/* A/B Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">A</span>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{leftTemplate.name}</div>
              <div className="text-xs text-slate-500">{leftTemplate.category}</div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" /><div className="w-2 h-2 rounded-full bg-yellow-400" /><div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <pre className="p-4 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[250px] overflow-y-auto leading-relaxed">{leftPrompt}</pre>
          </div>
          <RadarChart dimensions={leftAnalysis.dimensions} size={180} color="#94a3b8" label={`${leftTemplate.name} (${leftAnalysis.totalScore} 分)`} />
        </div>

        {/* Right */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-bold text-amber-600 dark:text-amber-400">B</span>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{rightTemplate.name}</div>
              <div className="text-xs text-slate-500">{rightTemplate.category}</div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-700/50 overflow-hidden">
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/30 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" /><div className="w-2 h-2 rounded-full bg-yellow-400" /><div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <pre className="p-4 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[250px] overflow-y-auto leading-relaxed">{rightPrompt}</pre>
          </div>
          <RadarChart dimensions={rightAnalysis.dimensions} size={180} color="#f59e0b" label={`${rightTemplate.name} (${rightAnalysis.totalScore} 分)`} />
        </div>
      </div>

      {/* Comparison metrics */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Token 数', left: leftAnalysis.totalTokensEst, right: rightAnalysis.totalTokensEst, suffix: '' },
            { label: '技巧数', left: leftAnalysis.techniques.length, right: rightAnalysis.techniques.length, suffix: '' },
            { label: '有效行数', left: leftAnalysis.nonEmptyLines, right: rightAnalysis.nonEmptyLines, suffix: '' },
            { label: '综合评分', left: leftAnalysis.totalScore, right: rightAnalysis.totalScore, suffix: '/100' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <div className="text-[10px] text-slate-500 mb-1">{m.label}</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-mono text-slate-500">{m.left}{m.suffix}</span>
                <span className="text-slate-300 dark:text-slate-600">vs</span>
                <span className={`text-sm font-mono font-bold ${m.right > m.left ? 'text-amber-600' : m.right < m.left ? 'text-slate-500' : 'text-slate-600'}`}>
                  {m.right}{m.suffix}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation card */}
      <button
        onClick={() => setShowExplanation(!showExplanation)}
        className="w-full text-left bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-amber-200 dark:border-slate-700 p-4 transition-all hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {showExplanation ? '隐藏解说' : '为什么 B 更好？什么时候 A 反而更合适？'}
          </span>
          <span className="text-amber-500">{showExplanation ? '△' : '▽'}</span>
        </div>
        {showExplanation && (
          <div className="mt-3 space-y-3" onClick={e => e.stopPropagation()}>
            <div>
              <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">为什么 B 更好</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{duel.whyRight}</p>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">什么时候 A 反而合适</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{duel.whenLeft}</p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
