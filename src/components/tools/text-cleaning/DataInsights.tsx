// ============================================================
// Tab 3：数据洞察 & 教程
// ============================================================

import { useState, useMemo } from 'react';

interface Tutorial {
  id: string;
  title: string;
  icon: string;
  question: string;
  content: string[];
  demo?: { before: string; after: string; explanation: string };
}

const tutorials: Tutorial[] = [
  {
    id: 'trafilatura-vs-bs4',
    title: '为什么不能直接用 Beautiful Soup',
    icon: '🍜',
    question: '提取网页正文，Beautiful Soup 和 trafilatura 有什么区别？',
    content: [
      'Beautiful Soup 是通用 HTML 解析器，它会忠实地保留所有元素——包括导航栏、页脚、广告、Cookie 弹窗等 boilerplate 内容。',
      'trafilatura 专为正文提取设计，它使用一系列启发式规则（文本密度、链接密度、元素位置）来区分正文和噪声。',
      'FineWeb 团队在 2024 年的评测中发现，trafilatura 的正文提取 F1 值比 Beautiful Soup + 手工规则高出约 15%。',
      '但 trafilatura 也有局限：它对数学公式的 alt text 处理不够好。Llama 3 团队因此开发了自定义 HTML 解析器。',
      '结论：预训练数据处理不应该用通用解析器。需要根据数据特点选择或定制提取工具。',
    ],
    demo: {
      before: '<nav>首页 | 关于 | 联系</nav>\n<div class="content"><p>Transformer 模型...</p></div>\n<footer>© 2024</footer>',
      after: 'Transformer 模型...',
      explanation: 'trafilatura 自动丢弃了导航栏和页脚，只保留了正文内容。',
    },
  },
  {
    id: 'minhash',
    title: '近似去重是怎么回事',
    icon: '#️⃣',
    question: 'MinHash 是如何实现海量文档的近似去重的？',
    content: [
      '精确去重只能发现完全相同的文本。但现实中，抄袭和转载常常有微小改动——换词、加标点、删段落。这就需要近似去重。',
      'MinHash 的核心思路：① 将文档切分为 n-gram（字符或词的滑窗片段）② 对每个 n-gram 计算多个 hash ③ 取每个 hash 函数的最小值组成"签名"④ 两个文档的签名越相似，它们的 Jaccard 相似度就越高。',
      'LSH（局部敏感哈希）进一步加速：将签名分成 b 个 band，每个 band r 行。只要任一 band 完全相同，就认为可能是重复对。这把 O(n²) 的两两对比降低到了接近 O(n)。',
      'FineWeb 使用 5-gram、128 个 hash 函数、20 bands × 6 rows，Jaccard 阈值 0.7。这个配置在英文网页上可以移除约 30% 的近似重复内容。',
      '注意事项：中文没有天然的词分隔，字符级 n-gram 效果比词级更稳定。日文同理。多语言管线需要针对每种语言调整 n-gram 策略。',
    ],
    demo: {
      before: 'Transformer is a model based on self-attention mechanism.\nTransformer is a deep learning model using self-attention.',
      after: 'Transformer is a model based on self-attention mechanism.\n[removed: ~85% similar to paragraph 1]',
      explanation: '两个段落的 5-gram Jaccard 相似度约 0.85，超过 0.7 阈值，第二段被标记为近似重复。',
    },
  },
  {
    id: 'perplexity',
    title: 'Perplexity 过滤器',
    icon: '📈',
    question: '为什么 Perplexity 可以用来过滤低质量文本？',
    content: [
      'Perplexity（困惑度）衡量语言模型对一段文本的"惊讶程度"。直觉上：模板化文本（"Click here", "Copyright 2024"）让模型不惊讶（低 PPL），乱码让模型很惊讶（高 PPL），正常文本在中间。',
      'CCNet（Facebook 2019）首次将这个思路用于网页过滤：用 KenLM 5-gram 模型计算每个文档的 perplexity，然后分三档：高质量（Wikipedia 水平）、中等、低质量。',
      'FineWeb 没有直接用 perplexity 过滤，而是结合了 C4 和 Gopher 的启发式规则。但 Ultra-FineWeb（2025）重新引入了 fastText 分类器做质量过滤，效果类似 perplexity 但更快。',
      '实践中的陷阱：①不同领域的"正常"perplexity 范围不同（代码 vs 散文 vs 科学论文）②多语言模型对非英文的 PPL 估计不准确 ③短文本的 PPL 方差很大，容易误判。',
      '我们在这个工具中用字符熵模拟 perplexity：字符分布均匀 = 高熵 ≈ 正常文本，字符高度集中 = 低熵 ≈ 模板/重复文本。',
    ],
    demo: {
      before: 'Loading... Loading... Loading...\n\n深度学习是人工智能的一个子领域，通过多层神经网络学习数据的层次化表示。\n\nasdfghjkl qwerty zxcvbnm',
      after: '[filtered: low PPL = 1.2]\n\n深度学习是人工智能的一个子领域，通过多层神经网络学习数据的层次化表示。\n\n[filtered: high PPL = 7.3]',
      explanation: '第一段重复"Loading..."导致字符熵极低（模板文本），第三段字符随机导致熵极高（疑似乱码），只有第二段在正常范围。',
    },
  },
  {
    id: 'quality-rules',
    title: 'C4 vs Gopher vs FineWeb 规则',
    icon: '📋',
    question: '三套著名的质量过滤规则有什么区别？',
    content: [
      'C4 规则（Google 2020）：① 行必须以标点结尾 ② 至少 5 个句子 ③ 不含 JavaScript/Cookie 关键词 ④ 不含"lorem ipsum" ⑤ 花括号对不超过页面的 10%。规则简单粗暴，但丢弃了大量非英文数据。',
      'Gopher 规则（DeepMind 2021）：① 文档长度 50-100K 词 ② 平均词长 3-10 字符 ③ 90% 的行不以 bullet 开头 ④ 80% 的词是 alpha ⑤ 至少 80% 的行有结束标点。规则更细致，但对格式化文本（如列表、代码）不友好。',
      'FineWeb 规则（HuggingFace 2024）：综合了前两者的优点，并增加了：① 更宽松的长度阈值 ② 不强制行末标点 ③ 增加了大写字母比例检查 ④ 配合 trafilatura 提取后的文本特点做了调整。',
      '一个重要发现：单独使用任何一套规则都不是最优的。FineWeb 团队通过消融实验发现，C4 的"行末标点"规则在法语等语言上会误杀正常内容（法语标点前有空格）。',
      '实践建议：先用宽松规则保留更多数据，再用下游任务的验证集来精调阈值。',
    ],
    demo: {
      before: '- item 1\n- item 2\n- item 3\n- item 4\n- item 5\nThis is a normal paragraph with proper punctuation.',
      after: '[C4: FAIL - not enough sentences]\n[Gopher: FAIL - >90% lines start with bullet]\n[FineWeb: PASS - bullet content preserved]',
      explanation: '同一段列表文本，C4 和 Gopher 都会过滤掉（太短/太多 bullet），而 FineWeb 的规则更宽松地保留了它。',
    },
  },
  {
    id: 'multilingual',
    title: '多语言的坑',
    icon: '🌍',
    question: '同样的去重策略在中文上为什么效果不同？',
    content: [
      '英文有天然的词分隔（空格），词级 n-gram 很直观。但中文没有空格，"字符级"和"词级"n-gram 效果差异很大。',
      '例如"深度学习是人工智能的分支"：字符 3-gram 有"深度学""度学习""学习是"... 共 9 个；但如果做分词后的词级 3-gram："深度学习/是/人工智能/的/分支"只有 3 个。字符级 n-gram 对中文的颗粒度更细。',
      'FineWeb2（2025）在扩展到多语言时发现：① 日文的假名和汉字混排需要特殊处理 ② 韩文音节字符的 n-gram 行为与英文字母不同 ③ 阿拉伯文的从右到左书写不影响 n-gram，但影响 boilerplate 检测的模式匹配。',
      '长度过滤也有坑：英文 50 词约 250 字符，但中文 50 个"词"可能只有 100 字符。统一的字符数阈值会系统性地偏向某些语言。',
      '最佳实践：对每种语言独立标定阈值，或使用语种检测后分流处理。这也是为什么本工具的"多语言管线"预设会先做语种检测。',
    ],
    demo: {
      before: '深度学习是AI的分支。\n深度学习是人工智能的一个分支。',
      after: '英文词级5-gram: Jaccard = 0.4 (不重复)\n中文字符5-gram: Jaccard = 0.72 (近似重复)\n中文词级5-gram: Jaccard = 0.3 (不重复)',
      explanation: '同样两句近义句，中文字符级 n-gram 更容易判定为近似重复。选择不同的 n-gram 策略会显著影响去重结果。',
    },
  },
];

export default function DataInsights() {
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState('');

  // Statistics for custom text
  const stats = useMemo(() => {
    if (!analysisText) return null;
    const text = analysisText;
    const chars = text.length;
    const lines = text.split('\n');
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

    // Character distribution
    const charFreq = new Map<string, number>();
    for (const ch of text) charFreq.set(ch, (charFreq.get(ch) || 0) + 1);
    const topChars = [...charFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

    // Language detection
    const zhChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const enChars = (text.match(/[a-zA-Z]/g) || []).length;
    const jaChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
    const digitChars = (text.match(/\d/g) || []).length;
    const punctChars = (text.match(/[\p{P}]/gu) || []).length;

    // Repetition
    const lineSet = new Set(lines.map(l => l.trim().toLowerCase()).filter(l => l.length > 0));
    const uniqueLines = lineSet.size;
    const totalNonEmptyLines = lines.filter(l => l.trim().length > 0).length;
    const repetitionRate = totalNonEmptyLines > 0 ? 1 - uniqueLines / totalNonEmptyLines : 0;

    // Character entropy
    let entropy = 0;
    for (const count of charFreq.values()) {
      const p = count / chars;
      entropy -= p * Math.log2(p);
    }

    return {
      chars, lines: lines.length, words: words.length, uniqueWords: uniqueWords.size,
      paragraphs: paragraphs.length, topChars, zhChars, enChars, jaChars,
      digitChars, punctChars, uniqueLines, totalNonEmptyLines,
      repetitionRate, entropy,
    };
  }, [analysisText]);

  const activeTut = tutorials.find(t => t.id === activeTutorial);

  return (
    <div className="space-y-6">
      {/* Interactive Tutorials */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">交互式教程</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {tutorials.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTutorial(activeTutorial === t.id ? null : t.id)}
              className={`p-3 rounded-xl text-left border-2 transition-all ${
                activeTutorial === t.id
                  ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-700'
                  : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700'
              }`}
            >
              <span className="text-xl block mb-1">{t.icon}</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">{t.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active tutorial content */}
      {activeTut && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">{activeTut.icon} {activeTut.title}</h4>
          <p className="text-sm text-teal-600 dark:text-teal-400 mb-4 italic">{activeTut.question}</p>
          <div className="space-y-3">
            {activeTut.content.map((paragraph, i) => (
              <p key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{paragraph}</p>
            ))}
          </div>
          {activeTut.demo && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-800">
                <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">输入</div>
                <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{activeTut.demo.before}</pre>
              </div>
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/10 border border-teal-200 dark:border-teal-800">
                <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">处理结果</div>
                <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{activeTut.demo.after}</pre>
              </div>
              <div className="md:col-span-2 text-xs text-slate-500 dark:text-slate-400 italic">
                {activeTut.demo.explanation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics Dashboard */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">统计仪表盘</h3>
        <textarea
          value={analysisText}
          onChange={e => setAnalysisText(e.target.value)}
          placeholder="粘贴文本，实时查看字符分布、语种推测、重复率等统计..."
          className="w-full h-28 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/50 mb-4"
          spellCheck={false}
        />

        {stats && (
          <div className="space-y-4">
            {/* Basic stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {[
                { label: '字符数', value: stats.chars.toLocaleString() },
                { label: '行数', value: stats.lines.toLocaleString() },
                { label: '词数', value: stats.words.toLocaleString() },
                { label: '独立词', value: stats.uniqueWords.toLocaleString() },
                { label: '段落', value: stats.paragraphs.toLocaleString() },
                { label: '字符熵', value: stats.entropy.toFixed(2) },
              ].map(s => (
                <div key={s.label} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-center">
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Language distribution */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">字符分布</h4>
              <div className="flex items-center gap-1 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                {[
                  { label: '中文', count: stats.zhChars, color: 'bg-red-500' },
                  { label: '英文', count: stats.enChars, color: 'bg-blue-500' },
                  { label: '日文', count: stats.jaChars, color: 'bg-pink-500' },
                  { label: '数字', count: stats.digitChars, color: 'bg-amber-500' },
                  { label: '标点', count: stats.punctChars, color: 'bg-emerald-500' },
                ].filter(s => s.count > 0).map(s => {
                  const ratio = stats.chars > 0 ? s.count / stats.chars : 0;
                  return ratio > 0.02 ? (
                    <div
                      key={s.label}
                      className={`${s.color} h-full flex items-center justify-center min-w-[30px]`}
                      style={{ width: `${ratio * 100}%` }}
                      title={`${s.label}: ${s.count} (${(ratio * 100).toFixed(1)}%)`}
                    >
                      <span className="text-[9px] font-bold text-white truncate px-1">{s.label}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Repetition */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">行级重复率</h4>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stats.repetitionRate > 0.3 ? 'bg-red-500' : stats.repetitionRate > 0.1 ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.max(stats.repetitionRate * 100, 1)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {(stats.repetitionRate * 100).toFixed(1)}% — {stats.uniqueLines}/{stats.totalNonEmptyLines} 独立行
                </span>
              </div>
            </div>

            {/* Top characters */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">高频字符 Top 20</h4>
              <div className="flex flex-wrap gap-1">
                {stats.topChars.map(([ch, count], i) => {
                  const ratio = stats.chars > 0 ? count / stats.chars : 0;
                  const display = ch === ' ' ? '␣' : ch === '\n' ? '↵' : ch === '\t' ? '→' : ch;
                  return (
                    <div
                      key={i}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-mono"
                      title={`"${display}" × ${count} (${(ratio * 100).toFixed(1)}%)`}
                    >
                      <span className="text-slate-700 dark:text-slate-300">{display}</span>
                      <span className="ml-1 text-slate-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
