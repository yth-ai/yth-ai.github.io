import { useState, useCallback } from 'react';

// ============================================================
// Benchmark fingerprints — known patterns from common benchmarks
// ============================================================

interface BenchmarkPattern {
  name: string;
  category: string;
  patterns: { regex: RegExp; description: string; severity: 'high' | 'medium' | 'low' }[];
  description: string;
}

const BENCHMARKS: BenchmarkPattern[] = [
  {
    name: 'MMLU',
    category: '知识问答',
    description: 'Massive Multitask Language Understanding — 57 个学科的选择题',
    patterns: [
      { regex: /(?:Question|问题)\s*:\s*.+\n\s*(?:A[.)]\s*.+\n\s*B[.)]\s*.+\n\s*C[.)]\s*.+\n\s*D[.)]\s*.+)/i, description: '标准 ABCD 四选一格式', severity: 'medium' },
      { regex: /The\s+following\s+are\s+multiple\s+choice\s+questions\s+\(with\s+answers\)\s+about/i, description: 'MMLU 经典前缀', severity: 'high' },
      { regex: /Answer:\s*\(?[A-D]\)?\.?\s*$/m, description: 'MMLU 风格答案行', severity: 'low' },
    ],
  },
  {
    name: 'GSM8K',
    category: '数学推理',
    description: 'Grade School Math 8K — 小学数学应用题',
    patterns: [
      { regex: /####\s*\d+/m, description: 'GSM8K 标准答案标记 (####)', severity: 'high' },
      { regex: /(?:Natalia|James|Janet|Josh|Weng)\s+(?:sold|earns|has|bought|goes)/i, description: 'GSM8K 常见人名+动作模式', severity: 'medium' },
      { regex: /<<\d+[+\-*/]\d+=[^>]+>>/g, description: 'GSM8K 计算注释标记 (<<...>>)', severity: 'high' },
    ],
  },
  {
    name: 'HumanEval',
    category: '代码生成',
    description: 'OpenAI HumanEval — Python 函数补全测试',
    patterns: [
      { regex: /def\s+(has_close_elements|separate_paren_groups|truncate_number|below_zero|mean_absolute_deviation)\s*\(/i, description: 'HumanEval 标准函数名', severity: 'high' },
      { regex: />>> has_close_elements|>>> separate_paren_groups|>>> truncate_number/i, description: 'HumanEval docstring 测试用例', severity: 'high' },
      { regex: /METADATA\s*=\s*\{[^}]*'task_id':\s*'HumanEval/i, description: 'HumanEval 元数据标记', severity: 'high' },
    ],
  },
  {
    name: 'HellaSwag',
    category: '常识推理',
    description: 'HellaSwag — 句子补全常识推理',
    patterns: [
      { regex: /\[header\]\s+How\s+to\s+/i, description: 'HellaSwag [header] 标记', severity: 'high' },
      { regex: /\[title\]\s+.+\n\[step\]/i, description: 'HellaSwag [title]+[step] 格式', severity: 'high' },
      { regex: /ActivityNet|WikiHow/i, description: 'HellaSwag 数据源标记', severity: 'low' },
    ],
  },
  {
    name: 'TruthfulQA',
    category: '真实性',
    description: 'TruthfulQA — 测试模型回答的真实性',
    patterns: [
      { regex: /(?:What happens if you|Can you|Is it true that|What would happen)/i, description: 'TruthfulQA 常见问题开头', severity: 'low' },
      { regex: /Correct:\s*.+\nIncorrect:\s*.+/i, description: 'TruthfulQA 正确/错误答案标注', severity: 'high' },
    ],
  },
  {
    name: 'C-Eval',
    category: '中文评测',
    description: 'C-Eval — 中文多学科考试评测',
    patterns: [
      { regex: /以下是中国关于.+考试的单项选择题/i, description: 'C-Eval 标准指令', severity: 'high' },
      { regex: /答案[是为]?\s*[:：]\s*[A-D]/i, description: 'C-Eval 答案格式', severity: 'low' },
      { regex: /(?:高等数学|线性代数|概率统计|大学物理|马克思主义|毛泽东思想).+(?:A[.、]|B[.、]|C[.、]|D[.、])/i, description: 'C-Eval 学科+选项', severity: 'medium' },
    ],
  },
  {
    name: 'CMMLU',
    category: '中文评测',
    description: 'CMMLU — 中文综合知识评测',
    patterns: [
      { regex: /以下是关于.+的单项选择题，请直接给出正确答案的选项/i, description: 'CMMLU 标准指令', severity: 'high' },
      { regex: /题目[:：]\s*.+\n\s*A[.、]\s*.+\n\s*B[.、]\s*.+/i, description: 'CMMLU 题目格式', severity: 'medium' },
    ],
  },
  {
    name: 'ARC',
    category: '科学推理',
    description: 'AI2 Reasoning Challenge — 科学选择题',
    patterns: [
      { regex: /(?:Which|What|How)\s+(?:of the following|is the best|would most likely)/i, description: 'ARC 常见问题格式', severity: 'low' },
      { regex: /\(1\)\s*.+\(2\)\s*.+\(3\)\s*.+\(4\)\s*.+/i, description: 'ARC 编号选项格式', severity: 'medium' },
    ],
  },
];

// ============================================================
// N-gram overlap detection (for benchmark contamination)
// ============================================================

const KNOWN_BENCHMARK_NGRAMS = new Set([
  'the following are multiple choice questions',
  'please select the correct answer',
  'answer the following question based on',
  '以下是中国关于',
  '以下是关于',
  '请直接给出正确答案的选项',
  '#### ',
  'has_close_elements',
  'separate_paren_groups',
  '[header] how to',
]);

function detectNgramOverlap(text: string): { ngram: string; position: number }[] {
  const found: { ngram: string; position: number }[] = [];
  const lower = text.toLowerCase();
  for (const ngram of KNOWN_BENCHMARK_NGRAMS) {
    const idx = lower.indexOf(ngram.toLowerCase());
    if (idx !== -1) {
      found.push({ ngram, position: idx });
    }
  }
  return found;
}

// ============================================================
// Component
// ============================================================

interface DetectionResult {
  benchmark: string;
  category: string;
  patternDesc: string;
  severity: 'high' | 'medium' | 'low';
  matchText: string;
  position: number;
}

export default function DecontaminationDetector() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [ngramHits, setNgramHits] = useState<{ ngram: string; position: number }[]>([]);
  const [analyzed, setAnalyzed] = useState(false);

  const analyze = useCallback(() => {
    if (!inputText.trim()) return;

    const detections: DetectionResult[] = [];

    for (const bench of BENCHMARKS) {
      for (const pattern of bench.patterns) {
        const matches = inputText.matchAll(new RegExp(pattern.regex.source, pattern.regex.flags + (pattern.regex.flags.includes('g') ? '' : 'g')));
        for (const match of matches) {
          detections.push({
            benchmark: bench.name,
            category: bench.category,
            patternDesc: pattern.description,
            severity: pattern.severity,
            matchText: match[0].slice(0, 200),
            position: match.index || 0,
          });
        }
      }
    }

    // De-duplicate by position
    const unique = detections.filter(
      (d, i, arr) => arr.findIndex((x) => x.position === d.position && x.benchmark === d.benchmark) === i,
    );

    setResults(unique.sort((a, b) => {
      const sev = { high: 0, medium: 1, low: 2 };
      return sev[a.severity] - sev[b.severity];
    }));
    setNgramHits(detectNgramOverlap(inputText));
    setAnalyzed(true);
  }, [inputText]);

  const loadSample = (type: string) => {
    const samples: Record<string, string> = {
      gsm8k: `Question: Natalia sold clips to 48 of her friends in April, and then she sold half as many clips in May. How many clips did Natalia sell altogether in April and May?
Answer: Natalia sold 48/2 = <<48/2=24>>24 clips in May.
Natalia sold 48+24 = <<48+24=72>>72 clips altogether in April and May.
#### 72`,
      mmlu: `The following are multiple choice questions (with answers) about abstract algebra.

Find the degree for the given field extension Q(sqrt(2), sqrt(3), sqrt(18)) over Q.
A. 0
B. 4
C. 2
D. 6
Answer: B`,
      humaneval: `from typing import List

def has_close_elements(numbers: List[float], threshold: float) -> bool:
    """ Check if in given list of numbers, are any two numbers closer to each other than
    given threshold.
    >>> has_close_elements([1.0, 2.0, 3.0], 0.5)
    False
    >>> has_close_elements([1.0, 2.8, 3.0, 4.0, 5.0, 2.0], 0.3)
    True
    """`,
      ceval: `以下是中国关于高等数学考试的单项选择题，请选出其中的正确答案。

设函数f(x)在x=0处可导，且f(0)=0，则lim(x→0) f(x)/x =
A. f'(0)
B. -f'(0)
C. 2f'(0)
D. 0
答案是：A`,
      clean: `本文将介绍大语言模型中预训练数据清洗的常见方法。

预训练数据的质量直接影响模型的最终性能。高质量的训练语料需要经过去重、去噪、去毒性等多个步骤的处理。

常见的数据清洗流程包括：
1. URL和HTML标签移除
2. 精确去重和模糊去重（MinHash）
3. 语言识别和过滤
4. 敏感信息脱敏（PII removal）
5. 质量评分和过滤

这些步骤的顺序和参数选择对最终数据质量有重要影响。`,
    };
    setInputText(samples[type] || '');
    setAnalyzed(false);
  };

  const highCount = results.filter((r) => r.severity === 'high').length;
  const medCount = results.filter((r) => r.severity === 'medium').length;
  const lowCount = results.filter((r) => r.severity === 'low').length;

  const riskLevel =
    highCount > 0 ? 'high' : medCount > 0 ? 'medium' : results.length > 0 ? 'low' : 'clean';

  const riskConfig = {
    high: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', label: '高风险', desc: '检测到疑似 Benchmark 数据泄露' },
    medium: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', label: '中等风险', desc: '发现部分可疑模式，建议人工复核' },
    low: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', label: '低风险', desc: '少量弱匹配，可能是误报' },
    clean: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', label: '未检测到', desc: '未发现已知 Benchmark 泄露模式' },
  };

  const risk = riskConfig[riskLevel];
  const sevColors = {
    high: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
    medium: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    low: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">待检测文本</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'gsm8k', label: 'GSM8K 样本' },
              { key: 'mmlu', label: 'MMLU 样本' },
              { key: 'humaneval', label: 'HumanEval 样本' },
              { key: 'ceval', label: 'C-Eval 样本' },
              { key: 'clean', label: '干净文本' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => loadSample(s.key)}
                className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => { setInputText(e.target.value); setAnalyzed(false); }}
          placeholder="粘贴你的训练数据文本到这里，检测是否包含已知 Benchmark 数据..."
          rows={10}
          className="w-full px-4 py-3 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none font-mono leading-relaxed"
        />
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-400">
            {inputText.length} 字符 | 覆盖 {BENCHMARKS.length} 个 Benchmark
          </span>
          <button
            onClick={analyze}
            disabled={!inputText.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            开始检测
          </button>
        </div>
      </div>

      {/* Results */}
      {analyzed && (
        <>
          {/* Summary */}
          <div className={`${risk.bg} ${risk.border} border rounded-xl p-5`}>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${risk.color}`}>
                {riskLevel === 'clean' ? '✓' : riskLevel === 'high' ? '✕' : '⚠'}
              </div>
              <div>
                <div className={`text-lg font-bold ${risk.color}`}>{risk.label}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{risk.desc}</div>
              </div>
            </div>

            {results.length > 0 && (
              <div className="flex gap-4 mt-4">
                {highCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">高: {highCount}</span>
                  </div>
                )}
                {medCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">中: {medCount}</span>
                  </div>
                )}
                {lowCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">低: {lowCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detailed matches */}
          {results.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">检测详情</h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {results.map((r, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${sevColors[r.severity]}`}>
                        {r.severity === 'high' ? '高风险' : r.severity === 'medium' ? '中风险' : '低风险'}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.benchmark}</span>
                      <span className="text-xs text-slate-400">({r.category})</span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{r.patternDesc}</div>
                    <pre className="text-xs bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-x-auto">
                      {r.matchText}
                    </pre>
                    <div className="text-xs text-slate-400 mt-1">位置: 字符 {r.position}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* N-gram hits */}
          {ngramHits.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                N-gram 指纹匹配 ({ngramHits.length})
              </h3>
              <div className="space-y-2">
                {ngramHits.map((hit, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-xs text-slate-600 dark:text-slate-400">
                      {hit.ngram}
                    </code>
                    <span className="text-xs text-slate-400">@ 位置 {hit.position}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benchmark coverage */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">覆盖的 Benchmark</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {BENCHMARKS.map((b) => {
                const matched = results.some((r) => r.benchmark === b.name);
                return (
                  <div
                    key={b.name}
                    className={`p-3 rounded-lg border ${
                      matched
                        ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${matched ? 'bg-red-500' : 'bg-green-500'}`} />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{b.name}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{b.category}</div>
                    <div className="text-xs text-slate-400 mt-1">{b.patterns.length} 个检测规则</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Explanation */}
      <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-rose-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">关于数据去污染</h3>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p>
            <strong>数据去污染 (Decontamination)</strong> 是预训练数据处理中的关键步骤。
            如果训练数据中包含评测 Benchmark 的题目和答案，模型的评测分数就会虚高。
          </p>
          <p>
            本工具使用<strong>模式匹配 + N-gram 指纹</strong>两种方法检测已知 Benchmark 的泄露。
            覆盖 MMLU、GSM8K、HumanEval、HellaSwag、TruthfulQA、C-Eval、CMMLU、ARC 等主流评测集。
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            💡 实际生产中还需要使用 n-gram overlap、embedding 相似度等更精确的检测方法。本工具提供快速初筛。
          </p>
        </div>
      </div>
    </div>
  );
}
