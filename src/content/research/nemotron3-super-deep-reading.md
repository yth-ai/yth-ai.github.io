---
title: "Nemotron-3 Super 精读报告"
description: "NVIDIA Nemotron-3 系列模型的深度技术解读"
date: 2026-03-12
category: 论文精读
tags: ["NVIDIA", "Nemotron", "预训练"]
draft: false
---
# Nemotron 3 Super: Open, Efficient MoE Hybrid Mamba-Transformer Model for Agentic Reasoning 精读

> **PAPER DEEP READING / NVIDIA Technical Report / 2026-03-11**

NVIDIA 出品 / 120B 总参数 / 12.7B 活跃参数 / Hybrid Mamba-Attention + LatentMoE 架构 / NVFP4 预训练 / 25T tokens / 1M 上下文 / 21 个 RL 环境 / 多智能体推理优化

| 指标 | 数值 |
|------|------|
| 总参数量 | **120.6B** |
| 活跃参数量 | **12.7B**（12.1B 不含 Embedding）|
| 架构 | **Hybrid Mamba-2 + Attention + LatentMoE** |
| 预训练 tokens | **25 万亿 (25T)** |
| 预训练精度 | **NVFP4**（首个大规模 FP4 训练模型）|
| 上下文长度 | **1M tokens** |
| 专家总数 / 激活数 | **512 / 22 (Top-22)** |
| MTP 层数 | **2（共享权重）** |
| 总层数 | **88 层** |
| SFT 样本数 | **7M+** |
| RL 环境数 | **21 个环境，37 个数据集** |
| 对比基线 | **GPT-OSS-120B, Qwen3.5-122B-A10B** |
| 推理吞吐提升 | **vs GPT-OSS-120B 2.2×, vs Qwen3.5-122B 7.5×** |

---

## 目录

1. [论文概览](#一论文概览)
2. [核心架构设计](#二核心架构设计)
3. [LatentMoE: 硬件感知的专家设计](#三latentmoe-硬件感知的专家设计)
4. [Multi-Token Prediction (MTP)](#四multi-token-prediction-mtp)
5. [NVFP4 预训练](#五nvfp4-预训练)
6. [预训练数据与超参数](#六预训练数据与超参数)
7. [后训练: SFT](#七后训练-sft)
8. [后训练: 强化学习](#八后训练-强化学习)
9. [推理量化](#九推理量化)
10. [评估结果](#十评估结果)
11. [核心洞察与启示](#十一核心洞察与启示)

---

## 一、论文概览

### 1.1 基本信息

| 项目 | 内容 |
|------|------|
| **标题** | Nemotron 3 Super: Open, Efficient Mixture-of-Experts Hybrid Mamba-Transformer Model for Agentic Reasoning |
| **机构** | **NVIDIA** |
| **发布时间** | 2026 年 3 月 11 日 |
| **开源** | Base、Post-trained、Quantized (FP8/NVFP4) 检查点和数据集均在 HuggingFace 开源 |
| **报告页数** | 51 页 |

### 1.2 核心贡献

> 📜 **原文 (Abstract)**:
> *"We describe the pre-training, post-training, and quantization of Nemotron 3 Super, a 120 billion (active 12 billion) parameter hybrid Mamba-Attention Mixture-of-Experts model. Nemotron 3 Super is the first model in the Nemotron 3 family to 1) be pre-trained in NVFP4, 2) leverage LatentMoE, a new Mixture-of-Experts architecture that optimizes for both accuracy per FLOP and accuracy per parameter, and 3) include MTP layers for inference acceleration through native speculative decoding."*

本报告的核心贡献可以概括为 **五个"首次"**：

1. **首个大规模 NVFP4 预训练**：在 25T tokens 上全程使用 FP4 精度稳定训练 120B 参数模型
2. **LatentMoE 架构创新**：一种新的 MoE 设计，同时优化每 FLOP 精度和每参数精度
3. **Hybrid Mamba-Attention-MoE 三合一**：将线性时间 Mamba-2、稀疏 MoE 和战略性全注意力层统一
4. **原生 MTP 加速推理**：内建 Multi-Token Prediction 层，实现无外部 Draft 模型的投机解码
5. **端到端开源**：数据集 + 基座 + 后训练 + 量化检查点完整开源

> 📜 **原文 (Introduction)**:
> *"Nemotron 3 Super achieves better or on-par benchmark accuracies than GPT-OSS-120B and Qwen3.5-122B while achieving up to 2.2× and 7.5× higher inference throughput, respectively, on the 8k token input / 64k token output setting."*

---

## 二、核心架构设计

### 2.1 架构总体结构

Nemotron 3 Super 是对 Nemotron 3 Nano 架构的 **稀疏化放大**，核心由三根支柱构成：

| 组件 | 设计选择 | 核心优势 |
|------|----------|----------|
| 序列建模 | Mamba-2 块（线性时间） | 恒定大小状态，推理低延迟 |
| 稀疏扩展 | LatentMoE（512 专家 Top-22） | 高参数效率，低带宽/通信成本 |
| 全局锚点 | 周期性 Attention 层 | 全 token 交互，长程信息路由 |

> 📜 **原文 (Architecture)**:
> *"Nemotron 3 Super 120B-A12B Base scales up the hybrid Mamba-Attention Mixture-of-Experts (MoE) architecture introduced in Nemotron-3 Nano. We extend this foundation to 120.6B total parameters, maintaining a constrained active budget of 12.7B parameters (12.1B excluding embeddings) per forward pass. The architecture comprises three core pillars: sparse LatentMoE scaling, Multi-Token Prediction (MTP) for inference acceleration, and a periodic hybrid interleaving pattern."*

### 2.2 架构配置详表

| 配置项 | 数值 |
|--------|------|
| 总层数 | 88 |
| 模型维度 (d) | 4096 |
| Q-Heads | 32 |
| KV-Heads | 2 |
| Head Dimension | 128 |
| Mamba State Dimension | 128 |
| Mamba Groups | 8 |
| Mamba Heads / Head Dim | 128 / 64 |
| Expert Hidden Dimension | 2688 |
| Shared Expert Intermediate Size | 5376 |
| 每层总专家数 | 512 |
| Top-k 激活专家数 | 22 |
| MoE Latent Size | 1024 |
| MTP 层数（共享权重） | 2 |

### 2.3 混合交错模式

88 层网络遵循周期性交错模式：以 Mamba-2 + LatentMoE 为主体，在固定间隔插入少量全注意力层作为"全局锚点"。

> 📜 **原文 (Hybrid Interleaving)**:
> *"The 88-layer stack follows a periodic interleaving pattern in which MoE layers are paired with Mamba-2 blocks. While Mamba provides efficient linear-time sequence modeling, a limited number of self-attention layers are strategically inserted as global 'anchors' to enable full-token interaction and long-range information routing across the stack."*

具体交错模式为 `[Mamba-2 + LatentMoE] × 4 → [Mamba-2 + Attention + LatentMoE] × 3`，重复堆叠。其中：

- **无位置编码**：省略位置 Embedding
- **无 Dropout 和 Bias**：线性层中去除
- **RMSNorm 归一化**
- **非绑定 Embedding/Output 权重**

> 📜 **原文**:
> *"Overall, the synergy between linear-time Mamba blocks, sparsely activated MoE capacity, and strategically placed attention anchors enables Nemotron 3 Super to deliver strong long-context performance while remaining optimized for real-world deployment on modern hardware."*

---

## 三、LatentMoE: 硬件感知的专家设计

这是本文最重要的架构创新之一。LatentMoE 从硬件-软件协同设计的视角重新审视了 MoE 架构。

### 3.1 设计动机

> 📜 **原文 (LatentMoE Motivation)**:
> *"Existing MoE designs are largely motivated by high-level sparsity arguments and optimized for offline, throughput-oriented settings, with little consideration for online deployments that impose strict latency, memory bandwidth, and communication constraints. Whereas accuracy per FLOP reflects computational efficiency, accuracy per parameter captures memory footprint, memory bandwidth, routing-induced communication, and sharding overhead."*

核心洞察：现有 MoE 设计只关注"每 FLOP 精度"（计算效率），忽略了"每参数精度"（内存带宽、通信开销）。

### 3.2 三条设计原则

NVIDIA 从系统分析中提炼出三条核心设计原则：

> 📜 **原文 (Design Principles)**:
> *"1. In low-latency serving, MoE inference is often dominated by the memory bandwidth cost of reading expert weights. Each expert matrix has size d × m, where d is the hidden dimension and m is the expert FFN intermediate dimension; reducing this cost therefore requires decreasing d or m."*
>
> *"2. In throughput-oriented serving, distributed MoE inference is dominated by all-to-all routing. Routing volume scales as d × K, where K is the number of active experts; reducing communication overhead therefore requires decreasing d or K."*
>
> *"3. Preserving model quality requires preserving the effective nonlinear budget K · m."*

解读：

| 原则 | 瓶颈 | 解法 |
|------|------|------|
| 低延迟场景 | 读专家权重的内存带宽 (d × m) | 减小 d 或 m |
| 高吞吐场景 | All-to-all 路由通信 (d × K) | 减小 d 或 K |
| 精度保持 | 非线性预算 K · m | 保持不变 |

### 3.3 Latent 投影解法

LatentMoE 的核心思路是：在 token 进入专家之前，先通过一个 **低秩 Latent 投影**（将隐藏维度 d 压缩到 Latent Size 1024），从而在不牺牲非线性预算 K·m 的前提下，大幅减少：

- **带宽消耗**：路由通信量从 d → latent_size（4096 → 1024，4× 压缩）
- **内存读取**：每个专家的输入维度从 d 降为 latent_size

这使得 Nemotron 3 Super 能够使用 **512 个总专家 / 22 个激活专家** 这一极端稀疏配置，而每个专家的 FFN 中间维度仅需 2688（相比 DeepSeek 的 2048 或 Qwen 的更大配置），实现了更好的精度-效率帕累托前沿。

---

## 四、Multi-Token Prediction (MTP)

### 4.1 MTP 设计

Nemotron 3 Super 内建 2 层共享权重的 MTP 层，用于在推理时实现 **原生投机解码**——不需要外部 Draft 模型。

> 📜 **原文 (MTP)**:
> *"Nemotron 3 Super also incorporates Multi-Token-Prediction (MTP) layers that enable native speculative decoding, delivering up to 2.2× higher inference throughput while maintaining accuracy."*

### 4.2 投机解码性能

在 SPEED-Bench 基准上（draft length = 7），Nemotron 3 Super 的平均接受长度为 **3.45**，优于 DeepSeek-R1 (2.70) 和 Qwen3-Next (3.33)。

| 类别 | DeepSeek-R1 | Qwen3-Next | Nemotron 3 Super |
|------|-------------|------------|------------------|
| Coding | 2.99 | **4.32** | 3.78 |
| Math | 2.98 | **3.89** | 3.73 |
| Multilingual | 2.83 | 3.97 | **4.05** |
| Roleplay | 2.19 | 2.17 | **2.82** |
| Summarization | 2.59 | 3.06 | **3.48** |
| Writing | 2.41 | 2.69 | **2.99** |
| **Average** | 2.70 | 3.33 | **3.45** |

> 📜 **原文 (MTP Acceptance)**:
> *"Nemotron 3 Super achieves higher average acceptance lengths than both DeepSeek-R1 and Qwen3-Next across most categories, with particularly aggressive design under longer speculative rollouts."*

提高 draft depth 从 D=1 到 D=3，可以显著改善吞吐-延迟帕累托前沿。

---

## 五、NVFP4 预训练

### 5.1 首个大规模 FP4 训练

这是本文的重要工程贡献。Nemotron 3 Super **全程在 NVFP4 精度下训练了 25T tokens**，这是迄今为止规模最大的 FP4 预训练。

> 📜 **原文 (NVFP4 Pretraining)**:
> *"Nemotron 3 Super was trained with the NVFP4 pretraining recipe detailed in the Nemotron 3 white paper. All linear layers, unless otherwise noted, are trained using the open-source NVFP4 GEMM kernels provided by Transformer Engine with the cuBLAS backend for fprop, dgrad, and wgrad GEMMs."*

### 5.2 精度分配策略

并非所有层都使用 FP4，NVIDIA 设计了精细的混合精度方案：

| 层类型 | 精度 | 设计理由 |
|--------|------|----------|
| 所有 Linear 层（除下列外） | **NVFP4** | 主体训练精度 |
| 网络最后 15% | BF16 | 促进大规模训练稳定性 |
| Latent 投影层 | BF16 | 对 step-time 影响可忽略 |
| MTP 层 | BF16 | 保持多 token 预测能力 |
| QKV & Attention 投影 | BF16 | 维持少量注意力层的保真度 |
| Mamba 输出投影 | MXFP8 | 缓解量化到 NVFP4 时的严重下溢 |
| Embedding 层 | BF16 | — |

### 5.3 NVFP4 格式细节

> 📜 **原文 (NVFP4 Format)**:
> *"The NVFP4 format utilizes an E2M1 element format with 16-element micro-blocks, E4M3 micro-block scaling factors, and a second-level FP32 global scale."*

- **权重**：使用二维 (2D) 块缩放量化到 NVFP4
- **梯度和激活**：使用沿 GEMM 归约轴的一维 (1D) 块量化
- **随机 Hadamard 变换 (RHT)**：应用于 wgrad 输入
- **随机舍入**：应用于梯度张量

### 5.4 零梯度现象分析

训练过程中观察到零值权重梯度元素数量增长（最终占总参数的 **7%**），NVIDIA 对此进行了深入分析：

> 📜 **原文 (Zero Gradients)**:
> *"We compare identical Nemotron 3 Nano models trained for 1T tokens in BF16 and in NVFP4 and find that NVFP4 pretraining produces roughly 3x more zero-valued weight gradients at the same token horizon. When a partially trained NVFP4 model is switched back to BF16, the number of zero-valued weight gradients returns to baseline levels."*

关键发现：

- NVFP4 训练比 BF16 产生约 **3 倍** 更多的零梯度
- 切回 BF16 后，零梯度数量回到基线水平
- 根因是 BF16 中的极小梯度（<1e-12）在 FP4 量化时下溢为零
- 这些低范数通道在 FC1 输出和 FC2 输入之间呈对齐模式

---

## 六、预训练数据与超参数

### 6.1 预训练数据

Nemotron 3 Super 在 **25T tokens** 上进行预训练，使用两阶段数据混合策略：

**Phase 1**（前 80% tokens）：

| 数据类别 | 占比 |
|----------|------|
| syn-crawl-high（高质量合成网页） | 22.4% |
| code（代码） | 14.0% |
| mmlu-sft | 11.1% |
| math（数学） | 6.4% |
| crawl-high | 6.5% |
| finepdfs | 6.1% |
| crawl-medium-high | 5.7% |
| multilingual（多语言） | 5.0% |
| 其他 | ~22.8% |

**Phase 2**（后 20% tokens）—— 提升质量分布：

- 移除低质量 crawl-medium 数据
- finepdfs-high 占比从 6.1% 提升到 **14.3%**
- mmlu-sft 替换为 stem-sft（**11.8%**）

### 6.2 合成数据创新

**Synthetic Code Concepts**：

> 📜 **原文 (Synthetic Code)**:
> *"Using a taxonomy consisting of thousands of programming concepts curated from our Nemotron-Pretraining-Code datasets and GPT-OSS-120B, we extracted high-level programming concepts from the HumanEval benchmark dataset. In total, after deduplication of the extracted taxonomical representations, we collected a total of 91 concepts."*

- 从 91 个编程概念出发，组合生成 **约 1400 万** 个 Python 编程问题
- 每个问题生成 5 个自解答（限制 60 行内），得到约 **2300 万** 个问题-解答对
- 使用 GPT-OSS-20B 生成问题，GPT-OSS-120B 生成解答

### 6.3 超参数

> 📜 **原文 (Hyperparameters)**:
> *"The pretraining of Nemotron 3 Super 120B-A12B Base was conducted using a Warmup-Stable-Decay (WSD) learning rate schedule over a total horizon of 25 trillion tokens. The learning rate was warmed up over the initial 200 billion tokens to a peak value of 4.5 × 10⁻⁴."*

| 超参数 | 数值 |
|--------|------|
| 学习率调度 | WSD (Warmup-Stable-Decay) |
| 峰值 LR | 4.5 × 10⁻⁴ |
| 最小 LR | 4.5 × 10⁻⁶ |
| Warmup tokens | 200B |
| Decay 策略 | minus-sqrt，最后 5T tokens |
| 优化器 | AdamW (β₁=0.9, β₂=0.95, wd=0.1) |
| 序列长度 | 8192 |
| Batch size | 3072 序列（~25.17M tokens/batch） |
| 路由机制 | Sigmoid + Expert Biasing |
| 负载均衡 | 无辅助损失策略 (update rate 10⁻³) + 标准负载均衡损失 (系数 10⁻⁴) |
| MTP 损失系数 | 0.3 |

### 6.4 Tracking Merge 评估

在 WSD 的 Stable 阶段，单个检查点的 benchmark 表现有噪声。NVIDIA 采用 **Tracking Merge** 策略——对一系列检查点进行指数移动平均（EMA）合并，以获得更平滑的评估信号。

### 6.5 长上下文扩展

> 📜 **原文 (Long-Context Extension)**:
> *"We used a constant learning rate of 4.5 × 10⁻⁶ and global batch size of 16. We used 64-way context parallelism, 2-way tensor parallelism, and 64-way expert parallelism to train on GB200 GPUs."*

- 第一阶段：在 **1M** 上下文长度上持续预训练 **34B tokens**
- 第二阶段：交替训练 1M 和 4K 序列，持续 **17B tokens**（缓解对数学 benchmark 的轻微影响）
- 长上下文文档 QA 数据占 Phase LC 混合的 **20%**

---

## 七、后训练: SFT

### 7.1 整体流程

后训练流程为：SFT → RLVR (3 轮) → SWE-RL → RLHF → MTP Healing

> 📜 **原文 (Post-Training Overview)**:
> *"We follow the same general recipe as Nemotron 3 Nano, with a stronger emphasis on agentic tasks. ... This infrastructure allows us to (1) train across 21 diverse environments, improving robustness across tasks, and (2) train on long-horizon SWE tasks, strengthening multi-step reasoning and problem solving in realistic agentic settings."*

### 7.2 SFT 数据构成

SFT 总量超过 **7M 样本**，覆盖 **80B tokens**。相比 Nano，显著增加了 Agentic 任务的比重：

**关键领域及数据策略**：

**Agentic Coding**：

> 📜 **原文 (Agentic Coding SFT)**:
> *"We distill from high-performance, open-source agentic LLMs such as Qwen-3-Coder-480B and MiniMax M2.5 by recording their interactions with various CLI environments, such as Codex, OpenCode, Qwen Code CLI, and Stirrup."*

- 从 SWE-bench lite 采样 300 个 issue（排除与 Verified 集的重叠）
- 合成 **10K web 开发任务**（100 个细粒度任务种类为种子）
- 蒸馏源：Qwen-3-Coder-480B、MiniMax M2.5
- 交互轨迹经过过滤、标准化为 OpenAI message 格式

**Long Context**：

> 📜 **原文 (Long Context SFT)**:
> *"The prompt requires questions to involve cross-document or cross-section navigation, ensuring information is scattered rather than localized. It strictly enforces multi-hop reasoning, requiring at least 4 to 7 distinct retrieval or reasoning steps."*

- 从预训练混合中提取长序列（书籍、论文、财报、代码库）
- 按主题聚类，拼接至 128K/256K/512K tokens
- 每个样本生成 8 个独立推理轨迹，语义多数投票选最短正确答案
- 7 种合成推理任务（使用 Qwen3-235B-A22B-Thinking-2507 生成）

**Financial Reasoning**：

> 📜 **原文 (Financial Reasoning)**:
> *"The pipeline sources 565 expert-authored seed questions from the SecQue benchmark, a dataset of financial analysis questions anchored to SEC 10-K and 10-Q filings. These seeds are expanded combinatorially across S&P 500 companies and fiscal years (2019–2024)."*

- 使用 GenSelect 策略：每问题采样 5 个候选答案，Qwen3-235B 作为 Judge 选最佳

**Search Agent**：

> 📜 **原文 (Search Agent)**:
> *"We query SPARQL for well-connected hub entities across approximately 25 verified entity classes (cities, universities, films, chemical elements, etc.), then perform random walks of 4-8 hops through the graph... Each resulting SFT record is a multi-turn conversation where assistant turns interleave chain-of-thought reasoning with structured tool calls... an average of 12 tool calls per trajectory."*

**Safety**：

> 📜 **原文 (Safety SFT)**:
> *"In the first stage, we construct a concise reasoning trace that guides the model to reflect on the safety properties of the prompt, explicitly identifying why the request may be unsafe or policy-relevant and what constraints should govern the response."*

两阶段方法：先生成安全推理轨迹，再基于推理生成合规响应。

### 7.3 推理控制

Nemotron 3 Super 支持 **三种推理模式**：

| 模式 | 描述 | 数据量 |
|------|------|--------|
| reasoning-off | 关闭推理链 | 随机 3% 样本去除推理轨迹 |
| regular | 标准推理 | 主体 |
| low-effort | 低计算推理（新增） | 占 SFT 2%，由 GPT-OSS-120B low-effort 模式生成 |

> 📜 **原文 (Reasoning Control)**:
> *"These combinations of controls provide flexibilities that cover the entire spectrum of accuracy-efficiency trade-off to meet customers' needs in various application scenarios."*

---

## 八、后训练: 强化学习

### 8.1 RL 四阶段流程

强化学习是 Nemotron 3 Super 后训练的核心，包含 **四个阶段**：

```
Stage 1: Multi-env RLVR (3 轮) → Stage 2: SWE-RL → Stage 3: RLHF → Stage 4: MTP Healing
```

### 8.2 Stage 1: Multi-Environment RLVR

> 📜 **原文 (RLVR)**:
> *"We scale up our RL data significantly compared to Nemotron 3 Nano... In total, we train on 21 environments and 37 different RL datasets."*

**21 个训练环境覆盖**：

| 环境类别 | 说明 |
|----------|------|
| Math | 竞赛数学 + Python 工具 + 形式化证明验证 |
| Code | 竞赛风格编程 |
| STEM | Nano 数据集 + 新策展的更难科学问题 |
| Instruction Following | 新增 multi-challenge 数据集，基于预定义评分标准计算奖励 |
| Safety | 减少过度拒绝 + 越狱鲁棒性（使用 PAIR 迭代攻击流水线） |
| Long Context | Nano 的长上下文环境 |
| Agentic Tool Use | 对话式工具使用 + 终端交互 |
| Reasoning Gym | 多样化推理任务套件 |

**Low-effort 推理优化**：

> 📜 **原文 (Low-effort RL)**:
> *"For low effort, the reward is a function of both correctness and the number of generated tokens. The low-effort prompt mix starts with subsets of Math, STEM QA and competitive coding prompts, in total representing 2% of all RL prompts being in low-effort mode, and is later reduced to subsets of Math and STEM QA, representing just 1% of RL prompts."*

RLVR 共进行 **3 轮迭代**（Round 1: 25 env, Round 2: 30 env + low-effort, Round 3: 26 env + low-effort）。

### 8.3 Stage 2: SWE-RL (端到端 RL)

> 📜 **原文 (SWE-RL)**:
> *"Stage 2 is an end-to-end RL stage focused on long-horizon SWE tasks."*

专注于长水平线软件工程任务的端到端 RL，训练规模达 **20B tokens**。

### 8.4 Stage 3: RLHF

> 📜 **原文 (RLHF)**:
> *"We follow a similar approach to Nemotron 3 Nano for RLHF, training a large GenRM model to provide supervision during RL. Rather than using a vanilla GenRM, we train a principle following GenRM. ... We use Qwen3-235B-A22B-Thinking-2507 as the initialization for training the GenRM."*

- GenRM 初始化：Qwen3-235B-A22B-Thinking-2507
- 训练数据：HelpSteer 3 + lmarena-140k 商业友好子集 + 新采集人类偏好数据
- 训练规模：**18B tokens**

### 8.5 算法: 异步 GRPO

> 📜 **原文 (Algorithm)**:
> *"We use an asynchronous GRPO setup in which training and inference are decoupled across separate GPU devices. ... Because weight updates can happen mid-rollout, a single trajectory may contain tokens produced by different model versions."*

关键设计：

- **训练-推理解耦**：分布在不同 GPU 设备上
- **In-flight weight updates**：训练更新权重无需等待进行中的 rollout 完成
- **最多 1 步 off-policy**：推理 worker 最多落后 1 个模型版本
- 每步 **256 prompts × 16 responses**，batch size 4096
- 最大生成长度从 49K 增至 **64K tokens**

### 8.6 PivotRL: 高效 Agentic RL

这是后训练中的重要创新，解决了长水平线 Agentic 任务中效率与精度的矛盾：

> 📜 **原文 (PivotRL)**:
> *"PivotRL is a assistant-turn-level RL method that addresses this tradeoff by reusing offline SFT expert trajectories during RL. It focuses training on informative turns (called 'pivots') within those SFT traces, where the policy has uncertainty over the next action, and it uses a domain-appropriate reward to match the policy's action to the expert action, so the model gets credit for similar actions rather than the exact expert action."*

- **核心思路**：复用离线 SFT 专家轨迹，仅在"关键转折点"（policy 对下一动作不确定的回合）进行 RL 优化
- **优势**：大幅提升 Agentic RL 效率，避免 SFT 的 OOD 退化
- **应用范围**：Agentic Programming、Search、Terminal Use、Conversational Tool Use

### 8.7 基础设施

> 📜 **原文 (Infrastructure)**:
> *"NeMo RL acts as the RL training loop controller, using Megatron-Core for model training at scale, and routing all rollouts through NeMo Gym and vLLM."*

规模化至 **1000+ GPU** 时遇到的工程挑战：

- **端口冲突**：Ray 控制平面、vLLM workers、TCP rendezvous、NeMo Gym servers 的 TOCTOU 竞态条件
- **解决方案**：并行化初始化、预取虚拟环境和二进制文件、利用 vLLM/FlashInfer 缓存

---

## 九、推理量化

### 9.1 FP8 检查点

对 MoE（稀疏专家 + 共享专家）和 Mamba GEMM 层施加 FP8 (W8A8) 量化：

| 组件 | FP8 检查点 | BF16 基线 |
|------|-----------|-----------|
| MoE GEMM | FP8 | BF16 |
| Mamba GEMM | FP8 | BF16 |
| Attention GEMM | BF16 | BF16 |
| KV Cache | FP8 | FP8 |
| Mamba SSM Cache | FP16 | FP32 |

### 9.2 NVFP4 检查点

更激进的 W4A4 量化，目标 Blackwell GPU：

> 📜 **原文 (NVFP4 PTQ)**:
> *"The best overall results were obtained with a hybrid FP4 recipe: weight per-block scales were selected by minimizing weight MSE, while activation per-block scales continued to use max-based scaling."*

使用 **AutoQuantize**（NAS 启发的混合精度搜索）自动确定每层的最优精度：

> 📜 **原文 (AutoQuantize)**:
> *"AutoQuantize estimates per-operation sensitivity, models the performance cost of available quantization choices, and solves for the optimal layer-wise allocation using a knapsack-style optimization procedure."*

最终结果：

- 有效精度预算：**4.75 bits**
- 稀疏专家 GEMM：全部 NVFP4
- Attention/Mamba 投影：FP8 或 BF16
- 共享专家：NVFP4/FP8/BF16 混合
- **完整混合精度 PTQ 流程在单个 B200 节点（8 GPU）上不到 2 小时完成**

### 9.3 Mamba SSM Cache 量化难题

> 📜 **原文 (SSM Cache Quantization)**:
> *"A key challenge in quantizing the Mamba cache is that quantization error does not remain local to a single step. Because Mamba decoding is recurrent, quantization error from previous steps propagates into future steps and accumulates over time."*

SSM Cache 量化的独特难点在于：Mamba 的递归解码使得量化误差会随时间累积。论文给出了数学分析：

$$h_{q,t} = h_t + \sum_{i=0}^{t} \left(\prod_{j=i+1}^{t} A_j\right) e_i$$

其中 $e_i$ 是第 $i$ 步的量化误差。

**解决方案：随机舍入 (Stochastic Rounding)**

> 📜 **原文 (Stochastic Rounding)**:
> *"The key issue is that round to nearest, ties on even (RTNE) introduces bias in the quantization process... In contrast, stochastic rounding (SR) is unbiased in expectation. In a recurrent setting, the bias from RTNE accumulates coherently over time, whereas stochastic rounding replaces this systematic drift with zero-mean noise."*

- RTNE（最近舍入）：有偏差，在递归设置中偏差会相干累积
- **随机舍入**：期望无偏，将系统性漂移替换为零均值噪声
- 最终选择 FP16 + Stochastic Rounding (Philox<5> PRNG) 作为 SSM cache 方案
- Blackwell 提供了专用的 PTX 指令支持随机舍入

### 9.4 量化后精度保持

| Benchmark | BF16 | FP8 | NVFP4 |
|-----------|------|-----|-------|
| MMLU-Pro | 83.73 | 83.63 | 83.33 |
| HMMT Feb25 (tools) | 94.73 | 94.38 | **95.36** |
| GPQA (no tools) | 79.23 | 79.36 | 79.42 |
| LiveCodeBench v6 | 78.69 | 78.44 | 78.44 |
| SciCode (subtask) | 42.05 | 41.38 | 40.83 |
| TauBench V2 Avg | 61.15 | 61.07 | 60.46 |
| IFBench | 72.58 | 72.32 | 73.30 |
| RULER 128k | 96.79 | 96.85 | 95.99 |
| RULER 512k | 96.09 | 95.66 | 96.23 |
| MMLU-ProX | 79.35 | 79.21 | 79.37 |

> NVFP4 模型达到 BF16 基线的 **99.8% 中位精度**。

---

## 十、评估结果

### 10.1 基座模型评估

Nemotron 3 Super 120B-A12B Base 在预训练阶段即展现出强大性能，全面优于同级别的 Ling-flash-Base-2.0 和 GLM-4.5-Air-Base：

| 任务 | N-3-Super Base | Ling-flash-Base-2.0 | GLM-4.5-Air-Base |
|------|----------------|--------------------|--------------------|
| MMLU (5-shot) | **86.01** | 81.00 | 81.00 |
| MMLU-Pro (5-shot CoT) | **75.65** | 62.10 | 58.20 |
| GPQA-Diamond | **60.00** | 36.00 | 23.20 |
| MATH (4-shot) | **84.84** | 63.80 | 50.36 |
| AIME 2024 (pass@32) | **53.33** | 30.00 | 20.00 |
| HumanEval (pass@1) | **79.40** | 70.10 | 76.30 |
| RULER 128K | **89.00** | 57.56 | 63.62 |
| RULER 1M | **74.39** | — | — |

### 10.2 后训练模型主评估表

> 📜 **原文 (Evaluation Summary)**:
> *"Across all benchmarks Nemotron 3 Super is competitive with GPT-OSS-120B, while lagging behind Qwen-3.5-122B slightly."*

| Benchmark | N-3-Super | Qwen3.5-122B | GPT-OSS-120B |
|-----------|-----------|-------------|--------------|
| **通用知识** | | | |
| MMLU-Pro | 83.73 | **86.70** | 81.00 |
| **推理** | | | |
| AIME25 (no tools) | 90.21 | 90.36 | **92.50** |
| HMMT Feb25 (no tools) | **93.67** | 91.40 | 90.00 |
| HMMT Feb25 (with tools) | **94.73** | 89.55 | — |
| GPQA (no tools) | 79.23 | **86.60** | 80.10 |
| LiveCodeBench v5 | 81.19 | 78.93 | **88.00** |
| SciCode (subtask) | **42.05** | 42.00 | 39.00 |
| HLE (no tools) | 18.26 | **25.30** | 14.90 |
| **Agentic** | | | |
| Terminal Bench (hard) | 25.78 | **26.80** | 24.00 |
| Terminal Bench Core 2.0 | 31.00 | **37.50** | 18.70 |
| SWE-Bench (OpenHands) | 60.47 | **66.40** | 41.90 |
| SWE-Bench (OpenCode) | 59.20 | **67.40** | — |
| SWE-Bench Multilingual | **45.78** | — | 30.80 |
| TauBench V2 Avg | 61.15 | **74.53** | 61.00 |
| BrowseComp (Search) | 31.28 | — | **33.89** |
| BIRD Bench (SQL) | **41.80** | — | 38.25 |
| **Chat & 指令遵循** | | | |
| IFBench | **72.56** | 73.77 | 68.32 |
| Arena-Hard V2 | 73.88 | 75.15 | **90.26** |
| **长上下文** | | | |
| RULER 256k | 96.30 | **96.74** | 52.30 |
| RULER 512k | 95.67 | **95.95** | 46.70 |
| RULER 1M | **91.75** | 91.33 | 22.30 |
| **多语言** | | | |
| MMLU-ProX (avg) | 79.36 | **85.06** | 76.59 |
| WMT24++ (en→xx) | 86.67 | 87.84 | **88.89** |

### 10.3 关键发现

1. **数学推理**：HMMT Feb25 (with tools) 达到 **94.73**，超越 Qwen3.5 的 89.55
2. **长上下文**：RULER 1M 达到 **91.75**，全面碾压 GPT-OSS-120B 的 22.30
3. **Agentic**：SWE-Bench Multilingual **45.78** 远超 GPT-OSS-120B 的 30.80；Terminal Bench Core 2.0 **31.00** 远超 GPT-OSS-120B 的 18.70
4. **效率优势**：在 8k 输入 / 64k 输出设置下，推理吞吐比 GPT-OSS-120B 高 **2.2×**，比 Qwen3.5-122B 高 **7.5×**

---

## 十一、核心洞察与启示

### 11.1 架构创新洞察

**"每参数精度" vs "每 FLOP 精度"** 是本文最重要的设计哲学转变。传统 MoE 设计只优化每 FLOP 精度（即计算效率），但在实际部署中，内存带宽、通信开销和分片成本同样重要。LatentMoE 通过 Latent 投影将这两个维度同时优化，这是一种值得关注的 **硬件-软件协同设计** 范式。

### 11.2 低精度训练的工业化

Nemotron 3 Super 证明了 **FP4 预训练可以规模化到 25T tokens**，这对降低训练成本具有重大意义。关键在于精细的混合精度分配——并非所有层都适合 FP4，需要根据层类型特性（如 Mamba 输出投影更适合 MXFP8）进行差异化处理。零梯度现象的分析也表明，FP4 训练虽然可行，但需要仔细监控和验证。

### 11.3 后训练的规模化经验

RL 阶段的规模化（21 个环境、37 个数据集、1000+ GPU）暴露了大量工程挑战（端口冲突、TOCTOU 竞态等），这些是论文中坦诚分享的宝贵经验。**PivotRL** 方法——在离线专家轨迹的"关键转折点"进行 RL——是一种优雅的解决方案，平衡了 SFT 的效率和 RL 的泛化能力。

### 11.4 量化作为一等公民

NVIDIA 将量化从后处理提升为设计的核心考虑：

- **预训练即使用 NVFP4**（而非训后量化）
- **SSM Cache 量化** 的递归误差累积分析及随机舍入解法
- **AutoQuantize** 的 NAS 风格混合精度搜索

这体现了"量化不是事后补救，而是从架构设计开始就需要考虑的系统性问题"。

### 11.5 Hybrid Mamba-Attention 的成熟

Nemotron 3 Super 在 RULER 1M 上达到 91.75 分（GPT-OSS-120B 仅 22.30），证明了 Hybrid Mamba-Attention 架构在长上下文场景中的巨大优势。这种线性时间序列建模 + 稀疏全注意力锚点的组合，可能成为下一代长上下文模型的标准范式。

### 11.6 开源策略的深度

NVIDIA 选择开源完整的数据集（Nemotron-Pretraining-Specialized-v1.1）+ 基座 + 后训练 + 量化检查点，这种"全栈开源"策略值得关注。它不仅仅是模型权重的开放，而是包含了可复现训练的完整 pipeline。

---

## 附录: 核心参考链接

| 资源 | 链接 |
|------|------|
| 技术报告原文 | [NVIDIA Nemotron 3 Super Technical Report](https://research.nvidia.com/labs/nemotron/files/NVIDIA-Nemotron-3-Super-Technical-Report.pdf) |
| NeMo Gym (RL 环境) | [github.com/NVIDIA-NeMo/Gym](https://github.com/NVIDIA-NeMo/Gym) |
| NeMo RL (训练框架) | [github.com/NVIDIA-NeMo/RL](https://github.com/NVIDIA-NeMo/RL) |
| NeMo Evaluator | [github.com/NVIDIA-NeMo/Evaluator](https://github.com/NVIDIA-NeMo/Evaluator) |
| Model-Optimizer (量化) | [github.com/NVIDIA/Model-Optimizer](https://github.com/NVIDIA/Model-Optimizer) |
| HuggingFace 模型/数据 | 基座、后训练、FP8、NVFP4 检查点 + Nemotron-Pretraining-Specialized-v1.1 |
| NVIDIA 技术博客 | [Inside NVIDIA Nemotron 3](https://developer.nvidia.com/blog/inside-nvidia-nemotron-3-techniques-tools-and-data-that-make-it-efficient-and-accurate/) |
