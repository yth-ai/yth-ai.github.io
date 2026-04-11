---
title: "用 18,000 条日志证明：Claude Code 的质量回退和 Thinking Redaction 直接相关"
description: "一位用户用 17871 个 thinking block 和 234760 条工具调用记录，量化了 Claude Code 从今年 2 月开始的质量下降——核心原因是 Anthropic 悄悄削减并最终完全隐藏了 extended thinking 的深度。"
date: 2026-04-07
category: "行业观察"
tags: ["Claude Code", "Anthropic", "Extended Thinking", "AI Coding", "模型质量", "工程实践"]
---

HN 上一个 GitHub issue 在过去 12 小时里拿到了 773 点赞和 471 条评论，标题是：

**"Claude Code is unusable for complex engineering tasks with the Feb updates"**

这类抱怨帖每周都有。但这次不一样——它附带了一份数据分析报告，用 **17,871 个 thinking block** 和 **234,760 条工具调用记录**，尝试量化到底发生了什么。

来源：[GitHub issue #42796](https://github.com/anthropics/claude-code/issues/42796)

## 他们发现了什么

这位用户的团队积累了 6,852 个 Claude Code 会话文件的日志，横跨今年 1 月底到 3 月。他们用 Claude 本身分析了这批日志，发现了一条清晰的时间线：

**Thinking Redaction 的推进节奏：**

| 时间段 | Thinking 可见 | Thinking 已被隐藏 |
|--------|-------------|----------------|
| 1/30 - 3/4 | 100% | 0% |
| 3/5 | 98.5% | 1.5% |
| 3/7 | 75.3% | 24.7% |
| 3/8 | 41.6% | 58.4% |
| 3/12+ | 0% | 100% |

质量回退的用户投诉独立开始于 3 月 8 日——恰好是 thinking redaction 比例首次过半的那天。

更早的问题：thinking 深度在 redaction 发生之前就已经开始下降：

> 2 月上旬基准：中位 ~2,200 字符的 thinking 内容；2 月底：~720 字符（-67%）；3 月以后：~600 字符（-73%）

也就是说，thinking 首先被缩短，然后才被完全隐藏。用户看到的是突然"变差了"，但变差其实更早就在发生。

## 工具调用行为的实质变化

最有说服力的是工具调用分析。他们追踪了 Read:Edit 比率（每次文件编辑之前读取了多少文件）：

| 时间段 | Read:Edit 比率 |
|--------|--------------|
| 1/30 - 2/12（基准） | 6.6 |
| 2/13 - 3/7（过渡期） | 2.8 |
| 3/8 - 3/23（退化后） | 2.0 |

也就是说：原来模型在改一个文件之前会先读 6.6 个相关文件（查上下文、grep 用法、看测试、看头文件），现在只读 2 个就直接动手了。

> "In the good period, the model's workflow was: read the target file, read related files, grep for usages across the codebase, read headers and tests, then make a precise edit. In the degraded period, it reads the immediate file and edits, often without checking context."

他们还构建了一个 stop hook（`stop-phrase-guard.sh`）来程序化捕捉"偷懒行为"（提前宣布完成、推卸责任、permission-seeking）。3 月 8 日之前：触发 0 次；3 月 8 日之后 17 天内：触发 173 次。

## 为什么这件事重要

这个案例有几点值得认真想：

**第一，Extended Thinking 对复杂工程任务是结构性依赖，不是可选项。** 在需要大量 research-before-edit 的工程场景里，削减 thinking token 等于削减了模型的"在行动前想清楚"的能力，而这恰恰是 LLM coding agent 最关键的部分。

**第二，Anthropic 的动机可以理解，但代价被用户感知到了。** 完全隐藏 thinking 降低了推理成本，也保护了模型内部状态不被用于对抗性攻击。但这个权衡对高强度工程用户来说是净负面的。

**第三，这是一个"基准测试过不了的退化"。** 在 SWE-bench 这样的公开基准上，这个变化可能并不明显——因为 SWE-bench 任务相对短平快。但在真实的长 session 工程场景里，退化非常明显。这提醒我们：公开 benchmark 不能完全代表用户实际体验。

**第四，用户现在能做这件事了。** 这份分析的存在本身很有意义——它说明用 AI 系统来分析 AI 系统的行为日志，已经成为一种切实可行的工程手段。他们用 Claude 分析 Claude 的日志。

## 后续

目前 Anthropic 尚未在该 issue 上发布官方回应。一些评论者指出，通过 API 直接使用 `claude-opus-4-5` 等模型并显式开启 extended thinking，可以部分绕过这个问题——但在 Claude Code 应用内这不是标准选项。

一个开放性问题：如果 thinking depth 和工程任务质量之间真的存在这样强的相关性，那么未来模型的评测体系，是否应该把"推理深度"纳入标准指标？

> 完整分析见：[GitHub Issue #42796](https://github.com/anthropics/claude-code/issues/42796) | HN 讨论：[item?id=47660925](https://news.ycombinator.com/item?id=47660925)
