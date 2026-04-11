---
title: "分布式训练工程"
description: "数据并行、模型并行、流水线并行——在数千张 GPU 上训练大模型的工程实践"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 8
part: "第二部分：预训练"
partOrder: 2
tags: ["分布式训练", "数据并行", "模型并行", "流水线并行", "通信"]
---

## 为什么需要分布式训练

一个 70B 参数的模型，仅权重就需要 **140GB**（BF16 格式）。加上优化器状态（$m$ 和 $v$，各占 280GB）、梯度（140GB）和激活值，单卡（即使 80GB H100）完全无法装下。

更重要的是**训练时间**。以 2T tokens 训练 70B 模型为例：

$$\text{FLOPs} \approx 6 \times N \times D = 6 \times 70 \times 10^9 \times 2 \times 10^{12} = 8.4 \times 10^{23}$$

一张 H100 的 BF16 算力约为 990 TFLOPS，但实际 MFU（Model FLOPs Utilization）通常在 40-50%：

$$\text{时间} = \frac{8.4 \times 10^{23}}{990 \times 10^{12} \times 0.45} \approx 1.89 \times 10^9 \text{ 秒} \approx 60 \text{ 年}$$

一张卡需要 60 年。用 2048 张卡，约 11 天。这就是为什么大模型训练必须是分布式的。

## 并行策略全景

现代分布式训练通常组合使用多种并行策略（**3D 并行** 甚至 **4D/5D 并行**）：

```
            ┌─────────────────────────────────┐
            │           3D+ Parallelism        │
            │                                  │
            │  ┌──────┐  ┌──────┐  ┌───────┐  │
            │  │ Data  │  │Tensor│  │Pipeline│  │
            │  │Parallel│ │Parallel│ │Parallel│ │
            │  └──────┘  └──────┘  └───────┘  │
            │     +                             │
            │  ┌──────────┐  ┌──────────────┐  │
            │  │  Expert   │  │  Context/    │  │
            │  │ Parallel  │  │  Sequence    │  │
            │  │  (MoE)    │  │  Parallel    │  │
            │  └──────────┘  └──────────────┘  │
            └─────────────────────────────────┘
```

## 数据并行（Data Parallelism）

### 基本 DP

最简单的并行策略：每张卡都持有完整的模型副本，各自处理不同的数据 batch，然后同步梯度。

$$g_{global} = \frac{1}{K}\sum_{k=1}^{K} g_k$$

使用 **AllReduce** 操作在所有 GPU 间同步梯度。

### ZeRO（Zero Redundancy Optimizer）

[DeepSpeed ZeRO](https://arxiv.org/abs/1910.02054)（Rajbhandari et al., 2020）是数据并行的革命性优化。核心思想：**DP 中每张卡都存了完整的优化器状态、梯度和参数——这是巨大的冗余**。

ZeRO 分三个阶段消除冗余：

| 阶段 | 分片内容 | 每卡显存（70B 模型） |
|------|---------|-------------------|
| 无 ZeRO | 全部 | ~1120 GB |
| ZeRO-1 | 优化器状态 | ~560 GB |
| ZeRO-2 | + 梯度 | ~420 GB |
| ZeRO-3 | + 参数 | ~280/K GB（K 卡） |

ZeRO-3 将所有内容均匀分片到 K 张卡上，需要时再通过通信获取。

### FSDP（Fully Sharded Data Parallel）

[PyTorch FSDP](https://arxiv.org/abs/2304.11277) 是 ZeRO-3 在 PyTorch 中的原生实现。核心 API：

```python
from torch.distributed.fsdp import FullyShardedDataParallel as FSDP

model = FSDP(
    model,
    sharding_strategy=ShardingStrategy.FULL_SHARD,
    mixed_precision=MixedPrecision(param_dtype=torch.bfloat16),
    auto_wrap_policy=transformer_auto_wrap_policy,
)
```

## 张量并行（Tensor Parallelism）

### 基本原理

[Megatron-LM](https://arxiv.org/abs/1909.08053)（Shoeybi et al., 2020）提出的方法：将模型内部的权重矩阵沿特定维度切分到多张卡上。

**MLP 层的切分**：

对于 $Y = XW_1 \cdot W_2$，将 $W_1$ 按列切分，$W_2$ 按行切分：

$$W_1 = [W_1^{(1)}, W_1^{(2)}], \quad W_2 = \begin{bmatrix} W_2^{(1)} \\ W_2^{(2)} \end{bmatrix}$$

每张卡计算 $Y^{(i)} = X W_1^{(i)} W_2^{(i)}$，然后做 **AllReduce** 得到最终结果。

**Attention 层的切分**：

按 head 维度切分——每张卡计算一部分 attention heads。

### 通信开销

张量并行每一层都需要两次 AllReduce 通信（前向 + 反向各两次）。因此**张量并行只适合在高带宽互连（如 NVLink）的卡之间使用**，通常限制在同一节点内的 4-8 张卡。

## 流水线并行（Pipeline Parallelism）

### 基本思想

将模型的不同层分配到不同的 GPU 上，形成"流水线"：

```
GPU 0: Layer 0-7    → GPU 1: Layer 8-15  → GPU 2: Layer 16-23 → GPU 3: Layer 24-31
```

### Bubble 问题

简单的流水线会产生大量的"气泡"（bubble）——某些 GPU 空闲等待上游/下游的数据：

```
GPU 0: [F1][F2][F3][F4]                    [B4][B3][B2][B1]
GPU 1:     [F1][F2][F3][F4]            [B4][B3][B2][B1]
GPU 2:         [F1][F2][F3][F4]    [B4][B3][B2][B1]
GPU 3:             [F1][F2][F3][F4][B4][B3][B2][B1]
                                ^^^^bubble^^^^
```

Bubble 比例约为 $(P-1)/(P-1+M)$，其中 $P$ 是 pipeline 阶段数，$M$ 是 micro-batch 数。

### 1F1B 调度

[PipeDream](https://arxiv.org/abs/1806.03377) 提出的 **1F1B**（One Forward One Backward）调度策略大幅减少 bubble：

```
GPU 0: [F1][F2][F3][F4][B1][F5][B2][F6][B3][B4][B5][B6]
GPU 1:     [F1][F2][F3][B1][F4][B2][F5][B3][F6][B4][B5][B6]
...
```

交替执行前向和反向，显著减少了空闲时间。

### Zero-Bubble Pipeline

[Qi et al. (2024)](https://arxiv.org/abs/2401.10241) 提出了零气泡流水线并行，通过更精细的调度几乎消除了 bubble。核心思想是将反向传播拆分为**输入梯度计算**和**权重梯度计算**两个阶段，更灵活地调度。

## 序列并行（Sequence/Context Parallelism）

当序列很长时（如 128K tokens），单卡可能无法装下完整的激活值。序列并行将长序列切分到多张卡上。

### Ring Attention

[Ring Attention](https://arxiv.org/abs/2310.01889)（Liu et al., 2023）是最优雅的序列并行方案：

1. 将序列切分为 $K$ 段，分配给 $K$ 张卡
2. 每张卡计算自己的 Q 与当前 K、V 的 Attention
3. 以环形方式传递 K、V 给下一张卡
4. 经过 $K$ 轮环形传递后，每张卡都计算了完整的 Attention

通信与计算可以重叠（pipeline），实现近线性扩展。

### DeepSpeed Ulysses

[DeepSpeed Ulysses](https://arxiv.org/abs/2309.14509) 使用 AllToAll 通信在序列维度上分片：

1. 每张卡持有序列的一部分，但所有 attention heads
2. AllToAll 交换 → 每张卡持有所有序列，但部分 heads
3. 计算 attention
4. AllToAll 交换回来

## Expert 并行（MoE 专用）

MoE 模型引入了独特的并行维度——不同专家可以放在不同的 GPU 上。

### All-to-All 通信

每个 token 需要路由到其被选中的专家所在的 GPU。这需要 **All-to-All** 通信：

```
Token 1 → Expert 3 (GPU 1)
Token 2 → Expert 7 (GPU 3)
Token 3 → Expert 1 (GPU 0)
Token 4 → Expert 5 (GPU 2)
```

All-to-All 的通信模式不规则，对网络带宽和拓扑敏感。

### DeepSeek V3 的 EP 策略

[DeepSeek V3](https://arxiv.org/abs/2412.19437) 的 256 个专家分布在 8 个节点上，每个节点 32 个专家。为减少跨节点通信：

1. **限制跨节点路由**：每个 token 最多路由到 $k$ 个不同节点的专家
2. **节点内共享专家**：1 个共享专家在所有 GPU 上都有副本
3. **负载均衡 loss**：训练时添加辅助 loss 促进均匀路由

## 通信拓扑与硬件

### GPU 互连层次

现代 GPU 集群的互连通常有多个层次：

| 层次 | 带宽 | 示例 |
|------|------|------|
| GPU 内存 ↔ GPU 计算 | ~3.35 TB/s | HBM3e |
| GPU ↔ GPU（节点内） | 900 GB/s | NVLink 5.0 (H100) |
| GPU ↔ GPU（跨节点） | 400 Gbps | InfiniBand NDR |
| 节点 ↔ 节点 | 400-800 Gbps | RoCE / IB |

**并行策略映射**：
- 张量并行 → NVLink 内（节点内，高带宽）
- 流水线并行 → 跨节点（对延迟敏感但带宽要求低）
- 数据并行 → 跨节点（AllReduce，通信与计算可重叠）

### 通信原语

| 原语 | 用途 | 复杂度 |
|------|------|--------|
| AllReduce | DP 梯度同步 | $O(M)$（M 为数据量） |
| AllGather | FSDP 参数恢复 | $O(M)$ |
| ReduceScatter | FSDP 梯度分片 | $O(M)$ |
| AllToAll | MoE 专家路由 | $O(M)$ |
| P2P Send/Recv | PP 层间传递 | $O(M/P)$ |

### NCCL

[NVIDIA NCCL](https://github.com/NVIDIA/nccl)（NVIDIA Collective Communications Library）是 GPU 集群通信的事实标准。它自动处理 NVLink/PCIe/IB 之间的拓扑感知路由。

## 训练框架

### 主流框架对比

| 框架 | 特点 | 适用场景 |
|------|------|---------|
| [Megatron-LM](https://github.com/NVIDIA/Megatron-LM) | NVIDIA 官方，性能最优，3D 并行 | 大规模预训练 |
| [DeepSpeed](https://github.com/microsoft/DeepSpeed) | ZeRO 系列，易用性好 | 通用训练 |
| [FSDP](https://pytorch.org/docs/stable/fsdp.html) | PyTorch 原生，API 简洁 | 中等规模训练 |
| [Megatron-DeepSpeed](https://github.com/microsoft/Megatron-DeepSpeed) | 结合两者优点 | 大规模预训练 |
| [veScale](https://github.com/volcengine/veScale) | 字节跳动开源，自动并行 | 易用+高性能 |
| [NeMo](https://github.com/NVIDIA/NeMo) | 端到端训练平台 | 企业级训练 |

### MFU（Model FLOPs Utilization）

MFU 是衡量分布式训练效率的核心指标：

$$\text{MFU} = \frac{\text{实际模型计算 FLOPs/s}}{\text{硬件峰值 FLOPs/s}}$$

| 规模 | 典型 MFU | 说明 |
|------|---------|------|
| 单卡/8卡 | 50-60% | NVLink 内通信开销小 |
| 64-256 卡 | 40-50% | 跨节点通信开始成为瓶颈 |
| 1K-8K 卡 | 35-45% | 需要精细的通信优化 |
| 10K+ 卡 | 30-40% | 故障恢复成本也变大 |

### 故障恢复

在数千张 GPU 的集群上训练数天/数周，**节点故障是常态而非意外**。

**检查点恢复**：定期保存模型状态、优化器状态、数据位置等。关键是**异步检查点保存**——保存检查点不应该阻塞训练。

**弹性训练**：[TorchElastic](https://pytorch.org/docs/stable/elastic/run.html) 和 [Bamboo](https://arxiv.org/abs/2310.07095) 支持节点动态加入/退出，无需重启整个训练任务。

---

> **下一章预告**：预训练完成后，模型具备了强大的语言能力但还不会"听话"。第九章我们将进入后训练的世界——SFT、RLHF、DPO，让模型对齐人类意图。
