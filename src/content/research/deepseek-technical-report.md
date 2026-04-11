---
title: "DeepSeek 系列模型技术深度解读"
description: "从 DeepSeek-V1 到 DeepSeek-V3/R1 的完整技术演进，解析 MLA、DeepSeekMoE、FP8 训练等核心创新。"
date: 2026-03-20
category: 综合调研
tags: ["DeepSeek", "MoE", "MLA", "推理模型", "FP8"]
draft: false
---

## 引言

DeepSeek 系列模型是 2024-2025 年最具影响力的开源大模型之一。从 DeepSeek-V1 的初次亮相到 DeepSeek-V3 的 671B MoE 架构，再到 DeepSeek-R1 开创性的推理模型，每一代都带来了重要的技术创新。本文对 DeepSeek 系列的核心技术进行系统性解读。

## DeepSeek 技术演进时间线

| 时间 | 模型 | 参数量 | 核心创新 |
|------|------|--------|----------|
| 2024.01 | DeepSeek-V1 | 67B | 首个版本，验证基础架构 |
| 2024.05 | DeepSeek-V2 | 236B (21B active) | MLA + DeepSeekMoE |
| 2024.12 | DeepSeek-V3 | 671B (37B active) | FP8 训练 + 辅助 loss-free 负载均衡 |
| 2025.01 | DeepSeek-R1 | 671B | 大规模 RL + 推理链蒸馏 |

## Multi-head Latent Attention (MLA)

### 标准 MHA 的瓶颈

标准 Multi-Head Attention 中，每个 token 的 KV Cache 大小为：

$$\text{KV Cache per token} = 2 \times n_h \times d_h \times \text{sizeof(dtype)}$$

以 LLaMA-70B 为例（$n_h=64, d_h=128$），每个 token 的 KV Cache 约为 **1.25MB**（FP16），128K 上下文需要约 **160GB** KV Cache——这在推理时造成巨大的显存压力。

### GQA 的折中方案

Grouped-Query Attention (GQA) 通过让多个 query head 共享同一组 KV head 来减少 KV Cache：

$$\text{GQA KV Cache} = 2 \times n_g \times d_h$$

LLaMA-2-70B 使用 8 组 GQA，KV Cache 缩小为原来的 1/8。但这本质上是信息容量与效率的简单折中——每组内的 query head 被迫共享完全相同的 KV 表示。

### MLA 的核心思想

MLA 的创新在于：**不是在 head 维度上做分组共享，而是将 KV 压缩到一个低秩的潜在空间**。

具体地，MLA 对每个 token 的输入 $h_t$ 进行低秩压缩：

$$c_t^{KV} = W^{DKV} h_t$$

其中 $c_t^{KV} \in \mathbb{R}^{d_c}$ 是压缩后的 KV 潜在向量，$d_c \ll n_h \times d_h$。

在推理时，只需缓存 $c_t^{KV}$，需要时再通过上投影矩阵恢复出完整的 K 和 V：

$$k_t = W^{UK} c_t^{KV}, \quad v_t = W^{UV} c_t^{KV}$$

### MLA vs GQA 对比

| 维度 | MHA | GQA-8 | MLA |
|------|-----|-------|-----|
| KV Cache/token | $2n_h d_h$ | $2 \times 8 \times d_h$ | $d_c + d_h^{RoPE}$ |
| 压缩比 (LLaMA-70B级) | 1× | 8× | ~13× |
| 信息损失方式 | 无 | 硬分组 | 可学习低秩 |
| 训练开销 | 基线 | 与 MHA 相同 | 略高（多了投影） |

DeepSeek-V2 设置 $d_c = 512$，加上 RoPE 需要的位置维度 $d_h^{RoPE}=64$，每个 token 只需缓存 576 维向量，相比 MHA 压缩了约 **93.3%**。

### RoPE 的兼容性处理

MLA 中有一个巧妙的细节：RoPE 是位置相关的编码，不能直接参与低秩压缩（否则会丢失位置信息）。DeepSeek 的解决方案是将 query 和 key 各分出一小部分维度专门用于 RoPE：

$$q_t = [W^{UQ} c_t^Q ; W^{QR} h_t \cdot \text{RoPE}(t)]$$
$$k_t = [W^{UK} c_t^{KV} ; W^{KR} h_t \cdot \text{RoPE}(t)]$$

这样 RoPE 部分单独处理，主体部分享受低秩压缩的优势。

## DeepSeekMoE 架构

### 设计哲学：更细粒度的专家

传统 MoE（如 Mixtral 的 8 选 2）使用少量大专家。DeepSeekMoE 的核心理念是：**用更多更小的专家实现更灵活的知识组合**。

DeepSeek-V2 的配置：
- **2 个共享专家（always active）** + **160 个路由专家（选 6 个）**
- 每个路由专家的参数量约为标准 FFN 的 1/16
- 实际激活参数 ≈ 共享专家 + 6 个路由专家 ≈ 21B（总 236B）

### 为什么更细粒度更好？

考虑一个直觉性的类比：如果你有 8 个大厨，每个都是全能型，那么 "选 2 个" 的组合只有 $C_8^2 = 28$ 种。但如果你有 160 个专精厨师（面点、烧烤、甜品...），"选 6 个" 的组合有 $C_{160}^6 \approx 2.1 \times 10^{10}$ 种——知识组合的灵活性指数级增长。

### 共享专家的角色

共享专家始终被激活，负责编码通用知识（语法、常识、基本推理），路由专家则专注于特定领域。这避免了每个路由专家都冗余存储通用知识，显著提升参数效率。

## DeepSeek-V3 的工程突破

### FP8 混合精度训练

DeepSeek-V3 的一个重大工程创新是**在 671B 规模模型上成功使用 FP8 训练**——这在此前被认为是非常困难的。

核心策略：
- **前向传播**：FFN 和 Attention 的 GEMM 使用 FP8
- **反向传播**：梯度计算部分使用 FP8
- **权重更新**：Master weights 保持 FP32/BF16
- **关键组件例外**：Embedding、LayerNorm、Router 保持 BF16

FP8 训练带来的收益：
- 计算吞吐提升约 **40%**（在 H800 上）
- 显存节省约 **30%**（权重 + 激活）
- 最终模型质量与 BF16 基线无显著差异

### 辅助 Loss-free 负载均衡

传统 MoE 使用辅助 loss 来鼓励负载均衡：

$$\mathcal{L}_{aux} = \alpha \cdot N \sum_{i=1}^{N} f_i \cdot P_i$$

但这个辅助 loss 会与主任务 loss 竞争，$\alpha$ 的调节需要非常精细——太大会损害模型性能，太小则负载不均。

DeepSeek-V3 的创新方案：**不通过 loss 来约束，而是在路由层引入可调节的 bias 项**。

$$g_i = \text{softmax}(s_i + b_i)$$

其中 $b_i$ 不参与梯度计算，而是通过一个简单的启发式规则更新：
- 如果专家 $i$ 负载偏高 → 降低 $b_i$
- 如果专家 $i$ 负载偏低 → 提高 $b_i$

这样做的好处：
1. **不污染主 loss 的梯度信号**
2. 调节更直接、更可控
3. 实际效果：负载均衡性与使用辅助 loss 相当，但模型质量更好

### Multi-Token Prediction (MTP)

DeepSeek-V3 在训练时使用了多 token 预测，每个位置不仅预测下一个 token，还预测后续的多个 token。这被认为有两个作用：

1. **提供更丰富的训练信号**：每个位置的梯度信号更密集
2. **为 Speculative Decoding 做准备**：推理时可以利用 MTP head 做投机采样

## DeepSeek-R1：推理模型的突破

### 从 DeepSeek-V3 到 R1 的路径

DeepSeek-R1 的核心发现：**大规模 RL 可以让模型自发产生推理行为（Chain-of-Thought），不需要任何人工标注的 CoT 数据**。

训练流程：

```
DeepSeek-V3 (Base)
    ↓ SFT (少量高质量数据)
    ↓ 大规模 GRPO (Group Relative Policy Optimization)
    ↓ DeepSeek-R1
```

### GRPO：去掉 Critic 模型

GRPO 相比 PPO 的核心简化是**不需要单独的 value/critic 模型**。对于每个 prompt，GRPO：

1. 采样一组（group）回复 $\{o_1, o_2, ..., o_G\}$
2. 用规则或验证器给每个回复打分 $r_i$
3. 在 group 内部计算相对优势：$A_i = \frac{r_i - \text{mean}(r)}{\text{std}(r)}$
4. 用相对优势更新策略

这避免了训练 critic 模型的额外开销（对 671B 模型来说，这是非常显著的节省）。

### 涌现的推理行为

DeepSeek-R1-Zero（纯 RL、无 SFT）的一个有趣发现是，模型在 RL 过程中自发地涌现出了以下行为：

- **自我验证**：回答后自己检查答案
- **反思与回溯**："Wait, let me reconsider..."
- **将问题分解为子步骤**
- **尝试多种解法并比较**

这些行为不是通过模板注入或人工标注的 CoT 数据教的，而是模型在优化奖励信号的过程中自主发展出来的。

### 推理链蒸馏

R1 的另一个重要贡献是证明了**推理能力可以通过蒸馏迁移到小模型**。DeepSeek 发布了一系列蒸馏模型：

| 基座模型 | 蒸馏后 | AIME 2024 | MATH-500 |
|----------|--------|-----------|----------|
| Qwen-1.5B | R1-Distill-1.5B | 28.9% | 83.9% |
| Qwen-7B | R1-Distill-7B | 55.5% | 92.8% |
| Qwen-14B | R1-Distill-14B | 69.7% | 93.9% |
| Qwen-32B | R1-Distill-32B | 72.6% | 94.3% |
| LLaMA-70B | R1-Distill-70B | 70.0% | 94.5% |

值得注意的是，R1-Distill-32B 在数学推理上甚至超过了 OpenAI 的 o1-mini。

## 关键设计决策总结

### 1. 架构选择的逻辑链

```
推理效率诉求 → KV Cache 压缩 → MLA (vs GQA)
参数效率诉求 → 稀疏激活 → DeepSeekMoE (vs Switch/Mixtral)
训练效率诉求 → 低精度计算 → FP8 (vs BF16)
能力增强诉求 → 推理强化 → GRPO (vs PPO/DPO)
```

### 2. 训练成本分析

DeepSeek-V3 的训练成本令人印象深刻：

- 预训练：14.8T tokens，约 2.788M H800 GPU-hours
- 按市场价约 **$5.576M**（约 4000 万人民币）
- 相比同等能力模型（如 LLaMA-3-405B）成本低 **~10×**

成本优势来源：
1. MoE 架构：只激活 37B/671B ≈ 5.5% 参数
2. FP8 训练：提升约 40% 计算效率
3. MLA：减少通信和显存开销

### 3. 对后续研究的启示

- **MLA 可能成为新标准**：对于超大规模模型，MLA 在推理效率上的优势使其成为 GQA 的有力替代
- **细粒度 MoE 是方向**：更多更小的专家 + 共享专家的组合已被多个后续工作验证
- **FP8 训练走向成熟**：DeepSeek-V3 证明了在超大规模上 FP8 训练的可行性
- **RL for Reasoning 是新范式**：R1 证明了不依赖人工 CoT 标注也能获得强推理能力

## 值得深入研究的问题

1. **MLA 在不同模型规模下的最优 $d_c$ 如何选择？** 压缩率与信息损失的 trade-off 是否存在 scaling law？
2. **DeepSeekMoE 的 160 个专家真的都在工作吗？** 是否存在大量"僵尸专家"？
3. **R1 的推理能力是否可以在更小的基座模型上直接训出？** 7B 级别的模型能否通过纯 RL 涌现推理？
4. **FP8 训练的精度损失在什么任务上最明显？** 编码、数学、多语言分别受到怎样的影响？

## 参考文献

1. DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model (2024)
2. DeepSeek-V3 Technical Report (2024)
3. DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning (2025)
4. GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints (2023)
5. Mixtral of Experts (2024)
