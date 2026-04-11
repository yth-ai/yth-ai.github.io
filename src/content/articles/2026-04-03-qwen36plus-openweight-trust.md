---
title: "开源模型开始闭源：Qwen3.6-Plus 引发的信任危机"
description: "Alibaba 发布 Qwen3.6-Plus 但不开放权重，HN 社区的强烈反应揭示了一个更深的问题：开源只是增长策略，不是承诺"
date: 2026-04-03
category: "行业观察"
tags: ["开源模型", "Qwen", "行业动态", "开源生态"]
---

昨天，Alibaba 发布了 Qwen3.6-Plus——号称 agentic coding 能力大幅提升，1M context，SWE-bench 成绩优秀。但这次，没有开放权重。

Hacker News 上 438 点、151 条评论的讨论（这个量级对一个模型发布帖来说相当高），说明开发者注意到了，也不满意。

## 发生了什么

Qwen 系列之前以开放权重著称——Qwen 2.5、Qwen 3 都在 Hugging Face 上有完整版本。这建立了一套预期：Alibaba/Qwen 团队是开源友好的。

Qwen3.6-Plus 打破了这个预期。官方的说法是"API 先行，未来会发布较小版本的开放权重"，但没有时间表，没有说明"较小"是多小。

HN 上的评论直接说出了问题所在：

> "They got a lot of good publicity for their open weight model releases, which was the goal. The hard part is pivoting from an open weight provider to being considered as a competitor to Claude and ChatGPT."

这个观察很冷酷，但可能是对的。之前的开源，是获取开发者好感、建立生态、吸引 API 用户的策略。现在要收钱了，所以不开放了。

## 为什么工程师这么在意

反应为什么这么激烈？因为开发者不是在消费内容，他们在投资时间。

他们花时间学 Qwen 的接口规范，把它集成进工作流，基于它构建应用。一旦权重不开放，这些投入就被绑定到了一家公司的 API——而那家公司可能随时调价、弃用或停服。

一条得票很高的评论说：

> "I'm not interested in adopting an inferior closed source weight from a geopolitical rival. The open source weights argument was the one thing China had going and that I was seriously cheering them on for. They could have been our saviors and disrupted the US tech giants."

地缘政治维度在这里也出现了。这不只是技术讨论——对于西方的独立开发者来说，选择 Qwen 开放权重（可以本地跑、可以审计、不依赖中国云服务）和使用 Alibaba Cloud API 是两件性质完全不同的事。

## 这是个趋势，不是个例

Qwen 不是第一个这样做的。先开源获取用户，再逐步收紧，有一个明确的路径：

- Mistral：最早几个模型完全开放，后来的旗舰模型（Mistral Large）不开放权重
- Meta LLaMA：一直是"有条件开放"（商业使用需申请）
- DeepSeek：技术报告详细，但部分关键训练细节从未公开

这是正常的商业逻辑：开源是扩散策略，闭源是变现策略。两者都是理性选择，只是同时发生在同一个品牌上时，会伤害信任。

## 一个值得追的问题

Qwen 的发布声明里提到了一个有意思的基准：**MCPMark** 和 **Claw-Eval**——这是专门针对 MCP 工具调用和 agentic 场景的新型评估，不是传统的 MMLU 或 HumanEval。

如果 agentic 能力真的成为模型竞争的核心维度，评估基准的设计本身就会成为一件重要的事。谁定义了评估，谁就在一定程度上定义了"好"的标准。Alibaba 自己做 MCPMark，有潜在的自证偏差问题，但也反映了这个方向确实缺乏公认标准。

这比"Qwen 闭源了"本身更值得持续关注。

---

**来源**：
- [Qwen3.6-Plus 官方博客](https://www.alibabacloud.com/blog/qwen3-6-plus-towards-real-world-agents_603005)（2026.04.02）
- [HN 讨论（438点，151评论）](https://news.ycombinator.com/item?id=47615002)
