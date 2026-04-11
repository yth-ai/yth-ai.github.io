// ============================================================
// Prompt 多维分析引擎
// ============================================================

export interface AnalysisResult {
  totalChars: number;
  totalTokensEst: number;
  lines: number;
  nonEmptyLines: number;
  techniques: string[];
  // 五维评分
  dimensions: {
    clarity: number;     // 清晰度 0-20
    structure: number;   // 结构性 0-20
    guidance: number;    // 引导性 0-20
    robustness: number;  // 鲁棒性 0-20
    efficiency: number;  // 效率 0-20
  };
  totalScore: number;
  suggestions: string[];
  // 检测标记
  hasExamples: boolean;
  hasFormat: boolean;
  hasCoT: boolean;
  hasRole: boolean;
  hasConstraint: boolean;
  hasSystemUser: boolean;
  hasTools: boolean;
  hasSelfCheck: boolean;
  exampleCount: number;
}

export function analyzePrompt(text: string): AnalysisResult {
  if (!text.trim()) {
    return {
      totalChars: 0, totalTokensEst: 0, lines: 0, nonEmptyLines: 0,
      techniques: [], dimensions: { clarity: 0, structure: 0, guidance: 0, robustness: 0, efficiency: 0 },
      totalScore: 0, suggestions: ['请先输入或选择一个 Prompt 模板'],
      hasExamples: false, hasFormat: false, hasCoT: false, hasRole: false,
      hasConstraint: false, hasSystemUser: false, hasTools: false, hasSelfCheck: false, exampleCount: 0,
    };
  }

  const totalChars = text.length;
  const totalTokensEst = Math.ceil(totalChars * 0.6);
  const lines = text.split('\n');
  const nonEmptyLines = lines.filter(l => l.trim()).length;

  // 检测技巧
  const hasExamples = /示例|example|e\.g\.|例[如子]|输入[\s:：].*\n.*输出[\s:：]/i.test(text);
  const hasFormat = /json|xml|格式|format|schema|```|表格|csv/i.test(text);
  const hasCoT = /一步步|step.by.step|逐步|让我们.*思考|分析.*步骤|第[一二三]步/i.test(text);
  const hasRole = /你是|you are|作为|as a|扮演|角色/i.test(text);
  const hasConstraint = /必须|不要|注意|要求|请勿|禁止|限制|约束|规则|不得|不允许/i.test(text);
  const hasSystemUser = /\[system\]|\[user\]|\[assistant\]|system\s*prompt|system[\s:：]/i.test(text);
  const hasTools = /tool|工具|action|observation|function.call|可用.*工具/i.test(text);
  const hasSelfCheck = /检查|验证|评估|核查|校验|自我.*评|修正|refine|reflect/i.test(text);

  // 示例计数
  const exampleMatches = text.match(/示例\s*\d|example\s*\d|输入[\s:：].*\n.*输出[\s:：]/gi);
  const exampleCount = exampleMatches ? exampleMatches.length : 0;

  // 技巧列表
  const techniques: string[] = [];
  if (hasExamples) techniques.push('Few-Shot');
  if (hasFormat) techniques.push('结构化输出');
  if (hasCoT) techniques.push('思维链');
  if (hasRole) techniques.push('角色设定');
  if (hasConstraint) techniques.push('约束条件');
  if (hasSystemUser) techniques.push('System/User 分段');
  if (hasTools) techniques.push('工具调用');
  if (hasSelfCheck) techniques.push('自我校验');
  if (techniques.length === 0) techniques.push('Zero-Shot');

  // 五维评分
  // 1. 清晰度：任务指令是否明确
  let clarity = 5;
  if (/请|任务|目标|需要你/i.test(text)) clarity += 4;
  if (text.length > 50) clarity += 3;
  if (/##|###|标题|步骤/i.test(text)) clarity += 4;
  if (nonEmptyLines > 3) clarity += 2;
  if (/\n\n/.test(text)) clarity += 2; // 有段落分隔
  clarity = Math.min(clarity, 20);

  // 2. 结构性：分段是否合理
  let structure = 3;
  if (hasSystemUser) structure += 5;
  if (/##\s/.test(text)) structure += 4;
  if (/\n-\s|\n\d+\.\s/.test(text)) structure += 3; // 有列表
  if (hasFormat) structure += 3;
  if (lines.length > 5) structure += 2;
  structure = Math.min(structure, 20);

  // 3. 引导性：示例 + 推理引导
  let guidance = 2;
  if (hasExamples) guidance += 6;
  if (hasCoT) guidance += 5;
  if (exampleCount >= 2) guidance += 3;
  if (hasSelfCheck) guidance += 2;
  if (hasTools) guidance += 2;
  guidance = Math.min(guidance, 20);

  // 4. 鲁棒性：约束 + 异常处理
  let robustness = 2;
  if (hasConstraint) robustness += 5;
  if (/如果|否则|异常|错误|边界|null|缺失/i.test(text)) robustness += 4;
  if (hasSelfCheck) robustness += 4;
  if (hasRole) robustness += 3;
  if (/优先级|最高/i.test(text)) robustness += 2;
  robustness = Math.min(robustness, 20);

  // 5. 效率：token 精炼度
  let efficiency = 10;
  const avgLineLen = totalChars / Math.max(lines.length, 1);
  if (totalChars > 2000) efficiency -= 3; // 过长
  if (avgLineLen > 200) efficiency -= 2; // 行太长
  if (totalChars < 20) efficiency -= 5; // 过短
  const redundancy = (text.match(/\b(\w{4,})\b.*\b\1\b/g) || []).length;
  if (redundancy > 5) efficiency -= 2;
  efficiency = Math.max(2, Math.min(efficiency, 20));

  const dimensions = { clarity, structure, guidance, robustness, efficiency };
  const totalScore = clarity + structure + guidance + robustness + efficiency;

  // 优化建议
  const suggestions: string[] = [];
  if (!hasExamples && !hasCoT) {
    suggestions.push('检测到 Zero-Shot 模式，建议加入 1-2 个示例（Few-Shot）或推理引导（CoT）提升一致性');
  }
  if (!hasFormat) {
    suggestions.push('没有发现输出格式约束，建议添加 JSON Schema 或表格格式，确保输出可解析');
  }
  if (!hasConstraint) {
    suggestions.push('缺少明确的约束条件，建议添加"不要""必须"等限制来减少输出偏差');
  }
  if (!hasRole && totalChars > 100) {
    suggestions.push('考虑添加角色设定，让模型以专家身份回答可以提升专业性');
  }
  if (hasExamples && exampleCount < 2) {
    suggestions.push('示例数量偏少，建议提供 2-3 个示例覆盖不同情况');
  }
  if (totalChars > 1500 && !hasSystemUser) {
    suggestions.push('Prompt 较长，建议使用 [System]/[User] 分段提高结构清晰度');
  }
  if (hasCoT && !hasSelfCheck) {
    suggestions.push('使用了推理链但缺少自我校验，考虑加入"检查你的推理过程"');
  }
  if (suggestions.length === 0) {
    suggestions.push('Prompt 质量优秀，已覆盖多种关键技巧');
  }

  return {
    totalChars, totalTokensEst, lines: lines.length, nonEmptyLines,
    techniques, dimensions, totalScore, suggestions,
    hasExamples, hasFormat, hasCoT, hasRole, hasConstraint,
    hasSystemUser, hasTools, hasSelfCheck, exampleCount,
  };
}
