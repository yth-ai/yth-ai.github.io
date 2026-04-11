---
title: "RLVR 出圈：SUPERNOVA 证明强化学习可以训练「通用推理」"
description: "RLVR 一直被限制在数学和代码领域——因为那里有可验证的奖励。SUPERNOVA 今天发布，用 100+ 受控实验证明：通过精心策划的自然语言指令数据，RLVR 可以扩展到因果推断、时序理解等通用推理场景。"
date: 2026-04-10
category: "论文速读"
tags: ["RLVR", "推理", "数据策略", "通用推理", "强化学习", "SUPERNOVA"]
---

RLVR（Reinforcement Learning with Verifiable Rewards）这两年在数学和代码任务上表现惊艳，DeepSeek R1、Qwen 系列都受益于此。但有一个大家默认的限制：**RLVR 需要可验证奖励，而大多数真实推理任务没有客观正确答案。**

这个限制把 RLVR 锁死在了两个领域：数学（答案唯一）和代码（测试用例可验证）。对于因果推断、时序理解、常识推理这类「软」推理，大家普遍认为 RLVR 使不上力。

[SUPERNOVA](https://arxiv.org/abs/2604.08477) 今天正面反驳了这个认知。

## 核心洞见：指令微调数据集里藏着可验证的奖励

UCLA 和 UW 的研究团队提出了一个关键观察：**专家标注的指令微调数据集（instruction-tuning datasets）包含丰富的推理模式，而这些数据集已经有了专家给出的「标准答案」。**

这意味着：这些答案本身就可以作为 RLVR 的奖励信号。不需要形式化的验证器，只需要把 ground-truth 答案当作奖励目标。

> "Our key insight is that instruction-tuning datasets containing expert-annotated ground-truth encode rich reasoning patterns that can be systematically adapted for RLVR."
> — SUPERNOVA，[arXiv:2604.08477](https://arxiv.org/abs/2604.08477)

这个思路看起来简单，但执行细节很复杂——SUPERNOVA 的主要工作是回答：**如何从海量指令微调数据集里选出适合 RLVR 的子集？**

## 100 次实验的三个关键发现

SUPERNOVA 跑了 100+ 受控 RL 实验，系统研究了三个数据设计维度：

### 1. Source Task Selection 非常重要

**并非所有指令微调任务都适合用来做 RLVR 训练通用推理。** 不同的 source task（比如阅读理解 vs. 常识推理 vs. 因果推断）对下游推理能力的影响差别很大，而且**高度依赖目标任务**。

关键结论是：选择对**单个目标任务**表现最好的 source tasks，比选择对整体平均分最优的 source tasks 效果更好。这意味着「一刀切的数据选择」是次优的——你需要针对性地匹配 source 和 target 任务。

### 2. Task Mixing 有非线性效应

不同推理类型的数据混合在一起时，会产生非线性的组合效果：有些组合是互补的，有些会相互干扰。比如因果推理和时序推理数据一起训练，在某些 target task 上的效果好过单独训练；但因果推理和数学数据混合，可能反而降低因果推理能力。

这个发现和预训练领域的「数据混合定律」（Data Mixing Laws）遥相呼应——数据比例的效果不是线性可加的。

### 3. Synthetic Interventions 可以提升数据质量

对原始指令微调数据进行**合成干预**（比如添加推理步骤、重写答案格式、生成 chain-of-thought 中间步骤）可以进一步提升 RLVR 训练效果。

这表明即使是「非正式」的自然语言答案，也可以通过格式标准化变得更适合强化学习。

## 结果：BBEH 上超过 Qwen3.5 52.8%

SUPERNOVA 框架训练出的模型在多个通用推理 benchmark 上有显著提升：
- **BBEH**（Big Bench Extra Hard）：相对于 Qwen3.5 提升 **52.8%**
- **Zebralogic**（逻辑推理）：显著提升
- **MMLU-Pro**（多学科推理）：显著提升

这些提升不是在数学或代码上，而是在这个框架要解决的「软推理」任务上。

## 这件事的意义

SUPERNOVA 打开了一个实际上非常大的数据空间——现有的各类指令微调数据集（FLAN、SuperNatural Instructions、Dolly、ShareGPT 等等）突然都可以被重新审视，看哪些子集适合用来做 RLVR。

更广泛地说，这是 RLVR 正在「去专业化」的信号。一年前，RLVR 只属于顶尖数学/代码模型的训练流程；现在它开始渗透到通用推理能力的提升上。结合 daVinci-LLM 在预训练数据处理上的系统化努力，我们正在看到训练方法论整体向「更精细、更系统、更开放」的方向演进。

**问题是：当 RLVR 可以用于任何有「参考答案」的任务时，训练数据策略的重要性会远超模型架构本身。谁能建立最好的数据选择框架，谁就赢得下一阶段的竞争。**
