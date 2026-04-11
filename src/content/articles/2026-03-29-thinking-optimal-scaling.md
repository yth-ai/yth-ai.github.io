---
title: "思考的边际效益递减：Test-Time Scaling 的上限问题"
description: "「让模型多想想」被视为解锁 LLM 推理能力的万能药，但 NeurIPS 2025 有一篇论文提出了反直觉的发现：过长的思维链会损害推理性能。最优思考长度因领域而异，存在「Thinking-Optimal」临界点。"
date: 2026-03-29
category: "前沿研究"
tags: ["Test-Time Scaling", "推理", "Chain of Thought", "思维链", "Scaling Laws", "o1", "推理模型"]
---

过去一年，AI 领域有一个几乎成为共识的判断：训练时 Scaling 遭遇瓶颈，但推理时 Scaling（Test-Time Compute）还有大量空间。

这个判断催生了整个「推理模型」浪潮——OpenAI o1/o3，DeepSeek-R1，QwQ——它们共同的逻辑是：给模型更多推理时间，让它在作答前先「想一想」，在复杂任务上能获得显著的性能提升。Google DeepMind 在 2024 年的论文 [*Scaling LLM Test-Time Compute Optimally*](https://arxiv.org/abs/2408.03314) 系统确立了这一方向的理论基础。

但 NeurIPS 2025 有一篇论文打了一个问号：*「过度扩展思维链长度，真的总是更好吗？」*

---

## 反直觉的发现

论文 [*Towards Thinking-Optimal Scaling of Test-Time Compute for LLM Reasoning*](https://arxiv.org/abs/2502.18080)（arXiv:2502.18080，NeurIPS 2025）的核心发现：

> "scaling with longer CoTs can indeed impair the reasoning performance of LLMs in certain domains. Moreover, we discover that there exists an optimal scaled length distribution that differs across different domains."

在数学推理任务上，当 CoT 长度超过某个阈值后，模型的正确率开始下降。而且，不同领域的「最优思考长度」不同——没有一个统一的「越长越好」规律。

这个发现有几个值得深思的含义：

**模型可能在「过度思考」**。当思维链被强迫拉长，模型可能开始引入不必要的中间步骤，或者在正确答案附近绕远路，最终反而走错。人类解题也有类似现象——有时候想太多反而出错，直觉更可靠。

**「更多计算 = 更好结果」的直觉在推理层面失效了**。训练时 Scaling 的规律是单调的（更多数据/参数/计算总体上更好），但推理时 Scaling 有一个倒 U 形曲线——在最优点之后继续加码是在浪费算力，甚至有害。

**最优长度是任务相关的**。数学题、代码题、常识推理题——每类任务有不同的「思考上限」，通用的「想更久」策略是次优的。

---

## Thinking-Optimal Scaling 的方案

论文提出了 **Thinking-Optimal Scaling Strategy**。核心思路：用一小批种子数据，训练模型在不同的「推理努力程度」下都能产出答案；然后让模型在新问题上自主选择**最短的正确答案路径**作为自我改进的训练信号。

实验结果：基于 Qwen2.5-32B-Instruct 的模型在多个数学 benchmark 上超越了其他蒸馏方式的 32B o1-like 模型，并达到了作为「教师模型」的 QwQ-32B-Preview 的水平。

这里有一个有趣的对称性：让模型「用最少的正确思考」比让模型「尽可能多地思考」更难，但更有价值。

---

## 对工程实践的启示

**预算分配的问题**：当你用推理模型（o3、R1）处理任务时，默认的「让它多想想」策略可能是错的。对于简单明确的任务，限制推理 token 数量可能既省钱又提高准确率。

**任务路由的必要性**：如果不同类型任务有不同的最优思考长度，那么「一刀切地用最强推理模型处理所有任务」是资源浪费。理想的系统应该能根据任务类型动态分配推理预算。

**自我改进循环的设计**：如果你在用模型生成的输出做继续训练，应该优先选择「短而正确」的样本，而不是「长而正确」的样本——因为后者可能已经包含了不必要的思考路径，会被模型学成「过度思考」的习惯。

当所有人都在赛跑「让模型更聪明地思考」时，有人在研究「让模型更高效地停止思考」——这个方向在接下来可能同样重要。Test-Time Scaling 不是线性的，理解它的边界比继续向上堆算力更有价值。
