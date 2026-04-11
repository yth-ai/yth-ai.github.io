---
title: "Benchmark 数字越好看，越可能是幻觉"
description: "两篇独立论文不约而同地指向同一个结论：当前 LLM benchmark 分数的提升，很大一部分来自训练数据对测试集的软污染，而不是真实能力的进步。这对评估可信度是一次系统性打击。"
date: 2026-04-11
category: "数据工程"
tags: ["benchmark", "数据污染", "评估", "泛化", "预训练数据", "软污染"]
---

过去一年，几乎每个月都有新模型刷新 benchmark 记录。MATH 满分、AIME 接近人类竞赛水平、HumanEval 近乎饱和……每次发布都配有一张令人印象深刻的表格。

但越来越多的研究者开始问一个不舒服的问题：这些数字，到底有多少是真的？

## 「软污染」：比你以为的更普遍

今年 2 月，一篇来自 Juan J. Vazquez 的论文 [Soft Contamination Means Benchmarks Test Shallow Generalization](https://arxiv.org/abs/2602.12413)（arXiv:2602.12413）给出了一个令人不安的数据点：

研究者对 OLMo-3 的训练语料库进行了语义嵌入分析，结果发现：

- **78% 的 CodeForces 题目**在训练集中能找到语义相似的"软重复"内容
- **50% 的 ZebraLogic 逻辑谜题**存在精确重复

传统的去污染方法用的是 n-gram 字符串匹配——但"软污染"指的是语义等价的内容，换了说法但考察同样的知识点。这类内容完全逃过了现有的过滤器。

更关键的实验结论是：**在训练集里加入 benchmark 的语义重复，确实会提升 benchmark 得分，但不一定能提升对真正未见过的题目的泛化能力。**

> "recent benchmark gains are thus confounded: the prevalence of soft contamination means gains reflect both genuine capability improvements and the accumulation of test data and effective test data in growing training corpora."  
> — Vazquez et al., [arXiv:2602.12413](https://arxiv.org/abs/2602.12413)

## 参数空间里留下的「指纹」

4 月 1 日，另一篇论文 [Benchmark Shadows: Data Alignment, Parameter Footprints, and Generalization in Large Language Models](https://arxiv.org/abs/2604.07363)（arXiv:2604.07363）从完全不同的角度得到了相似的结论。

作者通过「受控数据干预」对比了两种训练策略：
1. **Benchmark-aligned data**：针对评测集精心准备的数据
2. **Coverage-expanding data**：覆盖更广、更多样的通用数据

用参数空间的谱分析（spectral analysis）和 rank 分析来追踪训练效果——这相当于给模型的权重矩阵做「指纹识别」：

- Benchmark-aligned 的训练在参数空间留下**集中、狭窄**的更新轨迹
- Coverage-expanding 的训练则产生**分散、低秩**的更新——意味着更多神经元参与了学习

更直接的结论：针对 benchmark 优化的模型，其表现提升**不能迁移**到 benchmark 以外的任务，哪怕是同一领域的题目。

> "benchmark performance alone is insufficient to characterize model capability, and highlight the importance of data distribution in shaping learning dynamics."  
> — Zou et al., [arXiv:2604.07363](https://arxiv.org/abs/2604.07363)

## 为什么这件事比「作弊」更严重

有人会说：这不就是训练集和测试集有交叉嘛，从来都是这样。

但这两篇论文揭示的问题更深：

**1. 污染是结构性的，不是偶发的。** 随着训练数据规模不断扩大，几乎所有主流 benchmark 都开始在训练集里有某种程度的语义重叠。Soft contamination 随着数据规模线性增长。

**2. 现有的去污染工具不够用。** N-gram 过滤能发现"复制粘贴"，但识别不了"换了表达方式的同一道题"。语义级别的去重成本高，工业界普遍没有做。

**3. 受此影响最大的，恰好是那些「硬推理」benchmark。** CodeForces、MathBench、GPQA 等，都是数据密度高的特定领域——正是最容易积累软污染的地方。也正是各家模型争相比拼的地方。

## 对数据工程的实践含义

如果你在训练自己的模型，这意味着几件事：

**去污染必须升级到语义层面。** 用嵌入相似度做过滤，而不只是字符串匹配。成本更高，但不做等于自欺欺人。

**评估集需要持续更新和保密。** 一个公开了超过一年的 benchmark，其可信度应该打折扣。定期替换评估集的核心子集，或者使用「对抗性」的动态评测。

**多关注「覆盖度」而非「对齐度」。** Benchmark Shadows 论文的核心发现是：分散参数激活的训练数据，比针对性优化的数据更能带来真实的泛化能力。这和 daVinci-LLM 提出的「Data Darwinism」观点是呼应的：多样性本身就是质量。

---

Benchmark 作为行业语言没有问题，问题在于把它当成唯一的能力标尺。当软污染已经成为数据规模扩张的必然副产物，「刷新 benchmark 记录」这句话就需要加上一个越来越大的误差棒了。
