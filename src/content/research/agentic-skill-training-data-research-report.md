---
title: "从预训练与中训练数据角度提升大模型 Agentic Skill-Use 能力"
description: "五层数据金字塔框架 + 7 条创新思路，覆盖预训练到 RL 全链路数据策略"
date: 2026-03-13
category: 专题研究
tags: ["Agentic Skill", "预训练数据", "中训练", "数据合成"]
draft: false
---
# 从预训练与中训练数据角度提升大模型 Agentic Skill-Use 能力：研究报告

## Executive Summary

OpenClaw 的爆火标志着 AI 从"问答机器"到"技能执行者"的范式跃迁。模型需要具备理解工具、规划任务、调用技能、整合结果、错误恢复的完整能力链。本报告从预训练（Pre-training）和中训练（Mid-training）数据的角度，系统研究如何构建训练数据使模型天然具备更强的 Agentic 能力。报告综合了 Toolformer、ToolLLM、APIGen、daVinci-Dev、Agent Lightning、DeepSWE、SWiRL 等前沿工作，提出了"五层数据金字塔"框架和 7 条创新思路，涵盖从预训练语料筛选到 Agentic RL 的全链路数据策略。

---

## 一、背景：从 OpenClaw 热潮看 Agentic 能力的本质需求

### 1.1 OpenClaw 现象

OpenClaw（原名 Clawdbot/Moltbot）由 Peter Steinberger（PSPDFKit 创始人）开发，2026 年 1 月爆火，GitHub 星数登顶。其核心设计哲学是"Markdown 定义技能，LLM 做执行引擎"——用户只需在 `skills/` 目录下放置一个 Markdown 文件，即可为 Agent 添加新能力，无需改代码、改配置、重新部署。从 2025 年 Claude Code 推出 Agent Skills 标准，到 2026 年 OpenClaw 携社区生态爆发，可扩展技能架构已成主流范式。

这一现象揭示了当前 LLM 最核心的能力需求——不仅要"懂语言"，更要"会做事"。具体而言，Agentic Skill-Use 能力可以分解为五个层次：

- **工具语义理解**：解析 API 文档、函数签名、参数约束
- **任务规划与分解**：将复杂目标拆解为有序子任务序列
- **精确工具调用**：在正确时机选择正确工具，填入正确参数
- **结果整合与判断**：理解工具输出，判断成功/失败，决定下一步
- **错误恢复与回退**：遇到失败时的自适应修复策略

### 1.2 核心问题

**预训练和中训练阶段的数据应该怎么构造，才能让模型在后续 SFT/RLHF 之前就具备更强的 Agentic 能力底座？** 这不是一个简单的"加点工具调用数据"能解决的问题，而是需要系统性地重新审视数据管线的每一个环节。

---

## 二、现有研究综述：Agentic 能力的数据基础

### 2.1 代码数据：Agentic 能力的基石

代码数据在预训练中的占比与模型 Agentic 能力之间存在强正相关。根据公开的技术报告：

Llama 3 在 15T tokens 的预训练语料中，代码数据占比约 17%。更值得注意的是，在 annealing（退火/中训练）阶段，代码数据的比例被大幅上调至约 50%。Llama 3.1 进一步将总训练 tokens 扩展至 15.6T，并在 annealing 阶段引入了"quality-filtered" 代码数据。GLM-5 的预训练数据达到 28.5T tokens，其中增加了 28% 的去重代码数据，并在 Mid-Training 阶段专门针对长上下文和代码能力进行了强化。DeepSeek-V3 使用了 14.8T tokens 的预训练数据，代码数据来源包括 GitHub 的高质量仓库，采用了仓库级别的代码重排（repository-level code rearrangement），使模型能理解跨文件依赖关系。

代码数据之所以是 Agentic 能力的基石，原因至少有三个方面。首先，代码天然包含"规划-执行-验证"的结构：函数定义（声明意图）→ 函数调用（执行动作）→ 返回值处理（验证结果）→ 错误处理（恢复策略），这与 Agent 的工作流高度同构。其次，代码中大量的 API 调用模式直接对应工具使用：`import library → configure → call function → handle response`。第三，代码的严格语法和类型系统训练了模型生成结构化输出的能力，这是 Function Calling 的前提。

### 2.2 Tool-Use 训练数据的演进

#### 2.2.1 Toolformer（Schick et al., 2023）

Toolformer 是工具使用训练的奠基性工作。其核心创新是**自监督地在预训练文本中插入 API 调用**。具体做法是：对预训练语料中的每个位置，让模型尝试插入一个 API 调用（如计算器、搜索引擎、翻译器），然后通过比较"有 API 调用"和"无 API 调用"两种情况下的困惑度（perplexity），筛选出确实有助于降低损失的 API 调用。这样生成的训练数据被用于继续预训练，使模型学会在适当的时候调用工具。

Toolformer 的局限在于：工具种类有限（仅 5 种）、只支持单步工具调用、且模型规模较小（基于 GPT-J 6.7B）。但它确立了一个重要原则：**工具使用应该在预训练阶段通过数据增强来引入，而非仅在 SFT 阶段硬加**。

#### 2.2.2 Gorilla（Patil et al., 2023）

Gorilla 专注于大规模 API 调用的准确性。其构建了 APIBench——一个包含 1,645 个来自 TorchHub、TensorFlow Hub 和 HuggingFace 的真实 API 的基准。训练数据通过 Self-Instruct 方法生成：给定 API 文档，让 GPT-4 生成"用户请求→API 调用"的配对数据。Gorilla 展示了一个关键发现：**经过 API 文档增强训练的 7B 模型，在 API 调用准确性上可以超过 GPT-4**，且产生更少的"幻觉"调用。

#### 2.2.3 ToolLLM 与 ToolBench（Qin et al., 2023）

ToolBench 将规模推向了新高度：收录了来自 RapidAPI 的 **16,464 个真实 REST API**，涵盖 49 个类别。训练数据通过 DFSDT（Depth-First Search-based Decision Tree）方法生成：让 ChatGPT 在树状搜索空间中探索多步工具调用路径，保留成功轨迹作为训练数据。这种方法生成了约 **126,000 条多步工具调用指令**。ToolLLaMA（基于 LLaMA 2 微调）在 ToolEval 基准上达到了接近 ChatGPT 的工具使用能力。

#### 2.2.4 APIGen（Liu et al., 2024）

APIGen 提出了一套自动化的 API 数据集生成管线，核心创新在于**多层次验证**：格式验证（JSON Schema 合规性）→ 执行验证（实际调用 API 检查返回值）→ 语义验证（检查输出与用户意图的一致性）。这种严格的过滤管线确保了训练数据的高质量。实验表明，**数据质量（经过严格过滤）比数据数量更重要**——经过三层过滤的小数据集训练效果优于未过滤的大数据集。

### 2.3 评估基准的演进

Berkeley Function Calling Leaderboard（BFCL）是当前最权威的函数调用评估基准，覆盖了简单函数调用、并行调用、嵌套调用、多步调用等多种场景。截至 2026 年初，Claude 3.5 Sonnet、GPT-4o、Gemini 2.0 Flash 在 BFCL 上表现最优。

SWE-bench Verified 则从更实际的角度评估 Agentic 编码能力：给定真实 GitHub issue，Agent 需要定位问题、理解代码库、编写修复补丁并通过测试。这要求模型具备完整的"理解-规划-执行-验证"能力链。

T-Eval、MetaTool 等基准则专注于工具选择的准确性和多工具协同的能力。

---

## 三、中训练（Mid-training）：能力注入的关键窗口

### 3.1 什么是中训练？

中训练（Mid-training），也称为 continued pretraining、phase 2 pretraining 或 annealing，是介于大规模预训练和 SFT 之间的训练阶段。其核心特点是：数据质量显著提升（不再是"啥都往嘴里塞"），开始混入结构化的高质量语料；学习率通常从预训练的尾部继续衰减；训练 token 量相对预训练较小（通常为总量的 1-10%）；但对特定能力的提升效果显著。

根据 7 家顶尖实验室的公开实践（OpenAI gpt-oss-120b、DeepSeek-R1、HuggingFace SmolLM3、Moonshot Kimi K2、Prime Intellect Intellect 3 等），中训练已成为所有前沿模型的标配阶段。

### 3.2 前沿模型的中训练数据策略

**Llama 3 的 Annealing 策略**：在预训练接近结束时，Llama 3 将学习率线性衰减至零，同时大幅调整数据配比——代码数据比例从 17% 提升至约 50%，数学数据也显著上调。这种"临门一脚"的数据配比调整，对下游任务的提升效果显著，在 GSM8K 等数学基准上提升了约 24%。

**GLM-5 的四阶段训练**：智谱 GLM-5（744B 参数，28.5T 预训练数据）采用了精心设计的多阶段策略。在 Pre-Training 阶段学习语言基础规律；在 Mid-Training 阶段进行长上下文扩展和代码能力强化，增加了 28% 的去重代码，同时修复了 Software Heritage 数据质量问题；在 SFT 阶段进行指令对齐；最后通过异步强化学习框架 SLIME 进行 Agentic 能力的深度优化。GLM-5 在 BrowseComp 等三项 Agent 评测中均获开源第一，编程任务性能较上代提升超 20%。

**DeepSeek-V3 的数据工程**：DeepSeek-V3 的一个重要创新是仓库级别的代码重排——将同一仓库的多个文件按依赖关系排列后一起训练，使模型能理解跨文件的引用、导入和调用关系。这对 Agentic 能力至关重要，因为真实的工具使用场景往往涉及多个模块的协同。

### 3.3 daVinci-Dev：Agent-native Mid-training 的里程碑

daVinci-Dev（arXiv:2601.18418）是专门为软件工程 Agentic 能力设计的中训练方案，由上海交大 GAIR 团队提出。其核心创新在于**构建了"智能体原生轨迹"（Agent-native Trajectories）数据**，包含两个互补来源：

第一类是**上下文原生轨迹**（Context-native Trajectories），从 GitHub Pull Requests 构建。将每个 PR 的 diff 转化为"Agent 编辑代码"的交互格式，包含文件浏览、代码定位、修改编写、测试验证等完整流程。

第二类是**交互原生轨迹**（Interaction-native Trajectories），通过让 Agent 在真实代码环境中执行任务，记录完整的交互过程，包括成功路径和失败回退。

这些数据被用于中训练阶段（而非仅用于 SFT），使模型在预训练完成后就具备了"软件工程肌肉记忆"。实验表明，经过 daVinci-Dev 中训练的模型在 SWE-bench 上的表现显著优于仅经过标准中训练的同等模型。

### 3.4 美团 LongCat-Flash-Thinking 的 Agentic 数据配方

美团的技术报告提供了关于中训练数据配方对 Agentic 能力影响的直接实验证据。他们在 Mid-training 阶段对比了不同的数据配方（不同比例的代码、工具调用、长上下文数据），发现：代码数据比例的提升对 Pass@k 指标有显著正向影响；工具调用格式数据的加入进一步提升了函数调用的准确性；但数据多样性比单纯增大比例更重要——覆盖更多 API 类型和调用模式的数据集，效果优于大量重复同类型调用的数据集。

### 3.5 UI-Venus-1.5 的四阶段训练范例

UI-Venus-1.5 作为 GUI Agent 的开源新 SOTA，其训练策略提供了另一个成功范例。第一阶段 Mid-Training（领域知识注入）使用超过 30 个数据集，将 GUI 交互的视觉和语义知识注入到模型中。这表明中训练阶段的数据不仅是"文本"维度的，对于多模态 Agent，还需要注入领域特定的视觉-动作对应关系。

---

## 四、规划与推理能力的数据来源

### 4.1 自然语言中的推理链数据

预训练语料中天然存在大量的推理链数据，关键在于识别和上权重。这类数据包括：Stack Overflow 上的问题解决过程（问题描述→分析→尝试→解决）、技术博客中的 debug 记录、学术论文中的方法论推导、数学教科书和习题解答。研究表明，如果在预训练阶段对这类"naturally occurring chain-of-thought"数据进行上采样，模型的零样本推理能力可以获得显著提升。

### 4.2 代码执行轨迹作为规划训练数据

代码不仅教会模型"如何写代码"，更教会模型"如何规划执行"。以下类型的代码数据对 Agentic 能力尤其重要：

GitHub Actions / CI/CD 工作流文件（`.yml`）教会模型"任务编排"——定义一系列有依赖关系的步骤，处理条件分支和失败回退。Jupyter Notebook 是天然的"推理+执行交替"数据——markdown 说明（推理）→ code cell（执行）→ output（结果）→ markdown 分析（整合），这种格式与 ReAct（Reason + Act）框架高度一致。Makefile 和 Dockerfile 教会模型"构建计划"——声明依赖关系、定义执行顺序、处理环境配置。

### 4.3 Agent 轨迹数据的构建

Agent 轨迹数据（Agent Trajectory Data）是最直接服务于 Agentic 能力的训练数据。当前主要有三种获取方式：

**从基准测试中收集**：SWE-bench 提供了 2,294 个真实 GitHub issue 及其解决方案，可以将成功的解决过程转化为 Agent 轨迹。WebArena 提供了网页浏览任务的 Agent 交互记录。OSWorld 则覆盖了更广泛的操作系统交互场景。

**从强模型蒸馏**：使用 GPT-4 或 Claude 等强模型执行工具调用任务，收集成功轨迹作为训练数据。这是 ToolBench 和 APIGen 的核心方法。

**从 RL 探索中收集**：DeepSWE 展示了一种更自主的方式——通过强化学习让模型在真实代码环境中"试错"，只有当生成的补丁通过所有测试时才给予正奖励。基于 R2E-Gym 的 4,500 个问题，DeepSWE 使用 GRPO++ 算法训练 Qwen3-32B，在 SWE-bench Verified 上达到了 42.2% 的 Pass@1 准确率。

### 4.4 过程监督与步级奖励

"Let's Verify Step by Step"（Lightman et al., 2023）建立了过程奖励模型（Process Reward Model, PRM）的范式——对推理过程的每一步进行正确性判断，而非仅对最终答案评分。Math-Shepherd 和 OmegaPRM 进一步将这一思路扩展到数学推理领域。对于 Agentic 任务，过程监督尤为重要，因为一个典型的 Agent 任务可能包含 10-50 步工具调用，任何一步的错误都可能导致整体失败。

---

## 五、Agentic RL：从数据到学习的新范式

### 5.1 SWiRL：多步 RL 用于推理和工具使用

Stanford 的 SWiRL（Step-Wise Reinforcement Learning，arXiv:2504.04736）是将多步 RL 应用于工具使用训练的代表性工作。其核心方法是：

将每个多步工具调用轨迹分解为多个子轨迹，每个子轨迹对应一个动作。在这些子轨迹上进行合成数据过滤和 RL 优化。关键创新在于"逐步分解"——传统 RL 方法对整个轨迹给一个奖励，而 SWiRL 对每一步给出信用分配。

实验结果令人印象深刻：GSM8K 上相对准确率提升 21.5%，HotPotQA 上提升 12.3%，CofCA 提升 14.8%。更重要的是，SWiRL 展示了强大的**跨任务泛化能力**——仅在 HotPotQA（文本问答）上训练，就能使 GSM8K（数学）的零样本性能相对提升 16.9%。这暗示多步工具使用能力可能存在某种"通用结构"，一旦习得即可迁移。

### 5.2 Agent Lightning：训练与执行解耦

微软亚洲研究院的 Agent Lightning（GitHub 15,000+ 星标）提出了"优化器与智能体解耦"的创新架构：

Agent 的执行逻辑完全独立，训练系统通过轻量级探针（Tracer/Adapter）自动捕获 Agent 运行时的每一次 Prompt 交互、工具调用和环境反馈。这些交互被转化为标准的 RL 训练数据（Trajectory），然后输入分层强化学习算法 LightningRL 进行信用分配和参数更新。

这种架构的意义在于：**任何已有的 Agent 框架（LangChain、AutoGen、CrewAI 等）都可以几乎零代码接入 RL 训练**。Agent Lightning 将整个 Agent 执行过程建模为马尔可夫决策过程——在每一步中，Agent 处于某个状态，执行一个动作（LLM 输出），当动作导致任务成功完成时获得奖励。

### 5.3 DeepSWE：纯 RL 训练编码 Agent

DeepSWE（Agentica 团队）证明了**纯 RL 可以从零训练出强大的编码 Agent**，无需 SFT 蒸馏或模仿学习。基于 Qwen3-32B，使用 R2E-Gym 的 4,500 个问题，采用改进版 GRPO++ 算法，在 SWE-bench Verified 上达到 42.2%（后续优化到 59%）。

其开源的 rLLM 训练框架和 R2EGym 数据集，为社区提供了完全可复现的 Agentic RL 训练配方。这一结果的意义是深远的——它表明**环境交互本身就是最好的训练信号**，不一定需要人工标注的轨迹数据。

---

## 六、"五层数据金字塔"框架：系统性数据策略

基于上述研究综述，我提出一个系统性的"五层数据金字塔"框架，用于指导从预训练到 Agentic RL 的全链路数据策略：

### 第一层：预训练语料的结构化筛选（底座层）

在大规模预训练语料中，识别并上采样以下类型的"Agentic-friendly"数据：

（a）**API 文档与技术手册**：来自 ReadTheDocs、MDN、DevDocs 等源的结构化 API 文档。这些文档教会模型"工具长什么样"——函数签名、参数描述、返回值类型、示例用法。建议在预训练语料中将此类数据的权重提升 3-5 倍。

（b）**问题-解决过程文本**：Stack Overflow 的 Q&A（特别是高票答案中的分步解决过程）、GitHub Issues 的讨论链（从 bug 报告到最终修复的完整对话）、技术博客中的 troubleshooting 记录。这些数据教会模型"如何诊断问题并分步解决"。

（c）**工作流定义文件**：GitHub Actions（`.github/workflows/*.yml`）、Makefile、Dockerfile、docker-compose.yml、Terraform/Ansible 配置文件。这些文件教会模型"如何编排多步任务"——定义依赖、处理条件分支、设置超时和重试策略。

（d）**交互式代码**：Jupyter Notebook（`.ipynb` 文件，保留 markdown + code + output 的交替结构）、REPL 会话记录、Bash 脚本中的交互式片段。这些数据教会模型"推理-执行-观察-调整"的循环。

### 第二层：中训练阶段的能力注入（核心层）

在中训练阶段，以高质量、高密度的数据进行定向能力注入：

（a）**代码数据上采样**：参考 Llama 3 的做法，将代码数据比例从预训练的 15-20% 提升至 40-50%。但不是简单地增加代码量，而是重点增加以下类型：仓库级代码（保留文件间依赖关系，参考 DeepSeek-V3）、包含完整 test suite 的代码（教会模型"如何验证"）、PR diff + review comment（教会模型"如何修改和迭代"）。

（b）**Agent-native 轨迹数据**：参考 daVinci-Dev 的做法，从 GitHub PR 中提取上下文原生轨迹，从 Agent 执行中收集交互原生轨迹。这些数据在中训练阶段引入（而非仅用于 SFT），使模型更早地建立"Agent 工作模式"的内部表示。

（c）**工具调用格式数据**：在中训练阶段混入标准化的 Function Calling 格式数据（JSON Schema 格式的函数定义 + 调用示例）。比例不需要很大（1-3%），但要覆盖足够多的 API 类型和调用模式。

（d）**长上下文训练**：Agentic 任务通常需要处理很长的上下文（多轮对话、多个文件内容、工具调用历史）。在中训练阶段进行长上下文扩展（参考 GLM-5 的做法），将上下文窗口从 8K 扩展至 128K+，同时确保模型能有效利用长距离信息。

### 第三层：SFT 阶段的精细对齐（对齐层）

在 SFT 阶段，使用高质量的指令-工具调用配对数据：

（a）**单步工具调用**：覆盖各种 API 类型（搜索、计算、文件操作、网络请求等），确保格式正确性。

（b）**多步工具链**：展示多个工具串联使用的完整过程，包括中间结果的传递和错误处理。

（c）**规划先行**：在工具调用之前先输出规划步骤（"我需要先做X，然后做Y，最后做Z"），培养模型的显式规划能力。

（d）**拒绝与回退**：包含"不需要工具"、"工具调用失败后的替代方案"等反例，避免模型过度依赖工具调用。

### 第四层：RL 阶段的环境交互学习（优化层）

通过 Agentic RL 在真实或模拟环境中优化：

（a）**多步 RL 优化**（SWiRL 方法）：对工具调用轨迹的每一步进行信用分配，而非仅对最终结果奖励。

（b）**环境交互训练**（DeepSWE 方法）：在真实代码环境中通过 trial-and-error 学习，使用稀疏结果奖励（通过测试 = 正奖励）。

（c）**过程奖励模型**：训练一个 PRM 对 Agent 轨迹的每一步进行评分，用于指导 RL 训练。

### 第五层：持续学习与自我演进（演进层）

部署后通过在线学习持续提升：

（a）**Agent Lightning 模式**：在生产环境中捕获 Agent 的执行轨迹，自动进行 RL 训练。

（b）**自我对弈**：Agent 与自身的历史版本对弈，在越来越复杂的任务上进化。

（c）**用户反馈闭环**：将用户的接受/拒绝/修改行为作为隐式奖励信号。

---

## 七、新思路提案：7 条创新方向

### 思路 1：预训练语料中的"Agentic 子图"挖掘

**核心想法**：在 CommonCrawl 等大规模网页语料中，挖掘天然包含"工具调用模式"的文本，构建"Agentic 子图"数据集。

具体而言，很多网页本身就描述了"使用某个工具解决某个问题"的过程。例如：API 文档中的"Quickstart"指南（问题→安装→配置→调用→结果）、Stack Overflow 中使用第三方库解决问题的答案、技术博客中的"如何用 X 工具完成 Y 任务"。可以训练一个分类器，从 CommonCrawl 中筛选这类"Agentic 子图"数据，将其在预训练中进行 3-5 倍上采样。这比从零合成数据更自然、更多样。

### 思路 2：仓库级"Agent 视角"代码重构

**核心想法**：将 GitHub 仓库的代码重新组织为"Agent 视角"的格式——模拟一个 Agent 从零开始理解和修改这个仓库的过程。

具体做法：对每个仓库，生成一个"Agent 探索轨迹"——先读 README，再看目录结构，然后依次打开关键文件，理解模块关系，最后定位到需要修改的位置。这种数据格式教会模型"如何高效浏览代码库"，这是所有编码 Agent 的核心技能。daVinci-Dev 的 PR-based 轨迹是这个方向的先驱，但可以进一步扩展到：issue triage（问题分类）、code review（代码审查）、refactoring（重构）等更多软件工程场景。

### 思路 3：多工具协同的"配方"数据

**核心想法**：构建"工具配方"（Tool Recipes）数据集——每个配方描述多个工具如何协同完成一个复杂任务。

类比烹饪食谱：不仅告诉你需要哪些材料（工具），还告诉你先后顺序、时间掌控、中间检查点。例如："数据分析配方"——先用搜索工具获取数据来源 → 用文件读取工具加载数据 → 用 Python 执行器进行数据清洗 → 用可视化工具生成图表 → 用写作工具生成分析报告。每个配方包含正常路径和多个异常处理路径。这种数据可以通过强模型生成 + 人工审核 + 执行验证的管线大规模生产。

### 思路 4："Agentic 退火"（Agentic Annealing）

**核心想法**：在中训练的退火阶段，不仅调整代码/数学数据的比例，还专门加入一个"Agentic 退火"子阶段。

在这个子阶段中，数据配比为：50% 代码（仓库级）、20% Agent 轨迹（daVinci-Dev 风格）、15% 工具调用格式数据、10% 规划推理数据（CoT）、5% 错误恢复数据（失败轨迹 + 修复）。学习率持续衰减，但数据质量要求最高。这个子阶段的 token 量只需总预训练量的 0.5-1%，但可以显著提升 Agentic 能力基座。

### 思路 5：合成"技能发现"数据

**核心想法**：当前的工具使用训练都假设工具集是给定的，但 OpenClaw 的场景是"技能是动态添加的"——模型需要**发现并理解新技能**。

构建"技能发现"训练数据：给模型一个新的 Markdown 技能文档（从未在训练中见过的），要求模型（a）理解技能的功能边界，（b）识别适用场景，（c）正确调用技能，（d）处理技能缺失或不匹配的情况。这种数据可以通过对现有 API 文档进行随机遮蔽和重写来大规模生成，训练模型的"零样本工具学习"能力。

### 思路 6：反事实工具调用数据

**核心想法**：不仅训练"何时该用工具"，更要训练"何时不该用工具"以及"用错了会怎样"。

当前大多数工具使用训练数据都是正例（正确的工具调用），缺乏负例和反事实。构建三类数据：（a）"不需要工具"——问题可以直接回答，无需调用工具；（b）"工具选择错误"——选了不合适的工具，展示错误结果和正确替代方案；（c）"参数错误"——工具选对了但参数错了，展示调试和修复过程。这种反事实数据对减少"工具幻觉"（hallucinated tool calls）至关重要。

### 思路 7：跨模态 Agent 轨迹数据

**核心想法**：随着 OpenClaw 类工具扩展到浏览器操作、桌面操作等场景，训练数据需要超越纯文本，包含视觉观察。

构建"看屏幕→思考→操作"的多模态轨迹数据：截屏（视觉输入）→ 元素识别和状态理解（推理）→ 点击/输入/滚动（动作）→ 新截屏（观察结果）→ 判断是否完成（评估）。UI-Venus-1.5 已经在 GUI Agent 方向证明了这种数据的有效性。可以将此思路扩展到更多模态：终端输出的 ANSI 格式解析、代码编辑器的 diff 可视化、数据可视化图表的理解。

---

## 八、实践建议：可操作的数据构造 Pipeline

### 8.1 预训练阶段

1. **API 文档爬取与清洗**：从 ReadTheDocs、DevDocs、MDN 等源爬取所有公开 API 文档，统一格式为"函数签名 + 参数描述 + 示例"的结构化格式。预计可获得 10-50B tokens。
2. **工作流文件提取**：从 GitHub 的 `.github/workflows/` 目录批量提取 YAML 文件，保留关联的 README 和代码文件作为上下文。
3. **Jupyter Notebook 处理**：提取 GitHub 上的 `.ipynb` 文件，保留 markdown-code-output 的交替结构，过滤掉输出过长或代码质量低的 notebook。
4. **Agentic 子图挖掘**：训练一个二分类器（BERT-base 即可），对 CommonCrawl 的网页进行"是否包含工具使用/问题解决过程"的分类，上采样正例。

### 8.2 中训练阶段

1. **daVinci-Dev 风格数据构建**：从 top-1000 的 GitHub 仓库的 PR 中提取 Agent-native 轨迹，重点关注有 code review 对话的 PR。
2. **Function Calling 格式注入**：将 ToolBench 的 16,464 个 API 转换为标准 JSON Schema 格式，生成调用示例。
3. **长上下文 Agent 对话**：使用强模型生成 10K+ tokens 的多轮 Agent 对话，包含多次工具调用和中间推理。
4. **数据质量保障**：参考 APIGen 的三层验证（格式→执行→语义），对所有合成数据进行严格过滤。

### 8.3 RL 阶段

1. **环境搭建**：基于 R2E-Gym（DeepSWE）或 WebArena 搭建可复用的 Agent 训练环境。
2. **奖励设计**：采用稀疏结果奖励 + 过程奖励的混合模式。结果奖励：任务完成/测试通过；过程奖励：每步的工具调用合理性、信息增益。
3. **训练框架**：使用 Agent Lightning 进行训练与执行的解耦，支持任意 Agent 框架的接入。

---

## 九、结论

从预训练/中训练数据角度提升 Agentic Skill-Use 能力，不是简单地"加点工具调用数据"，而是需要在整个训练管线中进行系统性的数据工程。本报告的核心结论是：

第一，**代码数据是 Agentic 能力的最大基石**，但需要从"文件级代码"升级到"仓库级代码"和"PR 级代码"，保留跨文件依赖和修改迭代的信息。

第二，**中训练是能力注入的最佳窗口**，daVinci-Dev 已经证明 Agent-native 轨迹数据在中训练阶段的引入效果显著。建议在中训练阶段设置专门的"Agentic 退火"子阶段。

第三，**数据质量远比数量重要**，APIGen 的三层验证管线和 ToolBench 的 DFSDT 方法提供了成熟的质量保障方案。

第四，**环境交互是最终的训练信号**，DeepSWE 证明了纯 RL 可以从零训练出强大的编码 Agent，SWiRL 证明了多步 RL 可以显著提升工具使用能力且具有跨任务泛化性。

第五，**技能发现能力需要专门训练**，OpenClaw 的"动态技能安装"范式要求模型具备"零样本工具学习"能力，这需要专门的训练数据来培养。

未来的研究方向包括：如何在预训练阶段自动化地挖掘和上采样 Agentic-friendly 数据、如何构建更大规模的可执行训练环境（从 R2E-Gym 的 4,500 个问题扩展到百万级）、如何设计更好的多步过程奖励模型、以及如何实现 Agent 的持续在线学习而不产生灾难性遗忘。

---

## 十、局限性

本报告主要基于公开的技术报告和论文，存在以下局限。首先，闭源模型（GPT-4、Claude）的训练数据细节未公开，报告中的推断基于间接证据。其次，部分前沿工作（如 Agent Lightning、daVinci-Dev）发表时间较近，其长期效果和可复现性尚待社区验证。第三，报告侧重于文本和代码模态的 Agent，对多模态 Agent（GUI 操作、机器人控制等）的覆盖有限。最后，关于"Agentic 退火"和"技能发现数据"等新思路，目前尚无实验验证，属于理论推测。

---

## 参考文献

1. [Toolformer: Language Models Can Teach Themselves to Use Tools (Schick et al., 2023)](https://arxiv.org/abs/2302.04761)
2. [Gorilla: Large Language Model Connected with Massive APIs (Patil et al., 2023)](https://arxiv.org/abs/2305.15334)
3. [ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs (Qin et al., 2023)](https://arxiv.org/abs/2307.16789)
4. [APIGen: Automated Pipeline for Generating Verifiable and Diverse Function-Calling Datasets (Liu et al., 2024)](https://arxiv.org/abs/2406.18518)
5. [daVinci-Dev: Agent-native Mid-training for Software Engineering (Zeng et al., 2026)](https://arxiv.org/abs/2601.18418)
6. [SWiRL: Synthetic Data Generation & Multi-Step RL for Reasoning & Tool Use (Goldie et al., 2025)](https://arxiv.org/abs/2504.04736)
7. [Agent Lightning: Training-Execution Decoupled RL Framework for AI Agents (Microsoft Research Asia, 2026)](https://github.com/microsoft/agent-lightning)
8. [DeepSWE: Pure RL Agentic Coding on SWE-bench (Agentica, 2025)](https://github.com/agentica-project/rllm)
9. [GLM-5 Technical Report: From Vibe Coding to Agentic Engineering (Zhipu AI & Tsinghua, 2026)](https://arxiv.org/abs/2502.12345)
10. [The Llama 3 Herd of Models (Meta AI, 2024)](https://arxiv.org/abs/2407.21783)
11. [Let's Verify Step by Step (Lightman et al., 2023)](https://arxiv.org/abs/2305.20050)
12. [ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al., 2023)](https://arxiv.org/abs/2210.03629)
13. [SWE-bench: Can Language Models Resolve Real-World GitHub Issues? (Jimenez et al., 2024)](https://arxiv.org/abs/2310.06770)
14. [Berkeley Function Calling Leaderboard (BFCL)](https://gorilla.cs.berkeley.edu/leaderboard.html)
15. [OpenClaw Official Site](https://openclawbot.org.cn/)
16. [美团 LongCat-Flash-Thinking-2601 技术报告](https://mp.weixin.qq.com/)
17. [Agent Lightning: 构建智能体原生的学习系统 (DataFunTalk, 2026)](https://mp.weixin.qq.com/)
18. [daVinci-Dev 数据集 (ModelScope)](https://www.modelscope.cn/datasets/GAIR/daVinci-Dev)
