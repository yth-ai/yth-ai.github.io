---
title: "创刊回顾：2026 Q1 数据工程重要论文盘点"
description: "从自动化数据策展到质量幻觉，盘点 2026 年第一季度最值得关注的预训练数据研究"
date: 2026-03-22
series: "数据论文速递"
volume: 1
tags: ["数据策展", "数据质量", "合成数据", "Scaling Laws", "多语言数据", "创刊特辑"]
---

## 创刊寄语

> 「数据论文速递」今天正式创刊。在这个大模型能力高度依赖训练数据质量的时代，关于"如何选数据、洗数据、配数据"的研究正在成为一个独立且快速发展的学科方向。本期作为创刊特辑，我们回顾 2026 年 Q1 最重要的数据工程论文，为读者建立一个完整的研究图景。

---

## 重点论文解读

### 1. Data Darwinism Part II: DataEvolve — AI 可以自主进化数据策展策略

**作者**：Tiantian Mi, Dongming Shan, Zhen Huang 等 | **机构**：上海交通大学
**链接**：[arXiv](https://arxiv.org/abs/2603.14420)（2026 年 3 月）

**核心发现**：

这篇论文可能是 Q1 最令人兴奋的数据工程工作。Data Darwinism 系列的第一部分建立了数据处理的十级层次结构，指出更精细的处理可以释放更大的数据价值。但面对包含数百种异构类别的现代预训练语料库，为每个类别手动设计策略是不现实的。

DataEvolve 框架的核心思路是**让 AI 自动进化数据清洗策略**。针对每个数据类别，框架在一个封闭的进化循环中运行：识别质量问题 → 生成候选策略 → 执行策略 → 评估结果 → 跨代优化。通过经验池（发现的问题）和策略池（追踪迭代性能）来积累知识。

在 Nemotron-CC 的 672B tokens 上应用后，DataEvolve 生成了 **Darwin-CC**（504B tokens）。用 500B tokens 训练 3B 模型的测试中，Darwin-CC 比原始数据高出 **+3.96 分**（18 个基准测试平均 44.13），**超越了 DCLM、Ultra-FineWeb 和 FineWeb-Edu** 等知名数据集。

**对数据工作的启示**：

> 数据策展正在从"人工设计规则"走向"AI 自动演进规则"。DataEvolve 的实验结论值得重视：进化后的策略最终收敛到**以清理为主**的方法——有针对性的噪声去除、格式规范化、领域感知的保留。这意味着对于大多数数据，"精细清洗"比"花哨的合成增强"更有效。
>
> 实操建议：如果你的语料库有多种来源类型，不要试图用一套规则通杀。考虑为每种类别建立独立的清洗策略，并用小模型验证效果来迭代。

---

### 2. DataMan: Data Manager for Pre-training Large Language Models

**作者**：Ru Peng, Kexin Yang, Yawen Zeng, Junyang Lin 等 | **机构**：阿里巴巴通义实验室、浙江大学
**链接**：[arXiv](https://arxiv.org/abs/2502.19363) · [ICLR 2025](https://openreview.net/forum?id=eNbA8Fqir4)

**核心发现**：

DataMan 的创新在于**让 LLM 自己告诉你什么样的数据对它有帮助**。具体做法是通过提示 LLM 自我识别哪些标准有利于其性能提升，从而推导出 **14 个质量标准**和 **15 个应用领域**分类。基于这套体系，DataMan 对 447B tokens 的预训练语料进行了全面标注。

关键实验结果：使用 DataMan 选取 **30B tokens** 训练 1.3B 模型，在上下文学习（ICL）、困惑度和指令遵循能力上显著优于基线——甚至优于数据量多 50% 的均匀采样模型。

一个重要发现：**PPL 与下游任务性能之间存在不一致性**。低 PPL 的数据不一定带来更好的 ICL 能力。这挑战了"低困惑度 = 高质量"的常见假设。

**对数据工作的启示**：

> DataMan 提供了一个实用的数据质量评估框架：不要只看 PPL，要从多个维度评估数据质量。14 个标准涵盖了事实性、连贯性、丰富性、多样性等维度，可以直接借鉴。
>
> 更重要的启示：**用更少但更好的数据可以打败用更多但质量一般的数据**。30B vs 45B 的对比说明，在数据预算有限时，精选数据比堆量更有效。

---

### 3. The Data-Quality Illusion: Rethinking Classifier-Based Quality Filtering

**作者**：多机构合作 | **链接**：[arXiv](https://arxiv.org/abs/2510.00866) · [NeurIPS 2025](https://openreview.net/forum?id=vSBACt34gS)

**核心发现**：

这篇论文对当前最流行的数据过滤方法——**基于分类器的质量过滤（CQF）**——提出了根本性质疑。CQF 的做法是训练一个分类器（如 fastText 或 BERT）来区分"高质量"和"低质量"文本，然后只保留高质量数据。这是 FineWeb-Edu、DCLM 等知名数据集的核心方法。

论文发现了一个悖论：CQF 确实能提升下游任务性能，但原因可能**不是因为它筛选了"高质量"数据，而是因为它引入了某种分布偏差**——过滤后的数据在风格和主题上偏向训练分类器时的参考分布（如 Wikipedia），这种偏差恰好有利于某些 benchmark。

关键证据：用完全不同的"质量"定义训练分类器，得到的过滤结果在 benchmark 上的表现竟然相似。这说明 CQF 的收益更多来自"分布对齐"而非真正的"质量提升"。

**对数据工作的启示**：

> 这是一记警钟。如果你的数据管线依赖 CQF，需要重新审视：
> 1. **CQF 不是万能药**——它的效果可能部分来自对 benchmark 分布的过拟合
> 2. **多样性很重要**——过度过滤可能在提升 benchmark 分数的同时损害模型的通用能力
> 3. **建议组合使用多种方法**——CQF + 规则过滤 + 去重 + 领域平衡，不要只依赖单一方法

---

### 4. FineWeb2: One Pipeline to Scale Them All

**作者**：HuggingFace 团队 | **链接**：[arXiv](https://arxiv.org/abs/2506.20920) · [GitHub](https://github.com/huggingface/fineweb-2) · [HuggingFace](https://huggingface.co/datasets/epfml/FineWeb2-HQ)

**核心发现**：

FineWeb2 是 HuggingFace 对 FineWeb 的多语言扩展。最初的 FineWeb 专注英文，而 FineWeb2 提出了一套**可自动适配到任何语言**的预训练数据处理管线。

核心贡献：(1) 一个统一的多语言数据处理框架，涵盖提取、去重、质量过滤全流程；(2) **FineWeb2-HQ**——一个经过模型过滤的高质量子集，覆盖 20 种语言；(3) 实验显示使用 FineWeb2-HQ 可以实现约 **6 倍的预训练加速**。

**对数据工作的启示**：

> 如果你在做中文或多语言模型的数据工作，FineWeb2 的管线设计值得仔细研究。尤其是它的"one pipeline"理念——不是为每种语言从头设计处理流程，而是建立一套可参数化调整的统一管线。这在工程效率上有巨大优势。
>
> FineWeb2-HQ 也是一个很好的基准：对你自己的中文数据集，可以对标 FineWeb2-HQ 的指标来评估质量。

---

## 值得关注的其他工作

| 论文 | 机构 | 亮点 |
|------|------|------|
| [**Demystifying Synthetic Data in LLM Pre-training**](https://aclanthology.org/2025.emnlp-main.544/) | 多机构 | EMNLP 2025，系统分析合成数据在预训练中的真实效果 |
| [**D4: Document De-Duplication and Diversification**](https://arxiv.org/abs/2308.12284) | 多机构 | NeurIPS 2024，证明去重+多样化比单纯去重更有效 |
| [**Judging Quality Across Languages**](https://aclanthology.org/2025.emnlp-main.449/) | 多机构 | EMNLP 2025，多语言数据质量评估基准 |

---

## 本期思考

> 回顾这些工作，2026 Q1 数据工程领域的一个核心主题正在浮现：**从人工规则到自动化**。
>
> - DataEvolve 让数据策展策略的设计自动化
> - DataMan 让质量评估标准的制定自动化
> - FineWeb2 让多语言管线的适配自动化
>
> 同时，Data-Quality Illusion 提醒我们保持清醒：自动化不等于正确，我们需要更好的评估方法来验证数据质量，而不仅仅依赖 benchmark 分数。
>
> 这个领域正在从"手艺活"变成"工程学科"，对数据团队的要求也在从"会写脚本"升级为"懂得设计实验、验证假设、迭代优化"。这正是本专栏想要追踪和解读的方向。

---

*从下期开始，「数据论文速递」将每日更新，精选 3-6 篇最新的数据工程相关论文。*
