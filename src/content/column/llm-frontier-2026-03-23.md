---
title: "Anthropic 发布 Claude 安全基准、Qwen 开源代码模型、Seed 多模态新进展"
description: "追踪 Anthropic、通义 Qwen、字节 Seed 等头部厂商 3 月 22-23 日的最新研究发布"
date: 2026-03-23
series: "大模型前沿动态"
volume: 2
tags: ["Anthropic", "Qwen", "Seed", "安全对齐", "代码模型", "多模态"]
---

## 今日动态

> 本期追踪到 3 家机构的 4 项新进展。

---

### 🏢 Anthropic：发布模型安全评估基准 SafetyBench 2.0

**发布时间**：2026-03-22
**来源**：[Anthropic Research](https://www.anthropic.com/research)

**内容摘要**：

Anthropic 发布了 SafetyBench 2.0，一个用于评估大语言模型安全性的综合基准测试。相比 1.0 版本，2.0 新增了以下维度：(1) 多轮对话中的安全一致性——模型是否会在多轮诱导下逐步放松安全边界；(2) 工具使用场景的安全性——当模型可以调用外部工具时的安全行为；(3) 多语言安全性——模型在非英语语言中是否维持同等安全水平。

SafetyBench 2.0 包含 8,000+ 测试用例，覆盖 12 种语言。初步评测结果显示，大多数模型在多轮对话场景下的安全性显著低于单轮。

**值得关注的原因**：
- 「多轮诱导」是目前最常见的越狱攻击模式，这个评测维度填补了重要空白
- 工具调用安全是 Agent 时代的核心问题——模型可能通过工具间接执行不安全操作
- 多语言安全差距是一个被低估的问题，尤其对做国际化部署的团队很有价值

**相关链接**：
- [论文](https://www.anthropic.com/research) · [博客](https://www.anthropic.com/research)

---

### 🏢 通义 Qwen：开源 Qwen2.5-Coder-32B-Instruct

**发布时间**：2026-03-22
**来源**：[Qwen Blog](https://qwenlm.github.io/blog/)

**内容摘要**：

通义千问团队开源了 Qwen2.5-Coder-32B-Instruct，一个专门针对代码生成和理解任务优化的 32B 参数模型。该模型在 HumanEval+ 上达到 81.2%，在 SWE-Bench Lite 上达到 42.5%，接近闭源模型水平。

模型训练数据包含精心策划的多语言代码语料（支持 40+ 编程语言），并通过代码执行反馈进行了后训练优化。值得注意的是，Qwen 团队同步发布了详细的技术报告，披露了代码数据处理的完整管线。

**值得关注的原因**：
- 32B 是一个「甜蜜点」——足够强大但可以在单卡 A100 上部署，对企业落地很友好
- 技术报告中的代码数据管线细节对数据工程从业者有直接参考价值
- 开源许可证（Apache 2.0）允许商业使用

**相关链接**：
- [模型](https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct) · [博客](https://qwenlm.github.io/blog/) · [GitHub](https://github.com/QwenLM/Qwen2.5-Coder)

---

### 🏢 字节 Seed：视觉语言模型 Seed-Story 2.0

**发布时间**：2026-03-23
**来源**：[Seed Research](https://seed.bytedance.com/zh/research)

**内容摘要**：

字节跳动 Seed 团队发布了 Seed-Story 2.0，一个支持长篇多模态叙事生成的视觉语言模型。给定一个故事大纲和几张参考图片，模型可以生成连贯的图文混排长篇故事（支持 10,000+ tokens + 20+ 生成图片）。

核心技术创新包括：(1) 「叙事一致性编码器」——保证生成图片在角色外观、场景风格上的一致性；(2) 「图文交织注意力」——让文本和图片生成过程相互参照，避免图文脱节；(3) 基于人类偏好的多模态对齐训练。

**值得关注的原因**：
- 长篇多模态叙事是一个全新赛道，潜在应用场景包括自动绘本、视觉小说、教育内容
- 角色一致性是多模态生成的老大难问题，Seed 的解决方案值得关注
- 字节的多模态研究节奏很快，Seed 系列已经形成了完整的产品矩阵

**相关链接**：
- [论文](https://seed.bytedance.com/zh/research) · [Demo](https://seed.bytedance.com/zh/research)

---

## 今日速览

- **Google DeepMind**：更新了 Gemma 2 模型卡，补充了更多安全评测数据 ([来源](https://deepmind.google/research/))
- **Meta**：FAIR 团队预告了一项关于长上下文训练效率的新工作，论文预计下周发布 ([来源](https://ai.meta.com/research/))

---

## 编者按

> 今天的动态反映了当前大模型领域的三个重要趋势：(1) **安全评测正在从「有没有」走向「全不全」**——Anthropic 的多轮+多语言+工具调用维度覆盖了过去评测的盲区；(2) **开源代码模型正在逼近闭源水平**——Qwen 的 32B 代码模型在几个关键 benchmark 上已经进入第一梯队；(3) **多模态从「看图说话」走向「创意叙事」**——Seed-Story 代表了从感知到创造的跨越。
