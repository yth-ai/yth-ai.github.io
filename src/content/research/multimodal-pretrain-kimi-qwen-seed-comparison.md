---
title: "多模态大模型预训练解析：Kimi K2.5 / Qwen2.5-VL / Seed1.5-VL / Qwen3.5-Omni / GLM-5V-Turbo 技术报告对比"
description: "系统梳理五篇代表性多模态模型技术报告在预训练阶段的核心设计：数据规模与来源、预训练阶段划分、视觉/音频编码器设计及关键工程实践，聚焦数据视角的横向对比。含 Qwen3.5-Omni 全模态模型和 GLM-5V-Turbo 多模态 Coding 基座。"
date: 2026-04-02T12:28
category: 综合调研
tags: ["多模态", "预训练", "数据工程", "Kimi", "Qwen", "Seed", "GLM", "视觉语言模型", "全模态", "Omni"]
---

## 概述

2025–2026 年，国内多模态大模型进入集中爆发期。Moonshot AI 的 **Kimi K2.5**（arXiv:2602.02276，2026-02）、阿里 **Qwen2.5-VL**（arXiv:2502.13923，2025-02）、字节跳动 **Seed1.5-VL**（arXiv:2505.07062，2025-05）、阿里 **Qwen3.5-Omni**（2026-03-30 发布，基于 Qwen3-Omni arXiv:2509.17765）、智谱 **GLM-5V-Turbo**（2026-04-02 发布，基于 GLM-V 系列 arXiv:2507.01006）五份技术报告/产品发布集中披露了预训练的关键细节，为行业提供了难得的参考窗口。

其中 Qwen3.5-Omni 是第一个真正意义上的**全模态（Omni-Modal）**模型——同时处理文本、图像、音频、视频四种输入并支持文字+语音双模态输出；GLM-5V-Turbo 则是首个明确定位**多模态 Coding 基座**的模型——从预训练到后训练全程融合视觉与编程能力，专为 Agent 工作流设计。

本文从预训练数据与流程的角度横向对比五者的设计决策，重点关注：数据规模与来源、预训练阶段划分、视觉/音频编码器、训练策略中的关键取舍。

---

## 一、数据规模总览

| 模型 | 发布时间 | 预训练 Token 总量 | 基础语言模型 | 编码器 | 主要特色 |
|------|---------|------------------|-------------|--------|---------|
| **Qwen2.5-VL** | 2025-02 | 4.1T（相较 Qwen2-VL 的 1.2T 翻三倍）| Qwen2.5 LLM | 从头训练的原生动态分辨率 ViT | 预训练数据激增，Window Attention |
| **Seed1.5-VL** | 2025-05 | 3T 高质量源 token（Stage 1）+ 240B 长上下文（Stage 2）| MoE LLM（20B 活跃参数）| SeedViT（5.32 亿参数）| 三阶段训练，Scaling Laws 实验 |
| **Kimi K2.5** | 2026-02 | ~15T（视觉+文本混合）| Kimi-K2-Base（1.04T 参数 MoE）| MoonViT（原生分辨率）| 四阶段流水线，长上下文扩展至 128K |
| **Qwen3.5-Omni** | 2026-03-30 | ~2T（通用训练阶段）| Qwen3（Thinker-Talker MoE）| Qwen3-VL 视觉编码器 + AuT 音频编码器 | 全模态（文本/图像/音频/视频），ARIA 音频对齐 |
| **GLM-5V-Turbo** | 2026-04-02 | 未公开（继承 GLM-V 系列大规模预训练）| GLM-5-Turbo（MoE）| CogViT（新一代视觉编码器）+ MTP 结构 | 多模态 Coding 基座，200K 上下文，30+ 任务协同 RL |

**关键观察**：Kimi K2.5 的 15T 数量级远超其他模型，原因在于这是在 Kimi K2 的 checkpoint 上做的多模态连续预训练（continual pretraining），文本数据沿用了 Kimi K2 的数据方法论和语料来源设计（Web Text + Code + Math + Knowledge 四大领域，详见 [Kimi K2.5 Technical Report](https://arxiv.org/abs/2602.02276) Appendix B.2）；而 Qwen2.5-VL 的 4.1T 和 Seed1.5-VL 的 ~3.24T 更接近纯视觉-语言对齐的数据量概念。GLM-5V-Turbo 未公开预训练 token 量，具体数据规模无法判断。

---

## 二、Kimi K2.5：四阶段预训练流水线

[Kimi K2.5 Technical Report](https://arxiv.org/abs/2602.02276) 将 15T token 的预训练拆分为四个明确阶段：

### 2.1 视觉编码器：MoonViT

MoonViT 采用 NaViT 的打包方法（Packing）——将图像分割为 patch 后展平拼接为一维序列，与语言模型共享 FlashAttention 变长序列算子，支持任意分辨率输入无需固定尺寸或切图。

位置编码双轨并行：
- **早期**：复用 SigLIP-SO-400M 的可学习绝对位置编码 + 插值适配高分辨率
- **后期**：切换至 **2D RoPE**，在 H/W 两个维度分别应用旋转位置嵌入，提升细粒度位置编码能力

视觉特征到语言模型的桥接：两层 MLP 投影器，内嵌 2×2 的 pixel shuffle 空间压缩，避免高分辨率图像的 token 数量爆炸。

### 2.2 四阶段训练策略

| 阶段 | 训练对象 | Token 量 | 核心目标 |
|------|---------|---------|---------|
| Stage 1: ViT Training | MoonViT 独立训练 | — | 图文对，双目标：SigLIP 对比 + CoCa 字幕生成；渐进式分辨率采样 |
| Stage 2: Vision-Language Alignment | MoonViT + MLP 投影器 | 0.1T | 对齐 ViT 嵌入与 MoE LLM，降低初始困惑度；LLM 参数冻结 |
| Stage 3: Joint Pre-training | 全模型 | 主体训练量 | 先纯文本预热，再渐进引入多模态数据；保持语言能力同时集成视觉 |
| Stage 4: Long-Context Activation | 全模型 | 长序列专项 | 上下文从 8K 扩至 128K，两次四倍扩展；长视觉交织 + 长视频 + 长文档均覆盖 |

### 2.3 数据六大类别

Kimi K2.5 的预训练语料围绕六个维度构建：

1. **Caption（图像描述）**：严格控制合成数据比例，避免幻觉
2. **Interleaving（视觉-文本交织）**：开源 + 自建大规模语料（教科书、网页、教程），引入数据重排序保证图文语义对应
3. **OCR**：遵循 OCR 2.0 原则，单页 + 多页文档，数据增强（旋转/扭曲/色彩/噪声）
4. **Knowledge（知识图谱）**：覆盖结构化视觉知识
5. **Video**：开源 + 自建网络视频，专门设计密集字幕生成管道；合成字幕比例严格控制
6. **Agent**：虚拟环境（桌面/移动/Web）启发式采集，密集定位格式 + 连续轨迹格式，含合成 CoT 计算机操作轨迹

**文本预训练语料**沿用 Kimi K2 的数据方法论（Appendix B.2），覆盖 Web Text、Code、Mathematics、Knowledge 四大领域，每个领域做了源级正确性验证和采样策略优化。代码数据特别增强了仓库级代码、Issue/Code Review/Commit 历史、代码相关文档三类数据的权重。

> 注：Moonlight-16B-A3B 在 K2.5 中仅作为 ViT Training Stage（阶段 1）的对齐目标模型出现——用 caption loss 让 MoonViT 与 Moonlight 对齐，不涉及文本语料复用。

> "We adopt a cautious attitude toward the use of synthetic data in pretraining, especially in caption data, limiting their proportion to reduce the risk of hallucination."
> — Kimi Team, [Kimi K2.5 Technical Report](https://arxiv.org/abs/2602.02276)

---

## 三、Qwen2.5-VL：数据规模三倍扩张

[Qwen2.5-VL Technical Report](https://arxiv.org/abs/2502.13923) 的最大亮点之一是预训练数据从 Qwen2-VL 的 **1.2T → 4.1T token**（3.4 倍），同时对数据质量做了系统升级。

### 3.1 视觉编码器：从头训练的原生动态分辨率 ViT

与其他方案借用现成 CLIP 编码器不同，Qwen2.5-VL 选择**从头训练**视觉编码器，核心改动：

- **Window Attention**：替换全局注意力，大幅降低推理计算开销
- **SwiGLU 激活 + RMSNorm**：更现代的 Transformer 结构
- **MRoPE + Absolute Time Encoding**：位置编码与绝对时间对齐，支持秒级视频时序定位

### 3.2 预训练数据构成与分阶段训练

报告描述了多阶段预训练，数据类型覆盖：

- **Image-text interleaved**：文档、网页等自然交织数据
- **图像-文本对**（多场景、多语言）
- **视频数据**：动态 FPS 采样（支持变速视频）；绝对时间编码使模型精准定位视频中的具体时间点
- **OCR & 文档**：多语言 OCR、扫描文档、表格、化学式、乐谱等
- **知识问答**：多模态 QA，覆盖科学、医疗、代码等领域

**核心策略**：
- 预训练第一阶段：冻结 LLM，仅训练 ViT 和连接层
- 后续阶段：解冻全模型联合训练
- SFT 阶段维持与预训练数据比例相当的混合

> "We make significant efforts in curating high-quality data for both pre-training and supervised fine-tuning, further scaling the pre-training corpus from 1.2 trillion tokens to 4.1 trillion tokens."
> — Qwen Team, [Qwen2.5-VL Technical Report](https://arxiv.org/abs/2502.13923)

### 3.3 数据质量策略

Qwen2.5-VL 在文档解析方向做了专项优化：

- **Omnidocument Parsing**：将文本识别升级为全文档理解，支持手写、表格、图表、化学式、乐谱等
- **Bounding box / point grounding**：精确定位能力的数据构建
- **绝对坐标格式**：在 grounding 数据中统一使用绝对坐标（而非归一化坐标），降低模型学习负担

---

## 四、Seed1.5-VL：三阶段训练 + Scaling Laws 实验

[Seed1.5-VL Technical Report](https://arxiv.org/abs/2505.07062) 的独特价值在于：**系统披露了 Scaling Laws 分析**，建立了训练损失与下游任务性能之间的定量关系。

### 4.1 视觉编码器：SeedViT 三阶段预训练

SeedViT（5.32 亿参数）本身经历独立的三阶段预训练，再集成进整体系统：

| 阶段 | 方法 | 目标 |
|------|------|------|
| Stage 1 | Masked Image Modeling（MIM）+ 2D RoPE | 以 EVA02-CLIP-E 为教师，学生模型学习重构遮蔽图像块，提升 OCR / 图表理解 |
| Stage 2 | 原生分辨率对比学习（SigLIP + SuperClass 损失）| 对齐图像-文本嵌入 |
| Stage 3 | 全模态预训练（MiCo 框架）| 融合视频帧、音频、视觉文本构建统一多模态表示 |

共使用 **70 亿 token** 数据（无标签图像 + 图文对 + 视频-音频-文本三元组）。

### 4.2 整体预训练三阶段

| 阶段 | Token 量 | 序列长度 | 可训练组件 | 核心目标 |
|------|---------|---------|---------|---------|
| Stage 0 | 16B | 32,768 | MLP 适配器 | 视觉-语言初始对齐；LLM + ViT 冻结 |
| Stage 1 | 3T | 32,768 | 全模型 | 知识积累、视觉定位、OCR 强化；5% 纯文本维持语言能力 |
| Stage 2 | 240B | 131,072 | 全模型 | 引入视频/3D/代码新领域；长上下文扩展 |

### 4.3 预训练数据七大维度

Seed1.5-VL 的 3T 数据覆盖：

1. **通用图像-文本对 & 知识**：互联网大规模语料；核心问题是长尾分布——通过预训练模型自动标注语义域 + 命名实体，识别低频类别并数据增强，解决常见类别过表达问题

2. **OCR**：10 亿样本，含文档/场景/表格/图表/流程图；合成工具（SynthDog、LaTeX）覆盖艺术字体、手写体、非拉丁字符；图表 1 亿+，表格 5000 万

3. **视觉定位 & 计数**：Objects365、OpenImages、RefCOCO；点标注 1.7 亿样本（PixMo-Points / Molmo / CountGD）；计数数据 800 万

4. **3D 空间理解**：相对深度排序（3.2 亿 token，DepthAnything V2 生成）、绝对深度估计（1800 万样本 / 280 亿 token）、3D 定位（77 万 QA 对）

5. **视频理解**：通用视频 + 时间定位 + 视频流理解（交错字幕/主动推理/实时评论）

6. **STEM 教育**：数学/物理/化学/生物；教育定位 320 万 + 1 亿 K12 练习题；CoT 数据覆盖图像相关问题求解

7. **GUI**：UI-TARS 数据集，网页/App/桌面；结构化元数据 + 多步骤任务轨迹（观察→思考→操作）

### 4.4 Scaling Laws 分析

Seed1.5-VL 是三者中唯一系统报告 Scaling Laws 的：

$$\hat{L} \sim \frac{B}{D^\beta}$$

实验拟合结果（Stage 1）：
- OCR 损失：$\log(\hat{L}_{ocr}) \approx -0.1817 \log(D) - 0.7011$
- 定位损失：$\log(\hat{L}_{grounding}) \approx -0.0785 \log(D) - 0.0745$

损失与下游性能呈对数线性关系，例如：
- ChartQA 准确率：$\text{Acc} \approx -0.0968 \log(\text{loss}_{ocr}) + 0.7139$
- InfographicVQA：$\text{Acc} \approx -0.1488 \log(\text{loss}_{ocr}) + 0.5319$

这使得 Seed 团队可以在训练早期通过损失曲线预测最终任务性能，指导数据策略调整。

> "This report provides a comprehensive review of the experiences in building Seed1.5-VL across model design, data construction, and training at various stages."
> — Seed Team, ByteDance, [Seed1.5-VL Technical Report](https://arxiv.org/abs/2505.07062)

---

---

## 五、Qwen3.5-Omni：全模态的扩展（2026-03-30）

Qwen3.5-Omni 是四个模型中定位最为特殊的——它不是视觉语言模型，而是**全模态（Omni-Modal）**模型，同时处理文本、图像、音频、视频，并支持文字+实时语音双模态输出。这一定位使其预训练设计面临更复杂的挑战。

### 5.1 架构：Thinker-Talker + Hybrid-Attention MoE

Qwen3.5-Omni 继承并扩展了 Qwen3-Omni（[arXiv:2509.17765](https://arxiv.org/abs/2509.17765)）的 Thinker-Talker 双塔架构：

- **Thinker**：理解模块，处理所有模态的输入理解和推理
- **Talker**：生成模块，负责语音合成和输出；与 Thinker 并行运行
- **Hybrid-Attention MoE**：结合稀疏 MoE 和混合注意力机制，在效率与效果之间取得平衡

编码器组件：
- **视觉编码器**：继承自 Qwen3-VL，已在大规模图像-视频-文本数据上预训练
- **音频编码器 (AuT)**：Audio Transformer，注意力编码器-解码器架构，专为音频信号设计

Qwen3.5-Omni-Plus 支持规格：256K 上下文、10 小时连续音频、4M 帧 720P 视频（约 2 小时）、113 种语言语音识别、36 种语言语音输出。

### 5.2 三阶段预训练流程

Qwen3-Omni 技术报告披露了三阶段训练策略（Qwen3.5-Omni 沿用并扩展）：

| 阶段 | 核心操作 | 关键参数 | 目标 |
|------|---------|---------|------|
| Stage 1：编码器对齐 | 冻结 LLM → 先训练 Adapter → 再训练 Encoder + Adapter | 小规模 | 将视觉/音频编码器与 LLM 语义空间对齐 |
| Stage 2：通用训练 | 解冻全模型，多模态数据混合训练 | ~2T tokens，8K 上下文 | 多模态知识积累，建立跨模态关联 |
| Stage 3：长上下文扩展 | 上下文从 8K → 32K（Qwen3-Omni），Qwen3.5-Omni 进一步扩展至 256K | 长音视频专项数据 | 支持长会议、长视频等真实场景 |

**Stage 2 数据配比**（Qwen3-Omni 披露）：

| 模态 | Token 量 | 占比 |
|------|---------|------|
| 图像-文本 | 0.82T | 41.0% |
| 音频-文本 | 0.77T | 38.5% |
| 纯文本 | 0.57T | 28.5% |
| 视频-文本 | 0.05T | 2.5% |
| 视频-音频 | 0.05T | 2.5% |

### 5.3 关键设计决策：分阶段编码器训练

Qwen3-Omni 技术报告明确说明，放弃了 Qwen2.5-Omni 使用的「Encoder + Adapter 联合训练」策略：

> "We abandon the stage used in Bai et al. (2025); Xu et al. (2025) where the encoder and adapter are trained jointly while keeping the LLM frozen, because this approach may cause the encoder to compensate for the limitations of the frozen LLM, which can lead to degraded perception capabilities."
> — Qwen Team, [Qwen3-Omni Technical Report](https://arxiv.org/abs/2509.17765)

**问题根因**：联合训练时，编码器会「迁就」冻结的 LLM，扭曲自身的感知特征表示。  
**修复方案**：Stage 1 分两步——先只训练 Adapter（编码器冻结），再训练 Encoder + Adapter（LLM 冻结）。这使编码器在语义空间对齐的同时，保持了独立的感知能力。

### 5.4 早期跨模态融合 vs 后期融合

| 维度 | Qwen2.5-Omni | Qwen3-Omni / Qwen3.5-Omni |
|------|-------------|--------------------------|
| **跨模态引入时机** | Stage 2 才引入跨模态数据 | Stage 1 就同时引入单模态+跨模态数据 |
| **提示策略** | 每个任务单一固定提示 | 多样化自然语言提示（增强泛化能力） |
| **编码器训练** | Encoder + Adapter 联合训练 | Adapter → Encoder 分阶段训练 |

早期融合的优势：更早建立跨模态关联，避免模态偏见，对需要音视频同步理解的任务（如 Audio-Visual Vibe Coding）效果更好。

### 5.5 ARIA：音频节奏对齐技术

Qwen3.5-Omni 新增 **ARIA（Adaptive Rate Interleave Alignment）**技术，解决实时语音合成的老大难问题（漏字、重复、节奏错误、卡顿）：

- 动态调整文本生成与音频合成的节奏，使两者时序精确对齐
- 实现 Realtime 模式下的流畅实时对话，无卡顿、无漏字
- 支持 Auto Turn-taking（模型自主判断说话时机），接近人类自然对话

---

## 五-B、GLM-5V-Turbo：多模态 Coding 基座（2026-04-02）

GLM-5V-Turbo 是智谱于 2026 年 4 月 2 日发布的**多模态 Coding 基座模型**，定位与前四者有本质区别——它不是通用视觉语言模型，而是专为 Agent 时代的视觉编程任务打造。这使得它在预训练和后训练设计上有独特的取舍。

### 5B.1 架构：CogViT + MTP + GLM-5-Turbo MoE

GLM-5V-Turbo 在 GLM-V 系列（GLM-4.1V → GLM-4.5V → GLM-4.6V）基础上做了四个层面的系统升级：

- **视觉编码器**：新一代 **CogViT**，相比前代 SigLIP-2-SO400M，精准解析设计草图、高清截图与复杂版面
- **模型结构**：引入 **MTP（Multi-Token Prediction）**结构，提升多模态理解与推理效率
- **基座语言模型**：GLM-5-Turbo（745B 参数、44B 激活 MoE 架构）
- **上下文窗口**：200K tokens（最大输出 128K）

### 5B.2 训练策略：Agentic 元能力注入

GLM-5V-Turbo 最大的训练特色是**从预训练阶段就注入 Agentic 元能力**：

| 阶段 | 核心操作 | 关键特点 |
|------|---------|---------|
| 预训练 | 原生多模态融合 | 从预训练阶段持续强化视觉与文本协同能力（非后接式） |
| 后训练 | 多任务协同 RL | 同时优化 30+ 种任务类型，覆盖 STEM、Grounding、Video、GUI Agent、Coding Agent |
| 数据构造 | Agentic 数据体系 | 多层级、可控、可验证的 Agent 数据，增强动作预测与执行能力 |

### 5B.3 与 GLM-V 系列的演进关系

GLM-V 系列的技术演进路线清晰：

| 版本 | 发布时间 | 参数规模 | 核心突破 |
|------|---------|---------|---------|
| **GLM-4.1V-Thinking** | 2025-07 | 9B | 思维链推理 + RLCS 强化学习，9B 超越 Qwen2.5-VL-72B |
| **GLM-4.5V** | 2025-07 | MoE（基于 GLM-4.5-Air）| 42 个 benchmark SOTA，思考模式开关，全场景覆盖 |
| **GLM-4.6V** | 2025-07 | 106B-A12B MoE | 原生多模态工具调用，128K 上下文，图文交织生成 |
| **GLM-5V-Turbo** | 2026-04-02 | MoE（基于 GLM-5-Turbo）| CogViT + MTP，200K 上下文，多模态 Coding 基座 |

**关键演进**：GLM-4.6V → GLM-5V-Turbo 的核心变化是从"通用 VLM + 工具调用"升级为"原生多模态 Coding 基座"——在预训练阶段就融入编程和 Agent 能力，而非后期通过 SFT 叠加。

### 5B.4 独特定位：为 Agent 框架原生适配

GLM-5V-Turbo 明确对标 Agent 工作流场景：

- **Claude Code / OpenClaw / AutoClaw 深度适配**：支持"看懂环境 → 规划动作 → 执行任务"完整闭环
- **GUI 自主探索**：自主浏览页面结构，生成代码复现站点
- **设计稿还原**：从草图/截图直接生成可运行的前端工程
- **多模态工具调用**：画框、截图、读网页等，将 Agent 感知-行动链路从纯文本延伸到视觉交互

> GLM-5V-Turbo 的出现标志着多模态模型从"通用理解"向"专项工程能力"分化的趋势——不追求全模态覆盖，而是将视觉能力深度融入特定垂直场景（编程+Agent），追求在该场景下的极致表现。

---

## 六、横向对比：关键设计决策

### 6.1 视觉/感知编码器策略

| 维度 | Kimi K2.5 (MoonViT) | Qwen2.5-VL | Seed1.5-VL (SeedViT) | Qwen3.5-Omni | GLM-5V-Turbo (CogViT) |
|------|---------------------|------------|----------------------|-------------|----------------------|
| **初始化来源** | SigLIP-SO-400M | 从头训练 | EVA02-CLIP-E → MIM 预训练 | Qwen3-VL（视觉）+ AuT（音频） | 新一代 CogViT（GLM-V 系列演进） |
| **分辨率处理** | NaViT 打包，原生分辨率 | 动态分辨率 ViT + Window Attention | 原生分辨率 + 2×2 平均池化压缩 | 原生分辨率（继承 Qwen3-VL）| 原生分辨率（支持设计稿/截图高清解析） |
| **位置编码** | AbsPos（早期）→ 2D RoPE（高分辨率）| MRoPE + Absolute Time | 2D RoPE | 2D RoPE（继承）| 未公开 |
| **音频编码器** | 无（纯视觉语言）| 无 | 无 | AuT（Audio Transformer）| 无（纯视觉语言） |
| **特殊优化** | Pixel shuffle 压缩 token 数 | Window Attention 降推理开销 | 2×2 avg pool 降 token 数 | ARIA 音频节奏对齐 | MTP 多 token 预测提升推理效率 |

### 6.2 阶段划分策略

五个模型均采用**渐进式多阶段**，但逻辑不同：

- **Kimi K2.5**：先独立训练视觉编码器 → 轻量对齐 → 全模型联合训练 → 长上下文扩展。数据渐进引入，先语言预热再增加多模态比例。
- **Qwen2.5-VL**：视觉编码器从头训练，与 LLM 联合预训练为主，重点在预训练数据规模的大幅扩张。
- **Seed1.5-VL**：Stage 0（仅 MLP 适配器）→ Stage 1（全模型，3T）→ Stage 2（长上下文扩展，240B）。Stage 0 的必要性已被消融实验验证。
- **Qwen3.5-Omni**：编码器对齐（分步）→ 全模态通用训练（~2T）→ 长上下文扩展（最终至 256K）。最大特点是额外引入音频模态和 Thinker-Talker 分离架构。
- **GLM-5V-Turbo**：继承 GLM-V 系列的大规模预训练基座（SigLIP-2-SO400M → RLCS 强化学习），在此基础上升级为 CogViT + MTP 架构，并从预训练阶段注入 Agentic 元能力，最后通过 30+ 任务类型的协同 RL 强化。最大特点是**预训练-后训练全程融合编程能力**。

### 6.3 合成数据的态度

| 维度 | Kimi K2.5 | Qwen2.5-VL | Seed1.5-VL | Qwen3.5-Omni | GLM-5V-Turbo |
|------|-----------|------------|------------|-------------|-------------|
| **合成数据策略** | 慎重，caption 合成比例严格控制 | 大量高质量合成数据 | 大量合成，质量过滤 | 未详细披露，多样化提示为关键 | 多层级可控可验证的 Agentic 数据体系 |
| **核心考量** | 避免幻觉 | 扩大覆盖度 | 覆盖边缘场景 | 多语言/多方言泛化能力 | Agent 动作预测的可验证性 |

### 6.4 数据配方共识（五模型）

- **OCR 是必做专项**：均投入大量资源构建文档/表格/图表 OCR 数据
- **交织数据（Interleaved）是核心**：多图理解、长上下文学习的关键数据类型
- **Agent/GUI 数据是趋势**：Kimi、Seed 和 GLM 均专门构建虚拟环境操作数据，GLM-5V-Turbo 更将 Agent 能力作为核心定位
- **长上下文单独激活**：均有专门的 long context stage，不依赖单阶段训练自然涌现
- **少量纯文本维持语言能力**：Seed1.5-VL Stage 1 显式添加 5%；Qwen3-Omni Stage 2 含 28.5% 纯文本
- **多任务协同 RL 成为标配**：GLM-5V-Turbo 的 30+ 任务协同 RL 和 GLM-4.5V 的 RLCS 代表了后训练阶段从单任务 SFT 向多任务 RL 的演进

---

## 七、从数据工程视角的启示

**1. 数据规模的边际收益递减与数据多样性的价值上升**

Qwen2.5-VL 1.2T → 4.1T 的效果显著，但 Seed1.5-VL 的 Scaling Laws 实验表明，OCR 损失的幂律指数（-0.1817）比定位损失（-0.0785）更陡，意味着 OCR 类数据的数据效率更高，是单位计算收益最大的方向之一。

**2. 数据重平衡比简单堆规模更重要**

Seed1.5-VL 的长尾实验直接证明：通过识别低频类别并做数据增强，可显著提升模型对稀有类别的识别能力——这与"堆更多数据"的直觉相反，是精细化数据工程的体现。

**3. 多模态预训练的「冷启动问题」**

三者均设计了专门的视觉-语言对齐阶段（Kimi Stage 2 / Seed Stage 0），核心是在 LLM 上"引导"视觉理解能力，而非从随机初始化开始。Seed 消融实验表明省略 Stage 0 会导致性能下降——这个阶段 token 量极少（16B）但价值很高。

**4. 视频数据的合成字幕控制问题**

Kimi K2.5 和 Seed1.5-VL 均显式提到严格控制视频合成字幕比例。视频数据量大但真实字幕稀缺，过度依赖合成字幕会引入系统性偏差，是当前多模态预训练的核心工程挑战之一。

**5. 长上下文扩展需要多模态数据联动**

Kimi K2.5 的 Stage 4 明确指出：长上下文激活不只是扩展位置编码，还需要同步引入长视觉交织数据、长视频和长文档，确保纯文本和多模态两个维度都被激活。这是区别于纯文本模型的关键点。

---

**6. Omni 模型引入了新的数据工程维度**

Qwen3.5-Omni 的出现意味着多模态预训练进入了新阶段：音频数据（语音识别、语音合成）成为第一公民，数据配比中音频占比高达 38.5%，超过纯文本。音视频同步理解（视频-音频联合数据）的比例虽小（2.5%）但关键，是「Audio-Visual Vibe Coding」等涌现能力的数据来源。音频合成端的质量问题（节奏对齐、卡顿）需要专门的技术方案（ARIA），这是视觉语言模型完全不需要面对的新挑战。

**7. 多模态模型正在从通用走向垂直分化**

GLM-5V-Turbo 的出现代表了一个重要趋势：多模态模型不再只追求"全能"，而是开始在特定垂直场景上做深。它从预训练阶段就融入编程和 Agent 能力，通过 30+ 任务类型的协同 RL 强化，在 Coding + GUI Agent 方向做到极致。这与 Qwen3.5-Omni 追求全模态覆盖形成了鲜明对比——**广度（Omni）与深度（Coding 基座）的分化已经开始**。对于数据工程而言，这意味着未来的多模态数据建设不再是"一套数据打天下"，而是需要根据模型定位设计差异化的数据配方。

---

## 参考资料

- Qwen Team. [Qwen2.5-VL Technical Report](https://arxiv.org/abs/2502.13923). arXiv:2502.13923, 2025.
- Seed Team, ByteDance. [Seed1.5-VL Technical Report](https://arxiv.org/abs/2505.07062). arXiv:2505.07062, 2025.
- GLM-V Team, ZhipuAI. [GLM-4.5V and GLM-4.1V-Thinking: Towards Versatile Multimodal Reasoning with Scalable Reinforcement Learning](https://arxiv.org/abs/2507.01006). arXiv:2507.01006, 2025.
- Kimi Team. [Kimi K2.5: Visual Agentic Intelligence](https://arxiv.org/abs/2602.02276). arXiv:2602.02276, 2026.
- Qwen Team. [Qwen3-Omni Technical Report](https://arxiv.org/abs/2509.17765). arXiv:2509.17765, 2025.
- Alibaba Qwen. [Qwen3.5-Omni 官方发布博客](https://qwen.ai/blog?id=qwen3.5-omni). 2026-03-30.
- ZhipuAI. [GLM-5V-Turbo 官方文档](https://docs.bigmodel.cn/cn/guide/models/vlm/glm-5v-turbo). 2026-04-02.
- ZhipuAI. [GLM-V 开源仓库](https://github.com/zai-org/GLM-V). 2026.
