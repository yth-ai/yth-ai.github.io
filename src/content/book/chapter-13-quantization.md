---
title: "量化与模型压缩"
description: "INT8、INT4、FP8——在精度与效率之间寻找最优平衡"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 13
part: "第四部分：推理与部署"
partOrder: 4
tags: ["量化", "INT8", "INT4", "GPTQ", "AWQ", "模型压缩"]
---

## 为什么需要量化

一个 70B 参数的模型，以 FP16 存储需要 **140 GB** 显存。这意味着：

- 至少需要 **2 张 H100**（80GB 版）才能装下
- 推理速度受限于从显存读取权重的带宽
- 部署成本高昂

量化（Quantization）将模型参数从高精度（FP16/BF16）映射到低精度（INT8/INT4/FP8），带来三重收益：

1. **显存减少**：INT4 量化可将 70B 模型压缩到 ~35GB，单卡可跑
2. **速度提升**：更少的数据传输 → 更高的有效内存带宽
3. **成本降低**：更少的 GPU → 更低的部署成本

核心挑战是：**如何在压缩的同时最小化精度损失**。

## 量化基础

### 均匀量化

最简单的量化方式——将浮点数线性映射到整数：

$$x_q = \text{round}\left(\frac{x - z}{s}\right), \quad s = \frac{x_{\max} - x_{\min}}{2^b - 1}$$

其中 $s$ 是 scale（缩放因子），$z$ 是 zero-point（零点），$b$ 是目标比特数。

反量化（推理时）：

$$\hat{x} = s \cdot x_q + z$$

### 对称 vs. 非对称量化

**对称量化**：$z = 0$，范围关于零对称 $[-\alpha, \alpha]$

$$x_q = \text{round}\left(\frac{x}{\alpha} \cdot (2^{b-1} - 1)\right)$$

**非对称量化**：$z \neq 0$，可以更好地利用量化范围

对于权重矩阵（通常近似零均值），对称量化足够。对于激活值（可能有偏移），非对称量化更准确。

### 量化粒度

| 粒度 | 每个缩放因子覆盖 | 精度 | 开销 |
|------|-----------------|------|------|
| Per-Tensor | 整个权重矩阵 | 低 | 极小 |
| Per-Channel | 权重矩阵的一行/列 | 中 | 小 |
| Per-Group | 一组连续元素（如 128 个） | 高 | 中 |
| Per-Element | 每个元素独立 | 最高 | 大 |

现代方法通常使用 **per-group** 量化（group size = 64 或 128），在精度和开销之间取得好的平衡。

## 训练后量化（PTQ）

PTQ（Post-Training Quantization）不需要重新训练模型，直接在已有权重上进行量化。

### GPTQ

[GPTQ](https://arxiv.org/abs/2210.17323)（Frantar et al., 2022）是最早的高效 LLM 量化方法之一。基于 **OBS（Optimal Brain Surgeon）** 框架，逐列量化权重，同时更新剩余列来补偿量化误差：

$$\text{argmin}_{\hat{W}} \|WX - \hat{W}X\|_2^2$$

GPTQ 的关键创新：
- 使用少量校准数据（128-256 条）计算 Hessian
- 逐列处理，允许后续列"修正"前面列的误差
- 一个 175B 模型约 4 GPU 小时即可完成量化

### AWQ（Activation-Aware Weight Quantization）

[AWQ](https://arxiv.org/abs/2306.00978)（Lin et al., 2023）的核心洞察：**不是所有权重同等重要——对应高激活值的通道更重要**。

1. 统计校准数据上的激活值分布
2. 识别"重要通道"（激活值大的）
3. 对重要通道使用更高精度（或等效的 scale 调整）

```python
# AWQ 的核心思想（简化）
activation_scales = calibration_data.abs().mean(dim=0)
important_channels = activation_scales > threshold

# 对重要通道放大 scale，相当于给它们更多的量化精度
w_scaled = w.clone()
w_scaled[:, important_channels] *= scale_factor
w_quantized = quantize(w_scaled)
```

AWQ 在 INT4 量化上通常比 GPTQ 精度更高，尤其是在极端量化（INT3）时。

### SmoothQuant

[SmoothQuant](https://arxiv.org/abs/2211.10438)（Xiao et al., 2023）解决了**激活值量化**的难题。

问题：权重通常分布均匀，容易量化；但激活值可能有**极端 outlier**（某些通道的值比其他通道大 100 倍），导致量化精度极差。

SmoothQuant 的解决方案——**数学上等价地**将量化难度从激活值转移到权重：

$$Y = (X \text{diag}(s)^{-1}) \cdot (\text{diag}(s) W) = \hat{X} \hat{W}$$

选择合适的 $s$ 使 $\hat{X}$ 和 $\hat{W}$ 都容易量化。实践中：

$$s_j = \frac{\max(|X_j|)^\alpha}{\max(|W_j|)^{1-\alpha}}, \quad \alpha \in [0.5, 0.75]$$

这使得 **W8A8**（权重和激活都是 INT8）成为可能，吞吐量接近 2 倍。

## FP8 量化

H100 GPU 原生支持 FP8 计算（E4M3 和 E5M2 两种格式），这为量化带来了新范式。

### FP8 vs. INT8

| 特性 | INT8 | FP8 (E4M3) |
|------|------|------------|
| 范围 | [-128, 127] | [-448, 448] |
| 精度 | 均匀分布 | 靠近 0 精度更高 |
| 硬件支持 | 通用 | H100+ |
| 动态范围 | 需要精心选择 scale | 自带指数位 |
| Tensor Core 加速 | 有 | 有（H100 更快） |

FP8 的优势在于**更大的动态范围**——对于有 outlier 的激活值更友好。

### 训练时 FP8

[DeepSeek V3](https://arxiv.org/abs/2412.19437) 开创性地在训练中使用 FP8：

- 前向传播：FP8 GEMM
- 反向传播：FP8 梯度
- 主权重：FP32（用于精确更新）

训练 FLOPs 减少约 40%，质量几乎无损。

## 极端量化：INT4 及以下

### GGUF 格式

[llama.cpp](https://github.com/ggerganov/llama.cpp) 定义的 GGUF 格式支持多种量化方案：

| 格式 | 位宽 | 方法 | 70B 模型大小 | 质量 |
|------|------|------|------------|------|
| Q8_0 | 8-bit | 对称量化 | ~70 GB | 几乎无损 |
| Q6_K | 6-bit | 超级块混合 | ~54 GB | 很小损失 |
| Q5_K_M | 5-bit | 超级块混合 | ~48 GB | 小损失 |
| Q4_K_M | 4-bit | 超级块混合 | ~40 GB | 可接受 |
| Q3_K_M | 3-bit | 超级块混合 | ~30 GB | 明显损失 |
| Q2_K | 2-bit | 超级块混合 | ~25 GB | 显著损失 |

"K-quant" 方法使用**超级块**（super-block）结构，不同的块使用不同的量化参数，在极端低比特下维持更好的精度。

### 混合精度量化

不同层对量化的敏感度不同。[SpQR](https://arxiv.org/abs/2306.03078) 等方法识别出"敏感"权重（outlier），将它们保持在高精度，其余量化到低精度：

```
典型策略：
- 第一层和最后一层：INT8（对精度敏感）
- 中间层：INT4（不敏感）
- Attention 的 Q, K 投影：INT8（位置信息敏感）
- FFN 权重：INT4（最容易量化）
```

## 知识蒸馏

知识蒸馏（Knowledge Distillation）是另一种模型压缩方法——用大模型（teacher）教小模型（student）：

$$\mathcal{L}_{\text{KD}} = \alpha \cdot \text{KL}\left(\frac{\log p_T(y|x)}{\tau}, \frac{\log p_S(y|x)}{\tau}\right) + (1 - \alpha) \cdot \mathcal{L}_{\text{CE}}$$

其中 $\tau$ 是温度参数（通常 1-4），升高温度使 teacher 的概率分布更"软"，传递更多的暗知识（dark knowledge）。

### LLM 蒸馏的特点

- **逐 token 蒸馏**：对齐 teacher 和 student 在每个位置的输出分布
- **特征蒸馏**：对齐中间层的 hidden states
- **数据蒸馏**：用 teacher 生成高质量训练数据，给 student 训练

[Phi 系列](https://arxiv.org/abs/2309.05463)（Microsoft）是数据蒸馏的典范——用 GPT-4 生成高质量"教科书"数据，训练出远超同规模的小模型。

### 开源蒸馏案例

| Teacher | Student | 方法 | 效果 |
|---------|---------|------|------|
| GPT-4 | Phi-3 3.8B | 数据蒸馏 | 3.8B 接近 Mixtral 8x7B |
| LLaMA 70B | LLaMA 8B | 逐 token | 8B 提升 5-10% |
| DeepSeek R1 671B | DeepSeek R1 系列 | 数据蒸馏 | [7B/14B/32B 等](https://arxiv.org/abs/2501.12948) |

## 剪枝（Pruning）

剪枝移除模型中不重要的参数/结构：

### 非结构化剪枝

[SparseGPT](https://arxiv.org/abs/2301.00774) 可以将 LLM 剪枝到 50-60% 稀疏度，几乎不损失精度：

- 逐列处理权重矩阵
- 找到可以安全移除的权重
- 更新剩余权重补偿误差

问题：非结构化稀疏在通用 GPU 上**无法加速**（需要稀疏计算硬件支持）。

### 结构化剪枝

移除整个 attention head、FFN 神经元或整层：

- [LLM-Pruner](https://arxiv.org/abs/2305.11627)：基于梯度信息选择剪枝目标
- [ShortGPT](https://arxiv.org/abs/2403.03853)：发现中间层高度冗余，直接删除
- Width pruning + Depth pruning 组合

结构化剪枝可以直接加速，但通常需要后续微调恢复精度。

## 量化实战建议

### 场景选择

| 场景 | 推荐量化方案 | 原因 |
|------|------------|------|
| 生产部署（精度敏感） | FP8 或 W8A8 | 几乎无损，硬件加速好 |
| 生产部署（成本敏感） | AWQ INT4 | 精度/成本最优平衡 |
| 本地推理（消费级 GPU） | GGUF Q4_K_M | llama.cpp 生态好 |
| 本地推理（MacBook） | GGUF Q5_K_M/Q6_K | Metal 加速 |
| 边缘设备 | INT4 + 蒸馏小模型 | 极端资源受限 |
| 研究/评估 | FP16/BF16 | 基线精度 |

### 量化质量检查

量化后务必做以下检查：

1. **Perplexity 对比**：量化模型 vs. FP16 模型在验证集上的 PPL 差异
2. **Benchmark 对比**：关键评估指标（MMLU、HumanEval 等）的变化
3. **人工抽检**：特别关注长文本生成、数学推理、代码生成的质量
4. **边界情况**：罕见语言、专业术语、长上下文等场景

```
可接受的精度损失参考：
- PPL 增加 < 0.5: 优秀
- PPL 增加 0.5-1.0: 可接受
- PPL 增加 > 1.0: 需要谨慎评估
- MMLU 下降 < 1%: 优秀
- MMLU 下降 1-3%: 可接受
- MMLU 下降 > 3%: 需要重新评估量化方案
```

## 章节小结

| 方法 | 压缩比 | 是否需要校准 | 硬件要求 | 适用阶段 |
|------|--------|------------|---------|---------|
| FP8 | 2x | 可选 | H100+ | 训练 + 推理 |
| W8A8 (SmoothQuant) | 2x | 需要 | 通用 | 推理 |
| GPTQ (INT4) | 4x | 需要 | 通用 | 推理 |
| AWQ (INT4) | 4x | 需要 | 通用 | 推理 |
| GGUF (Q4) | 4x | 不需要 | CPU/GPU | 推理 |
| 知识蒸馏 | 可变 | 需要训练 | 通用 | 训练 |

量化不是万能药，但它是让大模型"飞入寻常百姓家"的关键技术。随着硬件对低精度计算的支持越来越好（H100 的 FP8、未来可能的 FP4），量化的边界还在不断拓展。
