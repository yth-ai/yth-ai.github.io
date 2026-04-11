---
title: "超越 PR Diff：面向 Agentic Coding 能力的训练任务设计方法论"
description: "系统分析为什么直接用 PR 数据训练只是高级版代码补全，以及如何设计真正提升深度代码理解、环境推理与验证能力的训练任务"
date: 2026-03-22
category: 专题研究
tags: ["Agentic Coding", "Task Design", "训练数据", "SWE Agent", "强化学习"]
draft: false
---
# 超越 PR Diff：面向 Agentic Coding 能力的训练任务设计方法论

> **核心论点**: 直接利用 PR/Commit Diff 数据训练 Agentic Coding 模型，本质上是在做"有仓库上下文的代码补全"——模型学到的是"看到问题描述 → 生成 Patch"的条件概率映射，而非真正的代码理解、环境推理和验证能力。要训练出能在真实复杂环境中自主工作的 Coding Agent，我们需要重新设计训练任务本身。

---

## 目录

- [一、动机：为什么 PR Diff 不够？](#一动机为什么-pr-diff-不够)
- [二、好的 Agentic Task 应该长什么样？](#二好的-agentic-task-应该长什么样)
- [三、业界现有做法全景分析](#三业界现有做法全景分析)
- [四、现有方法的系统性缺陷](#四现有方法的系统性缺陷)
- [五、我们的 Task 设计框架：DURE](#五我们的-task-设计框架dure)
- [六、具体 Task 类型设计](#六具体-task-类型设计)
- [七、Task 质量评估与验证机制](#七task-质量评估与验证机制)
- [八、实施路线图](#八实施路线图)
- [九、总结与展望](#九总结与展望)

---

## 一、动机：为什么 PR Diff 不够？

### 1.1 PR Diff 训练的本质

当前主流的 Agentic Coding 训练数据管线（以 SWE-bench 为代表）遵循一个基本模式：

```
Input:  Issue Description + Repository Snapshot
Output: Code Patch (Diff)
Reward: Test Suite Pass/Fail
```

这个范式的核心假设是：**给定问题描述和代码库，模型直接生成修复补丁，通过测试即为成功**。表面上看，这已经是一个 Agentic 任务了——需要理解代码库、定位问题、生成修复。但深入分析其训练动态，会发现一个关键问题：

**模型学到的并不是"理解代码→推理问题→设计方案→验证修复"的完整能力链，而是"Issue 文本 → Patch 文本"的条件生成概率。**

这与代码补全的本质区别在哪里？仅仅是输入上下文更长了（从单文件变成了整个仓库），输出格式更复杂了（从续写变成了 diff patch）。但认知深度并没有质的飞跃。

### 1.2 证据：高分模型的"能力幻觉"

多个最新基准测试揭示了这一问题：

| 基准 | 任务类型 | SOTA 表现 | 说明 |
|------|---------|-----------|------|
| SWE-bench Verified | 单 PR Bug 修复 | **74.4%** (Claude 4.5 Opus) | 主流模型已接近人类水平 |
| SWE-bench Pro (Scale AI, 2025.09) | 长视野多文件任务 | **60.8%** (最佳) | 性能显著下降 |
| FeatureBench (ICLR 2026) | 跨多 PR 的 Feature 开发 | **11.0%** (Claude 4.5 Opus) | 断崖式下跌 |
| SWE-Compass (2025.11) | 多语言多类型统一评测 | 任务类型间差异巨大 | 暴露能力不均衡 |

**FeatureBench 的数据最有说服力**：同一个模型在 SWE-bench 上 74.4%，在 FeatureBench 上只有 11.0%。这 63 个百分点的落差不是模型的"失误"，而是任务本质的不同——SWE-bench 的单 PR Bug 修复可以通过"模式匹配"搞定（Issue 描述 → 高概率 Patch 模板），但跨多 PR 的 Feature 开发需要深度理解代码架构、依赖关系和设计意图。

### 1.3 根本原因分析

PR Diff 训练范式存在三个结构性缺陷：

**缺陷一：输入-输出短路（Input-Output Shortcut）**

在 PR Diff 数据中，Issue 描述和 Patch 之间存在大量的表面统计关联。例如：
- "TypeError: NoneType has no attribute 'x'" → 往往只需加一个 `if obj is not None` 判断
- "Add support for xxx format" → 往往在已有的 format handler 旁边添加类似代码
- Stack trace 中的文件名和行号直接指向修改位置

模型可以学到这些 shortcut 而不需要真正"理解"代码。这类似于 NLU 领域中 HANS benchmark 揭示的假设偏差——模型利用表面线索而非深层语义解题。

**缺陷二：环境交互的缺失（Missing Environment Grounding）**

真正的软件开发是一个**交互式过程**：开发者会反复阅读代码、运行测试、查看日志、调试、重构。但 PR Diff 数据将这个过程压缩成了一个**单步映射**。模型从未学习过：
- 如何系统地探索一个陌生代码库
- 如何通过运行局部测试来验证假设
- 如何根据错误输出调整策略
- 如何在多个可能的修复方案中做出判断

**缺陷三：推理深度不足（Shallow Reasoning）**

多数 Bug 修复只需要局部推理——看到报错，找到对应代码，修改之。但真实的软件工程任务经常需要：
- 跨文件、跨模块的因果链追踪
- 对系统状态转换的形式化推理
- 对多个竞争方案的 trade-off 分析
- 对修改影响范围的全局评估

PR Diff 数据中，这些推理过程是不可见的——我们只有最终结果（Patch），没有中间思考过程。

### 1.4 类比：从"翻译"到"写作"

如果把 Agentic Coding 类比为自然语言任务，PR Diff 训练像是在训练一个翻译模型（Issue → Patch 的映射），而我们真正需要的是一个**写作者**——能独立构思、规划结构、反复打磨的创作能力。翻译只需要忠实转换，写作需要深度理解和创造性推理。

---

## 二、好的 Agentic Task 应该长什么样？

### 2.1 四维评价框架

我们提出一个评价 Agentic Training Task 质量的四维框架——**DURE**：

| 维度 | 英文 | 含义 | PR Diff 评分 | 理想评分 |
|------|------|------|:---:|:---:|
| **D**epth of Understanding | 理解深度 | 需要多深的代码理解才能完成任务？ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **U**ncertainty & Exploration | 不确定性与探索 | 解决路径是否需要主动探索和判断？ | ⭐ | ⭐⭐⭐⭐ |
| **R**easoning Chain Length | 推理链长度 | 从问题到解决需要多少步推理？ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **E**asy Verification | 验证便捷性 | 最终结果是否容易自动化验证？ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

关键洞察：**PR Diff 任务在 D、U、R 三个维度上偏低，仅在 E（验证）维度上很好。理想的 Task 应该在四个维度上都要高分。**

这意味着我们要做的不是简单地"加大任务难度"，而是**在保持验证便捷性的同时，系统性地拉高理解、探索和推理维度**。

### 2.2 能力层次模型

Agentic Coding 能力可以分解为五个渐进层次：

```
Level 5: 架构设计与重构
         ↑ 理解系统全局，做结构性变更
Level 4: 跨模块因果推理  
         ↑ 追踪调用链，理解副作用
Level 3: 环境交互与验证
         ↑ 运行代码、读日志、调试
Level 2: 代码定位与导航
         ↑ 在大型代码库中找到相关代码
Level 1: 代码阅读与局部理解
         ↑ 理解单文件内的逻辑
```

**PR Diff 训练主要覆盖 Level 1-2（理解局部代码 + 定位修改位置）**，偶尔触及 Level 3（如果 Issue 中包含调试信息）。但 Level 4-5 几乎完全缺失。

好的 Task 设计应该有意识地覆盖每个层次，并且用不同类型的任务针对性训练。

### 2.3 验证便捷性是硬约束

这里需要强调一个**不可妥协的约束**：无论任务设计多么复杂、覆盖多少能力层次，**最终结果必须可以通过自动化方式验证**。这对于 RL 训练尤其关键——没有可靠的奖励信号，一切都是空谈。

可验证性有几种形态：
- **测试用例通过**：最直接，但编写/收集测试用例本身有成本
- **代码行为等价**：新代码和参考实现的行为一致（差分测试）
- **静态检查通过**：类型检查、linting、依赖分析等
- **结构化输出匹配**：生成的代码结构/签名符合预定义 Schema
- **LLM-as-Judge**：用另一个模型评估（最灵活但最不可靠）

最好的做法是**多种验证信号组合**，形成多层过滤的 reward signal。

---

## 三、业界现有做法全景分析

### 3.1 全景图

让我们先鸟瞰整个领域，按照**任务获取方式**分为三大流派：

```
                    Agentic Coding Task 获取方式
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ① 真实挖掘         ② 合成生成        ③ 混合方法
     (从 GitHub 挖)    (人工/LLM 构造)   (真实+合成融合)
              │               │               │
     ┌────┬───┘    ┌────┬────┘       ┌───────┘
     │    │        │    │            │
  SWE-bench  SWE-  SWE-  Hybrid-  daVinci-Dev
  SWE-rebench smith  Gym   Gym    R2E-Gym
  FeatureBench
  SWE-bench Pro
```

### 3.2 真实挖掘流派

#### SWE-bench 系列（Princeton, 2024）

**方法**：从 12 个流行 Python 仓库中，根据 PR 和关联的 Issue 提取任务。每个任务包含：Issue 描述 + 仓库快照（PR 合并前） + 测试用例（PR 引入的新测试）。

**数据规模**：SWE-bench 原始 2,294 个，Verified 子集 500 个。

**优点**：
- 来自真实开发场景，任务质量高
- 自带测试用例作为验证信号
- 已成为业界标准基准

**缺陷**：
- 仅覆盖 Bug 修复（单 PR 范围）
- 仅限 Python 语言
- 仅 12 个仓库，多样性不足
- 数据量有限，不支持大规模 RL 训练
- 存在**数据污染风险**——模型可能在预训练中见过这些 PR

#### SWE-rebench（JetBrains + Nebius, NeurIPS 2025）

**方法**：构建**全自动化的持续管线**，从多样化的 GitHub 仓库中提取交互式 SWE 任务。核心创新在于"持续"——管线可以源源不断地产生新任务，确保去污染。

**数据规模**：21,000+ 个交互式 Python 任务。

**优点**：
- 规模大，适合 RL 训练
- 持续更新，天然抗污染
- 全自动化，可扩展

**缺陷**：
- 仍然是 PR-based 任务结构
- 任务类型单一（依然是 Bug 修复为主）
- 缺乏对理解深度和推理链长度的刻意设计

#### FeatureBench（中科院 + 华为, ICLR 2026）

**方法**：突破性地从**单 PR Bug 修复**扩展到**跨多 PR 的 Feature 开发**。通过沿依赖图追踪单元测试，识别跨越多个提交和 PR 的功能级编码任务。

**数据规模**：200 个评估任务，24 个仓库，3,825 个可执行环境。

**优点**：
- 任务复杂度大幅提升（SOTA 模型仅 11% 解决率）
- 真正触及 Level 4-5 能力
- Test-Driven 方法论，验证可靠

**缺陷**：
- 主要作为 Benchmark 而非训练集
- 200 个任务规模太小，无法直接用于 RL 训练
- 任务构建管线依赖高质量仓库的测试覆盖率

#### SWE-bench Pro（Scale AI, 2025.09）

**方法**：人工策展的长视野、多文件任务。包含 Feature Request 和复杂 Bug 修复，需要专业软件工程师数小时到数天完成。抗污染设计。

**优点**：
- 任务真正复杂，区分度高
- 人工验证质量好
- 涵盖多种任务类型

**缺陷**：
- 人工策展不可扩展
- 规模有限

### 3.3 合成生成流派

#### SWE-smith（Stanford + Princeton, NeurIPS 2025 Spotlight）

**方法**：给定**任意 GitHub Python 仓库**，自动生成训练任务。核心思路是**Bug 注入**——在正确代码中注入各类 Bug（语法错误、逻辑错误、API 误用等），然后训练模型修复。

**数据规模**：128 个仓库，50,000+ 个任务实例。训练出的 SWE-agent-LM-32B 在 SWE-bench Verified 上达 40% pass@1。

**优点**：
- 高度可扩展（10 分钟为任意仓库生成 100 个任务）
- 低成本，全自动
- 不依赖 PR 历史

**关键缺陷**：
- **Bug 注入本质上还是"修复"任务**——模型学到的依然是"发现异常→修复"的模式
- 注入的 Bug 分布与真实 Bug 存在差异
- 缺乏对代码理解和推理能力的刻意训练
- 任务过程中的"探索"部分被大幅简化

#### SWE-Gym（UIUC + All Hands AI, 2025）

**方法**：从真实 GitHub PR 中构建可执行的训练环境。每个任务包含完整的代码库 + 可运行的测试套件，允许 Agent 在环境中交互式探索。

**数据规模**：2,438 个 Python 任务实例。

**优点**：
- 可执行环境，支持 RL 训练
- 真实任务，质量高

**缺陷**：
- 规模有限（2,438 个）
- 构建可执行环境的成本高（需要解决依赖安装等工程问题）
- 依然是 PR-based 任务

#### Hybrid-Gym（CMU + All Hands AI, 2026）

**方法**：这是最具启发性的工作之一。核心洞察是：**与其直接训练模型解决 Issue，不如分解出基础技能分别训练**。Hybrid-Gym 设计了四种合成任务：

1. **Function Localization（函数定位）**：给定函数描述，在仓库中定位该函数并写文档字符串。训练**代码库探索**能力。
2. **Issue Localization（Issue 定位）**：给定 Issue 描述，定位需要修改的文件、类、函数和代码行。训练**问题定位**能力。
3. **Dependency Search（依赖搜索）**：分析函数并找到仓库内该函数直接调用的所有模块。训练**依赖分析**能力。
4. **Function Generation（函数生成）**：给定签名和文档字符串，通过理解上下文实现函数体。训练**代码实现**能力。

**数据规模**：4,470 个轨迹，覆盖 762 个仓库。

**关键结果**：Qwen2.5Coder-32B 基础模型经过 Hybrid-Gym 训练后，SWE-bench Verified 解决率从 7.0% 飙升至 **32.4%**（+25.4%），**超过了用 491 个真实 SWE-Gym 实例训练的效果**。

**革命性启示**：
- 单独的 Function Localization 任务效果就超过了完整的 SWE-Gym
- 不需要教模型"怎么修 Bug"，只需教它"怎么看代码"、"怎么找代码"、"怎么改代码"
- 合成任务不需要可执行仓库环境（仅需 2 个 Docker 镜像 vs 其他方法的数百个）
- **基础技能训练 + 下游任务微调 > 直接在下游任务上训练**

### 3.4 混合方法流派

#### daVinci-Dev（2026.01）

**方法**：提出 "Agent-native Mid-training"，使用两种互补的轨迹类型进行中训练：
- **Contextually-native trajectories**：保留 Agent 处理任务的完整信息流，提供覆盖面和多样性
- **Environmentally-native trajectories**：从可执行代码仓库中收集，观察结果来自实际工具调用和测试执行

**关键结果**：32B 模型达到 56.1%、72B 达到 58.5%（SWE-bench Verified），使用不到 Kimi-Dev 一半的 token（73.1B）。

**启示**：将上下文理解和环境交互作为两个独立维度的数据来构建，比单纯用 PR Diff 有效得多。

#### R2E-Gym（2025, COLM 2025）

**方法**：构建最大的程序化策展训练环境——8,100+ 个任务，跨 13 个仓库，带有可执行的 Gym 环境和单元测试。支持 Hybrid Verification（结合执行验证和 LLM 评判）。

**启示**：规模化的可执行环境是 RL 训练的基石。

### 3.5 综合对比

| 方法 | 任务规模 | 任务类型 | DURE-D | DURE-U | DURE-R | DURE-E | 核心限制 |
|------|---------|---------|:---:|:---:|:---:|:---:|---------|
| SWE-bench | 2,294 | Bug 修复 | ⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | 规模小，类型单一 |
| SWE-rebench | 21,000+ | Bug 修复 | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | 仍是 PR-based |
| SWE-smith | 50,000+ | Bug 注入修复 | ⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐ | Bug 分布不真实 |
| SWE-Gym | 2,438 | Bug 修复 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | 规模小 |
| Hybrid-Gym | 4,470 | 4 种技能任务 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 未覆盖高阶推理 |
| FeatureBench | 200 | Feature 开发 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 仅评测，不可训练 |
| daVinci-Dev | 73B tokens | Agent 轨迹 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 闭源，难复现 |
| R2E-Gym | 8,100+ | 可执行环境 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 仅限 13 仓库 |

---

## 四、现有方法的系统性缺陷

综合分析后，我们识别出现有方法存在四个系统性缺陷：

### 4.1 缺陷一：Task 类型同质化

**现象**：超过 90% 的训练 Task 本质上都是"Bug 修复"或其变体。

**危害**：Bug 修复只是软件工程的一个子集。真实开发中，Feature 开发、代码重构、性能优化、安全审计、测试编写等任务各有独特的认知需求。仅训练 Bug 修复导致模型能力严重偏科。

**FeatureBench 的数据是最好的证明**：在 Bug 修复上 74.4% 的模型，面对 Feature 开发只有 11%。

### 4.2 缺陷二：过程信号缺失

**现象**：几乎所有方法都使用**结果级奖励**（Outcome-level Reward）——任务最终成功/失败。

**危害**：当任务变复杂时（需要 20+ 步操作），结果级奖励变得极度稀疏，credit assignment 几乎不可能。模型无法学到"哪些中间决策是好的"。

**对比**：数学推理领域已经广泛使用 Process Reward Model（PRM），对每一步推理给出细粒度的奖励信号。但 Coding Agent 领域的 Process Reward 几乎空白——因为"好的中间步骤"很难自动定义。

### 4.3 缺陷三：环境理解的"作弊通道"

**现象**：在大多数 SWE-bench 式任务中，Issue 描述（特别是 Stack Trace）直接泄露了修改位置。模型可以"跳过"代码理解，直接根据 Stack Trace 定位文件和行号。

**实证**：Agentless（2025）证明了一个令人沮丧的事实——一个完全不用 Agent 机制的三阶段流水线（定位→编辑→验证），纯靠 LLM 的模式匹配能力，就能达到相当不错的 SWE-bench 成绩。这说明很多"Agent 能力"在 SWE-bench 任务上并不需要。

### 4.4 缺陷四：规模 vs 多样性的失衡

**现象**：SWE-smith 等方法实现了 50,000+ 的规模，但任务多样性不足（全是 Bug 注入变体）。Hybrid-Gym 实现了任务多样性，但规模有限（4,470 个）。

**需求**：大规模 RL 训练需要**既大又多样**的数据——数万个任务，覆盖多种类型，来自数百个不同仓库。

---

## 五、我们的 Task 设计框架：DURE

### 5.1 核心理念

基于以上分析，我们提出一个面向 Agentic Coding 能力的训练 Task 设计框架——**DURE（Deep Understanding, Reasoning, Easy-to-verify）**。核心理念是：

> **训练任务应该迫使模型展示深度代码理解和多步推理能力，同时保持结果的可自动验证性。**

### 5.2 设计原则

**原则一：技能分解优先（Skill Decomposition First）**

受 Hybrid-Gym 的启发，我们不直接构建端到端的复杂任务，而是先将 Agentic Coding 所需的技能分解为独立的可训练单元，再通过组合训练来构建完整能力。

**原则二：理解深度可控（Controllable Understanding Depth）**

每种 Task 类型应该有明确的"理解深度"要求——从单文件理解到跨模块因果链追踪，形成渐进式课程。

**原则三：验证与真实性双保证（Dual Guarantee of Verification and Authenticity）**

Task 必须满足两个硬约束：
- 可以用自动化方法验证（测试、类型检查、结构匹配等）
- 来源于或模拟真实开发场景（不是人工编造的玩具例子）

**原则四：探索不可绕过（Exploration Cannot Be Bypassed）**

Task 设计应该消除"作弊通道"——不能让模型仅凭 Issue 描述中的线索就跳过代码探索。

### 5.3 Task 设计三层架构

```
┌─────────────────────────────────────────────┐
│         Layer 3: 组合任务（Composite Tasks）    │
│     跨模块重构、Feature 开发、性能优化          │
│     ← 需要组合 L1+L2 技能                      │
├─────────────────────────────────────────────┤
│         Layer 2: 推理任务（Reasoning Tasks）    │
│     因果链追踪、影响分析、方案对比              │
│     ← 需要深度推理                              │
├─────────────────────────────────────────────┤
│         Layer 1: 基础技能（Foundational Skills） │
│     代码导航、依赖分析、局部理解                │
│     ← 可大规模合成                              │
└─────────────────────────────────────────────┘
```

---

## 六、具体 Task 类型设计

### 6.1 Layer 1：基础技能任务（大规模合成，10 万+量级）

#### Task 1.1：代码考古（Code Archaeology）

**任务描述**：给定一个仓库中的函数/类，回答以下问题：
- 这个函数被谁调用？列出所有直接调用者
- 这个类的所有子类有哪些？
- 这个函数依赖的外部模块有哪些？
- 从函数 A 到函数 B 的最短调用路径是什么？

**为什么好**：
- **D（理解深度）= 高**：需要理解代码结构和依赖关系
- **U（探索）= 中**：需要搜索代码库，没有直接答案
- **R（推理）= 中**：需要追踪调用链
- **E（验证）= 高**：可以通过 AST 分析和代码索引工具精确验证

**合成方法**：
```python
# 伪代码
for repo in github_repos:
    ast = parse_codebase(repo)
    call_graph = build_call_graph(ast)
    for func in random_sample(ast.functions):
        # 生成"谁调用了 func"问题
        callers = call_graph.get_callers(func)
        yield Task(
            repo=repo,
            question=f"List all direct callers of {func.name}",
            answer=callers,  # 精确答案用于验证
            context=repo_snapshot  # 仓库快照作为上下文
        )
```

**规模估算**：每个仓库可生成 100-500 个任务，覆盖 1,000 个仓库 → 10 万+。

#### Task 1.2：类型推断补全（Type Inference Completion）

**任务描述**：给定一段缺少类型注解的 Python/TypeScript 代码，推断并补全所有函数的参数类型和返回类型。

**为什么好**：
- **D = 高**：需要理解函数的语义、调用上下文和返回值使用方式
- **U = 低**：答案相对确定
- **R = 高**：需要追踪数据流
- **E = 极高**：可以用 mypy/pyright 做类型检查验证

**合成方法**：从已有类型注解的仓库中，删除注解生成任务，原始注解作为参考答案。

#### Task 1.3：死代码识别（Dead Code Detection）

**任务描述**：给定一个仓库，找出所有不可达的代码（未被调用的函数、未使用的导入、永远不会进入的分支等）。

**为什么好**：
- **D = 高**：需要理解代码的全局可达性
- **U = 中**：需要搜索整个代码库
- **R = 高**：需要排除所有可能的调用路径
- **E = 高**：可以通过代码覆盖率工具和静态分析验证

#### Task 1.4：API 迁移（API Migration）

**任务描述**：将代码中使用的旧版 API 迁移到新版 API。例如：`requests.get(url)` → `httpx.get(url)`，或 `tf.Session()` → TF2 的 eager execution 风格。

**为什么好**：
- **D = 高**：需要理解新旧 API 的语义差异
- **U = 中**：需要找到所有使用旧 API 的地方
- **R = 中**：需要理解迁移规则
- **E = 极高**：迁移后代码必须通过原有测试套件

**合成方法**：收集流行库的版本升级 Breaking Changes，在使用旧版的仓库上生成迁移任务。

### 6.2 Layer 2：推理任务（中等规模合成，1-5 万量级）

#### Task 2.1：因果链追踪（Causal Chain Tracing）

**任务描述**：给定一个已知的 Bug 表现（如某个测试失败），追踪完整的因果链：

```
症状: test_payment_processing 失败，AssertionError: expected 100.0, got 99.99
  ↓ 追踪调用链
直接原因: PaymentProcessor.calculate_total() 返回了错误值
  ↓ 深入分析
根因: CurrencyConverter.round_amount() 使用 Python 默认浮点运算而非 Decimal
  ↓ 完整路径
test_payment → PaymentProcessor.process() → calculate_total() 
  → CurrencyConverter.convert() → round_amount() → float rounding error
```

模型需要输出完整的因果链（从症状到根因）和涉及的所有文件/函数。

**为什么好**：
- **D = 极高**：需要深度理解多个模块的交互
- **U = 高**：Bug 的根因往往不在表面，需要深入挖掘
- **R = 极高**：因果链可能跨越 5-10 个函数调用
- **E = 高**：因果链的每一步都可以通过 AST 和调用图验证

**合成方法**：
1. 选择有良好测试覆盖的仓库
2. 在非平凡位置注入 Bug（不在堆栈顶部，而是在调用链深处）
3. 记录完整的因果链作为 ground truth
4. 仅给模型症状（测试失败信息），要求输出因果链

#### Task 2.2：修改影响分析（Change Impact Analysis）

**任务描述**：给定代码库中的一个修改（如改变一个函数的返回类型、删除一个参数），分析这个修改会影响到哪些其他模块和功能。

```
修改: 将 UserModel.get_name() 的返回类型从 str 改为 Optional[str]

影响分析:
1. UserView.render_profile() - 直接调用 get_name()，会产生 NoneType 错误
2. EmailService.send_welcome() - 通过 f-string 使用 get_name()，会显示 "None"
3. UserSerializer.to_dict() - 使用 get_name() 作为 dict value，下游 JSON 处理可能失败
4. 不受影响: AdminPanel.list_users() - 已有 None 检查
```

**为什么好**：
- **D = 极高**：需要理解修改的语义和下游代码的使用方式
- **U = 高**：影响范围不可预测
- **R = 极高**：需要遍历整个依赖图并分析每处使用
- **E = 高**：可以通过实际执行修改 + 运行测试来验证

**合成方法**：
1. 选取有完善测试的仓库
2. 对关键函数做一个破坏性修改（改返回类型、加参数、改行为）
3. 运行全部测试，找到所有因此失败的测试
4. 从失败的测试反推影响链作为 ground truth

#### Task 2.3：等价补丁判断（Patch Equivalence Verification）

**任务描述**：给定两个不同的补丁（解决同一个 Issue 的两种修复方案），判断它们是否在语义上等价。

来源灵感：Agentic Code Reasoning（2026.03）展示了**半形式化推理**方法在补丁等价验证上达到 93% 准确率。这说明可以用 LLM 作为可靠的 reward signal。

**为什么好**：
- **D = 极高**：需要深度理解两段代码的语义
- **R = 极高**：需要形式化推理来证明等价性
- **E = 高**：可以通过差分测试 + LLM 双重验证

#### Task 2.4：代码审查（Code Review）

**任务描述**：给定一个 PR diff，作为代码审查者，识别潜在的问题：Bug、性能问题、安全漏洞、风格问题、缺失的边界情况检查等。

**为什么好**：
- **D = 高**：需要理解代码变更的意图和影响
- **U = 高**：问题类型多样，需要全面扫描
- **R = 高**：需要推理变更可能导致的问题
- **E = 中高**：部分问题（如 Bug、安全漏洞）可以通过注入已知问题来验证

**合成方法**：
1. 收集真实的 Code Review 评论（GitHub PR comments）
2. 匹配评论和对应的代码变更
3. 混入有问题和无问题的 diff，让模型判断

### 6.3 Layer 3：组合任务（小规模但高质量，1,000-5,000 量级）

#### Task 3.1：模块化重构（Modular Refactoring）

**任务描述**：给定一段"God Object"（过大的类/模块）代码，将其按照单一职责原则拆分为多个模块。所有原有测试必须继续通过。

**示例**：
```
原始: utils.py (2000 行，包含文件操作、字符串处理、网络请求、日志等)
目标: 拆分为 file_utils.py, string_utils.py, network_utils.py, logging_utils.py
约束: 所有 import utils 的代码必须正确更新引用，所有测试通过
```

**为什么好**：
- **D = 极高**：需要理解每个函数的职责和依赖关系
- **U = 极高**：拆分方案有多种可能，需要判断最佳方案
- **R = 极高**：需要追踪所有引用并正确更新
- **E = 高**：测试通过 + 模块化指标（如模块耦合度降低）

#### Task 3.2：端到端 Feature 开发（End-to-End Feature Development）

**任务描述**：参考 FeatureBench 的设计，给定一个 Feature 需求描述和仓库快照，完成完整的 Feature 开发，包括：
- 新增/修改多个文件
- 编写对应的单元测试
- 确保与现有功能兼容（回归测试全部通过）

**合成方法**：
1. 从仓库的 Git 历史中选择一个 Feature PR（非 Bug 修复）
2. 恢复到 Feature 合并前的状态
3. 用 PR 描述作为需求文档
4. PR 引入的测试作为验证条件

#### Task 3.3：性能优化（Performance Optimization）

**任务描述**：给定一个性能基准测试（benchmark）和代码，优化代码使其在保持正确性的同时提升性能（运行时间、内存使用等）。

**为什么好**：
- **D = 极高**：需要理解性能瓶颈的根因
- **U = 极高**：优化方案多样（算法改进、缓存、并行化等）
- **R = 极高**：需要推理优化的正确性和效果
- **E = 极高**：performance benchmark + 正确性测试

**合成方法**：
1. 找到有 benchmark suite 的仓库
2. 在代码中引入已知的性能反模式（如 O(n²) → 应该是 O(n log n)）
3. 性能改善 + 测试通过 = 成功

---

## 七、Task 质量评估与验证机制

### 7.1 多层验证框架

每个 Task 的验证不应只依赖单一信号，而应构建**多层验证金字塔**：

```
         ┌─────────────┐
         │  LLM Judge  │  ← 最灵活但最不可靠
         │  (语义评估)  │
         ├─────────────┤
         │  差分测试    │  ← 行为等价性检查
         │             │
         ├─────────────┤
         │  静态分析    │  ← 类型检查、AST 匹配
         │             │
         ├─────────────┤
         │  测试套件    │  ← 最可靠的结果验证
         └─────────────┘
```

**RL 训练中的 Reward Signal 设计**：

```python
def compute_reward(task, agent_output):
    r_test = 1.0 if all_tests_pass(agent_output) else 0.0  # 硬约束
    r_static = static_analysis_score(agent_output)  # 0-1 连续信号
    r_diff = differential_test_score(agent_output)   # 行为等价度
    r_process = process_reward(agent_trajectory)      # 过程奖励
    
    # 组合：测试通过是前提，其他信号提供梯度
    if r_test == 0:
        return 0.1 * r_process  # 失败时仅保留过程奖励
    else:
        return 0.5 + 0.2 * r_static + 0.1 * r_diff + 0.2 * r_process
```

### 7.2 过程奖励模型（Process Reward Model for Coding）

这是现有方法最大的盲区，也是我们最大的机会。

**提议**：训练一个专门的 Process Reward Model（PRM）来评估 Agent 的每一步操作：

- **文件打开**：打开了正确的文件？和问题相关的文件？
- **搜索操作**：搜索关键词是否合理？是否在缩小搜索范围？
- **代码阅读**：是否在阅读关键的代码路径？
- **修改操作**：修改位置是否合理？修改内容是否朝正确方向？
- **测试运行**：是否在适当的时机运行测试？是否从测试结果中学到了有用信息？

**训练数据来源**：
1. 专家 Agent 的成功轨迹（正样本）
2. 失败轨迹的关键分歧点（对比学习）
3. 人工标注的"好操作"vs"坏操作"对

### 7.3 Task 难度校准

不是所有 Task 都应该同等难度。我们需要**课程学习（Curriculum Learning）**式的难度递进：

| 阶段 | Task 层级 | 难度控制 | 训练目标 |
|------|----------|---------|---------|
| Phase 1 | Layer 1 | 单文件、短调用链 | 基础代码理解 |
| Phase 2 | Layer 1+2 | 跨文件、3-5 步推理 | 深度推理 |
| Phase 3 | Layer 2+3 | 跨模块、10+ 步推理 | 复杂任务 |
| Phase 4 | All | 混合，自适应 | 综合能力 |

---

## 八、实施路线图

### Phase 1（1-2 月）：基础设施 + Layer 1 Task

**目标**：搭建 Task 合成管线，生成 10 万+ Layer 1 任务

**具体步骤**：
1. 选择 1,000+ 个高质量 Python/TS 开源仓库（Stars > 1000，有完善测试）
2. 构建代码分析基础设施：AST Parser、Call Graph Builder、Type Analyzer
3. 实现 Task 1.1-1.4 的合成器
4. 构建可执行验证环境（Docker 化）
5. 质量抽检：人工审核 500 个样本，确保正确率 > 95%

**交付物**：
- 代码考古数据集：50,000+ 个
- 类型推断数据集：20,000+ 个
- 死代码检测数据集：15,000+ 个
- API 迁移数据集：10,000+ 个

### Phase 2（2-3 月）：Layer 2 Task + Process Reward

**目标**：生成 3 万+ Layer 2 任务，初步训练 PRM

**具体步骤**：
1. 实现 Task 2.1-2.4 的合成器（需要更精细的 Bug 注入和因果链记录）
2. 收集专家 Agent 轨迹（跑 SWE-bench 等已有基准，记录完整轨迹）
3. 训练初版 Coding PRM
4. 将 PRM 集成到 RL 训练 reward 中

### Phase 3（3-4 月）：Layer 3 Task + 端到端训练

**目标**：构建组合任务集，验证完整训练管线

**具体步骤**：
1. 从 Git 历史中挖掘 Feature PR 构建 Task 3.2
2. 构建性能优化任务集（Task 3.3）
3. 多层 Task 混合训练，课程学习策略
4. 在 SWE-bench Verified、FeatureBench、SWE-bench Pro 上评估

### Phase 4（持续）：规模化 + 迭代

**目标**：扩展到多语言，持续更新

**具体步骤**：
1. 扩展 Task 合成管线到 Java、Go、Rust
2. 接入 SWE-rebench 式的持续更新管线
3. 根据模型弱点动态调整 Task 分布
4. 建立内部 Leaderboard 持续跟踪

---

## 九、总结与展望

### 9.1 核心贡献

本报告提出了三个关键主张：

**1. PR Diff 训练 ≈ 高级代码补全，不是真正的 Agentic 能力训练。**

证据：FeatureBench 的 74.4% → 11.0% 崩塌清楚地表明，SWE-bench 训练出来的"能力"在面对真正需要深度理解的任务时不堪一击。

**2. 好的 Agentic Task 需要满足 DURE 四维框架。**

理解深度（D）、不确定性探索（U）、推理链长度（R）和验证便捷性（E）四个维度缺一不可。现有方法在 D、U、R 三个维度上系统性不足。

**3. 技能分解训练 > 端到端任务训练。**

Hybrid-Gym 用 4,470 个合成技能任务超越了 SWE-Gym 的 2,438 个真实任务。这证明：教模型"看代码"的能力比教模型"修 Bug"更有价值。

### 9.2 未解决的开放问题

**Q1: Process Reward Model 的训练数据从哪来？**

Coding PRM 需要大量的"步骤级"标注数据，但获取成本极高。可能的方向：
- 用强 Agent 的成功轨迹 vs 弱 Agent 的失败轨迹做对比学习
- 利用代码执行结果做弱监督（运行了测试 → 测试反馈作为步骤奖励）
- 人机协作标注（人类开发者在 IDE 中的操作录制）

**Q2: 合成任务的"分布偏移"如何控制？**

合成任务无论多精心设计，都与真实开发场景存在分布差异。需要持续监控模型在真实任务上的表现，动态调整合成任务的分布。

**Q3: 多语言扩展的挑战？**

Python 生态的 AST 分析和测试框架最成熟，但 Java（Maven/Gradle 生态复杂）、C++（编译和依赖管理困难）、Rust（生命周期和借用检查）各有独特挑战。

**Q4: 如何评估"理解深度"？**

我们提出了 DURE 框架中的 D（理解深度）维度，但如何量化一个任务需要的理解深度仍然是开放问题。一个可能的 proxy 是：模型在缺少某部分上下文时的成绩下降幅度。

### 9.3 一句话总结

> **从"给模型看正确答案"到"迫使模型展示理解过程"——这是 Agentic Coding 训练任务设计的范式转移。PR Diff 告诉模型"结果长什么样"，好的 Task 则要求模型"证明自己理解了什么"。**

---

## 参考文献

1. Jimenez, C. E., et al. "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" ICLR 2024.
2. Badertdinov, I., et al. "SWE-rebench: An Automated Pipeline for Task Collection and Decontaminated Evaluation of Software Engineering Agents." NeurIPS 2025.
3. Zhou, Q., et al. "FeatureBench: Benchmarking Agentic Coding for Complex Feature Development." ICLR 2026.
4. Scale AI. "SWE-Bench Pro: Can AI Agents Solve Long-Horizon Software Engineering Tasks?" 2025.09.
5. Yang, J., et al. "SWE-smith: Scaling Data for Software Engineering Agents." NeurIPS 2025 Spotlight.
6. Pan, J., et al. "Training Software Engineering Agents and Verifiers with SWE-Gym." 2025.
7. Xie, Y., et al. "Hybrid-Gym: Training Coding Agents to Generalize Across Tasks." 2026.
8. Zeng, J., et al. "daVinci-Dev: Agent-native Mid-training for Software Engineering." 2026.01.
9. Jain, N., et al. "R2E-Gym: Procedural Environments and Hybrid Verification for Training SWE Agents." COLM 2025.
10. Ugare, S. & Chandra, S. "Agentic Code Reasoning." 2026.03.
11. He, Y., et al. "The Bitter Lesson Behind Building Agentic RL in Terminal Environments." 2026.02 (阿里巴巴 ROLL Team).
12. Xia, C. S., et al. "Agentless: Demystifying LLM-based Software Engineering Agents." 2025.
13. Microsoft. "Agent Lightning: Scalable RL for Any AI Agent." 2025.
14. Anthropic. "2026 Agentic Coding Trends Report." 2026.01.
