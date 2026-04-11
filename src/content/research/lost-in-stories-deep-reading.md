---
title: "Lost in Stories 精读报告"
description: "探讨 LLM 在长篇叙事理解中的信息丢失与追踪能力"
date: 2026-03-12
category: 论文精读
tags: ["长文本理解", "叙事追踪", "LLM 评测"]
draft: false
---
# Lost in Stories: Consistency Bugs in Long Story Generation by LLMs 精读

> **PAPER DEEP READING / Microsoft + SUTD / 2026-03-06**

当讲故事的人忘记了自己的故事 — 这篇来自 Microsoft 和新加坡科技设计大学的论文，首次系统性地研究了 LLM 在长篇故事生成中的**一致性 Bug**，提出了 ConStory-Bench 基准和 ConStory-Checker 自动检测管道。

| 指标 | 数值 |
|------|------|
| 基准规模 | **2,000 个 prompt** |
| 任务场景 | **4 种** (Generation / Continuation / Expansion / Completion) |
| 错误分类 | **5 大类 + 19 个子类型** |
| 评估模型数 | **30+ 模型**（闭源 + 开源 + 能力增强 + Agent） |
| 目标生成长度 | **8,000–10,000 words** |
| 检测管道 | **4 阶段 LLM-as-Judge** (o4-mini) |
| 评估指标 | **CED** (Consistency Error Density) + **GRR** (Group Relative Rank) |
| 最佳模型 | **GPT-5-Reasoning** (CED: 0.113, GRR: 3.05) |
| 最差模型 | **MiniMax-M1-80k** (CED: 3.447) / **LongAlign-13B** (CED: 3.664) |
| 验证 F1 | **0.678** (ConStory-Checker vs. 人类专家 0.229) |

---

## 目录

1. [论文概览](#一论文概览)
2. [ConStory-Bench: 基准设计](#二constory-bench-基准设计)
3. [一致性错误分类法](#三一致性错误分类法)
4. [ConStory-Checker: 自动检测管道](#四constory-checker-自动检测管道)
5. [评估指标设计](#五评估指标设计)
6. [RQ1: 模型一致性表现排名](#六rq1-模型一致性表现排名)
7. [RQ2: 错误与输出长度的关系](#七rq2-错误与输出长度的关系)
8. [RQ3: Token 熵与错误的关联](#八rq3-token-熵与错误的关联)
9. [RQ4: 错误类型共现模式](#九rq4-错误类型共现模式)
10. [RQ5: 错误在叙事中的位置分布](#十rq5-错误在叙事中的位置分布)
11. [核心洞察与启示](#十一核心洞察与启示)

---

## 一、论文概览

### 1.1 基本信息

| 项目 | 内容 |
|------|------|
| **标题** | Lost in Stories: Consistency Bugs in Long Story Generation by LLMs |
| **机构** | **Microsoft (北京)** + **Singapore University of Technology and Design** |
| **作者** | Junjie Li, Xinrui Guo, Yuhao Wu, Roy Ka-Wei Lee, Hongzhi Li, Yutao Xie |
| **arXiv** | 2603.05890 |
| **发布时间** | 2026 年 3 月 6 日 |
| **项目页** | https://picrew.github.io/constory-bench.github.io/ |

### 1.2 核心问题

> 📜 **原文**: "What happens when a storyteller forgets its own story? Large Language Models (LLMs) can now generate narratives spanning tens of thousands of words, but they often fail to maintain consistency throughout. When generating long-form narratives, these models can contradict their own established facts, character traits, and world rules."

现有故事生成基准（如 HelloBench、WritingBench）主要关注**情节质量和流畅度**，对一致性错误几乎没有系统性评估。论文用一个生动的例子说明问题：故事开头描述 5 岁的 Jamie，但几段之后 Mara 却对司机说"能帮帮我 15 岁的儿子吗？"——年龄从 5 岁跳到 15 岁，这就是典型的一致性 Bug。

### 1.3 核心贡献

论文提出三大贡献：

1. **ConStory-Bench**：首个专门评估长篇叙事一致性的基准，包含 2,000 个 prompt、4 种任务场景和 5 大类 19 细分的错误分类法。
2. **ConStory-Checker**：4 阶段自动化评估管道，不仅检测矛盾，还为每个判断提供明确的文本证据链。
3. **五个研究问题的系统分析**：覆盖模型排名、长度-错误关系、熵-错误关联、错误共现模式和叙事位置分布。

### 1.4 五个研究问题

论文围绕 5 个 RQ 展开实验：

- **RQ1**: 不同 LLM 在超长文本生成中维持叙事一致性的能力有多强？不同模型的错误类型分布是否相似？
- **RQ2**: 一致性错误如何随输出长度增长？不同架构的模型有何差异？
- **RQ3**: 什么底层因素导致一致性错误的产生？是否存在可靠的预测信号？
- **RQ4**: 不同类型的一致性错误是系统性共现，还是独立发生？
- **RQ5**: 一致性错误在长篇叙事中的位置分布规律是什么？

---

## 二、ConStory-Bench: 基准设计

### 2.1 数据来源与构建流程

ConStory-Bench 的 prompt 来源于 **WikiPlots**（一个收集自 Wikipedia 的故事情节数据集）。构建流程为：

1. **任务改写**：使用 **o4-mini** 将每个故事改写为对应任务类型的 prompt，保留原始叙事要素，同时约束目标生成长度为 **8,000–10,000 words**。
2. **质量控制**：(i) **MinHash 去重**去除近重复 prompt；(ii) 人工审核 + 自动启发式过滤低质量或平凡样例。
3. 最终获得 **2,000 个高质量 prompt**。

### 2.2 四种任务场景

| 任务类型 | 数量 | 占比 | 说明 |
|----------|------|------|------|
| **Generation** | 751 | 37.5% | 从极简情节设定出发，自由生成完整叙事 |
| **Continuation** | 432 | 21.6% | 续写给定的故事开头片段 |
| **Expansion** | 422 | 21.1% | 将简洁但相对完整的大纲扩展为长篇故事 |
| **Completion** | 395 | 19.8% | 给定首尾、补全中间情节 |

> 📜 **原文**: "Generation involves producing free-form narratives from minimal plot setups, where consistent characters, rules, and causal chains must be instantiated without prior context."

四种任务设计的核心逻辑：**Generation** 最难——没有先验上下文，模型必须自行建立并维护所有一致性约束；**Continuation** 有部分上下文锚定；**Expansion** 有完整大纲骨架；**Completion** 首尾固定，约束最强。

---

## 三、一致性错误分类法

### 3.1 五大类 + 十九子类

> 📜 **原文**: "The taxonomy comprises five top-level categories and 19 fine-grained error types, encompassing contradictions that emerge across temporal logic, character memory, world-building rules, factual details, and narrative style."

| 大类 | 子类型 | 含义 |
|------|--------|------|
| **Timeline & Plot Logic** | Absolute Time Contradictions | 绝对时间矛盾（如"1982年12月"变成"1985年"） |
| | Duration Contradictions | 持续时间矛盾（"三天旅程"变成"一周"） |
| | Simultaneity Contradictions | 同时性矛盾（不可能同时发生的事件） |
| | Causeless Effects | 无因之果（结果缺乏因果前提） |
| | Causal Logic Violations | 因果逻辑违反（因果链断裂） |
| | Abandoned Plot Elements | 遗弃的情节线索（引入但从未解决的情节） |
| **Characterization** | Memory Contradictions | 记忆矛盾（角色忘记已建立的关系/经历） |
| | Knowledge Contradictions | 知识矛盾（角色展示超出背景设定的知识） |
| | Skill Fluctuations | 能力波动（角色能力无解释地剧变） |
| | Forgotten Abilities | 遗忘的能力（角色不使用已建立的能力） |
| **World-building & Setting** | Core Rules Violations | 核心规则违反（违背世界观的基本设定） |
| | Social Norms Violations | 社会规范违反（不符合故事世界的社会规则） |
| | Geographical Contradictions | 地理矛盾（地点描述前后不一） |
| **Factual & Detail Consistency** | Appearance Mismatches | 外貌不匹配（角色外貌描述变化） |
| | Nomenclature Confusions | 命名混淆（人名/地名/称谓前后不一） |
| | Quantitative Mismatches | 数量不匹配（数字、年龄、日期矛盾） |
| **Narrative & Style** | Perspective Confusions | 视角混淆（如第一人称突然变第三人称） |
| | Tone Inconsistencies | 语调不一致（风格基调突变） |
| | Style Shifts | 风格偏移（写作风格无故变化） |

### 3.2 分类法的设计依据

分类法**基于叙事理论和先前故事理解研究**（Ismayilzada et al., 2024; Xie et al., 2023），涵盖了叙事一致性的五个维度。关键设计原则：

- **层次化**：5 大类覆盖宏观维度，19 子类提供细粒度检测目标
- **可操作化**：每个子类都有明确的检测指南（"Look for" 列表）和标准化的 JSON 输出格式
- **互补不重叠**：五个维度分别针对时间线、角色、世界观、事实细节和叙事风格

---

## 四、ConStory-Checker: 自动检测管道

### 4.1 四阶段管道架构

> 📜 **原文**: "We introduce CONSTORY-CHECKER, an automated LLM-as-judge pipeline for scalable and auditable consistency evaluation."

**Stage 1: Category-Guided Extraction（分类引导提取）**
- 使用五个维度的**专属 prompt** 扫描叙事文本
- 每个维度有详细的"EXTRACTION CATEGORIES"定义和"Look for"指南
- 提取可能存在矛盾的文本片段

**Stage 2: Contradiction Pairing（矛盾配对）**
- 将提取的片段进行**成对比较**
- 分类为 *Consistent* 或 *Contradictory*
- 借鉴 CheckEval 和 ProxyQA 的方法论，有效降低假阳性

**Stage 3: Evidence Chains（证据链构建）**
- 对每个确认的矛盾，记录三要素：
  - **Reasoning**：为什么这两段文本不能同时为真
  - **Evidence**：引用原文并标注位置
  - **Conclusion**：错误类型标签

**Stage 4: JSON Reports（标准化 JSON 输出）**
- 生成结构化 JSON 报告
- 包含：引文(fact_quote)、位置(location)、矛盾对(contradiction_pair)、错误类别(error_category)、上下文解释(context)
- 所有判断锚定到**精确的字符级偏移量**

### 4.2 评估模型选择

> 📜 **原文**: "We adopt o4-mini as the evaluation model to balance accuracy and efficiency; recent studies confirm strong LLM performance on structured judgment tasks."

### 4.3 验证结果：ConStory-Checker 大幅超越人类专家

论文构建了一个**诊断数据集**来验证管道效果：使用 Qwen3-235B-A22B-Thinking 生成 200 个故事，刻意植入 **1,000 个一致性错误**（每个维度 200 个），然后对比 ConStory-Checker 和人类专家的检测能力。

| 指标 | ConStory-Checker | 人类专家 (Avg) |
|------|:---:|:---:|
| **预测总数** | 622 | 210 |
| **True Positive** | 550 | 138.5 |
| **Recall** | **0.550** | 0.139 |
| **Precision** | **0.884** | 0.660 |
| **F1** | **0.678** | 0.229 |

各维度 F1 对比：
- Character Consistency: **0.742** vs 0.379
- Factual Accuracy: **0.718** vs 0.124
- Narrative Coherence: **0.507** vs 0.153
- Temporal Logic: **0.692** vs 0.281
- World Consistency: **0.702** vs 0.159

> 💡 **关键发现**: ConStory-Checker 在所有五个维度上都远超人类专家，F1 高出 **2.96 倍** (0.678 vs 0.229)。这不是因为人类不擅长判断，而是人类在万字长文中容易遗漏错误（Recall 仅 0.139），而自动管道能系统性扫描全文。

---

## 五、评估指标设计

### 5.1 Consistency Error Density (CED)

> 📜 **原文**: "Simply counting errors per story unfairly penalizes models that generate longer outputs—a 10K-word story intuitively would have more opportunities for errors than a 2K-word one."

$$\text{CED}_{m,i} = \frac{e_{m,i}}{w_{m,i} / 10000}$$

其中 $e_{m,i}$ 是错误数，$w_{m,i}$ 是字数。模型级 CED 为所有故事的平均值（越低越好）。

**设计动机**：直接计数不公平，因为 10K 词的故事天然比 2K 词的故事有更多出错机会。CED 通过按每万字归一化解决这一问题。

### 5.2 Group Relative Rank (GRR)

CED 仍有缺陷：不同 prompt 的固有难度不同。GRR 通过在**同一 prompt 组内排名**来解决：

$$Q_{m,i} = \frac{w_{m,i}}{1 + e_{m,i}}$$

$$\text{GRR}_m = \frac{1}{N_m} \sum_{i \in I_m} \text{rank}_i(Q_{m,i})$$

> 💡 **互补设计巧妙**：CED 衡量绝对错误密度，但无法区分"0 错误写了 8000 字"和"0 错误只写了 800 字"；GRR 通过 $Q$ 分数同时考虑一致性和完整性，提供相对排名。

---

## 六、RQ1: 模型一致性表现排名

### 6.1 主结果表

| 模型 | CED ↓ | GRR ↓ | Char. | Fact. | Narr. | Time. | World | Avg Words | Errors |
|------|-------|-------|-------|-------|-------|-------|-------|-----------|--------|
| **GPT-5-Reasoning** | **0.113** | **3.05** | 0.005 | 0.061 | 0.003 | 0.024 | 0.003 | 9050 | 0.09 |
| Gemini-2.5-Pro | 0.305 | 7.79 | 0.009 | 0.132 | 0.015 | 0.108 | 0.029 | 5584 | 0.16 |
| Claude-Sonnet-4.5 | 0.520 | 4.90 | 0.017 | 0.224 | 0.004 | 0.128 | 0.043 | 8929 | 0.37 |
| **GLM-4.6** | **0.528** | 8.45 | 0.015 | 0.184 | 0.007 | 0.102 | 0.051 | 4949 | 0.18 |
| **Qwen3-32B** | **0.537** | **6.39** | 0.009 | 0.120 | 0.068 | 0.191 | 0.047 | 6237 | 0.27 |
| Ring-1T | 0.539 | 8.08 | 0.012 | 0.249 | 0.015 | 0.111 | 0.048 | 5264 | 0.23 |
| DeepSeek-V3.2-Exp | 0.541 | 10.89 | 0.011 | 0.201 | 0.012 | 0.129 | 0.044 | 3724 | 0.15 |
| Grok-4 | 0.670 | 13.38 | 0.033 | 0.307 | 0.065 | 0.222 | 0.076 | 2765 | 0.19 |
| LongWriter-Zero | 0.669 | 5.45 | 0.027 | 0.097 | 0.054 | 0.178 | 0.039 | **13393** | 0.53 |
| SuperWriter | 0.674 | 7.97 | 0.025 | 0.255 | 0.070 | 0.245 | 0.030 | 6036 | 0.38 |
| MiniMax-M1-80k | 3.447 | 18.07 | 0.133 | 1.079 | 0.004 | 1.050 | 0.376 | 1442 | 0.38 |
| DeepSeek-R1 | 3.419 | — | — | — | — | — | — | 680 | — |

### 6.2 关键发现

> 📜 **原文**: "GPT-5-REASONING achieves the lowest CED (0.113) and best GRR (2.80), followed by GEMINI-2.5-PRO (CED: 0.305) and CLAUDE-SONNET-4.5 (CED: 0.520, GRR: 4.54)."

**排名分析**：

1. **GPT-5-Reasoning 遥遥领先**：CED 仅 0.113，平均每个故事只有 0.09 个错误，且输出长度达 9050 词。注意它同时做到了"写得长"和"错得少"。
2. **开源模型接近闭源水平**：GLM-4.6 (0.528)、Qwen3-32B (0.537) 的 CED 已与 Claude-Sonnet-4.5 (0.520) 非常接近。
3. **Factual & Detail Consistency 和 Timeline & Plot Logic 是主要失败模式**：在几乎所有模型中，这两类占据了最大的 CED 份额。
4. **Generation 任务最难**：开放式创作（无先验上下文）产生最高 CED，而 Continuation 和 Expansion 因有上下文锚定表现更好。

### 6.3 任务类型影响

> 📜 **原文**: "Generation tasks consistently yield higher CED than Continuation, Expansion, and Completion tasks across most models, suggesting that open-ended creation without prior context poses the greatest consistency challenge."

| 模型 | Overall CED | Generation | Continuation | Expansion | Completion |
|------|:-----------:|:----------:|:------------:|:---------:|:----------:|
| GPT-5-Reasoning | 0.113 | 0.11 | 0.093 | 0.07 | **0.188** |
| Claude-Sonnet-4.5 | 0.52 | **0.67** | 0.387 | 0.498 | 0.402 |
| Qwen3-32B | 0.537 | **0.694** | 0.381 | 0.425 | 0.530 |
| DeepSeek-R1 | 3.419 | 3.007 | **3.829** | 3.737 | 3.415 |

> 💡 **有趣发现**: GPT-5-Reasoning 是唯一在 Completion 任务中 CED 最高的模型（0.188），而大多数模型都是 Generation 任务最高。这可能因为 GPT-5 在 Generation 中的推理能力极强，但给定首尾约束时反而容易在中间产生矛盾。

---

## 七、RQ2: 错误与输出长度的关系

### 7.1 长度偏好差异巨大

> 📜 **原文**: "Proprietary systems like GPT-5-REASONING and CLAUDE-SONNET-4.5 predominantly produce outputs exceeding 6K words (90.6% and 90.7% respectively), while GROK-4 and GPT-4O-1120 predominantly generate shorter outputs, with the majority concentrated in 0–3K words (70.2% and 100% respectively)."

| 模型 | 0-1k | 1k-3k | 3k-5k | 5k-8k | 8k+ | Avg Words |
|------|------|-------|-------|-------|-----|-----------|
| **LongWriter-Zero** | — | — | — | — | — | **13,393** |
| GPT-5-Reasoning | 1.2% | 2.0% | 2.5% | 27.8% | **66.4%** | 9,050 |
| Claude-Sonnet-4.5 | 2.7% | 2.0% | 2.0% | 26.6% | **66.8%** | 8,929 |
| GPT-4o-1120 | 11.0% | **85.0%** | 0% | 0% | 0% | 1,241 |
| DeepSeek-V3 | **98.6%** | 1.5% | 0% | 0% | 0% | 670 |
| DeepSeek-R1 | 5.1% | **94.9%** | 0% | 0% | 0% | 1,391 |

### 7.2 错误与长度的线性关系

> 📜 **原文**: "Error counts increase approximately linearly with output length across models. CLAUDE-SONNET-4.5 exhibits moderate length-error correlation (r=0.478), while DEEPSEEK-V3.2-EXP shows stronger dependency (r=0.973)."

**核心洞察**：错误随长度**近似线性增长**，但不同模型的斜率和相关性差异很大：
- DeepSeek-V3.2-Exp: **r=0.973**（强依赖，写得越长错得越多）
- Claude-Sonnet-4.5: **r=0.478**（中等依赖，有更好的长距离一致性维持能力）

> 💡 **深层含义**: 这个发现暗示当前模型没有真正的"全局一致性维护机制"——错误更像是一个泊松过程，以近似恒定的速率在每个文本段中独立产生。Claude 的较低相关性可能说明其在某些长度区间有更好的一致性检查能力。

---

## 八、RQ3: Token 熵与错误的关联

### 8.1 实验设计

> 📜 **原文**: "We examine whether model uncertainty differs between erroneous and correct content. We quantify token-level uncertainty using Shannon entropy."

选择 **Qwen3-4B-Instruct-2507** 和 **Qwen3-30B-A3B-Instruct-2507** 两个开源模型，因为它们：
- 开源可复现
- 有足够的错误样本
- 计算成本可控

对每个位置 $t$ 的 top-K next-token 分布计算 Shannon 熵：

$$H(P_t) = -\sum_{i=1}^{K} p_i \log_2 p_i$$

段落级平均熵：$\bar{H}(S) = \frac{1}{N} \sum_{t=1}^{N} H(P_t)$

### 8.2 关键结果

| 指标 | Qwen3-30B-A3B | Qwen3-4B |
|------|:---:|:---:|
| 全文平均 Entropy | 1.1438 | 1.0734 |
| 错误段落平均 Entropy | 1.2814 | 1.2799 |
| **错误段 vs 全文差异** | **+12.03%** | **+19.24%** |
| 全文平均 Probability | 0.6895 | 0.7097 |
| 错误段落平均 Probability | 0.6522 | 0.6530 |
| **概率差异** | **-5.41%** | **-7.99%** |
| 全文平均 Perplexity | 1.8875 | 1.8566 |
| 错误段落平均 Perplexity | 1.9354 | 1.9596 |
| **困惑度差异** | **+2.54%** | **+5.55%** |

> 📜 **原文**: "Across both models and all three metrics, error-bearing content exhibits greater uncertainty: entropy increases by +12.03% to +19.24%, probability decreases by -5.41% to -7.99%, and perplexity rises by +2.54% to +5.55% relative to the whole-text baseline."

> 💡 **核心启示**: 错误段落的 token 分布更"弥散"（熵更高、概率更低、困惑度更高）。这意味着**模型在产生矛盾内容时，自身其实"不太确定"**——这为基于不确定性的一致性错误**早期预警信号**提供了理论基础。较小的模型（4B）效应更显著（+19.24%），说明较弱模型在不确定时更容易犯错。

---

## 九、RQ4: 错误类型共现模式

### 9.1 全局相关性分析

> 📜 **原文**: "Factual & Detail Consistency serves as a central hub, correlating most strongly with Characterization (r=0.304), World-building & Setting (r=0.255), and Timeline & Plot Logic (r=0.176)."

Pearson 相关系数矩阵关键值：

| 配对 | Pearson r |
|------|:---------:|
| Factual ↔ Characterization | **0.304** |
| Factual ↔ World-building | **0.255** |
| Factual ↔ Timeline | **0.176** |
| **Narrative & Style ↔ 所有其他** | **≈ 0** |

### 9.2 模型特异性相关

- **GPT-5-Reasoning, Gemini-2.5-Pro**：稀疏矩阵，跨类别依赖性弱（错误少，不足以形成强相关）
- **Claude-Sonnet-4.5**：Fact.–World (r=0.387)、Narr.–Fact. (r=0.429) 较强
- **GLM-4.6, Kimi-K2-2509**：最强的 Char.–Fact. 相关（r=0.533 和 r=0.556）

> 💡 **关键洞察**: Factual & Detail Consistency 是"错误中心节点"——当模型犯了事实性错误（如角色名字搞混），连带也容易犯角色一致性和世界观错误。而 **Narrative & Style 错误完全独立**——视角混淆、语调变化是通过与事实/逻辑错误不同的机制产生的。这暗示一致性改进应分两条路径：一条处理事实/逻辑链（覆盖 4 类），另一条专门处理风格一致性。

---

## 十、RQ5: 错误在叙事中的位置分布

### 10.1 位置测量方法

对每个错误实例记录三个归一化位置指标：
- **Fact Position**: 事实首次建立的位置（归一化到 0-100%）
- **Contradiction Position**: 矛盾出现的位置
- **Gap**: 两者之间的距离

### 10.2 核心发现

> 📜 **原文**: "Errors are not uniformly distributed; rather, different error types emerge at characteristic positions along the narrative, with contradiction positions predominantly clustering in the 40–60% range."

**跨模型共性规律**：
- **事实位置** (Fact) 集中在叙事的 **15–30%**（故事前期建立设定）
- **矛盾位置** (Contradiction) 集中在 **40–60%**（叙事中段）
- 这意味着：模型在故事前 1/3 建立设定，在中段开始"遗忘"

### 10.3 不同错误类型的 Gap 差异

| 错误子类型 | 平均 Gap |
|------------|:--------:|
| **Geographical Contradictions** | **31.0%** |
| Absolute Time Contradictions | 29.7% |
| Core Rules Violations | 26.6% |
| Quantitative Mismatches | 25.0% |
| Memory Contradictions | 22.2% |
| Nomenclature Confusions | 21.4% |
| **Perspective Confusions** | **4.7%** |

> 💡 **深层规律**：地理和时间矛盾的 Gap 最大（~30%），说明这些是**长距离上下文追踪失败**；而视角混淆的 Gap 极小（4.7%），说明这是**局部生成问题**（可能在一两句之内就发生了视角切换）。这直接指向不同的修复策略：地理/时间错误需要**全局记忆机制**（如 RAG 或实体追踪器），而视角错误可以通过**局部一致性检查**解决。

### 10.4 模型特异性位置模式

以 **GPT-5-Reasoning** 为例：
- Absolute Time Contradictions：Fact 位置 48.4%，Contradiction 位置 90.6%，Gap **47.7%**（全表最大）
- 说明 GPT-5 虽然错误极少，但一旦犯错，往往是在故事非常后期才矛盾之前很早建立的时间事实

以 **DeepSeek-V3.2-Exp** 为例：
- Memory Contradictions：Gap **56.4%**（该类别全表最大）
- 说明 DeepSeek 在角色记忆方面的长距离追踪特别薄弱

---

## 十一、核心洞察与启示

### 11.1 叙事一致性 ≠ 语言流畅性

论文的根本贡献在于将**一致性**从"流畅度"中分离出来作为独立评估维度。一个模型可以写出极其流畅、优美的散文，但在 8000 字之后把角色的眼睛颜色搞错。ConStory-Bench 首次提供了量化这种"局部流畅、全局矛盾"现象的工具。

### 11.2 错误不是随机的，而是有规律的

五个 RQ 共同揭示了一致性错误的**系统性结构**：
- **类型维度**：Factual 和 Timeline 最频繁
- **空间维度**：集中在叙事中段（40-60%）
- **生成维度**：与 token 熵正相关
- **关联维度**：Factual 是错误枢纽，Narrative 独立
- **长度维度**：近似线性增长

这些规律性意味着一致性错误是**可预测、可干预**的。

### 11.3 CED + GRR 的互补指标设计值得借鉴

传统评估要么只看绝对数量（不公平），要么只看排名（丢失绝对尺度）。CED 归一化长度偏差，GRR 控制 prompt 难度差异，两者互补提供了更公正的评估框架。这种设计思路可推广到其他长文本评估场景。

### 11.4 Token 熵作为错误预测信号

错误段落的熵显著高于正常段落（+12% 到 +19%），这意味着模型在生成矛盾内容时**自身已经"犹豫"了**。这为**生成时实时检测**提供了可行路径：
- 监控 token-level entropy
- 当熵突然升高时触发一致性检查
- 形成一个**自适应的一致性守护机制**

### 11.5 对训练的启示

1. **Factual Tracking 是当前最大瓶颈**：在几乎所有模型中 Factual CED 最高，说明 entity tracking 和事实记忆是长文本生成的核心挑战
2. **Reasoning 模型（如 GPT-5-Reasoning）显著领先**：可能因为 chain-of-thought 推理帮助维护了更好的全局一致性
3. **Agent 系统（SuperWriter）并未显著改善一致性**：CED 0.674，与 LongWriter-Zero (0.669) 接近，说明简单的多步生成管道不足以解决深层一致性问题
4. **模型规模不总是决定性的**：Qwen3-32B (0.537) 优于 Qwen3-235B-A22B (1.447)，Thinking 版本 (0.559) 又优于基础版

### 11.6 局限性

论文坦诚承认三个局限：
1. **仅覆盖英语小说**：不同文化有不同叙事传统，结果可能不可直接推广
2. **二元判定**：将一致性建模为"一致/矛盾"的二元判断，无法区分**有意的叙事技巧**（如反转结局、延迟揭示）和真正的错误
3. **仅限虚构叙事**：技术文档、学术写作、剧本等其他长文本体裁各有其独特的一致性要求

---

## 附录：关键数据汇总

### A. 完整模型排名（按 Overall CED 升序）

**闭源模型**:
GPT-5-Reasoning (0.113) > Gemini-2.5-Pro (0.305) > Claude-Sonnet-4.5 (0.520) > Grok-4 (0.670) > GPT-4o-1120 (0.711) > Doubao-1.6-Thinking (1.217) > Mistral-Medium-3.1 (1.355)

**开源模型**:
GLM-4.6 (0.528) > Qwen3-32B (0.537) > Ring-1T (0.539) > DeepSeek-V3.2-Exp (0.541) > Qwen3-235B-A22B-Thinking (0.559) > GLM-4.5 (0.595) > Ling-1T (0.699) > Step3 (0.845) > Qwen3-Next-80B-Thinking (0.959) > Kimi-K2-2509 (1.300) > Kimi-K2-2507 (1.330) > Qwen3-235B-A22B (1.447) > Qwen3-Next-80B (1.603) > Qwen3-4B (1.685) > Nvidia-Llama-3.1-Ultra (1.833) > Qwen3-30B-A3B (2.130) > DeepSeek-V3 (2.422) > QwenLong-L1-32B (3.413) > DeepSeek-R1 (3.419) > MiniMax-M1-80k (3.447)

**能力增强模型**:
LongWriter-Zero (0.669) > Suri-i-ORPO (2.445) > LongAlign-13B (3.664)

**Agent 系统**:
SuperWriter (0.674) > DOME (1.033)

### B. 参考文献

- [arXiv 论文页面](https://arxiv.org/abs/2603.05890)
- [ConStory-Bench 项目页面](https://picrew.github.io/constory-bench.github.io/)
- [GitHub 仓库](https://github.com/Picrew/ConStory-Bench)
