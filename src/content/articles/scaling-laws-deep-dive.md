---
title: "Scaling Laws 深度解析：从 Kaplan 到 Chinchilla 再到 Beyond"
description: "系统梳理大模型 Scaling Laws 的理论演进、关键公式、实验验证和工程启示，覆盖参数缩放、数据缩放和计算最优分配。"
date: 2026-03-21
category: "深度解析"
tags: ["Scaling Laws", "预训练", "LLM", "深度学习"]
---

Scaling Laws 是大模型时代最重要的理论基石之一。它回答了一个核心问题：**给定固定的计算预算，我们应该训练多大的模型、用多少数据？** 本文将系统梳理从早期的 Kaplan 定律到 Chinchilla 定律，再到最新的研究进展。

## 一、什么是 Scaling Laws

Scaling Laws（缩放定律）描述的是模型性能（通常用交叉熵 Loss 衡量）与三个核心变量之间的幂律关系：

- **N** — 模型参数量（非 Embedding 参数）
- **D** — 训练数据量（Token 数）
- **C** — 计算量（FLOPs）

核心发现是：Loss 与这三个变量之间存在平滑的幂律（Power Law）关系，可以用简洁的数学公式描述。

## 二、Kaplan Scaling Laws（2020）

OpenAI 在 2020 年发表的 *Scaling Laws for Neural Language Models* 是里程碑式的工作。

### 核心公式

$$L(N) = \left(\frac{N_c}{N}\right)^{\alpha_N}, \quad \alpha_N \approx 0.076$$

$$L(D) = \left(\frac{D_c}{D}\right)^{\alpha_D}, \quad \alpha_D \approx 0.095$$

$$L(C) = \left(\frac{C_c}{C}\right)^{\alpha_C}, \quad \alpha_C \approx 0.050$$

### 关键结论

1. **参数优先**：在固定计算预算下，应该优先增大模型参数量，而非增加训练数据
2. **大模型更高效**：大模型在达到相同 Loss 时需要的样本数更少（sample efficiency 更高）
3. **推荐比例**：参数量增大 8 倍时，数据量只需增大约 5 倍
4. **架构不敏感**：Scaling Laws 对模型架构细节（层数 vs 宽度、注意力头数等）不太敏感

### 实际影响

这一结论直接推动了 "大力出奇迹" 的时代——GPT-3 (175B) 只用了 300B tokens 训练，典型的 "大模型、少数据" 策略。

## 三、Chinchilla Scaling Laws（2022）

DeepMind 的 *Training Compute-Optimal Large Language Models*（Chinchilla 论文）彻底修正了 Kaplan 的结论。

### 核心发现

**模型参数量和训练数据量应该等比例增长。** 具体来说：

$$L(N, D) = E + \frac{A}{N^{\alpha}} + \frac{B}{D^{\beta}}$$

其中 $\alpha \approx 0.34$，$\beta \approx 0.28$，$E$ 是不可约损失（irreducible loss）。

### 最优分配规则

给定计算预算 $C \approx 6ND$（FLOPs），最优分配约为：

| 计算预算 (FLOPs) | 最优参数量 | 最优 Token 数 | 比例 (D/N) |
|---|---|---|---|
| $10^{18}$ | 400M | 8.0B | 20 |
| $10^{20}$ | 2B | 42B | 21 |
| $10^{22}$ | 10B | 210B | 21 |
| $10^{23}$ | 30B | 600B | 20 |
| $10^{24}$ | 100B | 2T | 20 |

**黄金比例：每个参数大约需要 20 个训练 Token。**

### 对 Kaplan 的修正

- Kaplan 低估了数据量的重要性（$\alpha_D$ 偏小）
- Kaplan 的实验中小模型没有充分训练，导致 "参数优先" 的错误结论
- Chinchilla (70B, 1.4T tokens) 性能超越了 Gopher (280B, 300B tokens)，用 1/4 的参数达到了更好的效果

## 四、Beyond Chinchilla：后续研究

### 4.1 LLaMA 的 "过训练" 策略

Meta 的 LLaMA 系列选择了一种务实的策略：**故意违反 Chinchilla 最优比例，用更多数据训练较小的模型。**

| 模型 | 参数量 | 训练 Token 数 | Chinchilla 最优 Token | 过训练倍数 |
|---|---|---|---|---|
| LLaMA-7B | 7B | 1T | 140B | 7.1x |
| LLaMA-13B | 13B | 1T | 260B | 3.8x |
| LLaMA-65B | 65B | 1.4T | 1.3T | 1.1x |
| LLaMA-2 70B | 70B | 2T | 1.4T | 1.4x |
| LLaMA-3 8B | 8B | 15T | 160B | **93.8x** |

为什么要这样做？因为 **Chinchilla 最优是训练成本最优，不是推理成本最优**。在实际部署中，小模型的推理成本远低于大模型，"过训练" 小模型是更经济的选择。

### 4.2 Inference-Optimal Scaling

最新研究关注的是 **推理最优** 而非训练最优。考虑模型的总生命周期成本：

$$C_{total} = C_{train} + C_{inference} \times N_{requests}$$

当模型需要服务大量请求时，训练成本变得微不足道，此时应该：
- 训练更小的模型
- 使用更多数据（大幅超过 Chinchilla 最优）
- 牺牲一点训练效率，换取巨大的推理效率提升

### 4.3 数据受限下的 Scaling

现实中一个越来越严峻的问题是：**高质量文本数据可能在 2026-2028 年耗尽。** 这引出了几个重要方向：

1. **数据重复使用**：研究表明，高质量数据重复使用 4-8 次时 Loss 增长有限
2. **合成数据**：用强模型生成训练数据（如 Phi 系列）
3. **多模态数据**：引入图像、音频、视频等多模态数据作为文本数据的补充
4. **数据质量 > 数量**：FineWeb、DCLM 等工作表明，精心筛选的小数据集可以超越大但质量低的数据集

### 4.4 Emergent Abilities 与 Scaling

关于 Scaling Laws 的一个争议是**涌现能力（Emergent Abilities）**：

- 一种观点认为，某些能力只在模型达到特定规模后才 "突然" 出现
- 另一种观点认为（2023, *Are Emergent Abilities of Large Language Models a Mirage?*），涌现可能是评测指标的产物——如果用连续指标（如 Brier Score）而非离散指标（如 Exact Match），能力增长是平滑的

这个争论对 Scaling Laws 的意义在于：**如果涌现不存在，那么 Scaling Laws 的幂律预测在所有尺度上都是可靠的。**

## 五、Scaling Laws 的工程启示

### 5.1 小规模实验预测大规模结果

Scaling Laws 最大的实用价值在于：**可以用小实验预测大实验的结果。**

典型做法：
1. 训练 3-5 个不同规模的小模型（如 70M, 160M, 410M, 1B）
2. 拟合幂律曲线
3. 外推预测目标规模模型的 Loss

这使得在实际投入大量计算资源之前，就能对结果有合理预期。

### 5.2 学习率与批大小的缩放

除了模型和数据的缩放，还有训练超参数的缩放：

- **学习率**：通常与模型大小成反比关系，$\eta \propto N^{-0.5}$ 到 $N^{-1}$
- **批大小**：存在一个 "临界批大小" $B_{crit}$，超过它增大批大小不再提升训练效率
- **Warmup 步数**：通常与总训练步数成正比，一般占 1-5%

### 5.3 训练稳定性

大规模训练中的 Loss Spike 是一个严重问题：
- 常见原因：学习率过大、数据质量差、数值精度问题
- 应对策略：梯度裁剪（gradient clipping）、学习率重启、Z-Loss 正则化
- 模型越大，对超参数越敏感

## 六、总结与展望

| 阶段 | 核心观点 | 策略 |
|---|---|---|
| Kaplan (2020) | 参数优先 | 大模型 + 少数据 |
| Chinchilla (2022) | 等比缩放 | N 和 D 同步增长，D/N ≈ 20 |
| LLaMA (2023-) | 推理优先 | 小模型 + 大量数据（过训练） |
| 最新趋势 | 数据质量优先 | 精选数据 + 合成数据 + 多模态 |

Scaling Laws 的研究还在快速演进。未来可能的方向包括：

1. **Test-Time Compute Scaling**：在推理时通过更多计算（如 Chain-of-Thought、搜索）提升性能
2. **下游任务特定的 Scaling Laws**：不同任务可能有不同的缩放行为
3. **多模态 Scaling Laws**：文本、图像、代码等不同模态的联合缩放规律
4. **Agent Scaling Laws**：智能体在工具使用和环境交互中的缩放行为

理解 Scaling Laws，是理解大模型时代最核心的思维框架之一。
