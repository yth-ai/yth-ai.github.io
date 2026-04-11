/**
 * Playground 工具集中注册表
 *
 * 所有 lab/ 和 tools/ 页面的元数据都在这里维护。
 * 首页精选和 playground 列表页都从这里读取，单点维护。
 *
 * 新增工具只需在对应分类中加一条，设置 featured: true 即可上首页。
 */

export interface PlaygroundItem {
  /** 显示名称 */
  name: string;
  /** 简短描述 */
  description: string;
  /** 图标（emoji 或短文本） */
  icon: string;
  /** 页面路径 */
  href: string;
  /** 卡片渐变色 */
  gradient: string;
  /** 可选标签（热门/新/互动/科普 等） */
  tag?: string;
  /** 是否在首页精选展示 */
  featured?: boolean;
  /** 添加日期（用于按时间排序），格式 YYYY-MM-DD */
  addedAt?: string;
  /** 置顶工具——在探索页面有独立的显眼区域 */
  pinned?: boolean;
}

export interface PlaygroundCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconGradient: string;
  /** 标签徽章颜色 */
  badgeClass: string;
  items: PlaygroundItem[];
}

// ========== AI 实验工具 ==========
const aiTools: PlaygroundItem[] = [
  {
    name: '数据配比模拟器',
    description: '如果你来训 GPT-5——调配预训练数据配方，实时看模型能力变化',
    icon: '🧪',
    href: '/tools/data-mix-simulator',
    gradient: 'from-indigo-500 to-purple-500',
    tag: '热门',
    featured: true,
    addedAt: '2026-02-01',
  },
  {
    name: 'Scaling Laws 游乐场',
    description: '训练+推理双范式——14 个真实模型 × MoE 可视化 × 成本计算 × 4 种推理策略对比',
    icon: '📐',
    href: '/tools/scaling-laws-playground',
    gradient: 'from-emerald-500 to-teal-500',
    tag: '热门',
    featured: true,
    addedAt: '2026-03-29',
  },
  {
    name: '训练数据猜猜乐',
    description: '你能分辨高质量和低质量训练数据吗？看看你的判断力！',
    icon: '🎲',
    href: '/tools/data-quality-game',
    gradient: 'from-amber-500 to-orange-500',
    tag: '热门',
    featured: true,
    addedAt: '2026-02-01',
  },
  {
    name: 'Tokenizer 可视化',
    description: 'BPE 合并过程动画 + 6 种主流 Tokenizer 对比 + API 成本估算',
    icon: 'Tk',
    href: '/tools/tokenizer-visualizer',
    gradient: 'from-orange-500 to-amber-500',
    tag: '热门',
    featured: true,
    addedAt: '2026-03-31',
  },
  {
    name: 'AI 碳足迹计算器',
    description: '个人碳审计 + 等价物反转 + 11 模型效能散点图——从单次快照到日常审计 2.0',
    icon: '🌍',
    href: '/tools/carbon-footprint-calculator',
    gradient: 'from-emerald-500 to-green-500',
    tag: '热门',
    featured: true,
    addedAt: '2026-04-01',
  },
  {
    name: 'LLM 架构工作台',
    description: 'Dense + MoE 参数计算 · KV Cache 推理分析 · 模型对决 — 20+ 主流模型预设',
    icon: 'Σ',
    href: '/tools/llm-calculator',
    gradient: 'from-indigo-500 to-violet-500',
    tag: '热门',
    featured: true,
    addedAt: '2026-04-02',
  },
  {
    name: '数据质量评分',
    description: '多维度评估文本作为预训练数据的质量',
    icon: 'Q',
    href: '/tools/data-quality-scorer',
    gradient: 'from-rose-500 to-red-500',
  },
  {
    name: 'LLM 预训练数据工坊',
    description: '12 步可视化管线 · 拖拽编排 · FineWeb/Dolma 等 6 种真实管线预设对比 · MinHash/PPL 交互教程',
    icon: '⚡',
    href: '/tools/text-cleaning-pipeline',
    gradient: 'from-teal-500 to-cyan-500',
    tag: '热门',
    featured: true,
    addedAt: '2026-04-08',
  },
  {
    name: 'Embedding 全景工作台',
    description: '3D 向量星图 · 经典 king−man+woman 算术 · 相似度热力图 · 训练直觉实验室——四个视角理解 Embedding',
    icon: '⊕',
    href: '/tools/embedding-visualizer',
    gradient: 'from-cyan-500 to-blue-500',
    tag: '热门',
    featured: true,
    addedAt: '2026-04-09',
  },
  {
    name: 'Attention 全景工作台',
    description: '注意力机制可视化 + MHA/GQA/MQA/MLA 架构对比 + KV Cache 计算 + 窗口策略 + 进化时间线',
    icon: 'A²',
    href: '/tools/attention-heatmap',
    gradient: 'from-purple-500 to-fuchsia-500',
    tag: '热门',
    featured: true,
    addedAt: '2026-04-10',
  },
  {
    name: 'Prompt 工程全景工作台',
    description: '16 种模板 · A/B 对决 · 链式构建 · 技术图鉴——从入门到系统掌握 Prompt 工程',
    icon: 'P>',
    href: '/tools/prompt-workbench',
    gradient: 'from-amber-500 to-orange-500',
    tag: '热门',
    featured: true,
    addedAt: '2026-04-11',
  },
  {
    name: 'Benchmark 污染检测',
    description: '你的模型在"作弊"吗？污染注入模拟 × 6 种检测方法 × 洗白策略——评测信任危机全景',
    icon: '🛡',
    href: '/tools/decontamination-arena',
    gradient: 'from-red-500 to-rose-500',
    tag: '新',
    featured: true,
    addedAt: '2026-04-08',
  },
  {
    name: '训练 Loss 可视化',
    description: '预训练 Loss 曲线对比、学习率监控和异常检测',
    icon: '📉',
    href: '/tools/training-loss-visualizer',
    gradient: 'from-green-500 to-emerald-500',
  },

];

// ========== 创意体验 ==========
const creativeExperiments: PlaygroundItem[] = [
  {
    name: '思维地形图',
    description: 'LLM 推理路径可视化——CoT/ToT/直觉三种策略在 5 道经典推理题上的地形攀登',
    icon: '🏔',
    href: '/lab/reasoning-landscape',
    gradient: 'from-indigo-500 via-violet-500 to-purple-500',
    tag: '新',
    featured: true,
    addedAt: '2026-04-01',
  },
  {
    name: '百模大战',
    description: '100 个大模型的全景点阵图谱——星座图、时间线、排行榜、传承树四种视图',
    icon: '⚔️',
    href: '/lab/battle-of-models',
    gradient: 'from-blue-500 via-purple-500 to-pink-500',
    tag: '新',
    featured: true,
    addedAt: '2026-03-20',
  },
  {
    name: '全球 AI 军备竞赛',
    description: '战情室级态势感知仪表盘——18 家机构 × 全球地图 × 四维雷达 × 对决模式',
    icon: '🎯',
    href: '/lab/ai-arms-race',
    gradient: 'from-red-500 via-amber-500 to-blue-500',
    tag: '新',
    featured: true,
    addedAt: '2026-03-18',
  },
  {
    name: '一句话画宇宙',
    description: '一句简单的话，展开成一个完整的数据叙事世界——5 个主题 90+ 数据点',
    icon: '🌌',
    href: '/lab/data-universe',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    tag: '新',
    featured: true,
    addedAt: '2026-03-15',
  },
  {
    name: '如果 GPT-5 来考高考',
    description: 'AI vs 人类认知能力雷达图——8 学科 × 6 模型对比 + 12 道真题挑战',
    icon: '🎓',
    href: '/lab/gaokao-ai',
    gradient: 'from-indigo-500 to-violet-500',
    featured: true,
    addedAt: '2026-03-01',
  },
  {
    name: 'Token 不平等',
    description: '全球语言经济学地图——同一句话，不同语言需要多少 Token？一张地图看数字鸿沟',
    icon: '🌍',
    href: '/lab/token-economics',
    gradient: 'from-rose-500 to-orange-500',
  },
  {
    name: 'LLM 编年史',
    description: '从 Transformer 到 Agent——九年间改变世界的关键时刻，交互式时间线',
    icon: '🕰️',
    href: '/lab/llm-timeline',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    name: '用你的名字写首歌',
    description: '每个汉字拆解为笔画，每一笔映射一个音符——你的名字就是一段旋律',
    icon: '🎵',
    href: '/lab/name-to-music',
    gradient: 'from-violet-500 to-fuchsia-500',
    tag: '互动',
  },
  {
    name: '你的生日那天，宇宙长什么样',
    description: '那天的星空、月相、最近的行星——以及你出生那刻的光飞到了哪里',
    icon: '🌌',
    href: '/lab/birthday-universe',
    gradient: 'from-indigo-500 to-blue-500',
    tag: '探索',
  },
  {
    name: '汉字基因工程',
    description: '两个汉字杂交，偏旁部首像基因一样重组——创造从未存在过的新文字',
    icon: '🧬',
    href: '/lab/character-genetics',
    gradient: 'from-pink-500 to-rose-500',
    tag: '互动',
  },
  {
    name: '此刻，你的数据在哪里',
    description: '发一条微信，数据包穿越了哪些节点？海底光缆跑了多远？',
    icon: '📡',
    href: '/lab/data-route',
    gradient: 'from-cyan-500 to-blue-500',
    tag: '科普',
  },
  {
    name: '一生的像素',
    description: '假设活到 80 岁，你有 4160 个周——每个像素都是一周',
    icon: '⏳',
    href: '/lab/life-in-pixels',
    gradient: 'from-amber-500 to-orange-500',
    tag: '思考',
  },
  {
    name: '一句话变一幅画',
    description: '不用 AI，纯数学映射——情感决定色调，标点决定形状',
    icon: '🎨',
    href: '/lab/text-to-art',
    gradient: 'from-emerald-500 to-teal-500',
    tag: '创意',
  },
  {
    name: '方言消亡倒计时',
    description: '中国方言的消亡时间线——每一种语言消亡，一种思维方式就永远消失了',
    icon: '🗣️',
    href: '/lab/dialect-countdown',
    gradient: 'from-red-500 to-orange-500',
    tag: '数据',
  },
  {
    name: '如果互联网明天消失',
    description: '一个思想实验——逐步推演当我们习以为常的一切突然断开',
    icon: '🔮',
    href: '/lab/internet-disappears',
    gradient: 'from-slate-500 to-slate-700',
    tag: '叙事',
  },
];

// ========== 开发者工具箱 ==========
const devTools: PlaygroundItem[] = [
  {
    name: 'Unicode 编码探测',
    description: '深度分析字符的 Unicode 码点和 UTF-8/16 编码',
    icon: 'U+',
    href: '/tools/unicode-explorer',
    gradient: 'from-sky-500 to-blue-500',
  },
  {
    name: 'JSON 格式化',
    description: '美化、压缩和校验 JSON 数据，支持语法错误提示',
    icon: '{ }',
    href: '/tools/json-formatter',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: '正则表达式测试',
    description: '实时匹配和高亮正则表达式，快速验证你的正则',
    icon: '.*',
    href: '/tools/regex-tester',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Base64 编解码',
    description: '快速编码和解码 Base64 字符串',
    icon: 'B64',
    href: '/tools/base64-codec',
    gradient: 'from-purple-500 to-pink-500',
  },
];

// ========== 常用工具（置顶） ==========
const pinnedItems: PlaygroundItem[] = [
  {
    name: '收藏夹',
    description: '全站内容收藏管理——标签分类、筛选查看、导出 Markdown',
    icon: '⭐',
    href: '/tools/bookmarks',
    gradient: 'from-amber-500 to-orange-500',
    pinned: true,
    featured: true,
    addedAt: '2026-03-31',
  },
  {
    name: '精读队列',
    description: '收藏专栏中的 arXiv 论文，自动触发深度精读并发布到研究栏目',
    icon: '📌',
    href: '/tools/reading-list',
    gradient: 'from-violet-500 to-purple-500',
    pinned: true,
    featured: true,
    addedAt: '2026-03-31',
  },
  {
    name: '英文词汇学习',
    description: '闪卡复习、间隔重复、标注管理、手动添加、数据导入导出——覆盖 LLM / 学术 / 商务等领域',
    icon: 'Aa',
    href: '/tools/llm-vocabulary',
    gradient: 'from-indigo-500 to-pink-500',
    pinned: true,
    featured: true,
    addedAt: '2026-03-31',
  },
];

// ========== 分类配置 ==========
export const playgroundCategories: PlaygroundCategory[] = [
  {
    id: 'ai-tools',
    title: 'AI 实验工具',
    subtitle: '大模型训练、推理、评估——动手试试才有感觉',
    icon: 'AI',
    iconGradient: 'from-primary-500 to-accent-500',
    badgeClass: 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300',
    items: aiTools,
  },
  {
    id: 'creative',
    title: '创意体验',
    subtitle: '不是工具，是体验——每一个都值得你花几分钟沉浸其中',
    icon: '✦',
    iconGradient: 'from-violet-500 to-fuchsia-500',
    badgeClass: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300',
    items: creativeExperiments,
  },
  {
    id: 'dev-tools',
    title: '开发者工具箱',
    subtitle: '通用开发小工具，随手用',
    icon: '{ }',
    iconGradient: 'from-sky-500 to-blue-500',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300',
    items: devTools,
  },
];

// ========== 便利函数 ==========

/** 获取置顶工具 */
export { pinnedItems };

/** 获取所有工具（扁平列表，含置顶） */
export function getAllItems(): PlaygroundItem[] {
  return [...pinnedItems, ...playgroundCategories.flatMap((cat) => cat.items)];
}

/** 获取工具总数 */
export function getTotalCount(): number {
  return pinnedItems.length + playgroundCategories.reduce((sum, cat) => sum + cat.items.length, 0);
}

/** 获取首页精选项目（按 addedAt 降序，取前 N 个） */
export function getFeaturedItems(count = 6): PlaygroundItem[] {
  return getAllItems()
    .filter((item) => item.featured)
    .sort((a, b) => {
      if (!a.addedAt) return 1;
      if (!b.addedAt) return -1;
      return b.addedAt.localeCompare(a.addedAt);
    })
    .slice(0, count);
}
