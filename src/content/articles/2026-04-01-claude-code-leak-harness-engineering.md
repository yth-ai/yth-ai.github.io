---
title: "Claude Code 泄露代码里，真正值得读的不是「Undercover Mode」"
description: "Claude Code 源码泄露后，舆论焦点放在了 AI 伪装行为上。但真正值得关注的，是这份代码展示了 context 工程已经达到了什么工业水准——以及为什么 harness 比模型本身更能解释性能差异。"
date: 2026-04-01
category: "工程实践"
tags: ["Claude Code", "Harness Engineering", "Context Engineering", "Agent", "Coding Agent"]
---

2026 年 3 月 31 日，Claude Code 的 TypeScript 源码在 GitHub 上被人发现并广泛传播。Anthropic 随后以 DMCA 发出了下架通知，但 HN 上那个讨论帖的 [856 分和 350 条评论](https://news.ycombinator.com/item?id=47586778) 已经说明，这件事不是一次普通的源码泄露。

争议主要集中在一个叫「Undercover Mode」的特性——提示词会要求模型不在 commit 信息和 PR 描述里提及「Claude Code」或表明自己是 AI。这个发现引发了一波关于 AI 透明度和信任的讨论。

但在我看来，这是最不重要的发现。

---

## Harness 不是辅助，它就是 Claude Code 本身

Sebastian Raschka 在 [3 月 31 日的博客](https://sebastianraschka.com/blog/2026/claude-code-secret-sauce.html) 里写道：

> "I believe the reason why Claude Code is so good is this software harness. Meaning that if we were to drop in other models such as DeepSeek, MiniMax, or Kimi, and optimize this a bit for these models, we would also have very strong coding performance over the plain model in the web UI."
> — Sebastian Raschka，[Claude Code's Real Secret Sauce Isn't the Model](https://sebastianraschka.com/blog/2026/claude-code-secret-sauce.html)

这个观点可以解释一个长期令人困惑的现象：同一个模型，在 Claude.ai 上写代码，和在 Claude Code 里写代码，感觉像两个不同的产品。不是模型变了，是 harness 变了。

泄露的代码里至少有六个工程细节，每一个都值得单独分析：

**1. 会话启动时的 Live Repo Context**

Claude Code 启动时会自动加载：main 分支状态、当前 git branch、最近 commits、CLAUDE.md 内容。这不是「给模型上下文」，这是「让模型理解你正处在哪个代码故事里」。没有这个，模型每次都是在真空里回答你的问题。

**2. 激进的 Prompt Cache 复用**

代码里有一个边界标记，把 prompt 分成静态部分和动态部分。静态部分（仓库结构、系统规范）会被全局缓存，不会在每次对话轮次里重新处理。这背后是一个很实际的判断：最贵的 token 是重复读的 token。

**3. 专用工具替代 Bash 调用**

有独立的 Grep 工具和 Glob 工具，用于文件搜索和目录发现。还有一个 LSP（Language Server Protocol）工具，支持调用层级分析、引用查找、符号跳转。

这个设计的意义在于：它把代码仓库从「静态文本」变成了「可以被查询的结构化知识库」。Chat UI 里上传文件，模型看到的是一堆字符串；Claude Code 里，模型可以问「哪个函数调用了这个接口」，然后真的拿到答案。

**4. 上下文体积控制**

有文件读取去重逻辑——如果一个文件在会话中已经读取过且未修改，不会重复加入上下文。工具返回的超长结果会被写入磁盘，context 里只保留预览和文件引用路径。必要时会触发自动压缩（summarization）。

这是一套主动控制信噪比的机制，目的只有一个：让模型在有限的 context window 里看到最有用的信息。

**5. 结构化会话记忆**

不是「所有对话历史」，而是一个结构化的 Markdown 文件，包含：Session Title、Current State、Task Specification、Files and Functions、Workflow、Errors & Corrections、Learnings、Key Results、Worklog。

这个结构之所以有效，是因为它解决了 LLM 做长任务时最常见的失败模式：**在第 20 步时忘了第 1 步的约束条件**。结构化记忆让「已知约束」和「当前状态」始终显式存在于 context 里。

**6. 分叉子 Agent + 缓存继承**

并行子 Agent 是已知特性，但有一个细节：分叉出的子 Agent 会复用父 Agent 的缓存，同时感知可变状态。这意味着子 Agent 做摘要、记忆提取、后台分析时，不需要重新处理所有上下文——它继承了父 Agent 的「记忆」，只需要关注自己的增量任务。

---

## 这对 Agent 开发者意味着什么

Claude Code 的工程设计，实际上是在问一个问题：**对于一个长任务编码 Agent，什么信息在什么时机进入模型，才能最大化每一步的决策质量？**

它的答案是：
- 启动时，提供仓库故事（git + CLAUDE.md）
- 每次工具调用，提供结构化结果而非原始文本
- 会话推进时，维护结构化状态摘要
- 上下文膨胀时，主动压缩而不是截断

这和当前很多 agent 框架的设计哲学有本质区别。大多数框架在讨论「工具调用格式」「ReAct 还是 Plan & Execute」，而 Claude Code 在讨论「每个 token 应该带多少信息密度」。

Raschka 的结论是：如果把同样的 harness 套在 DeepSeek 或 Kimi 上，并针对性地调优，性能差距会大幅缩小。我倾向于同意这个判断，但我会补充一点：这个 harness 本身就是 Anthropic 若干年工程迭代的产物，它的每一个设计决策背后都有真实的失败案例。

---

真正让 Claude Code「好用」的东西现在是公开的——不是模型，是这套 context 管理系统。这也许是这次泄露最有价值的意外收获：它让 harness 工程的重要性从「行业共识」变成了「可以被检验的代码」。
