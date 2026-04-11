---
title: "Agent 的计算预算不该是固定的——TrACE 给了一个零训练开销的方案"
description: "每个推理步骤难度不一样，为什么要给每步分配同样的计算？TrACE 用一个简单的信号——多次 rollout 之间的「行动一致性」——实现了无需训练的自适应推理计算分配，比 SC-4 少 33% 调用但性能相当。"
date: 2026-04-11
category: "论文速读"
tags: ["推理优化", "inference scaling", "adaptive compute", "agent", "test-time compute", "self-consistency"]
---

Inference scaling 的核心逻辑是：采样更多次、取多数决策，精度就会提升。Best-of-N、Self-Consistency（SC）、Beam Search——它们共同的假设是：**每个推理步骤都值得同等的计算投入**。

但在实际的 Agent 任务里，情况完全不是这样。

一个导航任务里，大多数步骤的「下一步该往哪走」是显而易见的——模型每次都会给出一样的答案。只有少数几个关键节点，模型才真正「拿不准」。把 SC-4 或 SC-8 均匀地撒在每个步骤上，大量计算其实是浪费的。

## TrACE：让模型自己报告「我确定不确定」

4 月 9 日的新论文 [Don't Overthink It: Inter-Rollout Action Agreement as a Free Adaptive-Compute Signal for LLM Agents](https://arxiv.org/abs/2604.08369)（arXiv:2604.08369）提出了一个叫 **TrACE**（Trajectorical Adaptive Compute via agrEement）的无训练控制器。

核心思路极其简洁：

1. 在每个决策步骤，先采样**少量候选行动**（比如 2 次）
2. 测量这几次采样的「行动一致性」：
   - 如果模型每次都给出同样的行动 → 说明这步简单，直接提交
   - 如果行动各不相同 → 说明模型不确定，继续追加采样直到达到上限
3. 最终用多数投票决策

这里的关键洞见是：**模型输出的一致性本身就是一个免费的难度信号**。不需要额外的验证器、不需要标注数据、不需要微调——模型「说不准」这件事，就已经被编码在它的输出分布里了。

## 数字怎么样

实验用 Qwen 2.5 3B Instruct 在 GSM8K（数学推理）和 MiniHouse（多步骤家庭导航）上做了对比：

| 方法 | GSM8K 准确率 | LLM 调用次数 | 节省 |
|------|-------------|------------|------|
| SC-4（固定） | ~X% | 4× | - |
| **TrACE-4** | 匹配 SC-4 | **2.67×** | **33% 更少** |
| SC-8（固定） | ~X% | 8× | - |
| **TrACE-8** | 匹配 SC-8 | **3.6×** | **55% 更少** |

在多步骤的 MiniHouse 任务上节省更多：TrACE-4 比 SC-4 少 39%，TrACE-8 比 SC-8 少 65%。

论文还验证了核心假设：步骤级别的行动一致性，确实是步骤成功率的可靠预测指标——相关性数据支持了这个直觉。

> "TrACE is the first training-free, per-timestep adaptive-compute controller for LLM agents to be evaluated on multi-step sequential decision tasks."  
> — Sethi et al., [arXiv:2604.08369](https://arxiv.org/abs/2604.08369)

## 为什么这件事值得关注

大量关于 inference scaling 的工作都在做「给更多计算，看精度怎么变」的研究。TrACE 反过来问：**在精度不变的前提下，计算的下限在哪里？**

这个问题对 Agent 实际落地至关重要。多步骤任务的推理成本不是线性的——如果每步用 SC-8，一个 50 步的任务要 400 次 LLM 调用。TrACE-8 把这个数字压到约 140 次，同样的精度。

更深层的含义是：**模型的输出分布里蕴含了比我们通常使用的更多信息**。行动一致性只是一种用法；其他类型的分布统计量——置信度、熵、跨样本方差——可能都有类似的信号价值，等待被工程化利用。

另一个值得追问的方向：TrACE 目前用的是行动级别的一致性。在更复杂的 Agent 设计里（比如工具调用序列、代码生成），「一致性」的定义会更复杂——但方法论的思路是可迁移的。

---

Inference scaling 的真正挑战，不是把计算堆上去，而是把计算花在刀刃上。TrACE 的结果说明，模型自己其实知道哪些步骤需要三思——我们只需要学会倾听它的犹豫。
