---
title: "SWE-Bench++ 精读：自动化多语言 Benchmark 生成框架"
description: "覆盖 11 种编程语言的自动化 SWE 基准生成方法"
date: 2026-03-07
category: 论文精读
tags: ["SWE-bench", "Benchmark", "多语言"]
paperTitle: "SWE-Bench++"
arxiv: "2512.17419"
draft: false
---
# SWE-Bench++ 论文精读报告

> **论文:** SWE-Bench++: A Framework for the Scalable Generation of Software Engineering Benchmarks from Open-Source Repositories  
> **作者:** Lilin Wang, Lucas Ramalho, Alan Celestino, Phuc Anthony Pham, Yu Liu, Umang Kumar Sinha, Andres Portillo, Onassis Osunwa, Gabriel Maduekwe (Turing R&D)  
> **arXiv:** [2512.17419](https://arxiv.org/abs/2512.17419) · cs.SE / cs.AI / cs.CL / cs.LG  
> **日期:** 2025年12月19日

---

## 目录

1. [论文概览与核心贡献](#1-论文概览与核心贡献)
2. [研究背景与问题动机](#2-研究背景与问题动机)
3. [四阶段方法论详解](#3-四阶段方法论详解)
4. [状态差分测试预言机（核心创新）](#4-状态差分测试预言机核心创新)
5. [四层质量保证体系](#5-四层质量保证体系)
6. [Hint 引导的轨迹合成](#6-hint-引导的轨迹合成)
7. [数据集统计与分析](#7-数据集统计与分析)
8. [模型评估实验结果](#8-模型评估实验结果)
9. [微调实验与消融分析](#9-微调实验与消融分析)
10. [与现有基准的对比](#10-与现有基准的对比)
11. [局限性与未来方向](#11-局限性与未来方向)
12. [核心要点总结](#12-核心要点总结)

---

## 1. 论文概览与核心贡献

SWE-Bench++ 是 Turing R&D 提出的一个**自动化基准生成框架**，从真实的 GitHub Pull Requests 自动构建可复现、可执行的仓库级编码任务，用于评估和提升 LLM 编程智能体。

| 指标 | 数值 |
|------|------|
| 基准实例数 | **11,133** |
| 覆盖仓库数 | **3,971** |
| 编程语言 | **11** |
| 相比基线的产出提升 | **137%** |

### 四大核心贡献

---

**贡献一：大规模基准数据集**

> **Original Text:** *"Large-scale benchmark: We construct 11,133 repository-level instances from 3,971 repositories, covering diverse build systems and coding patterns."*
>
> **Location:** Section 1 - Introduction / Contributions

**关键总结：** 构建了覆盖 3,971 个仓库的 11,133 个仓库级任务实例，规模远超 SWE-bench 的 12 个 Python 仓库。多样性大幅提升，有效降低了对特定项目编码风格的过拟合风险。

---

**贡献二：自动化多语言环境合成**

> **Original Text:** *"Automated multilingual environments: Our pipeline automatically synthesizes Docker environments and log parsers across 11 languages."*
>
> **Location:** Section 1 - Introduction / Contributions

**关键总结：** 实现了跨 11 种编程语言的 Docker 环境和日志解析器的全自动化合成，彻底消除了人工逐仓库配置的瓶颈。

---

**贡献三：更广泛的任务覆盖**

> **Original Text:** *"Broader task coverage: Our state-differential oracle identifies both bug fixes and feature requests, increasing feature-like coverage compared to prior benchmarks (e.g., 9% in SWE-bench)."*
>
> **Location:** Section 1 - Introduction / Contributions

**关键总结：** 状态差分预言机能同时识别 Bug 修复和功能请求两类任务。功能请求覆盖率从 SWE-bench 的约 9% 大幅提升至 **38.5%**——这是此前被严重忽视的关键任务类别。

---

**贡献四：抗数据污染的评估机制**

> **Original Text:** *"Contamination-Aware Evaluation: SWE-Bench++ is constructed from dated GitHub pull requests and can be filtered by PR creation date, enabling temporally separated evaluation sets that reduce data-contamination risk for future models."*
>
> **Location:** Section 1 - Introduction / Contributions

**关键总结：** 通过 PR 创建日期实现时间分离，构建"活的基准数据集"——可以始终领先于模型训练截止日，这是静态基准从根本上无法做到的。

---

## 2. 研究背景与问题动机

论文系统性地指出了现有软件工程基准的**五大核心缺陷**。

---

> **Original Text:** *"SWE-bench introduced a repository-level benchmark based on real GitHub issues, enabling more realistic evaluation of LLM coding agents. However, it relies on manual curation and covers only 12 Python repositories. This scale is too small to capture the structural and linguistic diversity of open-source projects."*
>
> **Location:** Section 1 - Introduction

**关键总结：** SWE-bench 虽然开创了仓库级基准评估，但依赖人工筛选，仅覆盖 12 个 Python 仓库，无法反映开源项目的结构和语言多样性。

---

### 五大核心缺陷

| # | 缺陷 | 说明 |
|---|------|------|
| 1 | **可扩展性不足** | 人工策划无法规模化；SWE-bench 仅 12 个仓库，Multi-SWE-bench 也仅 42 个 |
| 2 | **数据污染风险** | 静态数据集在模型训练截止日前创建，存在被记忆化的风险 |
| 3 | **测试预言机薄弱** | 两状态（Before→After）比较无法处理功能请求类任务 |
| 4 | **环境可复现性差** | 依赖管理和构建环境配置困难，限制跨语言扩展 |
| 5 | **解决方案泄漏** | 32.67% 的成功解决方案涉及信息检索而非推理 |

---

> **Original Text:** *"Additionally, the static nature of all aforementioned benchmarks introduces a critical data contamination risk: most instances were created before the training cutoff of modern models, rendering them prone to memorization."*
>
> **Location:** Section 2 - Related Work

**关键总结：** 所有静态基准都面临数据污染问题——实例在模型训练截止日前创建，模型可能已经"记住"了答案而非真正推理。

---

> **Original Text:** *"First, its two-state test oracle (Before-patch → After-patch) is not designed to extract feature requests that introduce new APIs or functionality, as these cause the Before state to fail to build due to missing symbols—cases that existing pipelines must filter out as errors."*
>
> **Location:** Section 1 - Introduction

**关键总结：** 关键洞察——现有的两状态预言机将 Before 状态的构建失败视为错误并过滤掉。但这些"失败"实际上是**功能缺失的语义信号**——新 API 和新功能在旧代码中本就不存在。这正是 SWE-Bench++ 所填补的方法论空白。

---

## 3. 四阶段方法论详解

SWE-Bench++ 通过**四阶段自动化流水线**将 GitHub PR 转化为可复现、可执行的基准任务。

```
阶段 1              阶段 2              阶段 3               阶段 4
程序化采集    →    环境合成      →    测试预言机提取   →    质量保证
(137,048 PRs)     (Docker + LLM)     (三状态差分)         (四层 QA)
                                                           → 11,133 实例
```

### 阶段 1：程序化采集

> **Original Text:** *"Selection criteria: (a) active maintenance histories with recent commit activity; (b) evidence of community adoption (e.g., >100 stars) and a recognizable testing framework; (c) substantial complexity, defined by codebases exceeding 10k lines of code; (d) merged PRs that explicitly resolve an issue; and (e) PRs that include edits or additions to test files."*
>
> **Location:** Section 3.1 - Programmatic Sourcing

**关键总结：** 五项筛选标准确保候选 PR 质量：活跃维护、社区认可(>100 stars)、足够复杂度(>10k 行代码)、明确关联 issue 的合并 PR、包含测试文件修改。由此从 GitHub firehose 中筛出 137,048 个候选 PR。

---

### 阶段 2：环境合成——约束神经合成

> **Original Text:** *"Rather than relying on unstructured generation, our system employs a hybrid architecture: parameterized Dockerfile templates enforce structural validity and security standards (e.g., multi-stage builds), while an LLM infers missing dynamic dependencies and versions (e.g., package versions, entry points) that cannot be parsed statically."*
>
> **Location:** Section 3.2 - Environment Synthesis

**关键总结：** 采用"模板 + LLM"混合架构——参数化 Dockerfile 模板保证结构有效性和安全标准（多阶段构建、最小基础镜像、非 root 用户），LLM 负责推理无法静态解析的动态依赖和版本信息。这是论文的关键技术创新之一。

---

> **Original Text:** *"The LLM is granted controlled tool access via a Model Context Protocol (MCP) server that exposes repository-level operations (clone, list, read)."*
>
> **Location:** Section 3.2 - Iterative Refinement

**关键总结：** 通过 MCP（Model Context Protocol）服务器授予 LLM 受控的工具访问权限，支持仓库级操作（克隆、列表、读取），实现深度结构分析而非简单的 README 抓取。

---

**迭代精炼机制：**
- **构建反馈循环（Build-Feedback Loop）：** 捕获 stderr 错误输出反馈给 LLM 自我修正，最多重试 5 次
- **测试运行反馈循环（TestRun-Feedback Loop）：** 验证测试运行器正确执行，确保不仅语法有效、还能正确运行测试

### 各语言 Docker 化成功率

| 语言 | 成功率 | 语言 | 成功率 |
|------|--------|------|--------|
| Python | 41.0% | Ruby | 38.0% |
| Go | 41.0% | PHP | 38.0% |
| TypeScript | 40.0% | Java | 27.0% |
| JavaScript | 39.0% | Rust | 19.0% |
| C++ | 11.0% | C# | 10.0% |
| C | 9.5% | | |

---

## 4. 状态差分测试预言机（核心创新）

这是论文的**核心技术创新**——通过三种仓库状态的差分比较，同时识别 Bug 修复和功能请求。

> **Original Text:** *"We consider three snapshots of the repository relative to the PR: base (parent commit of the PR), before (base plus test-file changes only), and after (full PR, including implementation changes)."*
>
> **Location:** Section 3.3 - State-Differential Test Oracle Extraction

**关键总结：** 定义三种仓库快照状态——**Base**（PR 父提交）、**Before**（仅应用测试补丁）、**After**（完整 PR）。通过三者之间的差分比较实现语义化任务分类。

---

### 场景 A：Bug 修复（回归修复）

- **条件：** Before 状态能**成功构建**
- **F2P 测试：** 在 Before 中失败、在 After 中通过 → 代表被修复的回归
- **P2P 测试：** 在两者中都通过 → 确保不破坏现有功能

### 场景 B：功能请求

- **条件：** Before 状态**构建失败**（因缺少新引入的符号/依赖）
- **F2P 测试：** PR 中新增的测试在 After 状态通过 → 构建失败本身就是功能缺失的证明

---

> **Original Text:** *"We treat specific build failures in the Before state not as errors, but as semantic signals for Feature Requests (where tests rely on yet-to-be-implemented code)."*
>
> **Location:** Section 3.3.2 - Classification Logic

**关键总结：** 论文的关键洞察——将 Before 状态的构建失败从"错误"重新定义为"语义信号"，因为这些失败恰恰证明了待实现功能的不存在。这使得现有框架必须丢弃的实例变成了有价值的功能请求基准。

---

### 自适应日志解析

> **Original Text:** *"We implement a hierarchical parsing strategy. The system first attempts deterministic symbolic parsing (using high-precision regex) for standard frameworks... When symbolic parsing fails (e.g., unrecognized formats), the system falls back to neural synthesis, where an LLM generates a custom Python parser."*
>
> **Location:** Section 3.3.3 - Synthesized Adaptive Log Parsing

**关键总结：** 层次化解析策略：先用确定性正则表达式处理标准框架（零成本、高精度）；若失败则回退到 LLM 神经合成，动态生成自定义 Python 解析器。通过"合成失败注入"验证解析器正确性。禁用此组件会导致数据集减少约 16%。

---

## 5. 四层质量保证体系

论文设计了严格的四层质量保证机制，确保基准实例的可靠性。

| 层级 | 名称 | 机制 |
|------|------|------|
| **L1** | 环境确定性 | 每个 Docker 环境构建 3 次，仅保留全部成功初始化的实例 |
| **L2** | 预言机一致性 | 在独立容器中执行 3 次测试，仅保留结果完全一致的实例（消除 Flaky 测试） |
| **L3** | 语义对齐 | LLM-Judge 评估问题描述与测试预言机的对齐程度；自动修复"中等质量"实例 |
| **L4** | 假阴性过滤 | 区分 SOTA 模型的"真失败"（能力限制）和"假失败"（数据集缺陷） |

---

> **Original Text:** *"While instances with fundamental ambiguity and misalignment are rejected ('Low Quality'), we identify a recoverable class of 'Medium Quality' instances where tests rely on implementation details not explicitly requested in the issue. For these, we trigger an Automated Curation module: the system analyzes the code patch to extract the signatures of implicit dependencies and appends them to the problem statement as 'Hints'."*
>
> **Location:** Section 3.4 - Layer 3: Semantic Alignment

**关键总结：** 低质量实例直接拒绝。对于中等质量实例（测试依赖了 issue 中未明确的实现细节），系统自动从代码补丁中提取隐式依赖签名，以"Hints"形式追加到问题描述中。这是一种无需人工逐项干预的自动化修复机制。

---

**人工验证数据：**
- 82 名预筛选标注员参与人工验证
- 243 个高级标注实例：Hint 预测准确率 **94.6%**
- LLM-Judge（Claude-Sonnet-4）：精确率 **0.926**，召回率 **0.921**——接近高级标注员水平

---

## 6. Hint 引导的轨迹合成

论文的另一重要创新——将 SOTA 模型**完全失败**的实例转化为有价值的训练数据。

> **Original Text:** *"Unlike frameworks such as SWE-Gym, which generate data by passively filtering for trajectories where an agent naturally succeeds, we target model-breaking instances that SOTA models fail to solve."*
>
> **Location:** Section 3.5 - Hint-Guided Trajectory Synthesis

**关键总结：** 与被动筛选成功轨迹的方法不同，SWE-Bench++ 主动针对 SOTA 模型失败的实例。通过 Hint 注入将通过率从 0% 提升到约 70%，获取模型能力边界处的"前沿"训练轨迹。

---

### 四步算法流程

1. **失败识别：** 找到 SOTA 基线一致性失败（0% 通过率）的实例
2. **上下文脚手架：** 分析 ground-truth 补丁 → 提取关键函数签名和依赖图 → 注入为 Hints
3. **引导解决：** 智能体在脚手架辅助下重试任务 → 通过率从 0% 提升到 ~70%
4. **污染控制：** 思维再生（Thought Regeneration）重写推理轨迹，移除 Hint 关键词但保留逻辑解决路径

---

> **Original Text:** *"To prevent the model from learning to rely on hints, we apply a Thought Regeneration pass: an LLM rewrites the agent's reasoning trace to exclude hint-related keywords while preserving the logical solution path."*
>
> **Location:** Section 3.5 - Contamination Control

**关键总结：** 通过"思维再生"技术防止模型学会依赖 Hints——LLM 重写智能体的推理轨迹，删除 Hint 关键词但保留逻辑路径，确保训练数据的"自包含性"。

---

## 7. 数据集统计与分析

### 产出管线分析

| 处理阶段 | 实例数 | 占比 |
|----------|--------|------|
| 阶段 1：程序化采集 | 137,048 | 100% |
| 阶段 2&3：环境合成 + 预言机提取 | 28,513 | 20.8% |
| **阶段 4：质量保证** | **11,133** | **8.1%** |

- **处理效率：** 端到端平均每个实例约 67 分钟（主要消耗在编译和测试延迟上）

### 任务类型分布（488 个随机样本）

| 类别 | 占比 |
|------|------|
| Bug 修复 | 61.1% |
| 新功能实现 | 30.7% |
| 重构 / 性能优化 / 其他 | 8.2% |

### 难度分布

| 维度 | 小 | 中 | 大 | 超大 |
|------|-----|-----|-----|------|
| 代码行变更 | 24.5%（1-30行） | 45.6%（31-100行） | 22.3%（101-300行） | 7.6%（301+行） |
| 文件变更数 | 39.3%（2-4个） | 36.9%（5-8个） | 17.1%（9-15个） | 6.7%（16+个） |

### 领域分布

| 领域 | 占比 |
|------|------|
| 开发工具（DevTools） | 27.1% |
| 基础设施/运维（Infra/DevOps） | 18.5% |
| 科学计算 | 12.9% |
| 数据工程 | 10.7% |
| AI/ML + 长尾领域 | 30.8% |

---

## 8. 模型评估实验结果

在 **1,782 个实例**的验证子集上，使用 **pass@10** 进行评估，涵盖 9 种编程语言。

### 总体排行榜

| 模型 | pass@10 |
|------|---------|
| **claude-sonnet-4.5** | **36.20%** |
| gpt-5-2025-08-07 | 34.57% |
| gemini-2.5-pro | 24.92% |
| gpt-4o | 16.89% |

### 分语言性能对比详表

| 模型 | 总体 | Python | Java | JS/TS | Rust | C/C++ | Go | PHP | Ruby | C# |
|------|------|--------|------|-------|------|-------|-----|-----|------|-----|
| claude-sonnet-4.5 | **36.20%** | 34.29% | 39.80% | 34.69% | 22.86% | **57.30%** | 28.00% | 42.90% | **53.00%** | **55.00%** |
| gpt-5-2025-08-07 | 34.57% | **43.57%** | **41.84%** | **33.67%** | 22.86% | 30.81% | 24.00% | 42.90% | 40.50% | 39.00% |
| gemini-2.5-pro | 24.92% | 20.00% | 28.57% | 19.39% | 8.57% | 28.11% | 13.00% | **50.00%** | 35.50% | 34.00% |
| gpt-4o | 16.89% | 10.71% | 12.24% | 5.10% | 5.71% | 4.32% | 9.00% | 28.60% | 13.00% | 9.00% |

---

> **Original Text:** *"On a subset of 1,782 instances of this benchmark, today's strongest models perform as follows: claude-sonnet-4.5 achieves 36.20% pass@10, gpt-5-2025-08-07 34.57%, gemini/gemini-2.5-pro 24.92%, and gpt-4o 16.89%."*
>
> **Location:** Section 4.3 - Model Performance

**关键总结：** 即使是最强模型 Claude Sonnet 4.5 也仅达到 36.20% 的 pass@10，说明该基准有足够的区分度和挑战性。值得注意的是不同模型在不同语言上表现差异显著——Claude 在 C/C++（57.30%）、Ruby、C# 上领先；GPT-5 在 Python（43.57%）和 Java 上更强；Gemini 在 PHP（50%）上意外领先。

---

### 关键发现

- **语言差异显著：** Claude Sonnet 4.5 在 C/C++ 上达到 57.30%，但在 Rust 上仅 22.86%，差异达 2.5 倍。编译型语言的类型系统可能为模型提供了更多约束信息。
- **PHP 异常现象：** Gemini 2.5 Pro 在 PHP 上以 50% 领先所有模型，远高于其总体 24.92%，暗示可能的训练数据偏差或 PHP 任务特性与其推理方式更匹配。

---

## 9. 微调实验与消融分析

使用 **Qwen2.5-Coder** 模型验证 SWE-Bench++ 数据的训练价值，在 SWE-bench Multilingual 上评估。

### 微调实验结果

| 实验 | 数据配方 | Qwen 7B (pass@1) | Qwen 32B (pass@1) |
|------|----------|-------------------|---------------------|
| 基线（未微调） | 无 | 0/300 (0%) | 4/300 (1.33%) |
| SWE-Smith | 5,016 合成轨迹 | 5/300 (1.67%) | 12/300 (4%) |
| + SWE-Bench++（密度策略） | +179 轨迹 | 7/300 (2.33%) | — |
| **+ SWE-Bench++（多样性策略）** | **+145 轨迹** | **11/300 (3.67%)** | — |
| + 数据扩展-1 | +200 轨迹 | 6/300 (2%) | 17/300 (5.67%) |
| + 数据扩展-2 | +400 轨迹 | 16/300 (5.33%) | 21/300 (7%) |
| **+ 数据扩展-3** | **+800 轨迹** | **20/300 (6.67%)** | **25/300 (8.33%)** |

---

> **Original Text:** *"Incorporating just 145 SWE-Bench++ trajectories (i.e., 2.8% of the mix) increased the baseline performance (from 5/300 to 11/300) and more than doubled the number of valid patches, demonstrating the critical value of high-diversity, 'hard' multilingual samples."*
>
> **Location:** Section 4.4 - Fine-Tuning Experiments

**关键总结：** 仅加入 145 条 SWE-Bench++ 轨迹（仅占混合数据的 2.8%）就将基线性能从 5/300 翻倍到 11/300（+120%）。这证明了高多样性"硬"样本的极高训练价值——少量高质量数据远优于大量同质化数据。

---

### 关键微调指标

| 指标 | 数值 |
|------|------|
| 145 条多样性轨迹的提升 | **+120%** |
| 800 条轨迹对 7B 的提升 | **+300%** |
| 800 条轨迹对 32B 的提升 | **+108%** |

### 消融分析结果

> **Original Text:** *"This approach combines LLM reasoning with static templates, achieving approximately 137% higher yield on Python repositories than a SetUpAgent baseline when both are run on the same pool of 2,377 valid pull requests."*
>
> **Location:** Section 4.2 - Ablation Studies

**关键总结：** 在相同的 2,377 个 Python PR 上，SWE-Bench++ 的模板引导方法比 SetUpAgent 基线的产出高 137%（约 2.37 倍），验证了约束神经合成方法的优越性。

---

| 消融组件 | 移除后影响 |
|----------|-----------|
| 模板引导环境合成 | 产出降低约 **60%** |
| 自适应日志解析器 | 数据集减少约 **16%** |
| 仓库多样性 vs 密度 | 多样性**显著优于**密度 |

---

**多样性 > 密度：** 从不同仓库采样的 145 条轨迹（多样性策略）比从少数仓库密集采样的 179 条轨迹（密度策略）效果更好（3.67% vs 2.33%）。跨仓库分布多样性是微调效果的关键驱动因素。

---

## 10. 与现有基准的对比

| 维度 | SWE-bench | Multi-SWE | SWEE-bench | SWE-Smith | **SWE-Bench++** |
|------|-----------|-----------|------------|-----------|-----------------|
| **功能定位** | 基准数据集 | 基准数据集 | 基准生成器 | 合成数据生成 | **活基准生成器** |
| **生成方式** | 人工筛选 | 人工筛选 | 自动化 | 合成 | **自动化** |
| **仓库规模** | 12 | 42 | 514 | 128 | **3,971** |
| **语言** | Python | 9 种 | 仅 Python | 仅 Python | **11 种（自动化）** |
| **任务范围** | 仅 Bug 修复 | 仅 Bug 修复 | 仅 Bug 修复 | 仅 Bug 修复 | **Bug 修复 + 功能请求** |
| **日志解析** | 静态正则 | 静态正则 | 静态正则 | 静态正则 | **自适应合成解析器** |
| **数据分布** | 有机 | 有机 | 有机 | 合成 | **有机** |
| **时效性** | 静态 | 静态 | 静态 | N/A | **持续更新（Living）** |
| **功能请求覆盖** | ~9% | ~9% | — | — | **38.5%** |

---

> **Original Text:** *"Furthermore, recent works like SWE-Smith and SWE-Flow have attempted to scale data generation via synthetic means... While valuable for training, these synthetic approaches are less well suited for evaluating models on 'in-the-wild' distributions."*
>
> **Location:** Section 2 - Related Work

**关键总结：** 合成数据适合训练但不适合评估"野外"真实分布。SWE-Bench++ 坚持使用真实 PR（有机数据），保证了评估的生态效度。

---

## 11. 局限性与未来方向

### 三大局限

1. **执行验证的代理性：** 基于执行的验证只是正确性的代理指标，无法衡量代码的可维护性、效率和风格质量。
2. **依赖开发者测试套件：** 基准质量受限于原始仓库中开发者编写的测试套件的质量和覆盖率。
3. **时间分离为启发式：** 基于 PR 创建日期的时间分离只是启发式方法，并非严格的形式化保证。

### 未来方向

- **Human-in-the-Loop 策划：** 结合人工审核提升数据质量
- **多模态验证：** 为 UI 相关任务提供视觉验证能力
- **语言和领域扩展：** 持续扩展更多编程语言和应用领域

---

## 12. 核心要点总结

### 技术创新亮点

1. **状态差分预言机** —— 将 Before 构建失败从"错误"重新定义为"功能缺失信号"，首次支持自动提取功能请求基准
2. **约束神经合成** —— 模板保结构安全 + LLM 推动态依赖，产出比基线高 137%
3. **自适应日志解析** —— 确定性正则 + 神经合成后备，覆盖长尾非标准输出
4. **Hint 引导轨迹合成** —— 将 0% 通过率的难实例转化为 ~70% 通过率的训练数据，并通过思维再生防止污染
5. **活基准概念** —— 持续摄取新 PR，支持时间分离评估，对抗数据污染

### 实验关键结论

- 最强模型仅 36.20% pass@10，基准有充分的区分度
- 145 条高多样性轨迹即可翻倍微调效果，证明**质量 > 数量**
- 仓库多样性是微调成功的关键驱动因素，而非单仓库密集采样
- 不同模型在不同语言上优势差异显著，暗示训练数据和架构偏好
- 微调收益能稳健迁移到更大模型（7B → 32B）

### 对 LLM 编程智能体领域的启示

- 需要更多样化、更新鲜的评估基准来对抗数据污染
- 功能请求任务是现有基准的重大盲区，需要重视
- 高质量"硬"样本的训练价值远超大量简单样本
- 自动化基准生成是可扩展评估的必经之路
- "活基准"理念将成为未来基准设计的重要趋势

---

*本报告由 WorkBuddy 生成 · 论文来源：[arXiv:2512.17419](https://arxiv.org/abs/2512.17419) · 2026年3月7日 · 仅用于学术研究参考*
