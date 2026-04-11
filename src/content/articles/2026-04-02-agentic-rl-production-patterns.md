---
title: "三家公司同时用 RL 训练 Agent，但他们做的不是同一件事"
description: "Kimi K2.5、Cursor Composer 2、Chroma Context-1 同期发布，都用强化学习在生产环境训练 Agent，但训练目标、奖励设计和解决的核心问题截然不同。"
date: 2026-04-02
category: "工程实践"
tags: ["强化学习", "Agent", "PARL", "生产训练", "Kimi", "Cursor", "Chroma", "agentic RL"]
---

三月末到四月初，Moonshot AI、Cursor、Chroma 相继发布技术报告。表面上看，三篇报告的摘要几乎可以互换——都是「用 RL 在真实生产环境中训练 Agent，取得了 SOTA」。但读完全文，你会发现他们各自解决的是三个完全不同的问题。

## Kimi K2.5：任务并行是可以被 RL 学出来的

Kimi K2.5 的核心贡献不是模型性能，而是一个叫 **PARL（Parallel-Agent Reinforcement Learning）** 的训练框架。论文地址：[arxiv.org/abs/2602.02276](https://arxiv.org/abs/2602.02276)

传统 Agent 按顺序执行：思考 → 调用工具 → 观察 → 再思考。Kimi 的 Agent Swarm 让主控 Agent（Orchestrator）学会把任务拆成并行子任务，分派给子 Agent 同时执行。

关键设计在奖励函数。PARL 奖励由三部分构成：

- **r_perf**（性能奖励）：任务是否完成，是主信号
- **r_parallel**（并行奖励）：激励子 Agent 被实际创建，防止「串行坍缩」——模型发现顺序执行更简单就不再探索并行了
- **r_finish**（完成奖励）：奖励子任务完成，防止「虚假并行」——仅为拿 r_parallel 而创建但不完成任务的 Agent

两个辅助奖励系数在训练过程中线性衰减至零，最终策略只优化任务完成。这是一个精心设计的 curriculum：先用外力驱动模型探索并行策略，再撤掉脚手架，让性能信号决定保留哪些并行模式。

另一个有意思的指标是「关键步骤数（critical steps）」。在并行计算图中，总步骤数不能反映延迟——真正重要的是最长执行链（类比 CPU 中的关键路径）。这个指标的引入激励 Orchestrator 平衡子任务工作量，而不是单纯最大化并发数。

> "Freezing sub-agents and treating their outputs as environmental observations means only the orchestrator's coordination logic gets optimized."
> — Philipp Schmid，[How Kimi, Cursor, and Chroma Train Agentic Models with RL](https://www.philschmid.de/kimi-composer-context)

子 Agent 被冻结这个设计决策解决了一个深层问题：信用分配（Credit Assignment）。在端到端联合优化里，一个正确的最终答案可能来自 Orchestrator 分解得好，也可能来自某个子 Agent 运气好。冻结子 Agent，把它的输出当作环境反馈，让 Orchestrator 成为唯一可训练的决策节点。

## Cursor Composer 2：从生产流量中实时学

Cursor 的问题不一样。代码生成的上下文可以非常长——一个完整的功能改动可能涉及几十个文件、数千行历史。标准上下文窗口装不下。

他们的方案是让模型学会**自我摘要**：在长编辑会话中，Composer 2 会周期性地把历史交互压缩成结构化摘要，然后用摘要替换原始历史继续工作。压缩质量本身通过 RL 优化——最终任务完成率是信号，好的摘要会保留关键信息，差的摘要会让后续步骤失败。

更关键的是他们的训练数据来源：**从生产流量实时收集 rollout**。每一次用户使用 Cursor 的过程都是一条潜在的训练轨迹。这让他们的 RL 训练规模远超学术环境，也意味着训练分布和部署分布天然对齐——这正是学术 RL 最难复现的部分。

起点模型是 Kimi K2.5（1T 参数 / 32B 激活 MoE），这个选择本身也说明了一件事：2026 年的 agentic 训练已经不是从头做的事，而是在已有强底座上精调。

## Chroma Context-1：主动压缩检索上下文

Chroma 做的是 RAG 系统里的一个老问题：检索到的文档很多，但并非全部有用，随着搜索轮次增加，上下文很快被无关内容填满。

Context-1 训练模型做**自我编辑（self-editing context）**：主动剪除检索到的文档中不再相关的部分，为后续搜索腾出空间。奖励信号同样是最终任务完成率，通过 RL 学习哪些内容值得保留。

从 RAG 工程的角度看，这是一个优雅的解法：与其在检索阶段做更精准的过滤，不如让 Agent 在执行过程中动态维护自己的工作记忆。

## 三种范式的共同基础设施

读完三篇报告，有几个共同点值得关注：

1. **没有人从头训练**。都是从强底座（Kimi K2、Kimi K2.5、gpt-oss-20B）出发，用 RL 塑造特定行为。
2. **在生产环境中收集 rollout**。学术数据集里的 Agent 轨迹质量和真实使用场景差距太大，这一步是实用化的核心。
3. **Generative Reward Model（GRM）**。对于无法用规则判断对错的开放式任务（风格、宪法约束、偏好），三家都用了生成式奖励模型作为补充信号。
4. **异步大规模并行 rollout 基础设施**。Agent rollout 很贵，这是工程投入最大的地方，也是门槛最高的地方。

**底线判断**：agentic RL 不是一个统一的方法，而是一个工程框架。Kimi 在解决任务分解，Cursor 在解决长上下文，Chroma 在解决上下文管理。这三个问题恰好对应了 Agent 在复杂任务中最常遭遇的三道墙。选择哪种范式取决于你的 Agent 主要卡在哪里。
