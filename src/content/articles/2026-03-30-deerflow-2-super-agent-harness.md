---
title: "DeerFlow 2.0 深度解析：一个被浪费的训练数据工厂"
description: "字节跳动的 Super Agent 框架在数据工程视角下的价值：Skills系统、沙箱执行和多代理调度，意外地构成了一套完整的训练数据生产基础设施——如果有人愿意开始记录的话。"
date: 2026-03-30
tags: ["DeerFlow", "Agent框架", "训练数据", "Super Agent", "Harness Engineering", "数据工程"]
---

字节跳动在 2026 年 2 月 28 日开源了 [DeerFlow 2.0](https://github.com/bytedance/deer-flow)，发布当天登上 GitHub Trending 第一，目前 22,000+ Stars。这是一次完整重写——与 v1.0 零共享代码，定位从「深度研究助手」升级为「Super Agent Harness」。

我不打算写产品评测。我想说的是：**从训练数据工程的角度看，DeerFlow 2.0 几乎是一个完美的数据工厂原型——只是它自己不知道这件事。**

---

## Skills 系统：任务域已经帮你标注好了

DeerFlow 2.0 的 Skills 系统把技能以 `SKILL.md` 文件形式存储，按需加载，不占上下文窗口。内置技能包括研究、报告生成、PPT、前端设计、视频生成。

表面上这是一个「轻量插件系统」。但换一个角度看，它的意义完全不同。

Philipp Schmid 在他的文章 [The Harness is the Dataset](https://www.philschmid.de/harness-is-the-dataset) 里提出：Agent 执行框架本身就是训练数据的边界定义——每次 Agent 用某个 Harness 成功或失败完成任务，都是一条带有结构化上下文的训练轨迹。

DeerFlow 的 Skills 系统把这个逻辑具体化了：**每个 Skill 对应一个明确的任务类型**。Agent 调用 `research` Skill 跑一次研究任务，调用 `report` Skill 生成报告——任务域标注是系统内置的，不需要人工事后贴标签。

这直接解决了 Agent 训练数据最头疼的问题之一：**你有轨迹，但不知道这是什么类型的任务，不知道该用什么标准评判它好不好。** Skills 系统把这个问题在数据产生的源头就解决掉了。

---

## Docker 沙箱：执行验证已经到位，记录器没有

DeerFlow 2.0 的沙箱设计相当完整：Docker 隔离、持久化三级文件系统（`/workspace`、`/uploads`、`/outputs`），推荐 All-in-One Sandbox（Browser + Shell + MCP + VSCode Server 一体化）。Agent 在里面真实执行代码，结果可验证。

[之前关于 Agent Sandbox 基础设施的讨论](./2026-03-29-agent-sandbox-infrastructure)里，我把「有没有执行隔离」列为 Agent 数据生产的核心门槛。DeerFlow 2.0 把这道槛拆掉了。

**但它只做「运行」，没有做「记录」。**

每次 Agent 在沙箱里跑完一个任务：代码执行成功/失败了吗？中间经历了几次工具调用？哪一步出现了 retry？最终 `/outputs` 里产出了什么？这些信息对训练数据来说是黄金——但 DeerFlow 默认不把它们存下来。任务跑完，上下文清空，轨迹消失。

值得认真估算：一个活跃的 DeerFlow 实例，每天能产生多少条可用的训练轨迹？如果有人写一个轻量的 trajectory logger hook 接入 LangGraph Server 的 SSE 流，在不影响正常运行的情况下把每次执行的完整轨迹落盘——这个工程改动的体量有多大？我估计不超过 500 行。

---

## 多代理调度：最难获取的协作数据近在眼前

DeerFlow 2.0 的子代理并行调度是这样工作的：主代理拆解任务，多个隔离子代理并行执行，结果汇总回主代理。每个子代理上下文完全隔离，声称效率提升 3-5x。

这个架构对数据工程来说意味着什么？

多 Agent 协作的失败数据是目前训练数据体系里最稀缺的部分：任务分解失败（主代理拆分不合理）、子代理能力不匹配（任务分配错误）、handoff 信息丢失（子代理的输出主代理看不懂）。这些数据在真实系统里产生，但很难系统性地捕获。

DeerFlow 的子代理隔离设计天然产生了 `handoff_summary` 格式的数据——主代理向子代理传递任务的描述，子代理返回结构化结果。这正好是多 Agent 协调训练数据的标准格式。**问题只是：没人在记录它。**

---

## 一个尖锐的问题

DeerFlow 2.0 是一个工程质量很高的 Agent 执行框架。MIT 开源、完全自托管、真实代码执行、Skills 扩展——这些都是它相对于 OpenAI Deep Research（闭源/$20 月）和 AutoGPT（上手难）的真实优势。

但它有一个系统性的缺失，而且这个缺失在几乎所有 Agent 框架里都存在：**它不记录自己的训练数据。**

所有跑过 DeerFlow 的轨迹，几乎都消失了。每次 Agent 成功生成一份研究报告，每次多代理协作成功或失败完成一个复杂任务，每次 Skills 系统决定加载哪个 Skill——这些都是可以产生高质量训练数据的时刻。但系统的默认行为是遗忘。

这是一个值得填补的空白。不需要修改 DeerFlow 的核心逻辑，只需要在 LangGraph Server 的事件流上加一个 observer。DeerFlow 的架构——Skills 分类、沙箱验证、多代理 handoff——已经把最难的部分做好了。

剩下的问题是：有没有人愿意开始记录？
