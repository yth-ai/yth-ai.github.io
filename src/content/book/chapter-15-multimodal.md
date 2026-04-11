---
title: "多模态大模型"
description: "从文本到视觉到语音——理解和生成多种模态的统一架构"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 15
part: "第五部分：前沿与展望"
partOrder: 5
tags: ["多模态", "Vision-Language", "视觉编码器", "语音", "视频"]
---

## 从语言到多模态

人类的智能本质上是多模态的——我们同时通过视觉、听觉、触觉理解世界。纯文本 LLM 只利用了"语言"这一种信息源，而真实世界的信息远不止文本。

多模态大模型（Multimodal Large Language Models, MLLMs）的目标是构建能够**理解和生成**多种模态信息的统一模型：

```
输入模态:
├── 文本 (Text)
├── 图像 (Image)
├── 视频 (Video)
├── 音频/语音 (Audio/Speech)
└── 结构化数据 (Table/Code/...)

输出模态:
├── 文本 (Text)
├── 图像 (Image generation)
├── 语音 (Speech synthesis)
└── 行动 (Action, for agents)
```

## 架构范式

### 范式一：LLM + 外部编码器

这是目前最主流的架构——**保持 LLM 不变，通过适配器接入其他模态的编码器**。

```
图像 → [视觉编码器] → [投影层] ─┐
                                 ├── [LLM] → 文本输出
文本 → [Tokenizer] ─────────────┘
```

代表作：

| 模型 | 视觉编码器 | LLM | 投影方式 |
|------|-----------|-----|---------|
| [LLaVA](https://arxiv.org/abs/2304.08485) | CLIP ViT-L | Vicuna/LLaMA | 线性投影 |
| [LLaVA-1.5](https://arxiv.org/abs/2310.03744) | CLIP ViT-L | Vicuna | MLP 投影 |
| [InternVL](https://arxiv.org/abs/2312.14238) | InternViT-6B | InternLM | QLLaMA |
| [Qwen-VL](https://arxiv.org/abs/2308.12966) | ViT-bigG | Qwen-7B | Cross-attention |

### 范式二：Early Fusion（原生多模态）

将不同模态的 token 在**输入层就混合**，用同一个 Transformer 处理所有模态：

```
[图像 patch tokens] [文本 tokens] [音频 tokens]
        ↓                ↓              ↓
  统一的 Transformer（共享参数）
        ↓
    多模态输出
```

代表作：

| 模型 | 方式 | 特点 |
|------|------|------|
| [Fuyu](https://www.adept.ai/blog/fuyu-8b) | 图像 patch 直接线性投影 | 无需单独的视觉编码器 |
| [Gemini](https://arxiv.org/abs/2312.11805) | 原生多模态训练 | 从预训练就混合多模态数据 |
| [GPT-4o](https://openai.com/index/hello-gpt-4o/) | 统一模态 | 文本/视觉/语音原生融合 |
| [Chameleon](https://arxiv.org/abs/2405.09818) | 所有模态 tokenize | 离散 token 统一建模 |

**Early Fusion vs. Late Fusion 对比**：

| 维度 | Early Fusion | Late Fusion（编码器 + LLM） |
|------|-------------|--------------------------|
| 跨模态理解 | 更深入 | 受限于投影层 |
| 训练成本 | 极高（需多模态预训练） | 较低（冻结 LLM + 训练适配器） |
| 灵活性 | 需重新预训练 | 可热插拔编码器 |
| 数据需求 | 海量多模态数据 | 百万级图文对即可 |

## 视觉编码器

### CLIP（Contrastive Language-Image Pre-training）

[CLIP](https://arxiv.org/abs/2103.00020)（Radford et al., 2021, OpenAI）是多模态模型的基石——通过对比学习将图像和文本映射到共享的向量空间：

$$\mathcal{L}_{\text{CLIP}} = -\frac{1}{N} \sum_{i=1}^{N} \left[ \log \frac{\exp(\text{sim}(I_i, T_i) / \tau)}{\sum_{j=1}^{N} \exp(\text{sim}(I_i, T_j) / \tau)} \right]$$

CLIP ViT-L/14@336px 是最常用的视觉编码器，输出 576 个 visual tokens（每个 1024 维）。

### SigLIP

[SigLIP](https://arxiv.org/abs/2303.15343)（Zhai et al., 2023, Google）改进了 CLIP 的训练效率：

- 用 sigmoid loss 替代 softmax loss，不需要全局 batch 内的负样本
- 允许更大的 batch size 和更好的扩展性
- 被 PaLI、Gemma 等 Google 系模型采用

### 视觉 Token 压缩

576 个 visual tokens 对 LLM 来说太多了（特别是多图/高分辨率场景）。压缩方法：

| 方法 | 思路 | 压缩比 |
|------|------|--------|
| Spatial pooling | 2x2 平均池化 | 4x |
| [Perceiver Resampler](https://arxiv.org/abs/2204.14198) | 用可学习 query 做交叉注意力 | 可变 |
| [C-Abstractor](https://arxiv.org/abs/2401.06209) | 卷积 + 自适应池化 | 可变 |
| Dynamic resolution | 根据图像复杂度动态调整 | 自适应 |

## 视觉语言训练流程

### 阶段一：预训练对齐（Alignment Pre-training）

用大量**图文对**训练投影层，让视觉编码器的输出与 LLM 的输入空间对齐：

```
数据: 图文对 (LAION-5B, CC3M, CC12M, etc.)
冻结: 视觉编码器 + LLM
训练: 只训练投影层 (MLP)
目标: 下一个 token 预测 (图像作为前缀)
```

### 阶段二：指令微调（Visual Instruction Tuning）

用高质量的视觉问答/对话数据微调整个模型：

```
数据: 视觉指令数据 (LLaVA-Instruct-150K, ShareGPT4V, etc.)
冻结: 视觉编码器（或也微调）
训练: 投影层 + LLM
目标: 视觉指令跟随
```

### 关键数据集

| 数据集 | 规模 | 类型 | 用途 |
|--------|------|------|------|
| [LAION-5B](https://laion.ai/blog/laion-5b/) | 5.85B 图文对 | 网页爬取 | 预训练 |
| [ShareGPT4V](https://arxiv.org/abs/2311.12793) | 1.2M | GPT-4V 标注 | 高质量指令微调 |
| [LLaVA-Instruct](https://llava-vl.github.io/) | 150K+ | GPT-4 生成 | 视觉对话 |
| [TextVQA](https://textvqa.org/) | 45K | 图中文字理解 | OCR 评估 |
| [DocVQA](https://www.docvqa.org/) | 50K | 文档理解 | 文档问答 |
| [MMMU](https://arxiv.org/abs/2311.16502) | 11.5K | 多学科大学题 | 综合评估 |

## 高分辨率处理

标准 CLIP ViT 只能处理 224×224 或 336×336 的图像，远不够实际使用。高分辨率方法：

### 动态分辨率切片

将高分辨率图像切成多个 patch，每个 patch 独立编码，再拼接：

```
原图 (1344×896)
  ↓ 切片
[patch_1] [patch_2] [patch_3]
[patch_4] [patch_5] [patch_6]
  ↓ 每个 patch 独立编码
[tokens_1] [tokens_2] ... [tokens_6] + [全局缩略图 tokens]
  ↓ 拼接
总共 576×7 = 4032 visual tokens
```

[LLaVA-NeXT](https://arxiv.org/abs/2401.06209) 和 [InternVL 1.5](https://arxiv.org/abs/2404.16821) 都使用类似方法，支持任意分辨率和纵横比。

## 视频理解

视频理解面临两个核心挑战：**时序建模**和**token 爆炸**。

### 帧采样策略

```
均匀采样: 从 N 帧中等间隔抽取 K 帧（最简单，常用）
关键帧提取: 基于场景变化检测选取关键帧
时间池化: 在时间维度上池化视觉 tokens
```

### 代表模型

| 模型 | 方法 | 最大帧数 |
|------|------|---------|
| [Video-LLaVA](https://arxiv.org/abs/2311.10122) | 均匀采样 + 投影 | 8 帧 |
| [LLaVA-Video](https://arxiv.org/abs/2501.00599) | SlowFast 采样 | 64+ 帧 |
| [Qwen2-VL](https://arxiv.org/abs/2409.12191) | 动态分辨率 + 时间编码 | 视频长度 |
| [Gemini 1.5 Pro](https://arxiv.org/abs/2403.05530) | 原生长上下文 | 1小时+ 视频 |

## 语音多模态

### 语音理解

将语音编码器接入 LLM，实现语音指令理解：

```
语音 → [Whisper 编码器] → [适配器] → LLM → 文本回复
```

[Whisper](https://arxiv.org/abs/2212.04356)（Radford et al., 2022, OpenAI）是最常用的语音编码器，支持多语言语音识别和翻译。

### 语音生成

端到端的语音生成（不经过 TTS）：

| 模型 | 方法 | 特点 |
|------|------|------|
| [GPT-4o](https://openai.com/index/hello-gpt-4o/) | 原生语音 token | 实时对话，保留情感和语调 |
| [VALL-E](https://arxiv.org/abs/2301.02111) | 语音作为 token 序列 | 3 秒 prompt 克隆声音 |
| [GLM-4-Voice](https://arxiv.org/abs/2412.02612) | 端到端语音对话 | 中英文 |

### 全模态 (Omni) 模型

真正的"全模态"模型能够在一个统一框架中处理所有模态的输入和输出：

```
Any-to-Any 模型:
├── 输入: 文本 + 图像 + 语音 + 视频
├── 处理: 统一 Transformer
└── 输出: 文本 + 图像 + 语音
```

[GPT-4o](https://openai.com/index/hello-gpt-4o/) 是这一方向的里程碑——同一个模型原生支持文本/视觉/语音的输入和输出，延迟低到可以实时对话。

## 多模态评估

### 视觉语言 Benchmark

| Benchmark | 任务 | 特点 |
|-----------|------|------|
| [MMMU](https://arxiv.org/abs/2311.16502) | 多学科大学题 | 最权威的综合评估 |
| [MMBench](https://arxiv.org/abs/2307.06281) | 20+ 能力维度 | 细粒度评估 |
| [SEED-Bench](https://arxiv.org/abs/2307.16125) | 图像 + 视频 | 多维感知理解 |
| [RealWorldQA](https://huggingface.co/datasets/xai-org/RealWorldQA) | 真实场景问答 | 实用性评估 |
| [ChartQA](https://arxiv.org/abs/2203.10244) | 图表理解 | 数据可视化理解 |
| [OCRBench](https://arxiv.org/abs/2305.07895) | OCR 能力 | 文字识别与理解 |

### Vision Arena

类似文本的 Chatbot Arena，[Vision Arena](https://huggingface.co/spaces/WildVision/vision-arena) 让用户用图像 + 文本提问，盲评两个模型的回复。

## 前沿方向

### 1. 统一生成模型

不仅理解多模态，还能**生成**多种模态：

- **图像生成**：[Emu](https://arxiv.org/abs/2307.05222)、[DALL-E 3](https://openai.com/dall-e-3)、[Janus](https://arxiv.org/abs/2410.13848)
- **视频生成**：[Sora](https://openai.com/sora)、[Kling](https://klingai.com/)、[Veo](https://deepmind.google/technologies/veo/)
- **3D 生成**：从图像/文本生成 3D 模型

### 2. World Models

将多模态理解与物理世界建模结合：

- 预测视频中物体的运动轨迹
- 理解因果关系（推倒积木→积木散落）
- 为机器人提供世界理解

### 3. 实时多模态交互

GPT-4o 开创的方向——毫秒级延迟的多模态实时对话：

```
用户: [语音] "帮我看看这道数学题"
      [图片] 📷 手写数学题
模型: [语音] "这是一道二次方程，让我帮你解..."
      [图片] 📝 解题步骤
```

## 章节小结

1. **多模态是 LLM 的必经之路**——纯文本模型只利用了人类信息的冰山一角
2. **LLM + 外部编码器**是目前最实用的范式，Early Fusion 是长期方向
3. **CLIP/SigLIP** 是视觉编码的基石，高分辨率处理是关键挑战
4. **语音多模态**正在从"文本中转"走向端到端原生处理
5. **全模态 (Omni) 模型**是终极目标——一个模型理解和生成所有模态
