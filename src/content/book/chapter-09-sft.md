---
title: "监督微调（SFT）"
description: "从数据构造到训练策略——把预训练模型调教成有用的助手"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 9
part: "第三部分：后训练与对齐"
partOrder: 3
tags: ["SFT", "微调", "指令跟随", "对话", "数据构造"]
---

## 从"补全机器"到"智能助手"

预训练模型本质上是一个**自回归文本补全器**——给定前文，预测下一个 token。它能写出流畅的文本，但不会"听话"：

```
用户：请把下面的句子翻译成英文："今天天气很好"
预训练模型：请把下面的句子翻译成法文："明天会下雨"
            请把下面的句子翻译成德文...
```

预训练模型会把你的指令当作"待续的文本模式"来补全，而不是当作需要执行的任务。**SFT（Supervised Fine-Tuning）** 的目标就是教会模型理解并执行人类指令。

## SFT 的核心原理

### 训练目标

SFT 的训练目标与预训练相同——下一个 token 预测——但有一个关键区别：**只在 response 部分计算 loss**。

对于一个 instruction-response 对 $(x, y)$：

$$\mathcal{L}_{\text{SFT}} = -\sum_{t=1}^{|y|} \log P_\theta(y_t | x, y_{<t})$$

其中 $x$ 是指令（instruction），$y$ 是期望的回复（response）。注意 $x$ 部分不参与 loss 计算——这告诉模型"你需要根据指令生成回复"，而不是"你需要预测指令本身"。

### 为什么不在 instruction 部分算 loss？

实验表明，只在 response 部分计算 loss（masked loss）效果优于全文计算 loss（unmasked loss）：

1. **避免学习"生成指令"的能力**——我们要的是回答能力，不是出题能力
2. **更高效地利用梯度信号**——将学习信号集中在回复质量上
3. **避免过拟合到特定的指令格式**——模型应该关注语义，而不是格式

> [LLaMA 2](https://arxiv.org/abs/2307.09288) 的技术报告中明确提到使用 masked loss 进行 SFT，并观察到优于 unmasked loss 的效果。

## SFT 数据构造

SFT 的核心壁垒在数据，而非算法。一个好的 SFT 数据集需要满足：

### 数据质量 > 数据数量

[LIMA](https://arxiv.org/abs/2305.11206)（Zhou et al., 2023）是一篇里程碑式的论文，标题就是 *"Less Is More for Alignment"*。他们仅用 1,000 条精选数据就训练出了和 GPT-4 可比的对话能力，揭示了一个深刻的道理：

> **对齐不需要教模型新知识——它只需要教模型用正确的方式展示已有的知识。**

具体来说，LIMA 的数据来源：

| 来源 | 数量 | 特点 |
|------|------|------|
| Stack Exchange | 200 | 高票回答，信息密度高 |
| wikiHow | 200 | 结构化步骤指南 |
| Reddit | 200 | 自然对话风格 |
| 人工撰写 | 250 | 覆盖长尾能力 |
| Seed prompts | 150 | 引导式对话 |

### 数据格式

现代 SFT 数据通常使用**对话格式**（chat format）：

```json
{
  "messages": [
    {"role": "system", "content": "你是一个有帮助的助手..."},
    {"role": "user", "content": "解释量子计算的基本原理"},
    {"role": "assistant", "content": "量子计算利用量子力学的两个核心特性..."}
  ]
}
```

每个模型使用特定的 **chat template** 将对话格式化为 token 序列。比如 [ChatML](https://github.com/openai/openai-python/blob/main/chatml.md)：

```
<|im_start|>system
你是一个有帮助的助手<|im_end|>
<|im_start|>user
解释量子计算<|im_end|>
<|im_start|>assistant
量子计算利用...<|im_end|>
```

### 数据多样性

好的 SFT 数据需要覆盖多种能力维度：

```
能力维度
├── 指令跟随：按要求完成特定任务
├── 知识问答：事实性问题、推理问题
├── 创意写作：故事、诗歌、营销文案
├── 代码生成：编程任务、调试
├── 数学推理：数学证明、计算题
├── 多轮对话：上下文理解、指代消解
├── 安全拒绝：识别并拒绝有害请求
├── 格式遵循：JSON、Markdown、表格等输出格式
└── 长文本：摘要、翻译、分析长文档
```

### 主要的开源 SFT 数据集

| 数据集 | 规模 | 特点 |
|--------|------|------|
| [OpenAssistant](https://huggingface.co/datasets/OpenAssistant/oasst1) | 161K | 众包多轮对话，35 种语言 |
| [Alpaca](https://github.com/tatsu-lab/stanford_alpaca) | 52K | GPT-3.5 生成，Self-Instruct 方法 |
| [ShareGPT](https://huggingface.co/datasets/anon8231489123/ShareGPT_Vicuna_unfiltered) | 70K+ | 用户真实对话分享 |
| [FLAN Collection](https://github.com/google-research/FLAN) | 15M+ | 1800+ NLP 任务的指令化 |
| [UltraChat](https://github.com/thunlp/UltraChat) | 1.5M | 多轮对话，GPT-3.5 生成 |
| [Magpie](https://arxiv.org/abs/2406.08464) | 可变 | 自动从模型内部提取指令 |
| [WildChat](https://arxiv.org/abs/2405.01470) | 1M+ | 真实用户对话记录 |

### Self-Instruct：用模型生成训练数据

[Self-Instruct](https://arxiv.org/abs/2212.10560)（Wang et al., 2022）提出了一种优雅的方法——**让 LLM 自己生成 SFT 训练数据**：

1. 从少量种子指令（175 条）出发
2. 让模型生成新的指令
3. 让模型根据指令生成回复
4. 过滤掉低质量数据
5. 加入种子集，重复

这个方法后来演化为 [Evol-Instruct](https://arxiv.org/abs/2304.12244)（WizardLM 使用的方法），通过"指令进化"生成更复杂的训练数据：

```
简单指令: "写一首关于春天的诗"
                ↓ 深化
进化指令: "写一首关于春天的十四行诗，用拟人手法描述花朵的绽放，
          每行不超过10个音节，且包含至少3个暗喻"
```

## SFT 训练策略

### 学习率

SFT 的学习率通常比预训练小 1-2 个数量级：

| 阶段 | 典型学习率 | 原因 |
|------|----------|------|
| 预训练 | 1e-4 ~ 3e-4 | 从随机初始化学习 |
| SFT | 1e-5 ~ 2e-5 | 微调已有知识 |
| DPO/RLHF | 1e-6 ~ 5e-7 | 精细调整偏好 |

过高的学习率会导致**灾难性遗忘**（catastrophic forgetting）——模型在学会指令跟随的同时丢失预训练积累的知识。

### 训练轮数

通常 SFT 只需要 **1-3 个 epoch**。过多的 epoch 会导致：

- **过拟合**：模型记住训练数据的特定模式，泛化能力下降
- **"鹦鹉学舌"效应**：回复变得模板化，缺乏灵活性
- **多样性下降**：同样的问题总是得到几乎一样的回答

> [Anthropic 的研究](https://arxiv.org/abs/2204.05862) 表明，SFT 过拟合是"对齐税"（alignment tax）的主要来源之一——过度的 SFT 会损害模型的基础能力。

### Full Fine-Tuning vs. LoRA

**Full Fine-Tuning** 更新所有参数，效果通常更好但成本高：

$$\Delta W = W_{\text{SFT}} - W_{\text{pretrained}} \in \mathbb{R}^{d \times d}$$

**[LoRA](https://arxiv.org/abs/2106.09685)**（Hu et al., 2021）用低秩分解大幅降低可训练参数量：

$$\Delta W = BA, \quad B \in \mathbb{R}^{d \times r}, \quad A \in \mathbb{R}^{r \times d}, \quad r \ll d$$

典型配置下，LoRA 只需要训练原始参数量的 **0.1%-1%**：

| 方法 | 可训练参数（7B 模型） | GPU 显存 | 效果 |
|------|---------------------|---------|------|
| Full FT | 7B (100%) | ~60GB | 最佳 |
| LoRA (r=16) | ~8M (0.1%) | ~18GB | 接近 Full FT |
| LoRA (r=64) | ~33M (0.5%) | ~22GB | 非常接近 |
| QLoRA | ~8M (0.1%) | ~10GB | 略有损失 |

[QLoRA](https://arxiv.org/abs/2305.14314)（Dettmers et al., 2023）进一步将基础模型量化为 4-bit，在 LoRA 之上叠加量化，让 **单张 24GB 消费级 GPU** 就能微调 65B 模型。

### 多轮对话训练

处理多轮对话时，loss 计算需要特别注意：

```
[System] 你是一个助手
[User] 什么是机器学习？            → 不算 loss
[Assistant] 机器学习是...           → 算 loss ✓
[User] 能举个例子吗？              → 不算 loss
[Assistant] 当然，比如推荐系统...    → 算 loss ✓
```

每一轮的 assistant 回复都独立计算 loss，所有 user 和 system 消息被 mask 掉。这种方式被称为 **per-turn masking**。

## 高级 SFT 技术

### Rejection Sampling（拒绝采样）

[LLaMA 2](https://arxiv.org/abs/2307.09288) 使用了 rejection sampling 来提升 SFT 数据质量：

1. 对每个 prompt，让模型生成 $K$ 个候选回复
2. 用奖励模型为每个回复打分
3. 只保留得分最高的回复作为训练数据

这本质上是**用 RL 的信号来增强 SFT 数据**——不需要完整的 RLHF 流程，但能获得部分收益。

### NEFTune

[NEFTune](https://arxiv.org/abs/2310.05914)（Jain et al., 2023）发现了一个反直觉的技巧：**在 SFT 训练时向 embedding 层添加均匀噪声，能显著提升对话质量**。

$$\tilde{e}_i = e_i + \frac{\alpha}{\sqrt{Ld}} \cdot u_i, \quad u_i \sim \text{Uniform}(-1, 1)$$

其中 $\alpha$ 是噪声强度（通常 5-15），$L$ 是序列长度，$d$ 是 embedding 维度。

直觉解释：噪声起到了**正则化**的作用，防止模型过拟合到 SFT 数据的特定表面模式，鼓励模型学习更鲁棒的表示。

### Packing（序列拼接）

SFT 数据长度差异很大（从几十 token 到上千 token）。简单的 padding 会浪费大量计算。**Packing** 将多个短样本拼接到同一个序列中：

```
Before packing (大量 padding 浪费):
[样本A][PAD PAD PAD PAD PAD]
[样本B B B B B B][PAD PAD]

After packing (高效利用):
[样本A][样本B B B B B B][样本C]
```

需要配合 **attention mask** 确保不同样本之间不会互相 attend。

## SFT 质量评估

### 自动评估

- **[MT-Bench](https://arxiv.org/abs/2306.05685)**：80 道多轮题，GPT-4 评分 1-10
- **[AlpacaEval](https://github.com/tatsu-lab/alpaca_eval)**：805 条指令，GPT-4 对比评估
- **[Arena-Hard](https://lmsys.org/blog/2024-04-19-arena-hard/)**：500 条高难度问题

### 人工评估

自动评估有偏差，关键决策仍需人工评估。常见维度：

| 维度 | 评估标准 |
|------|---------|
| 有用性 | 回答是否真正解决了用户问题 |
| 真实性 | 是否有事实错误或幻觉 |
| 无害性 | 是否包含有害、偏见或不当内容 |
| 格式 | 是否遵循要求的格式 |
| 简洁性 | 是否冗长啰嗦 |

## 常见陷阱与经验

### 1. 数据污染

SFT 数据可能包含评估集的问题和答案，导致评估结果虚高。**务必对 SFT 数据做去污染检测**。

### 2. Sycophancy（谄媚）

过度优化"用户满意度"会导致模型变得谄媚——即使用户说的是错的，模型也会表示同意。需要在数据中包含"礼貌拒绝"和"纠正用户"的样本。

### 3. Verbosity（冗长）

模型倾向于输出更长的回复（因为更长的回复通常被标注员评为"更好"）。需要在数据中包含简洁回复的样本，或在评估时控制长度偏差。

### 4. 格式过拟合

如果 SFT 数据过度使用 Markdown 列表或特定格式，模型会在不需要的时候也使用这些格式。数据格式应该多样化。

## 章节小结

SFT 是从预训练模型到实用助手的桥梁。核心要点：

1. **数据质量 >> 数据数量**：1000 条优质数据可能胜过 100 万条平庸数据
2. **只在 response 部分计算 loss**
3. **学习率要小**：1e-5 量级，避免灾难性遗忘
4. **1-3 个 epoch 足矣**：过拟合是 SFT 最大的敌人
5. **LoRA/QLoRA 让微调平民化**：消费级 GPU 就能微调大模型
6. **SFT 是必要但不充分的**——它教会模型"怎么说话"，但不能教会模型"什么该说什么不该说"。后者需要 RLHF/DPO，这是下一章的内容。
