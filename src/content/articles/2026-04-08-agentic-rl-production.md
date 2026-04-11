---
title: "三家公司同时用 RL 训练 Agent：2026 年的 Agentic RL 实践共识"
description: "Kimi K2.5、Cursor Composer 2、Chroma Context-1 在同一时期发布技术报告，都选择了从生产环境运行 RL rollout 训练 Agent 模型——这个方法论的汇聚说明了什么？"
date: 2026-04-08
category: "工程实践"
tags: ["强化学习", "Agent训练", "Kimi", "Cursor", "工程实践", "PARL"]
---

## 三家公司同时用 RL 训练 Agent：2026 年的 Agentic RL 实践共识

三份技术报告，三家完全不同的公司，三种不同的产品形态——但方法论几乎相同。

Moonshot AI 的 [Kimi K2.5](https://arxiv.org/html/2602.02276v1)（多模态 Agent）、Cursor 的 [Composer 2](https://arxiv.org/html/2603.24477v2)（代码 Agent）、Chroma 的 [Context-1](https://www.trychroma.com/research/context-1)（检索 Agent）——Philipp Schmid 在他的 [3 月 28 日文章](https://www.philschmid.de/kimi-composer-context)中并排分析了这三份报告。

看完之后，有一种"这件事已经被工业界想清楚了"的感觉。

---

### 共同框架：四个要素

这三家的方法论可以提炼成四个共性：

**1. 从强基础模型出发，不从头训练**

没有人从零开始。Moonshot 在 Kimi K2 基础上增加多模态预训练，Cursor 从 Kimi K2.5 起步（1T 参数 / 32B 激活的 MoE），Chroma 从 gpt-oss-20B 出发。这本身就是一个信号：Agent 训练已经是"在巨人肩膀上做 RL"而不是重新构建能力。

**2. 在生产 Harness 内部运行 RL rollout**

这是核心差异。不是离线数据集，而是让模型在真实的工具调用环境、真实的代码执行器、真实的检索系统里生成轨迹，然后对这些轨迹做强化学习。

> "Each team runs RL rollouts through the same tools, prompts, and execution environments that their model encounters in production."
> — Philipp Schmid，[How Kimi, Cursor, and Chroma Train Agentic Models with RL](https://www.philschmid.de/kimi-composer-context)

Cursor 甚至做到了实时 RL：直接从生产流量中采集轨迹，有成功有失败，实时反馈回训练。这意味着每个用 Cursor 的工程师，都在某种意义上参与了模型的训练。

**3. Outcome-based rewards + Generative Reward Model（GRM）**

奖励设计上，所有三家都使用可验证的结果信号（代码能不能跑、任务完成了没有）作为主要 reward，同时对开放式任务使用 GRM——用另一个大模型来评判输出质量，包括风格、合规性等。

**4. 大规模异步 rollout 基础设施**

Agent rollout 很贵。一次 trajectory 可能需要几百步工具调用。这三家都投入了大量工程资源做并行 rollout 基础设施。Kimi 的技术报告里专门引入了"critical steps"的概念——用最长执行链而不是总步数来衡量并行 Agent 的计算成本，这让 orchestrator 有了正确的优化目标。

---

### Kimi 的特别贡献：PARL 和 Agent Swarm

Kimi K2.5 最有意思的地方是 PARL（Parallel-Agent Reinforcement Learning）——让模型学会把任务分解给并行 sub-agents 执行。这个并行化策略不是人为设计的，而是通过 RL 训练出来的。

Reward 设计里有一个防退化机制：
- `r_parallel`：鼓励生成 sub-agents，防止模型退化成串行执行（"serial collapse"）
- `r_finish`：奖励子任务完成，防止为了拿 r_parallel 而产生"虚假并行"（生成很多 sub-agents 但没有真正分工）
- 随着训练进行，辅助 reward 系数退火到零，最终只保留任务完成信号

最终效果：Kimi K2.5 在复杂多源任务上，推理延迟降低了 4.5 倍。并行化不是为了炫技，而是让 wall-clock latency 真实下降。

---

### Chroma 的特别贡献：模型自己管理上下文

Context-1 解决的问题不同：不是"如何分解任务"，而是"如何在有限上下文窗口里做更多搜索"。它训练模型在检索之后主动裁剪已经不再需要的文档，释放空间给下一轮搜索。

这是一个很有意思的方向——把上下文管理从"用户/应用层"的职责，变成模型本身的能力。模型知道什么时候可以扔掉什么。

---

### Cursor 的特别贡献：实时 RL + 自我摘要

Cursor Composer 2 的两个特色：

一是用自我摘要（self-summarization）处理长编码会话——当上下文窗口快满时，模型不是截断历史，而是对之前的工作进行结构化摘要，保留关键决策和代码状态。

二是实时 RL：从真实用户的成功和失败会话中采集信号，反馈回模型训练。这个闭环让 Cursor 可以持续改进，而不需要等到下次大的训练迭代。

---

### 为什么三家同时做、方法论汇聚？

我的解读：这说明 Agentic RL 已经从"研究阶段"进入"工程验证完成"的阶段。

不是因为这三家互相抄答案，而是因为这个问题的解空间本来就比较收窄：你必须在生产环境里运行（不然分布不匹配），你必须有可验证的 reward（不然信号噪声太大），你必须解决基础设施规模问题（不然 rollout 成本太高）。做完这些约束，剩下的选项就不多了。

Sebastian Raschka 在 4 月 4 日的 [Components of a Coding Agent](https://magazine.sebastianraschka.com/p/components-of-a-coding-agent) 中把这个问题框架说得很清楚：模型是引擎，Agent harness 是让引擎真正跑起来的一切。而现在，harness 本身也开始被 RL 训练优化了。

**接下来值得关注的问题**：当这个训练范式普及，模型和 harness 的边界会越来越模糊。什么是"模型的能力"，什么是"系统的能力"？在 production RL 的情况下，这个答案每天都在变。
