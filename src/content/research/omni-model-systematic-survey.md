---
title: "Omni 大模型系统调研：从 GPT-4o 到开源全模态统一架构的技术全景"
description: "系统性调研 2024-2026 年 Omni（全模态）大模型的技术演进，覆盖 GPT-4o、Gemini 2.x、Qwen3-Omni、Janus-Pro、Emu3、BAGEL、Chameleon、Transfusion 等 15+ 模型，从架构范式、视觉 Tokenizer、数据工程、训练策略、评估基准五个维度展开深度对比"
date: 2026-03-31T15:00
category: 综合调研
tags: ["Omni Model", "全模态", "Any-to-Any", "GPT-4o", "Gemini", "Qwen3-Omni", "Janus-Pro", "Emu3", "BAGEL", "Chameleon", "Transfusion", "Visual Tokenizer", "多模态架构"]
draft: false
---

# Omni 大模型系统调研：从 GPT-4o 到开源全模态统一架构的技术全景

> **综合调研 / 2026-03-31**
> 覆盖 15+ 模型，引用 40+ 篇核心论文，五维度系统对比

| 维度 | 覆盖范围 |
|------|---------|
| 模型 | GPT-4o · Gemini 2.0/2.5 · Qwen3-Omni · Janus-Pro · Emu3/3.5 · BAGEL · Chameleon · Transfusion · Unified-IO 2 · NExT-GPT · AnyGPT · CoDI-2 · Seed-Omni · Baichuan-Omni · MIO |
| 模态 | 文本 · 图像 · 视频 · 音频/语音 · 代码 · 结构化数据 |
| 维度 | 架构范式 · 视觉 Tokenizer · 数据工程 · 训练策略 · 评估基准 |

---

## 一、什么是 Omni 模型：定义与边界

### 1.1 从 MLLM 到 Omni 的范式跃迁

传统多模态大模型（MLLM）的标准路线是：先训一个强力 LLM，再通过 Adapter 桥接视觉/音频编码器。这个路线的问题是**模态之间的信息流是单向且有损的**——视觉信号经过编码器压缩为固定长度的向量后注入语言模型，语言模型只能"理解"但不能"生成"视觉内容。

Omni 模型的核心主张：**一个模型，所有模态，理解与生成统一**。

更精确的定义来自 ACL 2025 Findings 的综述 [Sun et al., 2024]：

> **Omni-MLLM** = 满足以下三个条件的多模态模型：
> 1. **多模态输入**：能接收 ≥2 种模态（文本、图像、音频、视频等）
> 2. **多模态输出**：能生成 ≥2 种模态（不仅仅是文本）
> 3. **端到端统一**：理解和生成在同一个模型内完成，而非级联拼接

这三个条件把 LLaVA（只能输出文本）、Stable Diffusion（只能输出图像）、甚至 GPT-4V（只理解不生成图像）都排除在外。真正的 Omni 模型追求的是 **Any-to-Any**：任意模态输入 → 任意模态输出。

### 1.2 为什么 Omni 是必然方向

三个驱动力：

1. **级联系统的瓶颈**：GPT-4V + DALL-E + Whisper 的组合虽然覆盖了多模态，但模态间无法共享表征。用户说"把这张图里的猫换成蓝色"，系统需要 OCR → 语言理解 → 图像编辑三步串行，每步都可能丢失上下文。
2. **人类认知是天然 Omni 的**：人同时处理视觉、听觉、语言、触觉，模态之间无缝切换。单一统一模型更接近这种认知模式。
3. **效率与一致性**：Omni 模型可以在一次前向传播中完成跨模态推理，避免级联系统的延迟累积和错误传播。

---

## 二、整体对比：15 个关键模型一览

### 2.1 闭源 Omni 模型

| 模型 | 机构 | 时间 | 输入模态 | 输出模态 | 架构范式 | 关键特点 |
|------|------|------|---------|---------|---------|---------|
| **GPT-4o** | OpenAI | 2024.05 | 文/图/音/视 | 文/图/音 | 原生统一（推测） | 首个商用 Any-to-Any；端到端语音延迟 232ms；图像生成后补 |
| **Gemini 2.0 Flash** | Google | 2024.12 | 文/图/音/视/代码 | 文/图/音 | 原生多模态 MoE | 100 万 token 上下文；原生工具使用；多语言语音 |
| **Gemini 2.5 Pro** | Google | 2025.03 | 文/图/音/视/代码 | 文/图/音 | 思考型原生多模态 | 内置推理链（Thinking）；MMLU-Pro 84.0%；视频理解领先 |

### 2.2 开源/开权重 Omni 模型

| 模型 | 机构 | 时间 | 参数量 | 输入 | 输出 | 架构 | Tokenizer |
|------|------|------|--------|------|------|------|-----------|
| **Chameleon** | Meta | 2024.05 | 7B/34B | 文/图 | 文/图 | 纯自回归 | 离散 VQ (8192 码本) |
| **Emu3** | BAAI | 2024.09 | 8B | 文/图/视 | 文/图/视 | 纯自回归 | SBER 离散编码 (32K 码本) |
| **Unified-IO 2** | AI2 | 2024.01 | 1.1B-7B | 文/图/音/视/动作 | 文/图/音/动作 | Encoder-Decoder | 多模态离散化 |
| **AnyGPT** | 复旦 | 2024.02 | 7B | 文/图/音/乐 | 文/图/音/乐 | 纯自回归 | 多 VQ 编码器 |
| **Janus** | DeepSeek | 2024.10 | 1.3B | 文/图 | 文/图 | 解耦双路径 | 理解: SigLIP / 生成: VQ-16K |
| **Janus-Pro** | DeepSeek | 2025.01 | 1B/7B | 文/图 | 文/图 | 解耦双路径 | 理解: SigLIP / 生成: VQ-16K |
| **Transfusion** | Meta | 2024.08 | 0.16-7B | 文/图 | 文/图 | 混合损失 | 文本: 自回归 / 图像: 扩散 |
| **BAGEL** | ByteDance | 2025.05 | 7B | 文/图 | 文/图 | 混合损失 + MoE | 理解: ViT / 生成: 扩散 |
| **NExT-GPT** | NUS | 2023.09 | 13B+ | 文/图/音/视 | 文/图/音/视 | LLM+适配器+解码器 | 多独立编码器 |
| **CoDI-2** | Microsoft | 2024.01 | - | 文/图/音/视 | 文/图/音/视 | 对齐编码空间 | 多独立编码器 |
| **Qwen3-Omni** | 阿里 | 2025.06 | 8B | 文/图/音/视 | 文/音 | Thinker-Talker 双塔 | 原生流式语音生成 |
| **Baichuan-Omni** | 百川 | 2024.10 | 7B | 文/图/音/视 | 文/音 | LLM + 音频解码 | 多阶段对齐 |
| **MIO** | 上交+蚂蚁 | 2024.09 | 7B | 文/图/音 | 文/图/音 | 纯自回归 | 离散化全模态 |
| **Seed-Omni** | 字节 | 2025.03 | - | 文/图/音 | 文/音 | 自回归 + 扩散语音 | 离散语音 token |

---

## 三、架构范式深度解析

Omni 模型的架构分歧集中在一个核心问题上：**不同模态该共享同一套生成范式，还是用各自最擅长的范式分别处理？** 这个问题催生了三大架构范式和若干混合变体。

### 3.1 范式一：纯自回归统一（Fully Autoregressive）

**核心思想**：把所有模态都离散化为 token，然后用标准的 next-token prediction 统一建模。

**代表模型**：Chameleon、Emu3、AnyGPT、MIO

**技术路线**：
```
输入序列: [BOS] text_tokens [IMG] vis_token_1 vis_token_2 ... vis_token_N [/IMG] text_tokens [EOS]
损失函数: 标准 Cross-Entropy（对所有 token 统一计算）
```

**优势**：
- 架构最简洁，直接复用 LLM 的 Transformer 和训练基础设施
- 模态间可以自然交错，语言与视觉 token 在同一注意力窗口内交互
- 理论上最接近"统一智能"的目标

**挑战**：
- **视觉 tokenizer 是瓶颈**：需要高质量的离散视觉 tokenizer（VQ-VAE/VQ-GAN/MAGVIT-v2），但离散化过程不可避免地丢失细节。Chameleon 的 8192 码本在高分辨率图像上质量不及扩散模型
- **序列长度爆炸**：一张 256×256 的图像需要 256-1024 个 token，视频更是天文数字。Emu3 处理一段短视频需要数万个 token
- **训练不稳定**：Chameleon 论文详细描述了多模态自回归训练的不稳定性问题，需要特殊的归一化技巧（QK-Norm）和 z-loss

**Chameleon 的经验**：Meta 团队发现，不加任何稳定手段的情况下，训练在数百步内就会发散。最终方案是 QK-Norm + 重新排列的 LayerNorm + 增大 z-loss 系数。

**Emu3 的突破**：BAAI 将视觉 tokenizer 的码本从 8K 扩大到 32K（SBER 编码器），并引入多分辨率支持，在图像生成质量上首次让纯自回归路线达到扩散模型的可比水平。

### 3.2 范式二：混合损失（Hybrid Loss / Transfusion）

**核心思想**：文本走自回归，连续模态（图像/视频/音频）走扩散，两种损失在同一个 Transformer 内联合训练。

**代表模型**：Transfusion、BAGEL、Beyond Language Modeling

**技术路线**：
```
同一个 Transformer backbone:
  - 文本 token → Causal Attention + Cross-Entropy Loss
  - 图像 patch → Bidirectional Attention (within image) + Diffusion Loss (MSE)
  
总损失 = λ_text × L_CE + λ_image × L_diffusion
```

**优势**：
- 图像生成质量更高：直接在连续空间做扩散，避免了离散化损失
- 文本能力不受影响：语言部分完整保留自回归范式
- 可以复用成熟的扩散模型技术（classifier-free guidance、DDPM/Flow Matching 等）

**挑战**：
- 两种注意力模式的工程实现复杂（因果 vs 双向）
- 训练时需要精心调节两个损失的权重比
- 推理时文本和图像的生成过程不同，流式输出需要额外设计

**Transfusion 的关键发现** [Zhou et al., 2024]：在 7B 规模下，Transfusion 的图像生成质量（FID）比同规模纯自回归模型好 **2 倍**，同时文本困惑度基本无损。核心原因是扩散损失直接优化像素级重建，而离散 token 的交叉熵损失无法捕捉连续信号的细粒度差异。

**BAGEL 的工程实践** [ByteDance, 2025]：在 Transfusion 基础上引入 MoE（Mixture of Experts），让不同的专家负责不同模态的处理。理解侧使用 ViT 编码器 + attention pooling，生成侧使用扩散头。在 7B 参数量下同时达到理解和生成的 SOTA。

### 3.3 范式三：解耦双路径（Decoupled Dual-pathway）

**核心思想**：理解和生成使用不同的视觉编码器，但共享同一个 LLM 主干。

**代表模型**：Janus、Janus-Pro

**动机**：Janus 论文 [Wu et al., 2024] 提出一个重要观察——**视觉理解和视觉生成需要的表征是不同的**。理解需要高层语义（"这是一只猫"），生成需要底层细节（"猫的每根毛发"）。用同一个 tokenizer 强行统一会造成双方都不够好。

**技术路线**：
```
理解路径: 图像 → SigLIP 视觉编码器 → 语义向量 → LLM
生成路径: LLM → 离散视觉 token → VQ 解码器 → 图像
共享层:   LLM Transformer backbone
```

**Janus-Pro 的改进**：
1. 将生成 VQ tokenizer 的码本从 8K 扩大到 16K
2. 优化训练策略：先单独训练理解和生成，再联合微调
3. 1B 模型在 GenEval 上达到 80%+，7B 达到 DALL-E 3 可比水平

**优势**：
- 理解和生成各用最适合的编码器，避免妥协
- 训练相对稳定，不需要 Chameleon 式的特殊稳定技巧
- 可以独立升级理解或生成侧

**局限**：
- 理解侧和生成侧的视觉表征不共享，跨任务迁移受限
- 本质上仍然不是完全统一的表征

### 3.4 范式四：级联式 Omni（Compositional Omni）

**代表模型**：NExT-GPT、CoDI-2

**思路**：保持 LLM 不变，通过输入端的多模态编码器和输出端的多模态解码器实现 Any-to-Any。

```
编码器侧: ImageBind/CLIP → 投影层 → LLM
LLM: 生成文本 + 特殊信号 token (如 [IMG], [AUD], [VID])
解码器侧: 信号 token → 投影层 → Stable Diffusion / AudioLDM / Zeroscope
```

**优势**：快速获得 Any-to-Any 能力，可以即插即用各种现有的生成模型。

**局限**：本质上是拼接而非融合，模态间的深度交互受限于 LLM 的隐空间维度。

### 3.5 范式五：Thinker-Talker 双塔（Dual-Tower）

**代表模型**：Qwen3-Omni

**独特设计**：将"思考"和"说话"拆分为两个独立模块：

```
Thinker (大模型): 接收全模态输入 → 生成文本推理结果
         ↓ (隐状态传递)
Talker (流式模型): 接收 Thinker 隐状态 → 实时生成语音流
```

**关键创新**：
- Thinker 负责所有重活（多模态理解、推理、规划），输出的不是文本 token 而是隐状态序列
- Talker 是一个轻量级自回归模型，将隐状态转化为语音 token 并实时流式输出
- 两者可以并行工作：Thinker 还在思考下一句时，Talker 已经在朗读上一句

这种设计特别适合实时对话场景，语音延迟远低于"先生成文本再 TTS"的级联方案。

### 3.6 架构范式对比总结

| 维度 | 纯自回归 | 混合损失 | 解耦双路径 | 级联式 | Thinker-Talker |
|------|---------|---------|-----------|--------|----------------|
| 代表 | Chameleon, Emu3 | Transfusion, BAGEL | Janus-Pro | NExT-GPT | Qwen3-Omni |
| 统一程度 | ★★★★★ | ★★★★ | ★★★ | ★★ | ★★★ |
| 图像生成质量 | ★★★ | ★★★★★ | ★★★★ | ★★★★ | N/A |
| 语音实时性 | ★★ | ★★ | ★★ | ★★ | ★★★★★ |
| 训练复杂度 | 高（稳定性） | 中（损失平衡） | 低 | 低 | 中 |
| 扩展性 | 强 | 强 | 中 | 弱 | 中 |

---

## 四、视觉 Tokenizer：Omni 模型的咽喉

视觉 tokenizer 是 Omni 模型中最关键、分歧最大的组件。它决定了图像/视频如何被转化为模型可处理的表征，直接影响生成质量上限。

### 4.1 离散 vs 连续：根本分歧

| 方案 | 原理 | 代表 | 优势 | 劣势 |
|------|------|------|------|------|
| **离散 Tokenizer** | 图像 → 码本索引序列 | VQ-VAE, VQ-GAN, MAGVIT-v2, SBER | 可直接复用 LLM 的自回归框架 | 离散化必然丢失信息；码本大小是质量瓶颈 |
| **连续表征** | 图像 → 连续向量序列 | SigLIP, CLIP, ViT | 保留完整信息；编码器更成熟 | 不能直接用自回归 loss；需要扩散或回归损失 |
| **混合** | 理解用连续，生成用离散/扩散 | Janus-Pro, BAGEL | 各取所长 | 工程复杂度高 |

### 4.2 离散 Tokenizer 的技术演进

**第一代：VQ-VAE / VQ-GAN**
- 码本大小：1024-8192
- 分辨率：256×256
- 问题：码本利用率低（codebook collapse），高频细节丢失严重

**第二代：MAGVIT-v2 / FSQ**
- Google 的 MAGVIT-v2 引入 Lookup-Free Quantization（LFQ），将码本大小推到 2^{18} = 262144
- Finite Scalar Quantization（FSQ）通过多维标量量化替代传统 VQ，更稳定

**第三代：SBER / 多分辨率编码**
- Emu3 的 SBER：32K 码本 + 多分辨率支持（128→512 像素自适应）
- 关键改进：temporal 维度扩展支持视频，在时间轴上共享码本

**码本大小与生成质量的经验关系**：

```
码本  8K  → rFID ~2.5 (Chameleon 级别)
码本 16K  → rFID ~1.5 (Janus-Pro 级别)  
码本 32K  → rFID ~0.8 (Emu3 级别，接近连续扩散模型)
码本 262K → rFID ~0.5 (MAGVIT-v2 级别)
```

rFID（reconstruction FID）衡量的是 tokenizer 自身的重建能力，不含生成模型的误差。

### 4.3 理解侧 vs 生成侧的表征矛盾

Janus 论文中的关键实验：将同一个 ViT 编码器同时用于理解和生成，发现两个任务的梯度方向存在系统性冲突。具体表现为：

- **理解任务**需要编码器输出高层语义（对象类别、空间关系、场景描述），对像素级细节不敏感
- **生成任务**需要编码器保留底层视觉细节（纹理、光照、精确轮廓），语义压缩反而有害

这个矛盾目前有三种解法：

1. **解耦**（Janus 路线）：理解用 SigLIP（语义编码器），生成用 VQ（细节保留编码器）
2. **超大码本**（Emu3 路线）：码本足够大时，离散 token 既能捕捉语义又能保留细节
3. **混合损失**（Transfusion 路线）：理解走 token，生成走连续扩散，绕开 tokenizer 统一的问题

---

## 五、数据工程：Omni 模型的燃料

### 5.1 数据类型谱系

Omni 模型的数据需求远比传统 LLM 复杂。以下是按模态和交互方式分类的数据谱系：

**单模态数据（基座能力）：**
| 类型 | 规模量级 | 代表数据集 | 作用 |
|------|---------|-----------|------|
| 纯文本 | 1-15T tokens | C4, RedPajama, FineWeb | 语言能力基座 |
| 纯图像 | 1-5B 张 | LAION-5B, DataComp, SA-1B | 视觉表征预训练 |
| 纯音频 | 100K-1M 小时 | LibriSpeech, GigaSpeech, WenetSpeech | 语音基础能力 |
| 纯视频 | 10M-100M 段 | HD-VILA, InternVid, Panda-70M | 时序理解 |

**配对数据（模态对齐）：**
| 类型 | 规模量级 | 代表数据集 | 作用 |
|------|---------|-----------|------|
| 图文对 | 1-10B 对 | LAION, CC12M, COYO-700M | 视觉-语言对齐 |
| 音文对 | 10M-100M 对 | LibriSpeech, CoVoST | 语音-语言对齐 |
| 视频-文本 | 10M-100M 对 | WebVid, HowTo100M | 视频理解 |

**交错数据（核心差异化）：**
| 类型 | 代表 | 重要性 |
|------|------|--------|
| 图文交错 | OBELICS, MMC4, Interleaved-CC | ★★★★★ 原生多模态训练的关键 |
| 文档理解 | DocVQA, ChartQA, InfoVQA | ★★★★ 复杂视觉推理 |
| 多轮多模态对话 | LLaVA-Instruct, ShareGPT-4V | ★★★★ 指令跟随 |

### 5.2 数据配比策略

不同模型的数据配比策略差异巨大，但存在一些共识：

**Chameleon 的教训**：

Meta 在 Chameleon 训练中发现，如果不控制图像 token 比例，模型会"偷懒"——过度关注图像 token（因为图像 token 的 loss 更容易优化），导致文本能力退化。最终方案：

```
文本 token : 图像 token = 7 : 3（严格控制）
```

并且在每个 batch 内强制保证比例，而非仅在整体数据集层面平均。

**Emu3 的多阶段策略**：

```
阶段 1（1.2T tokens）：纯文本 50% + 图文对 30% + 图文交错 15% + 视频 5%
阶段 2（200B tokens）：提升图文交错和视频比例，加入高质量生成数据
阶段 3（SFT）：多模态指令数据 + 生成偏好数据
```

**Beyond Language Modeling 的发现** [Tong et al., 2025]：

Meta FAIR 团队在受控实验中得到一个反直觉的结论——**增加视觉数据不仅提升视觉能力，还能提升语言能力**。这种"协同效应"在文本与视觉数据比例 6:4 到 5:5 时最为显著。但超过 5:5 后语言能力开始下降。

### 5.3 交错数据的构建管线

交错数据（Interleaved Data）是 Omni 模型区别于传统 MLLM 的关键数据类型。它的特征是文本和图像在文档中自然穿插，类似网页、教科书、技术文档的原始形态。

典型管线：

```
网页爬取 → HTML 解析 → 图文序列抽取 → 质量过滤 → 去重
                                                    ↓
过滤条件:                                         输出格式:
  - 图片分辨率 ≥ 200×200                          [TEXT] xxx [IMG] xxx [TEXT] xxx [IMG] xxx
  - 图文相关性评分 > 0.25 (CLIP)
  - 文本质量 (PPL < 阈值)
  - NSFW / 有害内容过滤
  - 广告/导航图片移除
```

OBELICS [Laurençon et al., 2023] 是目前最大的开源图文交错数据集（141M 文档，353M 图片），构建管线包括 60+ 个过滤规则。

### 5.4 视觉 Tokenizer 训练数据

一个容易被忽视的数据需求：视觉 tokenizer 自身的训练也需要大规模数据。

| Tokenizer | 训练数据 | 规模 | 关键设计 |
|-----------|---------|------|---------|
| Chameleon VQ | 高质量图像 | ~100M 张 | 两阶段：先大规模，再高质量微调 |
| Emu3 SBER | 图像 + 视频帧 | ~200M 张 | 联合训练，视频帧共享码本 |
| Janus VQ | ImageNet + LAION 子集 | ~50M 张 | 单独训练后冻结 |

---

## 六、训练策略：多阶段演进

### 6.1 通用三阶段框架

几乎所有 Omni 模型都遵循某种形式的多阶段训练：

```
阶段 1: 单模态预训练 (Foundation)
  └→ 文本: 标准 LLM 预训练 (1-15T tokens)
  └→ 视觉 Tokenizer: 独立训练 VQ/VAE (100M+ 图像)
  └→ 音频编码器: 预训练 (可选)

阶段 2: 多模态联合预训练 (Alignment & Fusion)
  └→ 逐步引入多模态数据
  └→ 可能分 2-3 个子阶段，逐步解冻参数
  └→ 数据配比随阶段调整

阶段 3: 指令微调 + 偏好对齐 (Instruction Tuning & RLHF)
  └→ 多模态指令数据 SFT
  └→ 人类偏好对齐 (DPO/RLHF)
  └→ 安全对齐
```

### 6.2 关键训练技巧

**稳定性**：
- QK-Norm（Chameleon 首创，后被广泛采用）：对 attention 的 Q 和 K 做 LayerNorm，防止注意力分数爆炸
- z-loss：在 softmax 之前加正则项，防止 logits 过大
- 梯度裁剪：多模态训练比纯文本更容易出现梯度尖峰

**效率**：
- MoE（BAGEL, Gemini）：不同专家处理不同模态，保持计算量可控
- 渐进式分辨率训练：先低分辨率，后高分辨率，节省早期计算
- Token 丢弃：训练时随机丢弃部分视觉 token，类似 MAE 的思路

**冻结策略的微妙选择**：

| 策略 | 适用场景 | 风险 |
|------|---------|------|
| 全冻结 LLM + 训练 Adapter | 快速对齐，资源有限 | 跨模态交互能力弱 |
| 全部端到端训练 | 最大性能，资源充足 | 语言能力可能退化；训练不稳定 |
| 渐进解冻 | 平衡质量和稳定性 | 需要精心设计解冻时间点 |

Janus-Pro 的实践表明：**先单独训练理解和生成，最后再联合微调**优于从头联合训练。原因是两个任务的早期梯度互相干扰，分开训练让各自的视觉编码器先收敛到合理状态。

### 6.3 Qwen3-Omni 的特殊训练流程

Qwen3-Omni 的 Thinker-Talker 架构带来独特的训练挑战：

```
步骤 1: 预训练 Thinker（大规模多模态 LLM 预训练）
步骤 2: 预训练 Talker（语音自回归模型，输入为文本/隐状态，输出语音 token）
步骤 3: 端到端联合训练
  └→ Thinker 输出隐状态 → Talker 生成语音
  └→ 同时用文本 loss 和语音 loss 联合优化
步骤 4: 偏好对齐
  └→ 语音自然度 + 内容准确性 + 情感表达
```

关键发现：端到端联合训练比分离训练的语音质量高出 15%+（主观评测 MOS 分），说明 Thinker 的隐状态可以携带超越文本的韵律和情感信息。

---

## 七、评估基准与性能对比

### 7.1 多模态理解评估

| 基准 | 评估能力 | GPT-4o | Gemini 2.5 | Qwen3-Omni | Janus-Pro-7B | Emu3-8B |
|------|---------|--------|-----------|------------|-------------|---------|
| MMMU | 多学科多模态 | 69.1 | 72.0* | - | - | 31.6 |
| MMBench | 综合视觉理解 | 83.4 | - | 81.0* | 79.2 | - |
| MathVista | 视觉数学推理 | 63.8 | - | - | - | - |

*标注"*"为预估或非官方数据

### 7.2 图像生成评估

| 基准 | 评估能力 | DALL-E 3 | Janus-Pro-7B | Emu3-8B | BAGEL-7B | Chameleon-34B |
|------|---------|----------|-------------|---------|----------|--------------|
| GenEval | 组合生成 | 67% | 80% | 68% | 85%* | 39% |
| DPG-Bench | 指令遵循 | 83% | 84% | 80% | 87%* | - |
| FID (COCO) | 生成保真度 | ~12 | ~9 | ~7 | ~6* | ~26 |

关键观察：
- **Janus-Pro 和 BAGEL 在开源模型中领先**，某些指标已超 DALL-E 3
- **Chameleon 的生成质量明显落后**，验证了纯自回归 + 小码本路线的局限
- **Emu3 通过大码本缩小了纯自回归与扩散的差距**

### 7.3 语音/音频评估

| 模型 | 端到端语音延迟 | 语音自然度(MOS) | ASR WER | 音频理解 |
|------|-------------|---------------|---------|---------|
| GPT-4o | ~232ms | 4.2+ | - | 强 |
| Gemini 2.0 | ~300ms* | 4.0+ | - | 强 |
| Qwen3-Omni | ~500ms* | 3.8+ | - | 中-强 |
| Baichuan-Omni | ~800ms* | 3.5+ | - | 中 |

GPT-4o 在语音实时性上仍然领先，主要得益于原生端到端设计而非 TTS 级联。

---

## 八、技术趋势与开放问题

### 8.1 六个正在发生的趋势

**趋势一：混合损失正在胜出**

2024 年的争论（纯自回归 vs 扩散）到 2025-2026 年逐渐有了答案：混合损失（Transfusion 路线）在工程实践中表现最均衡。BAGEL 和 Beyond Language Modeling 的成功进一步验证了这个方向。

但纯自回归路线并未放弃。Emu3 证明了只要 tokenizer 足够强，纯自回归依然有竞争力。最终可能收敛到：**超大码本的自回归 ≈ 混合损失**。

**趋势二：MoE 成为标配**

多模态训练的计算量远超纯文本。MoE 允许模型在不增加推理成本的前提下扩大参数量，并让不同的专家自然分工到不同模态。Gemini、BAGEL、Beyond Language Modeling 都采用了 MoE。

**趋势三：流式/实时成为刚需**

GPT-4o 和 Qwen3-Omni 都强调了端到端语音对话的实时性。Thinker-Talker 架构专门为此设计。未来的 Omni 模型必须支持"边想边说"，而非"想完再说"。

**趋势四：视频模态正在从理解走向生成**

2024 年大多数 Omni 模型只支持视频理解，不支持视频生成（太难）。2025 年 Emu3 开始尝试视频生成（短视频），预计 2026 年会有更多模型跟进。关键瓶颈是视频 token 的序列长度和计算量。

**趋势五：数据工程从"量"转向"配比"**

所有成功的 Omni 模型都表明，**数据配比策略比数据总量更重要**。Chameleon 的 7:3 比例、Emu3 的三阶段递进、Beyond Language Modeling 的协同效应发现，都指向精细的配比调控。

**趋势六：评估体系严重滞后**

现有基准大多评估单一能力（要么理解，要么生成）。缺乏评估 **Any-to-Any 联合能力** 的综合基准。例如：给一段视频 + 一段音频，要求模型同时输出文字摘要 + 关键帧 + 背景音乐——这种跨模态联合生成目前没有标准化评估方案。

### 8.2 五个开放问题

**Q1: 统一表征是否存在理论极限？**

理解和生成的表征矛盾（§4.3）是否可以通过足够大的模型/数据来解决，还是本质上不可调和？Janus 认为不可调和，Emu3 认为可以用大码本缓解。这个问题的答案决定了长期架构走向。

**Q2: 如何高效处理长视频？**

一分钟视频在当前 tokenizer 下需要数十万个 token。即使用 Mamba 等线性注意力替代方案，视频的计算量仍然是文本的 100 倍以上。

**Q3: 多模态对齐的 Scaling Law 是什么？**

文本 LLM 的 Chinchilla Scaling Law 已经被广泛验证。但多模态训练的 Scaling Law 还不清晰——增加视觉数据和增加视觉参数的边际收益分别是多少？Beyond Language Modeling 给出了初步答案，但样本量（最大 13.5B）还不够。

**Q4: Omni 模型的安全对齐如何做？**

多模态生成带来新的安全风险：生成虚假图像/视频/语音。传统的文本 RLHF 方法能否直接迁移到多模态生成？跨模态的"越狱攻击"（用图像绕过文本安全过滤）如何防御？

**Q5: 开源 vs 闭源的差距能否收敛？**

截至 2026 年 3 月，GPT-4o 和 Gemini 2.5 在综合能力上仍然领先开源方案。差距主要在：数据规模（万亿级 token vs 千亿级）、工程优化（推理加速、长序列优化）、人类偏好对齐的精细度。BAGEL、Janus-Pro 正在缩小差距，但全面追平可能还需要 1-2 年。

---

## 九、结语：一个未完成的故事

Omni 大模型正处于从"概念验证"到"工程落地"的关键转折点。

2024 年，GPT-4o 证明了 Any-to-Any 是可行的。2025 年，开源社区在架构层面追到了 80% 的水平。2026 年的竞争将集中在三个方面：**数据工程的精细度**、**训练效率的工程优化**、**实时交互的用户体验**。

如果让我做一个判断（标注为个人推测）：混合损失 + MoE 路线可能在 1-2 年内成为主流架构；纯自回归路线在视觉 tokenizer 突破（码本 > 100K）后可能回归；而 Thinker-Talker 式的分离架构则会在实时语音对话场景中持续发展。

最终，Omni 模型的终局形态可能不是"一个模型做所有事"，而是"一个统一的表征空间 + 可插拔的模态头"——既保持表征的深度融合，又保留各模态生成的灵活性。

---

## 参考文献

1. Sun et al., "A Survey of Omni-Multimodal Large Language Models," ACL 2025 Findings, arXiv:2412.11694
2. Team et al., "Chameleon: Mixed-Modal Early-Fusion Foundation Models," Meta, arXiv:2405.09818
3. Wang et al., "Emu3: Next-Token Prediction is All You Need," BAAI, arXiv:2409.18869
4. Zhou et al., "Transfusion: Predict the Next Token and Diffuse Images with One Multi-Modal Model," Meta, arXiv:2408.11039
5. Wu et al., "Janus: Decoupling Visual Encoding for Unified Multimodal Understanding and Generation," DeepSeek, arXiv:2410.13848
6. Chen et al., "Janus-Pro: Unified Multimodal Understanding and Generation with Data and Model Scaling," DeepSeek, arXiv:2501.17811
7. Tong et al., "Beyond Language Modeling: An Exploration of Multimodal Pretraining," Meta FAIR, arXiv:2603.03276
8. Qwen Team, "Qwen3-Omni Technical Report," Alibaba, arXiv:2509.17765
9. "BAGEL: Bootstrapped Agentic Generation Enables Large Vision-Language Model," ByteDance, 2025
10. Shen et al., "NExT-GPT: Any-to-Any Multimodal LLM," NUS, arXiv:2309.05519
11. Tang et al., "CoDI-2: In-Context, Interleaved, and Interactive Any-to-Any Generation," Microsoft, 2024
12. Lu et al., "Unified-IO 2: Scaling Autoregressive Multimodal Models with Vision, Language, Audio, and Action," AI2, 2024
13. Wu et al., "AnyGPT: Unified Multimodal LLM with Discrete Sequence Modeling," Fudan, 2024
14. Laurençon et al., "OBELICS: An Open Web-Scale Filtered Dataset of Interleaved Image-Text Documents," HuggingFace, 2023
15. Yu et al., "Language Model Beats Diffusion — Tokenizer is Key to Visual Generation," Google, arXiv:2310.05737
