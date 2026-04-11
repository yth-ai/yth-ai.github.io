---
title: "三家公司各自发现了同一件事：在生产 Harness 里跑 RL"
description: "Kimi、Cursor、Chroma 在同一个月各自发布了 agentic RL 训练技术报告，核心方法惊人相似：从强 base 出发，在真实生产环境中做 RL rollout，用可验证的 outcome 做 reward。"
date: 2026-03-30
category: "技术前沿"
tags: ["强化学习", "Agentic模型", "训练方法", "Kimi", "Cursor", "Chroma"]
---

三月底，一个值得记录的现象出现了：Kimi（[K2.5 论文](https://arxiv.org/abs/2602.02276)）、Cursor（[Composer 2 技术报告](https://arxiv.org/abs/2603.24477) + [博客](https://cursor.com/blog/real-time-rl-for-composer)）、Chroma（[Context-1 报告](https://www.trychroma.com/research/context-1)）在几乎同一时间段各自发布了 agentic 模型的 RL 训练报告。

它们的研究方向毫无交集：Kimi 在做多模态 visual agent、Cursor 在做代码编辑 agent、Chroma 在做 RAG 上下文压缩。但三份报告读下来，方法论的核心几乎一模一样。这不是巧合，是这个方向走向成熟的信号。

## 同一个 recipe 的三个变种

Philipp Schmid（Google DeepMind）在 [3 月 28 日的博客文章](https://www.philschmid.de/kimi-composer-context)里对三份报告做了对比分析。核心方法论可以归纳为四点：

**从强 base 出发，不从头训练。** Moonshot 在 Kimi K2 基础上做多模态扩展；Cursor 直接从 Kimi K2.5（1T 参数 / 32B active 的 MoE）出发；Chroma 从 gpt-oss-20B 出发。没有一家是从头训练 agentic 能力的——他们都在一个已经很强的 base 上做 RL fine-tune。

**在生产 harness 里跑 rollout，不用简化的 benchmark 环境。** Cursor 维护了一套和线上完全相同的 shadow 后端，RL rollout 用的工具、prompt 格式、系统消息都和用户真实看到的一样。Kimi 在真实的多 agent 调度框架里训练。Chroma 在真实 RAG pipeline 里训练上下文自编辑能力。这一点极其重要：SWE-bench 这类公开 benchmark 的任务描述过度具体，prompt 过于清晰——而真实的开发者请求是欠规范的、模糊的，问题空间是开放的。

**用可验证的 outcome 做 reward，辅以 Generative Reward Model（GRM）处理开放任务。** 数学题有标准答案，代码有测试用例——这些是可以程序化验证的。对于更主观的任务（风格、帮助性、复杂指令遵循），三家都引入了 GRM：不是二元通过/失败的判断器，而是细粒度的多维度评估，且用多个 GRM rubric 交叉验证来对抗 reward hacking。

**大规模异步并行 rollout 的基础设施投入。** Agent rollout 比标准语言模型 rollout 昂贵得多（每次 rollout 包含多轮工具调用）。三家都在 infra 上有重大投入：Cursor 用 Firecracker VM 支持每秒 500+ pod 调度，用文件系统快照实现中途 checkpoint；Kimi 引入「critical steps」度量（并行执行中最长执行链的步数），替代串行场景下的简单步数计数；Chroma 没有公开 infra 细节但规模不小。

## Kimi 的 PARL：让并行化本身成为可学习的策略

Kimi K2.5 最值得单独说的是 Agent Swarm 机制和支撑它的 PARL（Parallel-Agent Reinforcement Learning）框架。

大多数 agentic 系统是串行的：想 → 调用工具 → 观察 → 想 → 调用工具。Kimi 训练的是「何时分裂出并行子 agent、分裂多少个、分配什么任务」——这个并行化策略本身是通过 RL 学出来的，不是手写的规则。

实现上，有两个角色：Orchestrator（可训练，负责任务分解和结果聚合，配备 `create_subagent` 和 `assign_task` 工具）和 Sub-agents（参数冻结，只执行分配的子任务）。把 sub-agent 冻结是关键设计：在端到端联合优化里，「最终答案正确」这个信号是模糊的——可能是 orchestrator 分解得好，也可能是某个 sub-agent 运气好。冻结 sub-agent、把它的输出当作环境观测，只优化 orchestrator，才能清晰归因。

奖励设计有三项：任务完成奖励（r_perf，主信号）、并行化奖励（r_parallel，防止模型学会「反正串行也能做就不分裂」的局部最优）、完成奖励（r_finish，防止「为了拿并行奖励而无意义地分裂大量 agent」的 reward hacking）。后两项的系数在训练后期被 anneal 到零，最终策略只优化任务完成。

结果是 BrowseComp 上 78.4% 的准确率（单 agent 是 60.6%，GPT-5.2 Pro 是 77.9%），inference latency 降低最多 4.5x。

## Cursor 的 CursorBench：当 benchmark 跟着产品一起进化

Cursor 的一个细节让我印象深刻：他们构建了 CursorBench，一套从工程师真实编码 session 里取样的内部 benchmark。

这个 benchmark 的任务中位数修改量是 181 行代码——而 SWE-bench 是 7-10 行。CursorBench 的 prompt 更短、更模糊；SWE-bench 的 issue 描述更详细、更清晰。更重要的是，CursorBench **跟着产品进化**：随着用户开始让 agent 做更复杂的事情，benchmark 也增加更难的任务。训练目标和用户行为是耦合的。

> "Public benchmarks use simplified environments and over-specified prompts. Real developer requests are under-specified, messy, and admit multiple valid solutions."
> — Cursor Research, [Composer 2 Technical Report](https://arxiv.org/abs/2603.24477)

这句话也适用于 Kimi 和 Chroma。三家都在说同一件事：公开 benchmark 和真实场景之间的分布差距，已经大到不能忽略了。

## 一个还没有答案的问题

三份报告里，有一件事被有意回避了：**这套 RL recipe 需要多少算力？**

从 Cursor 的 infra 细节来看（Firecracker VM、每秒 500+ pod、与 Fireworks AI 合作做 RL inference、每个 training step 都做 weight sync），规模不小。Kimi 的「大规模异步并行 rollout」同样代价不菲。这套方法是否只对有能力维持这种 infra 投入的大公司才可行？对于资源有限的团队，哪些部分是可以裁剪的？

三份报告都没有回答这个问题。这不是批评，只是提醒：这套 recipe 的成功，部分来自工程投入本身，不只是方法的精妙。
