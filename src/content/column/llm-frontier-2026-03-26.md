---
title: "OpenAI 关停 Sora 迪士尼退出 10 亿美元投资、Anthropic 推出 Claude Code 自动模式、Google 发布 Gemini 3.1 Flash-Lite"
description: "OpenAI 战略收缩终止视频生成业务，Anthropic 让 AI 自主决定权限边界，Google 新模型推理速度提升 2.5 倍，LiteLLM 遭遇大规模供应链投毒"
date: 2026-03-26
series: "大模型前沿动态"
volume: 5
tags: ["OpenAI", "Sora", "迪士尼", "Anthropic", "Claude Code", "Auto Mode", "Computer Use", "Google", "Gemini 3.1", "LiteLLM", "供应链安全", "Kimi", "杨植麟"]
---

## 今日动态

> 本期追踪到 4 家机构的 4 项核心进展，以及 3 项快讯。

---

### 🏢 OpenAI：关停 Sora 视频生成平台，迪士尼退出 10 亿美元投资

**发布时间**：2026-03-25
**来源**：[Variety](https://variety.com/2026/digital/news/openai-shutting-down-sora-video-disney-1236698277/) · [The Hollywood Reporter](https://www.hollywoodreporter.com/business/digital/openai-shutting-down-sora-ai-video-app-1236546187/) · [投资界](https://news.pedaily.cn/202603/562082.shtml)

**内容摘要**：

OpenAI 宣布关停旗下 AI 视频生成平台 Sora，这是该公司自去年 9 月高调推出独立应用以来最大的产品线收缩动作。Sora 团队在声明中表示：「我们要向 Sora 说再见了。感谢每一个使用 Sora 创作、分享并围绕它建立社区的人。」但 OpenAI **未提供任何具体关停理由**。

更大的连锁反应来自合作伙伴端：**迪士尼随即宣布退出与 OpenAI 的全部合作**，包括原定的 10 亿美元股权投资和一项为期三年的内容授权协议。该协议原本允许 Sora 用户基于迪士尼、漫威、皮克斯和星球大战等超过 200 个角色生成视频内容。迪士尼在声明中表示：「我们尊重 OpenAI 退出视频生成业务并将重心转移到其他领域的决定。」

据《华尔街日报》报道，关停 Sora 是 OpenAI 将计算资源和人才重新聚焦到企业生产力工具（Codex、ChatGPT 超级应用）上的战略举措。此前应用业务 CEO Fidji Simo 已在内部信中明确：**OpenAI 的战略优先级将从 ChatGPT 转向 Codex**。据企业支付平台 Ramp 统计，在新采购 AI 服务的企业中，选择 Anthropic 的比例已是 OpenAI 的 3 倍。

**值得关注的原因**：
- Sora 从高调亮相到关停仅约 6 个月，是 AI 行业「快速试错、果断止损」的典型案例
- 迪士尼退出标志着好莱坞对 AI 视频生成的「蜜月期」结束——版权压力（日本 CODA 要求停用、多家影业联合起诉）是不可忽视的背景因素
- OpenAI 战略从「全品类 AI」转向「编程优先」，与 Anthropic（Claude Code 占据编程赛道过半份额）的正面竞争将更加激烈

**相关链接**：
- [Variety 报道](https://variety.com/2026/digital/news/openai-shutting-down-sora-video-disney-1236698277/) · [IGN 报道](https://www.ign.com/articles/openai-shuts-down-sora-generative-video-app-disney-pulls-out-of-investment-and-licensing-deal) · [Mashable 报道](https://mashable.com/article/openai-sora-shutting-down)

---

### 🏢 Anthropic：Claude Code 推出自动模式，Cowork 获得电脑操控能力

**发布时间**：2026-03-24
**来源**：[TechCrunch](https://techcrunch.com/2026/03/24/anthropic-hands-claude-code-more-control-but-keeps-it-on-a-leash/) · [Ars Technica](https://arstechnica.com/ai/2026/03/claude-code-can-now-take-over-your-computer-to-complete-tasks/) · [36 氪](https://www.36kr.com/p/3737714656588288)

**内容摘要**：

Anthropic 在 3 月 24 日密集发布了两项重磅更新，标志着 AI 代理的自主权向前迈出了关键一步：

**Claude Code Auto Mode**（自动模式）：这是 Claude Code 的一项新功能（研究预览阶段），让 AI **自主决定哪些操作可以直接执行、哪些需要人类确认**。其核心创新在于内置 AI 安全层——每个操作执行前都会经过风险检测和提示注入攻击检查。安全操作自动放行，风险操作被拦截。这解决了开发者长期面临的两难困境：要么全程监视 AI 每一步，要么冒险让模型不受限运行。目前仅适用于 Claude Sonnet 4.6 和 Opus 4.6，建议在沙盒环境中使用。

**Claude Cowork Computer Use**（电脑操控）：Claude 现在可以直接接管用户的 Mac 电脑——打开应用、操作浏览器、运行开发工具、填写表格，全程无需用户干预。结合此前上线的 Dispatch 调度功能，用户可以从手机向 Claude 发送任务指令，远程控制桌面端运行的 Agent。该功能以研究预览版向 Pro 和 Max 订阅用户开放。

**值得关注的原因**：
- Auto Mode 将「何时请求权限」的决策权从用户转移到 AI，这在行业中是首次——直接回应了 OpenClaw（开源「龙虾」）对自主代理的需求爆发
- Computer Use 功能让 Claude 从「对话工具」进化为「桌面代理」，与 OpenClaw 的插件式接入不同，这是深度整合进模型的原生能力
- Anthropic 尚未公开其安全层区分「安全」与「风险」操作的具体标准，这是社区关注的核心问题

**相关链接**：
- [TechCrunch 报道](https://techcrunch.com/2026/03/24/anthropic-hands-claude-code-more-control-but-keeps-it-on-a-leash/) · [SiliconAngle 报道](https://siliconangle.com/2026/03/24/anthropic-unchains-claude-code-auto-mode-allowing-choose-permissions/) · [WinBuzzer 报道](https://winbuzzer.com/2026/03/25/anthropic-claude-code-cowork-auto-mode-computer-use-xcxwbn/)

---

### 🏢 Google DeepMind：发布 Gemini 3.1 Flash-Lite，推理速度提升 2.5 倍

**发布时间**：2026-03-25
**来源**：[搜狐科技](https://www.sohu.com/a/1000844936_121885030) · [9to5Mac](https://9to5mac.com/2026/03/25/new-details-on-apple-google-ai-deal-revealed-including-gemini-changes-report/)

**内容摘要**：

Google DeepMind 推出新一代生成式 AI 模型 **Gemini 3.1 Flash-Lite**，以卓越的推理效率为核心卖点，推动 AI 从纯文本交互向动态用户界面渲染的进化。

关键性能指标：
- **首次响应速度**相比前代 Gemini 2.5 Flash 提升 **2.5 倍**
- 吞吐量达到每秒超过 **360 个 Token**
- 在第三方机构 ArtificialAnalysis 的多模态任务测试中，表现**超越了体量更大的竞争对手**（包括 Claude Opus 4.6）

与此同时，Google CEO 皮查伊确认了 Gemini 3.1 Pro 的发布，称其相较 Gemini 3 Pro 有 31.1% 的提升，在处理复杂概念可视化、多源数据整合和创意项目落地等任务时表现更为出色。清华校友、前 DeepMind 研究员姚顺宇在社交平台暗示后续还有更强模型在筹备中。

**值得关注的原因**：
- Flash-Lite 的定位非常精准——速度快 + 成本低 + 性能不差，是大规模部署和边缘推理的理想选择
- 2.5 倍首次响应速度提升意味着用户感知延迟大幅降低，对实时应用（如网页渲染、对话交互）有直接影响
- Google 从 ".5" 到 ".1" 的版本策略调整反映了底层技术迭代加速——距 Gemini 3 Pro 仅三个月便推出 3.1

**相关链接**：
- [搜狐科技报道](https://www.sohu.com/a/1000844936_121885030)

---

### 🔒 安全事件：LiteLLM 遭遇大规模供应链投毒，Karpathy 发出紧急警告

**发布时间**：2026-03-24（攻击发生）/ 2026-03-25（大规模曝光）
**来源**：[Giskard 分析](https://www.giskard.ai/knowledge/litellm-supply-chain-attack-2026) · [Wiz 安全](https://www.wiz.io/blog/threes-a-crowd-teampcp-trojanizes-litellm-in-continuation-of-campaign) · [知乎](https://zhuanlan.zhihu.com/p/2020156950269183941)

**内容摘要**：

3 月 24 日，威胁行为者 **TeamPCP** 对 AI 开发者核心工具 LiteLLM 发动了大规模供应链攻击。LiteLLM 是一个广泛使用的 AI 代理管理库和网关，**每月下载量达 9,500 万次**。攻击者通过此前入侵 Aqua Security 的 Trivy 安全工具获取的凭证，在 PyPI 上发布了 LiteLLM 的两个恶意版本（1.82.7 和 1.82.8），植入后门代码窃取用户的 **SSH 密钥、云服务凭证和 Kubernetes Secrets**。

前 OpenAI 研究负责人、Tesla AI 前负责人 **Andrej Karpathy** 在社交平台发出紧急警告：「像这样的供应链攻击基本上是现代软件面临的最大安全威胁之一。立即检查你的 Python 依赖！」

多家安全公司（Endor Labs、JFrog、Wiz、ThreatBook）迅速响应，确认攻击利用了 LiteLLM 对 Trivy 的间接依赖，形成了一条「安全工具被攻破 → 核心 AI 库被投毒 → 下游数千个项目受影响」的链式崩塌。

**值得关注的原因**：
- 这可能是 AI 开发领域迄今最大规模的供应链攻击事件——9,500 万月下载量意味着影响面极广
- 攻击路径从安全工具（Trivy）到 AI 库（LiteLLM），暴露了开源依赖链中「信任传递」的致命弱点
- 对所有使用 Python 做 AI 开发的团队来说是直接警示：立即检查依赖版本，确保未安装 1.82.7 或 1.82.8

**相关链接**：
- [GitHub 安全通告](https://github.com/TocConsulting/litellm-supply-chain-attack-analysis) · [Phoenix Security 分析](https://phoenix.security/teampcp-litellm-supply-chain-compromise-pypi-credential-stealer-kubernetes/) · [Giskard 复盘](https://www.giskard.ai/knowledge/litellm-supply-chain-attack-2026)

---

## 今日速览

- **月之暗面 / 杨植麟**：在 2026 中关村论坛发表主旨演讲《开源 AI：加速探索智能上限》，首次详解 Kimi K2.5 的三大技术创新——Token 效率优化、Attention Residuals（注意力残差）架构、Agent Swarm（多智能体集群）。他预判「从今年起 AI 研究将进入 AI 主导的新阶段，每个研究员都会配备海量 AI Token」，并指出 Kimi 模型已成为全球芯片厂商评测性能的新标准 ([网易科技](https://www.163.com/tech/article/KOSBSDI400098IEO.html) · [每日经济新闻](https://www.nbd.com.cn/articles/2026-03-25/4307655.html))
- **腾讯**：撤销成立近十年的集团级 AI Lab，全部研究能力并入混元大模型体系，由首席 AI 科学家姚顺雨统筹。混元 3.0 确认将于 4 月正式发布，在推理能力和 Agent 能力上有重大升级 ([财新网](https://www.caixin.com/2026-03-20/102425474.html) · [IT 之家](https://www.ithome.com/0/930/373.htm))
- **Google**：在 RSA 2026 大会上发布 AI 暗网监测工具，利用 Gemini 模型自动扫描暗网内容，每天分析 800 万至 1,000 万条外部事件，威胁分析准确率约 98%，相比传统关键词抓取工具将误报率从 80-90% 大幅降低 ([腾讯新闻](https://news.qq.com/rain/a/20260325A06BBQ00))

---

## 编者按

> 今天最震撼的新闻无疑是 OpenAI 关停 Sora。从 2024 年 2 月的惊艳亮相到 2026 年 3 月的黯然离场，Sora 的生命周期恰好映射了 AI 视频生成赛道从狂热到冷静的完整弧线。**版权压力、商业可行性不足、战略资源重新分配**——每一个因素都在提醒我们，在 AI 领域，「能做到」和「值得做」之间存在巨大鸿沟。
>
> 与此形成鲜明对比的是 Anthropic 在 AI 代理方向的加速——Claude Code Auto Mode 和 Computer Use 的同时发布，本质上是在回答一个关键问题：**AI 应该拥有多大的自主权？** Anthropic 的答案是让 AI 自己判断操作风险，这既是对 OpenClaw 掀起的「龙虾热潮」的正面回应，也是一次值得密切关注的安全实验。
>
> 而 LiteLLM 投毒事件则在提醒整个行业：当我们把越来越多的信任交给 AI 工具和开源库时，**供应链安全正在成为 AI 基础设施最薄弱的环节**。9,500 万月下载量的库被投毒，波及面之广令人不寒而栗。对每一个 AI 开发者来说，今天的首要行动是：`pip list | grep litellm`。
