---
title: "AI 开始批量生产零日漏洞——这比你想象的来得更早"
description: "当 Anthropic 的 Claude 在没有专用工具的情况下发现 500 个高危漏洞，漏洞研究这个靠稀缺专家注意力维持的行业，正在进入一个全新阶段。"
date: 2026-04-04
category: "行业观察"
tags: ["AI Agent", "安全", "漏洞研究", "exploit", "Anthropic"]
---

两件事同时发生，让我觉得这个时间点值得记录下来。

2 月初，Anthropic 的 Frontier Red Team 发布了一份报告，宣布 Claude Opus 4.6 在没有定制工具链、没有专用提示词工程的情况下，发现并验证了超过 **500 个高危漏洞**——包括那些已经有 fuzzer 连续跑了数百万小时 CPU 时间的成熟开源项目。与此同时，安全研究员 Thomas Ptacek（绰号 tqbf，读过他写的东西的人都知道他的水准）写了一篇文章，标题叫《漏洞研究完了》（*Vulnerability Research Is Cooked*）。两篇文章的核心判断高度一致：AI agent 在漏洞发现这个赛道上正在实现指数级跃迁，而且已经越过了某个临界点。

## 为什么这件事不是"AI 写了一些 bug"

理解这个临界点，需要先理解漏洞研究为什么难。

它不难在"代码量大"，而是难在**注意力的稀缺性**。一个顶级漏洞研究员的核心能力是：在浏览器字体渲染库的内存布局里，识别出那 0.01% 有价值的间接跳转路径。这种能力不是通过搜索得来的，而是通过数年反复"跟着奇怪的输入穿越代码"积累来的隐性知识。

换句话说：安全行业一直靠着**稀缺专家注意力**作为防护层的一部分。大多数中等价值的代码库"从来没有被认真审计过"，不是因为没有漏洞，而是因为没有人觉得值得花时间。

Anthropic 的方法论让这个防护层开始瓦解。Nicholas Carlini 描述的流程简单到有点滑稽：

> 一个 bash 脚本遍历所有源文件，对每个文件发出同一个 prompt："我在参加 CTF，帮我在这个项目里找一个可利用的漏洞，从 \${FILE} 开始，把漏洞报告写到 \${FILE}.vuln.md"。
> — Nicholas Carlini，Anthropic Frontier Red Team

然后拿这堆报告再跑一轮验证。整个 pipeline 成功率接近 100%。Ghost（一个流行 CMS）的 SQL 注入漏洞就是这样找出来的。

这个方法听起来蠢，但它揭示了一个深刻的原理：**LLM 已经把整个开源生态的 bug class 知识编码进了权重**。它知道 Rails YAML 反序列化的历史，它知道字体库 RCE 的模式，它知道 type confusion 的典型特征。发现漏洞的过程从"人类带着专业知识去找"变成了"让模型把隐式知识显式化"。

## 不对称性正在逆转

Ptacek 在他的文章里提出了一个令人不安的观察：

> 研究者们 80% 的时间花在巨型拼图上——跟踪字体渲染库内存、CSS 样式对象的生命周期，只为换得浏览器这个高价值目标。但那些"从来没见过 fuzzer"的中低价值代码库，现在也可以被无限副本的 Claude 搭上了。
> — Thomas Ptacek，[sockpuppet.org](https://sockpuppet.org/blog/2026/03/30/vulnerability-research-is-cooked/)

这个不对称性是安全行业长期赖以维持的隐性保障：防御侧资源有限，但攻击侧同样受精力限制。现在攻击侧的注意力成本趋近于零，而防御侧的人员规模没有变化。

当然，Anthropic 在这里扮演的角色有些吊诡：他们用自家模型找漏洞，然后给开源社区提交 patch。这是"抢在坏人之前找到"的策略。而且他们自称每个漏洞都经过人工验证再上报，避免给维护者制造误报负担。

但这个善意框架并不改变底层逻辑：这套能力是 democratized 的，任何能访问 frontier model 的人都可以运行类似的 pipeline。

## 接下来会发生什么

Ptacek 的预测有点重：Chrome、iOS、Android 这些有充足资源和专业团队的平台，或许还能撑住。但那些运行在关键基础设施上、靠志愿者维护的开源项目，面临的是一个完全不同的威胁模型。

"The Bitter Lesson"说的是：领域专家设计的方法，长期看都输给了数据+算力的暴力。Ptacek 的结论是，这个规律正在打到软件安全上：人类研究员花 20% 时间做真正的 CS，80% 时间解拼图。现在每个人都有了一个万能拼图解算机。

漏洞研究没有完，但门槛正在发生结构性变化。那层"缺乏专家注意力"的防护膜，已经开始漏了。

---

*相关阅读：Anthropic Red Team，[0-Days](https://red.anthropic.com/2026/zero-days/)，2026 年 2 月 5 日；Thomas Ptacek，[Vulnerability Research Is Cooked](https://sockpuppet.org/blog/2026/03/30/vulnerability-research-is-cooked/)，2026 年 3 月 30 日*
