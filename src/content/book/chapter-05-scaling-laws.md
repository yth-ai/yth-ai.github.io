---
title: "Scaling Laws：大模型的第一性原理"
description: "从 Kaplan 到 Chinchilla 到 MoE Scaling——理解并应用 Scaling Laws 指导训练决策"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 5
part: "第二部分：预训练"
partOrder: 2
tags: ["Scaling Laws", "Chinchilla", "计算预算", "训练策略"]
---

## 为什么 Scaling Laws 是"第一性原理"

Scaling Laws 不是学术游戏。它们是指导工业界**数十亿美元级资源分配决策**的核心工具。当你面对一个 $10M 的训练预算时，Scaling Laws 能帮你回答：

- 训多大的模型？
- 用多少数据？
- 训练多少步？
- 选 dense 还是 MoE？

回答这些问题之前，让我们从最基础的数学开始。

## Kaplan Scaling Laws (2020)

[Kaplan et al. (2020)](https://arxiv.org/abs/2001.08361) 首次系统揭示了 loss 与三个变量的幂律关系：

### 参数量 Scaling

在数据量充足（不是瓶颈）时：

$$L(N) = \left(\frac{N_c}{N}\right)^{\alpha_N}, \quad \alpha_N \approx 0.076, \quad N_c \approx 8.8 \times 10^{13}$$

**解读**：参数量每增加 10 倍，loss 下降约 $10^{-0.076} \approx 0.84$，即下降 16%。

### 数据量 Scaling

在模型足够大（不是瓶颈）时：

$$L(D) = \left(\frac{D_c}{D}\right)^{\alpha_D}, \quad \alpha_D \approx 0.095$$

**解读**：数据量每增加 10 倍，loss 下降约 $10^{-0.095} \approx 0.80$，即下降 20%。

### 计算量 Scaling

$$L(C) = \left(\frac{C_c}{C}\right)^{\alpha_C}, \quad \alpha_C \approx 0.050$$

### Kaplan 的关键结论

给定计算预算 $C$，最优分配策略为：

$$N_{opt} \propto C^{0.73}, \quad D_{opt} \propto C^{0.27}$$

这意味着 **Kaplan 建议把大部分计算预算分配给更大的模型，少量分配给数据**。按这个策略，GPT-3 (175B) 只需要 300B tokens 训练数据。

## Chinchilla Scaling Laws (2022)

[Hoffmann et al. (2022)](https://arxiv.org/abs/2203.15556) 的 Chinchilla 论文推翻了 Kaplan 的结论，发现 **参数量和数据量应该同步扩展**：

$$N_{opt} \propto C^{0.50}, \quad D_{opt} \propto C^{0.50}$$

具体来说，对于一个计算最优的模型，最优训练 token 数约为参数量的 20 倍：

$$D_{opt} \approx 20 \times N$$

### 三种估计方法

Chinchilla 论文用了三种独立的方法得出一致的结论：

1. **固定模型大小，变化训练数据**：对 400+ 个不同配置的模型做 IsoFLOP 分析
2. **固定计算预算，变化模型大小和数据**：IsoFLOP profiles
3. **直接拟合参数化的 loss 函数**：

$$L(N, D) = \frac{A}{N^\alpha} + \frac{B}{D^\beta} + E$$

其中 $A, B, \alpha, \beta, E$ 通过拟合实验数据得到，$E$ 是不可约的"熵下界"。

### Chinchilla vs GPT-3

| | GPT-3 | Chinchilla |
|---|---|---|
| 参数量 | 175B | 70B |
| 训练数据 | 300B tokens | 1.4T tokens |
| 计算量 | ~3.14e23 FLOPs | ~5.76e23 FLOPs |
| MMLU | 43.9% | 67.5% |

Chinchilla 用更少的参数但更多的数据，在几乎所有 benchmark 上超越了 GPT-3。而且因为模型更小，推理成本也更低。

### 工业界的反应

Chinchilla 的影响是立竿见影的。后续发布的模型几乎都遵循了"20 倍数据"原则：

| 模型 | 参数量 | 训练数据 | D/N 比 |
|------|--------|---------|--------|
| LLaMA 1 (65B) | 65B | 1.4T | 21.5x |
| LLaMA 2 (70B) | 70B | 2T | 28.6x |
| LLaMA 3 (70B) | 70B | 15T | 214x |
| Mistral 7B | 7B | ~2T | ~285x |
| Qwen 2.5 (72B) | 72B | 18T | 250x |

注意后期模型的 D/N 比远超 20x——这是因为大家发现 **over-training**（超越 Chinchilla 最优点继续训练）在实际部署中是有利的：虽然 loss 的边际改善变小了，但更小的模型推理更快、更便宜。

## 超越 Chinchilla：Over-Training

[Sardana & Frankle (2024)](https://arxiv.org/abs/2403.08540) 系统研究了 over-training 的影响，提出了修正的 Scaling Laws：

$$L(N, D, r) = \text{base\_scaling}(N, D) \cdot f(r)$$

其中 $r = D / D_{opt}$ 是 over-training 比率。他们发现：

- 2-5x over-training：loss 的额外开销很小，推理成本收益巨大
- 5-10x over-training：仍然有正收益，但边际递减
- >10x over-training：注意 loss 增加明显

> **实战建议**：如果你的目标是部署一个高效的模型，over-training 4-5x 通常是最好的折中。这就是为什么 LLaMA 3 选择用 15T tokens 训练 70B 模型。

## MoE 的 Scaling Laws

MoE（Mixture of Experts）带来了新的 scaling 维度。[Clark et al. (2022)](https://arxiv.org/abs/2202.08906) 和 [Krajewski et al. (2024)](https://arxiv.org/abs/2402.07871) 研究了 MoE 的 scaling 行为：

### 有效参数量

对于一个 MoE 模型，定义**有效参数量**为实际参与每次前向传播的参数量（而非总参数量）：

$$N_{eff} = N_{shared} + \frac{k}{E} \cdot N_{expert}$$

其中 $k$ 是 top-k 激活数，$E$ 是总专家数。

### MoE 的 Scaling 效率

经验表明，MoE 模型的 loss 大致遵循：

$$L_{MoE} \approx L_{dense}(N_{eff}) \cdot (1 - \gamma \log E)$$

即增加专家数（$E$）可以在不增加推理成本的情况下降低 loss。但收益是对数级的——从 8 个专家到 16 个专家的提升远大于从 128 到 256 的提升。

[DeepSeek V3 技术报告](https://arxiv.org/abs/2412.19437) 中的 MoE 配置（256 专家，top-8 激活）在效率和质量之间达到了很好的平衡。

## Scaling Laws 的实际应用

### FLOPs 计算公式

训练一个 Transformer 模型的总 FLOPs 可以用以下公式精确估算：

$$C \approx 6 \times N \times D$$

其中因子 6 的来源：前向传播约 $2ND$ FLOPs（每个 token 经过所有参数的矩阵乘法），反向传播约 $4ND$ FLOPs（梯度计算约为前向的 2 倍），合计 $6ND$。

> **注意**：这个公式忽略了 Embedding 层、LayerNorm、激活函数等开销，但对于大模型来说，这些不到总计算量的 5%。

更精确的逐层计算：

```python
def estimate_flops_per_token(
    num_layers: int,
    hidden_size: int,
    ffn_hidden_size: int,
    num_heads: int,
    num_kv_heads: int,
    vocab_size: int,
    seq_len: int,
) -> int:
    """估算每个 token 的前向 FLOPs（乘 3 得到训练 FLOPs）"""
    
    # Attention: QKV 投影 + Output 投影
    qkv_flops = 2 * hidden_size * (hidden_size + 2 * (hidden_size // num_heads) * num_kv_heads)
    attn_output_flops = 2 * hidden_size * hidden_size
    # Attention 矩阵计算 (QK^T + softmax @ V)
    attn_compute_flops = 2 * 2 * seq_len * hidden_size  # 近似
    
    # FFN (SwiGLU: 3 个矩阵)
    ffn_flops = 2 * 3 * hidden_size * ffn_hidden_size
    
    # 每层总计
    per_layer = qkv_flops + attn_output_flops + attn_compute_flops + ffn_flops
    
    # 所有层 + Embedding + LM Head
    total = num_layers * per_layer + 2 * 2 * vocab_size * hidden_size
    
    return total

# LLaMA 3 70B 的配置
flops_per_token = estimate_flops_per_token(
    num_layers=80, hidden_size=8192, ffn_hidden_size=28672,
    num_heads=64, num_kv_heads=8, vocab_size=128256, seq_len=8192
)
print(f"每 token 前向 FLOPs: {flops_per_token / 1e9:.1f} GFLOPs")
print(f"每 token 训练 FLOPs: {flops_per_token * 3 / 1e9:.1f} GFLOPs")
# → 每 token 前向 FLOPs: ~140 GFLOPs
# → 每 token 训练 FLOPs: ~420 GFLOPs
```

### 从预算到方案：GPU 时间计算

将 FLOPs 翻译成**需要多少 GPU、训练多少天**：

$$\text{训练时间（秒）} = \frac{6 \times N \times D}{\text{GPU 数量} \times \text{峰值 FLOPS} \times \text{MFU}}$$

其中 **MFU (Model FLOPs Utilization)** 是实际计算效率，典型值 35-50%。

```python
def training_plan(
    params_B: float,        # 参数量（十亿）
    tokens_T: float,        # 训练数据量（万亿 tokens）
    gpu_type: str = "H100", # GPU 型号
    num_gpus: int = 256,    # GPU 数量
    mfu: float = 0.40,      # MFU
):
    """计算训练计划"""
    gpu_specs = {
        "H100": {"bf16_tflops": 990, "price_per_hour": 3.0},
        "A100": {"bf16_tflops": 312, "price_per_hour": 1.5},
        "H200": {"bf16_tflops": 990, "price_per_hour": 4.0},  # HBM 更大
    }
    spec = gpu_specs[gpu_type]
    
    # 总 FLOPs
    total_flops = 6 * params_B * 1e9 * tokens_T * 1e12
    
    # 有效算力
    effective_flops_per_sec = num_gpus * spec["bf16_tflops"] * 1e12 * mfu
    
    # 训练时间
    seconds = total_flops / effective_flops_per_sec
    days = seconds / 86400
    
    # 成本
    gpu_hours = num_gpus * seconds / 3600
    cost = gpu_hours * spec["price_per_hour"]
    
    return {
        "total_flops": f"{total_flops:.2e}",
        "days": f"{days:.1f}",
        "gpu_hours": f"{gpu_hours:,.0f}",
        "cost_usd": f"${cost:,.0f}",
    }

# 案例：用 256 张 H100 训练 7B 模型
plan = training_plan(params_B=7, tokens_T=2, num_gpus=256)
# → 约 8.3 天, ~51K GPU-hours, ~$153K

# 案例：用 2048 张 H100 训练 70B 模型  
plan = training_plan(params_B=70, tokens_T=15, num_gpus=2048)
# → 约 31 天, ~1.5M GPU-hours, ~$4.6M
```

### 训练预算阶梯：从 $10K 到 $100M

不同预算级别应该怎么分配？以下是一个实用的阶梯式指南：

| 预算 | 算力（H100-hours） | 推荐配置 | 预期效果 |
|------|-------------------|---------|---------|
| **$10K** | ~3K | 1.3B, 50B tokens, 8×H100×2天 | 验证数据管线和训练代码 |
| **$50K** | ~17K | 3B, 200B tokens, 32×H100×3天 | 领域特定的基础模型 |
| **$200K** | ~67K | 7B, 1T tokens, 128×H100×4天 | 可用的通用模型 |
| **$1M** | ~333K | 13B, 3T tokens, 256×H100×8天 | 有竞争力的开源模型 |
| **$5M** | ~1.7M | 30B, 5T tokens, 512×H100×20天 | 接近商业水平 |
| **$20M** | ~6.7M | 70B, 15T tokens, 2048×H100×25天 | 前沿水平 |
| **$100M+** | ~33M+ | 200B+ / MoE 600B+, 20T+ tokens | Frontier 模型 |

> **实战建议**：先用总预算的 **5-10%** 做 Scaling Laws 实验（训练 3-5 个小模型），拟合参数后再决定最终方案。这笔"保险费"可以避免后续数千万美元的浪费。

### 计算预算到模型规格

给定计算预算 $C$，Chinchilla-optimal 分配：

$$N_{opt} \approx \sqrt{\frac{C}{6 \times 20}} = \sqrt{\frac{C}{120}}, \quad D_{opt} \approx 20 \times N_{opt}$$

**详细案例**：你有 $10^{22}$ FLOPs 的预算（约 $200K，128×H100 4 天）。

**方案 A：Chinchilla-optimal**
- $N \approx \sqrt{10^{22}/120} \approx 9.1 \times 10^{9} \approx 9B$
- $D \approx 180B$ tokens
- 推理时需要 ~18GB 显存（BF16），单卡可跑
- 训练时间：$\frac{6 \times 9 \times 10^9 \times 180 \times 10^9}{128 \times 990 \times 10^{12} \times 0.4} \approx 1.9 \times 10^5 \text{s} \approx 2.2 \text{天}$

**方案 B：Over-training 5x（更小模型更多数据）**
- $N \approx 3B$
- $D \approx 500B$ tokens
- 推理时只需 ~6GB 显存，手机都能跑
- 训练时间：~2.2 天（算力相同，只是分配不同）

**方案 C：MoE（同预算做更大的模型）**
- 总参数 $N_{total} \approx 16B$，激活参数 $N_{eff} \approx 3B$（8 专家 top-2）
- $D \approx 300B$ tokens
- 推理成本接近方案 B（只激活 3B），质量接近方案 A

> 这三种方案**花费完全相同**，但产物完全不同。Scaling Laws 的核心价值就是帮你在这些方案间做出最优选择。

## Loss 到 Downstream Performance

一个关键问题是：**loss 降低了，下游任务一定变好吗？**

[Wei et al. (2022)](https://arxiv.org/abs/2206.07682) 研究了"涌现能力"（emergent abilities），发现某些任务在 loss 下降到某个阈值后会突然"涌现"。但 [Schaeffer et al. (2023)](https://arxiv.org/abs/2304.15004) 后来证明这种"突然涌现"部分是评估指标选择的产物——用连续指标（如 Brier score）评估时，能力是逐渐提升的。

### 建立 Loss-Performance 映射

实践中最有价值的做法是，在训练过程中定期评估，建立你自己的 loss ↔ downstream performance 映射：

```python
# 伪代码：训练中的定期评估
eval_results = []

for step in range(total_steps):
    loss = train_step(batch)
    
    if step % eval_interval == 0:
        metrics = {
            "step": step,
            "loss": loss,
            "mmlu": evaluate(model, "mmlu"),
            "gsm8k": evaluate(model, "gsm8k"),
            "humaneval": evaluate(model, "humaneval"),
        }
        eval_results.append(metrics)
        
        # 拟合 loss → performance 的关系
        # 通常是 sigmoid：performance = a / (1 + exp(-b * (loss_threshold - loss)))
        fit_scaling_curve(eval_results)
        
        # 外推：预测 loss 继续下降后 performance 会到多少
        predicted_final = extrapolate(eval_results, target_loss=2.5)
        print(f"Step {step}: loss={loss:.4f}, MMLU={metrics['mmlu']:.1f}%")
        print(f"  预测最终 MMLU: {predicted_final['mmlu']:.1f}%")
```

> **实用建议**：不要只盯 loss。在训练过程中定期在目标任务上做 eval，建立 loss-performance 的映射关系。这条映射关系对于决定何时停止训练至关重要。

## 小模型预测大模型

Scaling Laws 最强大的应用是**用小模型预测大模型的行为**。

### 实战流程

```
Step 1: 训练小模型系列
  100M (1B tokens) → 2 GPU-hours
  300M (3B tokens) → 10 GPU-hours  
  1B   (10B tokens) → 80 GPU-hours
  3B   (30B tokens) → 400 GPU-hours
                      总计 ~492 GPU-hours (~$1.5K)

Step 2: 收集数据点
  (N=100M, D=1B, loss=3.42)
  (N=300M, D=3B, loss=3.05)
  (N=1B,   D=10B, loss=2.78)
  (N=3B,   D=30B, loss=2.55)

Step 3: 拟合 Scaling Law 参数
  L(N, D) = A/N^α + B/D^β + E

Step 4: 外推预测
  → 70B + 15T tokens: 预测 loss ≈ 1.82
  → 实际训练后: loss = 1.85  (误差 ~1.6%)
```

### 拟合代码

```python
import numpy as np
from scipy.optimize import curve_fit

def scaling_law(X, A, alpha, B, beta, E):
    """Chinchilla 风格的参数化 loss 函数"""
    N, D = X
    return A / np.power(N, alpha) + B / np.power(D, beta) + E

# 实验数据：(参数量, 数据量, loss)
data = [
    (1e8,  1e9,  3.42),
    (3e8,  3e9,  3.05),
    (1e9,  1e10, 2.78),
    (3e9,  3e10, 2.55),
]

N_vals = np.array([d[0] for d in data])
D_vals = np.array([d[1] for d in data])
L_vals = np.array([d[2] for d in data])

# 拟合
popt, pcov = curve_fit(
    scaling_law, (N_vals, D_vals), L_vals,
    p0=[1e2, 0.1, 1e2, 0.1, 1.5],  # 初始猜测
    bounds=([0, 0, 0, 0, 0], [1e5, 1.0, 1e5, 1.0, 5.0]),
    maxfev=10000,
)
A, alpha, B, beta, E = popt
print(f"拟合结果: A={A:.2f}, α={alpha:.4f}, B={B:.2f}, β={beta:.4f}, E={E:.4f}")

# 外推预测 70B + 15T tokens
predicted_loss = scaling_law((70e9, 15e12), *popt)
print(f"预测 70B/15T loss: {predicted_loss:.4f}")
```

[Muennighoff et al. (2024)](https://arxiv.org/abs/2403.08540) 展示了这种方法可以在 **1% 的计算成本下** 预测大模型的训练配方。

## 数据质量对 Scaling Laws 的影响

一个经常被忽视的事实：**Scaling Laws 的参数取决于数据质量**。

[FineWeb 论文](https://huggingface.co/spaces/HuggingFaceFW/blogpost-fineweb-v1) 的实验表明，在高质量数据上拟合的 Scaling Laws 曲线比低质量数据下降更快——也就是说，**好数据让每一个 FLOP 都更有价值**。

| 数据质量 | 有效 $\alpha_D$ | 含义 |
|---------|----------------|------|
| 未过滤 Common Crawl | ~0.07 | 数据量翻倍，loss 降 5% |
| Gopher 规则过滤 | ~0.09 | 数据量翻倍，loss 降 6.2% |
| FineWeb-Edu 质量过滤 | ~0.12 | 数据量翻倍，loss 降 8.3% |

> **核心洞察**：在做 Scaling Laws 实验时，**一定要用最终训练会用到的数据**做拟合。用低质量数据拟合出来的 Scaling Laws 去指导高质量数据的训练，预测会偏悲观——实际效果比预测的好。

这也解释了为什么很多团队投入大量资源在数据质量上：**提升数据质量本质上是在改变 Scaling Laws 的斜率**，让同样的计算预算产出更好的模型。

---

> **下一章预告**：有了 Scaling Laws 的理论指导，第六章我们将进入预训练的实战——学习率调度、batch size 选择、数据配比、loss spike 处理等训练配方的方方面面。
