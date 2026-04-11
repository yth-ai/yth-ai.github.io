---
title: "走进大语言模型"
description: "从 GPT 到 DeepSeek——大模型的发展脉络、核心概念与技术全景图"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 1
part: "第一部分：基础篇"
partOrder: 1
tags: ["LLM", "概述", "发展史"]
---

## 为什么需要这本书

大语言模型（Large Language Model, LLM）正在重塑整个 AI 领域。从 GPT-3 在 2020 年引爆"大模型时代"，到如今 GPT-5、Claude 4、Gemini 3、DeepSeek V4 等模型的百花齐放，LLM 已经从学术研究走向工业生产，深刻影响着搜索、编程、教育、医疗等几乎所有行业。

然而，**理解 LLM 的门槛正在快速升高**。这不是一个看完一篇论文就能掌握的领域——它涉及数据工程、模型架构、训练工程、对齐技术、推理优化、系统部署等多个交叉学科。现有的教材要么过于学术（缺乏工业实战视角），要么过于碎片化（只覆盖某一个子领域），要么已经过时（LLM 领域半年就是一个时代）。

本书的目标是：**让你通过一本书，系统性地掌握 LLM 全链路的核心知识，达到能够独立设计、训练、优化和部署大模型的专家水平。**

## 本书的独特之处

| 特性 | 本书 | 传统教材 | 博客/论文 |
|------|------|----------|----------|
| 全栈覆盖 | 数据→训练→对齐→推理→部署→Agent | 通常只覆盖 2-3 个主题 | 单点深入 |
| 实战视角 | 基于一线工业经验 | 偏学术理论 | 质量参差不齐 |
| 持续更新 | 定期吸收最新进展 | 出版后固定 | 时效性不稳定 |
| 深度 | 从原理到数学到工程 | 要么太浅要么太深 | 取决于作者 |

## 大模型发展简史

### 预训练语言模型的诞生

大模型的故事要从 **预训练（pre-training）** 范式讲起。

2018 年是分水岭。在此之前，NLP 领域的主流方法是为每个任务训练专门的模型——情感分析一个模型、机器翻译一个模型、文本摘要又一个模型。[ELMo](https://arxiv.org/abs/1802.05365)（Peters et al., 2018）首次证明了"在大规模语料上预训练，然后在下游任务上微调"的两阶段范式的威力。

紧接着，两个里程碑式的工作同年发布：

- **[GPT](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf)（2018.6）**：OpenAI 提出用 Transformer Decoder 做自回归语言建模预训练，然后微调到下游任务。模型只有 117M 参数，但展示了 generative pre-training 的潜力。
- **[BERT](https://arxiv.org/abs/1810.04805)（2018.10）**：Google 提出用 Transformer Encoder 做双向掩码语言建模（MLM）预训练。在 11 个 NLP 任务上取得 SOTA，彻底改变了 NLP 的研究范式。

> **关键洞察**：GPT 和 BERT 的成功说明了一个深刻的道理——**语言本身就包含了世界知识**。在足够多的文本上训练语言模型，模型就能学到语法、语义、常识甚至推理能力。

### 规模化时代：从 GPT-2 到 GPT-3

[GPT-2](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)（Radford et al., 2019, 1.5B 参数）首次展示了"大力出奇迹"——不需要微调，只需要给一些示例（few-shot），模型就能完成各种 NLP 任务。OpenAI 当时以"太危险"为由延迟发布，引发了关于 AI 安全的早期讨论。

**[GPT-3](https://arxiv.org/abs/2005.14165)（Brown et al., 2020, 175B 参数）** 是真正的转折点。论文 *"Language Models are Few-Shot Learners"* 中系统验证了 **in-context learning**（上下文学习）能力：给模型几个示例，模型就能"理解"任务并给出合理的回答，**完全不需要更新任何参数**。这种 emergent ability（涌现能力）是小模型所不具备的，它暗示了一个令人震撼的可能性：**也许我们不需要为每个任务训练专门的模型，一个足够大的通用模型就够了。**

### Scaling Laws 的发现

2020 年，Kaplan et al. 发表了划时代的论文 [*"Scaling Laws for Neural Language Models"*](https://arxiv.org/abs/2001.08361)，揭示了一组优美的幂律关系：

$$L(N) = \left(\frac{N_c}{N}\right)^{\alpha_N}$$

其中 $L$ 是 loss，$N$ 是参数量，$\alpha_N \approx 0.076$。这意味着**每增加 10 倍参数量，loss 下降约 0.95 倍**——而且这个关系在多个数量级上都成立。

2022 年，Hoffmann et al.（[Chinchilla 论文](https://arxiv.org/abs/2203.15556)）进一步修正了这个关系，证明 **参数量和训练数据量应该同步扩展**。具体来说，对于计算预算 $C$，最优的参数量 $N$ 和数据量 $D$ 满足：

$$N_{opt} \propto C^{0.5}, \quad D_{opt} \propto C^{0.5}$$

这意味着之前的很多模型（包括 GPT-3）都是"参数过多，数据不足"的。Chinchilla 只有 70B 参数，但用了 1.4T tokens 训练，在多个 benchmark 上超越了 4 倍大的 Gopher（280B）。

> **实战启示**：Scaling Laws 不是学术游戏。它直接指导着工业界的资源分配决策——给定算力预算，应该训多大的模型、用多少数据、训练多少步。后面第五章我们会深入讨论。

### 对齐革命：从 InstructGPT 到 ChatGPT

2022 年 3 月，OpenAI 发布 [InstructGPT 论文](https://arxiv.org/abs/2203.02155)，首次系统地展示了 **RLHF（Reinforcement Learning from Human Feedback）** 的威力：通过人类偏好标注训练奖励模型，再用 PPO 算法优化语言模型，使模型输出更符合人类意图。

InstructGPT 的核心贡献不在于模型更大或更强，而在于**范式转变**：
1. **SFT（Supervised Fine-Tuning）**：用高质量的指令-回复对做监督微调
2. **RM（Reward Modeling）**：训练奖励模型来预测人类偏好
3. **RLHF**：用奖励模型的信号通过 PPO 优化策略模型

2022 年 11 月，ChatGPT 横空出世，把这套技术推向了大众。它不是技术突破，而是**工程和产品层面的集大成者**——证明了经过对齐训练的 LLM 可以作为通用的对话助手，为所有人所用。

### 当前格局（2024-2026）

如今，LLM 领域呈现几个关键趋势：

**1. 模型能力持续提升但方式在变**

- GPT-4 (2023) → GPT-5 (2025) → GPT-5.4 (2026)：OpenAI 持续推动 frontier
- Claude 3.5 Sonnet → Claude 4 → Claude 4.6：Anthropic 在安全和长上下文方面领先
- Gemini 1.5 → Gemini 2 → Gemini 3：Google 在多模态和效率方面发力
- DeepSeek V2 → V3 → V4：中国团队在 MoE 架构和训练效率上的突破

**2. 开源生态繁荣**

- [LLaMA](https://arxiv.org/abs/2302.13971) 系列推动了开源 LLM 生态
- [Mistral](https://arxiv.org/abs/2401.04088)、[Qwen](https://arxiv.org/abs/2309.16609)、[Yi](https://arxiv.org/abs/2403.04652) 等模型在特定规模段达到 SOTA
- 开源数据集（[FineWeb](https://huggingface.co/datasets/HuggingFaceFW/fineweb)、[StarCoder Data](https://huggingface.co/datasets/bigcode/starcoderdata)）和工具链日趋成熟

**3. 后训练技术多样化**

- 从 RLHF → [DPO](https://arxiv.org/abs/2305.18290) → [GRPO](https://arxiv.org/abs/2402.03300)，对齐算法不断简化
- 合成数据在 SFT 和对齐中扮演越来越重要的角色
- 中训练（mid-training）作为新阶段被广泛采用

**4. 推理时计算成为新前沿**

- Test-time compute scaling（推理时扩展计算量）
- [Chain-of-Thought](https://arxiv.org/abs/2201.11903) 推理、[Self-Consistency](https://arxiv.org/abs/2203.11171)、[Tree-of-Thought](https://arxiv.org/abs/2305.10601) 等方法
- [推测解码（Speculative Decoding）](https://arxiv.org/abs/2211.17192)大幅提升推理速度

**5. Agent 与工具使用**

- LLM 作为"大脑"驱动 Agent 系统
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) 等标准化协议
- 从单步问答走向多步规划和执行

## 核心概念速览

在深入后续章节之前，我们先建立一些关键概念的直觉。

### 语言模型的本质

语言模型的核心任务是**预测下一个 token**：

$$P(x_t | x_1, x_2, \ldots, x_{t-1})$$

整个序列的概率可以分解为：

$$P(x_1, x_2, \ldots, x_T) = \prod_{t=1}^{T} P(x_t | x_{1:t-1})$$

这看起来简单得令人难以置信——就是"猜下一个词"。但正是这个简单的目标，在足够大的数据和模型上训练后，产生了惊人的能力。

### Token 与 Tokenization

LLM 不直接处理文字，而是处理 **token**——文本的基本单元。Tokenizer 负责将文本切分为 token 序列。现代 LLM 普遍使用 **BPE（Byte Pair Encoding）** 及其变体：

- GPT 系列使用 tiktoken（BPE 变体）
- LLaMA 使用 SentencePiece（Unigram/BPE）
- 中文场景下，一个汉字通常被编码为 1-3 个 token

Tokenizer 的设计直接影响模型的效率和多语言能力，我们在第三章详细讨论。

### 训练流程的三个阶段

现代 LLM 的训练通常分为三个（或四个）阶段：

```
预训练 (Pre-training)
  ↓ 万亿 tokens，基础能力
中训练 (Mid-training)  [可选但越来越常见]
  ↓ 数百亿 tokens，领域增强
监督微调 (SFT)
  ↓ 数万-数十万条，指令遵循
对齐训练 (RLHF/DPO)
  ↓ 数千-数万条偏好数据
最终模型
```

每个阶段的数据质量和配比都极其关键，这将是本书用大量篇幅讨论的主题。

### 模型架构的核心

几乎所有现代 LLM 都基于 **Transformer 架构**，具体来说是 **Decoder-only** 变体。核心组件包括：

- **Multi-Head Self-Attention (MHA)**：捕捉 token 间的关系
- **Feed-Forward Network (FFN)**：非线性变换和知识存储
- **位置编码 (Positional Encoding)**：注入序列位置信息

近年的重要架构创新包括：

| 技术 | 作用 | 代表模型 |
|------|------|---------|
| GQA/MQA | 减少 KV Cache，加速推理 | LLaMA 2, Gemini |
| MLA | 低秩压缩 KV Cache | DeepSeek V2/V3 |
| RoPE | 旋转位置编码，支持长度外推 | LLaMA, Qwen |
| MoE | 稀疏激活，扩大参数量不增加推理成本 | Mixtral, DeepSeek |
| SwiGLU | 替代 ReLU 的激活函数 | LLaMA, PaLM |

## 本书结构

本书分为五个部分：

### 第一部分：基础篇（第 1-4 章）
建立必要的基础知识：本章的全景概述、Transformer 架构详解、Tokenizer 设计、以及预训练数据工程。

### 第二部分：预训练（第 5-8 章）
深入预训练的方方面面：Scaling Laws 的理论与实践、预训练配方设计、中训练（Mid-training）技术、以及分布式训练工程。

### 第三部分：后训练与对齐（第 9-11 章）
从 SFT 到 RLHF 到 DPO/GRPO，系统讲解如何让模型"对齐"人类意图，包括数据构造、训练技巧和评估方法。

### 第四部分：推理与部署（第 12-14 章）
覆盖推理优化（量化、蒸馏、推测解码）、服务化部署（vLLM、TensorRT-LLM）、以及评估体系设计。

### 第五部分：前沿与展望（第 15-16 章）
多模态 LLM、Agent 系统、长上下文处理等前沿方向，以及对未来的展望。

---

> **下一章预告**：第二章我们将深入 Transformer 架构的每一个细节——从 Attention 的数学推导到现代架构变体（GQA、MoE、MLA），配合代码和可视化帮助你建立扎实的直觉。
