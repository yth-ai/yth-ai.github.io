---
title: "Kimi、Cursor、Chroma 同时发布：产品级 Agentic RL 训练正在收敛到一套方法论"
description: "三家公司在同一个月各自发布 Agentic 模型技术报告，透露的训练方法惊人相似：在生产环境里做 RL、用 outcome-based reward、异步大规模 rollout。这可能是 2026 年最重要的工程范式。"
date: 2026-04-06
category: "工程实践"
tags: ["Agentic RL", "强化学习", "Agent", "Kimi", "Cursor", "Chroma", "工程实践"]
---

三月的最后一周，三家公司不约而同地发布了自己的 Agentic 模型技术报告：

- Moonshot AI 的 [Kimi K2.5](https://arxiv.org/html/2602.02276v1)（Agent Swarm + 并行子 agent 编排）
- Cursor 的 [Composer 2](https://arxiv.org/html/2603.24477v2)（生产流量实时 RL + 自总结长会话）
- Chroma 的 [Context-1](https://www.trychroma.com/research/context-1)（自编辑上下文的检索 subagent）

单独看每篇都有价值，但放在一起看更重要：**它们的训练方法几乎在收敛到同一套范式。** Philipp Schmid（Google DeepMind）[整理了这三篇报告](https://www.philschmid.de/kimi-composer-context)，对比读完之后，我想把最核心的工程判断提炼出来。

## 三家的共同选择

### 1. 从强底座出发，不从头训练

没有一家是从零开始做 Agentic 训练的：
- Kimi K2.5 在 Kimi K2（1T参数/32B active MoE）基础上继续训练
- Cursor Composer 2 直接从 Kimi K2.5 出发
- Chroma Context-1 从 gpt-oss-20B 出发

这个选择背后的逻辑是：Agentic 能力（工具使用、规划、容错）是在语言能力之上的，而不能替代它。

### 2. 在生产 harness 里做 RL rollout

三家都在和真实产品完全一致的环境里训练——相同的工具、相同的 prompt 格式、相同的系统消息。Cursor 甚至维护了一套 shadow backend 来确保训练时的工具行为和生产完全一致。

> "Composer 2 trains inside the exact same Cursor harness that users interact with: same tools, same prompt format, same system message, same file context."
> — Cursor Composer 2 Technical Report

这和传统的「先训练再部署」思路是反的：它们实际上是在「边部署边训练」，用真实任务分布做监督信号。

### 3. Outcome-based reward + GRM

都用**可验证的 outcome 作为主要 reward**（任务成功与否），同时引入 Generative Reward Models（GRM）处理开放性任务。GRM 不是简单的 binary judge，而是对照内部质量标准打细粒度分的评估器。

Kimi 还明确提到用多个不同 rubric 的 GRM 来减少 reward hacking——单一评估器容易被模型「钻空子」。

### 4. 异步、大规模 rollout 基础设施

Agent rollout 很贵，因为每个 trajectory 要实际执行工具调用（代码运行、网络搜索、文件操作）。三家都把大量工程投入放在如何并行生成 trajectory 上，以保证训练速度可接受。

## Kimi 最值得单独讲：PARL 和 Agent Swarm

Kimi K2.5 的独特之处在于它让模型**学会决定是否并行**，而不是手动编排并行。

核心机制是 PARL（Parallel-Agent Reinforcement Learning）：训练一个「编排者」模型，决定何时拆分任务、分派给几个并行 sub-agent、如何聚合结果。Sub-agent 的参数是冻结的，只有编排者在被优化——这解决了 credit assignment 的问题。

Reward 设计也很精巧：除了任务成功的主 reward，还加了两个辅助项：
- **并行化奖励**（r_parallel）：防止模型总是单 agent 执行
- **完成奖励**（r_finish）：防止模型为了拿并行奖励而乱开 sub-agent

训练后期，两个辅助 reward 的系数逐渐退火到 0，最终策略只优化任务成功。

效果是：在 BrowseComp 上从 60.6% 提升到 78.4%，超过 GPT-5.2 Pro（77.9%）；推理延迟降低 4.5x。

## Chroma 的另一个角度：上下文自编辑

Chroma Context-1 处理的是另一个 Agent 问题：**随着多轮检索，context window 会爆炸。**

它们的方案是训练一个 20B 的检索 subagent，专门负责搜索——不直接回答问题。这个模型在搜索过程中会主动**删除不相关的检索结果**，为后续搜索腾出空间。

这个「context rot」（上下文腐烂）的问题在实际部署里很常见，但很少被系统性处理。Chroma 的做法是把它变成一个可训练的行为：用合成数据生成多跳检索任务，用 RL 训练模型学会哪些内容值得保留。

最终 20B 的 Context-1 在检索任务上的表现和千亿级 frontier 模型相当，且推理成本只是后者的几分之一。

## 我的判断

这三篇报告合在一起，传递了一个清晰的信号：**Agentic RL 已经从研究阶段进入工程实践阶段**，而且大家都在用相似的工具箱。

这对工程师的启示是：如果你在做 Agent 产品，RL post-training 可能不再是「有条件再做」的锦上添花，而是「想做好就必须做」的基础设施。

而对于还没有足够训练资源的团队，这些开源权重（Chroma Context-1 在 Apache 2.0 下开放）提供了一个直接可用的起点——至少在检索这个子任务上。
