---
title: "预训练配方"
description: "学习率、Batch Size、数据配比、训练稳定性——工业级预训练的完整配方"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 6
part: "第二部分：预训练"
partOrder: 2
tags: ["预训练", "学习率", "训练稳定性", "优化器"]
---

## 什么是"预训练配方"

预训练配方（pre-training recipe）是一个完整的训练方案，包括：

- **优化器选择和超参数**：Adam/AdamW 的 $\beta_1, \beta_2, \epsilon$
- **学习率调度**：warmup、decay 策略、最终学习率
- **Batch size 调度**：是否使用渐进式增大
- **数据配比和采样策略**：不同来源数据的混合比例
- **训练稳定性措施**：loss spike 处理、梯度裁剪等
- **检查点策略**：保存频率、恢复方法

看似简单的超参数选择，背后是大量的 ablation 实验和工程经验积累。本章将详细拆解每一项。

## 优化器

### AdamW

几乎所有现代 LLM 都使用 [AdamW](https://arxiv.org/abs/1711.05101)（Loshchilov & Hutter, 2019）优化器，即带解耦权重衰减的 Adam：

$$m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t$$
$$v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2$$
$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}, \quad \hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$
$$\theta_t = \theta_{t-1} - \eta \left(\frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} + \lambda \theta_{t-1}\right)$$

**常见超参数**：
| 参数 | 典型值 | 说明 |
|------|--------|------|
| $\beta_1$ | 0.9 | 一阶矩衰减 |
| $\beta_2$ | 0.95 | 二阶矩衰减（LLM 中通常用 0.95 而非默认 0.999） |
| $\epsilon$ | 1e-8 | 数值稳定性 |
| $\lambda$ | 0.1 | 权重衰减 |

> **为什么 $\beta_2 = 0.95$ 而不是 0.999？** 更小的 $\beta_2$ 意味着二阶矩估计对最近的梯度更敏感，对于 LLM 训练中可能出现的 loss spike 响应更快。[LLaMA](https://arxiv.org/abs/2302.13971) 和 [PaLM](https://arxiv.org/abs/2204.02311) 都使用 0.95。

### 新一代优化器

AdamW 的一个痛点是**内存开销大**——需要为每个参数存储两个状态（$m$ 和 $v$），加上 FP32 的参数副本，总共需要 **16 bytes/参数**（模型 4B + 梯度 4B + $m$ 4B + $v$ 4B）。

一些新优化器致力于降低内存使用：

- **[Adafactor](https://arxiv.org/abs/1804.04235)**：通过矩阵分解将二阶矩从 $O(mn)$ 压缩到 $O(m + n)$
- **[CAME](https://arxiv.org/abs/2307.02047)**：结合了 Adam 和 Adafactor 的优点
- **[Sophia](https://arxiv.org/abs/2305.14342)**：使用 Hessian 对角线的近似来做自适应学习率
- **[LION](https://arxiv.org/abs/2302.06675)**：只使用 sign 更新，内存减半（不需要 $v$）
- **[Muon](https://arxiv.org/abs/2502.16982)**：使用矩阵正交化的优化器，在部分实验中超越 Adam

> **实战选择**：目前 AdamW 仍然是最安全的选择。新优化器可能在特定场景下更优，但需要更多的调参经验。如果内存是瓶颈，可以考虑 Adafactor 或 8-bit Adam（[bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes)）。

## 学习率调度

学习率调度可能是预训练配方中**最关键的超参数**。

### Cosine Schedule

[LLaMA](https://arxiv.org/abs/2302.13971) 系列使用经典的 cosine decay：

$$\eta_t = \eta_{min} + \frac{1}{2}(\eta_{max} - \eta_{min})\left(1 + \cos\left(\frac{t - t_w}{T - t_w}\pi\right)\right)$$

其中 $t_w$ 是 warmup 步数，$T$ 是总训练步数。

**典型配置**：
- Peak LR ($\eta_{max}$): $3 \times 10^{-4}$（7B 模型）到 $1.5 \times 10^{-4}$（70B 模型）
- Min LR ($\eta_{min}$): Peak LR 的 1/10
- Warmup: 2000 步

### WSD Schedule（Warmup-Stable-Decay）

[MiniCPM](https://arxiv.org/abs/2404.06395) 和 [DeepSeek V3](https://arxiv.org/abs/2412.19437) 使用了一种更灵活的三阶段调度：

```
LR
 ^
 |   ___________________________
 |  /                           \
 | /                             \
 |/                               \____
 +---+-----------------------------+----→ steps
   warmup       stable            decay
```

**优势**：
- stable 阶段使用恒定学习率，不需要预先知道总训练步数
- 可以灵活决定何时开始 decay
- 适合"训到什么时候满意就停"的场景
- 方便 mid-training 的接续训练

### 学习率与模型大小的关系

[Yang et al. (2022)](https://arxiv.org/abs/2203.03466) 的 μP（Maximal Update Parameterization）理论给出了一个优雅的结论：

**可以在小模型上调好超参数，然后直接迁移到大模型**。

具体来说，当模型宽度从 $d_0$ 扩展到 $d$ 时，μP 建议：
- 学习率缩放为原来的 $d_0/d$
- 输出层权重初始化缩放为 $d_0/d$
- 其他层权重保持不变

这使得在 100M 模型上调好的学习率可以直接外推到 70B，大幅节省 hyperparameter search 的成本。

## Batch Size

### 固定 vs 渐进 Batch Size

[GPT-3 论文](https://arxiv.org/abs/2005.14165) 使用了渐进式增大 batch size：从 32K tokens 开始，逐步增大到 3.2M tokens。

渐进 batch size 的直觉：
- 训练初期，梯度方向变化大，小 batch 提供更多更新次数
- 训练后期，梯度方向趋于一致，大 batch 更高效且更稳定

### Critical Batch Size

[McCandlish et al. (2018)](https://arxiv.org/abs/1812.06162) 定义了 **critical batch size** $B_{crit}$：

$$B_{crit} = \frac{B_{noise}}{L}$$

其中 $B_{noise}$ 是梯度噪声尺度。当 $B < B_{crit}$ 时，增大 batch size 可以几乎线性加速训练；当 $B > B_{crit}$ 时，增大 batch 的收益递减。

**经验值**：对于 7B 模型，$B_{crit}$ 通常在 2-4M tokens 左右。

## 训练稳定性

大模型训练最痛苦的问题之一是**训练不稳定**——loss spike、loss divergence、NaN 等。

### Loss Spike

Loss spike 是训练过程中 loss 突然飙升的现象。常见原因：

1. **数据问题**：某个 batch 包含异常数据（如超长序列、乱码）
2. **学习率过高**：模型进入 loss landscape 的不稳定区域
3. **数值溢出**：FP16 训练中梯度超过表示范围
4. **Adam 状态异常**：二阶矩估计在训练初期不准确

### 应对策略

**1. 梯度裁剪（Gradient Clipping）**

$$g \leftarrow g \cdot \min\left(1, \frac{c}{\|g\|}\right)$$

典型裁剪阈值 $c = 1.0$。几乎所有 LLM 训练都使用。

**2. z-loss**

[PaLM](https://arxiv.org/abs/2204.02311) 引入了 z-loss 正则化：

$$\mathcal{L}_{z} = \alpha \cdot \log^2\left(\sum_i e^{z_i}\right)$$

其中 $z_i$ 是 logits。z-loss 惩罚过大的 logits 值，从而抑制 softmax 的数值不稳定。

**3. QK-Norm**

对 Attention 的 $Q$ 和 $K$ 做 LayerNorm：

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{\text{LN}(Q) \cdot \text{LN}(K)^T}{\sqrt{d_k}}\right)V$$

[Dehghani et al. (2023)](https://arxiv.org/abs/2302.05442) 证明 QK-Norm 可以显著提升训练稳定性，尤其是在使用 ViT 或深层 Transformer 时。

**4. 检查点回滚 + 数据跳过**

当 loss spike 发生时：
1. 回滚到 spike 前的检查点
2. 跳过导致 spike 的数据 batch
3. 降低学习率重新开始

这需要**频繁保存检查点**（如每 100 步），以及记录每个 batch 的数据索引。

### 训练监控实战

在工业级预训练中，你需要一套完整的监控系统来及时发现和处理问题：

**核心监控指标**：

```python
from dataclasses import dataclass
from typing import List, Optional
import math

@dataclass
class TrainingMetrics:
    """每步训练指标收集"""
    step: int
    loss: float
    lr: float
    grad_norm: float
    throughput_tokens_per_sec: float
    gpu_memory_used_gb: float
    mfu: float  # Model FLOPs Utilization
    
    # 可选的细粒度指标
    loss_by_domain: Optional[dict] = None  # 分域 loss
    max_logit: Optional[float] = None      # 最大 logit 值
    embedding_norm: Optional[float] = None  # embedding 层参数范数
    
    def is_anomaly(self, history: List['TrainingMetrics'], window: int = 100) -> dict:
        """检测异常"""
        alerts = {}
        if len(history) < window:
            return alerts
        
        recent_losses = [m.loss for m in history[-window:]]
        mean_loss = sum(recent_losses) / len(recent_losses)
        std_loss = (sum((l - mean_loss)**2 for l in recent_losses) / len(recent_losses)) ** 0.5
        
        # Loss spike: 超过 3 sigma
        if self.loss > mean_loss + 3 * std_loss:
            alerts["loss_spike"] = {
                "severity": "HIGH",
                "value": self.loss,
                "threshold": mean_loss + 3 * std_loss,
                "action": "检查当前 batch 数据质量，考虑跳过"
            }
        
        # Loss 发散: 连续上升
        if len(history) >= 5:
            last_5 = [m.loss for m in history[-5:]] + [self.loss]
            if all(last_5[i] < last_5[i+1] for i in range(len(last_5)-1)):
                alerts["loss_diverging"] = {
                    "severity": "CRITICAL", 
                    "action": "立即停止训练，回滚到最近检查点"
                }
        
        # Grad norm 异常
        recent_gnorms = [m.grad_norm for m in history[-window:]]
        mean_gnorm = sum(recent_gnorms) / len(recent_gnorms)
        if self.grad_norm > mean_gnorm * 5:
            alerts["grad_explosion"] = {
                "severity": "HIGH",
                "value": self.grad_norm,
                "action": "检查梯度裁剪是否生效"
            }
        
        # MFU 下降 (硬件问题)
        if self.mfu < 0.25:
            alerts["low_mfu"] = {
                "severity": "MEDIUM",
                "value": f"{self.mfu:.1%}",
                "action": "检查 GPU 通信/数据加载瓶颈"
            }
        
        return alerts
```

**训练日志看板**：

实践中，一个训练 run 通常需要监控以下面板：

| 看板 | 关键曲线 | 关注点 |
|------|---------|--------|
| Loss 面板 | 总 loss + 分域 loss | 整体下降趋势，有无 spike |
| 学习率 | LR schedule | 是否按预期调度 |
| 梯度范数 | Global grad norm | 有无爆炸/消失 |
| 吞吐量 | Tokens/sec + MFU | 有无掉速，是否稳定 |
| GPU | 显存/利用率/温度 | 有无 OOM 风险 |
| 数据 | 各域 loss + 数据消耗量 | 数据是否不均匀消耗 |

> **实战建议**：务必设置自动告警。半夜 3 点的 loss spike 如果没有自动告警，第二天早上你可能已经浪费了 8 小时的 GPU 时间。建议 loss 超过移动平均 2 倍时触发告警，连续 10 步上升时触发紧急告警。

## 混合精度训练

### BF16 vs FP16

| 格式 | 指数位 | 尾数位 | 范围 | 精度 |
|------|--------|--------|------|------|
| FP32 | 8 | 23 | ±3.4e38 | 高 |
| FP16 | 5 | 10 | ±65504 | 中 |
| BF16 | 8 | 7 | ±3.4e38 | 低 |

**BF16 是当前 LLM 训练的标准选择**——与 FP32 相同的数值范围（不容易溢出），虽然精度较低但对训练影响不大。

### FP8 训练

[FP8](https://arxiv.org/abs/2209.05433) 是下一代训练精度：

- **E4M3**（4 位指数 + 3 位尾数）：用于前向传播
- **E5M2**（5 位指数 + 2 位尾数）：用于反向传播的梯度

[DeepSeek V3](https://arxiv.org/abs/2412.19437) 成功使用 FP8 训练了 671B 参数的 MoE 模型，将训练成本大幅降低。关键技术包括 block-wise quantization 和 high-precision accumulation。

## 模型初始化

正确的初始化对训练稳定性至关重要。

### 标准初始化

大多数 LLM 使用 **截断正态分布** 初始化：

$$W \sim \mathcal{N}(0, \sigma^2), \quad \sigma = \sqrt{\frac{2}{d_{in} + d_{out}}}$$

（即 Xavier/Glorot 初始化）

### 残差层特殊处理

[GPT-2](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) 引入了对残差连接输出层的特殊处理：

$$\sigma_{residual} = \frac{1}{\sqrt{2L}}$$

其中 $L$ 是层数。这确保了即使在很深的网络中，残差连接的贡献也不会随层数增大而失控。

## 数据配比策略

数据配比（data mixing）是预训练配方中**投入产出比最高的调参项之一**。同样的计算预算，不同的配比策略可以带来显著的性能差异。

### 各大模型的配比对比

| 模型 | Web | Code | 书籍 | 学术 | 百科 | 数学 | 对话 |
|------|-----|------|------|------|------|------|------|
| LLaMA 1 | 67% | 4.5% | 4.5% | 2.5% | 4.5% | - | - |
| LLaMA 3 | 50% | 17% | 6% | 6% | 6% | 5% | 5% |
| DeepSeek V3 | ~45% | ~20% | - | - | - | ~10% | - |
| Qwen 2.5 | ~45% | ~18% | ~5% | ~5% | ~5% | ~8% | ~5% |

**趋势观察**：从 LLaMA 1 到 LLaMA 3，代码比例从 4.5% → 17%，数学从 0% → 5%。这反映了业界对**代码和数学增强通用推理能力**的共识。

### 配比搜索方法

**1. 小模型 proxy 实验（最常用）**

```python
# 配比搜索的评估框架
def evaluate_mix(mix_config: dict, model_size: str = "1B", tokens: int = 10e9):
    """评估一组配比的效果
    
    Returns:
        综合得分 = Σ(benchmark_score × weight)
    """
    benchmark_weights = {
        "mmlu": 0.20,      # 世界知识
        "hellaswag": 0.15,  # 常识推理
        "gsm8k": 0.20,     # 数学推理
        "humaneval": 0.20,  # 代码能力
        "arc": 0.10,       # 科学推理
        "winogrande": 0.15, # 语言理解
    }
    
    # 1. 用 mix_config 配比训练 model_size 模型 tokens 步
    # 2. 在所有 benchmark 上评估
    # 3. 计算加权综合得分
    
    scores = train_and_eval(mix_config, model_size, tokens)
    composite = sum(scores[b] * w for b, w in benchmark_weights.items())
    return composite
```

**2. 动态配比调整**

一些前沿工作尝试在训练过程中动态调整配比：
- 训练初期：更多通用数据（Web, 书籍），建立基础能力
- 训练中期：增加代码和数学比例，增强推理
- 训练后期：上采样高质量数据，退火（Annealing）

> **实战建议**：先用默认配比开始训练，每隔 100B tokens 评估一次，根据各 benchmark 的相对提升速度调整。如果某项明显落后，适当增加对应域的数据比例。

## 完整配方示例

以一个 7B dense 模型的训练为例：

```yaml
# 模型配置
model:
  hidden_size: 4096
  num_layers: 32
  num_attention_heads: 32
  num_kv_heads: 8  # GQA
  ffn_hidden_size: 11008
  vocab_size: 128256
  max_seq_len: 8192
  activation: swiglu
  norm: rmsnorm
  pos_encoding: rope (base=500000)

# 优化器
optimizer:
  type: adamw
  lr: 3e-4
  beta1: 0.9
  beta2: 0.95
  eps: 1e-8
  weight_decay: 0.1
  grad_clip: 1.0

# 学习率调度
lr_schedule:
  type: cosine
  warmup_steps: 2000
  min_lr: 3e-5  # peak_lr / 10
  
# Batch & 序列
batch_size: 4M tokens  # ~500 sequences × 8192 tokens
seq_len: 8192

# 训练数据 (2T tokens → ~500K steps)
data:
  total_tokens: 2T
  mix:
    web: 0.70
    code: 0.12
    books: 0.04
    wikipedia: 0.04
    arxiv: 0.03
    math: 0.03
    stackexchange: 0.02
    conversations: 0.02

# 精度
precision: bf16
  
# 检查点
checkpoint:
  save_interval: 500 steps
  keep_last: 5
```

---

> **下一章预告**：介于预训练和后训练之间，Mid-training（中训练）正在成为大模型训练流水线中不可或缺的新阶段。第七章我们将深入中训练的动机、方法和最佳实践。
