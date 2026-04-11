---
title: "DeepSeek-OCR & OCR 2 精读笔记"
description: "Optical Compression 与 Visual Causal Flow 两篇合并精读"
date: 2026-03-08
category: 论文精读
tags: ["OCR", "Vision Encoder", "KV Cache", "长上下文"]
paperTitle: "DeepSeek-OCR: Contexts Optical Compression / DeepSeek-OCR 2: Visual Causal Flow"
arxiv: "2510.18234"
draft: false
---
# DeepSeek-OCR & DeepSeek-OCR 2 精读笔记

> **论文精读笔记** | 两篇合并精读  
> **论文1**: DeepSeek-OCR: Contexts Optical Compression (arXiv: 2510.18234, 2025.10)  
> **论文2**: DeepSeek-OCR 2: Visual Causal Flow (2026.01)  
> **作者**: Haoran Wei, Yaofeng Sun, Yukun Li 等 (DeepSeek-AI)  
> **关键词**: OCR, Vision Encoder, Optical Compression, Visual Causal Flow, KV Cache, Long Context

---

# 第一部分：DeepSeek-OCR — Contexts Optical Compression

## 一、论文概览

### 1.1 核心问题

当前 LLM 面临长文本处理的 **二次方计算复杂度** 问题。本文提出了一个反直觉的解法：**用视觉模态作为文本信息的高效压缩介质**。

> *"Current Large Language Models (LLMs) face significant computational challenges when processing long textual content due to quadratic scaling with sequence length."*

### 1.2 核心洞察

一张包含文档文字的图像，可以用远少于等价数字文本的 token 来表示丰富信息——**光学压缩（Optical Compression）可以实现远超文本的压缩比**。

> *"A single image containing document text can represent rich information using substantially fewer tokens than the equivalent digital text, suggesting that optical compression through vision tokens could achieve much higher compression ratios."*

### 1.3 视角转换

本文从 **LLM 中心** 视角重新审视 VLM：不再关注基础 VQA，而是关注 **视觉编码器如何提升 LLM 处理文本信息的效率**。

> *"This insight motivates us to reexamine vision-language models (VLMs) from an LLM-centric perspective, focusing on how vision encoders can enhance LLMs' efficiency in processing textual information rather than basic VQA."*

### 1.4 三大贡献

| # | 贡献 | 要点 |
|---|------|------|
| 1 | 视觉-文本压缩比定量分析 | 10x 压缩 → 97% 精度；20x 压缩 → ~60% 精度 |
| 2 | DeepEncoder 架构 | 高分辨率输入下保持低激活、少 token |
| 3 | DeepSeek-OCR 系统 | OmniDocBench SOTA（端到端模型中 token 最少） |

---

## 二、论文结构

```
1. Introduction
2. Related Works
   2.1 Typical Vision Encoders in VLMs
   2.2 End-to-end OCR Models
3. Methodology
   3.1 Architecture
   3.2 DeepEncoder (3.2.1 Architecture / 3.2.2 Multiple Resolution)
   3.3 The MoE Decoder
   3.4 Data Engine (OCR 1.0 / 2.0 / General Vision / Text-only)
   3.5 Training Pipelines
4. Evaluation
   4.1 Vision-text Compression Study
   4.2 OCR Practical Performance
   4.3 Qualitative Study
5. Discussion
6. Conclusion
```

---

## 三、方法论：DeepEncoder 架构

### 3.1 设计需求（五大约束）

1. 能处理高分辨率
2. 高分辨率下低激活内存
3. 少量视觉 token
4. 支持多分辨率输入
5. 适中的参数量

> *"Current open-source encoders cannot fully satisfy all these conditions. Therefore, we design a novel vision encoder ourselves, named DeepEncoder."*

### 3.2 架构设计

```
输入图像 → [SAM-base (80M, 窗口注意力)] → [2层卷积, 16x下采样] → [CLIP-large (300M, 全局注意力)] → 压缩视觉token
```

**两大组件串联**：
- **视觉感知组件**（Visual Perception）：SAM-base, 80M 参数，窗口注意力 → 低激活
- **视觉知识组件**（Visual Knowledge）：CLIP-large, 300M 参数，全局注意力 → 语义理解

**关键：16x 卷积压缩模块**

两组件之间的压缩模块：2 层卷积（kernel=3, stride=2, padding=1），通道从 256 增至 1024。

> *"Assuming we input a 1024×1024 image, the DeepEncoder will segment it into 4096 patch tokens. Since the first half of encoder is dominated by window attention and only 80M, the activation is acceptable. Before entering global attention, the 4096 tokens go through the compression module and the token count becomes 4096/16=256."*

**总参数量**：~380M（80M SAM + 300M CLIP）

### 3.3 多分辨率支持

#### 原生分辨率模式

| 模式 | 分辨率 | 视觉Token数 | 适用场景 |
|------|--------|------------|---------|
| **Tiny** | 512×512 | 64 | 幻灯片等简单文档 |
| **Small** | 640×640 | 100 | 书籍、报告 |
| **Base** | 1024×1024 | 256（182有效） | 通用文档 |
| **Large** | 1280×1280 | 400（285有效） | 密集文档 |

#### 动态分辨率模式

| 模式 | 机制 | Token数 |
|------|------|---------|
| **Gundam** | n×640×640 局部 + 1024×1024 全局 | n×100+256 |
| **Gundam-Master** | 1024×1024 局部 + 1280×1280 全局 | 最高1853 |

> *"Due to our relatively large native resolutions, images won't be fragmented too much under dynamic resolution (the number of tiles is controlled within the range of 2 to 9)."*

### 3.4 MoE 解码器

- **架构**：DeepSeek-3B-MoE
- **激活参数**：~570M（64 个路由专家中激活 6 个 + 2 个共享专家）
- **映射**：f_dec: ℝ^(n×d_latent) → ℝ^(N×d_text)，其中 n ≤ N

> *"The 3B DeepSeekMoE is very suitable for domain-centric (OCR for us) VLM research, as it obtains the expressive capability of a 3B model while enjoying the inference efficiency of a 500M small model."*

---

## 四、数据引擎

### 4.1 数据分布

| 数据类型 | 占比 | 详情 |
|---------|------|------|
| **OCR 1.0** | ~60% | 30M 页 PDF（~100种语言）+ 20M 自然场景 |
| **OCR 2.0** | ~10% | 图表(10M)、化学式(5M)、平面几何(1M) |
| **通用视觉** | 20% | Caption、检测、Grounding |
| **纯文本** | 10% | 8192 token 序列长度的预训练数据 |

### 4.2 标注策略

- **粗标注**：fitz 直接提取（教模型识别光学文本，尤其是小语种）
- **精标注**：中英各 2M 页，使用 PP-DocLayout + MinerU + GOT-OCR2.0
- **小语种**：Model flywheel 方法，600K 样本

---

## 五、训练流程

### 阶段1：训练 DeepEncoder

- 使用 Vary 方法 + next token prediction
- 数据：全部 OCR 数据 + 100M 通用数据（LAION）
- Epochs: 2, Batch: 1280, LR: 5e-5, Seq: 4096

### 阶段2：训练 DeepSeek-OCR

- 平台：HAI-LLM
- 流水线并行 4 段：SAM+压缩器(PP0, 冻结) → CLIP(PP1, 训练) → MoE前6层(PP2) → MoE后6层(PP3)
- 硬件：20节点 × 8 A100-40G, DP=40, Global Batch=640
- 速度：纯文本 90B tokens/天，多模态 70B tokens/天

---

## 六、实验结果

### 6.1 视觉-文本压缩研究（Fox 基准）

**核心发现：10x 压缩比内可达 ~97% 精度**

| 文本Token数 | 64 Vision Tokens | 100 Vision Tokens |
|-------------|-----------------|-------------------|
| 600-700 | 96.5% @ 10.5x | 98.5% @ 6.7x |
| 700-800 | 93.8% @ 11.8x | 97.3% @ 7.5x |
| 800-900 | 83.8% @ 13.2x | 96.8% @ 8.5x |
| 900-1000 | 85.9% @ 15.1x | 96.8% @ 9.7x |
| 1000-1100 | 79.3% @ 16.5x | 91.5% @ 10.6x |
| 1100-1200 | 76.4% @ 17.7x | 89.8% @ 11.3x |
| 1200-1300 | 59.1% @ 19.7x | 87.1% @ 12.6x |

> *"Within a 10× compression ratio, the model's decoding precision can reach approximately 97%, which is a very promising result. In the future, it may be possible to achieve nearly 10× lossless contexts compression through text-to-image approaches."*

### 6.2 OmniDocBench 实用性能

**DeepSeek-OCR 各模式表现**（编辑距离↓越低越好）：

| 模式 | Tokens | 英文 | 中文 | 总体 |
|------|--------|------|------|------|
| Tiny | 64 | 0.386 | 0.361 | 0.320 |
| Small | 100 | 0.221 | 0.284 | 0.205 |
| Base | 256(182有效) | 0.137 | 0.240 | 0.156 |
| Large | 400(285有效) | 0.138 | 0.208 | 0.117 |
| **Gundam** | **795** | **0.127** | **0.181** | **0.083** |
| Gundam-M | 1853 | 0.123 | 0.157 | 0.085 |

**与竞品对比（关键模型）**：

| 模型 | Tokens | 总体编辑距离 |
|------|--------|-------------|
| GOT-OCR2.0 | 256 | 0.411 |
| Qwen2.5-VL-7B | 3949 | 0.399 |
| InternVL2-76B | 6790 | 0.443 |
| MinerU2.0 | 6790 | 0.238 |
| Gemini2.5-Pro | — | 0.212 |
| dots.ocr†200dpi | 5545 | 0.160 |
| **DeepSeek-OCR (Small)** | **100** | **0.205** |
| **DeepSeek-OCR (Gundam)** | **795** | **0.083** |

> *"Requiring only 100 vision tokens, DeepSeek-OCR surpasses GOT-OCR2.0 which uses 256 tokens."*  
> *"Using fewer than 800 tokens (Gundam mode), DeepSeek-OCR outperforms MinerU2.0 which needs nearly 7,000 vision tokens."*

### 6.3 按文档类型表现

| 文档类型 | Tiny(64) | Small(100) | Gundam(795) |
|---------|----------|-----------|-------------|
| 书籍 | 0.147 | 0.085 | 0.035 |
| 幻灯片 | 0.116 | 0.111 | 0.085 |
| 财报 | 0.207 | 0.079 | 0.289* |
| 学术论文 | 0.395 | 0.131 | 0.039 |
| 报纸 | 0.940 | 0.744 | 0.122 |

> *"Some categories of documents require very few tokens to achieve satisfactory performance, such as slides which only need 64 vision tokens."*

### 6.4 生产能力

> *"In production, DeepSeek-OCR can generate 33 million pages of data per day for LLMs or VLMs using 20 nodes (each with 8 A100-40G GPUs)."*

单个 A100-40G 每天可生成 **200K+ 页** 的训练数据。

---

## 七、讨论：上下文光学压缩的愿景

### 7.1 渐进式压缩策略

论文提出了一个前瞻性构想——**模拟人类记忆衰减的渐进式光学压缩**：

> *"By combining these mechanisms, contexts optical compression method enables a form of memory decay that mirrors biological forgetting curves, where recent information maintains high fidelity while distant memories naturally fade through increased compression ratios."*

**设想**：
- 最近的上下文：保持高分辨率（高保真）
- 较远的上下文：逐步缩小渲染图像分辨率（更高压缩）
- 最远的上下文：极高压缩比（自然遗忘）

### 7.2 局限性

1. **早期探索**：尚需进一步验证的初步工作
2. **格式匹配**：输出格式无法完全匹配基准，实际性能可能更高
3. **分辨率瓶颈**：超过 10x 压缩时性能下降——长文档布局更复杂 + 低分辨率下文字模糊

---

---

# 第二部分：DeepSeek-OCR 2 — Visual Causal Flow

## 八、论文概览

### 8.1 核心问题

传统 VLM 在将图像输入 LLM 时，总是按 **固定的光栅扫描顺序（从左上到右下）** 处理视觉 token，配合固定位置编码。这种刚性顺序在面对复杂版面（双栏、表格、混排）时会 **切断语义的逻辑连贯性**。

### 8.2 核心创新：Visual Causal Flow

DeepSeek-OCR 2 提出 **DeepEncoder V2**，能够 **根据图像语义动态重排视觉 token**，模拟人类的因果视觉流。

**类比人类阅读**：人类阅读时并非机械地逐行扫描，而是根据语义因果关系进行跳跃式阅读——每次注视（fixation）因果依赖于前次注视。

### 8.3 关键改变：用 LLM 替代 CLIP

| 维度 | V1 (DeepSeek-OCR) | V2 (DeepSeek-OCR 2) |
|------|-------------------|---------------------|
| 视觉编码器 | CLIP ViT (300M) | **Qwen2-0.5B** (500M) |
| 处理逻辑 | 固定光栅扫描 | **动态语义重排** |
| 注意力机制 | 标准全局注意力 | **双流注意力** |
| 推理模式 | 单阶段 | **两阶段级联因果推理** |

---

## 九、方法论：DeepEncoder V2 架构

### 9.1 整体架构

```
输入图像 → [SAM-base (80M) + 2层卷积, 16x压缩] → [Qwen2-0.5B + 双流注意力 + 因果流查询] → 重排后的视觉token → [DeepSeek-3B-MoE 解码器]
```

### 9.2 视觉分词器（沿用 V1）

- SAM-base (80M 参数) + 两层卷积
- 输出维度从 V1 的 1024 **降至 896**（与 Qwen2-0.5B 对齐）
- 实现 **16x token 压缩**

### 9.3 双流注意力机制（核心创新）

#### 设计原理

在同一个 Transformer 中同时运行两种注意力模式：

```
注意力掩码 M:
┌───────────────┬─────────────────┐
│   全1矩阵      │   全1矩阵        │
│  (双向注意力)   │ (视觉→因果可见)  │
├───────────────┼─────────────────┤
│    0矩阵       │   LowerTri      │
│  (因果→视觉    │  (因果注意力)    │
│   不可见)      │                  │
└───────────────┴─────────────────┘
    视觉token区域     因果流查询区域
```

#### 两个流

| 流 | 对象 | 注意力类型 | 功能 |
|----|------|----------|------|
| **视觉 Token 流** | 原始视觉 token | **双向注意力** | 保持全局建模能力，每个 token 能"看到"整幅图 |
| **因果流查询** | 可学习查询向量 | **因果注意力** | 语义重排：每个查询只能关注之前的查询 + 所有视觉 token |

#### 为何用前缀连接而非交叉注意力

> 交叉注意力方式（如 mBART）在实验中 **未能收敛**——视觉 token 在独立编码器中隔离时交互不足。前缀连接使视觉 token 在所有层级中保持"活跃"，与因果查询进行深度信息交换。

### 9.4 因果流查询（Causal Flow Queries）

**数量计算**：
```
因果查询token数 = W × H / 16² × 16
```

**多分辨率策略**：

| 视图类型 | 分辨率 | 查询数 |
|---------|--------|-------|
| 全局视图 | 1024×1024 | 256 |
| 局部裁剪 | 768×768 | 144/个 |
| 局部裁剪数 k | — | 0-6 个 |

**输入 LLM 的总 token 数**：k×144 + 256 = **[256, 1120]**

> 最大值 1120 与 Gemini-3 Pro 的最大视觉 token 预算相匹配。

### 9.5 两阶段级联因果推理

```
阶段1（编码器内部）: 因果流查询对视觉token进行语义重排 → "逻辑理顺"
                     ↓
阶段2（解码器）:     LLM 对重排后的有序序列执行自回归推理
```

**核心前向传播公式**：
```
O = D(π_Q(T_L(E(I) ⊕ Q₀, M)))

其中：
  I = 输入图像
  E = 视觉token化器 (SAM+conv) → m个视觉tokens V
  Q₀ = 可学习的因果查询嵌入
  ⊕ = 序列连接
  T_L = L层Transformer（带双流注意力掩码 M）
  π_Q = 投影算子（提取最后n个token = 因果流查询输出）
  D = DeepSeek-MoE 解码器
  O = 输出logits
```

**关键**：仅因果流 token 的输出被送入 LLM 解码器，视觉 token 在编码器阶段完成使命。

---

## 十、训练流程（三阶段）

### Stage 1：编码器预训练

| 配置 | 详情 |
|------|------|
| 目标 | 特征提取 + 压缩 + 重排序能力 |
| 方法 | 编码器 + 轻量解码器联合，next token prediction |
| 初始化 | 视觉分词器来自 V1，LLM 编码器来自 Qwen2-0.5B-base |
| 分辨率 | 768×768 和 1024×1024 |
| 硬件 | 160 A100 GPU（20节点×8） |
| Batch | 640 |
| 迭代 | 40K |
| LR | 1e-4 → 1e-6（cosine） |
| 数据量 | ~1亿图像-文本对 |

### Stage 2：查询增强

| 配置 | 详情 |
|------|------|
| 目标 | 增强因果流查询的重排序能力 |
| 冻结 | 视觉分词器（SAM-conv） |
| 训练 | LLM 编码器 + LLM 解码器联合优化 |
| 流水线 | PP0:分词器 → PP1:LLM编码器 → PP2-3:MoE解码器 |
| Batch | 1280 |
| 迭代 | 15K |
| LR | 5e-5 → 1e-6 |

### Stage 3：解码器持续训练

| 配置 | 详情 |
|------|------|
| 目标 | 帮助 LLM 理解 V2 重排后的视觉 token |
| 冻结 | 整个 DeepEncoder V2 |
| 训练 | 仅 DeepSeek-LLM 参数 |
| 速度 | 训练速度提升超过一倍 |
| 迭代 | 20K |
| LR | 1e-6 → 5e-8 |

**数据策略改进**：
- OCR 数据占比提升至 **80%**
- 采样均衡化：正文:公式:表格 = **3:1:1**
- 合并语义相似的布局标签

---

## 十一、实验结果

### 11.1 OmniDocBench v1.5 主实验

| 指标 | DeepSeek-OCR | DeepSeek-OCR 2 | 变化 |
|------|-------------|---------------|------|
| **综合得分** | 87.36% | **91.09%** | **+3.73%** |
| **阅读顺序编辑距离** | 0.085 | **0.057** | **↓32.9%** |
| **文档解析编辑距离** | — | **0.100** | — |

### 11.2 与闭源顶级模型对比

| 模型 | Token预算 | 文档解析编辑距离 |
|------|----------|----------------|
| **DeepSeek-OCR 2** | 1120 | **0.100** |
| Gemini-3 Pro | ~相似 | 0.115 |

> DeepSeek-OCR 2 在相似 token 预算下 **优于 Gemini-3 Pro**。

### 11.3 生产环境验证

| 场景 | V1 重复率 | V2 重复率 | 改善 |
|------|----------|----------|------|
| 在线用户日志 | 6.25% | **4.17%** | ↓33.3% |
| PDF批处理 | 3.69% | **2.88%** | ↓21.9% |

重复率的下降直接证明了 **语义重排带来的阅读顺序理解提升** 在生产环境中的实际价值。

---

## 十二、V1 vs V2 全面对比

| 维度 | DeepSeek-OCR (V1) | DeepSeek-OCR 2 (V2) |
|------|-------------------|---------------------|
| **视觉编码器** | CLIP ViT (300M) | Qwen2-0.5B (500M) |
| **分词器** | SAM-base (80M) + conv | SAM-base (80M) + conv（沿用） |
| **解码器** | DeepSeek-3B-MoE (~570M激活) | DeepSeek-3B-MoE (~500M激活)（沿用） |
| **编码器输出维度** | 1024 | 896 |
| **注意力机制** | CLIP全局注意力 | 双流注意力（双向+因果） |
| **Token排序** | 固定光栅扫描 | 语义驱动动态重排 |
| **推理阶段** | 单阶段 | 两阶段级联因果 |
| **最大Token数** | 1853 (Gundam-M) | 1120 |
| **OmniDocBench** | 87.36% | **91.09%** (+3.73%) |
| **R-order编辑距离** | 0.085 | **0.057** (-32.9%) |
| **核心理念** | 视觉压缩 → 用更少token表示更多文本 | 视觉因果流 → 按语义逻辑而非空间顺序编码 |
| **训练阶段** | 2阶段 | 3阶段 |
| **生产重复率(PDF)** | 3.69% | **2.88%** |

---

## 十三、两篇论文的整体思考

### 13.1 从 "压缩" 到 "理解" 的范式演进

- **V1 的核心命题**：视觉可以高效压缩文本——100个视觉token能代替1000+文本token
- **V2 的核心命题**：视觉编码不应是空间扫描，而应是语义因果推理

这是一个从 **效率优化** 到 **认知对齐** 的跨越。V1 证明了"光学压缩可行"，V2 则追问"编码器应该像人一样阅读"。

### 13.2 用 LLM 做视觉编码器——统一架构的信号

V2 用 Qwen2-0.5B 替换 CLIP ViT，意味着：
- **视觉编码器也可以是语言模型**——具备因果推理能力
- 为 **omni-modal encoder** 铺路——一个统一的编码器同时处理视觉和语言
- 暗示 DeepSeek-V4 可能在模型层面融合 OCR 系列的能力

### 13.3 "记忆衰减" 构想的深远意义

V1 提出的渐进式光学压缩——近期高保真、远期高压缩——与人类记忆遗忘曲线吻合。这个构想如果成功，意味着：
- LLM 可以通过 "把旧上下文渲染为图像再压缩" 来实现**理论上无限的上下文窗口**
- 不同的压缩比对应不同的信息保留层级
- 这是解决长上下文问题的一种全新思路

### 13.4 OCR 作为 VLM 能力的 "试金石"

论文选择 OCR 作为切入点的原因深刻——OCR 是视觉与语言之间的 **天然桥梁**：
- 有明确的输入输出对应（图像→文本）
- 有可量化的评估指标（编辑距离、精度）
- 压缩-解压映射自然存在

### 13.5 对实际工程的启示

1. **数据生产**：单 A100 日产 200K+ 页训练数据，是大规模 LLM 预训练的实用工具
2. **Token 效率**：100 个视觉 token 即可超越 256 token 的竞品，对推理成本有直接影响
3. **部署灵活性**：多分辨率模式允许根据文档类型动态选择精度-效率平衡点
4. **阅读顺序**：V2 的语义重排对复杂版面的实际处理效果显著（生产重复率降低 33%）

---

## 附：关键术语表

| 术语 | 定义 |
|------|------|
| **Optical Compression** | 用视觉模态（图像token）压缩文本信息，实现更高压缩比 |
| **DeepEncoder** | V1 视觉编码器，SAM(窗口注意力) + CLIP(全局注意力) 串联 |
| **DeepEncoder V2** | V2 视觉编码器，用 Qwen2-0.5B 替换 CLIP，引入双流注意力 |
| **Visual Causal Flow** | 视觉因果流——根据语义因果关系动态重排视觉token |
| **Dual-Stream Attention** | 双流注意力——同一Transformer中同时运行双向(视觉)和因果(查询)注意力 |
| **Causal Flow Queries** | 因果流查询——附加在视觉token后的可学习查询，负责语义重排 |
| **Raster Scan** | 光栅扫描——传统从左上到右下的固定图像处理顺序 |
| **Gundam Mode** | 动态分辨率模式，多个局部视图 + 一个全局视图 |
| **DeepSeek-3B-MoE** | Mixture-of-Experts 解码器，3B总参数，~570M激活参数 |
| **OmniDocBench** | 综合性文档理解基准，涵盖9大文档类型 |
| **Compression Ratio** | 压缩比 = 文本token数 / 视觉token数 |
| **R-order** | Reading Order，阅读顺序——文档中内容的逻辑阅读序列 |

---

## 附：关键参数速查

| 参数 | V1 | V2 |
|------|----|----|
| 视觉分词器 | SAM-base 80M | SAM-base 80M |
| 视觉编码器 | CLIP-large 300M | Qwen2-0.5B 500M |
| 解码器 | DeepSeek-3B-MoE (~570M激活) | DeepSeek-3B-MoE (~500M激活) |
| Token压缩倍数 | 16x | 16x |
| 全局视图分辨率 | 1024×1024 | 1024×1024 |
| 全局视图tokens | 256 | 256 |
| 局部视图分辨率 | 640×640 | 768×768 |
| 局部视图tokens | 100/个 | 144/个 |
| 最大token总数 | 1853 | 1120 |
| 训练阶段数 | 2 | 3 |
| 训练GPU | 160 A100-40G | 160 A100 |

---

*精读完成于 2026-03-08*
