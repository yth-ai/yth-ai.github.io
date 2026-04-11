---
title: "2026 预训练数据全景：开源语料、版权博弈与中训练新范式"
description: "全面梳理当前可用的开源预训练数据集，分析版权合规趋势，以及中训练阶段数据选择的最佳实践"
date: 2026-03-12
series: "数据工程观察"
volume: 2
tags: ["开源数据", "版权合规", "中训练", "数据配比", "Benchmark"]
---

## 本期主题：2026 年预训练数据格局全盘点

随着 NYT v. OpenAI 等版权诉讼进入判决阶段，预训练数据的法律合规性不再是可选项。同时，中训练（Mid-training / Continual Pretraining）正在从"实验性技术"走向"标准流程"。本期做一个全面的盘点。

---

## 一、开源预训练数据集全景图 (2026 Q1)

### 通用 Web 语料

| 数据集 | 规模 | 特点 | 许可证 | 推荐指数 |
|--------|------|------|--------|----------|
| **[FineWeb](https://huggingface.co/datasets/HuggingFaceFW/fineweb)** | 15T tokens | HuggingFace 出品，质量过滤最成熟 | ODC-BY | ★★★★★ |
| **[FineWeb-Edu](https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu)** | 1.3T tokens | 教育内容子集，高质量 | ODC-BY | ★★★★★ |
| **[DCLM-Baseline](https://github.com/mlfoundations/dclm)** | 4T tokens | Apple/DataComp 出品，可复现 | Apache 2.0 | ★★★★☆ |
| **[RedPajama v2](https://huggingface.co/datasets/togethercomputer/RedPajama-Data-V2)** | 30T tokens | 最大规模，但质量参差 | Apache 2.0 | ★★★☆☆ |
| **[MixtureVitae](https://github.com/ontocord/mixturevitae)** | 8T tokens | 版权合规优先 | Apache 2.0 | ★★★★☆ |
| **[Dolma v1.7](https://huggingface.co/datasets/allenai/dolma)** | 3T tokens | Allen AI 出品，学术友好 | AI2 ImpACT | ★★★★☆ |
| **[The Pile v2](https://huggingface.co/datasets/EleutherAI/the_pile_deduplicated)** | 1.2T tokens | EleutherAI 经典，多样性好 | MIT | ★★★☆☆ |

### 代码数据

| 数据集 | 规模 | 特点 | 许可证 |
|--------|------|------|--------|
| **The Stack v3** | 900B tokens | BigCode 出品，67 种语言，许可证过滤 | 各文件原许可证 |
| **StarCoder Data v3** | 900B tokens | 去污染增强版 | Apache 2.0 |
| **CodeParrot Clean** | 50B tokens | 小规模但质量极高 | Apache 2.0 |

### 数学与推理

| 数据集 | 规模 | 特点 |
|--------|------|------|
| **OpenWebMath** | 15B tokens | 网页数学内容提取 |
| **Proof-Pile-2** | 50B tokens | 数学证明和 LaTeX 文档 |
| **MathPile** | 10B tokens | 高质量数学教材 |
| **AutoMathText** | 200B tokens | 自动标注的数学相关文本 |

### 多语言

| 数据集 | 规模 | 语言数 | 特点 |
|--------|------|--------|------|
| **[CulturaX](https://huggingface.co/datasets/uonlp/CulturaX)** | 6.3T tokens | 167 | mC4 + OSCAR 清洗 |
| **[MADLAD-400](https://huggingface.co/datasets/allenai/MADLAD-400)** | 5T tokens | 419 | Google 出品，覆盖面最广 |
| **[CC-100](https://huggingface.co/datasets/statmt/cc100)** | 2.5T tokens | 100 | 经典多语言基线 |

---

## 二、版权合规趋势

### 关键法律动态

1. **NYT v. OpenAI** — 预计 2026 年中期判决，如果原告胜诉，可能重新定义 "fair use" 在 AI 训练场景的适用范围
2. **EU AI Act 数据透明要求** — 2026 年 8 月起，在 EU 市场提供的 AI 模型必须披露训练数据来源摘要
3. **日本明确 AI 训练合法** — 日本 2024 年通过的版权法修正案确认 AI 训练使用属于合理使用，成为最友好的管辖区

### 版权合规数据策略

```
合规性高 ─────────────────── 合规性低
│                                    │
│ Public Domain   CC-BY     CC-BY-SA │ Fair Use (争议中)
│ Wikipedia       arXiv     GitHub   │ News sites
│ Gutenberg       Pile-CC   Reddit   │ Copyrighted books
│ US Gov docs     Stack v3           │ Paywalled content
│                                    │
└── 推荐优先使用 ──────── 谨慎使用 ──┘
```

**建议**：
- 新项目建议以 FineWeb + The Stack v3 为基础，补充 permissive 许可的专业数据
- 保留完整的数据溯源记录（data provenance），包括每个文档的来源 URL 和许可证信息
- 实施 opt-out 机制，尊重内容创作者的选择

---

## 三、中训练数据选择最佳实践

中训练是介于预训练和后训练之间的阶段，通常用于领域适应或能力增强。以下是基于最新研究的实践指南。

### 3.1 何时需要中训练？

| 场景 | 是否需要中训练 | 说明 |
|------|--------------|------|
| 通用 chatbot | 通常不需要 | 直接后训练即可 |
| 医学/法律/金融专业模型 | **强烈推荐** | 专业知识注入 |
| 代码能力增强 | **推荐** | [DeepSeek](https://www.deepseek.com/) 的实践已验证有效 |
| 多语言能力增强 | **推荐** | 对低资源语言效果显著 |
| 长上下文适配 | **推荐** | 逐步扩展上下文窗口 |
| 时效性知识更新 | 视情况 | 小规模更新可以用 RAG 替代 |

### 3.2 中训练数据配比原则

根据 NeurIPS 2025 Workshop 论文 "Midtraining Bridges Pretraining and Posttraining" 的结论，中训练数据配比遵循以下原则：

**原则 1：保留预训练分布的"锚点"**

$$
D_{mid} = \alpha \cdot D_{domain} + (1-\alpha) \cdot D_{replay}
$$

其中 $D_{replay}$ 是预训练数据的子集，用于对抗灾难性遗忘。推荐 $\alpha \in [0.3, 0.6]$。

**原则 2：渐进式领域浓度**

不要一步到位，而是分阶段逐步提高领域数据浓度：

```
Phase 1 (warm-up):    20% domain + 80% general  → 10% total tokens
Phase 2 (adaptation): 40% domain + 60% general  → 60% total tokens  
Phase 3 (deepening):  60% domain + 40% general  → 30% total tokens
```

**原则 3：学习率调度要配合**

- 中训练起始学习率 = 预训练末期学习率的 50-100%（不要 warm-up 到更高）
- 使用 cosine decay，decay 到起始 LR 的 10%
- 如果观察到遗忘加剧，降低学习率并增加 replay 数据比例

### 3.3 遗忘监控指标

中训练过程中必须持续监控以下指标：

| 指标 | 计算方式 | 报警阈值 |
|------|---------|---------|
| **通用 PPL 偏移** | 在 C4 验证集上的 perplexity 变化 | > 5% 上升 |
| **[MMLU](https://huggingface.co/datasets/cais/mmlu) 分数** | 每 1000 步评估 | > 2% 下降 |
| **[HumanEval](https://github.com/openai/human-eval)** | 代码生成能力 | > 3% 下降 |
| **领域 PPL** | 在目标领域验证集上的 perplexity | 应持续下降 |
| **领域 Benchmark** | 领域特定评测 | 应持续上升 |

---

## 四、新 Benchmark 追踪

本月值得关注的新评测基准：

### HELMET (Holistic Evaluation of LLM Evaluation Toolkits)

- **发布方**：Stanford CRFM
- **核心价值**：对现有 LLM 评测工具进行"元评估"，发现不同评测框架对同一模型的排名差异高达 30%
- **启示**：做评测时不要只看一个 leaderboard，至少用 2-3 个独立评测框架交叉验证

### MEGA-Bench v2

- **发布方**：Berkeley AI Research
- **核心价值**：覆盖 500+ 真实世界任务的综合评测，每个任务都有人类基线对比
- **启示**：相比 MMLU 等选择题 benchmark，基于真实任务的评测更能反映模型的实用价值

### [DataComp-LM v2](https://www.datacomp.ai/)

- **发布方**：[DataComp 联盟](https://www.datacomp.ai/)
- **核心价值**：标准化的预训练数据质量评测——固定模型架构和训练流程，只比数据
- **启示**：终于有了一个公平比较不同数据策略的竞技场，建议所有数据团队参与

---

## 本期思考

> **中训练正在成为大模型开发的"第三支柱"。** 过去，模型开发是"预训练 → 后训练"两步走。但随着开源基座模型的成熟，越来越多的团队选择"拿开源基座 → 中训练领域适配 → 后训练对齐"三步走。这种范式转变意味着，**你不一定需要从零训练一个大模型，但你必须有高质量的领域数据和中训练能力。** 数据工程的重要性只增不减。

---

*下期预告：Token 级别数据质量评估 + Domain-Adaptive Pretraining 的工程细节*
