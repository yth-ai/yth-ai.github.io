---
title: "数据混合策略的新范式：从静态配比到动态调度"
description: "精选 3 篇关于预训练数据混合、质量评估与领域数据选择的最新论文"
date: 2026-03-23
series: "数据论文速递"
volume: 2
tags: ["数据混合", "数据质量", "领域适配", "Scaling Laws"]
---

## 今日精选

> 本期共推荐 3 篇论文，聚焦预训练数据混合策略和质量评估方向。

---

### 1. DoReMi: Optimizing Data Mixtures Speeds Up Language Model Pretraining

**作者**：Sang Michael Xie, Hieu Pham, Xuanyi Dong, Nan Du, Hanxiao Liu, Yifeng Lu, Percy Liang, Quoc V. Le, Tengyu Ma, Adams Wei Yu | **机构**：Google, Stanford
**链接**：[arXiv](https://arxiv.org/abs/2305.10429) · [NeurIPS 2023](https://proceedings.neurips.cc/paper_files/paper/2023/hash/dcba6be91359c657964f0b3d53b848c5-Abstract-Conference.html)

**核心发现**：

DoReMi 提出了一种不依赖下游任务的数据混合优化方法。核心思路是训练一个小型「代理模型」来估算各个数据域的最优权重，然后将这些权重转移到大模型训练中。

关键创新在于使用 Group Distributionally Robust Optimization（Group DRO）来优化域权重——不是最大化平均性能，而是最小化最差域上的损失。实验显示，DoReMi 找到的混合配比让 280M 模型的训练效率提升了相当于使用 2.6 倍数据量的效果，并且这套权重可以成功迁移到 8B 规模的模型上。

**对数据工作的启示**：

> 不要再凭直觉调数据配比了。DoReMi 的方法论可以直接落地：先用一个便宜的小模型（比如 1B）跑一轮 Group DRO 找到最优域权重，再把这套权重用到大模型训练中。投入产出比极高——小模型训练成本不到大模型的 1%，但可以显著提升数据效率。
>
> 特别值得注意的是，论文发现直觉上「应该多给」的域（如代码、书籍）不一定需要更高权重，而一些被忽视的域（如论坛讨论、多语言内容）反而需要上调。

---

### 2. Data Mixing Laws: Optimizing Data Mixtures by Predicting Language Modeling Performance

**作者**：Jiasheng Ye, Peiju Liu, Tianxiang Sun, Yunhua Zhou, Jun Zhan, Xipeng Qiu | **机构**：复旦大学
**链接**：[arXiv](https://arxiv.org/abs/2403.16952)

**核心发现**：

这篇论文首次提出了「数据混合定律」（Data Mixing Laws）——类似于 Scaling Laws 预测模型性能随参数量和数据量的变化，Data Mixing Laws 可以预测模型性能随数据混合比例的变化。

核心方法：在多组不同混合配比上训练小模型，拟合出一个关于混合比例的性能预测函数，然后用这个函数直接找到最优配比，避免了在大模型上进行昂贵的网格搜索。实验验证显示，预测误差在 1% 以内，适用于从 100M 到 3B 规模的模型。

**对数据工作的启示**：

> 这篇论文提供了一个更工程化的思路：把数据配比优化当作一个可预测的数学问题来解。建议在项目初期就设计一组「配比探索实验」（比如 16 组不同配比的 100M 模型），拟合出属于你的数据集的混合定律，然后直接预测大模型最优配比。
>
> 相比 DoReMi 的方法，Data Mixing Laws 的优势在于可解释性更强——你能看到每个域的权重如何影响各项指标，从而做更精细的调控。

---

### 3. SlimPajama-DC: Understanding Data Combinations for LLM Training

**作者**：Zhiqiang Shen, Tianhua Tao, Liqun Ma, Willie Neiswanger, Joel Hestness, Natalia Vassilieva, Daria Soboleva, Eric Xing | **机构**：MBZUAI, Cerebras
**链接**：[arXiv](https://arxiv.org/abs/2309.10818)

**核心发现**：

SlimPajama-DC 对 SlimPajama 数据集的 7 个主要数据源进行了系统的消融实验，通过 2^7 = 128 种组合训练 1.3B 模型来理解不同数据组合的效果。

关键发现：(1) Web 数据（CommonCrawl）是「通用溶剂」——在几乎所有组合中都能提供基础能力；(2) 代码数据的边际收益递减明显——超过 20% 后对非代码任务有负面影响；(3) 数学和科学数据虽然量小，但对推理能力有不成比例的正面影响；(4) 去重的影响比数据配比更大——彻底的全局去重比调配比更值得投入精力。

**对数据工作的启示**：

> 几个可以直接用的结论：
> 1. **先做去重，再调配比**——如果你还没做全局去重（MinHash/SimHash），这应该是第一优先级
> 2. **代码数据控制在 15-25%**——超过这个范围不仅没有额外收益，还会损害通用能力
> 3. **数学/科学数据是高杠杆投入**——即使只有 5%，也值得精心策划，因为它对推理能力的提升效率远超其他域
> 4. **不要忽视数据多样性**——128 组实验清楚地表明，7 个来源全部保留的组合几乎总是优于任何子集

---

## 编者按

> 今天推荐的三篇论文形成了一个完整的叙事：从「如何自动找到最优配比」（DoReMi），到「如何用数学模型预测配比效果」（Data Mixing Laws），再到「实际跑 128 组实验验证各种直觉」（SlimPajama-DC）。
>
> 一个越来越清晰的趋势是：**数据配比正在从「经验和直觉」走向「可计算和可预测」。** 对于数据团队来说，这意味着需要建立系统化的「配比探索」流程——就像超参搜索一样，数据配比也值得认真调优。好消息是，小模型代理的方法让这件事的成本变得可控。
