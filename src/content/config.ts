import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    category: z.string().default('深度解析'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const column = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    series: z.string(), // e.g. 'AI 前沿速递', '数据工程观察'
    volume: z.number().optional(), // 期号（部分专栏如汇总/周报可不填）
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const book = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(), // 最后修改日期（由自动演进系统维护）
    bookSlug: z.string().default('llm-complete'), // 所属书籍标识
    chapter: z.number(), // 章节序号，用于排序
    part: z.string().optional(), // 所属部分，如 '第一部分：基础篇'
    partOrder: z.number().optional(), // 部分排序
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const research = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    category: z.enum(['原创论文', '研究提案', '论文精读', '综合调研', '专题研究', '行业分析']).default('论文精读'),
    tags: z.array(z.string()).default([]),
    paperTitle: z.string().optional(), // 原论文标题
    authors: z.string().optional(), // 原论文作者
    arxiv: z.string().optional(), // arXiv 链接
    htmlVersion: z.string().optional(), // HTML 富文本版本路径（相对于 public 目录）
    draft: z.boolean().default(false),
    hidden: z.boolean().default(false), // 在列表中隐藏，但页面仍可访问（用于旧版/原始版提案）
  }),
});

const voices = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    volume: z.number(),
    tags: z.array(z.string()).default([]),
    items: z.array(z.object({
      title: z.string(),
      sourceUrl: z.string(), // 播放/原始链接
      platform: z.enum(['youtube', 'podcast', 'x', 'bilibili', 'blog', 'news', 'other']),
      sourceType: z.enum(['video', 'podcast', 'thread', 'article', 'live']),
      author: z.string().optional(),
      duration: z.string().optional(), // e.g. '15:32', '1h20m'
      summary: z.string(), // 一句话摘要
    })).default([]),
    draft: z.boolean().default(false),
  }),
});

const changelog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    version: z.string().optional(), // e.g. 'v2026.03.23'
    changes: z.array(z.object({
      type: z.enum(['content', 'feature', 'improve', 'fix']), // 新内容 / 新功能 / 优化 / 修复
      summary: z.string(),
      link: z.string().optional(), // 指向变更相关的站内页面
    })).default([]),
    draft: z.boolean().default(false),
  }),
});

const notes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    principle: z.string().optional(), // 一句话原则摘要，显示在卡片上
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const benchmarks = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    // ===== 基准身份 =====
    benchName: z.string(), // 标准名称，如 "KernelBench"
    version: z.string().optional(), // 当前版本
    org: z.string(), // 发布机构
    paper: z.string().optional(), // 论文链接
    code: z.string().optional(), // 代码仓库
    venue: z.string().optional(), // 发表会议，如 "ICML 2025"
    website: z.string().optional(), // 官网/排行榜链接
    // ===== 分类与能力 =====
    category: z.enum([
      '推理', '代码生成', 'Agent', '数据',
      '多模态', '对齐与安全', '长文本', '领域专业', '综合', '其他'
    ]).default('综合'),
    subcategory: z.string().optional(), // 二级分类
    // ===== 二级分类体系 =====
    // 推理: 数学推理 | 科学推理 | 逻辑推理 | 常识推理 | 综合推理 | 规划推理
    // 代码生成: 函数级 | 仓库级 | 竞赛编程 | 领域特化 | 全栈应用 | 研发效率 | 代码理解
    // Agent (参照 agent-types-benchmark-landscape 十类体系):
    //   Coding Agent | Tool Use Agent | Search/Research Agent | Science Agent |
    //   Data Science Agent | Web/Browser Agent | GUI Agent | Mobile Agent |
    //   Computer Use Agent | Multi-Agent
    // 数据: Text-to-SQL | 数据分析 | 数据科学
    // 多模态: 视觉理解 | 视觉推理 | 视频理解 | 文档理解 | 图表理解 | 音频理解 | 安全
    // 对齐与安全: 人类偏好 | 指令跟随 | 自动评分 | 安全 | 真实性
    // 长文本: 检索 | 推理 | 综合
    // 领域专业: 医学 | 法律 | 金融 | 科学 | 教育
    // 综合: 知识 | 中文 | 多语言 | 极难综合
    abilities: z.array(z.string()).default([]), // 考察能力（多选）
    // ===== 构建方式 =====
    dataSize: z.string().optional(), // 数据规模，如 "250 tasks"
    construction: z.string().optional(), // 构建方式，如 "专家手工构建"
    evalMethod: z.string().optional(), // 评测方式，如 "执行+性能"
    metric: z.string().optional(), // 核心指标，如 "fast_p"
    // ===== 模型效果 =====
    topResults: z.array(z.object({
      model: z.string(),
      score: z.string(),
      date: z.string().optional(), // 记录时间
    })).default([]),
    // ===== 元数据 =====
    tags: z.array(z.string()).default([]),
    status: z.enum(['active', 'superseded', 'deprecated']).default('active'),
    importance: z.number().min(1).max(5).default(3), // 重要度 1-5（5=行业标杆，4=主流引用，3=值得关注，2=小众，1=过时/入门）
    saturation: z.enum(['未饱和', '接近饱和', '已饱和']).optional(), // 顶尖模型是否已逼近上限
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, column, book, research, voices, changelog, notes, benchmarks };
