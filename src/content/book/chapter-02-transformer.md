---
title: "Transformer 架构详解"
description: "从 Self-Attention 的数学推导到 GQA、MoE、MLA 等现代架构变体"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 2
part: "第一部分：基础篇"
partOrder: 1
tags: ["Transformer", "Attention", "MoE", "架构"]
---

## 从 Attention 说起

2017 年 Vaswani et al. 发表 [*"Attention Is All You Need"*](https://arxiv.org/abs/1706.03762)，提出了 Transformer 架构。这篇论文的核心贡献是用 **纯注意力机制** 替代了 RNN/LSTM 中的循环结构，实现了完全并行化的序列建模。

### Scaled Dot-Product Attention

Attention 的核心计算如下：

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

其中：
- $Q \in \mathbb{R}^{n \times d_k}$：Query 矩阵，代表"我要查询什么信息"
- $K \in \mathbb{R}^{m \times d_k}$：Key 矩阵，代表"我有什么信息可供查询"
- $V \in \mathbb{R}^{m \times d_v}$：Value 矩阵，代表"查到后返回什么信息"
- $\sqrt{d_k}$：缩放因子，防止点积值过大导致 softmax 梯度消失

**直觉理解**：想象你在图书馆找书。$Q$ 是你的查询需求，$K$ 是每本书的标签，$V$ 是书的内容。$QK^T$ 计算的是你的需求与每本书的匹配程度，softmax 将匹配度归一化为概率分布，最后加权求和得到你需要的信息。

### 为什么需要缩放？

不加缩放因子会怎样？假设 $Q$ 和 $K$ 的每个元素都是均值为 0、方差为 1 的随机变量，则 $Q K^T$ 的每个元素的方差为 $d_k$。当 $d_k$ 较大时（如 128），点积的值会非常大，导致 softmax 输出接近 one-hot 分布，梯度几乎为零。

除以 $\sqrt{d_k}$ 后，点积的方差被规范化为 1，softmax 可以正常工作。

### Multi-Head Attention

单头 Attention 只能捕捉一种类型的关系。Multi-Head Attention (MHA) 通过并行运行多个 Attention Head，让模型同时关注不同方面的信息：

$$\text{MHA}(Q, K, V) = \text{Concat}(\text{head}_1, \ldots, \text{head}_h) W^O$$

其中每个 head：

$$\text{head}_i = \text{Attention}(Q W_i^Q, K W_i^K, V W_i^V)$$

假设模型维度 $d_{model} = 4096$，头数 $h = 32$，则每个头的维度 $d_k = d_v = 128$。

**参数量计算**（一个 MHA 层）：

$$4 \times d_{model}^2 = 4 \times 4096^2 = 67,108,864 \approx 67M$$

这包括 $W^Q, W^K, W^V, W^O$ 各一个 $d_{model} \times d_{model}$ 的矩阵。

### Causal Masking

在 Decoder-only 模型中（GPT 系列），我们需要确保位置 $t$ 只能看到位置 $1, 2, \ldots, t$ 的信息（不能"偷看"未来）。这通过一个下三角掩码（causal mask）实现：

$$\text{mask}_{ij} = \begin{cases} 0 & \text{if } i \geq j \\ -\infty & \text{if } i < j \end{cases}$$

加在 softmax 之前：

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}} + \text{mask}\right)V$$

$-\infty$ 经过 softmax 后变为 0，实现了因果遮蔽。

## 完整的 Transformer Block

一个标准 Transformer Decoder Block 包含以下组件：

```
输入 x
  ↓
LayerNorm(x)          ← Pre-Norm（现代做法）
  ↓
Multi-Head Attention
  ↓
+ x                   ← 残差连接
  ↓
LayerNorm
  ↓
Feed-Forward Network
  ↓
+ x                   ← 残差连接
  ↓
输出
```

### Pre-Norm vs Post-Norm

原始 Transformer 使用 **Post-Norm**（先做 Attention/FFN，再 LayerNorm），但现代 LLM 几乎都使用 **Pre-Norm**（先 LayerNorm，再做 Attention/FFN）。原因是 Pre-Norm 的训练更稳定，梯度更平滑。

数学上的区别：

**Post-Norm**: $x_{l+1} = \text{LN}(x_l + F(x_l))$

**Pre-Norm**: $x_{l+1} = x_l + F(\text{LN}(x_l))$

Pre-Norm 的残差连接形成了一条"梯度高速公路"——无论网络多深，梯度都能直接流回输入。这对训练 100+ 层的 LLM 至关重要。

### RMSNorm

LLaMA 系列引入了 **[RMSNorm](https://arxiv.org/abs/1910.07467)**（Zhang & Sennrich, 2019），替代标准的 LayerNorm：

$$\text{RMSNorm}(x) = \frac{x}{\sqrt{\frac{1}{d}\sum_{i=1}^{d} x_i^2 + \epsilon}} \cdot \gamma$$

与 LayerNorm 的区别：RMSNorm 不做均值减除（re-centering），只做尺度归一化（re-scaling）。实践中效果相当但计算更快（省掉了均值计算）。

### Feed-Forward Network

标准 Transformer 的 FFN 是一个两层 MLP：

$$\text{FFN}(x) = W_2 \cdot \sigma(W_1 x + b_1) + b_2$$

现代 LLM 的改进是使用 **[SwiGLU](https://arxiv.org/abs/2002.05202)** 激活函数（Shazeer, 2020；被 LLaMA、PaLM 等采用）：

$$\text{FFN}_{SwiGLU}(x) = W_2 \cdot (\text{Swish}(W_1 x) \odot (W_3 x))$$

其中 $\text{Swish}(x) = x \cdot \sigma(x)$，$\sigma$ 是 sigmoid 函数，$\odot$ 是逐元素乘法。

SwiGLU 引入了第三个权重矩阵 $W_3$（gate），但 FFN 的隐藏层通常从 $4 \times d_{model}$ 缩小到 $\frac{8}{3} \times d_{model}$，总参数量大致相同。

**一个 FFN 层的参数量**（SwiGLU，$d_{model} = 4096, d_{ff} = 11008$）：

$$3 \times d_{model} \times d_{ff} = 3 \times 4096 \times 11008 \approx 135M$$

> **关键认识**：FFN 层的参数量约占整个 Transformer Block 的 2/3。越来越多的研究表明，FFN 实际上充当了"知识存储器"——模型的事实知识主要存储在 FFN 的权重中。

## 位置编码

Transformer 的 Self-Attention 本身是 **位置不变的**（permutation-equivariant）——打乱输入顺序，Attention 权重只是做相应的行列置换。因此需要显式注入位置信息。

### 绝对位置编码

原始 Transformer 使用正弦/余弦绝对位置编码，但这种方法不支持长度外推（训练时 512，推理时无法处理 8192）。

### RoPE（Rotary Position Embedding）

**[RoPE](https://arxiv.org/abs/2104.09864)**（Su et al., 2021）是目前 LLM 最流行的位置编码方法（LLaMA、Qwen、DeepSeek 等都在用）。核心思想是：**将位置信息编码为旋转角度**。

对于二维向量 $(q_0, q_1)$，在位置 $m$ 处的编码等价于旋转角度 $m\theta$：

$$\begin{pmatrix} q_0' \\ q_1' \end{pmatrix} = \begin{pmatrix} \cos m\theta & -\sin m\theta \\ \sin m\theta & \cos m\theta \end{pmatrix} \begin{pmatrix} q_0 \\ q_1 \end{pmatrix}$$

推广到高维，将 $d$ 维向量分成 $d/2$ 组，每组使用不同的频率 $\theta_i$：

$$\theta_i = 10000^{-2i/d}, \quad i = 0, 1, \ldots, d/2 - 1$$

RoPE 的关键性质：位置 $m$ 和位置 $n$ 的 query 和 key 的点积 **只依赖于相对位置 $m - n$**。这使得 RoPE 天然支持相对位置建模。

### RoPE 的长度外推

RoPE 的一个重要优势是可以通过调整基频来支持更长的上下文。比如 **[YaRN](https://arxiv.org/abs/2309.00071)**（Yet another RoPE extensioN）通过温度缩放和分段插值，将 RoPE 从 4K 外推到 128K+。

常见的外推策略：

| 方法 | 思路 | 效果 |
|------|------|------|
| 线性插值 | 将位置 $m$ 缩放为 $m/s$ | 简单有效，但需要微调 |
| NTK-Aware | 调整基频 $\theta$ | 不需要微调，适合短外推 |
| YaRN | 分频段处理 + 温度缩放 | 效果最好，需要少量微调 |
| Code RoPE | 高低频分别处理 | DeepSeek 方案 |

## 现代架构变体

### GQA（Grouped-Query Attention）

标准 MHA 中每个 head 都有独立的 $Q, K, V$。**[GQA](https://arxiv.org/abs/2305.13245)**（Ainslie et al., 2023）让多个 head 共享同一组 $K, V$，从而大幅减少 **KV Cache** 的内存占用。

假设 32 个 query head，8 个 KV head（每 4 个 query head 共享一组 KV）：

- **MHA**: KV Cache = $2 \times 32 \times 128 \times L$ （$L$ 是序列长度）
- **GQA-8**: KV Cache = $2 \times 8 \times 128 \times L$ （减少 4 倍！）

GQA 几乎不影响模型质量，但推理时的显存节省非常显著。LLaMA 2 70B 及后续大模型几乎都使用 GQA。

### MQA（[Multi-Query Attention](https://arxiv.org/abs/1911.02150)）

GQA 的极端情况：所有 head 共享同一组 $K, V$（只有 1 个 KV head）。显存最省，但对模型质量有一定影响。

### MLA（Multi-head Latent Attention）

[DeepSeek V2](https://arxiv.org/abs/2405.04434) 提出的创新。核心思想是用**低秩压缩**替代直接存储 KV：

$$c_t = W_{DKV} [k_t; v_t]$$

其中 $c_t \in \mathbb{R}^{d_c}$ 是压缩后的表示，$d_c \ll d_{model}$。推理时只需缓存 $c_t$，需要 $K, V$ 时再解压：

$$k_t = W_{UK} c_t, \quad v_t = W_{UV} c_t$$

MLA 可以达到比 GQA 更高的压缩率，同时保持接近 MHA 的质量。

### MoE（Mixture of Experts）

MoE 是当前最重要的架构创新之一。核心思想：**不是所有参数都需要在每次前向传播中被激活**。

在标准 Transformer 中，每个 token 都经过同一个 FFN。MoE 将 FFN 替换为多个"专家"，每个 token 只激活 top-k 个专家：

$$\text{MoE}(x) = \sum_{i=1}^{N} g_i(x) \cdot E_i(x)$$

其中 $g_i(x)$ 是路由函数（router）的输出，$E_i(x)$ 是第 $i$ 个专家网络，$N$ 是专家总数。通常只有 top-2 的 $g_i$ 非零。

**DeepSeek V3 的 MoE 配置**：
- 总共 256 个专家 + 1 个共享专家
- 每个 token 激活 8 个专家
- 总参数量 671B，激活参数量 37B
- 效果接近 dense 模型，但推理成本大幅降低

MoE 的关键挑战：
1. **负载均衡**：避免某些专家过载、某些专家闲置
2. **路由策略**：如何高效地选择专家
3. **通信开销**：分布式训练时，不同专家在不同 GPU 上，需要 all-to-all 通信

我们将在第七章深入讨论 MoE 的设计和训练。

## 完整模型的参数量计算

以一个 7B 参数的 LLaMA-style 模型为例：

| 组件 | 参数量公式 | 具体值 |
|------|-----------|--------|
| Embedding | $V \times d$ | 32000 × 4096 = 131M |
| Attention (per layer) | $4 d^2$ (GQA 会更少) | 4 × 4096² = 67M |
| FFN (per layer) | $3 d \times d_{ff}$ | 3 × 4096 × 11008 = 135M |
| RMSNorm (per layer) | $2d$ | 8K |
| 总 (32 layers) | | 32 × (67M + 135M) + 131M ≈ 6.6B |
| LM Head | 与 Embedding 共享 | 0 (tied) |

> **思考题**：为什么 LM Head 通常与 Embedding 矩阵 tied（共享权重）？这对模型有什么影响？（提示：正则化效果 + 参数效率）

## 核心组件的 PyTorch 实现

理论需要落地。下面我们用 PyTorch 实现一个现代 LLM 的核心组件——带 RoPE 的 GQA Attention 和 SwiGLU FFN。

### RoPE 位置编码实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Tuple

def precompute_freqs_cis(dim: int, max_seq_len: int, theta: float = 10000.0):
    """预计算 RoPE 的旋转频率（复数形式）"""
    # θ_i = 10000^{-2i/d}, i = 0, 1, ..., d/2 - 1
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2).float() / dim))
    # 位置索引 [0, 1, ..., max_seq_len - 1]
    t = torch.arange(max_seq_len, dtype=torch.float32)
    # 外积: [seq_len, dim//2]
    freqs = torch.outer(t, freqs)
    # 转换为复数: e^{i * m * θ} = cos(mθ) + i*sin(mθ)
    freqs_cis = torch.polar(torch.ones_like(freqs), freqs)
    return freqs_cis  # [seq_len, dim//2]

def apply_rotary_emb(xq: torch.Tensor, xk: torch.Tensor,
                     freqs_cis: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
    """将 RoPE 应用到 query 和 key"""
    # 将实数张量视为复数: [B, seq, n_heads, dim] → [B, seq, n_heads, dim//2]
    xq_ = torch.view_as_complex(xq.float().reshape(*xq.shape[:-1], -1, 2))
    xk_ = torch.view_as_complex(xk.float().reshape(*xk.shape[:-1], -1, 2))
    # 广播旋转: 复数乘法实现旋转
    freqs_cis = freqs_cis[:, None, :]  # [seq, 1, dim//2] for broadcasting
    xq_out = torch.view_as_real(xq_ * freqs_cis).flatten(-2)
    xk_out = torch.view_as_real(xk_ * freqs_cis).flatten(-2)
    return xq_out.type_as(xq), xk_out.type_as(xk)
```

### GQA Attention 实现

```python
class GroupedQueryAttention(nn.Module):
    """Grouped-Query Attention (GQA) with RoPE
    
    当 n_kv_heads == n_heads 时退化为标准 MHA
    当 n_kv_heads == 1 时退化为 MQA
    """
    def __init__(self, d_model: int, n_heads: int, n_kv_heads: int):
        super().__init__()
        self.n_heads = n_heads
        self.n_kv_heads = n_kv_heads
        self.n_rep = n_heads // n_kv_heads  # 每组 KV 被多少个 Q 头共享
        self.head_dim = d_model // n_heads

        self.wq = nn.Linear(d_model, n_heads * self.head_dim, bias=False)
        self.wk = nn.Linear(d_model, n_kv_heads * self.head_dim, bias=False)
        self.wv = nn.Linear(d_model, n_kv_heads * self.head_dim, bias=False)
        self.wo = nn.Linear(n_heads * self.head_dim, d_model, bias=False)

    def forward(self, x: torch.Tensor, freqs_cis: torch.Tensor,
                mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        B, L, _ = x.shape

        # 投影: [B, L, d] → [B, L, n_heads, head_dim]
        q = self.wq(x).view(B, L, self.n_heads, self.head_dim)
        k = self.wk(x).view(B, L, self.n_kv_heads, self.head_dim)
        v = self.wv(x).view(B, L, self.n_kv_heads, self.head_dim)

        # 应用 RoPE 位置编码
        q, k = apply_rotary_emb(q, k, freqs_cis)

        # GQA: 将 KV 头复制以匹配 Q 头数量
        # [B, L, n_kv, dim] → [B, L, n_heads, dim]
        k = k[:, :, :, None, :].expand(-1, -1, -1, self.n_rep, -1).flatten(2, 3)
        v = v[:, :, :, None, :].expand(-1, -1, -1, self.n_rep, -1).flatten(2, 3)

        # Attention: [B, n_heads, L, L]
        q, k, v = [t.transpose(1, 2) for t in (q, k, v)]
        scores = torch.matmul(q, k.transpose(-2, -1)) / (self.head_dim ** 0.5)
        if mask is not None:
            scores = scores + mask
        attn = F.softmax(scores, dim=-1)
        out = torch.matmul(attn, v)  # [B, n_heads, L, head_dim]

        # 合并多头: [B, L, d_model]
        out = out.transpose(1, 2).contiguous().view(B, L, -1)
        return self.wo(out)
```

### SwiGLU FFN 实现

```python
class SwiGLU_FFN(nn.Module):
    """SwiGLU Feed-Forward Network
    
    FFN_SwiGLU(x) = W2 · (Swish(W1·x) ⊙ W3·x)
    其中 Swish(x) = x · sigmoid(x)
    """
    def __init__(self, d_model: int, d_ff: int):
        super().__init__()
        # 注意: SwiGLU 有 3 个权重矩阵
        self.w1 = nn.Linear(d_model, d_ff, bias=False)   # gate projection
        self.w2 = nn.Linear(d_ff, d_model, bias=False)   # down projection
        self.w3 = nn.Linear(d_model, d_ff, bias=False)   # up projection

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Swish 激活 = SiLU in PyTorch
        return self.w2(F.silu(self.w1(x)) * self.w3(x))

# 用法示例: 完整的 Transformer Block
class TransformerBlock(nn.Module):
    def __init__(self, d_model: int, n_heads: int, n_kv_heads: int, d_ff: int):
        super().__init__()
        self.attention = GroupedQueryAttention(d_model, n_heads, n_kv_heads)
        self.feed_forward = SwiGLU_FFN(d_model, d_ff)
        self.norm1 = nn.RMSNorm(d_model)  # PyTorch 2.4+
        self.norm2 = nn.RMSNorm(d_model)

    def forward(self, x: torch.Tensor, freqs_cis: torch.Tensor,
                mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        # Pre-Norm + 残差连接
        x = x + self.attention(self.norm1(x), freqs_cis, mask)
        x = x + self.feed_forward(self.norm2(x))
        return x
```

> **动手练习**：尝试用上面的代码构建一个完整的 LLM 模型。你需要添加 Embedding 层、因果掩码生成、和 LM Head。提示：LM Head 通常与 Embedding 矩阵共享权重（`lm_head.weight = embed.weight`）。

## 从论文到工程

理解架构和实现是前两步，但要训练大规模 LLM，还需要一系列**工程优化**：

- **[FlashAttention](https://arxiv.org/abs/2205.14135)**（Dao et al., 2022）：通过 tiling 和内核融合，将 Attention 的内存复杂度从 $O(n^2)$ 降到 $O(n)$。在实际使用中，只需将上面的手写 attention 替换为 `F.scaled_dot_product_attention()`（PyTorch 2.0+），即可自动启用 FlashAttention
- **Fused Kernels**：将多个连续操作（如 LayerNorm + Linear）融合为一个 GPU kernel
- **[Tensor Parallelism](https://arxiv.org/abs/1909.08053)**（Megatron-LM）：将模型的权重矩阵沿特定维度分割到多个 GPU
- **Mixed Precision**：使用 BF16/FP8 混合精度训练，同时保持训练稳定性

这些将在第八章（分布式训练工程）中详细讨论。

---

### 📖 延伸阅读路线

- **下一章**：[第三章 Tokenizer 设计哲学](/book/chapter-03-tokenizer) — Tokenizer 看似是"预处理"的小事，实则深刻影响模型的效率、多语言能力和推理速度
- **工程落地**：[第八章 分布式训练工程](/book/chapter-08-distributed-training) — 本章代码在单卡上运行；如何将它扩展到数千张 GPU？
- **架构变体深入**：[第七章 中训练](/book/chapter-07-midtraining) — MoE 架构在中训练阶段的特殊考量
- **参数量与性能**：[第五章 Scaling Laws](/book/chapter-05-scaling-laws) — 7B 模型的参数量计算在本章完成，但如何决定"训多大的模型"？
