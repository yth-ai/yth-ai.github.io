---
title: "Anthropic 决定不发布 Mythos：当 AI 能找漏洞比所有人都强"
description: "Claude Mythos 在几周内发现了数千个 zero-day 漏洞——Anthropic 选择限制分发而非公开发布，这个决定背后是一个更深的问题：AI 安全能力拐点已经到来。"
date: 2026-04-08
category: "行业观察"
tags: ["Anthropic", "AI安全", "漏洞挖掘", "前沿模型", "网络安全"]
---

## Anthropic 决定不发布 Mythos：当 AI 能找漏洞比所有人都强

昨天，Anthropic 发布了一个新模型——但没有真正"发布"它。

Claude Mythos Preview 现在只向 12 家合作机构开放，包括 Amazon、Apple、Microsoft、Google、Cisco、CrowdStrike 和 Linux Foundation。同时，另有超过 40 家组织获得受限访问权限，承诺用于防御性安全工作。Anthropic 还专门启动了名为 [Project Glasswing](https://www.anthropic.com/glasswing) 的行动，承诺投入 1 亿美元使用额度和 400 万美元捐款给开源安全组织。

他们的理由不是商业考量，而是一句很直白的话：

> "AI models have reached a level of coding capability where they can surpass all but the most skilled humans at finding and exploiting software vulnerabilities."
> — Anthropic，[Project Glasswing 声明](https://www.anthropic.com/glasswing)

这不是公关话术。Mythos Preview 在几周内自主发现了"每个主要操作系统和每个主要浏览器"中的数千个 zero-day 漏洞，其中许多漏洞已经存在了数十年。

---

### 能力差异有多大？

Anthropic 在红队博客上给出了量化对比。针对 Firefox 147 JavaScript 引擎中已修复的漏洞：

- Claude 4.6 Opus：数百次尝试中，成功开发可用 exploit 仅 **2 次**
- Claude Mythos Preview：成功 **181 次**，另有 29 次实现了寄存器控制

差距不是 10%，是数量级。

更让人印象深刻的是自主链式漏洞利用能力。据 Anthropic 红队成员 Nicholas Carlini 描述：

> "It has the ability to chain together vulnerabilities. So what this means is you find two vulnerabilities, either of which doesn't really get you very much independently. But this model is able to create exploits out of three, four, or sometimes five vulnerabilities that in sequence give you some kind of very sophisticated end outcome."
> — Nicholas Carlini，[Glasswing 视频](https://www.youtube.com/watch?v=INGOC6-LLv0)

Mythos 还能自主写出四个漏洞链式的浏览器 exploit，包括复杂的 JIT heap spray，可以逃脱渲染器和 OS 沙箱。在 FreeBSD NFS 服务器上，它开发了一个通过 20-gadget ROP chain 分割多包传输的远程代码执行 exploit。

一个具体例子：在 OpenBSD 上，它发现了一个存在 **27 年**的 bug——只需发送几个数据包就能让任意 OpenBSD 服务器崩溃。

---

### 从业者的信号早已出现

这不是 Anthropic 一家在说。Simon Willison 几天前刚开设了专门的 [ai-security-research](https://simonwillison.net/tags/ai-security-research/) 标签，原因是他观察到安全专业人员发出的告警声明显增多。

Linux 内核维护者 Greg Kroah-Hartman 的描述最为生动：

> "Months ago, we were getting what we called 'AI slop,' AI-generated security reports that were obviously wrong or low quality. It was kind of funny. It didn't really worry us. Something happened a month ago, and the world switched. Now we have real reports."
> — Greg Kroah-Hartman，[The Register 采访](https://www.theregister.com/2026/03/26/greg_kroahhartman_ai_kernel/)

curl 作者 Daniel Stenberg 也说：

> "The challenge with AI in open source security has transitioned from an AI slop tsunami into more of a plain security report tsunami. Less slop but lots of reports. Many of them really good. I'm spending hours per day on this now."

这场转变不是渐进的，他们都用了"something switched"这种表达。

---

### 这件事的真正含义

Anthropic 今天做的事情，本质上是第一次公开说：**我们做出了一个我们觉得太危险而不能发布的模型**。

这和之前那种模糊的"我们非常谨慎"的安全表态不同。这一次有具体证据：已修复的 zero-day 漏洞列表、红队评估数字、跨机构协作行动。

当然，Simon Willison 也提到了这里有一定的营销价值——"saying our model is too dangerous to release is a great way to build buzz"。但他接着说，他相信这次的谨慎是合理的。

更值得关注的是 Anthropic 自己说的时间窗口：

> "Given the rate of AI progress, it will not be long before such capabilities proliferate, potentially beyond actors who are committed to deploying them safely."

这不是"几年后"的事，是"几个月"的尺度。

**防守的窗口正在关闭。** Project Glasswing 是一次试图在窗口关上之前冲进去的行动。它能否成功，取决于这 50 多家机构能不能在攻防对称被打破之前，把已知漏洞修掉足够多。

一个值得追踪的数字：Anthropic 说 Mythos 发现了数千个 zero-day。如果这些都被修复，那是真实的防御贡献；如果修复速度远低于发现速度，那这个 gap 就是下一个威胁的来源。
