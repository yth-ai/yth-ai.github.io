---
title: "SkillsBench 精读：Agent Skills 有效性的首个标准化评测"
description: "86 个任务、7308 条轨迹——Agent Skills 策划 vs 自生成的定量对比"
date: 2026-03-11
category: 论文精读
tags: ["Agent Skills", "Benchmark", "评测"]
paperTitle: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
arxiv: "2602.12670"
draft: false
---
# SkillsBench 精读报告

> **论文标题**: SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks
>
> **作者**: Xiangyi Li, Wenbo Chen, Yimin Liu, Shenghan Zheng, Xiaokun Chen, Yifeng He, Yubo Li, Bingran You, Haotian Shen, Jiankai Sun, Shuyi Wang, Binxu Li, Qunhong Zeng, Di Wang, Xuandong Zhao 等（共 40+ 位作者）
>
> **机构**: BenchFlow，联合 Amazon、ByteDance、Foxconn、Stanford、CMU、UC Berkeley、Columbia、Oxford 等
>
> **发布时间**: 2026年2月13日（最后修订 2026年3月7日）
>
> **arXiv**: [2602.12670](https://arxiv.org/abs/2602.12670)
>
> **GitHub**: [benchflow-ai/skillsbench](https://github.com/benchflow-ai/skillsbench)
>
> **官网**: [skillsbench.ai](https://www.skillsbench.ai/)

---

## 一、论文定位与核心贡献

### 1.1 问题意识：Agent Skills 到底有没有用？

2025 年底，Anthropic 将 Agent Skills 正式发布为开放标准并捐赠给 Agentic AI Foundation (AAIF)，随后 Cursor、GitHub Copilot、OpenCode、Gemini CLI 等主流工具在短短两个月内纷纷跟进支持。Agent Skills 生态以惊人的速度膨胀——但一个根本性的问题始终悬而未决：**Skills 真的有用吗？它在什么条件下有用、在什么条件下无效甚至有害？**

论文摘要开宗明义地指出了这一研究缺口：

> "Agent Skills are structured packages of procedural knowledge that augment LLM agents at inference time. Despite rapid adoption, there is no standard way to measure whether they actually help."

这是一个极为关键的时间窗口——整个行业正在大规模投入 Skills 的开发和集成，但缺乏任何系统性的实证数据来指导这些投入。SkillsBench 的价值恰恰在于：它是第一个为 Agent Skills 的有效性提供定量证据的标准化评测框架。

### 1.2 核心贡献

SkillsBench 做了四件事：

1. **构建了首个 Agent Skills 评测基准**：86 个任务（最终入选 84 个），跨越 11 个专业领域，配套人工策划的 Skills 和确定性验证器。

2. **设计了三条件对照实验**：每个任务在"无 Skills"、"策划 Skills"和"自生成 Skills"三种条件下评估，7 种 Agent-Model 配置，共分析 7,308 条轨迹。

3. **揭示了 Skills 有效性的核心规律**：策划 Skills 平均提升 16.2pp，但效果因领域剧烈变化（软件工程 +4.5pp vs. 医疗保健 +51.9pp）；自生成 Skills 平均反而倒退 1.3pp。

4. **提出了 Skills 设计的实践指南**：精简的 2-3 模块 Skills 优于百科全书式文档，小模型+优质 Skills 可匹敌大模型裸跑。

---

## 二、什么是 Agent Skills？

### 2.1 核心定义

Agent Skills 是一种**结构化的程序性知识包（structured packages of procedural knowledge）**，在推理时注入 LLM Agent，增强其在特定领域的任务执行能力。它本质上是 Agent 的"职业操作手册"——不改变模型参数，而是通过上下文提供自然语言指引、代码模板和验证逻辑。

与传统的 Tool / Plugin 相比，Skills 的区别在于：

| 维度 | Agent Skills | Tools/Functions | Plugins |
|------|-------------|-----------------|---------|
| 本质 | 结构化指令包 + 程序性知识 | 可执行的 API 或函数 | 完整的软件模块 |
| 核心 | "知道怎么做"（How to） | "做什么"（What to do） | 独立的功能单元 |
| 形态 | Markdown + 脚本 + 资源文件 | 函数签名 + 调用协议 | 需要生命周期管理 |
| 上下文消耗 | 渐进式按需加载 | 持续加载 | 通常不占用上下文 |

### 2.2 Agent Skills 规范

根据 [Agent Skills 开放规范](https://agentskills.io/specification)，每个 Skill 是一个目录，包含：
- **SKILL.md**（必需）：YAML 前置元数据（name, description, license）+ Markdown 格式的详细指令
- **scripts/**（可选）：可执行脚本
- **references/**（可选）：参考文档
- **assets/**（可选）：模板和资源文件

其核心创新是**渐进式信息披露（Progressive Disclosure）**机制，分三级加载：
1. **元数据阶段**：仅加载 name 和 description（~100 tokens），Agent 据此决定是否需要此 Skill
2. **指令阶段**：按需加载 SKILL.md 完整内容（建议 < 5000 tokens）
3. **资源阶段**：仅在必要时加载脚本、示例等附加资源

这一机制直接回应了 Token 浪费问题——不是一股脑把所有信息塞进上下文，而是"需要什么加载什么"。

---

## 三、评测框架设计

### 3.1 三层抽象架构

SkillsBench 将 AI Agent 的评测体系类比为传统计算机系统的分层架构，提出了三层抽象模型：

**Skill Layer（技能层）≈ 应用程序**
- 特定领域的功能和工作流
- 包含指令文档、执行脚本和资源文件
- 从具体实现中解耦

**Agent Harness Layer（智能体执行环境层）≈ 操作系统**
- 编排 Agent 的执行流程
- 管理工具访问和 I/O 处理
- 支持渐进式加载 Skills
- 在 Skills（应用）和 Model（硬件）之间进行中介

**Model Layer（模型层）≈ CPU**
- 基础 AI 模型，提供推理和生成能力
- 提供上层构建所依赖的原始计算能力

这一分层设计的意义在于：**将 Skills 的效果从 Agent Harness 和 Model 的能力中独立出来评估**。同样的 Skill 在不同的 Harness（Claude Code vs. Gemini CLI vs. Codex）和不同的 Model（Opus 4.6 vs. Haiku 4.5）上可能表现完全不同——SkillsBench 的实验设计恰恰捕获了这些交互效应。

### 3.2 任务设计与构建

**数据来源**：社区内 105 位开发者提交了 322 个候选任务，经过自动化机器校验与多轮人类专家审查，最终入选 **84 个**高质量任务（摘要中提到 86 个，实际排除了运行时遇到错误的任务后为 84 个）。

**每个任务的四个核心组件**：

1. **人类专家撰写的指令目标**——脱离 Skills 也能被理解的独立任务描述
2. **容器环境中预装的特制数据文件**——任务所需的输入数据
3. **包含 Skills 代码的子目录**——策划好的技能包
4. **后台配备的参考解答路径**——用于验证的标准答案

**防作弊机制**极为严格：

> Skills 内容**严禁包含**特定任务的文件名、常数或魔法数字。指南必须是针对通用问题的解决思路，不能直接写死特定案例的答案。

这意味着 Skills 必须是"授人以渔"而非"授人以鱼"——它提供的是方法论和流程指导，而不是答案本身。这一设计确保了实验测量的是 Skills 的真正泛化价值，而非信息泄露。

### 3.3 确定性验证器

SkillsBench 采用**完全容器化的沙盒环境**，每个任务封装在独立的 Docker 镜像内：

- 通过自动化脚本和程序断言进行裁决
- **摒弃了"AI 充当裁判"的主观评分方式**，排除评分方差
- 确保结果的客观性和可复现性
- 验证命令：`harbor tasks check <task-id>`

这一点与很多使用 GPT-4 作为 Judge 的 benchmark 形成鲜明对比。确定性验证器的优势在于：**结果是二值的（通过/不通过），没有模糊地带，也没有评分者间信度问题**。

### 3.4 三种评估条件

所有 84 个任务在以下三种条件下进行测试：

| 条件 | 描述 |
|------|------|
| **No Skills（裸跑模式）** | 完全剥离 Skills 文件，Agent 仅凭自身能力解题 |
| **Curated Skills（策划 Skills）** | 注入由人类专家精心编制的 Skills |
| **Auto-generated Skills（自生成 Skills）** | 要求 LLM 当场编写 Skills 后再解题 |

这三种条件的设计精妙之处在于——它不仅回答了"Skills 有没有用"，还回答了"谁写的 Skills 有用"以及"模型能不能自己创造对自己有用的 Skills"。

---

## 四、实验设置

### 4.1 测试的 Agent-Model 配置

论文测试了 7 种主流 Agent Harness + Model 的组合：

| Agent Harness | Model | 说明 |
|---------------|-------|------|
| Claude Code | Opus 4.5 | Anthropic 旗舰模型 |
| Claude Code | Opus 4.6 | Anthropic 最新旗舰 |
| Claude Code | Sonnet 4.5 | Anthropic 中档模型 |
| Claude Code | Haiku 4.5 | Anthropic 入门级模型 |
| Gemini CLI | Gemini 3 Flash | Google 快速模型 |
| Gemini CLI | Gemini 3 Pro | Google 专业模型 |
| Codex CLI | GPT-5.2 | OpenAI 最新模型 |

每个任务进行 **5 次试验**，报告 **95% 置信区间**，总计收集 **7,308 条运行轨迹**。

### 4.2 覆盖的 11 个领域

任务横跨 11 个高 GDP 价值的专业领域，涵盖从传统工程到前沿科学的广泛场景。根据官网展示的任务列表，这些领域包括但不限于：

- **软件工程**（Software Engineering）——如 Spring Boot 迁移
- **医疗保健**（Healthcare）——如临床数据协调
- **金融建模**（Financial Modeling）——如大规模财务数据分析
- **能源**（Energy）——如交流最优潮流建模、电力市场定价
- **网络安全**（Cybersecurity）——如网络入侵检测、BGP 路由分析
- **自然科学**（Natural Sciences）——如地震波分析、系外行星探测
- **工程**（Engineering）——如 3D 扫描计算、自适应巡航控制
- **材料科学**（Materials Science）——如晶体学分析
- **游戏开发**（Game Development）——如文明6区域优化
- **数据可视化**（Data Visualization）——如 D3.js 交互图表
- **文档处理/法律**（Document Processing）——如法庭表格填写

任务难度分布涵盖 Easy、Medium、Hard 三个级别。

---

## 五、核心实验结果

### 5.1 总体通过率排行

| 排名 | Agent Harness | Model | 无 Skills | 策划 Skills | 提升 (Δ) |
|------|---------------|-------|-----------|-------------|----------|
| 1 | Gemini CLI | Gemini 3 Flash | 31.3% | **48.7%** | +17.4pp |
| 2 | Claude Code | Opus 4.5 | 22.0% | **45.3%** | +23.3pp |
| 3 | Codex CLI | GPT-5.2 | 30.6% | **44.7%** | +14.1pp |
| 4 | Claude Code | Opus 4.6 | 30.6% | **44.5%** | +13.9pp |
| 5 | Gemini CLI | Gemini 3 Pro | 27.6% | **41.2%** | +13.6pp |
| 6 | Claude Code | Sonnet 4.5 | 17.3% | **31.8%** | +14.5pp |
| 7 | Claude Code | Haiku 4.5 | 11.0% | **27.7%** | +16.7pp |

**关键观察**：

**所有 7 种配置均受益于策划 Skills**，最低提升 13.6pp（Gemini 3 Pro），最高提升 23.3pp（Opus 4.5）。平均提升 **16.2 个百分点**。

> "Curated Skills raise pass rates by 16.2 percentage points on average."

### 5.2 按领域的差异性影响

这是论文最重要的发现之一——**Skills 的效能与模型在预训练阶段的领域覆盖度呈高度负相关**：

| 领域特征 | 代表领域 | 提升幅度 | 机理分析 |
|----------|----------|----------|----------|
| **低频/稀缺领域** | 医疗保健 | **+51.9pp** | 公共训练语料极少，模型缺乏内置知识，Skills 提供了关键的领域规程 |
| **高频/核心领域** | 软件工程 | **+4.5pp** | 模型已在海量代码上训练，固化了解题套路，外部 Skills 反而可能打乱"肌肉记忆" |

> Skills 的效能与模型在预训练阶段"见过的世面"呈现高度负相关。医疗、制造业等因公共训练语料极少的稀缺领域，外部 Skills 提供规程后成功率暴涨 50 多个百分点。软件工程、基础数学等模型早已固化解题套路的领域，外部硬塞 Skills 反而容易打乱"肌肉记忆"，导致增益极小甚至出现反面效果。

这一发现的实践意义极为深远：**Skills 的投资回报率在不同领域是数量级级别的差异**。在医疗、制造等冷门领域编写一套高质量 Skills，ROI 可能是在软件工程领域的 10 倍以上。

### 5.3 16 个负 Delta 任务

在 84 个任务中，有 **16 个任务（约 19%）在使用 Skills 后通过率反而下降**。论文分析了三个主要原因：

1. **Skills 干扰了模型已有的解题策略**——对于模型本就擅长的任务，额外注入的流程指引可能打乱其自主推理路径
2. **过多不相关的 Skills 导致认知负荷过载**——上下文窗口是有限的，无关 Skills 会挤占宝贵的注意力资源
3. **Skills 与任务之间存在逻辑冲突**——策划的 Skills 如果不够精准，反而引入错误的先验

这 19% 的负面案例是一个重要的警示：**Skills 不是"给了就好"，它需要精心的任务-技能匹配**。

### 5.4 自生成 Skills 的失败

这是论文中最具冲击力的发现之一：

> "Auto-generated Skills offer no benefit on average."

具体数据更加令人警醒——自生成 Skills 不仅没有帮助，还**平均倒退了 1.3 个百分点**，比完全不使用 Skills 还要差。

**根本原因分析**：

1. **参数精度问题**：模型虽然模糊意识到需要专业手段，但**无法准确编写 API 调用参数**——它知道"应该用某个库"，但写不对具体的函数签名和参数。

2. **知识盲区不可自知**：面对冷门领域（金融、制造业）时，模型**无法察觉自己缺乏的知识**，反而盲目使用通用常识，生成的 Skills 是错误的指引。

3. **执行层面的抗拒**：特别值得注意的是 Codex 的表现——它经常**忽略外部 Skills，坚持使用自己的方法**（"老办法硬干"），这说明某些模型对外部指令的遵循度本身就不一致。

论文由此得出了一个核心结论：

> "Models cannot reliably write the procedural knowledge they benefit from consuming."

**模型无法可靠地编写它们自己从消费中获益的程序性知识。** 换言之，"读操作手册"和"写操作手册"是两种完全不同的认知能力——当前的 LLM 在前者上表现优异，在后者上却严重不足。

---

## 六、深度分析：什么样的 Skills 最有效？

### 6.1 精简法则：2-3 模块 > 百科全书

论文的一个核心实践发现是关于 Skills 的粒度：

> "Lean Skills focused on 2-3 modules outperform comprehensive documentation."

**最有效的 Skills 特征**：
- 聚焦的业务流程拆解（而非面面俱到）
- 1-2 个精简的执行案例（而非大量示例）
- 结构紧凑、指引明确

**冗长 Skills 失败的原因**：
- 过多互不相关的模板导致 Agent **认知负荷过载**
- 容易在不同模块间组合出**冲突的逻辑**
- 百科全书式的冗长指南会**严重消耗模型宝贵的上下文注意力配额**
- 违反上下文窗口限制的硬约束

这一发现与认知科学中的**信息过载理论**高度一致——不是信息越多越好，而是**相关信息的密度决定了决策质量**。对于 LLM 而言，上下文窗口就是其"工作记忆"，而 Skills 就是塞进工作记忆的信息——如果塞得太满，反而降低了对关键信息的注意力分配。

### 6.2 小模型逆袭：Skills 作为算力鸿沟的桥梁

论文另一个引人注目的发现是：

> "Smaller models with Skills can match larger models without Skills."

具体案例分析：

**Haiku 4.5（Anthropic 最小模型）**：
- 裸跑：11.0%
- 加 Skills：27.7%（+16.7pp）
- 加 Skills 后的性能已接近 Opus 4.6 裸跑水平（30.6%）

**Gemini 3 Flash（Google 快速模型）的成本优势**：
- 虽然单任务消耗 Token 是其他模型的 **2.3 倍**（通过高频试错迭代弥补推理深度不足）
- 但由于 Token 单价低廉，**总成本反而降低了 44%**
- 同时取得了**全场最高的 48.7% 通过率**

这揭示了一个极具商业价值的等式：

$$\text{小模型} + \text{高质量 Skills} \geq \text{大模型} \times \text{裸跑}$$

对于企业来说，这意味着：**与其花高价使用旗舰模型，不如投资编写高质量的领域 Skills，然后用更便宜的模型运行**。

### 6.3 不同 Agent Harness 的 Skills 利用效率

从排行榜数据可以观察到 Harness 层面的有趣差异：

**Claude Code**：斩获了最高的净增长幅度（Opus 4.5: +23.3pp），凸显了其**原生 Skills 集成架构**的优越性。Claude Code 的设计从一开始就深度支持 Agent Skills 的渐进式加载，这使得它在 Skills 利用效率上具有结构性优势。

**Gemini CLI**：取得了最亮眼的**原始通过率**（Flash: 48.7%），说明 Gemini 系列模型在"执行指令"方面具有强大的基础能力。

**Codex CLI**：虽然得分不俗（44.7%），但存在一个独特问题——**经常忽略外部 Skills，坚持使用自己的方法**。这暗示 OpenAI 的模型在"指令遵循"维度上存在与 Anthropic 和 Google 不同的训练偏好。

---

## 七、与相关工作的对比

### 7.1 填补的研究空白

在 SkillsBench 之前，Agent 评测领域已有多个知名 benchmark，但没有一个专门评估 Skills 的有效性：

| Benchmark | 焦点 | 与 SkillsBench 的关系 |
|-----------|------|----------------------|
| **SWE-bench** | 真实 GitHub issue 修复 | 仅覆盖软件工程，SkillsBench 发现这恰恰是 Skills 增益最小的领域 |
| **GAIA** | 通用 AI 助手的多步骤推理 | 评估 Agent 整体能力，但不分离 Skills 的独立贡献 |
| **AgentBench** | 8 种环境下的 Agent 能力 | 评估模型的 Agent 潜力，不涉及 Skills 增强范式 |

SkillsBench 的独特定位是：**不是评估模型"能不能做 Agent"，而是评估"给 Agent 装上 Skills 后到底有多大帮助"。** 它是一个关于**知识组织方式效率**的 benchmark，而非单纯的能力 benchmark。

### 7.2 与 OneMillion-Bench 的对比

有趣的是，SkillsBench 和近期发布的 OneMillion-Bench 形成了互补：

- **OneMillion-Bench** 从经济价值角度衡量 Agent 能做多少"值钱的"专家工作
- **SkillsBench** 则揭示了如何通过 Skills 增强来扩大 Agent 的可交付范围

两者结合的启示是：如果 SOTA Agent 在 OneMillion-Bench 上只能交付 $48 万价值的工作，那么高质量 Skills 可能是将这个数字大幅推高的关键杠杆——尤其是在医疗、制造等 OneMillion-Bench 中高价值但通过率低的领域。

---

## 八、排行榜实例分析

官网提供了一个详细的执行轨迹示例（Gemini 3 Flash），展示了 Skills 如何在具体任务中发挥作用：

**任务**：Spring Boot 2 到 3 的迁移（Java 8 升级到 Java 21）

**Agent 的执行过程**：
1. 读取 Skills 元数据，激活了 `spring-boot-migration`、`jakarta-namespace`、`spring-security-6`、`restclient-migration`、`hibernate-upgrade` 等 Skills
2. 根据 Skills 指引，执行 `mvn clean compile` 并修复编译错误
3. 按 Skills 中的流程，批量替换 `javax.*` 命名空间为 `jakarta.*`
4. 依据 `spring-security-6` Skill，重构 `SecurityConfig.java` 以适配新版本

**结果**：PASS | **耗时**：169 秒 | **Token 消耗**：1,474k tokens

这个案例清晰地展示了 Skills 的工作模式：它不是替 Agent 做决策，而是提供了**结构化的迁移检查清单和领域特定的操作步骤**，让 Agent 在正确的方向上高效执行。

---

## 九、讨论与展望

### 9.1 对 Skills 生态的影响

SkillsBench 的发现为正在爆炸增长的 Agent Skills 生态提供了第一份系统性的科学指导：

**对 Skills 开发者**：
- 优先为冷门领域（医疗、制造、金融）编写 Skills，ROI 最高
- 每个 Skill 聚焦 2-3 个模块，配 1-2 个执行案例
- 避免堆砌无关 Skills，防止认知负荷过载

**对模型厂商**：
- Agent Harness 的原生 Skills 集成架构至关重要（Claude Code 的优势即来源于此）
- 模型的"指令遵循度"直接影响 Skills 利用效率（Codex 的"自行其是"问题需要关注）

**对企业用户**：
- 选择经过验证的策划 Skills，而非依赖自生成 Skills
- 小模型 + 高质量 Skills 可能是最优的成本效益选择
- Skills 投资应聚焦在模型预训练数据覆盖薄弱的业务领域

### 9.2 开放问题

论文也留下了几个有待解决的问题：

1. **自生成 Skills 的改进路径**：既然当前模型无法可靠地自我编写 Skills，那么什么样的训练策略或架构改进能弥补这一能力缺口？

2. **Skills 的动态适配**：当前 Skills 是静态的，是否可以设计一种机制让 Skills 在使用过程中根据反馈自动调优？

3. **跨模型迁移性**：为 Claude Code 精心设计的 Skills 在 Gemini CLI 上效果如何？Skills 的可移植性边界在哪里？

4. **规模化评测**：84 个任务 × 11 个领域是否足够？随着 Skills 生态的扩展，评测框架本身也需要同步扩展。

---

## 十、个人思考与点评

### 10.1 创新性评价

SkillsBench 最大的贡献不在于技术复杂度，而在于**提出了正确的问题并设计了科学的实验来回答它**。在整个行业都在无脑拥抱 Agent Skills 的当下，一个严谨的、跨领域的、三条件对照的实证研究弥足珍贵。

三层抽象架构（Skill / Harness / Model）的设计也具有持久的方法论价值——它提供了一个清晰的变量分离框架，使得后续研究可以在此基础上独立探索每一层的优化空间。

### 10.2 局限性分析

1. **领域覆盖的不均匀性**：84 个任务分布在 11 个领域中，但每个领域的任务数量差异较大。某些领域（如医疗保健 +51.9pp 的数字）可能基于较少的任务样本，统计稳健性需要更大规模的验证。

2. **Skills 质量的控制变量**：所有策划 Skills 都由人类专家编写，但不同专家的编写质量、经验和风格可能存在差异。论文没有详细分析 Skills 质量本身的方差对结果的影响。

3. **时间快照问题**：评测使用的模型（Opus 4.5/4.6、Gemini 3 Flash/Pro、GPT-5.2）是特定时间点的版本。随着模型的快速迭代，这些数字可能很快过时——但发现的**规律性结论**（如领域负相关、精简优于冗长）可能具有更持久的价值。

4. **Agent Harness 的偏置**：测试的三种 Harness（Claude Code、Gemini CLI、Codex CLI）都是特定厂商的产品，各自对 Skills 的加载和呈现方式不同。评测结果在一定程度上反映的是"Harness + Skills"的联合效果，而非 Skills 的纯粹效果。

### 10.3 对领域的启示

SkillsBench 为我们画出了一幅清晰的 Agent Skills 价值地图：

- **高收益区**（冷门专业领域）：这是 Skills 的蓝海，投入产出比极高
- **低收益区**（软件工程等高频领域）：模型已经"自学成才"，Skills 的边际价值有限
- **风险区**（19% 的负 Delta 任务）：不当的 Skills 使用反而有害

这张地图对于整个 AI Agent 产业的资源配置具有重要指导意义——**不要在模型已经擅长的地方重复投入，而要在模型的知识盲区集中突破**。这恰恰是人类专家知识的不可替代之处。

---

## 参考资料

1. [SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks — arXiv](https://arxiv.org/abs/2602.12670)
2. [SkillsBench 官方网站](https://www.skillsbench.ai/)
3. [SkillsBench GitHub 仓库](https://github.com/benchflow-ai/skillsbench)
4. [Agent Skills 开放规范](https://agentskills.io/specification)
5. [Agent Skills GitHub 仓库](https://github.com/agentskills/agentskills)
6. [成功率飙升16%，首个SkillsBench告诉你如何用好Skills — CSDN](https://blog.csdn.net/SuaniCommunity/article/details/158460794)
7. [BenchFlow 官方网站](https://benchflow.ai/)
