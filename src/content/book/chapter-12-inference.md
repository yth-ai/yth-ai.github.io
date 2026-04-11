---
title: "推理优化"
description: "从 KV Cache 到推测解码——让大模型跑得又快又省"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 12
part: "第四部分：推理与部署"
partOrder: 4
tags: ["推理优化", "KV Cache", "推测解码", "注意力优化", "批处理"]
---

## 推理成本的构成

LLM 推理（inference）的成本结构与训练截然不同。训练是一次性投入，而推理是**持续运营成本**——每一次用户请求都需要实实在在的 GPU 时间。

对于一个 70B 模型，生成一个 token 需要约 $2 \times 70 \times 10^9 = 1.4 \times 10^{11}$ FLOPs。在 H100 上（990 TFLOPS BF16），理论上每秒生成约 7000 tokens——但实际上，由于**内存带宽瓶颈**，只能做到 30-100 tokens/s。

### 计算密集 vs. 内存密集

LLM 推理有两个截然不同的阶段：

| 阶段 | 名称 | 特点 | 瓶颈 |
|------|------|------|------|
| Prefill | 预填充 | 并行处理整个输入序列 | **计算密集** |
| Decode | 解码 | 逐 token 自回归生成 | **内存带宽密集** |

**Prefill** 阶段：输入 $n$ 个 token，一次性计算所有 token 的 KV，类似训练的 forward pass。GPU 利用率高。

**Decode** 阶段：每步只生成 1 个 token，但需要读取整个 KV Cache。计算量很小（$O(d)$），但内存访问量很大（$O(n \cdot d)$），GPU 大部分时间在等数据从显存搬到计算单元。

> **Arithmetic Intensity**（算术强度）= FLOPs / Bytes。Decode 阶段的算术强度极低（~1-10），远低于 GPU 的 roofline 拐点（~100-300），因此是**内存带宽受限**的。

## KV Cache：空间换时间

### 基本原理

自回归生成中，每个新 token 需要与之前所有 token 做 Attention。如果每次都重新计算所有 token 的 $K, V$，复杂度是 $O(n^2)$。

**KV Cache** 的思路很简单：缓存之前计算过的 $K, V$，新 token 只需计算自己的 $K, V$，然后与缓存拼接：

```
Step 1: K = [k_1], V = [v_1]
Step 2: K = [k_1, k_2], V = [v_1, v_2]        ← k_1, v_1 来自缓存
Step 3: K = [k_1, k_2, k_3], V = [v_1, v_2, v_3]  ← k_1, k_2, v_1, v_2 来自缓存
```

### KV Cache 的显存占用

对于一个典型的 LLM，KV Cache 的大小为：

$$\text{KV Cache} = 2 \times n_{\text{layers}} \times n_{\text{kv\_heads}} \times d_{\text{head}} \times \text{seq\_len} \times \text{batch\_size} \times \text{dtype\_size}$$

以 LLaMA 3 70B 为例（80 层，8 个 KV head，128 维，BF16）：

| 序列长度 | 单请求 KV Cache | 128 并发 |
|---------|----------------|---------|
| 2K | 0.16 GB | 20 GB |
| 8K | 0.64 GB | 82 GB |
| 32K | 2.56 GB | 327 GB |
| 128K | 10.24 GB | 1.3 TB |

KV Cache 的显存占用在长上下文场景下会**超过模型权重本身**，成为主要的扩展瓶颈。

### KV Cache 压缩

**GQA/MQA**（见第 2 章）是最直接的压缩手段——减少 KV head 数量。

其他方法：

- **[StreamingLLM](https://arxiv.org/abs/2309.17453)**：只保留 attention sink token + 最近的窗口，丢弃中间的 KV
- **[H2O（Heavy-Hitter Oracle）](https://arxiv.org/abs/2306.14048)**：根据 attention 分数，只保留"重要" token 的 KV
- **[SnapKV](https://arxiv.org/abs/2404.14469)**：在 prefill 阶段识别重要 token，只缓存这些 token 的 KV
- **KV Cache 量化**：将 KV 从 FP16 量化到 INT8 甚至 INT4，显存减半或减到四分之一

## 注意力优化

### FlashAttention

[FlashAttention](https://arxiv.org/abs/2205.14135)（Dao et al., 2022）和 [FlashAttention-2](https://arxiv.org/abs/2307.08691) 是推理加速的基石。核心思想是**IO-aware 算法**——利用 GPU 的 SRAM（快但小）和 HBM（慢但大）的层级结构，通过 tiling 减少 HBM 访问：

```
标准 Attention:
  1. 计算 S = QK^T → 写 HBM (O(n²))
  2. 计算 P = softmax(S) → 读写 HBM (O(n²))
  3. 计算 O = PV → 读 HBM (O(n²))
  总 HBM 访问: O(n² + n·d)

FlashAttention:
  将 Q, K, V 切成 tiles，在 SRAM 中计算注意力
  总 HBM 访问: O(n·d)  ← 减少了 O(n²) 项！
```

FlashAttention 在推理中的加速效果：

| 序列长度 | 标准 Attention | FlashAttention-2 | 加速比 |
|---------|---------------|------------------|--------|
| 2K | 1.0x | 1.7x | 1.7x |
| 8K | 1.0x | 2.4x | 2.4x |
| 32K | 1.0x | 3.8x | 3.8x |
| 128K | OOM | 可运行 | ∞ |

### PagedAttention

[PagedAttention](https://arxiv.org/abs/2309.06180)（Kwon et al., 2023，vLLM 团队）解决了 KV Cache 的**内存碎片**问题。

传统方式为每个请求预分配连续显存（按最大序列长度），浪费 60-80% 的 KV Cache 空间。PagedAttention 借鉴操作系统的虚拟内存分页机制：

- 将 KV Cache 划分为固定大小的 **page**（如 16 tokens）
- 使用 **page table** 管理逻辑→物理映射
- 按需分配，不浪费

效果：KV Cache 内存利用率从 ~20-40% 提升到 **>95%**，吞吐量提升 2-4 倍。

## 批处理策略

### Continuous Batching（连续批处理）

传统 static batching 的问题：一个 batch 中最长的请求完成前，短请求只能空等。

[Continuous Batching](https://www.usenix.org/conference/osdi22/presentation/yu)（也叫 iteration-level batching，Orca, Yu et al., 2022）：

- 每个 decode step 检查是否有请求完成
- 完成的请求立即释放资源，新请求立即填入
- GPU 利用率从 <30% 提升到 **>80%**

### Prefill-Decode 分离

[Splitwise](https://arxiv.org/abs/2311.18677) 和 [DistServe](https://arxiv.org/abs/2401.09670) 提出将 prefill 和 decode 分到不同的 GPU 上：

```
Prefill GPU (计算密集)          Decode GPU (内存密集)
├── 处理新请求的输入              ├── 逐 token 生成
├── 高 GPU 利用率                ├── 高内存带宽利用率
└── 计算完 KV 后传给 Decode       └── 低延迟响应
```

这样每种 GPU 可以针对自己的工作负载进行优化。

## 推测解码（Speculative Decoding）

### 基本思想

[推测解码](https://arxiv.org/abs/2211.17192)（Leviathan et al., 2022; [Chen et al., 2023](https://arxiv.org/abs/2302.01318)）是近年最巧妙的推理加速技术之一：

1. 用一个**小的 draft 模型**（如 1B）快速生成 $\gamma$ 个候选 token
2. 将这 $\gamma$ 个 token 送入**大的 target 模型**一次性验证
3. 接受匹配的 token，拒绝不匹配的，从拒绝位置重新采样

关键性质：**推测解码在数学上保证与直接用大模型生成的分布完全一致**——不损失质量，只加速。

### 接受率分析

设 draft 模型在位置 $t$ 生成 token $x$ 的概率为 $q(x)$，target 模型为 $p(x)$，则接受概率为：

$$P(\text{accept}) = \min\left(1, \frac{p(x)}{q(x)}\right)$$

平均每次验证接受的 token 数为：

$$\mathbb{E}[\text{accepted}] = \sum_{i=1}^{\gamma} \prod_{j=1}^{i} \alpha_j$$

其中 $\alpha_j$ 是第 $j$ 个位置的平均接受率。draft 模型越好（与 target 分布越接近），接受率越高。

### 推测解码变体

| 方法 | Draft 来源 | 特点 |
|------|-----------|------|
| [SpecDec](https://arxiv.org/abs/2211.17192) | 小型独立模型 | 经典方法 |
| [Medusa](https://arxiv.org/abs/2401.10774) | 多个预测头 | 无需 draft 模型 |
| [EAGLE](https://arxiv.org/abs/2401.15077) / [EAGLE-2](https://arxiv.org/abs/2406.16858) | 特征级预测 | 更高接受率 |
| [Lookahead Decoding](https://arxiv.org/abs/2402.02057) | Jacobi 迭代 | 利用自身生成的 n-gram |
| Self-Speculative | 跳过层 / 提前退出 | 不需要额外模型 |

### 实际加速效果

| 方法 | 加速比 | 质量损失 |
|------|--------|---------|
| Speculative Decoding (2-draft) | 1.8-2.5x | 无 |
| Medusa-2 | 2.0-3.0x | 极小 |
| EAGLE-2 | 2.5-3.5x | 无 |
| Lookahead | 1.5-2.0x | 无 |

## 内核级优化

### Operator Fusion

将多个顺序操作融合为一个 GPU kernel，减少内存读写：

```
Before: LayerNorm → Linear → SiLU → Linear
  (4次 kernel launch, 4次 HBM 读写)

After: FusedFFN(LayerNorm + Linear + SiLU + Linear)
  (1次 kernel launch, 1次 HBM 读写)
```

### CUDA Graph

通过 [CUDA Graph](https://developer.nvidia.com/blog/cuda-graphs/) 预录制一系列 GPU 操作，避免每步的 CPU→GPU 调度开销。对 decode 阶段（计算量小、launch overhead 占比高）特别有效。

### 量化推理

在推理时使用低精度计算：

| 精度 | 类型 | 显存 | 速度 | 质量 |
|------|------|------|------|------|
| FP16/BF16 | 标准 | 1x | 1x | 基线 |
| INT8 (W8A8) | 全量化 | 0.5x | ~1.5x | 几乎无损 |
| INT4 (W4A16) | 仅权重量化 | 0.25x | ~1.8x | 轻微损失 |
| FP8 (E4M3) | H100 原生支持 | 0.5x | ~1.8x | 几乎无损 |

（详细量化方法见下一章）

## 推理框架

### vLLM

[vLLM](https://github.com/vllm-project/vllm) 是目前最流行的开源推理框架：

- **PagedAttention**：高效 KV Cache 管理
- **Continuous Batching**：动态批处理
- **Tensor Parallelism**：多卡推理
- **Quantization**：支持 GPTQ、AWQ、FP8
- **OpenAI-compatible API**：兼容 OpenAI API 格式

### TensorRT-LLM

[TensorRT-LLM](https://github.com/NVIDIA/TensorRT-LLM)（NVIDIA）通过编译优化实现极致性能：

- **图优化**：算子融合、常量折叠
- **FP8 支持**：在 H100 上充分利用 FP8 Tensor Core
- **In-flight Batching**：NVIDIA 版连续批处理
- **量化**：SmoothQuant、INT8/FP8 KV Cache

### SGLang

[SGLang](https://github.com/sgl-project/sglang)（LMSYS 团队）专注于**结构化生成**和编程性控制：

- **RadixAttention**：自动 KV Cache 复用（前缀共享）
- **Constrained Decoding**：JSON schema、正则表达式约束输出
- **Fork/Join 并行**：多个生成分支并行执行

### llama.cpp

[llama.cpp](https://github.com/ggerganov/llama.cpp) 是纯 C/C++ 实现的 CPU/GPU 推理引擎：

- **GGUF 量化格式**：支持 Q2 到 Q8 多种精度
- **跨平台**：macOS (Metal), Linux (CUDA/ROCm), Windows
- **消费级硬件友好**：MacBook 就能跑 70B 模型（量化后）

## 推理成本优化实战

### 典型部署配置（70B 模型）

| 配置 | GPU | 吞吐量 | 成本/1M tokens |
|------|-----|--------|---------------|
| FP16, TP=4 | 4x H100 | ~2000 tok/s | ~$0.30 |
| INT8, TP=2 | 2x H100 | ~2500 tok/s | ~$0.12 |
| FP8, TP=2 | 2x H100 | ~3000 tok/s | ~$0.10 |
| AWQ-4bit, TP=1 | 1x H100 | ~1500 tok/s | ~$0.08 |

### 优化检查清单

```
□ 使用 GQA/MQA 减少 KV Cache（模型选型时）
□ 开启 FlashAttention（默认应该开）
□ 使用 PagedAttention（vLLM/TRT-LLM）
□ 开启 Continuous Batching
□ 权重量化到 INT8 或 FP8
□ KV Cache 量化到 INT8
□ 开启 CUDA Graph（decode 阶段）
□ 推测解码（延迟敏感场景）
□ 前缀缓存（多轮对话 / 系统提示复用）
□ Prefill-Decode 分离（大规模部署）
```

## 章节小结

1. LLM 推理的核心瓶颈是 **decode 阶段的内存带宽**，不是计算
2. **KV Cache** 是空间换时间的核心机制，管理好它（PagedAttention、压缩、量化）是关键
3. **推测解码** 是唯一"免费午餐"——加速但不损失质量
4. **Continuous Batching** 将 GPU 利用率从 <30% 提升到 >80%
5. 实际部署中，上述技术组合使用，往往能实现 **5-10 倍**的成本降低
