---
title: "Agent 类型全景：评测基准、任务示例与训练优化手段"
description: "十类 LLM/多模态 Agent 的系统梳理：各类型覆盖能力、代表评测基准（含链接）、典型任务示例、业界主流优化手段，以及纯语言模型 vs 多模态模型的能力边界对比。含 Search Agent、Data Science Agent、GUI Agent、Mobile Agent 专项。"
date: 2026-03-31T17:55
category: 综合调研
tags: ["Agent", "评测基准", "Coding Agent", "Search Agent", "Research Agent", "Data Science Agent", "Web Agent", "GUI Agent", "Mobile Agent", "多模态", "训练优化", "Multi-Agent"]
draft: false
---

## 总览速查表

一张表纵览十类 Agent 的**模态需求、核心挑战、代表 Benchmark、行业水平、产品化程度和代表产品**。

| # | Agent 类型 | 模态 | 核心挑战 | 代表 Benchmark | SOTA 水平 | 产品化 | 代表产品/框架 |
|---|-----------|------|---------|---------------|----------|--------|-------------|
| 1 | **Coding Agent** | 纯 LLM ✅ | 长轨迹规划、测试验证、多文件修改 | SWE-bench Verified · LiveCodeBench · TerminalBench | SWE-V **~65%**（Claude Sonnet）；HumanEval >95% | ⭐⭐⭐⭐⭐ 最成熟 | Cursor · Windsurf · Copilot · Devin · Codex |
| 2 | **Tool Use Agent** | 纯 LLM ✅ | 参数准确、错误恢复、嵌套/并行调用 | BFCL · ToolBench · τ-bench | BFCL **>85%** | ⭐⭐⭐⭐⭐ | ChatGPT Plugins · Claude MCP · Gemini Extensions |
| 3 | **Search / Deep Research Agent** | 纯 LLM ✅ | 搜索策略、多源综合、引用准确性 | BrowseComp · GAIA · DeepResearch Bench · DeepSearchQA · FRAMES | BrowseComp **~51%**（OpenAI DR）；GAIA L3 **~70%** | ⭐⭐⭐⭐ 快速商业化 | OpenAI Deep Research · Gemini DR · Perplexity Pro · Grok DeepSearch |
| 4 | **Research / Science Agent** | LLM + 多模态辅助 | 博士级推理、实验设计、论文复现 | FrontierScience · PaperBench · CORE-Bench · ScienceAgentBench · MLE-bench | FrontierScience-R **~25%**（GPT-5.2）；PaperBench 最高 **21%** | ⭐⭐ 早期 | Elicit · Semantic Scholar · Sakana AI Scientist |
| 5 | **Data Science Agent** | LLM + 多模态辅助 | 长上下文理解、多步分析一致性、可视化 | DSBench · InfiAgent-DABench · DA-Code · DSEval | DSBench 分析 **~35%**（GPT-4o）；建模 **~30%** | ⭐⭐⭐ | ChatGPT Code Interpreter · Julius AI · Databricks Assistant |
| 6 | **Web / Browser Agent** | **多模态必须** | GUI 理解、状态跟踪、动态页面 | WebArena · VisualWebArena · Mind2Web | WebArena **~50%** | ⭐⭐⭐ | Browserbase · MultiOn · AgentQ |
| 7 | **GUI Agent** | **多模态必须** | 坐标定位、跨平台泛化、元素识别 | ScreenSpot · OSWorld · WindowsAgentArena | ScreenSpot **~75%**；OSWorld **~40%** | ⭐⭐ | UINav · CogAgent · SeeAct |
| 8 | **Mobile Agent** | **多模态必须** | 跨 App、手势、通知中断、小屏幕 | AndroidWorld · MobileBench · AITZ | AndroidWorld **~33%**（人类 ~80%） | ⭐⭐ 早期 | AppAgent · MobileAgent · Apple Intelligence |
| 9 | **Computer Use / OS Agent** | **多模态必须** | 视觉定位、跨应用工作流、长序列操作 | OSWorld · WindowsAgentArena · ScreenSpot | OSWorld **~40%** | ⭐⭐ 早期 | Claude Computer Use · UI-TARS · Anthropic |
| 10 | **Multi-Agent Orchestration** | 继承子任务 | 协调通信、任务分解、共识机制 | AgentBench · ChatDev Eval · CAMEL | 无统一标准 | ⭐⭐⭐ | LangGraph · AutoGen · CrewAI · DeerFlow |

**产品化成熟度说明**：⭐⭐⭐⭐⭐ = 已有大规模商业产品 → ⭐ = 纯研究阶段

> **几个关键数字**：
> - Coding Agent 是最成熟的类型，SOTA 已接近实用（SWE-V 65%），也是当前 AI 投资最密集的赛道
> - Search Agent 产品化最快（Deep Research 产品已上线），但 BrowseComp 上 OpenAI DR 51% vs 其他方案 <5% 的巨大差距说明端到端 RL 训练远超 prompt engineering
> - Research Agent 是能力-需求 gap 最大的类型——FrontierScience-Research 仅 25%，意味着 4 题只对 1 题
> - Mobile/GUI/OS Agent 整体在 30-40%，距离实用还有显著距离，核心瓶颈是视觉定位数据获取成本极高

> **Search Agent vs Research Agent 的区别**：
> - **Search Agent**：核心是信息检索——接收用户问题，自主规划搜索策略，多步检索网页/知识库，整合为准确答案或报告。重点在**找到信息**
> - **Research Agent**：核心是科学推理——假设生成、实验设计、论文复现、批判性分析。重点在**理解和创造知识**
> - 两者有交集（Deep Research Agent 同时涉及搜索和推理），但评测基准、优化手段、核心瓶颈完全不同

> **GUI / Mobile / Computer Use 三者关系**：
> - **GUI Agent**：泛指任意图形界面的理解与操作，是上位概念，强调视觉理解能力本身
> - **Mobile Agent**：专注移动端（iOS/Android），额外需要处理手势、通知、后台切换、小屏幕布局
> - **Computer Use / OS Agent**：专注桌面系统（Windows/macOS/Linux），处理多窗口、文件系统、跨应用工作流

---

## 一、Coding Agent

> **模态需求：纯 LLM** ✅ — 代码和文本是主要 I/O，截图偶有辅助但非必须。

### 代表评测基准

| 基准 | 核心任务 | 规模 | 链接 |
|------|---------|------|------|
| **SWE-bench** | 修复真实 GitHub issue，生成 patch | 2294 个 issue | [arxiv.org/abs/2310.06770](https://arxiv.org/abs/2310.06770) |
| **SWE-bench Verified** | 人工验证可解子集（减少噪声） | 500 个 | [openai.com/index/introducing-swe-bench-verified](https://openai.com/index/introducing-swe-bench-verified) |
| **SWE-bench Multimodal** | 含截图/UI 的 issue 修复 | 617 个 | [arxiv.org/abs/2410.03859](https://arxiv.org/abs/2410.03859) |
| **LiveCodeBench** | 持续更新的竞赛题（防污染） | 动态 | [arxiv.org/abs/2403.07974](https://arxiv.org/abs/2403.07974) |
| **TerminalBench** | 终端操作任务（文件/脚本/环境） | 89 个高难度 | [arxiv.org/abs/2601.11868](https://arxiv.org/abs/2601.11868) |
| **HumanEval / MBPP** | 函数级代码生成 | 164 / 374 | [arxiv.org/abs/2107.03374](https://arxiv.org/abs/2107.03374) |

### 典型任务示例
- 给定一个 Django repo + issue（"用户上传图片时报 500 错误"），输出修复 patch
- 实现一个排序算法，要求通过给定单元测试
- 复现论文代码，跑通核心实验并比对数值

### 业界优化手段
- **数据**：SWE-bench 轨迹合成 + Oracle-guided 过滤；失败-修复对比数据（[Agentless](https://arxiv.org/abs/2407.01489)、[SWE-agent](https://arxiv.org/abs/2405.15793)）
- **训练**：RL on execution feedback（代码是否通过测试）；Process Reward Model 指导搜索（[RLEF](https://arxiv.org/abs/2410.02089)）
- **推理**：多路采样 + 最优选择（pass@k）；MCTS over code edits（[AlphaCodium](https://arxiv.org/abs/2401.08500)）

---

## 二、Tool Use / Function Calling Agent

> **模态需求：纯 LLM** ✅ — API 调用和 JSON 是主要 I/O，无需视觉能力。

### 代表评测基准

| 基准 | 核心任务 | 规模 | 链接 |
|------|---------|------|------|
| **BFCL**（Berkeley Function Calling Leaderboard） | 函数调用准确性，含并行/嵌套调用 | 动态更新 | [gorilla.cs.berkeley.edu/leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) |
| **ToolBench** | 多工具串联，真实 REST API | 16464 个工具 | [arxiv.org/abs/2307.16789](https://arxiv.org/abs/2307.16789) |
| **τ-bench**（tau-bench） | 电商/航空真实业务流程，含工具失败场景 | 动态 | [arxiv.org/abs/2406.12045](https://arxiv.org/abs/2406.12045) |
| **WildToolBench** | 真实用户工具调用需求（in-the-wild） | 17k+ | [arxiv.org/abs/2410.20138](https://arxiv.org/abs/2410.20138) |
| **API-Bank** | API 调用计划与执行 | 53 个工具 | [arxiv.org/abs/2304.08244](https://arxiv.org/abs/2304.08244) |

### 典型任务示例
- 用天气 API + 地图 API 回答「明天北京适合户外跑步吗」
- 多工具串联：先搜索股价，再计算涨跌幅，再格式化输出报告
- 工具返回错误时的恢复策略（fallback、重试、参数调整）

### 业界优化手段
- **数据**：自动化工具调用轨迹合成（[Toolformer](https://arxiv.org/abs/2302.04761)、[ToolLLM](https://arxiv.org/abs/2307.16789)）；错误恢复对比数据
- **训练**：Supervised on correct call sequences；DPO on valid vs invalid calls
- **架构**：ReAct 框架；工具文档压缩与注入；[Gorilla](https://arxiv.org/abs/2305.15334)（工具文档检索增强）

---

## 三、Search / Deep Research Agent

> **模态需求：纯 LLM** ✅ — 核心 I/O 是搜索查询和网页文本，视觉能力非必须（与 Web Agent 的区别：Search Agent 读内容，Web Agent 操作界面）。

Search Agent 是当前产品化最快的 Agent 类型——OpenAI Deep Research、Google Gemini Deep Research、Perplexity Pro 等都属于这一类。核心能力链：**问题分析 → 搜索规划 → 多步检索 → 信息整合 → 生成报告/答案**。

与 Web Agent 的本质区别：Web Agent 的挑战在于 GUI 操作（点击、填表、导航），Search Agent 的挑战在于信息检索策略和多源综合推理。Search Agent 不需要「操作」网页，只需要「读」网页。

### 代表评测基准

| 基准 | 核心任务 | 规模 | 链接 |
|------|---------|------|------|
| **GAIA** | 多步推理+工具使用的通用 Agent 问题 | 466 题（3 级难度） | [arxiv.org/abs/2311.12983](https://arxiv.org/abs/2311.12983) |
| **BrowseComp**（OpenAI） | 需要持久搜索才能找到的难题 | 1266 题 | [arxiv.org/abs/2504.12516](https://arxiv.org/abs/2504.12516) |
| **BrowseComp-Plus** | BrowseComp 的公平透明版（分离检索器和 Agent） | — | [texttron.github.io/BrowseComp-Plus](https://texttron.github.io/BrowseComp-Plus/) |
| **DeepResearch Bench**（中科大） | 博士级研究任务，RACE+FACT 双框架评估报告质量 | 100 个任务 | [arxiv.org/abs/2506.11763](https://arxiv.org/abs/2506.11763) |
| **DeepSearchQA**（DeepMind） | 多步信息检索问答（需子问题分解） | 2972 题 | [storage.googleapis.com/.../DeepSearchQA](https://storage.googleapis.com/deepmind-media/DeepSearchQA/DeepSearchQA_benchmark_paper.pdf) |
| **SimpleQA**（OpenAI） | 短答事实问答（测幻觉率） | 4326 题 | [openai.com/index/introducing-simpleqa](https://openai.com/index/introducing-simpleqa/) |
| **FRAMES** | 多跳事实检索+推理 | 824 题 | [arxiv.org/abs/2409.12941](https://arxiv.org/abs/2409.12941) |
| **xbench-DeepSearch** | 搜索 Agent 综合排行（规划/检索/推理/摘要） | 动态 | [xbench.org/agi/aisearch](https://xbench.org/agi/aisearch) |

> **Benchmark 层次**：SimpleQA 测单步事实检索 → FRAMES/HotpotQA 测多跳推理 → BrowseComp 测持久搜索 → DeepResearch Bench 测完整报告生成。

### 典型任务示例
- 用户提问「2024 年哪些公司在 AI 芯片领域获得了超过 1 亿美元融资？」→ Agent 规划搜索策略 → 多轮检索 → 交叉验证 → 输出结构化答案
- 给定一个领域（如「蛋白质折叠的最新进展」），生成 5000 字的带引用研究报告
- 找到一个冷门事实（BrowseComp 风格）：「哪位诺贝尔物理学奖得主曾在 1970 年代发表过关于烹饪的论文？」

### 业界优化手段
- **数据**：搜索轨迹合成（[Search-R1](https://arxiv.org/abs/2503.09516)：用 RL 学习何时搜索、搜什么）；多跳 QA 数据（HotpotQA、MuSiQue、2WikiMultiHopQA）；报告质量对比对（[DR-Tulu](https://arxiv.org/abs/2506.06870)）
- **训练**：GRPO + 搜索过程奖励（每次检索是否有效）+ 引用准确性奖励；端到端 RL（OpenAI Deep Research 路线）；SFT on 高质量搜索轨迹（[WebThinker](https://arxiv.org/abs/2503.13378)）
- **架构**：单 Agent 迭代搜索（Search-R1、WebThinker）vs 多 Agent 分层（[SkyworkAI DeepResearchAgent](https://github.com/SkyworkAI/DeepResearchAgent)：Planning Agent + 多个 Sub-Agent）；长上下文窗口处理多源网页；[DeerFlow](https://github.com/bytedance/deer-flow)（字节跳动，多 Agent 研究框架）

### 当前水平
- **BrowseComp**：OpenAI Deep Research 51.5%，其他模型（含 GPT-4o + 搜索）普遍低于 5%——差距极大
- **GAIA Level 3**：最难级别，OpenAI Deep Research ~70%，已显著超越人类平均
- **DeepResearch Bench**：Gemini DR 信息广度碾压（有效引用 111 vs 第二名 41），OpenAI DR 指令遵循最强
- 核心发现：**Fast Thinking（不强制显式推理）训练出的 Agent 比 Slow Thinking 更好**——搜索类任务中，显式推理长度与准确率负相关

---

## 四、Research / Science Agent

> **模态需求：LLM 为主，多模态辅助** ⚠️ — 纯文本可完成大多数任务，但图表理解（论文图/实验曲线）需要多模态能力。

### 代表评测基准

| 基准 | 核心任务 | 规模 | 链接 |
|------|---------|------|------|
| **FrontierScience**（OpenAI） | 博士级科研任务：Olympiad 赛道（奥赛级）+ Research 赛道（开放科研子任务） | Olympiad 100 题 + Research 60 题 | [arxiv.org/abs/2601.21165](https://arxiv.org/abs/2601.21165) |
| **SciCode** | 科学编程（物理/化学/生物计算题） | 338 个子问题 | [arxiv.org/abs/2407.13168](https://arxiv.org/abs/2407.13168) |
| **CORE-Bench** | 论文复现（给 repo + 论文，跑通实验） | 270 个任务 | [arxiv.org/abs/2409.11363](https://arxiv.org/abs/2409.11363) |
| **PaperBench**（OpenAI） | 复现 ICML 2024 论文（完整端到端） | 20 篇论文 | [arxiv.org/abs/2504.01848](https://arxiv.org/abs/2504.01848) |
| **Humanity's Last Exam** | 顶尖专家级多学科难题 | 3000 题 | [arxiv.org/abs/2501.14249](https://arxiv.org/abs/2501.14249) |
| **MLAgentBench** | 端到端 ML 研究任务（读论文→实现→跑实验） | 13 个任务 | [arxiv.org/abs/2310.03302](https://arxiv.org/abs/2310.03302) |
| **MLE-bench**（OpenAI） | Kaggle 竞赛级 ML 工程任务 | 75 个竞赛 | [arxiv.org/abs/2410.07095](https://arxiv.org/abs/2410.07095) |
| **ScienceAgentBench** | 数据驱动科学发现（从文献到代码到结论） | 44 个任务 | [arxiv.org/abs/2410.05080](https://arxiv.org/abs/2410.05080) |

> **FrontierScience 定位说明**：严格来说 FrontierScience 测的是模型的纯科学推理能力（禁用联网），不是 Agent 的信息获取能力。它覆盖 Research Agent 能力栈中的「推理深度」层，但不评测检索和综合能力。Olympiad 赛道 GPT-5.2 达 77%，Research 赛道仅 25%——结构化解题远强于开放科研推理。

### 典型任务示例
- 给定领域背景，检索文献、提出可验证假设
- 阅读一篇论文，指出方法论缺陷（需要批判性推理）
- 给定实验数据图表，分析趋势并关联正文结论（需多模态）
- 从零复现论文核心实验，包含环境配置和结果对比

### 业界优化手段
- **数据**：反向假设生成（[站内提案](/research/reverse-hypothesis-science-data-proposal-v2/)）；同行评审数据提升批判性推理（[站内提案](/research/peer-review-retraction-science-data-proposal/)）；科学图表 QA（[站内提案](/research/science-figure-qa-distillation-data-v2/)）
- **训练**：科学推理链 SFT；[CycleResearcher](https://arxiv.org/abs/2411.00816) 迭代偏好训练
- **架构**：长上下文（完整论文）；RAG（文献库检索）；多 agent（researcher + reviewer 角色分工）

---

## 五、Data Science Agent

> **模态需求：LLM 为主，多模态辅助** ⚠️ — 核心是代码生成和数据处理，但图表生成与理解需要多模态能力。

Data Science Agent 是 Coding Agent 在数据分析领域的专项化。核心能力链：**理解数据需求 → 探索数据 → 编写分析代码 → 执行 → 生成可视化和报告**。与 Coding Agent 的区别在于：Coding Agent 修 bug、写功能；Data Science Agent 做分析、建模、出洞察。

### 代表评测基准

| 基准 | 核心任务 | 规模 | 链接 |
|------|---------|------|------|
| **DSBench**（ICLR 2025） | 真实数据分析 + 数据建模任务（ModelOff + Kaggle） | 466 分析 + 74 建模 | [arxiv.org/abs/2409.07703](https://arxiv.org/abs/2409.07703) |
| **InfiAgent-DABench** | 端到端数据分析（给数据集+问题→写代码→出结果） | 360 题 | [arxiv.org/abs/2401.05507](https://arxiv.org/abs/2401.05507) |
| **DA-Code** | 数据科学代码生成（可控可执行环境） | — | [aclanthology.org/2024.emnlp-main.748](https://aclanthology.org/2024.emnlp-main.748/) |
| **DSEval** | 数据分析全流程评测（多维度） | — | [arxiv.org/abs/2402.17168](https://arxiv.org/abs/2402.17168) |

### 典型任务示例
- 给定一个 CSV 销售数据，分析季度趋势，找出增长最快的品类，生成可视化图表
- Kaggle 竞赛任务：给定训练集和评估指标，完成特征工程 + 模型训练 + 提交预测
- 从多张关联表中做 EDA（探索性数据分析），识别异常值并给出业务解释
- 给定自然语言问题（「哪个城市的客户留存率最高？」），自动写 SQL/Pandas 代码并执行

### 业界优化手段
- **数据**：Kaggle 竞赛 notebook 提取；数据分析轨迹合成（给 LLM 数据集+问题，记录完整分析过程）
- **训练**：execution-based reward（代码执行结果是否正确）；多步推理 SFT（分析计划→代码→解读）
- **架构**：代码解释器集成（如 Code Interpreter / Jupyter kernel）；数据 schema 自动注入；迭代调试循环（执行失败→读错误→修复→重试）

### 当前水平
- DSBench 上 GPT-4o 数据分析任务约 **35%**，建模任务约 **30%**——远低于人类数据科学家
- 核心瓶颈：**长上下文理解**（真实数据集动辄数十列）和 **多步分析的一致性**（前后步骤的逻辑衔接）

---

## 六、Web / Browser Agent

> **模态需求：多模态** 🔴 — GUI 理解（截图）和 DOM 解析是核心能力，纯 LLM 严重受限。

### 代表评测基准

| 基准 | 核心任务 | 规模 | 链接 |
|------|---------|------|------|
| **WebArena** | 真实网站操作（购物/GitHub/Reddit/地图） | 812 个任务 | [arxiv.org/abs/2307.13854](https://arxiv.org/abs/2307.13854) |
| **WorkArena** | 企业 ServiceNow 平台工作流 | 33k+ 任务 | [arxiv.org/abs/2403.07718](https://arxiv.org/abs/2403.07718) |
| **Mind2Web** | 多网站指令跟随（跨域泛化） | 2350 个任务 | [arxiv.org/abs/2306.06070](https://arxiv.org/abs/2306.06070) |
| **ScreenSpot** | GUI 元素定位（截图 + 文字描述 → 坐标） | 1272 个 | [arxiv.org/abs/2401.13649](https://arxiv.org/abs/2401.13649) |
| **WebVoyager** | 端到端网页浏览任务（真实浏览器） | 643 个 | [arxiv.org/abs/2401.13919](https://arxiv.org/abs/2401.13919) |

### 典型任务示例
- 在亚马逊搜索特定规格商品，加入购物车并完成支付流程
- 在 GitHub 创建 issue，填写模板，打标签，指派给指定成员
- 从多个网页抓取数据，汇总到表格（需跨页面状态跟踪）

### 业界优化手段
- **数据**：人工演示轨迹录制；合成 GUI 截图扩增（Set-of-Mark 标注）
- **训练**：step-level reward（每步操作是否有效）；行动空间限制；[WebAgent](https://arxiv.org/abs/2307.12856) 分层规划
- **架构**：截图/DOM 双模态输入；[SoM（Set-of-Mark）prompting](https://arxiv.org/abs/2310.11441) 给 UI 元素编号辅助定位；视觉-语言模型（GPT-4V / Claude 3.5）

---

## 七、GUI Agent

> **模态需求：多模态必须** 🔴 — GUI Agent 的核心能力是「看懂界面 + 决定操作」，视觉理解是前提，不是加分项。

GUI Agent 是 Web Agent 和 Computer Use Agent 的**上位概念**，专注于视觉界面理解和 UI 元素定位能力本身，覆盖范围包括网页、桌面软件、移动端 App、任意截图。

### 代表评测基准

| 基准 | 核心任务 | 平台覆盖 | 链接 |
|------|---------|---------|------|
| **ScreenSpot** | 截图 + 自然语言描述 → 精确定位 UI 元素坐标 | 桌面/Web/移动端 | [arxiv.org/abs/2401.13649](https://arxiv.org/abs/2401.13649) |
| **GUI-World** | 多模态 GUI 理解（截图问答/操作预测） | 跨平台 | [arxiv.org/abs/2406.10819](https://arxiv.org/abs/2406.10819) |
| **AndroidWorld** | 安卓 App 任务（真实设备执行） | Android | [arxiv.org/abs/2405.14573](https://arxiv.org/abs/2405.14573) |
| **MobileAgentBench** | 移动端 UI 操作基准 | iOS/Android | [arxiv.org/abs/2406.08184](https://arxiv.org/abs/2406.08184) |
| **GUIdance** | GUI 操作轨迹预测与评估 | 多平台 | [arxiv.org/abs/2505.07132](https://arxiv.org/abs/2505.07132) |
| **ScreenAgent** | 全平台截图指令执行（含截图理解+操作） | 跨平台 | [arxiv.org/abs/2402.07945](https://arxiv.org/abs/2402.07945) |

### 典型任务示例
- 截图中有 50 个 UI 元素，精确点击「提交」按钮（坐标定位）
- 理解一个从未见过的 App 界面，完成「修改密码」操作
- 移动端：在微信中找到某个联系人并发送特定内容
- 识别界面异常（弹窗/错误提示），决定下一步操作

### 业界优化手段
- **数据**：
  - 合成 GUI 截图（[SynthGUI](https://arxiv.org/abs/2407.03943) 类方案，自动生成带标注的 UI 截图）
  - 真实 App 使用录屏 + 动作标注
  - Set-of-Mark（SoM）标注：给截图中的 UI 元素自动编号，降低坐标预测难度（[arxiv.org/abs/2310.11441](https://arxiv.org/abs/2310.11441)）
- **训练**：
  - UI 元素理解预训练（[CogAgent](https://arxiv.org/abs/2312.08914)：专门针对 GUI 场景微调的视觉语言模型）
  - 坐标回归 vs 元素 ID 预测两种范式
  - [UI-JEPA](https://arxiv.org/abs/2505.17647)：桌面 UI 状态表示学习
- **架构**：
  - 截图分辨率处理：高分辨率截图切块 + 局部理解（[UGround](https://arxiv.org/abs/2406.08259)）
  - 双流输入：截图（视觉）+ DOM/AccessibilityTree（结构化文本）互补
  - [OmniParser](https://arxiv.org/abs/2408.00203)（微软）：截图解析为结构化 UI 元素列表

### 当前水平
- ScreenSpot 上最好模型（GPT-4V + SoM）定位准确率约 75%，人类接近 100%
- AndroidWorld 上最好结果约 30-35%，任务完成率仍低
- 核心瓶颈：**高分辨率截图理解 + 精确坐标预测** 的联合优化

---

## 八、Mobile Agent

> **模态需求：多模态必须** 🔴 — 手机截图是主要输入，同时需要理解移动端特有的交互模式（手势、通知栏、底部导航栏、弹窗权限请求等）。

Mobile Agent 是 GUI Agent 在移动端的专项化，但有几个**桌面 Agent 没有的独特挑战**：
- **手势操作**：滑动、长按、双指缩放，不只是点击
- **系统级中断**：通知、弹窗权限请求、来电，需要处理并恢复任务
- **多 App 跳转**：从地图跳外卖 App，从浏览器跳支付 App，跨应用状态追踪
- **小屏幕密度**：UI 元素更小、更密集，坐标精度要求更高
- **iOS vs Android 差异**：系统 UI 范式不同，泛化难度更高

### 代表评测基准

| 基准 | 核心任务 | 平台 | 链接 |
|------|---------|------|------|
| **AndroidWorld** | 真实 Android 设备上的 App 操作任务（116 个可程序化验证的任务） | Android | [arxiv.org/abs/2405.14573](https://arxiv.org/abs/2405.14573) |
| **MobileAgentBench** | 多 App 跨任务评测，含 App 内和跨 App 场景 | Android | [arxiv.org/abs/2406.08184](https://arxiv.org/abs/2406.08184) |
| **AppAgent** | 基于截图的 App 操作（探索+执行两阶段） | Android | [arxiv.org/abs/2312.13771](https://arxiv.org/abs/2312.13771) |
| **Mobile-Bench** | 多维度移动端任务（单 App / 多 App / 系统操作） | Android | [arxiv.org/abs/2407.00993](https://arxiv.org/abs/2407.00993) |
| **B-MoCA** | 真实设备多语言、多地区 App 操作（含中文 App） | Android | [arxiv.org/abs/2404.05755](https://arxiv.org/abs/2404.05755) |
| **iOS TaskBench** | iOS 系统下 Shortcut/自动化任务 | iOS | [arxiv.org/abs/2312.12422](https://arxiv.org/abs/2312.12422) |

### 典型任务示例
- 打开微信，找到「文件传输助手」，发送一张相册中最新的图片
- 在美团搜索附近评分最高的火锅店，查看菜单，把「毛肚」加入购物车
- 收到一条快递通知，打开快递 App 确认签收，然后回到原来的 App 继续操作
- 在设置中开启「勿扰模式」，设定 23:00-07:00 自动开启
- 跨 App：从浏览器复制一段地址 → 打开高德地图 → 搜索导航

### 业界优化手段
- **数据**：
  - 人工录制操作演示（成本最高，但质量最好）
  - 自动探索（[DroidBot-GPT](https://arxiv.org/abs/2304.07061)：用 GPT 驱动随机探索生成训练数据）
  - App UI 截图合成扩增（生成更多 App 状态的训练覆盖）
  - [MobleAgent v2](https://arxiv.org/abs/2406.01014)：自我进化数据采集框架
- **训练**：
  - 操作预测（给截图 + 指令 → 输出下一步操作类型+坐标）
  - 分层训练：先学 UI 理解（元素识别），再学操作规划（任务分解）
  - [CogAgent](https://arxiv.org/abs/2312.08914) 在移动端 benchmark 上做了专门的 GUI 微调
- **架构**：
  - 截图 → 高分辨率视觉编码 → 操作输出（点击坐标 / 滑动方向 / 文字输入）
  - Accessibility Tree 辅助：Android 系统提供 UI 元素的结构化描述，比纯截图更精确
  - 记忆机制：跨步骤任务需要维护操作历史和当前目标状态
  - [AppAgent](https://arxiv.org/abs/2312.13771) 两阶段：先探索 App 生成文档，再执行任务

### 当前水平与核心瓶颈
- AndroidWorld 上最好结果约 **30-35%**（GPT-4V + ReAct），远低于人类（~80%+）
- 核心瓶颈：**跨 App 状态追踪** 和 **系统中断处理**——这两个场景的训练数据极度稀缺
- 中文 App 支持仍薄弱：大多数 benchmark 以英文 App 为主，中文 App UI 的泛化能力有明显 gap

---

## 九、Computer Use / OS Agent

> **模态需求：多模态必须** 🔴 — 操作桌面应用依赖截图理解和像素级坐标定位，纯 LLM 无法完成。

### 代表评测基准

| 基准 | 核心任务 | 规模 | 链接 |
|------|---------|------|------|
| **OSWorld** | 跨平台桌面任务（Windows/macOS/Linux） | 369 个任务 | [arxiv.org/abs/2404.07972](https://arxiv.org/abs/2404.07972) |
| **WindowsAgentArena** | Windows 桌面应用操作 | 154 个任务 | [arxiv.org/abs/2409.08264](https://arxiv.org/abs/2409.08264) |
| **AssistGUI** | Office 软件操作（Excel/Word/PPT） | 100 个 | [arxiv.org/abs/2312.13108](https://arxiv.org/abs/2312.13108) |
| **ScreenAgent** | 全平台截图指令执行 | — | [arxiv.org/abs/2402.07945](https://arxiv.org/abs/2402.07945) |

### 典型任务示例
- 打开 Excel，根据描述筛选数据，生成折线图并导出 PDF
- 跨应用工作流：复制邮件中的日期 → 在 Calendar 创建事件 → 发送邀请
- 系统操作：批量重命名文件，修改系统设置，安装软件

### 业界优化手段
- **数据**：屏幕录制 + 动作标注（成本极高）；合成 GUI 截图训练 grounding 能力
- **训练**：视觉理解和坐标预测联合优化；action chunking（多步操作打包）；[Claude Computer Use](https://www.anthropic.com/news/3-5-models-and-computer-use) 端到端训练
- **架构**：截图 → 视觉编码 → 坐标预测；[UI-JEPA](https://arxiv.org/abs/2505.17647) 桌面表示学习

---

## 十、Multi-Agent / Orchestration

> **模态需求：取决于子 Agent** — Orchestrator 本身纯 LLM 即可，但子 Agent 的模态需求继承各自类型。

### 代表评测基准

| 基准 | 核心任务 | 规模 | 链接 |
|------|---------|------|------|
| **AgentBench** | 多场景综合（操作系统/数据库/网页等8类） | 1091 个 | [arxiv.org/abs/2308.03688](https://arxiv.org/abs/2308.03688) |
| **MLAgentBench** | 机器学习研究任务（端到端 ML 实验） | 13 个任务 | [arxiv.org/abs/2310.03302](https://arxiv.org/abs/2310.03302) |
| **ChatDev / MetaGPT Eval** | 软件开发多 Agent 协作（从需求到代码） | — | [arxiv.org/abs/2307.07924](https://arxiv.org/abs/2307.07924) |
| **CAMEL** | 角色扮演协作，两 Agent 完成任务 | — | [arxiv.org/abs/2303.17760](https://arxiv.org/abs/2303.17760) |

### 典型任务示例
- Planner 分解任务 → 多个 executor 并行执行 → Aggregator 合并结果
- 代码 review agent + 开发 agent 迭代循环（CycleResearcher 范式）
- 医疗诊断：多专家 agent 辩论，综合给出诊断建议

### 业界优化手段
- **数据**：多轮协作轨迹合成；角色分工数据（何时 handoff、如何传递上下文）
- **训练**：通信协议学习；[MetaGPT](https://arxiv.org/abs/2308.00352) SOP 工作流学习；共识机制优化
- **架构**：[LangGraph](https://github.com/langchain-ai/langgraph) / [AutoGen](https://arxiv.org/abs/2308.08155)；共享 memory / blackboard；[DeerFlow](https://github.com/bytedance/deer-flow) 研究型多 Agent

---

## 训练优化维度对比

从**数据建设**角度看各类 Agent 的可优化性——这是决定进展速度的核心因素。

| 类型 | 数据获取难度 | 自动评分 | 主流训练方式 | RL 适用性 | 数据飞轮潜力 |
|------|------------|---------|------------|----------|-------------|
| Coding | 中 | ✅ 执行测试 | SFT + RL on test pass | 高（明确奖励） | 高（用户反馈闭环） |
| Tool Use | 低 | ✅ 参数匹配 | SFT + 合成数据 | 高 | 高 |
| Search / DR | 中 | ⚠️ 部分（QA 可自动，报告需人评） | SFT 轨迹 + GRPO | 中高 | 高（搜索日志） |
| Research | 高（专家标注） | ❌ 需领域专家 | SFT 为主 | 低（奖励难定义） | 低 |
| Data Science | 中 | ✅ 执行结果 | SFT + execution reward | 高 | 中（Kaggle 数据有限） |
| Web / Browser | 高（录制） | ⚠️ 任务完成判定 | SFT + 模仿学习 | 中 | 中 |
| GUI Agent | 高（标注截图） | ⚠️ 坐标匹配 | 视觉 SFT + 坐标回归 | 中 | 低 |
| Mobile Agent | 极高（真机） | ❌ 需真机验证 | 模仿学习为主 | 低 | 低 |
| OS / Computer Use | 极高（录制） | ❌ 环境复杂 | 端到端训练 | 低 | 低 |
| Multi-Agent | 高（场景设计） | ❌ 无统一标准 | SOP 学习 + 通信协议 | 低 | 中 |

> **核心规律**：**数据获取难度 × 自动评分可行性 = 进展速度的主要决定因素**。Coding 和 Tool Use 之所以跑得最快，不是因为问题更简单，而是因为训练数据的飞轮转得起来。

---

## 关键洞见

**1. 「多模态」不是增益，是某些类型的前提**
Web Agent 和 Computer Use Agent 用纯 LLM 的上限非常低——没有视觉能力就无法理解 UI 状态。而 Coding Agent、Tool Use Agent、Search Agent 至今主要进展都来自纯语言模型。

**2. 数据瓶颈决定进展速度**
BFCL 上 Tool Use Agent 达到 85%+ 的核心原因：数据可以自动合成且自动验证。OSWorld 停在 40% 的核心原因：屏幕录制数据贵且难以扩展。**数据获取难度 = 能力天花板的主要决定因素之一。**

**3. Search Agent 是当前产品化最成功但评测最滞后的类型**
OpenAI、Google、Perplexity 等已经商业化的 Deep Research 产品，但直到 2025 年中才有 DeepResearch Bench 这样的专门评测。BrowseComp 上 OpenAI DR 51.5% vs 其他模型 <5% 的巨大差距，说明**端到端 RL 训练的搜索 Agent 远超 prompt engineering 方案**。

**4. Research Agent 是当前最大的能力-需求 gap**
FrontierScience-Research 25% 的水平意味着顶尖模型在博士级任务上 4 题只对 1 题。这个方向的需求极大（科研加速），但数据建设仍然非常早期。

**5. Search Agent ≠ Research Agent，但两者正在融合**
Search Agent 的核心瓶颈是检索策略和多源综合；Research Agent 的核心瓶颈是科学推理深度。未来的「AI 科学家」需要同时具备两种能力——Deep Research Agent（如 OpenAI DR）已经在这个方向上迈出了一步，但在 FrontierScience-Research 级别的科学推理上仍有很大差距。

**6. Multi-Agent 评估标准缺失是下一步障碍**
各 framework 都在快速迭代，但跨框架的统一评测基准还不成熟，导致进展很难横向比较。
