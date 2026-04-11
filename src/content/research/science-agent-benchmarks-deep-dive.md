---
title: "科研 Agent 评测基准深度解析：FrontierScience · PaperBench · CORE-Bench · ScienceAgentBench · MLE-bench"
description: "五大科研/工程 Agent 评测基准的系统对比与深度解析：从博士级科学推理到论文复现到 Kaggle 竞赛，涵盖构建方法、任务示例、模型表现、评估设计，以及当前不足与未来基准方向的展望。"
date: 2026-04-08T19:43
category: 综合调研
tags: ["Agent", "评测基准", "FrontierScience", "PaperBench", "CORE-Bench", "ScienceAgentBench", "MLE-bench", "科研自动化", "论文复现", "Kaggle"]
draft: false
---

## 总体对比

五个基准从不同维度评测 AI 在科研和工程中的能力，从"能不能解题"到"能不能做完整的研究"形成了一条递进链。

| 基准 | 机构 | 发布时间 | 核心考察能力 | 任务数 | 学科覆盖 | SOTA 水平 | 人类基线 |
|------|------|---------|------------|--------|---------|----------|---------|
| **FrontierScience** | OpenAI | 2025-12 | 博士级科学推理（解题 + 开放研究） | 160（开源黄金集：奥赛 100 + 科研 60） | 物理·化学·生物 | GPT-5.2: 奥赛 77% / 科研 25% | 奥赛金牌选手水平 |
| **PaperBench** | OpenAI | 2025-04 | 端到端论文复现（读论文 → 写代码 → 跑实验） | 20 篇 ICML 2024 论文，含 8316 个子评分项 | 机器学习 | Claude 3.5 Sonnet: 21% | ML 博士生 > 21% |
| **CORE-Bench** | Princeton | 2024-09 | 计算可复现性（给代码 → 跑通 → 对结果） | 270 个任务（90 篇论文 × 3 难度） | CS·社科·医学 | GPT-4o + CORE-Agent: Hard 21% | — |
| **ScienceAgentBench** | OSU NLP | 2024-10 | 数据驱动的科学发现（写分析代码） | 102 个任务（44 篇论文） | 生信·计算化学·GIS·心理学 | o1-preview: 42.2% | 专家辅助: 34.3% |
| **MLE-bench** | OpenAI | 2024-10 | ML 工程（训练模型·特征工程·实验） | 75 个 Kaggle 竞赛 | 机器学习全领域 | Famou-Agent 2.0: 64.4%（2026）; AIDE+o1: 17.1%（原始） | Kaggle 排行榜 |

### 能力维度对比

```
科学推理深度 ←————————————————————————→ 工程执行广度

FrontierScience          ScienceAgentBench       MLE-bench
(纯推理，不写代码)        (写分析代码)             (训练模型+跑实验)
    ↓                         ↓                       ↓
 PaperBench              CORE-Bench
 (读论文→完整复现)        (给代码→跑通→对结果)
```

- **FrontierScience** 测的是"大脑"——纯科学推理能力，不涉及代码或实验操作
- **PaperBench** 测的是"全身协调"——从读懂论文到写出代码到跑通实验的端到端能力
- **CORE-Bench** 测的是"手"——给了代码和论文，能不能把别人的实验跑通
- **ScienceAgentBench** 测的是"科研助手"——能不能根据需求写出数据分析代码
- **MLE-bench** 测的是"ML 工程师"——在真实 Kaggle 竞赛中能拿什么名次

### 任务示例速览

| 基准 | 典型任务 |
|------|---------|
| FrontierScience-Olympiad | "给定量子系统的哈密顿量 H = ...，计算基态能量的精确表达式"（需要 3-5 小时推导） |
| FrontierScience-Research | "在给定的分子动力学框架下，推导并证明蛋白质折叠路径的能量下界"（开放科研子问题） |
| PaperBench | "完整复现 ICML 2024 Spotlight 论文，从零开始写代码并跑通核心实验" |
| CORE-Bench (Hard) | "给定论文代码仓库（无运行说明），自行安装依赖、推断运行命令、复现论文中的表格数据" |
| ScienceAgentBench | "给定蛋白质结构数据集，编写 Python 代码完成特征提取、可视化和统计分析" |
| MLE-bench | "在 Kaggle 图像分类竞赛中，完成数据预处理、模型选择、训练和提交预测" |

---

## 一、FrontierScience：博士级科学推理的天花板测试

**论文**：[FrontierScience: Evaluating AI's ability to perform expert-level scientific tasks](https://arxiv.org/abs/2601.21165)（OpenAI, 2026-01）

### 1.1 设计哲学

FrontierScience 的目标不是测 Agent 能力，而是测**纯科学推理的极限**——模型不能联网、不能用工具，只能靠"想"。这使它成为五个基准中最纯粹的"智力测试"。

它包含两个赛道，分别对应两种不同的科学能力：

| 赛道 | 定位 | 题目数（黄金集） | 出题人 | 答案格式 |
|------|------|----------------|--------|---------|
| **Olympiad** | 国际奥赛级解题 | 100 | 42 名前奥赛金银铜牌选手（共 108 枚奖牌） | 单个数字或代数表达式 |
| **Research** | 博士级开放研究子问题 | 60 | 45 名活跃科学家（博士候选人/教授/博后） | 10 分量表（≥7 分视为正确） |

### 1.2 构建方法

**Olympiad 赛道**：
- 42 名出题人来自 IPhO/IChO/IBO 等国际奥赛，总计持有 45 金 37 银 26 铜
- **原创性强制**：所有题目必须是全新创作，对现有概念做创造性修改或重新语境化
- **对抗性筛选**：如果 OpenAI 内部模型能答对，该题作废。这意味着黄金集中的题目在设计时就旨在**难住当时最强的模型**
- 从 500+ 道候选题中筛选出 100 道开源题，其余保留用于监控数据污染

**Research 赛道**：
- 45 名出题人来自全球知名机构，活跃在各自领域的研究一线
- 每道题代表"一个博士研究员在原创研究中可能遇到的子问题"，设计上解决一道题**至少需要 3-5 小时**
- 10 分量表包含多个独立且客观可评分的子项，不仅评最终答案，还评**中间推理步骤**
- 如果模型在量表上得分高，该题作废或大幅修改

**学科分布**：物理（量子力学、天体物理、纳米技术等）、化学（生物化学、有机化学、催化、光化学等）、生物（分子生物学、基因组学、免疫学、神经科学等）。奥赛题偏物理化学（因为更容易设计可验证的表达式），科研题三科均分。

### 1.3 评分方式

- **Olympiad**：短答案格式，GPT-5 高推理模式担任 Judge，判断答案是否等价（等价表达式、0.1 误差内数值、等价名称/单位）
- **Research**：基于量表的细粒度评分，每个子项独立评分后汇总，≥7/10 视为正确

### 1.4 模型表现

| 模型 | Olympiad | Research |
|------|----------|----------|
| GPT-5.2（超高推理） | **77.1%** | **25.0%** |
| Gemini 3 Pro | 76.0% | — |
| GPT-5.2（中等推理） | 67.5% | 18.0% |

**关键数字**：Olympiad 77% 说明在结构化解题上模型已经非常强（接近奥赛选手水平），但 Research 25% 意味着**开放科研推理上 4 题只对 1 题**——这是当前最大的能力-需求 gap。

有趣的发现：增加推理 token（中等→超高）让 Olympiad +10%，Research +7%，但 o3 在 Research 上高推理反而不如中等推理——**越多的显式推理并不总是有用，特别是在开放性科研问题上**。

---

## 二、PaperBench：端到端论文复现

**论文**：[PaperBench: Evaluating AI's Ability to Replicate AI Research](https://arxiv.org/abs/2504.01848)（OpenAI, 2025-04）

### 2.1 设计哲学

PaperBench 测的是"给你一篇论文，你能不能从零复现它"——这是科研能力中最综合、最接近真实研究工作的任务。它不是做选择题，也不是写代码片段，而是要求 Agent **完整理解论文 → 设计代码架构 → 实现算法 → 调通实验 → 获得正确结果**。

### 2.2 构建方法

**论文选取**：20 篇 ICML 2024 Spotlight 和 Oral 论文，代表 ML 领域最前沿的研究。

**评分标准（Rubric）设计**——这是 PaperBench 最大的创新：
- 将每篇论文的复现任务**层级分解**为细粒度子任务
- 总计 **8,316 个独立可评分项**（平均每篇论文约 416 个评分点）
- 评分标准与 ICML **原论文作者共同开发**，确保准确性和现实性
- 每个子任务有明确的通过/未通过判定标准

**三阶段评估流程**：
1. **Agent Rollout**：Agent 在 Ubuntu 容器中运行，必须创建提交物（复现代码库）
2. **Reproduction**：Agent 提交的代码被执行，验证实验结果
3. **Grading**：自动评判系统（LLM-based Judge）根据 rubric 评分

**自动评判系统**：为了解决人工评估成本过高的问题，团队开发了 LLM 评判器，并创建了独立的"评判员基准"来验证其评分准确性。

### 2.3 模型表现

| Agent | 复现得分 |
|-------|---------|
| Claude 3.5 Sonnet (New) + 开源脚手架 | **21.0%** |
| ML 博士研究生（人类基线子集） | > 21% |

**21% 意味着什么**：在 8316 个子评分项中只完成了约 1/5。Agent 能理解论文大意、写出部分代码，但在长程规划（代码架构设计）、细节调试（实验配置对齐）和结果验证上严重不足。

**核心瓶颈**：PaperBench 暴露的问题不是"模型不会写代码"，而是"模型不会做研究"——它缺乏将一篇论文的高层思想分解为可执行步骤的能力，特别是在**多文件、多模块、需要持续调试**的真实工程场景中。

---

## 三、CORE-Bench：计算可复现性

**论文**：[CORE-Bench: Fostering the Credibility of Published Research Through a Computational Reproducibility Agent Benchmark](https://arxiv.org/abs/2409.11363)（Princeton, 2024-09）

### 3.1 设计哲学

CORE-Bench 关注的是科研中一个非常实际但经常被忽视的问题：**给了你论文的代码和数据，你能不能把结果跑出来？** 这听起来简单，但实际上涉及环境配置、依赖安装、代码调试、结果解读等一系列技能。

与 PaperBench 的区别：PaperBench 要求从零写代码复现，CORE-Bench 提供了原始代码但需要跑通它。

### 3.2 构建方法

**论文来源**：90 篇科学论文，覆盖三个学科：
- **计算机科学**：算法、系统、ML 等
- **社会科学**：经济学、政治学、社会学等
- **医学**：临床研究、流行病学等

**三级难度设计**——这是 CORE-Bench 最精巧的部分：

| 级别 | 给 Agent 什么 | 不给什么 | 要求 |
|------|-------------|---------|------|
| **Easy** | 代码 + 预计算结果 + 运行说明 + 环境配置 | — | 只需阅读 results/ 目录回答问题，**不准运行代码** |
| **Medium** | 代码 + 运行说明 + 环境配置 | 预计算结果 | 按照 REPRODUCING.md 运行代码，生成结果 |
| **Hard** | 仅代码仓库 | 运行说明、环境配置、预计算结果、训练数据 | 自行推断依赖、安装环境、找到运行命令 |

每篇论文生成 3 个任务（Easy/Medium/Hard），总计 270 个任务。

**任务类型**：
- **书面问题**（Written）：数值或文本答案（如"表 3 中第二列的 F1 分数是多少"）
- **视觉问题**（Vision）：关于图表或图像的问题（如"图 2 中的趋势线斜率是正是负"）

**评估指标**：
- accuracy：所有问题均回答正确的任务占比
- written_accuracy：仅书面问题的准确率
- vision_accuracy：仅视觉问题的准确率

### 3.3 模型表现

| Agent 配置 | Hard 准确率 |
|-----------|-----------|
| GPT-4o + CORE-Agent | **21%** |
| GPT-4o + AutoGPT | 低于 21% |
| GPT-4o-mini 各配置 | 更低 |

**21% 在 Hard 上意味着什么**：5 个复现任务里只有 1 个能独立完成。Hard 级别要求 Agent 像一个新入职的研究助理一样——拿到一个陌生代码仓库，没有任何文档，自己搞明白怎么跑。这对当前 Agent 来说仍然很难。

---

## 四、ScienceAgentBench：数据驱动的科学发现

**论文**：[ScienceAgentBench: Toward Rigorous Assessment of Language Agents for Data-Driven Scientific Discovery](https://arxiv.org/abs/2410.05080)（OSU NLP, 2024-10, ICLR 2025）

### 4.1 设计哲学

ScienceAgentBench 的独特价值在于它不测"做研究"的全流程，而是聚焦于科研中**最高频的需求**：给一个数据集和一个分析目标，写出正确的 Python 代码完成分析。这是"AI 科研助手"最核心的能力。

### 4.2 构建方法

**论文来源**：44 篇同行评审论文，覆盖四个学科：
- **生物信息学**（Bioinformatics）：基因组分析、蛋白质结构等
- **计算化学**（Computational Chemistry）：分子模拟、活性预测等
- **地理信息科学**（Geographical Information Science）：空间分析、遥感等
- **心理学与认知神经科学**（Psychology & Cognitive Neuroscience）：行为数据分析等

**任务构建**：
- 9 名研究生标注员从 44 篇论文中提取 102 个任务
- 每个任务的输出是一个**自包含的 Python 程序文件**
- 所有任务都经过多轮人工验证 + 9 名领域专家校验

**防数据泄漏措施**：论文提出了两种策略来缓解数据污染（训练集中可能包含这些论文的信息），这在科研基准中是比较少见的专门考量。

**评估指标**：检查生成的程序在三个维度上的质量：
1. 程序本身的正确性
2. 执行结果的准确性
3. 计算成本

### 4.3 模型表现

| 配置 | 任务解决率 |
|------|---------|
| o1-preview + self-debug | **42.2%** |
| 最佳普通 LLM + Agent | 32.4% |
| 普通 LLM + 专家知识辅助 | 34.3% |

**42.2% 意味着什么**：不到一半的数据分析任务能独立完成。而且 o1-preview 的成本比其他 LLM 高 10 倍以上——性能提升是用大量推理 token 换来的。

**一个重要发现**：专家提供知识辅助（34.3%）只比纯 Agent（32.4%）提高了不到 2 个点，说明**瓶颈不在领域知识，而在代码生成和调试能力**。

---

## 五、MLE-bench：ML 工程实战

**论文**：[MLE-bench: Evaluating Machine Learning Agents on Machine Learning Engineering](https://arxiv.org/abs/2410.07095)（OpenAI, 2024-10, ICLR 2025）

### 5.1 设计哲学

MLE-bench 是五个基准中最"接地气"的——直接用 Kaggle 竞赛来评测。不需要理解高深的科学理论，但需要在有限时间内完成数据预处理、特征工程、模型选择、训练和调参。这是 ML 工程师的日常工作。

### 5.2 构建方法

**竞赛选取**：从 Kaggle 平台精选 75 个 ML 竞赛，构成多样化的挑战集。

**覆盖的 ML 技能**：
- 模型训练（图像分类、NLP、表格数据等）
- 数据集准备（清洗、增强、特征工程）
- 实验运行（超参调优、模型集成、提交格式）

**评分方式**：采用 Kaggle 原生的**奖牌系统**——
- 铜牌：排名前 40%
- 银牌：排名前 5%
- 金牌：排名前 1% 或前 10 名

用 Kaggle 公开排行榜作为人类基线，直接跟历史上真实参赛选手（包括 Grandmaster）比较。

**资源限制**：每个竞赛有时间限制（标准 24 小时），Agent 在容器中运行，有计算资源限额。

**防数据污染**：论文专门分析了预训练数据中可能包含的 Kaggle 竞赛信息对结果的影响。

### 5.3 模型表现

**原始论文结果（2024-10）**：

| Agent | Overall Medal Rate |
|-------|--------------------|
| AIDE + o1-preview | **17.1%** |
| AIDE + gpt-4o | 8.6% |
| AIDE + claude-3.5-sonnet | 7.6% |

**最新排行榜（截至 2026-03）**——进步惊人：

| 排名 | Agent | 底座模型 | Overall |
|------|-------|---------|---------|
| 1 | Famou-Agent 2.0 | Gemini-3-Pro-Preview | **64.4%** |
| 2 | AIBuildAI | Claude-Opus-4.6 | 63.1% |
| 3 | CAIR MARS+ | Gemini-3-Pro-Preview | 62.7% |
| 4 | MLEvolve | Gemini-3-Pro-Preview | 61.3% |

**从 17% 到 64%**——18 个月内 Medal Rate 翻了近 4 倍。这是五个基准中进展最快的，核心原因：
1. ML 工程任务的数据飞轮转得最快（Kaggle 有大量公开 notebook）
2. 评估完全自动化（提交 → 排行榜打分）
3. Agent 框架快速迭代（从简单的 AIDE 到复杂的多阶段 Agent）

---

## 六、横向深度对比

### 6.1 构建方法论对比

| 维度 | FrontierScience | PaperBench | CORE-Bench | ScienceAgentBench | MLE-bench |
|------|----------------|-----------|-----------|-------------------|---------|
| **任务来源** | 专家原创出题 | ICML 论文 | 已发表论文代码 | 已发表论文 | Kaggle 竞赛 |
| **评分开发者** | 奥赛选手/科学家 | ICML 原论文作者 | 自动化 | 领域专家 | Kaggle 排行榜 |
| **评分自动化** | LLM Judge | LLM Judge | 完全自动化 | 执行结果比对 | 完全自动化 |
| **防污染措施** | 对抗性筛选 + 保留集 | 新论文 | 代码-结果绑定 | 两种防泄漏策略 | 污染影响分析 |
| **可扩展性** | 低（需奥赛级专家） | 低（需论文作者配合） | 中（论文+代码自动筛选） | 中（需领域专家验证） | 高（Kaggle 竞赛持续增长） |

### 6.2 难度与 SOTA 水平对比

| 基准 | 最好模型 | 最佳得分 | 人类参照 | 差距评估 |
|------|---------|---------|---------|---------|
| FrontierScience-Olympiad | GPT-5.2 | 77% | 奥赛金牌选手 | 接近（结构化题目） |
| FrontierScience-Research | GPT-5.2 | 25% | 博士研究员 | 巨大 gap |
| PaperBench | Claude 3.5 Sonnet | 21% | ML 博士生 | 巨大 gap |
| CORE-Bench Hard | GPT-4o + CORE-Agent | 21% | — | 巨大 gap |
| ScienceAgentBench | o1-preview | 42% | — | 显著 gap |
| MLE-bench | Famou-Agent 2.0 | 64% | Kaggle Top 40% | 快速缩小 |

**规律明确**：任务越接近"工程执行"（MLE-bench），进展越快；任务越接近"科学推理"（FrontierScience-Research），进展越慢。这跟数据飞轮的可行性直接相关。

### 6.3 评估信度对比

| 维度 | FrontierScience | PaperBench | CORE-Bench | ScienceAgentBench | MLE-bench |
|------|----------------|-----------|-----------|-------------------|---------|
| **评分可重复性** | 依赖 LLM Judge | 依赖 LLM Judge | 完全确定性 | 执行结果确定性 | 完全确定性 |
| **评分粒度** | 二元（对/错）或 10 分量表 | 8316 个子项 | 任务级准确率 | 程序+执行+成本 | 排名百分位 |
| **偏差风险** | Judge 一致性问题 | Judge 验证基准存在 | 低（自动评分） | 低（执行比对） | 极低（Kaggle 评分系统） |

---

## 七、展望

### 7.1 当前不足

**1. 学科覆盖严重偏向 CS/ML**

五个基准中有三个（PaperBench、CORE-Bench、MLE-bench）的核心领域是计算机科学或机器学习。FrontierScience 覆盖了物理化学生物，ScienceAgentBench 有计算化学和生信，但**数学、地球科学、材料科学、天文学**等领域几乎没有覆盖。真正的"AI 科学家"需要在远比 ML 更广泛的学科中工作。

**2. 缺少实验设计能力的评测**

现有基准都是"给定一个问题，去解决它"——但科研中最难的部分往往是**提出正确的问题**和**设计有效的实验**。没有一个基准评测了假设生成（hypothesis generation）或实验设计（experimental design）能力。FrontierScience-Research 最接近，但仍然是给定问题求解。

**3. 缺少多轮迭代和失败恢复的评测**

真实科研充满了失败和迭代——实验跑不通、结果不符合预期、需要调整方向。现有基准大多是"一次性"任务：要么完成要么没完成。没有评测 Agent 在**持续迭代、从失败中学习、调整策略**方面的能力。

**4. 协作能力完全空白**

科研是高度协作的——研究者需要跟同事讨论、接受 review 意见、修改方案。但所有基准都是单 Agent 独立工作，没有评测 Multi-Agent 协作科研的能力。

**5. 时间尺度受限**

所有基准的任务都在小时到天的尺度内（MLE-bench 24 小时，FrontierScience 3-5 小时）。但真实科研项目持续数月甚至数年。长周期科研任务的评测完全空白。

**6. 评分依赖 LLM Judge 的信度问题**

FrontierScience 和 PaperBench 依赖 LLM 作为评判器。PaperBench 做了评判器基准来验证，但 FrontierScience 的 Research 赛道用 10 分量表评分，LLM Judge 在开放性科学推理上的评分一致性仍然是一个隐患。

### 7.2 如果要增加新基准，应该是什么

基于上述不足，以下是按优先级排列的新基准提案：

**P0：实验设计基准（ExperimentDesignBench）**

- **考察能力**：给定一个研究假设和约束条件（预算、时间、设备），设计一套完整的实验方案
- **构建方式**：从已发表论文中抽取假设，让 Agent 独立设计实验方案，然后与论文实际方案对比
- **评分**：方案的可行性（能否执行）、效率（样本量是否合理）、覆盖性（是否考虑了关键对照组）
- **为什么重要**：实验设计是科研能力链中当前完全未被评测的环节，也是 AI 科研助手最有价值的应用之一

**P1：迭代科研基准（IterativeResearchBench）**

- **考察能力**：多轮实验-分析-调整循环
- **构建方式**：设计多阶段任务——第一轮实验给出部分结果，Agent 需要分析结果、诊断问题、调整方案、进行下一轮
- **评分**：最终结果质量 + 迭代策略的合理性
- **为什么重要**：科研的本质是迭代，而非一次性完成

**P2：跨学科 STEM 基准（BroadSTEMBench）**

- **考察能力**：在数学、物理、化学、生物、地球科学、材料科学等广泛 STEM 领域的科研能力
- **构建方式**：仿 FrontierScience 模式但扩展到 10+ 学科，邀请各领域专家出题
- **评分**：学科专项评分 + 跨学科迁移能力评分
- **为什么重要**：当前基准的学科偏向导致模型能力评估不全面

**P3：协作科研基准（CollaborativeResearchBench）**

- **考察能力**：Multi-Agent 协作完成科研任务
- **构建方式**：设计需要多角色分工的任务（Researcher + Reviewer + Experimenter），评估信息传递、冲突消解、方案综合能力
- **评分**：协作效率、最终成果质量、通信质量
- **为什么重要**：科研是协作活动，单 Agent 评测无法反映真实场景

### 7.3 更远的展望

五个基准构成了一个从"解题"到"做研究"的能力评测谱系。但它们都还在评测**科研的"手艺活"**——推导、编程、跑实验。科研中真正最有价值的能力——**洞察力**（发现别人没注意到的问题）、**创造力**（提出全新的方法）、**判断力**（知道什么问题值得研究）——目前完全没有被评测，可能也很难被评测。

一个务实的方向是：不直接评测创造力，而是评测**"在创造性工作中提供有效辅助"的能力**——比如给 Agent 一个模糊的研究方向，看它能不能帮研究者细化为可执行的研究计划、找到相关文献、识别技术瓶颈。这比"AI 独立做科研"更现实，也更有价值。

---

## 参考资料

- Miles Wang et al. [FrontierScience: Evaluating AI's ability to perform expert-level scientific tasks](https://arxiv.org/abs/2601.21165). arXiv:2601.21165, 2026.
- Giulio Starace et al. [PaperBench: Evaluating AI's Ability to Replicate AI Research](https://arxiv.org/abs/2504.01848). arXiv:2504.01848, 2025.
- Zachary S. Siegel et al. [CORE-Bench: Fostering the Credibility of Published Research Through a Computational Reproducibility Agent Benchmark](https://arxiv.org/abs/2409.11363). arXiv:2409.11363, 2024.
- Ziru Chen et al. [ScienceAgentBench: Toward Rigorous Assessment of Language Agents for Data-Driven Scientific Discovery](https://arxiv.org/abs/2410.05080). arXiv:2410.05080, 2024. ICLR 2025.
- Jun Shern Chan et al. [MLE-bench: Evaluating Machine Learning Agents on Machine Learning Engineering](https://arxiv.org/abs/2410.07095). arXiv:2410.07095, 2024. ICLR 2025.
- [MLE-bench Leaderboard](https://www.mlebench.com/). 2026.
- [FrontierScience Leaderboard](https://benchlm.ai/benchmarks/frontierScience). 2026.
- [CORE-Bench Hard Leaderboard](https://hal.cs.princeton.edu/corebench_hard). Princeton HAL.
- [ScienceAgentBench Leaderboard](https://hal.cs.princeton.edu/scienceagentbench). Princeton HAL.
