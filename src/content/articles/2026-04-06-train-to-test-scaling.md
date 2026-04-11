---
title: "Chinchilla 错了吗？T² Scaling 重新定义计算最优预训练"
description: "新 arxiv 论文提出 Train-to-Test Scaling Laws，发现当推理时可做 test-time scaling 时，最优预训练策略会大幅偏离 Chinchilla——往往应该「过训练」小模型。"
date: 2026-04-06
category: "论文速读"
tags: ["Scaling Laws", "预训练", "Test-Time Scaling", "推理优化", "Chinchilla"]
---

Chinchilla 定律告诉我们：给定计算预算 $C$，最优的做法是训练参数量为 $N \propto \sqrt{C}$ 的模型、用对应 token 数让 loss 最小。这个结论过去三年几乎成了预训练的金科玉律。

但它有个隐含假设：你只会推理一次。

如果你可以在推理时用 pass@k、Best-of-N 或 beam search 多次采样——也就是 test-time scaling——这个假设就崩了。

## 论文说了什么

[arXiv:2604.01411](https://arxiv.org/abs/2604.01411)（UW-Madison 团队，4月1日发布）提出 **Train-to-Test（$T^2$）Scaling Laws**：一个同时优化模型大小、训练 token 数、推理采样次数三个维度的统一框架。

核心思路是把 Chinchilla 的 pretraining scaling law 和 test-time 的 pass@k 建模结合起来，在**固定总端到端预算**（训练 + 推理）的条件下联合优化。

结果让人意外：

> "Across eight downstream tasks, we find that when accounting for inference cost, optimal pretraining decisions shift radically into the overtraining regime, well-outside of the range of standard pretraining scaling suites."
> — Roberts et al., [arXiv:2604.01411](https://arxiv.org/abs/2604.01411)

也就是说，一旦你允许模型在推理时多花计算，**最优的预训练策略会远远偏离 Chinchilla——你应该用比"最优"更多的数据训练同等规模的模型**，即所谓的「过训练（overtraining）」。

## 直觉上为什么会这样

Chinchilla 最小化的是单次推理的 loss。但 pass@k 的机制不同：你对同一个问题采样 $k$ 次，只要其中一次对了就算赢。这意味着：

- 一个**小而训练充分的模型**，每次采样的多样性更高、错误更分散
- 一个**大而训练不足的模型**，虽然单次 loss 更低，但采样结果趋于相似，k 次里多次犯同一个错

从信息论角度理解：pass@k 需要的是模型能覆盖正确答案的概率分布，而不是把概率质量集中在最可能的答案上。「过训练」小模型在这方面反而有优势——它把同样计算预算的更多部分放到了记忆和泛化，而非参数扩展。

## 它在预测什么

论文作者用 $T^2$ scaling 预测了最优配置，然后实际训练了「大幅过训练」的模型来验证。结论是：**$T^2$ 预测的过训练模型在八个下游任务上确实显著优于 Chinchilla 最优配置的模型**，且这个优势在经过 post-training 之后依然保持。

这一点很重要——很多 scaling 研究只在预训练阶段验证，而该工作明确测试了 post-training 后的结果，让结论对实际部署更有说服力。

## 对行业的影响

这篇论文的潜在含义不小：

1. **小模型会被重估**。如果你打算在推理时用 test-time scaling，那么训练一个更小但 token 数更多的模型，可能比训练 Chinchilla 最优的大模型更划算。

2. **「过训练」不再是贬义词**。过去训练超过 Chinchilla 最优 token 数被认为是在浪费计算，但 $T^2$ 表明这实际上是在为 test-time 计算做预投资。

3. **Scaling law 需要更新**。Chinchilla 是 2022 年的工作，当时 test-time scaling 还不是主流范式。随着 o1/R1 类模型普及，训练策略的理论基础也需要跟上。

还有一点值得观察：这篇论文的结论是否会改变大公司的下一轮预训练决策？如果连 Chinchilla 的假设都需要修正，那我们对「计算最优」的直觉可能也需要一次系统性更新。
