---
title: "2024-2025 大模型预训练数据前沿进展"
description: "从 FineWeb 到 DCLM，从合成数据到课程学习，系统梳理预训练数据领域的最新突破。"
date: 2026-03-19
category: 综合调研
tags: ["预训练数据", "FineWeb", "DCLM", "合成数据", "数据筛选"]
draft: false
---

## 引言

如果说 2023 年是大模型的 "Scaling 之年"，那么 2024-2025 年可以称为 "数据之年"。随着模型架构日趋收敛（Transformer + MoE），**预训练数据的质量和配方成为决定模型能力的最核心变量**。本文系统梳理这一领域的最新进展。

## 开源数据集的里程碑进展

### FineWeb：重新定义 Web 数据标准

HuggingFace 于 2024 年发布的 FineWeb 是近年最重要的开源预训练数据集之一。

**规模与来源**：
- 15T tokens（英文）
- 基于 96 个 Common Crawl snapshot（2013-2024）
- 经过系统性的多阶段清洗

**清洗流水线**：

```
CommonCrawl WARC → URL 过滤 → 语言识别(fastText)
    → 内容提取(trafilatura) → 行级过滤
    → 文档级过滤(质量分类器) → 模糊去重(MinHash)
    → 精确去重(suffix array) → FineWeb
```

FineWeb 的核心贡献不仅是数据集本身，更是**开源了完整的数据处理流水线 `datatrove`**，使得社区可以复现和改进。

### FineWeb-Edu：教育质量过滤

在 FineWeb 基础上，HuggingFace 训练了一个教育质量分类器，筛选出 1.3T tokens 的高教育价值数据。关键发现：

- 使用 LLaMA-3-70B-Instruct 标注约 500K 样本作为训练数据
- 分类器基于 Snowflake-arctic-embed（小模型，推理快）
- 只筛选得分 ≥ 3（满分 5）的文档
- **FineWeb-Edu 在多个 benchmark 上优于使用全量 FineWeb 训练的模型**

这一发现验证了一个重要假说：**数据质量 > 数据数量**，即使在预训练阶段也是如此。

### DCLM：数据驱动的基准体系

DCLM (DataComp for Language Models) 由 AllenAI 等机构联合推出，是第一个系统性的预训练数据基准。

**核心理念**：固定模型架构和训练配置，只改变数据，来公平比较不同数据策略的效果。

**关键实验结论**：

| 数据策略 | MMLU (7B, 1.6T tokens) | 相对提升 |
|----------|------------------------|----------|
| Raw CommonCrawl | 25.8% | baseline |
| + 基础过滤 (去重/语言) | 32.4% | +6.6% |
| + 质量分类器 | 43.7% | +17.9% |
| + fastText + 质量分类器 | 53.2% | +27.4% |
| DCLM-Baseline (最优组合) | 63.7% | +37.9% |

**最重要的发现**：模型驱动的质量过滤（而非基于规则的启发式过滤）带来最大的提升。

### Dolma v1.7

AllenAI 为 OLMo 系列模型准备的开源数据集，3T tokens 多源混合：

- Common Crawl: 2.8T tokens
- StarCoder (代码): 260B tokens
- Reddit: 89B tokens
- Wikipedia/Wikibooks: 4.6B tokens
- arXiv: 8B tokens
- 教科书 + StackExchange: 若干

Dolma 的价值在于**提供了完整的数据血缘追踪**，每个文档都可以追溯到来源和处理步骤。

## 数据质量评估方法论

### 质量评估的三个范式

**1. 基于规则的启发式 (Heuristic-based)**

```python
# C4 风格的规则
rules = {
    "min_words": 50,
    "max_word_length": 1000,
    "must_end_with_punctuation": True,
    "no_javascript": True,
    "no_lorem_ipsum": True,
    "min_stopword_ratio": 0.06,  # 英文 stopwords 占比
}
```

优点：快速、可解释、无需训练
缺点：粗粒度、难以捕捉语义质量

**2. 模型驱动的分类器 (Model-based)**

使用 LLM 或小模型对文本质量打分：

- **Perplexity 过滤**：用高质量语料训练的 LM 计算困惑度，保留低困惑度文本
- **质量分类器**：fine-tune 小模型（BERT/DeBERTa）做二分类或回归
- **LLM-as-Judge**：用大模型（如 GPT-4/LLaMA-70B）直接评分

2024 年的趋势是**级联方案**：先用规则和小模型粗筛，再用大模型精筛，平衡成本与质量。

**3. 数据影响力评估 (Influence-based)**

更精细但计算成本更高的方法：

- **DSIR (Data Selection via Importance Resampling)**：根据目标分布对源数据重采样
- **D4 (Data Distillation via Dataset Diversification)**：通过多样性优化选择训练子集
- **QuRating**：让 LLM 从 4 个维度（写作风格、事实性、教育价值、专业度）综合评分

### 去重策略的演进

去重是预训练数据处理中最关键的步骤之一。2024 年的主要进展：

**MinHash LSH 去重（主流方案）**

```
文档 → n-gram 分词 → MinHash 签名 → LSH 分桶 → 桶内精确比较 → 去重
```

参数选择的经验法则：
- n-gram size: 5（英文）/ 3（中文）
- MinHash 签名长度: 128-256
- LSH bands × rows: 9×13（阈值约 0.8）

**Suffix Array 精确去重**

FineWeb 使用 suffix array 做精确子串去重：
- 可以检测到跨文档的重复段落
- 计算成本较高，但去重质量最好
- 适合用在最终清洗阶段

**Semantic 去重（新兴方向）**

2024 年开始出现基于 embedding 相似度的语义去重：
- 使用 sentence-transformers 编码文档
- 在 embedding 空间做近邻搜索
- 可以检测到改写/翻译导致的近重复

但由于计算成本（需要对所有文档做推理），目前还不适合 10T+ 规模的数据集。

## 合成数据：补充而非替代

### 合成数据的分类

1. **知识增强型**：将知识库/教科书内容改写为更多样的文本
2. **能力增强型**：合成特定能力的训练数据（数学推理、代码生成）
3. **格式转换型**：将结构化数据转为自然语言
4. **数据增强型**：对现有数据做改写、翻译、扩展

### Phi 系列的经验

Microsoft 的 Phi 系列模型是合成数据应用最成功的案例之一：

- **Phi-1**：使用 GPT-3.5 合成的 "Textbooks Are All You Need" 代码数据
- **Phi-2**：混合合成教科书 + 筛选的 Web 数据
- **Phi-3**：大量合成数据 + 精选高质量真实数据

关键教训：
- 纯合成数据会导致**多样性不足**和**风格塌缩**
- 最优策略是**合成数据与真实数据按比例混合**
- 合成数据的质量上限取决于教师模型的能力

### 合成数据的风险

**Model Collapse 问题**

Shumailov et al. (2024) 证明，如果模型在自己生成的数据上持续训练，分布会逐渐退化：

```
真实数据分布 P₀ → 模型 M₁ → 合成数据 P₁ → 模型 M₂ → P₂ → ...
```

每一代合成数据都会丢失分布的尾部信息（低频但重要的知识），最终模型退化为只能生成高频模式。

**应对策略**：
1. 始终混入一定比例的真实数据
2. 控制合成数据在总训练数据中的比例（经验值 < 30%）
3. 使用多个不同的教师模型生成合成数据，增加多样性

## 多语言数据的挑战

### 语言分布的长尾问题

互联网上的语言分布极度不均：

| 语言 | Web 数据占比 | 全球人口占比 |
|------|-------------|-------------|
| 英语 | ~55% | ~17% |
| 中文 | ~5% | ~18% |
| 西班牙语 | ~5% | ~7% |
| 阿拉伯语 | ~1% | ~6% |
| 印地语 | ~0.1% | ~8% |

这导致低资源语言的模型性能显著落后。

### 中文预训练数据的特殊挑战

1. **编码问题**：中文网页经常包含 GBK/GB2312 编码，需要正确处理
2. **分词粒度**：n-gram 去重时，中文没有天然的词边界
3. **质量评估**：针对英文训练的质量分类器不能直接迁移
4. **繁简体处理**：繁体和简体是否应该统一？
5. **夹杂问题**：大量中英混合文本的处理策略

### 跨语言迁移

2024 年的一个重要发现是，**高质量英文数据的训练可以部分迁移到其他语言**。LLaMA-3 的实验显示，在英文数据上训练足够多的 tokens 后，即使未见过某些语言的数据，模型也能展现一定的该语言能力。

但这种迁移有上限——要获得原生级别的语言能力，仍需要足够量的目标语言数据。

## 课程学习 (Curriculum Learning)

### 数据排列顺序有影响吗？

传统做法是随机打乱所有数据进行训练。但 2024 年的多项研究表明，**训练数据的呈现顺序对最终模型质量有显著影响**。

### 数据课程的常见策略

**1. 质量递增 (Quality Annealing)**
- 训练早期使用大量一般质量数据（学习语法和通用模式）
- 训练后期逐渐增加高质量数据比例（精化知识和推理）
- MiniCPM 等模型验证了这一策略的有效性

**2. 领域渐进**
- 通用文本 → 学术/技术文本 → 代码/数学
- 从简单到复杂，从通用到专业

**3. 多语言排程**
- 先充分学习高资源语言
- 后期增加低资源语言的比例
- 避免早期低资源数据被高资源数据"冲掉"

### Data Mixing Laws

Yi (01.AI) 团队提出的 Data Mixing Laws 是 2024 年的重要工作：

$$L(\{p_i\}) = \sum_i c_i \cdot p_i^{-\alpha_i} + \sum_{i \neq j} d_{ij} \cdot p_i^{\beta_i} \cdot p_j^{\beta_j}$$

其中 $p_i$ 是各数据源的占比。这个公式的关键意义在于：**它表明不同数据源之间存在交互效应**——代码数据的增加可能同时提升数学推理能力。

## 工程实践趋势

### 数据飞轮 (Data Flywheel)

2024 年头部实验室的标准做法已经变成了一个持续迭代的飞轮：

```
数据收集 → 清洗过滤 → 训练模型 → 用模型评估数据质量
    ↓                                      ↓
更好的过滤器 ← 更好的质量标注 ← 更好的模型
```

每一轮迭代产生的模型都可以作为下一轮数据筛选的评判者，质量螺旋上升。

### 数据治理与合规

- **数据溯源 (Provenance)**：记录每条数据的来源、处理步骤、授权状态
- **PII 检测与脱敏**：自动检测并移除个人隐私信息
- **版权过滤**：移除受版权保护的内容（书籍、论文全文等）
- **去偏 (Debiasing)**：减少训练数据中的社会偏见

### 核心工具链

| 工具 | 用途 | 特点 |
|------|------|------|
| datatrove | 端到端数据处理 | HuggingFace 出品，FineWeb 的官方工具 |
| dolma-toolkit | 数据处理 | AllenAI 出品，支持数据血缘 |
| RedPajama-Data | 数据复现 | Together AI，复现 LLaMA 训练数据 |
| text-dedup | 去重 | 支持 MinHash/SimHash/Suffix Array |
| fastText | 语言识别 | 快速准确的语言检测 |
| trafilatura | 内容提取 | Web 页面正文提取 |

## 展望与思考

1. **Token 危机是否真实存在？** Epochai 估算高质量英文文本约 9T tokens，到 2026 年可能被用完。但合成数据和多模态数据可能缓解这一问题。

2. **数据质量的上限在哪？** 如果把维基百科级别的数据无限复制，模型是否会超过用 10× CommonCrawl 训练的模型？目前的证据倾向于 "质量有上限，需要搭配多样性"。

3. **数据评估会成为独立赛道吗？** 类似于 MLOps，"DataOps for LLM" 可能成为一个新兴领域。

## 参考文献

1. The FineWeb Datasets: Decanting the Web for the Finest Text Data at Scale (2024)
2. DataComp-LM: In search of the next generation of training sets for language models (2024)
3. Dolma: an Open Corpus of Three Trillion Tokens for Language Model Pretraining Research (2024)
4. Scaling Data-Constrained Language Models (2023)
5. The Curse of Recursion: Training on Generated Data Makes Models Forget (2024)
6. Data Mixing Laws (Yi Technical Report, 2024)
7. Textbooks Are All You Need (2023)
