---
title: "Beyond Language Modeling 精读：Meta 用受控实验揭示多模态预训练的四大定律"
description: "Yann LeCun & Saining Xie 领衔 21 位研究者，从零开始训练统一多模态模型，发现 RAE 统一视觉表示、视觉-语言协同效应、世界建模涌现、MoE 调和扩展不对称性四大关键洞察"
date: 2026-03-27
category: 论文精读
tags: ["多模态预训练", "Transfusion", "MoE", "世界建模", "扩展定律", "RAE", "Meta FAIR", "Yann LeCun"]
paperTitle: "Beyond Language Modeling: An Exploration of Multimodal Pretraining"
authors: "Shengbang Tong, David Fan, John Nguyen, Ellis Brown, Gaoyue Zhou, Shengyi Qian, Boyang Zheng, Théophane Vallaeys, Junlin Han, Rob Fergus, Naila Murray, Marjan Ghazvininejad, Mike Lewis, Nicolas Ballas, Amir Bar, Michael Rabbat, Jakob Verbeek, Luke Zettlemoyer, Koustuv Sinha, Yann LeCun, Saining Xie"
arxiv: "2603.03276"
draft: false
---

# Beyond Language Modeling 精读：Meta 用受控实验揭示多模态预训练的四大定律

> **PAPER DEEP READING / arXiv:2603.03276**
> **机构**: Meta FAIR, New York University
> **作者**: Shengbang Tong, David Fan, ... Yann LeCun, Saining Xie（共 21 人）
> **项目主页**: https://beyond-llms.github.io/

| 核心指标 | 内容 |
|---------|------|
| 研究范式 | 从零预训练（非语言模型初始化） |
| 框架 | Transfusion（文本自回归 + 视觉扩散） |
| 关键发现 | 4 个核心洞察 + 首个统一多模态扩展定律 |
| 最大模型 | 13.5B 参数（1.5B 活动，MoE） |
| 数据类型 | 文本、视频、图文对、动作条件视频 |

---

## 为什么这篇论文重要

这不是又一篇"我们的多模态模型很强"的技术报告。**这是一篇纯粹的科学论文**——Meta FAIR 团队刻意放弃了从预训练语言模型初始化的捷径，选择从零开始训练，用受控实验逐一隔离变量，只为回答一个根本问题：

**视觉和语言能否在同一个模型中共存而不相互损害？**

在 2026 年几乎所有多模态模型都建立在强大语言模型之上的今天，这种"从零开始"的实验哲学极其罕见。正因如此，它的结论才格外值得信赖。

---

## 目录

1. [核心哲学：走出柏拉图的洞穴](#一核心哲学走出柏拉图的洞穴)
2. [关键认知一：一个编码器统一理解与生成](#二关键认知一一个编码器统一理解与生成)
3. [关键认知二：视觉帮助语言，而非损害](#三关键认知二视觉帮助语言而非损害)
4. [关键认知三：世界建模从通用训练中涌现](#四关键认知三世界建模从通用训练中涌现)
5. [关键认知四：MoE 调和扩展不对称性](#五关键认知四moe-调和扩展不对称性)
6. [扩展定律：视觉比语言更"吃"数据](#六扩展定律视觉比语言更吃数据)
7. [涌现的专家专业化](#七涌现的专家专业化)
8. [批判性思考与局限](#八批判性思考与局限)
9. [对实践者的启示](#九对实践者的启示)

---

## 一、核心哲学：走出柏拉图的洞穴

论文开篇用了一个极具说服力的哲学比喻：

> 📜 **原文 (Section 1)**:
> *"Borrowing Plato's cave allegory, language models have mastered the shadow descriptions on the wall without ever seeing the objects that cast them. They capture symbols well, but miss the high-fidelity physics, geometry, and causal relationships of the physical world."*

翻译：**语言模型精通了墙上影子的描述，却从未见过投射影子的物体。它们很好地捕捉了符号，但错过了物理世界的高保真物理、几何和因果关系。**

这个比喻精确地定义了问题。LLM 处理的是现实的"有损压缩"——文本。无论 GPT、Claude 还是 Gemini 的语言能力多强，它们本质上都在操作影子。要走出洞穴，必须直接建模"源头"——视觉世界。

更关键的是实用层面的论证：

> 📜 **原文 (Section 1)**:
> *"Beyond this philosophical limitation, there is a hard practical ceiling: high-quality text data is finite, and is approaching exhaustion. In contrast, the visual world holds an inexhaustible stream of signals outside the cave, capturing the raw dynamics of reality that language misses."*

**高质量文本数据是有限的，且正在枯竭。相比之下，视觉世界拥有取之不尽的信号流。** 这不是哲学空谈，而是当前训练范式面临的硬性天花板。

### 🧠 关键认知

**数据枯竭是确定的未来。** 当文本数据用尽时，视觉不只是"有用的补充"，而是唯一的扩展方向。这篇论文的价值在于：它不是在宣传自家产品，而是在为整个领域绘制通往下一个范式的地图。

---

## 二、关键认知一：一个编码器统一理解与生成

这是论文最出乎意料的发现之一。长期以来，业界普遍认为：
- **理解**需要语义编码器（如 SigLIP、CLIP）
- **生成**需要像素级编码器（如 VAE）
- 因此需要双编码器架构（如 Janus、BAGEL）

论文打破了这个假设：

> 📜 **原文 (Section 3)**:
> *"Semantic encoders consistently outperform VAE-based encoders in both visual understanding and generation. For example, SigLIP 2 not only surpasses FLUX.1 in VQA, but also outperforms FLUX.1 on image generation benchmarks such as DPGBench and GenEval. This suggests a single encoder suffices for both visual understanding and generation."*

**SigLIP 2（一个语义编码器）不仅在理解任务上优于 VAE，在生成任务上也优于 VAE**。这意味着我们完全不需要双编码器架构。

这里的核心技术是 **RAE（Representation Autoencoder）**——它证明了扩散模型可以在高维语义潜在空间中有效运行，不需要压缩到低维 VAE 空间。

| 编码器 | 理解（VQA） | 生成（DPGBench） | 文本困惑度 |
|--------|-----------|----------------|----------|
| SD-VAE | 低 | 中 | 正常 |
| FLUX.1 VAE | 低 | 中高 | 正常 |
| **SigLIP 2 (RAE)** | **高** | **高** | **正常** |
| DINOv2 (RAE) | 中 | 中 | 正常 |
| 原始像素 | 中 | 低 | 正常 |

### 🧠 关键认知

**"理解和生成需要不同表示"是一个过时的假设。** 高维语义表示同时擅长两者。这大幅简化了多模态模型架构——不再需要像 Janus 那样的双路径设计。对于工程实践，这意味着更少的参数、更低的复杂度、更容易的训练。

---

## 三、关键认知二：视觉帮助语言，而非损害

"模态竞争"是多模态预训练最大的恐惧——加入视觉数据是否会损害语言能力？论文给出了明确回答：

> 📜 **原文 (Section 4.1)**:
> *"Text + Video achieves the best perplexity across all data mixes on DCLM, even surpassing the text-only baseline, suggesting raw video data is compatible with, and may even benefit, language modeling."*

**文本+视频的组合在语言困惑度上甚至优于纯文本基线。** 视觉数据不仅没有损害语言，反而帮助了语言。

更令人惊讶的是协同效应的存在：

> 📜 **原文 (Section 4.3)**:
> *"Adding text tokens to a fixed visual budget consistently improves diffusion loss and GenEval score, clearly surpassing the multimodal-only baseline. This suggests visual minimally impacts language, while language helps visual."*

> 📜 **原文 (Section 4.3)**:
> *"Supplementing 20B VQA tokens with heterogeneous data—video, MetaCLIP, or text—yields higher accuracy than training on 100B VQA tokens alone. This suggests simply scaling task-specific data is less effective than diversifying pretraining."*

**用 20B 异构数据补充训练，效果优于用 100B 同质 VQA 数据**。这是对"数据越多越好"简单思维的直接反驳——**数据多样性比数据量更重要**。

那么"模态税"（modality tax）从何而来？论文精确定位了两个来源：

> 📜 **原文 (Section 8)**:
> *"The 'modality tax' has two identifiable sources, neither of which is the visual modality itself. First is data: friction comes from distributional shift in image-text captions, not vision per se. Second is architecture: dense models rigidly partition capacity across modalities."*

### 🧠 关键认知

**所谓的"模态竞争"不是视觉的问题，而是数据分布偏移和架构限制的问题。** 解决方案不是避开视觉，而是：(1) 精心管理图文数据的分布，(2) 使用 MoE 等灵活架构。这颠覆了"多模态训练必然损害语言"的行业共识。

---

## 四、关键认知三：世界建模从通用训练中涌现

论文最具前瞻性的发现是关于世界建模的。他们没有为世界建模设计特殊架构——只是在统一模型上加入动作条件视频数据：

> 📜 **原文 (Section 5)**:
> *"Unlike NWM which encodes navigation actions as specialized continuous vectors, we directly represent actions as standard text tokens (i.e. digit strings)."*

动作就是文本。没有特殊编码、没有架构修改——一个统一模型自然学会了预测"如果执行这个动作，世界会变成什么样"。

更惊人的是数据效率：

> 📜 **原文 (Section 5.2)**:
> *"Scaling domain-specific NWM data from 50B to 100B tokens yields modest improvement, but multimodal pretraining provides better results... we observe the model reaches competitive performance with only 1% of in-domain data."*

**仅用 1% 的领域内数据就能达到竞争性能。** 世界建模能力不是从特定训练数据中"学来"的，而是从通用多模态预训练中"涌现"的。

甚至能响应自然语言命令生成轨迹（如"get out of the shadow!"），这完全是分布外的能力。

### 🧠 关键认知

**世界模型不需要专门训练。** 如果你的多模态预训练足够多样化，模型会自发发展出对物理世界的理解——只需极少量的领域数据来"激活"这种潜能。这暗示未来的基础模型可能天然就是世界模型，"多模态模型"和"世界模型"的界限正在消失。

---

## 五、关键认知四：MoE 调和扩展不对称性

论文发现了一个优雅的问题-解决对：

**问题**：视觉和语言有根本不同的扩展需求——语言需要大模型（参数饥渴），视觉需要大数据（数据饥渴）。在稠密模型中，这是不可调和的矛盾。

**解决方案**：MoE（混合专家）自然调和了这种不对称性。

> 📜 **原文 (Section 7)**:
> *"Under the sparse regime, language exhibits a ≈ 0.41, b ≈ 0.59, while vision exhibits a ≈ 0.36, b ≈ 0.64. MoE reduces the parameter-scaling exponent gap from 0.10 (dense) to 0.05."*

稠密模型中语言和视觉的参数扩展指数差距为 0.10，MoE 将其缩小到 0.05。

> 📜 **原文 (Section 7)**:
> *"Transitioning to MoE reduces the scaling asymmetry: the language data exponent increases, shifting toward vision's data-intensive regime. Sparsity thus provides a practical architectural lever to balance the divergent data demands of a unified model."*

为什么 MoE 有效？因为稀疏性让模型可以**同时**拥有语言需要的大参数量（通过总专家数）和视觉需要的高效计算（通过稀疏激活）。

### 🧠 关键认知

**MoE 不只是一个效率技巧，它是统一多模态模型的必要架构选择。** 稠密模型无法同时满足语言的参数需求和视觉的数据需求，MoE 通过解耦总容量和活动计算解决了这个根本矛盾。

---

## 六、扩展定律：视觉比语言更"吃"数据

这是论文最具实用价值的贡献之一——首个统一多模态模型的 IsoFLOP 扩展定律。

**稠密模型扩展定律：**

| 模态 | 参数指数 a | 数据指数 b | 特性 |
|------|----------|----------|------|
| 语言 | 0.47 | 0.53 | 近乎平衡（符合 Chinchilla） |
| 视觉 | 0.37 | 0.63 | **明显偏向数据** |

语言遵循经典的 Chinchilla 扩展——参数和数据几乎等权。但视觉的数据指数高达 0.63，这意味着**给视觉加数据的边际收益远大于加参数**。

**MoE 模型扩展定律：**

| 模态 | 参数指数 a | 数据指数 b |
|------|----------|----------|
| 语言 | 0.41 | 0.59 |
| 视觉 | 0.36 | 0.64 |

MoE 让语言也变得更"吃数据"，从而缩小了两种模态的扩展差距。

### 🧠 关键认知

**给多模态模型投入计算资源时，视觉和语言需要不同的策略。** 语言可以通过加大模型获益，但视觉主要通过加数据获益。这对训练预算分配有直接指导意义：如果你的视觉性能不够好，先加数据而不是加参数。

---

## 七、涌现的专家专业化

论文分析了 13.5B MoE 模型中专家分配的涌现模式，发现了三个惊人的规律：

**1. 模态专业化自然涌现**

> 📜 **原文 (Section 6.2)**:
> *"Despite employing auxiliary load-balancing losses that encourage uniform utilization, the model allocates significantly more experts to text than to vision. This emergent asymmetry aligns with our later-derived scaling laws: language is parameter-hungry while vision is data-hungry, so the model naturally channels more dedicated capacity to language via MoE."*

即使有负载平衡损失试图让专家均匀利用，模型仍然自发地为语言分配更多专家。**模型自己发现了"语言需要更多参数"这个规律。**

**2. 深度演化：先分离后整合**

> 📜 **原文 (Section 6.2)**:
> *"Early layers are dominated by text-specific experts, while later layers contain increasing proportions of visual and multimodal experts. This suggests the model learns a separate-then-integrate processing strategy."*

早期层：文本专家主导（先理解各自模态）→ 后期层：多模态专家增加（整合跨模态信息）。

**3. 视觉专家是通用的**

视觉专家在不同扩散噪声步骤间不会专门化，且理解和生成共享同一组专家（相关性 r ≥ 0.90）。这进一步证实了"一个编码器够用"的发现。

### 🧠 关键认知

**MoE 的价值不仅在于效率，更在于它让模型自主发现最优的计算资源分配策略。** 人工设计的分离（如 MoT、双编码器）不如让 MoE 从数据中学习。这是"让数据说话"哲学的又一次胜利。

---

## 八、批判性思考与局限

这篇论文质量很高，但也有需要注意的局限：

### 1. 规模局限
最大模型只有 13.5B 参数。虽然扩展定律提供了外推依据，但在 100B+ 规模上这些结论是否成立尚未验证。尤其是模态竞争问题可能在超大规模上表现不同。

### 2. RAE 依赖
统一编码器的优势很大程度上依赖于 RAE 解码器的质量。如果 RAE 解码器不够好，SigLIP 的生成优势可能不成立。论文没有讨论 RAE 训练本身的成本和复杂度。

### 3. 评估偏向学术基准
DPGBench、GenEval 等是学术基准。在真实的工业级图像生成场景（如广告创意、商品图）中，VAE-based 模型的优势可能仍然存在。

### 4. 世界建模的范围有限
虽然导航任务的结果很有说服力，但"世界建模"涵盖的范围远比导航广。物理推理、因果推断、长期规划等更复杂的世界建模任务没有被评估。

### 5. 工程实践差距
论文是纯粹的科学研究，没有给出可以直接复现的完整训练配方。从研究发现到可用产品之间还有大量工程工作。

---

## 九、对实践者的启示

### 对多模态模型开发者

1. **放弃双编码器**：如果你还在用 VAE + CLIP 的双路径架构，考虑切换到单一 RAE-based 编码器。更简单、更强。
2. **拥抱 MoE**：不是因为效率，而是因为它是解决模态扩展不对称性的正确方案。高粒度 MoE（G=16）是关键。
3. **视觉优先加数据**：如果视觉性能不够好，先尝试增加数据多样性，而不是增加模型参数。

### 对大模型训练者

4. **多样性 > 数量**：20B 异构数据优于 100B 同质数据。在构建训练数据集时，优先考虑模态多样性。
5. **文本数据枯竭后的出路**：视觉（尤其是视频）是扩展数据的主要来源。现在就开始积累视频数据管线。

### 对研究者

6. **从零训练的价值**：从预训练语言模型初始化虽然方便，但会混淆实验结论。如果你要做科学研究，考虑从零开始。
7. **世界建模的捷径**：不需要专门的世界模型架构——多样化的多模态预训练可能已经足够，只需少量领域数据来激活。

---

## 论文信息

| 项目 | 内容 |
|------|------|
| 标题 | Beyond Language Modeling: An Exploration of Multimodal Pretraining |
| arXiv | [2603.03276](https://arxiv.org/abs/2603.03276) |
| 作者 | Shengbang Tong, ... Yann LeCun, Saining Xie（21人） |
| 机构 | Meta FAIR, NYU |
| 项目主页 | https://beyond-llms.github.io/ |
| 日期 | 2026-03-03 |
