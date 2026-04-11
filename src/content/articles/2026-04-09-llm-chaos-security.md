---
title: "LLM 是混沌系统：这件事正在重写安全边界"
description: "软件安全界关于 LLM 本质的一场深刻讨论：模型的混沌特性不是 bug，是 feature，而这意味着 AI 时代的安全攻防规则已经被根本性地改变"
date: 2026-04-09
category: "行业观察"
tags: ["安全", "LLM", "混沌系统", "Agent", "提示注入", "内存投毒"]
---

这周 HN 有一篇文章冲上了 380+ 赞、420+ 评论，标题叫 "The Future of Everything is Lies, I Guess"。

作者是 aphyr，分布式系统领域的老炮，写 Jepsen 测试框架那位。他不是 AI 研究员，但他对 LLM 混沌特性的分析，读完让人后背发凉。

## LLM 是混沌系统，这不是比喻

aphyr 在系列文章 [Dynamics](https://aphyr.com/posts/412-the-future-of-everything-is-lies-i-guess-dynamics) 一章里提出了一个被很多人忽视的基本事实：**LLM 是混沌系统。**

不是隐喻意义上的，是字面意义上的：输入的微小扰动会导致输出的不可预测的大幅变化。

> "LLMs are highly sensitive to changes in formatting... Simply phrasing a question differently yields strikingly different results. Rearranging the order of sentences, even when logically independent, makes LLMs give different answers."
> — aphyr, [The Future of Everything is Lies, I Guess: Dynamics](https://aphyr.com/posts/412-the-future-of-everything-is-lies-i-guess-dynamics)

这已经有严格的论文支撑。[arXiv:2310.11324](https://arxiv.org/pdf/2310.11324) 专门研究格式变化对 LLM 输出的影响；[arXiv:2502.04134](https://arxiv.org/html/2502.04134v1) 发现句子排列顺序能改变答案；甚至多 LLM 系统在 T=0 完全确定性的情况下仍然是混沌的。

这个性质的后果是灾难性的：**因为输入空间里充满了人类不可见的"触发器"，攻击面几乎是无限的。**

## 五种你可能没想到的攻击向量

aphyr 列出了一系列利用 LLM 混沌特性的攻击方式，每一种都已有研究文献支撑：

**1. 像素翻转** — 图像中翻转单个像素就能让计算机视觉系统分类错误（[arXiv:1710.08864](https://arxiv.org/abs/1710.08864)）

**2. 同义词替换** — 把词换成语义等价的同义词，可以让 LLM 给出完全错误的答案（[Lilian Weng, 2023](https://lilianweng.github.io/posts/2023-10-25-adv-attack-llm/)）

**3. 不可见 Unicode** — 在代码仓库或社交账号 bio 中藏入不可见的 Unicode 字符，当 LLM 读取后执行恶意指令

**4. 训练数据投毒** — 发布被污染的网页，等待 LLM 厂商把它纳入训练集（[arXiv:2505.01177](https://arxiv.org/html/2505.01177v1)）

**5. Agent 内存投毒** — 这是本周最新出现的研究方向，下面单独说

## ArXiv 本周：Agent 内存投毒的两个新研究

就在 aphyr 文章引发 HN 热议的同一周，ArXiv 出现了两篇高度相关的论文：

**"Poison Once, Exploit Forever"**（[arXiv, 2026-04-07](https://arxiv.org/search/?searchtype=all&query=memory+poisoning+web+agent&start=0)）由 Amazon 和 Amazon Web Services 研究人员发表。核心发现是：记忆模块让 LLM Web Agent 变得更强大，但同时创造了一个跨会话、跨网站的持久性攻击面。攻击者只需要在某个网站嵌入一次恶意指令，这个指令就会被 Agent 存入长期记忆，在未来所有任务中持续生效——**即使那个网站早已不在浏览历史里**。

**"Zombie Agents: Persistent Control of Self-Evolving LLM Agents via Self-Reinforcing Injections"**（[arXiv, 2026-02](https://arxiv.org/search/?searchtype=all&query=zombie+agent+self-reinforcing+injection&start=0)）则更进一步：如果 Agent 会自我进化、不断更新自己的行为策略，那么攻击者可以注入一个"自我强化"的指令——Agent 每次优化自己时，这条恶意指令会变得更根深蒂固，最终完全控制 Agent 的行为。

**这就是 aphyr 说的"illegible hazards"（不可见危险）的典型形态：攻击发生的时候，你根本看不出来。**

## 为什么这是新问题，而不是老问题的延伸

传统软件安全的核心假设是：系统有一个清晰的"受信任"和"不受信任"的边界。浏览器的沙箱机制就是这个思路的产物——把外部网页隔离在沙盒里，不让它们直接访问本地资源。

但 LLM Agent 打破了这个假设。aphyr 的比喻很精准：

> "LLMs have only weak boundaries between trusted and untrusted input. Moreover, they are usually trained on, and given as input during inference, random web pages."

一个能浏览网页的 Agent，它的"信任边界"在哪里？每一个它读过的页面都是潜在的攻击面。更糟糕的是，如果 Agent 还有持久化的记忆——正如"Poison Once, Exploit Forever"所证明的那样——那么攻击面是跨时间的，不是单次的。

## 这像 1990 年代的互联网安全

aphyr 给出了一个绝妙的历史类比：

> "It feels a bit like computer security in the 1990s, before people really understood the attack surface of networked systems."

1990 年代，工程师们在设计网络服务时根本没有认真考虑安全问题，因为大家都在摸索。后来用了二十年时间，才逐渐建立起一套包括沙箱、HTTPS、CSP、权限模型在内的防御体系。

现在的 AI Agent 生态，基本上就是 1990 年代的状态。"Model skills are just Markdown files with vague English instructions"——这是今天的技术现实，也是今天所有 Agent 框架设计者都面对的隐患。

Project Glasswing 里 Claude Mythos 发现的那些漏洞，很多就来自于"人类从未系统性地检查过"的代码区域。AI 让漏洞被发现的速度前所未有地快——但利用漏洞的速度会以同样的曲线加速。

防守方需要比进攻方快一步。现在还差很多。
