import { useState, useMemo, useCallback } from 'react';

// ============================================================
// 训练数据猜猜乐 — 你能比过滤器做得更好吗？
// ============================================================

interface DataSample {
  id: number;
  text: string;
  source: string;         // actual source
  sourceOptions: string[]; // multiple choice for source
  quality: 'high' | 'medium' | 'low';
  shouldKeep: boolean;     // should this be kept in training?
  explanation: string;     // why
  triggers: string[];      // what filtering rules would fire
  qualityScore: number;    // 0-100
}

const DATA_SAMPLES: DataSample[] = [
  {
    id: 1,
    text: `Transformer 的核心创新在于自注意力机制（Self-Attention），它允许模型在处理序列的每个位置时，能够同时关注序列中的所有其他位置。给定输入序列 X，首先通过线性投影得到 Query、Key、Value 三组向量。注意力权重通过 Q 和 K 的点积计算，经过缩放和 softmax 归一化后，用于对 V 进行加权求和。`,
    source: '技术博客',
    sourceOptions: ['Wikipedia', '技术博客', 'arXiv 论文', '教材'],
    quality: 'high',
    shouldKeep: true,
    explanation: '结构清晰、术语准确、逻辑连贯的技术文章，非常适合作为预训练数据。',
    triggers: [],
    qualityScore: 92,
  },
  {
    id: 2,
    text: `哈哈哈哈哈哈哈这个太搞笑了！！！！转发转发转发！！！@小王 @老李 @张三 快来看！！！💀💀💀 笑死我了 #搞笑 #日常 点赞关注不迷路，每天分享快乐源泉～～～ 👉👉👉 点击链接领取优惠券 https://t.co/xxx`,
    source: '社交媒体',
    sourceOptions: ['新闻网站', '社交媒体', '论坛', '博客'],
    quality: 'low',
    shouldKeep: false,
    explanation: '典型的低质量社交媒体内容：大量 emoji 和标点重复、@提及、营销链接、零信息密度。',
    triggers: ['标点重复检测', '短文本过滤', '广告/营销检测', 'URL 密度过高'],
    qualityScore: 8,
  },
  {
    id: 3,
    text: `The experiments were conducted on 8 NVIDIA A100 GPUs with 80GB memory each. We used the AdamW optimizer with β1=0.9, β2=0.95, weight decay of 0.1, and a cosine learning rate schedule with peak lr=3e-4 and warmup of 2000 steps. The model was trained for 100K steps with a batch size of 512 sequences of length 2048, totaling approximately 100B tokens.`,
    source: 'arXiv 论文',
    sourceOptions: ['GitHub README', 'arXiv 论文', '技术文档', '新闻报道'],
    quality: 'high',
    shouldKeep: true,
    explanation: '精确的实验配置描述，包含关键超参数。这类数据对模型理解训练流程极有价值。',
    triggers: [],
    qualityScore: 95,
  },
  {
    id: 4,
    text: `本文来自网络，版权归原作者所有。如有侵权请联系删除。本站不对文章内容的真实性负责。以下内容为自动采集生成，可能存在格式错误和内容缺失，仅供参考。\n\n[[广告位招租]]\n\n原标题：...\n\n来源：转载自xx网\n\n免责声明：本文不构成任何投资建议...`,
    source: '采集站',
    sourceOptions: ['新闻网站', '采集站', '企业官网', '个人博客'],
    quality: 'low',
    shouldKeep: false,
    explanation: '典型的内容农场/采集站页面。充满免责声明、广告占位符、版权声明，实际内容为零。',
    triggers: ['样板文本检测', '广告占位检测', '内容密度过低', '版权声明过多'],
    qualityScore: 5,
  },
  {
    id: 5,
    text: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

# Example usage
data = [3, 6, 8, 10, 1, 2, 1]
print(quicksort(data))  # [1, 1, 2, 3, 6, 8, 10]`,
    source: 'GitHub',
    sourceOptions: ['GitHub', 'StackOverflow', '在线教程', 'LeetCode'],
    quality: 'high',
    shouldKeep: true,
    explanation: '干净、可运行的 Python 代码，有注释和示例。代码类数据对提升模型推理能力很有帮助。',
    triggers: [],
    qualityScore: 88,
  },
  {
    id: 6,
    text: `asdfjkl; asdfjkl; asdfjkl; asdfjkl; asdfjkl; asdfjkl; asdfjkl; asdfjkl; the quick brown fox jumps over the lazy dog the quick brown fox jumps over the lazy dog the quick brown fox jumps over the lazy dog Lorem ipsum dolor sit amet consectetur adipiscing elit Lorem ipsum dolor sit amet consectetur adipiscing elit`,
    source: '打字练习网站',
    sourceOptions: ['Wikipedia', '打字练习网站', '测试页面', '论坛'],
    quality: 'low',
    shouldKeep: false,
    explanation: '重复文本 + Lorem ipsum 填充，零信息价值。这是典型的去重和重复检测应该捕获的内容。',
    triggers: ['N-gram 重复率过高', '字符级重复检测', 'Perplexity 异常'],
    qualityScore: 2,
  },
  {
    id: 7,
    text: `根据量子力学的基本原理，粒子的状态由波函数 ψ 描述。薛定谔方程给出了波函数随时间的演化规律：iℏ∂ψ/∂t = Ĥψ，其中 Ĥ 是哈密顿算符。对于氢原子，通过分离变量法可以求解得到精确的能级结构 En = -13.6/n² eV，这一结果与实验测量精确吻合。`,
    source: '物理教材',
    sourceOptions: ['Wikipedia', '物理教材', 'arXiv 论文', '科普文章'],
    quality: 'high',
    shouldKeep: true,
    explanation: '高质量教材内容，包含精确的物理公式和解释，知识密度高。',
    triggers: [],
    qualityScore: 94,
  },
  {
    id: 8,
    text: `我的邮箱是 zhangsan@gmail.com，电话 13812345678，身份证号 310101199001011234。家住北京市朝阳区xxx小区x号楼x单元xxx室。银行卡号：6222021234567890123。如果需要联系我的话，我的微信是 zhangsan_wx。`,
    source: '论坛帖子',
    sourceOptions: ['社交媒体', '论坛帖子', '客服记录', '简历'],
    quality: 'low',
    shouldKeep: false,
    explanation: '包含大量 PII（个人身份信息）：邮箱、电话、身份证号、地址、银行卡号、微信号。即使内容本身可能有价值，PII 必须脱敏或过滤。',
    triggers: ['PII 检测 (邮箱)', 'PII 检测 (电话)', 'PII 检测 (身份证)', 'PII 检测 (银行卡)', '地址信息检测'],
    qualityScore: 15,
  },
  {
    id: 9,
    text: `WASHINGTON — The Federal Reserve held interest rates steady Wednesday, as expected, but signaled that it could begin cutting rates as early as September if inflation continues to cool. Fed Chair Jerome Powell said the central bank is "not far" from the confidence it needs to begin lowering borrowing costs, noting that recent data has been "pretty good."`,
    source: '新闻报道',
    sourceOptions: ['新闻报道', 'Wikipedia', '金融博客', '政府公告'],
    quality: 'medium',
    shouldKeep: true,
    explanation: '正规新闻报道，事实准确，但有时效性问题——模型可能会把这当成"最新"信息。新闻数据有价值但需要注意时效标记。',
    triggers: ['时效性警告'],
    qualityScore: 72,
  },
  {
    id: 10,
    text: `cookie policy | privacy policy | terms of service | about us | contact | sitemap | advertise | careers\n\n© 2024 ExampleCorp. All rights reserved. | 京ICP备12345678号 | 京公网安备 1234567890号\n\nPowered by WordPress | Theme: flavor flavor flavor flavor flavor flavor`,
    source: '网页页脚',
    sourceOptions: ['网页页脚', '法律文件', '企业官网', '导航页'],
    quality: 'low',
    shouldKeep: false,
    explanation: '典型的网页样板文本（boilerplate）：导航链接、版权信息、备案号。这类文本在 Common Crawl 中占比巨大，是首先要过滤的。',
    triggers: ['样板文本检测', '文本/HTML 比过低', '导航文本检测', '版权声明模式'],
    qualityScore: 3,
  },
  {
    id: 11,
    text: `The derivative of the cross-entropy loss with respect to the logits can be computed efficiently. For a softmax output with true label y, the gradient simplifies to ∂L/∂z_i = p_i - δ_{iy}, where p_i = softmax(z_i). This elegant result means we only need to subtract 1 from the predicted probability of the true class, making backpropagation through the output layer extremely efficient.`,
    source: '深度学习教程',
    sourceOptions: ['Wikipedia', '深度学习教程', 'arXiv 论文', '课程讲义'],
    quality: 'high',
    shouldKeep: true,
    explanation: '精确的数学推导配合直觉解释，这类数据对模型理解ML概念极有帮助。',
    triggers: [],
    qualityScore: 96,
  },
  {
    id: 12,
    text: `震惊！！！科学家发现了长生不老的秘密！！！只需要每天做这三件事...点击阅读全文 >>> 第一：早上空腹喝一杯xxx水，第二：睡前吃一勺xxx粉，第三：坚持使用xxx产品。限时特价 ¥99！原价 ¥999！库存仅剩 xx 份，手慢无！！！`,
    source: '营销软文',
    sourceOptions: ['健康杂志', '营销软文', '新闻网站', '公众号'],
    quality: 'low',
    shouldKeep: false,
    explanation: '典型的标题党 + 虚假宣传 + 营销推广。这类数据会让模型学习到错误信息和营销话术。',
    triggers: ['标题党检测', '虚假宣传检测', '营销内容检测', '信息准确性低'],
    qualityScore: 4,
  },
  {
    id: 13,
    text: `好的好的好的好的好的
嗯嗯
收到
哦哦
OK
收到收到
好的
明白了
嗯
谢谢
不客气
拜拜
再见`,
    source: '聊天记录',
    sourceOptions: ['客服记录', '聊天记录', '论坛', '评论区'],
    quality: 'low',
    shouldKeep: false,
    explanation: '极短的对话片段，信息密度接近零。大量这类数据会让模型变得"话痨"但没有内容。',
    triggers: ['文本长度过短', 'N-gram 重复率过高', '信息密度过低'],
    qualityScore: 6,
  },
  {
    id: 14,
    text: `SELECT 
    u.username,
    COUNT(DISTINCT o.order_id) as total_orders,
    SUM(o.amount) as total_spent,
    AVG(o.amount) as avg_order_value
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.user_id
HAVING total_orders >= 3
ORDER BY total_spent DESC
LIMIT 100;`,
    source: 'StackOverflow',
    sourceOptions: ['GitHub', 'StackOverflow', '技术文档', '数据库手册'],
    quality: 'high',
    shouldKeep: true,
    explanation: '规范的 SQL 查询，包含 JOIN、聚合、子查询等常用模式。代码类数据对模型能力提升显著。',
    triggers: [],
    qualityScore: 85,
  },
  {
    id: 15,
    text: `This page was last edited on 15 March 2024. Machine learning (ML) is a subset of artificial intelligence (AI) that focuses on building systems that can learn from and make decisions based on data. The term was coined by Arthur Samuel in 1959. Tom Mitchell provided a formal definition: "A computer program is said to learn from experience E with respect to some task T and some performance measure P, if its performance on T, as measured by P, improves with experience E."`,
    source: 'Wikipedia',
    sourceOptions: ['Wikipedia', '在线百科', '教材', '技术博客'],
    quality: 'high',
    shouldKeep: true,
    explanation: 'Wikipedia 高质量文章：有引用、定义精确、结构化。Wikipedia 是预训练数据的黄金标准来源之一。',
    triggers: [],
    qualityScore: 90,
  },
];

type GamePhase = 'playing' | 'reveal' | 'finished';

interface Answer {
  sampleId: number;
  guessedSource: string;
  guessedKeep: boolean;
  correctSource: boolean;
  correctKeep: boolean;
}

// Shuffle array (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function DataQualityGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [samples, setSamples] = useState<DataSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedKeep, setSelectedKeep] = useState<boolean | null>(null);
  const [numQuestions, setNumQuestions] = useState(8);

  const startGame = useCallback(() => {
    const shuffled = shuffle(DATA_SAMPLES).slice(0, numQuestions);
    setSamples(shuffled);
    setCurrentIndex(0);
    setPhase('playing');
    setAnswers([]);
    setSelectedSource('');
    setSelectedKeep(null);
    setGameStarted(true);
  }, [numQuestions]);

  const currentSample = samples[currentIndex];

  const submitAnswer = useCallback(() => {
    if (!currentSample || selectedSource === '' || selectedKeep === null) return;

    const answer: Answer = {
      sampleId: currentSample.id,
      guessedSource: selectedSource,
      guessedKeep: selectedKeep,
      correctSource: selectedSource === currentSample.source,
      correctKeep: selectedKeep === currentSample.shouldKeep,
    };

    setAnswers(prev => [...prev, answer]);
    setPhase('reveal');
  }, [currentSample, selectedSource, selectedKeep]);

  const nextQuestion = useCallback(() => {
    if (currentIndex + 1 >= samples.length) {
      setPhase('finished');
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedSource('');
      setSelectedKeep(null);
      setPhase('playing');
    }
  }, [currentIndex, samples.length]);

  // Score calculation
  const score = useMemo(() => {
    const sourceCorrect = answers.filter(a => a.correctSource).length;
    const keepCorrect = answers.filter(a => a.correctKeep).length;
    const total = answers.length;
    return {
      sourceCorrect,
      keepCorrect,
      total,
      sourceAccuracy: total > 0 ? Math.round((sourceCorrect / total) * 100) : 0,
      keepAccuracy: total > 0 ? Math.round((keepCorrect / total) * 100) : 0,
      overallAccuracy: total > 0 ? Math.round(((sourceCorrect + keepCorrect) / (total * 2)) * 100) : 0,
    };
  }, [answers]);

  // ============ Screens ============

  // Start Screen
  if (!gameStarted) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="relative">
            <div className="text-3xl mb-2">🎲</div>
            <h2 className="text-xl font-bold mb-2">训练数据猜猜乐</h2>
            <p className="text-white/80 text-sm max-w-xl">
              大模型的能力来自数据，但 90% 的原始数据都是垃圾。你能分辨出哪些数据该留、哪些该扔吗？
              看看你的判断力能不能超过自动过滤器！
            </p>
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">游戏规则</h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 text-left">
              <div className="flex items-start gap-3">
                <span className="text-lg">1️⃣</span>
                <span>阅读一段真实的文本片段</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">2️⃣</span>
                <span>判断它来自哪个数据源（4 选 1）</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">3️⃣</span>
                <span>决定：这段数据应该<strong>保留</strong>还是<strong>过滤</strong>？</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">4️⃣</span>
                <span>揭晓答案，看看自动过滤器怎么判断的</span>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">题目数量</label>
              <div className="flex justify-center gap-2">
                {[5, 8, 10, 15].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumQuestions(n)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      numQuestions === n
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {n} 题
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-lg shadow-amber-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              开始挑战
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Finished Screen
  if (phase === 'finished') {
    const rating = score.overallAccuracy >= 90 ? '🏆 数据工程大师' :
                   score.overallAccuracy >= 75 ? '⭐ 资深过滤器' :
                   score.overallAccuracy >= 60 ? '👍 合格审核员' :
                   score.overallAccuracy >= 40 ? '🤔 需要修炼' :
                   '😅 建议让 AI 来';

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800 text-center">
          <div className="text-4xl mb-3">{score.overallAccuracy >= 75 ? '🎉' : '📊'}</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">游戏结束！</h2>
          <div className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-2">
            {score.overallAccuracy}%
          </div>
          <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">{rating}</div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400">来源识别</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {score.sourceCorrect}/{score.total}
              </div>
              <div className="text-xs text-slate-400">({score.sourceAccuracy}%)</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400">保留/过滤判断</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {score.keepCorrect}/{score.total}
              </div>
              <div className="text-xs text-slate-400">({score.keepAccuracy}%)</div>
            </div>
          </div>

          <button
            onClick={() => { setGameStarted(false); setAnswers([]); }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            再来一局
          </button>
        </div>

        {/* Review answers */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">答题回顾</h3>
          {answers.map((answer, i) => {
            const sample = DATA_SAMPLES.find(s => s.id === answer.sampleId)!;
            return (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">#{i + 1}</span>
                  {answer.correctSource && answer.correctKeep ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">全对</span>
                  ) : answer.correctSource || answer.correctKeep ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">部分正确</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold">全错</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p>来源: {answer.correctSource ? '✅' : '❌'} 你选 "{answer.guessedSource}" → 正确答案 "{sample.source}"</p>
                  <p>判断: {answer.correctKeep ? '✅' : '❌'} 你选 "{answer.guessedKeep ? '保留' : '过滤'}" → 正确答案 "{sample.shouldKeep ? '保留' : '过滤'}"</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Playing / Reveal Screen
  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          第 {currentIndex + 1} / {samples.length} 题
        </span>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400">✅ {answers.filter(a => a.correctKeep).length}</span>
          <span className="text-red-600 dark:text-red-400">❌ {answers.filter(a => !a.correctKeep).length}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex + (phase === 'reveal' ? 1 : 0)) / samples.length) * 100}%` }}
        />
      </div>

      {/* Text Sample */}
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">📄 数据样本</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">{currentSample.text.length} 字符</span>
        </div>
        <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
          {currentSample.text}
        </div>
      </div>

      {phase === 'playing' && (
        <>
          {/* Source Guess */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">这段文本来自哪里？</h4>
            <div className="grid grid-cols-2 gap-2">
              {currentSample.sourceOptions.map(option => (
                <button
                  key={option}
                  onClick={() => setSelectedSource(option)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedSource === option
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Keep or Filter */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">用作预训练数据：保留还是过滤？</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedKeep(true)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedKeep === true
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-600'
                }`}
              >
                ✅ 保留
              </button>
              <button
                onClick={() => setSelectedKeep(false)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedKeep === false
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-300 dark:hover:border-red-600'
                }`}
              >
                ❌ 过滤掉
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={submitAnswer}
            disabled={selectedSource === '' || selectedKeep === null}
            className={`w-full py-3 rounded-xl text-white font-bold text-lg transition-all ${
              selectedSource && selectedKeep !== null
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
            }`}
          >
            提交答案
          </button>
        </>
      )}

      {phase === 'reveal' && currentSample && (
        <>
          {/* Result */}
          <div className={`p-5 rounded-xl border-2 ${
            answers[answers.length - 1].correctSource && answers[answers.length - 1].correctKeep
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
              : answers[answers.length - 1].correctSource || answers[answers.length - 1].correctKeep
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700'
          }`}>
            <div className="text-2xl mb-2">
              {answers[answers.length - 1].correctSource && answers[answers.length - 1].correctKeep ? '🎉' : 
               answers[answers.length - 1].correctSource || answers[answers.length - 1].correctKeep ? '🤔' : '😅'}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">数据来源：</span>
                <span className={answers[answers.length - 1].correctSource ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-red-700 dark:text-red-300'}>
                  {answers[answers.length - 1].correctSource ? ' ✅ 正确！' : ` ❌ 你选了「${selectedSource}」，实际是「${currentSample.source}」`}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">保留/过滤：</span>
                <span className={answers[answers.length - 1].correctKeep ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-red-700 dark:text-red-300'}>
                  {answers[answers.length - 1].correctKeep ? ' ✅ 正确！' : ` ❌ 你选了「${selectedKeep ? '保留' : '过滤'}」，实际应该「${currentSample.shouldKeep ? '保留' : '过滤'}」`}
                </span>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">解析</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{currentSample.explanation}</p>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">自动评分:</span>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    currentSample.qualityScore >= 70 ? 'bg-emerald-500' :
                    currentSample.qualityScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${currentSample.qualityScore}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{currentSample.qualityScore}/100</span>
            </div>

            {currentSample.triggers.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">触发的过滤规则：</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {currentSample.triggers.map(trigger => (
                    <span key={trigger} className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={nextQuestion}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            {currentIndex + 1 >= samples.length ? '查看最终结果' : '下一题 →'}
          </button>
        </>
      )}
    </div>
  );
}
