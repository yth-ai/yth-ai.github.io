---
title: "Vibe Coding 的统计账单"
description: "84% 的开发者在用 AI 生成代码，45% 的 AI 代码有安全漏洞，只有 29% 的人信任它。Gartner 预测 40% 的 Vibe Coding 项目将因技术债务被取消。这不是危言耸听，是目前可查到的真实数据。"
date: 2026-03-29
category: "观点"
tags: ["Vibe Coding", "技术债务", "AI代码质量", "软件工程", "安全漏洞", "Karpathy"]
---

「Vibe Coding」这个词是 Andrej Karpathy 在 2025 年初造的——用自然语言描述你想要什么，让 AI 写代码，你不需要真正理解代码在做什么，只要感觉对就行。

一年后，有了数据。

---

## 数字说什么

几组可查来源的数据：

- **84%** 的开发者已经采用 Vibe Coding 或类似的 AI 辅助开发方式（[Pixelmojo 2026 调研](https://www.pixelmojo.io/blogs/vibe-coding-technical-debt-crisis-2026-2027)）
- 只有 **29%** 的人表示信任 AI 生成的代码（同上）
- **45%** 的 AI 生成代码包含安全漏洞（[Georgetown 研究](https://www.hungyichen.com/en/insights/vibe-coding-software-engineering-crisis)；[Veracode 的数字类似](https://www.veracode.com/resources/state-of-software-security)）
- [GitClear 数据](https://www.gitclear.com/coding_on_copilot_data_shows_ais_downward_pressure_on_code_quality)：代码库中 copy-paste 式代码增加了 **48%**，代码重复率上升
- [METR 研究](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-devs/)：资深开发者使用 AI 辅助工具后，速度比独立完成慢 **19%**
- Gartner 预测：**40%** 的 Vibe Coding 项目将因技术债务在 2027 年前被取消或重写（[Getbeam 引用](https://getbeam.dev/blog/ai-technical-debt-vibe-coding.html)）

这些数字放在一起有点奇怪：大家都在用，大家都知道有问题，但没有人停下来。

---

## 为什么会有「慢 19%」

METR 研究里资深开发者用 AI 反而更慢这个发现，值得多想一秒。

一个可能的解释：**AI 生成代码的审查成本被低估了**。对新手来说，AI 代码是一个加速器——它生成的内容比他们自己写的好。但对有经验的开发者来说，他们知道自己在看什么，知道这段代码在更大系统里意味着什么，知道哪些假设是错的——所以他们花时间审查、修改、重写。净效果是负的。

另一个角度：**Vibe Coding 的生产力增益是真实的，但它是通过推迟决策实现的**。AI 帮你快速完成了「能跑起来」，但省掉的是设计时间——而这些时间的债务会在后期以 bug、重构、安全漏洞的形式还回来。

这和「快速原型」的逻辑是一样的：快速原型的价值在于验证想法，但把原型当正式产品发布是另一回事。

---

## 技术债务的结构性问题

Gartner 的「40% 项目将被取消」预测听起来很夸张，但它指向一个结构性问题：

> "AI-generated code lowers the cost of creating code, but it doesn't lower the cost of understanding it."
> — [Hungyichen 分析](https://www.hungyichen.com/en/insights/vibe-coding-software-engineering-crisis)

**AI 生成代码降低了创建代码的成本，但没有降低理解代码的成本。**

你可以在几小时内 vibe code 出一个有几千行代码的系统，但没有人真正理解这些代码是怎么工作的。一旦需要修改核心逻辑、排查复杂 bug、进行性能优化——你面对的是一大片没有人懂的代码。

软件工程里一直有「可以写出来但没人能维护」的代码。AI 只是大幅降低了产生这类代码的门槛，并且在规模上放大了它。

---

## 没有简单答案，但有一个清醒的态度

一个比较诚实的区分：

**Vibe Coding 是一个很好的探索工具，是一个危险的生产工具。**

用它快速验证想法、搭建原型、自动化重复性工作——价值是真实的。用它构建你会长期维护的、有安全要求的、多人协作的系统——风险是可以量化的。

「84% 的开发者在用，只有 29% 信任它」这个数字里有一个值得深思的东西：我们正在大规模使用一个大多数使用者自己不信任的工具。这种状态通常不会持续太久，要么工具变得可信，要么我们停止使用。

目前看来两件事都在发生：模型代码质量在快速提升，同时也有越来越多的团队在学到足够多的教训之后重新建立工程规范。

竞争优势不是用 AI 写代码，而是知道什么时候不用。
