---
title: "SWE 领域综合调研"
description: "Benchmark、Agent、训练环境、RL 方法、验证器全链路——33+ 项目 1313 行"
date: 2026-03-07
category: 综合调研
tags: ["SWE", "Agent", "RL", "全链路综述"]
draft: false
---
# SWE 领域综合调研报告：Benchmark、Agent、训练环境、RL 方法与验证器

> **调研日期**: 2026-03-07
> **覆盖范围**: 2023-2026年 SWE (Software Engineering) 领域的 Benchmark 数据集、Agent 系统与框架、训练环境与轨迹数据构建、RL 训练方法、验证器与评估方法、2026年最新进展
> **报告特点**: 每个项目均附有原文关键引用（英文原文 + 中文说明）

---

## 目录

1. [总览与关键趋势](#1-总览与关键趋势)
2. [SWE Benchmark 数据集](#2-swe-benchmark-数据集)
3. [SWE Agent 系统与框架](#3-swe-agent-系统与框架)
4. [训练环境与轨迹数据构建](#4-训练环境与轨迹数据构建)
5. [RL 训练方法](#5-rl-训练方法)
6. [验证器与评估方法](#6-验证器与评估方法)
7. [2026 年最新进展](#7-2026-年最新进展)
8. [轨迹数据格式与生成实践指南](#8-轨迹数据格式与生成实践指南)
9. [参考文献](#9-参考文献)

---

## 1. 总览与关键趋势

### 1.1 领域全景图

SWE (Software Engineering) 领域的 AI 研究已形成完整的生态系统，涵盖从评估基准到训练管线的全链路：

```
                        ┌─────────────────────────────────────────┐
                        │          SWE 领域 AI 全景图               │
                        └──────────────────┬──────────────────────┘
                                           │
            ┌──────────────────────────────┼──────────────────────────────┐
            │                              │                              │
    ┌───────▼────────┐          ┌──────────▼──────────┐        ┌─────────▼─────────┐
    │   Benchmark     │          │   Agent 系统         │        │   训练 Pipeline    │
    │   评估基准       │          │   推理框架            │        │   SFT + RL         │
    └───────┬────────┘          └──────────┬──────────┘        └─────────┬─────────┘
            │                              │                              │
  ┌─────────┼──────────┐       ┌──────────┼──────────┐       ┌──────────┼──────────┐
  │ SWE-bench 系列      │       │ SWE-agent           │       │ 训练环境            │
  │ 多语言扩展          │       │ OpenHands/CodeAct    │       │ SWE-Gym/R2E-Gym     │
  │ 动态/抗污染基准     │       │ Agentless            │       │ SWE-smith/SWE-World  │
  │ 企业级基准          │       │ 新生代 Agent          │       │ SWE-Factory          │
  └────────────────────┘       └─────────────────────┘       └──────────┬──────────┘
                                                                        │
                                                              ┌─────────┼──────────┐
                                                              │ 验证器 & 评估       │
                                                              │ ORM / Hybrid         │
                                                              │ Test-Time Scaling    │
                                                              │ Docker-Free (SWT/SWR)│
                                                              └────────────────────┘
```

### 1.2 关键趋势时间线

| 时间 | 里程碑 | 核心贡献 |
|------|--------|----------|
| 2023.10 | SWE-bench 发布 | 开创性 benchmark，2,294 个 Python 任务 |
| 2024.04 | SWE-agent 发布 | 首个交互式 Agent 框架，12.47% 解决率 |
| 2024.06 | Agentless | 无 Agent 三步法，成本仅 $0.34/问题 |
| 2024.08 | SWE-bench Verified | OpenAI 人工验证 500 个高质量子集 |
| 2024.10 | SWE-bench Multimodal | 扩展至 JavaScript 视觉领域 |
| 2024.12 | SWE-Gym | 首个 SWE Agent 训练环境 |
| 2025.04 | SWE-smith | 50K+ 训练实例，大规模数据生成 |
| 2025.04 | R2E-Gym | Commit-based 环境构建 + 混合验证器 |
| 2025.04 | Multi-SWE-bench | 7种语言，1,632实例 |
| 2025.05 | SWE-bench Live | 动态持续更新，8种语言 |
| 2025.05 | SWE-rebench | 21K+ 去污染 RL 训练任务 |
| 2025.06 | DeepSWE | 纯 RL 训练达 59% (GRPO++) |
| 2025.09 | SWE-Bench Pro | Scale AI 企业级长周期基准 |
| 2026.01 | CodeMonkeys | Test-Time Scaling 达 66.2% |
| 2026.02 | SWE-World | Docker-Free 世界模型, 68.2% TTS |
| 2026.02 | SWE-Master | 端到端后训练, 70.8% TTS |
| 2026.02 | SWE-Factory | Multi-Agent 自动环境构建 (FSE 2026) |
| 2026.02 | SWE-ContextBench | 评估经验复用能力 |

### 1.3 六大核心趋势

1. **从 Python-only 到多语言**: SWE-bench (Python) → SWE-PolyBench (4种) → Multi-SWE-bench (7种) → SWE-bench Live (8种)
2. **从静态到动态**: 静态数据集面临数据污染问题 (32.67% 泄漏) → SWE-bench Live、SWE-MERA、SWE-rebench 引入持续更新机制
3. **从纯执行到混合验证**: 单一验证方式存在瓶颈 → 混合方法 (R2E-Gym EB+EF, SWE-World SWT+SWR) 显著优于单一方法
4. **从 Docker 到 Docker-Free**: SWE-World 用学习的世界模型替代 Docker，大幅降低训练门槛
5. **从 SFT 到纯 RL**: DeepSWE 证明纯 RL 训练（无 SFT/蒸馏）可达 SOTA
6. **Test-Time Scaling 成为标配**: 几乎所有 2025-2026 方法都包含 Best-of-N 或推理时扩展

### 1.4 最新排行榜 (SWE-bench Verified, 2026.02)

| 排名 | 模型 | % Resolved | Avg. Cost |
|------|------|-----------|-----------|
| 1 | Claude 4.5 Opus (high reasoning) | **76.80%** | $0.75 |
| 2 | Gemini 3 Flash (high reasoning) | 75.80% | $0.36 |
| 3 | MiniMax M2.5 (high reasoning) | 75.80% | $0.07 |
| 4 | Claude Opus 4.6 | 75.60% | $0.55 |
| 5 | GPT-5-2 Codex | 72.80% | $0.45 |
| 6 | Devstral 2 (123B, 开源) | 72.20% | — |
| — | SWE-Master-32B (TTS@8) | 70.80% | — |
| — | SWE-World (TTS@8) | 68.20% | — |
| — | DeepSWE (TTS) | 59.00% | — |

---

## 2. SWE Benchmark 数据集

### 2.1 SWE-bench (ICLR 2024)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-bench: Can Language Models Resolve Real-World GitHub Issues? |
| **作者** | Carlos E. Jimenez*, John Yang*, Alexander Wettig, Shunyu Yao, Kexin Pei, Ofir Press, Karthik R. Narasimhan |
| **发表** | ICLR 2024 (Oral) |
| **arXiv** | arXiv:2310.06770 |

**数据集规模**: 2,294 个任务实例，仅 Python，来源于 12 个流行的 Python 开源仓库。训练集 SWE-bench-train 包含从 37 个仓库中提取的 19,000 个非测试任务实例。

**构建方法**: 通过爬取 GitHub 的 Pull Request 和 Issue 对构建。每个实例基于一个满足以下条件的 PR：(1) 与一个 Issue 关联；(2) 修改了至少一个测试相关文件。为每个实例构建 Docker 执行环境，在 PR 合并前有测试失败（Fail），PR 合并后同一组测试通过（Pass），这些 "Fail-to-Pass" 测试是评估的核心信号。

**评估方式**: 基于执行的评估 (execution-based evaluation)。初始基线 (RAG + Claude 2): 仅 1.96% 解决率。

**原文关键片段:**

> "Language models have outpaced our ability to evaluate them effectively, but for their future development it is essential to study the frontier of their capabilities."

> "We introduce SWE-bench, an evaluation framework consisting of 2,294 software engineering problems drawn from real GitHub issues and corresponding pull requests across 12 popular Python repositories."

> "Resolving issues in SWE-bench frequently requires understanding and coordinating changes across multiple functions, classes, and files simultaneously, interacting with execution environments, processing extremely long contexts, and performing complex reasoning beyond traditional code generation tasks."

---

### 2.2 SWE-bench Verified (OpenAI, 2024)

| 项目 | 详情 |
|------|------|
| **标题** | Introducing SWE-bench Verified |
| **发布方** | OpenAI |
| **发布时间** | 2024年8月13日 |

**数据集规模**: 500 个经人工验证的高质量实例（从原 SWE-bench 的 1,699 个随机样本中筛选），93 位经验丰富的 Python 开发者参与标注。

**构建方法**: 93 位 Python 专家逐一手动审核，验证每个问题的描述清晰性、测试准确性、环境可复现性。使用容器化 Docker 环境标准化评估过程。

**原文关键片段:**

> "We're releasing a human-validated subset of SWE-bench that more reliably evaluates AI models' ability to solve real-world software issues." — OpenAI Blog

> "As our systems get closer to AGI, we need to evaluate them on increasingly challenging tasks."

---

### 2.3 SWE-bench Lite

**规模**: 300 个实例，仅 Python。从原 SWE-bench 2,294 个实例中抽取 Issue 描述完整、求解逻辑清晰、相对易于解决的子集。

> SWE-bench 作者发现在 2,294 个实例上进行评测是一个时间与 Token 投入巨大且令人沮丧的过程，无法验证短期内的进展，所以抽取了 300 个实例组成 SWE-bench Lite。

**注**: SWE-bench Verified 发布后，OpenAI 建议用 Verified 替代原始 SWE-bench 和 Lite 作为主要评测集。

---

### 2.4 SWE-bench Multimodal (ICLR 2025)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-bench Multimodal: Do AI Systems Generalize to Visual Software Domains? |
| **作者** | John Yang, Carlos E. Jimenez 等 |
| **发表** | ICLR 2025 |
| **arXiv** | arXiv:2410.03859 |

**数据集规模**: 617 个任务实例，**JavaScript**（非 Python），来源于 17 个 JavaScript 库。覆盖 Web 界面设计、图表绘制、数据可视化、语法高亮、交互式地图。

**构建方法**: 每个任务实例在问题描述或单元测试中包含至少一张图片。

**原文关键片段:**

> "SWE-bench uses only Python repositories, with problem statements presented predominantly as text and lacking visual elements such as images. This limited coverage motivates our inquiry into how existing systems might perform on unrepresented software engineering domains (e.g., front-end, game development, DevOps), which use different programming languages and paradigms."

> "Top-performing SWE-bench systems struggle with SWE-bench M, revealing limitations in visual problem-solving and cross-language generalization."

---

### 2.5 SWE-PolyBench (Amazon, 2025)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-PolyBench: A Multi-Language Benchmark for Repository Level Evaluation of Coding Agents |
| **机构** | Amazon (AWS AI Labs) |
| **arXiv** | arXiv:2504.08703 |

**数据集规模**: 完整数据集 (PB) 2,110 个实例，采样子集 (PB500) 500 个实例（每种语言 125 个），验证子集 (PBv) 382 个实例。覆盖 **Java, JavaScript, TypeScript, Python**（4种语言），21 个 GitHub 仓库。

**构建方法**: 引入基于具体语法树 (Concrete Syntax Tree, CST) 的指标，包括文件级和节点级检索分数。

**原文关键片段:**

> "Coding agents powered by large language models have shown impressive capabilities in software engineering tasks, but evaluating their performance across diverse programming languages and real-world scenarios remains challenging."

---

### 2.6 Multi-SWE-bench (ByteDance, 2025)

| 项目 | 详情 |
|------|------|
| **论文标题** | Multi-SWE-bench: A Multilingual Benchmark for Issue Resolving |
| **机构** | 字节跳动 (ByteDance) 豆包大模型团队 |
| **arXiv** | arXiv:2504.02605 |

**数据集规模**: 1,632 个高质量实例（从 2,456 个候选中筛选），68 位专家标注者。覆盖 **Java, TypeScript, JavaScript, Go, Rust, C, C++**（7种语言）。配套 RL 数据集 Multi-SWE-RL 含 4,723 个实例。

**原文关键片段:**

> "Existing benchmarks, such as SWE-bench, focus almost exclusively on Python, making them insufficient for evaluating Large Language Models (LLMs) across diverse software ecosystems."

> "It includes a total of 1,632 high-quality instances, which were carefully annotated from 2,456 candidates by 68 expert annotators, ensuring that the benchmark can provide an accurate and reliable evaluation."

> "We envision our Multi-SWE-bench and the ever-growing Multi-SWE-RL community as catalysts for advancing RL toward its full potential, bringing us one step closer to the dawn of AGI."

---

### 2.7 SWE-bench-java (Huawei, 2024)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-bench-java: A GitHub Issue Resolving Benchmark for Java |
| **机构** | 华为 |
| **arXiv** | arXiv:2408.14354 |

基于 SWE-bench 框架开发的 Java 版本，提供 Docker-based 评估环境。

> "GitHub issue resolving is a critical task in software engineering, recently gaining significant attention in both industry and academia."

> "Supporting more programming languages is also important, as there is a strong demand in industry."

---

### 2.8 DevBench / DevEval (2024)

| 项目 | 详情 |
|------|------|
| **论文标题** | DevBench: A Comprehensive Benchmark for Software Development |
| **arXiv** | arXiv:2403.08604 |

**数据集规模**: 22 个精选仓库，覆盖 Python (32.5%), C (25.8%), C++ (17.4%), JavaScript (10.2%), Java (9.1%)。

**构建方法**: 不同于 SWE-bench 的 Issue-PR 对构建方式，DevBench 评估完整的软件开发生命周期：Software Design → Environment Setup → Implementation → Acceptance Testing → Unit Testing。

**原文关键片段:**

> "Recent advancements in large language models (LLMs) have significantly enhanced their coding capabilities. However, existing benchmarks predominantly focused on simplified or isolated aspects of coding, such as single-file code generation or repository issue debugging, falling short of measuring the full spectrum of challenges raised by real-world programming activities."

---

### 2.9 SWE-Bench Pro (Scale AI, 2025)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-Bench Pro: Can AI Agents Solve Long-Horizon Software Engineering Tasks? |
| **机构** | Scale AI |
| **arXiv** | arXiv:2509.16941 |

**数据集规模**: 1,865 个问题，41 个活跃维护的仓库（公开集 11 + 保留集 12 + 商业集 18 个私有仓库），覆盖商业应用、B2B 服务、开发者工具。

**原文关键片段:**

> "SWE-BENCH PRO contains 1,865 problems sourced from a diverse set of 41 actively maintained repositories spanning business applications, B2B services, and developer tools."

> "Our benchmark features long-horizon tasks that may require hours to days for a professional software engineer to complete, often involving patches across multiple files and substantial code modifications."

> "SWE-BENCH PRO provides a contamination-resistant testbed that more faithfully captures the complexity and diversity of real-world software development."

---

### 2.10 SWE-bench Live (Microsoft, NeurIPS 2025)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-bench Goes Live! |
| **机构** | Microsoft |
| **arXiv** | arXiv:2505.23419 |
| **会议** | NeurIPS 2025 Datasets & Benchmarks Track |

**数据集规模**: 初始 1,319 个任务，来源于 93 个仓库（均为 2024 年以后创建的 GitHub Issue）。覆盖 **C, C++, C#, Python, Java, Go, JavaScript/TypeScript, Rust**（8种语言），Linux + Windows 平台。**每月新增 50 个高质量实例**。

**构建方法**: 自动化数据策展流水线，RepoLaunch 基于 LLM 自动化执行环境设置。

**原文关键片段:**

> "By providing a fresh, diverse, and executable benchmark grounded in live repository activity, SWE-bench-Live facilitates rigorous, contamination-resistant evaluation of LLMs and agents in dynamic, real-world software development settings."

---

### 2.11 SWE-rebench (Nebius, NeurIPS 2025)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-rebench: An Automated Pipeline for Task Collection and Decontaminated Evaluation |
| **机构** | Nebius |
| **arXiv** | arXiv:2505.20411 |

**数据集规模**: 超过 **21,000** 个交互式 Python SWE 任务，适合强化学习 (RL) 规模化训练。

**原文关键片段:**

> "High-quality training data is scarce, especially data that reflects real-world SWE scenarios, where agents must interact with development environments, execute code and adapt behavior based on the outcomes of their actions."

> "We compare results of various LLMs on this benchmark to results on SWE-bench Verified and show that performance of some language models might be inflated due to contamination issues."

---

### 2.12 SWE-MERA (2025)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-MERA: A Dynamic Benchmark for Agenticly Evaluating LLMs on Software Engineering Tasks |
| **arXiv** | arXiv:2507.11059 |

**数据集规模**: 潜在任务约 10,000 个，当前可用 300 个样本。

**原文关键片段:**

> "Recent studies have uncovered severe data contamination issues, e.g. SWE-bench reports 32.67% of successful patches involve direct solution leakage and 31.08% pass due to inadequate test cases."

> "We introduce SWE-MERA, a dynamic, continuously updated benchmark designed to address these fundamental challenges through an automated collection of real-world GitHub issues and rigorous quality validation."

---

### 2.13 SWE-smith (Princeton, 2025)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-smith: Scaling Data for Software Engineering Agents |
| **arXiv** | arXiv:2504.21798 |

**数据集规模**: 50,000+ 个实例（来自 128 个 GitHub 仓库），训练数据生成工具（非纯评测基准）。训练的 SWE-agent-LM-32B 在 SWE-bench Verified 上达到 40.2% Pass@1。

**原文关键片段:**

> "Existing datasets are small, with at most 1,000s of training instances from 11 or fewer GitHub repositories. The procedures to curate such datasets are often complex, necessitating hundreds of hours of human labor."

> "Using SWE-smith, we create a dataset of 50k instances sourced from 128 GitHub repositories, an order of magnitude larger than all previous works."

---

### 2.14 SWE-ContextBench (2026)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE Context Bench: A Benchmark for Context Learning in Coding |
| **arXiv** | arXiv:2602.08316 |

**数据集规模**: 基础任务 300 个（基于 SWE-Bench Lite）+ 关联任务 99 个 = 总计 399 个任务。

**原文关键片段:**

> "While recent benchmarks evaluate correctness in realistic codebases, they largely treat tasks as independent and do not assess whether agents can reuse experience across related problems."

> "Correctly selected summarized experience improves resolution accuracy and substantially reduces runtime and token cost, particularly on harder tasks."

---

### 2.15 Benchmark 总览对比表

| Benchmark | 年份 | 规模 | 语言 | 构建方式 | 核心特点 |
|-----------|------|------|------|----------|----------|
| **SWE-bench** | 2024 (ICLR) | 2,294 | Python | GitHub Issue-PR 爬取 | 开创性工作，12个Python仓库 |
| **SWE-bench Lite** | 2024 | 300 | Python | SWE-bench 子集 | 快速评测，易解决子集 |
| **SWE-bench Verified** | 2024 (OpenAI) | 500 | Python | 93人工验证 | 人工审核提升可靠性 |
| **SWE-bench Multimodal** | 2025 (ICLR) | 617 | JavaScript | 17个JS库，含图片 | 视觉+多模态，前端领域 |
| **SWE-bench-java** | 2024 | - | Java | SWE-bench Java版 | 扩展到Java语言 |
| **SWE-PolyBench** | 2025 (Amazon) | 2,110 | Java/JS/TS/Python | 21个仓库 | 多语言+CST指标 |
| **Multi-SWE-bench** | 2025 (ByteDance) | 1,632 | 7种语言 | 68专家标注 | 覆盖最多语言 |
| **DevBench** | 2024 | 22 repos | Python/C/C++/JS/Java | 完整SDLC评估 | 全生命周期评估 |
| **SWE-Bench Pro** | 2025 (Scale AI) | 1,865 | 多种 | 41仓库含私有 | 企业级长周期任务 |
| **SWE-bench Live** | 2025 (Microsoft) | 1,319+ | 8种语言 | 自动化+月更 | 动态持续更新，抗污染 |
| **SWE-rebench** | 2025 (Nebius) | 21,000+ | Python | 自动化流水线 | 去污染评估，RL训练数据 |
| **SWE-MERA** | 2025 | ~10,000 | - | 动态自动收集 | 动态更新，解决污染问题 |
| **SWE-smith** | 2025 (Princeton) | 50,000+ | Python | 自动合成 | 大规模训练数据生成 |
| **SWE-ContextBench** | 2026 | 399 | Python | 基于SWE-bench Lite | 评估经验复用能力 |

---

## 3. SWE Agent 系统与框架

### 3.1 SWE-agent (Princeton, NeurIPS 2024)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering |
| **作者** | John Yang, Carlos E. Jimenez, Alexander Wettig 等 |
| **发表** | NeurIPS 2024 |
| **arXiv** | arXiv:2405.15793 |
| **代码** | https://github.com/princeton-nlp/SWE-agent |

**核心创新: Agent-Computer Interface (ACI)**

SWE-agent 的核心贡献是提出了 **Agent-Computer Interface (ACI)** 的概念，类似于 HCI (Human-Computer Interface) 但专为 LLM agent 设计。

关键 ACI 设计：
- **文件查看器**: 带行号的滚动查看（非一次性输出整个文件）
- **搜索工具**: 全仓库搜索 + 文件内搜索
- **编辑工具**: 基于行号的精确编辑（非整文件替换）
- **Linter 集成**: 编辑后自动语法检查
- **错误回滚**: 语法错误自动回滚

**性能**: SWE-bench 上 12.47% 解决率（当时 SOTA），SWE-bench Lite 上 18%。

> "We show that LM agents benefit significantly from ACI design... our best agent achieves a 12.47% resolve rate on the full SWE-bench test set."

> "Just as the quality of the human-computer interface (HCI) affects human performance, we hypothesize that the design of the agent-computer interface (ACI) similarly impacts LM agent performance."

---

### 3.2 OpenHands / CodeAct (UC Berkeley)

| 项目 | 详情 |
|------|------|
| **论文标题** | OpenHands: An Open Platform for AI Software Developers as Generalist Agents |
| **作者** | Xingyao Wang, Boxuan Li 等 (UC Berkeley, UIUC) |
| **arXiv** | arXiv:2407.16741 |
| **代码** | https://github.com/All-Hands-AI/OpenHands |

**核心设计: 事件流架构 (Event Stream Architecture)**

OpenHands（原 OpenDevin）采用事件流架构，将 Agent 的所有操作统一为事件序列：
- **Action Events**: `CmdRunAction` (bash 命令), `FileEditAction` (文件编辑), `BrowseInteractiveAction` (浏览器操作)
- **Observation Events**: `CmdOutputObservation`, `FileEditObservation`

**CodeAct Agent**: OpenHands 的核心 Agent 实现，使用代码执行作为主要操作方式：
```python
# Agent 通过 Python/Bash 代码直接操作环境
# 而非使用预定义的 tool API
```

**轨迹采集流程**:
```bash
./scripts/rollout-swe-train-full.sh llm.my-oss-model my_exp_name 1
```

**性能**: 2024.08 SWE-bench Verified 上 ~41% (使用 Claude 3.5 Sonnet)。

---

### 3.3 Agentless (UIUC, 2024)

| 项目 | 详情 |
|------|------|
| **论文标题** | Agentless: Demystifying LLM-based Software Engineering Agents |
| **作者** | Chunqiu Steven Xia, Yinlin Deng, Soren Dunn, Lingming Zhang |
| **机构** | UIUC |
| **arXiv** | arXiv:2407.01489 |

**核心思想: 无 Agent 的三步法**

Agentless 证明不需要复杂的 Agent 循环就能取得竞争力的结果：

1. **定位 (Localization)**: 使用 LLM 分层定位相关文件 → 类/函数 → 代码片段
2. **修复 (Repair)**: 基于定位结果，让 LLM 直接生成补丁
3. **验证 (Verification)**: 使用回归测试过滤不正确的补丁

**关键优势**: 成本仅 $0.34/问题，不到 Agent 方案的 1/10。

**性能**: SWE-bench Verified 上 33%（与 GPT-4o 持平），SWE-bench Lite 上 27.3%。

---

### 3.4 AutoCodeRover (NUS, 2024)

| 项目 | 详情 |
|------|------|
| **论文标题** | AutoCodeRover: Autonomous Program Improvement |
| **机构** | NUS (新加坡国立大学) |
| **arXiv** | arXiv:2404.05427 |

**核心创新**: 结合程序分析（AST 级别搜索）与 LLM 推理。使用程序结构信息（类、方法、变量定义）辅助 LLM 理解代码库。

---

### 3.5 Aider

| 项目 | 详情 |
|------|------|
| **名称** | Aider: AI pair programming in your terminal |
| **代码** | https://github.com/paul-gauthier/aider |

Aider 是一个终端内的 AI 辅助编程工具，支持多种 LLM 后端。在 SWE-bench 评测中被广泛用作基线 Agent scaffolding。

---

### 3.6 Moatless Tools

开源的代码搜索和编辑工具集，专为 SWE-bench 场景设计。SWE-Gym 使用 Moatless Tools 作为其 Agent scaffold 之一。

---

### 3.7 MarsCode Agent (ByteDance)

字节跳动开发的 SWE Agent，集成了丰富的开发环境交互工具。

---

### 3.8 SWE-Search (2025)

| 项目 | 详情 |
|------|------|
| **核心创新** | 将 MCTS (蒙特卡洛树搜索) 应用于 SWE Agent 的探索过程 |

结合搜索算法与 LLM Agent，在代码修复空间中进行更系统的探索。

---

### 3.9 新生代 Agent 系统

#### DeepSWE (Agentica, 2025)
- **特点**: 纯 RL 训练（无 SFT/蒸馏），基于 Qwen3-32B + GRPO++ 算法
- **性能**: SWE-bench Verified 59% Pass@1（开源权重 SOTA）
- **训练框架**: rLLM + R2E-Gym 环境

#### SWE-agent-LM (Princeton, 2025)
- **特点**: 使用 SWE-smith 50K 数据训练的专用 SWE Agent 模型
- **性能**: SWE-bench Verified 40.2% Pass@1（当时开源 SOTA）
- **基础模型**: Qwen2.5-Coder-32B

#### SWE-Master (RUC-AIBOX, 2026)
- **特点**: 端到端后训练流水线 (SFT + RLVR + TTS)
- **性能**: SWE-bench Verified 61.4% Pass@1, 70.8% TTS@8
- **创新**: LSP 工具集成、SWR 验证器驱动的 Test-Time Scaling

#### SWE-Lego (2025)
- **特点**: 模块化 Agent 架构，将 SWE 任务分解为可组合的子模块
- **理念**: 每个模块专注一个子任务（定位、编辑、测试等）

#### SkyRL-Agent (Skywork, 2025)
- **特点**: 基于 RL 训练的 SWE Agent
- **关联**: Skywork-SWE 项目的 Agent 组件

#### Devstral 2 (Mistral, 2026)
- **特点**: 123B 开源模型，专为 SWE 任务优化
- **性能**: SWE-bench Verified 72.2%（开源模型最高）

#### mini-SWE-agent (2026)
- **特点**: 轻量级 SWE Agent 实现，降低入门门槛
- **目标**: 教学和快速原型验证

---

### 3.10 Agent 系统性能对比

| Agent | 年份 | 方法 | SWE-bench Verified | 特点 |
|-------|------|------|-------------------|------|
| SWE-agent | 2024 | ACI + LLM | 12.47% (原版) | 开创性 ACI 设计 |
| Agentless | 2024 | 三步法 | 33% | 低成本无 Agent |
| OpenHands | 2024 | Event Stream | ~41% | 开放平台 |
| SWE-agent-LM | 2025 | SFT (SWE-smith) | 40.2% | 专用开源模型 |
| DeepSWE | 2025 | 纯 RL (GRPO++) | 59% | 开源 RL SOTA |
| SWE-Master | 2026 | SFT + RLVR + TTS | 70.8% (TTS@8) | 端到端后训练 |
| Devstral 2 | 2026 | 预训练+对齐 | 72.2% | 开源最高 |
| Claude 4.5 Opus | 2026 | 闭源 | 76.8% | 总体最高 |

---

## 4. 训练环境与轨迹数据构建

### 4.1 环境构建方法演进

```
PR-based (SWE-Gym, 2024)
  → Commit-based / SYNGEN (R2E-Gym, 2025)
  → Mutation-based (SWE-smith, 2025)
  → Multi-Agent Auto-build (SWE-Factory, 2026)
  → Docker-Free Learned Surrogate (SWE-World, 2026)
```

### 4.2 SWE-Gym (ICML 2025)

| 项目 | 详情 |
|------|------|
| **论文** | Training Software Engineering Agents and Verifiers with SWE-Gym |
| **作者** | Jiayi Pan, Xingyao Wang 等 (UC Berkeley, UIUC, CMU, Apple) |
| **会议** | ICML 2025 \| arXiv:2412.21139 |
| **代码** | https://github.com/SWE-Gym/SWE-Gym |

**数据规模**: 2,438 个真实世界 Python 任务实例，来源于 11 个 Python GitHub 仓库。Lite 拆分 234 个实例。训练用轨迹 < 500 条 (GPT-4o / Claude 3.5 Sonnet 生成)。

> *"We create SWE-Gym, the first environment for training SWE agents, with **2.4K real tasks from 11 Python repos** & a Lite split of 234 instances."*

**环境构建方法 (Docker-based)**: 基于 SWE-bench 的 Docker 环境构建，每个实例有预构建 Docker 镜像。每个任务包含: codebase + 可执行运行时环境 + 单元测试 + 自然语言任务描述。

> *"SWE-Gym contains 2,438 real-world Python task instances, each comprising a codebase with an executable runtime environment, unit tests, and a task specified in natural language."*

**轨迹数据格式**:
- 输出文件: `output.jsonl` (JSON Lines 格式)
- SFT 轨迹 (HuggingFace: `SWE-Gym/OpenHands-SFT-Trajectories`): 491 条，每条轨迹 13-101 条消息

**数据采集 Pipeline**:
1. 环境准备: 从 11 个 Python 仓库收集 PR-based 任务
2. 轨迹 Rollout: 使用 OpenHands agent 在 Docker 环境中执行
   ```bash
   ./scripts/rollout-swe-train-full.sh llm.my-oss-model my_exp_name 1
   ```
3. Rejection Sampling: 只保留成功解决任务的轨迹
4. SFT 转换: 将轨迹转换为对话格式

> *"When fine-tuned on less than 500 agent-environment interaction trajectories sampled from it from GPT-4o and Claude 3.5 Sonnet, we achieve **+14% absolute gains** on SWE-Bench Verified with an 32B LM-powered OpenHands agent."*

**训练方法**: Rejection Sampling Fine-tuning + Verifier Training。32B 模型: SWE-Bench Verified 32.0%, Lite 26.0%。

> *"SWE-Gym is also effective across agent scaffolds. With rejection sampling fine-tuning and MoatlessTools scaffold, our 32B and 7B models achieve 20% and 10% respectively on SWE-Bench Lite through self-improvement."*

---

### 4.3 R2E-Gym (COLM 2025)

| 项目 | 详情 |
|------|------|
| **论文** | R2E-Gym: Procedural Environment Generation and Hybrid Verifiers for Scaling Open-Weights SWE Agents |
| **作者** | Naman Jain, Jaskirat Singh 等 (UC Berkeley, ANU) |
| **会议** | COLM 2025 \| arXiv:2504.07164 |
| **代码** | https://github.com/R2E-Gym/R2E-Gym |

**数据规模**: 8,100+ 问题/任务实例（最大规模 procedurally curated 环境），覆盖 13 个代码仓库。

> *"We create R2E-Gym, the largest procedurally curated gym environment for training real-world SWE-Agents, — consisting of more than **8.1K problems across 13 repos**, with executable gym environments, unit tests, and natural-language task descriptions."*

**环境构建方法: SYNGEN (Commit-based)**

核心创新: 从 commits 而非 PRs 直接生成可执行训练环境。

> *"R2E-Gym is powered by **SWE-GEN** — a novel synthetic data curation recipe that enables collection of a large number of executable training environments **without reliance on human-written pull requests (PRs) or unit tests**."*

SYNGEN Pipeline:
1. **Commit 采集**: 直接从代码库 commits 中提取变更
2. **测试生成 (Test-Generation)**: 为 commit 对应的代码变更自动生成测试
3. **反向翻译 (Back-Translation)**: 从 commit diff 生成自然语言任务描述
4. **环境构建**: 每个 Docker 镜像 ~300-500MB

> *"SYNGEN: a synthetic data curation recipe that enables scalable curation of executable environments using **test-generation and back-translation directly from commits**, thereby reducing reliance on human-written issues or unit tests."*

**轨迹数据格式**:
- Trajectory 对象包含: full agent trajectory, problem statement, max execution time, exit reason, output patch
- SFT 轨迹 (HF: `R2E-Gym/R2EGym-SFT-Trajectories`): 3,231 条训练轨迹, Parquet 格式

> *"The output of the agent is a **Trajectory object**, which contains detailed stats including full agent trajectory, problem statement, max execution time, exit-reason, and output patch."*

**数据采集命令**:
```bash
uv run python src/r2egym/agenthub/run/edit.py runagent_multiple \
  --traj_dir "./traj" \
  --max_workers 54 \
  --dataset "R2E-Gym/R2E-Gym-Lite" \
  --split "train" \
  --llm_name 'gpt-4o' \
  --use_fn_calling True \
  --temperature 0.2 \
  --max_steps 40
```

**可用预采集数据**:

| 数据集 | 用途 |
|--------|------|
| R2E-Gym/R2EGym-SFT-Trajectories | Editing Agent SFT |
| R2E-Gym/R2EGym-TestingAgent-SFT-Trajectories | Testing Agent SFT |
| R2E-Gym/R2EGym-Verifier-Trajectories | Verifier Agent |

---

### 4.4 SWE-smith (Princeton, 2025)

| 项目 | 详情 |
|------|------|
| **论文** | SWE-smith: Scaling Data for Software Engineering Agents |
| **arXiv** | arXiv:2504.21798 |
| **代码** | https://github.com/SWE-bench/SWE-smith |

**数据规模**: 52,000 个任务实例（来自 128 个 GitHub 仓库，250+ 个 Docker 环境镜像），26,000 条 SWE-agent 轨迹。

> *"Using SWE-smith, we create a dataset of **50k instances sourced from 128 GitHub repositories**, an order of magnitude larger than all previous works."*

**环境构建方法 (Mutation-based)**:
1. 为每个仓库构建 Docker 镜像
2. 通过 mutation 自动合成代码变更
3. 只保留破坏测试的变更
4. 为每个任务生成自然语言描述

> *"Given any Python codebase, SWE-smith constructs a corresponding execution environment, then **automatically synthesizes 100s to 1,000s of task instances** that break existing test(s) in the codebase."*

**训练结果**: SWE-agent-LM-32B: 40.2% Pass@1 on SWE-bench Verified。

---

### 4.5 SWE-World (RUC-AIBOX, 2026)

| 项目 | 详情 |
|------|------|
| **论文** | SWE-World: Building Software Engineering Agents in Docker-Free Environments |
| **作者** | Shuang Sun, Huatong Song 等 (RUC-AIBOX) |
| **arXiv** | arXiv:2602.03419 |
| **代码** | https://github.com/RUCAIBox/SWE-World |

**数据规模**: 16,600 个任务，覆盖 3,763 个仓库。整合多个开源数据集。

> *"We construct a unified instance pool from (i) open-source SWE datasets and (ii) a newly curated **SWE-World Dataset (16.6K tasks across 3,763 repositories)**."*

**环境构建方法 (Docker-Free)**: 核心创新: 用学习的代理模型替代物理 Docker 执行环境。

三大组件:
```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Sandbox    │     │    SWT       │     │    SWR       │
│ (导航+编辑) │     │ (执行反馈)   │     │ (奖励信号)   │
│ ls/cat/grep │     │ predict      │     │ test reports │
│ str_replace │     │ stdout/stderr│     │ binary signal│
└─────────────┘     └──────────────┘     └──────────────┘
```

> *"SWE-World leverages LLM-based models trained on real agent-environment interaction data to **predict intermediate execution outcomes and final test feedback**, enabling agents to learn without interacting with physical containerized environments."*

**SFT 训练数据转换** (使用 OpenRLHF 框架):
```python
# Step 1: R2E 格式转 SFT 格式
python ./OpenRLHF_SFT/SFT_data_pre_process/r2e_to_openrlhf_format/0_covert_r2e_format_to_sft_foramt.py
# Step 2: 初始格式过滤
python ./OpenRLHF_SFT/SFT_data_pre_process/r2e_to_openrlhf_format/1_init_format_filter.py
# Step 3: 预分词 multi-turn 交互轨迹
python ./OpenRLHF_SFT/scripts_swe_master/sft_data_pre_tokenize.py
# Step 4: 支持 tool_calls 的预分词
python ./OpenRLHF_SFT/scripts_swe_master/sft_data_pre_tokenize_toolcall.py
```

**关键结果**: Qwen2.5-Coder-32B 从 6.2% 提升到 55.0% (Docker-free SFT+RL), TTS@8 达 68.2%。

---

### 4.6 SWE-Master (RUC-AIBOX, 2026) — 数据整合

| 项目 | 详情 |
|------|------|
| **论文** | SWE-Master: Unleashing the Potential of Software Engineering Agents via Post-Training |
| **arXiv** | arXiv:2602.03411 |
| **代码** | https://github.com/RUCAIBox/SWE-Master |

**多源数据整合**:

| 数据源 | 样本数 | 仓库数 | 成功实例 | 成功轨迹 | 最终 SFT 轨迹 |
|--------|--------|--------|----------|----------|---------------|
| SWE-Gym Real | 2,438 | 11 | 1,068 | 5,685 | 2,948 |
| SWE-rebench Real | 6,542 | 1,429 | 4,268 | 10,861 | 7,157 |
| R2E-Gym Synthetic | 4,578 | 10 | 3,234 | 18,398 | 2,462 |
| SWE-smith Synthetic | 14,103 | 114 | 6,353 | 17,901 | - |

> *"We integrate multiple open-source SWE datasets packaged with Docker environments and generate rollouts with teacher models, then apply filtering to produce SFT-ready trajectories."*

**数据过滤方法**: Rule-based filtering (格式检查、长度过滤) + SWR-based filtering (SWE-World Reward Model 评分) + Best-of-N (BoN) filter。

---

### 4.7 SWE-Factory (FSE 2026)

| 项目 | 详情 |
|------|------|
| **论文** | SWE-Factory: Your Automated Factory for Issue Resolution Training Data and Evaluation Benchmarks |
| **会议** | FSE 2026 \| arXiv:2506.10954 |
| **代码** | https://github.com/DeepSoftwareAnalytics/swe-factory |

**数据规模**: 2,809 个 Python 任务实例 (训练集) + 671 个真实 GitHub issues (四种语言: Python, Java, JavaScript, TypeScript)。成本: $0.047/实例 (GPT-4.1-mini)。

**SWE-Builder (Multi-Agent 环境构建)**:
1. **Repository Explorer** — 自动收集环境设置和测试命令
2. **Environment Manager** — 生成 Dockerfile
3. **Test Manager** — 编写容器内测试脚本
4. **Test Analyst** — 验证环境并编排迭代优化
5. **Evaluation Environment Memory Pool** — 复用成功配置

> *"We introduce **SWE-Builder**, a LLM-based multi-agent system that automates evaluation environment construction."*

**三阶段 Pipeline**: 原始数据收集 → 自动环境构建 → Fail2Pass 验证 (F1=0.99)。

> *"A standardized, exit-code-based log parsing method to automatically extract test status, enabling a fully automated fail2pass validation."*

---

### 4.8 SWE-rebench (Nebius, NeurIPS 2025)

**数据规模**: 21,000+ 交互式 Python SWE 任务，适合 RL 规模化训练。

> *"Using this pipeline, we construct SWE-rebench, a public dataset comprising **over 21,000 interactive Python-based SWE tasks**, suitable for reinforcement learning of SWE agents at scale."*

关键特性: 自动化 + 可扩展的 Pipeline，去污染 (Decontamination) 设计。

> *"A novel, automated, and scalable pipeline to **continuously extract real-world interactive SWE tasks** from diverse GitHub repositories."*

---

### 4.9 训练环境综合对比表

| 项目 | 会议/年份 | 任务数 | 仓库数 | 环境类型 | 数据生成方式 | SWE-Bench Verified |
|------|-----------|--------|--------|----------|-------------|-------------------|
| SWE-Gym | ICML 2025 | 2,438 | 11 | Docker | PR-based | 32.0% |
| R2E-Gym | COLM 2025 | 8,100+ | 13 | Docker | Commit-based (SYNGEN) | 51.0% |
| SWE-smith | arXiv 2025 | 52,000 | 128 | Docker | Mutation-based | 40.2% |
| SWE-rebench | NeurIPS 2025 | 21,000+ | 多样 | Docker | PR-based (自动化) | - |
| SWE-Factory | FSE 2026 | 2,809 | 多语言 | Docker (Multi-Agent) | Issue-based | - |
| SWE-World | arXiv 2026 | 16,600 | 3,763 | **Docker-Free** | 整合 + 学习代理 | 68.2% (TTS) |
| SWE-Master | arXiv 2026 | 整合多源 | 整合 | Docker + Docker-Free | 整合所有上述 | 70.8% (TTS) |

---

## 5. RL 训练方法

### 5.1 DeepSWE (Agentica, 2025) — 纯 RL 训练

| 项目 | 详情 |
|------|------|
| **模型** | https://huggingface.co/agentica-org/DeepSWE-Preview |
| **训练框架** | rLLM (https://github.com/agentica-project/rllm) |
| **训练环境** | R2E-Gym |
| **基础模型** | Qwen3-32B |

**核心特点**: 纯 RL 训练，无 SFT/蒸馏步骤。

**奖励模型: 稀疏结果奖励 (Sparse ORM)**
- 补丁通过所有测试 → 奖励 1
- 补丁未通过 → 奖励 0

**涌现行为**: 仅通过稀疏奖励，模型自主学会了主动思考边界情况和回归测试、根据任务复杂度自适应调整"思考"深度。

**训练算法: GRPO++ (7 项增强)**

| # | 算法 | 来源 | 效果 |
|---|------|------|------|
| 1 | Clip High | DAPO | 提升上限鼓励探索 |
| 2 | No KL Loss | DAPO | 消除对原始 SFT 模型的限制 |
| 3 | No Reward Std Dev | Dr.GRPO | 消除难度偏差 |
| 4 | Length Normalization | Dr.GRPO | 消除长度偏差 |
| 5 | Leave-One-Out | RLOO | 减少策略梯度方差 |
| 6 | Trajectory Filtering | DAPO-inspired | 过滤超时/超长轨迹 |
| 7 | No Entropy Loss | Custom | 防止熵爆炸导致训练崩溃 |

**关键结果**: SWE-Bench Verified 59% Pass@1（开源权重 SOTA），支持 16K → 128K tokens 上下文扩展。

---

### 5.2 SWE-RL (Meta, 2025)

| 项目 | 详情 |
|------|------|
| **论文标题** | SWE-RL: Advancing LLM Reasoning via Reinforcement Learning on Open Software Engineering Tasks |
| **机构** | Meta |
| **arXiv** | arXiv:2502.18449 |

Meta 提出的 SWE 领域 RL 训练方法，将开源软件工程任务作为 RL 训练的自然场景。核心观点是 SWE 任务天然提供可验证的奖励信号（测试是否通过），适合 RL 训练。

---

### 5.3 SWE-Master 的 RL 训练 (RUC-AIBOX, 2026)

**四阶段流水线**:
```
轨迹合成 & 筛选 → 长程 SFT → RLVR (执行反馈) → TTS (SWR 验证)
```

**RL 目标函数 (GRPO)**:
```
J(θ) = E[1/G Σ 1/L_max Σ min(ρ·Â, clip(ρ, β_low, β_high)·Â)]
```

**Group-Relative Advantage**:
```
Â_i = R_i - 1/(G-1) Σ_{j≠i} R_j
```

- 使用可验证奖励信号（来自真实代码执行）
- Group-Relative 比较避免单一轨迹偏差
- **难度分级**: 使用 Minimax-M2 和 GLM-4 评估先验难度
- **双峰分布过滤**: 排除极端（总是解决/总是失败的问题）

**关键结果**: Pass@1 = 61.4%, TTS@8 = 70.8% on SWE-bench Verified。

---

### 5.4 SkyRL-Agent / Skywork-SWE (昆仑万维, 2025)

| 项目 | 详情 |
|------|------|
| **arXiv** | arXiv:2506.19290 |
| **方法** | Rejection Sampling + RL 训练 |

Skywork-SWE 采用两阶段训练：先通过 Rejection Sampling 收集高质量 SFT 数据，再进行 RL 微调。SkyRL-Agent 是其 Agent 组件，专注于 SWE 任务的 RL 训练优化。

---

### 5.5 SWE-Universe (2026)

| 项目 | 详情 |
|------|------|
| **arXiv** | arXiv:2602.02361 |

SWE-Universe 提供大规模 SWE 任务宇宙，旨在为 RL 训练提供多样化的训练环境和任务分布。

---

### 5.6 其他 RL 相关工作

#### daVinci-Dev (2026)
- **arXiv**: arXiv:2601.18418
- **方法**: Mid-training (代码专化预训练) + SFT + RL 对齐
- **特点**: 采用多阶段训练策略，先进行大规模代码语料预训练

#### KAT-Coder / KAT-Dev (快手, 2025-2026)
- **项目**: kwaipilot.github.io
- **方法**: 代码特化预训练 + SWE 任务微调
- **特点**: 快手 AI 团队的代码大模型，专注开发者辅助

#### Kimi-Dev (月之暗面, 2025)
- **arXiv**: arXiv:2509.23045
- **方法**: 大规模代码训练 + SWE-bench 评测
- **特点**: Kimi 系列的开发者版本

---

### 5.7 RL 训练框架对比

| 框架 | 机构 | 特点 | 使用者 |
|------|------|------|--------|
| **rLLM** | Agentica | Agent workflow engine, 支持自定义 agent+env | DeepSWE, SWE-World |
| **verl / verl-agent** | 字节跳动 | 支持 Megatron 后端, 高性能 RL | SWE-World |
| **OpenRLHF** | 开源社区 | 通用 RLHF 框架, 支持 SFT+RL | SWE-Master, SWE-World |
| **LLaMA-Factory** | 开源社区 | 通用微调框架, 支持 SFT | 多个项目 |

**RL 算法对比**:

| 算法 | 使用者 | 奖励信号 | 特点 |
|------|--------|----------|------|
| GRPO | SWE-Master | 可验证奖励 (执行) | Group-Relative 比较 |
| GRPO++ | DeepSWE | 稀疏 0/1 | 7 项增强，纯 RL |
| RLVR | SWE-World, SWE-Master | 可验证奖励 | 使用单元测试作为 reward |
| Rejection Sampling | SWE-Gym, Skywork-SWE | 成功/失败过滤 | 简单但有效 |

---

## 6. 验证器与评估方法

### 6.1 SWE-bench Fail-to-Pass 评估

SWE-bench 使用两种类型的测试作为评估 oracle：

| 测试类型 | 用途 | 说明 |
|---------|------|------|
| **FAIL_TO_PASS** | 主要评估信号 | 在 PR 合入前失败，合入后通过的测试 |
| **PASS_TO_PASS** | 回归检查 | 确保补丁不会破坏现有功能 |

**评估流程**: 每个任务实例提供一个 Docker 镜像 → AI 系统接收 issue 文本并修改代码库 → 运行 Fail-to-Pass 测试 → 运行 Pass-to-Pass 测试。

**数据集构建流水线**:
```
仓库选择 → PR 爬取(~90,000) → 属性过滤 → 执行过滤 → 2,294 任务实例
```

> *"Without the Pull Request's changes, a number of test(s) fail. After the Pull Request is merged, the same set of test(s) pass. These 'Fail-to-Pass' tests are the primary signal for evaluation."* — SWE-bench 官网

---

### 6.2 SWE-Gym Verifier: ORM 奖励模型

| 项目 | 详情 |
|------|------|
| **论文** | arXiv:2412.21139 (ICML 2025) |
| **验证方式** | Execution-free (ORM 验证器) |

**Outcome-Supervised Reward Model (ORM)** 设计：

**输入**: 完整 agent 轨迹 τ = [o₁, a₁, o₂, a₂, …, oₙ, aₙ]

**输出**: 标量奖励 r ∈ [0,1]
```
r = exp(l_YES) / (exp(l_YES) + exp(l_NO))
```

**训练细节**:

| 配置 | 值 |
|------|-----|
| 基础模型 | Qwen2.5-Coder-Instruct-32B |
| 微调方法 | LoRA (优于全参数微调) |
| 训练数据 | 2,636 条轨迹（平衡正负样本） |
| 数据来源 | Off-policy (GPT-4o, Claude-3.5) + On-policy (自生成) |
| 上下文窗口 | 32K tokens |

**关键发现: 数据混合策略**

| 数据策略 | Best@8 性能 |
|----------|------------|
| **混合 off/on-policy** | **27%** (最优) |
| 仅 on-policy | 适中提升 |
| 仅 off-policy | 早期饱和 ~22% |

**Test-Time Scaling (Best-of-N)**:

| 指标 | k=1 | k=8 | k=16 |
|------|-----|-----|------|
| Pass@k | 20.6% | 37.8% | 42.8% |
| Best@k | 20.6% | 29.8% | 32.0% |

> *"Training with a mixture of off-policy and on-policy data yields the best results, reaching a resolution rate of 27@8."*

> *"As shown in Fig. 1 (bottom), the Best@k curve exhibits strong linearity on a logarithmic scale, indicating a promising scaling behavior."*

> *"The 7B verifier plateaus after k=4 samples... In contrast, the 32B verifier continues improving even at k=8, suggesting that verifier size significantly affects scaling behavior."*

---

### 6.3 R2E-Gym 混合验证器 (Hybrid Verifier)

| 项目 | 详情 |
|------|------|
| **论文** | arXiv:2504.07164 (COLM 2025) |
| **验证方式** | Hybrid (Execution-based + Execution-free) |

**核心发现**: 执行验证器和非执行验证器各自饱和在 42-43%，但组合后达到 **51%**。

#### 6.3.1 执行验证器 (Execution-Based, EB)
- 训练专用 **Testing Agent** (基于 Qwen-Coder-32B)
- 为每个候选补丁生成 M=10 个多样化测试
- 评分公式: `s_k^EB = TestScore_k (if RS_k = max_j RS_j), else 0`
- **局限**: 低区分度（<20% 的测试提供区分信号），测试毒性（高达 10%）

#### 6.3.2 非执行验证器 (Execution-Free, EF)
- 微调 Qwen2.5-Coder-14B, LoRA rank 64, 5,700 条轨迹
- 评分公式: `s^EF = P(YES) / (P(YES) + P(NO))`
- **局限**: 启发式偏差（过度依赖轨迹特征而非补丁质量）

#### 6.3.3 混合评分
```
s_k^H = Top_n(s_k^EF) + s_k^EB
Top_n(s_k^EF) = s_k^EF (if 在 top-n 中), else -∞
```

**性能对比**:

| 验证器 | Best@26 |
|--------|---------|
| 仅 Execution-Based | ~43.7% |
| 仅 Execution-Free | ~42.8% |
| **Hybrid** | **51.0%** |
| Pass@26 上限 | 64.4% |

> *"Surprisingly, while each approach individually saturates around 42-43%, significantly higher gains can be obtained by leveraging their complementary strengths."*

> *"While toxic tests are generally rare, we find that for a small but significant subset of problems, testing agents generate toxic tests (up to 10% of total tests) that can erroneously rank incorrect patches above correct ones."*

> *"Increasing the number of editing-agent rollouts from 16 to 21 improves the Best@K performance from 47.6% to 48.4%. In contrast, simply sampling 5 more test-rollouts can yield better gains (Best@K 49.3%)."*

---

### 6.4 SWE-World SWT & SWR

| 项目 | 详情 |
|------|------|
| **论文** | arXiv:2602.03419 |
| **验证方式** | Execution-free (学习型代理环境) |

**SWT (SWE-World Transition Model)**: 模拟 step-level 执行反馈（预测 stdout, stderr, exit status）
- SWT-72B: Resolve Rate 60.2%
- **关键发现**: CoT 对 SWT 带来的增益很小

**SWR (SWE-World Reward Model)**: 替代容器化单元测试，生成结构化测试报告 + 二元成功信号
- SWR-32B: Accuracy 0.754, Precision 0.779
- **关键发现**: CoT 对 SWR 有**显著提升**（与 SWT 形成对比）
- 无 CoT SWR → RL 训练崩溃（reward hacking）
- 有 CoT SWR → RL 训练稳定

> *"SWE-World leverages LLM-based models trained on real agent-environment interaction data to **predict intermediate execution outcomes and final test feedback**, enabling agents to learn without interacting with physical containerized environments."*

**关键结果**: Qwen2.5-Coder-32B 从 6.2% → 55.0% (8.8 倍提升), TTS@8 达 68.2%。

---

### 6.5 CodeMonkeys: Test-Time Compute Scaling

| 项目 | 详情 |
|------|------|
| **论文** | arXiv:2501.14723 (Jan 2025, Stanford) |
| **验证方式** | Hybrid (模型生成测试 + 多轮选择) |

**两轴缩放策略**:
- **串行缩放**: 增加每条轨迹的迭代次数
- **并行缩放**: 增加每个问题的轨迹数

**双阶段选择**: 模型生成测试投票 → 最终多轮选择轨迹

| 配置 | SWE-bench Verified |
|------|-------------------|
| CodeMonkeys 单独 | **57.4%** ($2,300 USD) |
| 集成选择 | **66.2%** |

> *"Scaling test-time compute is a promising axis for improving LLM capabilities."*

---

### 6.6 PRM vs ORM 在 SWE 中的应用

| 维度 | ORM (Outcome Reward Model) | PRM (Process Reward Model) |
|------|---------------------------|---------------------------|
| **评估粒度** | 最终结果整体打分 | 每一步分别打分 |
| **奖励信号** | 稀疏（仅结束时） | 密集（每步反馈） |
| **优势** | 简单，直接映射到任务成功 | 更细粒度学习信号 |
| **劣势** | 难以学习中间步骤质量 | 标注成本高，"步骤"难定义 |

**SWE 领域现状: ORM 主导**
- SWE-Gym: ORM 基于 YES/NO token 预测
- R2E-Gym EF Verifier: ORM
- DeepSWE: 最简单的稀疏 ORM（0/1）
- SWE-World SWR: ORM，生成二元信号

**PRM 在 SWE 中的挑战**: SWE agent 的"步骤"粒度粗且多样，中间步骤正确性难以定义，轨迹很长（32K+ tokens），标注成本极高。

> *"The gap between Pass@k and Best@k, due to the imperfect performance of our trained verifier, indicates there is room for improvements in reward modeling for coding agents."*

---

### 6.7 验证方法全景对比

| 方法 | 验证方式 | 奖励模型 | Test-Time Scaling | SWE-bench Verified |
|------|---------|---------|-------------------|-------------------|
| **SWE-bench** | Execution (F2P) | N/A (benchmark) | N/A | — |
| **SWE-Gym** | Execution-free (ORM) | ORM: YES/NO token | Best-of-N + ORM | 32.0% (Best@16) |
| **R2E-Gym** | **Hybrid** (EB + EF) | EB: test + EF: YES/NO | Best-of-N + Hybrid | **51.0%** (Best@26) |
| **SWE-World** | Execution-free (SWT+SWR) | SWR: binary signal | TTS@K (SWR) | 55.0% → **68.2%** |
| **SWE-Master** | Hybrid (RLVR + SWR) | GRPO + 执行奖励 | 串行+并行 (SWR) | 61.4% → **70.8%** |
| **DeepSWE** | Execution (sparse ORM) | 稀疏 0/1 | Best-of-N + Hybrid | **59.0%** |
| **CodeMonkeys** | Hybrid (test voting) | 模型生成测试 | Serial + Parallel | **57.4%** / **66.2%** |

**关键趋势**:
1. 从纯执行走向混合验证
2. 无 Docker 趋势 (SWE-World)
3. Test-Time Scaling 成为标配
4. ORM 仍是主流, PRM 是潜在方向
5. 稀疏奖励的意外成功 (DeepSWE)
6. 验证器规模影响缩放 (32B > 7B)

---

## 7. 2026 年最新进展

### 7.1 重大项目总览

| 项目 | 机构 | 时间 | 核心贡献 | SWE-bench Verified |
|------|------|------|----------|-------------------|
| SWE-World | RUC-AIBOX | 2026.02 | Docker-Free 世界模型训练 | 68.2% (TTS@8) |
| SWE-Master | RUC-AIBOX | 2026.02 | 端到端后训练 (SFT+RLVR+TTS) | 70.8% (TTS@8) |
| SWE-Factory | 中山大学 | 2026 (FSE) | Multi-Agent 自动环境构建 | — |
| SWE-ContextBench | — | 2026.02 | 评估经验复用能力 | — |
| SWE-Universe | — | 2026.02 | 大规模 SWE 任务宇宙 | — |
| daVinci-Dev | — | 2026.01 | Mid-training + SFT + RL | — |
| mini-SWE-agent | — | 2026 | 轻量级 SWE Agent | — |
| Devstral 2 | Mistral | 2026 | 123B 开源 SWE 模型 | 72.2% |
| Qwen3-Coder-Next | 阿里巴巴 | 2026.03 | 代码大模型新版本 | — |
| OpenHands-LM | All-Hands-AI | 2026 | OpenHands 专用模型 | — |

### 7.2 关键观察

**1. Docker-Free 训练成为新方向**

SWE-World 证明可以用学习的世界模型（SWT + SWR）完全替代 Docker 执行环境进行 SFT 和 RL 训练。这大幅降低了训练门槛：
- 无需管理数千个 Docker 镜像
- RL 训练速度提升（无需等待容器化测试执行）
- 但准确性仍有差距（SWR accuracy ~77%）

**2. 性能快速提升**

从 2024 年的 1.96% 到 2026 年的 76.8%，SWE-bench Verified 上的解决率在两年内提升了 39 倍。开源模型也从 40.2% (SWE-agent-LM, 2025.04) 提升到 72.2% (Devstral 2, 2026)。

**3. 数据污染问题引起高度关注**

- SWE-MERA 报告 SWE-bench 有 32.67% 的解决方案存在直接泄漏
- OpenAI 宣布弃用 SWE-bench Verified 作为主要评测（2026年初）
- SWE-bench Live、SWE-rebench 等动态基准成为替代
- 多个新基准（SWE-MERA, SWE-Bench Pro）专注抗污染

**4. 开源 vs 闭源差距缩小**

| 时期 | 闭源最高 | 开源最高 | 差距 |
|------|---------|---------|------|
| 2024 H2 | ~45% | ~15% | 30pp |
| 2025 H1 | ~55% | 40.2% | 15pp |
| 2025 H2 | ~65% | 59% | 6pp |
| 2026 Q1 | 76.8% | 72.2% | 4.6pp |

**5. Multi-Agent 和模块化成为趋势**

SWE-Factory 的 SWE-Builder（5个 Agent 协作构建环境）、SWE-Lego 的模块化架构、CodeMonkeys 的多轮选择策略，都反映了从单一 Agent 向 Multi-Agent 系统的转变。

---

## 8. 轨迹数据格式与生成实践指南

### 8.1 通用轨迹数据格式

```json
{
  "instance_id": "repo__owner__repo_name-12345",
  "messages": [
    {"role": "system", "content": "You are a programming agent that can interact with a computer to solve tasks..."},
    {"role": "user", "content": "<problem_statement>\nFix the bug in function X that causes Y when Z...\n</problem_statement>"},
    {"role": "assistant", "content": "Let me start by understanding the issue. I'll first look at the relevant file.\n<execute_bash>\nfind /repo -name '*.py' | xargs grep 'function_X'\n</execute_bash>"},
    {"role": "user", "content": "<observation>\n/repo/src/module.py:42: def function_X(param):\n</observation>"},
    {"role": "assistant", "content": "Found it. Let me examine the function more closely.\n<execute_bash>\ncat -n /repo/src/module.py\n</execute_bash>"},
    {"role": "user", "content": "<observation>\n...(file content)...\n</observation>"},
    {"role": "assistant", "content": "I can see the bug. The issue is...\n<str_replace>\n...(edit)...\n</str_replace>"}
  ],
  "patch": "diff --git a/src/module.py b/src/module.py\n...",
  "resolved": true
}
```

**存储格式**: JSONL / Parquet
**每条轨迹**: 13-101 条消息（多轮交互）

### 8.2 SFT 数据转换通用流程

```
1. Agent 在环境中执行 rollout → 生成 output.jsonl
2. 过滤成功轨迹 (rejection sampling / fail2pass)
3. 转换为 messages 格式 (system/user/assistant 多轮对话)
4. 预分词 (tokenize multi-turn trajectories)
5. 使用 OpenRLHF / 标准 SFT 框架训练
```

### 8.3 快速上手路径

**路径 A: 使用现有 SFT 轨迹（最快）**
1. 下载 HuggingFace 上的预采集轨迹:
   - `SWE-Gym/OpenHands-SFT-Trajectories` (491 条)
   - `R2E-Gym/R2EGym-SFT-Trajectories` (3,231 条)
2. 使用 OpenRLHF 或 LLaMA-Factory 进行 SFT 训练

**路径 B: 自采集轨迹 + SFT**
1. 选择训练环境: SWE-Gym (最成熟) 或 R2E-Gym (更大规模)
2. 使用强力 teacher model (GPT-4o / Claude 3.5) 生成轨迹
3. Rejection Sampling: 只保留成功轨迹
4. 转换为 SFT 格式并训练

**路径 C: 自采集 + RL 训练（最强）**
1. 在 SWE-Gym / R2E-Gym 环境中进行 SFT (路径 B)
2. 使用 rLLM / OpenRLHF 框架进行 GRPO/RLVR 训练
3. 奖励信号: 单元测试通过/失败
4. 可选: 使用 SWE-World Docker-Free 模式加速 RL

### 8.4 数据质量控制方法表

| 方法 | 使用者 | 原理 | 效果 |
|------|--------|------|------|
| Rejection Sampling | SWE-Gym | 只保留成功轨迹 | 基础必备 |
| Fail2Pass Validation | SWE-Factory | 验证补丁确实修复测试 | F1=0.99 |
| Best-of-N (BoN) | SWE-Master | 多轨迹选最优 | 提升轨迹质量 |
| Rule + Model Filter | SWE-World | 格式检查 + SWR 评分 | 综合过滤 |
| Decontamination | SWE-rebench | 持续新鲜任务 | 避免污染 |
| Per-Instance Capping | SWE-Gym | Cap=2 避免偏差 | 平衡训练 |
| 难度分级过滤 | SWE-Master | 排除极端难度 | 双峰分布过滤 |

---

## 9. 参考文献

### Benchmark 相关
1. Jimenez et al., "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" ICLR 2024. arXiv:2310.06770
2. OpenAI, "Introducing SWE-bench Verified." Blog, 2024.08
3. Yang et al., "SWE-bench Multimodal: Do AI Systems Generalize to Visual Software Domains?" ICLR 2025. arXiv:2410.03859
4. Rashid et al., "SWE-PolyBench: A Multi-Language Benchmark for Repository Level Evaluation of Coding Agents." 2025. arXiv:2504.08703
5. Zan et al., "Multi-SWE-bench: A Multilingual Benchmark for Issue Resolving." 2025. arXiv:2504.02605
6. Zan et al., "SWE-bench-java: A GitHub Issue Resolving Benchmark for Java." 2024. arXiv:2408.14354
7. Li et al., "DevBench: A Comprehensive Benchmark for Software Development." 2024. arXiv:2403.08604
8. Deng et al., "SWE-Bench Pro: Can AI Agents Solve Long-Horizon Software Engineering Tasks?" 2025. arXiv:2509.16941
9. Zhang et al., "SWE-bench Goes Live!" NeurIPS 2025. arXiv:2505.23419
10. Badertdinov et al., "SWE-rebench: An Automated Pipeline for Task Collection and Decontaminated Evaluation." NeurIPS 2025. arXiv:2505.20411
11. Adamenko et al., "SWE-MERA: A Dynamic Benchmark for Agenticly Evaluating LLMs on Software Engineering Tasks." 2025. arXiv:2507.11059
12. Yang et al., "SWE-smith: Scaling Data for Software Engineering Agents." 2025. arXiv:2504.21798
13. Zhu et al., "SWE Context Bench: A Benchmark for Context Learning in Coding." 2026. arXiv:2602.08316

### Agent 系统相关
14. Yang et al., "SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering." NeurIPS 2024. arXiv:2405.15793
15. Wang et al., "OpenHands: An Open Platform for AI Software Developers as Generalist Agents." arXiv:2407.16741
16. Xia et al., "Agentless: Demystifying LLM-based Software Engineering Agents." 2024. arXiv:2407.01489
17. Zhang et al., "AutoCodeRover: Autonomous Program Improvement." 2024. arXiv:2404.05427

### 训练环境相关
18. Pan et al., "Training Software Engineering Agents and Verifiers with SWE-Gym." ICML 2025. arXiv:2412.21139
19. Jain et al., "R2E-Gym: Procedural Environment Generation and Hybrid Verifiers for Scaling Open-Weights SWE Agents." COLM 2025. arXiv:2504.07164
20. Sun et al., "SWE-World: Building Software Engineering Agents in Docker-Free Environments." 2026. arXiv:2602.03419
21. Song et al., "SWE-Master: Unleashing the Potential of Software Engineering Agents via Post-Training." 2026. arXiv:2602.03411
22. Guo et al., "SWE-Factory: Your Automated Factory for Issue Resolution Training Data and Evaluation Benchmarks." FSE 2026. arXiv:2506.10954

### RL 训练相关
23. Agentica, "DeepSWE: A 32B Software Engineering Agent Trained with Purely RL." 2025. HuggingFace: agentica-org/DeepSWE-Preview
24. rLLM Framework. GitHub: agentica-project/rllm
25. Meta, "SWE-RL: Advancing LLM Reasoning via Reinforcement Learning on Open Software Engineering Tasks." 2025. arXiv:2502.18449
26. Skywork-SWE. 2025. arXiv:2506.19290
27. SWE-Universe. 2026. arXiv:2602.02361
28. daVinci-Dev. 2026. arXiv:2601.18418
29. Kimi-Dev. 2025. arXiv:2509.23045

### 验证器相关
30. Ehrlich et al., "CodeMonkeys: Scaling Test-Time Compute for Software Engineering." 2025. arXiv:2501.14723

### 其他 2026 新工作
31. Devstral 2. Mistral AI, 2026.
32. Qwen3-Coder-Next. 阿里巴巴, 2026. arXiv:2603.00729
33. OpenHands-LM. All-Hands-AI, 2026.

---

> **报告结束** | 调研日期: 2026-03-07 | 覆盖论文/项目: 33+

