---
title: "Kimi、Cursor、Chroma 同时印证：Agentic RL 有了一套共同范式"
description: "三家公司独立训练 agent 模型，却收敛到相同的方法论：从强基座出发，在生产环境里做 RL，用结果奖励而非过程奖励。这不是巧合，是工程倒逼出来的答案。"
date: 2026-04-07
category: "工程实践"
tags: ["Reinforcement Learning", "Agentic AI", "Kimi", "Cursor", "Chroma", "RLHF", "post-training"]
---

三份报告，三支团队，独立发布，却几乎做了同一件事。

Moonshot AI 的 [Kimi K2.5 技术报告](https://arxiv.org/html/2602.02276v1)、Cursor 的 [Composer 2 技术报告](https://arxiv.org/html/2603.24477v2)、Chroma 的 [Context-1 研究文章](https://www.trychroma.com/research/context-1)，Philipp Schmid（Google DeepMind）在 3 月底将这三篇放在一起做了一次深度对比，结论是：它们在 Agentic RL 的方法论上高度收敛。

这种收敛值得认真对待，因为它意味着我们正在看到的不是某一家的偶然发现，而是工程实践倒逼出来的共同答案。

## 三家的共同选择

Schmid 总结出四条贯穿全部三份报告的方法论：

**1. 从强基座出发，不从头训练**。Kimi K2.5 在 Kimi K2 基础上做多模态预训练扩展；Cursor Composer 2 直接从 Kimi K2.5（1T 参数 / 32B 激活的 MoE 架构）微调；Chroma Context-1 基于 gpt-oss-20B。没有一家从头开始。这印证了一个越来越明确的行业共识：post-training 的边际收益远超同等算力投入在预训练上的收益。

**2. 在生产环境 harness 里做 RL rollout**。每家团队都在模型实际部署的那套工具链、Prompt 格式、执行环境里做训练，而不是用独立的训练环境模拟。Cursor 甚至维护了一个 shadow deployment，让训练时的工具行为（比如语义搜索）和生产完全一致。这解决了训练/推理分布不一致的问题，也是为什么 SWE-bench 分数高的模型实际用起来可能不如预期。

**3. 结果奖励，不是过程奖励**。三家都用可验证的结果信号作为主要 reward，配合 Generative Reward Models (GRM) 处理开放性任务。没有手工标注每一步行为是否正确——这在 long-horizon agent 任务上成本极高，且人类评判者也往往无法准确判断中间步骤。

**4. 大规模异步 rollout**。Agent 的每一次 rollout 都很贵（要真实执行工具调用、运行代码），所以三家都投入了专门的基础设施来并行生成轨迹。

## Kimi 的新东西：学会并行

Kimi K2.5 最特别的地方是 Agent Swarm 和 PARL（Parallel-Agent Reinforcement Learning）。大多数 agentic 系统是顺序的：think → tool call → observe → repeat。Agent Swarm 让模型学会把任务分解给并行的子 agent 执行。

关键设计是 orchestrator（可训练）和 sub-agents（冻结）的分离。这解决了 credit assignment 问题：如果 orchestrator 和 sub-agent 都参与优化，最终答案正确可能是 orchestrator 分解得好，也可能是某个 sub-agent 运气好——难以区分。冻结 sub-agent 后，只有协调逻辑被优化。

奖励设计也有意思：三个分量，performance reward 是主信号，parallelism reward 防止模型退化为单 agent 串行（"serial collapse"），finish reward 防止模型为了刷 parallelism reward 而无意义地开出很多 sub-agent（"spurious parallelism"）。后两项在训练后期逐步 anneal 到零，最终策略只优化任务完成。

> "The decision to parallelize is not hard-coded. On simple tasks, the model works sequentially. On complex multi-source research tasks, it spins up many parallel agents."
> — Philipp Schmid，[How Kimi, Cursor, and Chroma Train Agentic Models with RL](https://www.philschmid.de/kimi-composer-context)

结果：Agent Swarm 在 BrowseComp 上达到 78.4%（单 agent 60.6%），推理延迟降低最多 4.5×。

## Cursor 的新东西：实时 RL

Cursor Composer 2 的特别之处是「real-time RL from production traffic」——直接用用户的真实编程任务做 RL 训练，而不是依赖构造的合成数据集。这要求 reward 信号必须能自动化（代码能跑通、测试通过），也解释了为什么他们投入了大量工程在 shadow production harness 上。

另一个亮点是 self-summarization：Composer 2 会主动压缩长编程会话的上下文，让模型能处理多轮复杂工程任务而不超出 context window。

## Chroma 的新东西：主动剪枝 context

Context-1 教模型「自我编辑」检索到的文档：主动把低价值的内容从 context 里删掉，给后续检索腾出空间。这是对 RAG 的一个有趣改进——传统 RAG 是贪心地放入 context，Context-1 学会了取舍。

## 我的判断

这三家的收敛不是偶然的。它在说：在 agentic 任务上，post-training（特别是 RL）是目前能花算力的最高性价比位置；从头做大 pretraining 来强化 agent 能力，相比在强基座上做针对性 RL，可能并不是最优路径。

对于想训练自己 domain-specific agent 的团队，这套范式有很强的参考价值：你需要的不是更大的预训练模型，而是在真实环境里的 RL rollout 基础设施，以及可自动化的 outcome reward。

> [Philipp Schmid 原文](https://www.philschmid.de/kimi-composer-context) | [Kimi K2.5 论文](https://arxiv.org/html/2602.02276v1) | [Cursor Composer 2 报告](https://arxiv.org/html/2603.24477v2)
