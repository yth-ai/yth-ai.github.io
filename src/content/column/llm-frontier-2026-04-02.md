---
title: "Anthropic 五天内二度泄露：Claude Code 51.2万行源代码流入公网、阿里 Qwen3.5-Omni 全模态大模型拿下215项SOTA"
description: "Anthropic npm 打包失误泄露 Claude Code 全部源代码引发 8000+ DMCA 删除战，阿里通义千问发布 397B 参数全模态大模型 Qwen3.5-Omni 及百万上下文 Qwen 3.6 Plus"
date: 2026-04-02T09:00
series: "大模型前沿动态"
volume: 11
tags: ["Anthropic", "Claude Code", "源代码泄露", "npm", "KAIROS", "阿里", "Qwen3.5-Omni", "全模态", "Qwen 3.6", "月之暗面", "IPO", "腾讯混元"]
---

## 今日动态

> 本期追踪到 3 项核心进展，以及 2 项快讯。

---

### 🏢 Anthropic：Claude Code 51.2 万行源代码意外流入公网——五天内第二次重大安全事故

**发布时间**：2026-03-31（泄露发现）/ 2026-04-01（大规模传播与 DMCA 删除）
**来源**：[TechRadar](https://www.techradar.com/pro/security/anthropic-confirms-it-leaked-512-000-lines-of-claude-code-source-code-spilling-some-of-its-biggest-secrets) · [PCMag](https://www.pcmag.com/news/anthropic-issues-8000-copyright-takedowns-to-scrub-claude-code-leak) · [CNBC](https://www.cnbc.com/2026/03/31/anthropic-leak-claude-code-internal-source.html)

**内容摘要**：

安全研究员 Chaofan Shou 在 Claude Code v2.1.88 版本中发现，Anthropic 员工在一次常规 npm 更新时，意外将一个 **59.8MB 的 source map 文件**打包发布，其中包含了 Claude Code 的**完整专有源代码**——约 **1,900 个 TypeScript 文件、51.2 万行代码**。Shou 在 X 上发布了下载链接后，代码在数小时内被镜像到 GitHub 并被分叉数万次。

这是 Anthropic 在 **五天内的第二次**重大安全事故。上周 Vol.10 报道的 CMS 配置错误暴露了约 3,000 份内部文件（含 Claude Mythos 技术文档），这次则直接把旗舰编程产品的全部内核搬上了公网。

泄露的代码库揭示了多项此前未知的内部机制：
- **KAIROS**：一个未发布的自主代理后台守护程序（autonomous agent daemon），暗示 Anthropic 正在开发比当前 Claude Code 更激进的 AI 自主编程模式
- **Undercover Mode**：专门用于防止 Claude 泄露 Anthropic 机密的内部功能——讽刺的是，这个功能本身的代码也被泄露了
- **44 个功能标志（feature flags）**：揭示了大量未上线的实验性功能
- 内部模型代号体系确认 Claude 4.6 变体被称为 "Capybara"

Anthropic 随即向 GitHub 提交了大规模 DMCA 删除请求，最初涉及 **8,100 个仓库**，后缩减至 1 个主仓库和 96 个分叉。但开发者社区的反应远比删除通知快——韩裔加拿大开发者 Sigrid Jin 在天亮前就完成了一份"净室" Python 重写（项目名 `claw-code`），发布两小时内获得 **5 万颗 GitHub Stars**。更多开发者用 AI 将 TypeScript 源码自动转写为 Python、Bash 等其他语言以规避版权检测。

**值得关注的原因**：
- Claude Code 估计年贡献约 **25 亿美元 ARR**（占 Anthropic 总收入约 13%），其安全逻辑和权限绕过技术的公开对企业客户构成直接风险
- 五天两起泄露，发生在 Anthropic 筹备 **2026 年 Q4 IPO**（估值 3,500 亿美元）的关键窗口——连续的安全失误可能严重削弱投资者信心
- KAIROS 自主代理守护程序的曝光比 Anthropic 预期提前了——这可能是继 Claude Code 之后的下一代产品形态
- `claw-code` 两小时 5 万星的传播速度，说明开发者社区对 Claude Code 内部实现的渴望程度远超 Anthropic 的预期——这同时是一个产品力的证明和一个安全治理的噩梦

**相关链接**：
- [TechRadar 详细报道](https://www.techradar.com/pro/security/anthropic-confirms-it-leaked-512-000-lines-of-claude-code-source-code-spilling-some-of-its-biggest-secrets) · [PCMag DMCA 删除分析](https://www.pcmag.com/news/anthropic-issues-8000-copyright-takedowns-to-scrub-claude-code-leak) · [BeInCrypto IPO 风险分析](https://beincrypto.com/claude-code-leak-anthropic-ipo-risk/) · [CNBC 确认报道](https://www.cnbc.com/2026/03/31/anthropic-leak-claude-code-internal-source.html)

---

### 🏢 阿里通义千问：Qwen3.5-Omni 全模态大模型发布——397B 参数 MoE 架构，215 项国际测试 SOTA

**发布时间**：2026-03-30
**来源**：[系统极客](https://www.sysgeek.cn/qwen3-5-omni/) · [智东西（36氪）](https://www.36kr.com/p/3746281380348680) · [百度百科](https://baike.baidu.com/item/Qwen3.5-Omni/67558427)

**内容摘要**：

3 月 30 日，阿里通义千问正式发布新一代全模态大模型 **Qwen3.5-Omni**。这是一次从架构到能力的全面升级，采用 **Thinker-Talker 双模块架构**，基座为 **Hybrid-Attention MoE**，总参数 **397B**（512 个专家，单次推理仅激活 10 个路由专家 + 1 个共享专家），在超过 1 亿小时音视频数据上完成原生多模态预训练。

关键能力跃升：
- **模态覆盖**：原生融合文本、图像、音频、视频四种模态的输入与输出，无需外挂编码器
- **上下文窗口**：从上代 Qwen3-Omni 的 32K 大幅扩展至 **256K**，可处理超过 10 小时音频或 400 秒 720P 视频
- **语言支持**：语音识别覆盖 **113 种语言与方言**（含东北话、四川话、粤语等 39 种中国方言），语音合成支持 36 种
- **实时交互**：新增语义打断（避免背景噪音误触发）、端到端语音属性控制（音量/语速/情绪）、3 秒音色克隆
- **工具集成**：原生支持 WebSearch 和 Function Call，模型自主判断是否需要联网

在基准测试中，Qwen3.5-Omni 在 **215 项**国际测试中取得 SOTA，涵盖音视频理解、ASR、语音到文本翻译等维度。通用音频理解和推理能力**全面超越 Gemini 3.1 Pro**，部署成本较上代降低 60%（4×消费级显卡即可运行 FP16），API 价格低至每百万 Tokens ≤ 0.8 元。

模型提供 Plus（高性能）、Flash（轻量快速）、Light（超低成本）三种版本，并开源 30B 版本支持本地部署。一个值得关注的涌现能力是 **Audio-Visual Vibe Coding**——直接根据音视频指令（如手绘草图 + 语音描述）生成代码。

**值得关注的原因**：
- 397B 参数 + 稀疏激活 MoE 的设计在全模态模型中实现了性能与成本的平衡——消费级显卡可运行的全模态大模型，对企业私有化部署极为友好
- 113 种语言与方言的语音识别能力是目前公开模型中覆盖最广的之一，尤其是 39 种中国方言的支持使其在国内场景中具有独特优势
- "超越 Gemini 3.1 Pro" 的音频理解能力定位直接挑战 Google 在多模态领域的领先地位
- Audio-Visual Vibe Coding 的涌现暗示全模态交互可能成为下一代编程范式——从"用键盘写代码"到"用草图和语音描述需求"

**相关链接**：
- [系统极客技术详解](https://www.sysgeek.cn/qwen3-5-omni/) · [智东西实测](https://www.36kr.com/p/3746281380348680) · [53AI 对比评测](https://www.53ai.com/news/MultimodalLargeModel/2026033164538.html) · [Qwen Chat 体验](https://chat.qwen.ai/)

---

### 🏢 阿里通义千问：Qwen 3.6 Plus Preview 登陆 OpenRouter——百万 Token 上下文免费开放

**发布时间**：2026-03-30 ~ 03-31
**来源**：[Build Fast with AI](https://www.buildfastwithai.com/blogs/qwen-3-6-plus-preview-review) · [Apidog](https://apidog.com/blog/qwen-3-6-free-openrouter/) · [OpenRouter](https://openrouter.ai/qwen/)

**内容摘要**：

紧随 Qwen3.5-Omni 发布之后，阿里通义千问在 OpenRouter 上线了 **Qwen 3.6 Plus Preview**——一个纯文本闭源模型，但技术规格令人瞩目。

核心参数：
- **上下文窗口**：**100 万 Token**（约 2,000 页文本或完整代码库）
- **最大输出**：65,536 Token
- **架构**：先进混合架构（非标准 MoE），始终激活链式思维推理
- **价格**：目前在 OpenRouter **完全免费**
- **速度**：社区早期测试显示输出速度约为 Claude Opus 4.6 的 **3 倍**

Qwen 3.6 相比 3.5 修复了"过度思考"（overthinking）问题，在多步骤 Agent 工作流中表现更果断、工具调用更稳定。在长上下文代码库检索和推理任务中表现出色。不过，目前阿里尚未发布官方的 SWE-Bench、HumanEval 或 MMLU 基准分数。

值得注意的是，免费预览期间阿里会收集 prompt 和补全数据用于模型训练——生产环境使用需谨慎。

**值得关注的原因**：
- 百万 Token 上下文 + 免费使用的组合，直接威胁 Google Gemini 3 在长上下文领域的定价优势
- 始终激活的链式思维推理是一个有趣的设计选择——牺牲简单对话的延迟换取 Agent 场景的一致性
- 阿里在 48 小时内连续发布全模态模型（Qwen3.5-Omni）和纯文本旗舰（Qwen 3.6），展现出与 Vol.9 智谱类似的密集迭代节奏
- 3 倍于 Claude Opus 4.6 的输出速度如果在正式版中保持，将是编程和文档生成场景的杀手级优势

**相关链接**：
- [Build Fast with AI 评测](https://www.buildfastwithai.com/blogs/qwen-3-6-plus-preview-review) · [Apidog 使用指南](https://apidog.com/blog/qwen-3-6-free-openrouter/) · [BridgeMind 基准测试](https://www.bridgemind.ai/blog/qwen-3-6-plus-bridgebench-results)

---

## 今日速览

- **月之暗面**：3 月 26 日彭博社独家消息，Kimi 母公司月之暗面正评估**赴港 IPO**，已与**中金公司、高盛**展开初步承销洽谈，估值约 **180 亿美元**。三个月前完成的 10 亿美元融资轮使其估值从约 45 亿美元飙升至 180 亿——四倍涨幅。此前 Vol.9 已报道其 ARR 突破 1 亿美金，K2.5 驱动的商业化加速正在为上市铺路。若成行，月之暗面将成为继智谱之后第二家港股上市的中国大模型公司 ([彭博社/新浪](https://finance.sina.com.cn/wm/2026-03-27/doc-inhsmamt9592942.shtml) · [中华网独家](https://finance.china.com/TMT/13004688/20260326/49360029.html))
- **腾讯混元**：腾讯副总裁李强在 3 月 27 日的媒体沟通会上确认，**混元 3.0 定档 4 月发布**。据披露，新版本激活参数大幅降低、体验更优，在复杂推理、长记忆、多轮追问和 Agent 能力上有显著提升。内部已有**超 900 个业务**全面接入混元大模型。这将是腾讯自研大模型的一次重大迭代——距离上一个大版本已过去半年 ([IT之家](https://www.ithome.com/0/930/373.htm) · [金融界](https://stock.jrj.com.cn/2026/03/27134256495925.shtml))

---

## 编者按

> 本周最具戏剧性的叙事属于 Anthropic——这家以"AI 安全"为核心标识的公司，在五天内连续发生了两起性质截然不同但同样严重的安全事故。
>
> **第一次**（Vol.10），CMS 配置错误泄露了 Claude Mythos 的内部文档，引爆了网安股的恐慌性抛售。**这一次**，一个 npm 打包失误将 Claude Code 的 51.2 万行源代码推上了公网。如果说第一次暴露的是"AI 能做什么"的秘密，那这一次暴露的是"AI 是怎么做的"的全部细节。
>
> 更值得玩味的是开发者社区的反应。`claw-code` 两小时 5 万星的传播速度，开发者争相用 AI 将泄露代码转写为其他语言以规避 DMCA——这些行为本身就是对 Claude Code 产品力的最高赞美，同时也是对 Anthropic 知识产权保护能力的最尖锐嘲讽。一家估值 3,500 亿美元、正在筹备 IPO 的公司，连自家最赚钱产品的源代码都保不住——潜在投资者会怎么想？
>
> 与此同时，**阿里的密集发布**悄然改变了多模态竞争的格局。Qwen3.5-Omni 的 397B MoE 架构在消费级硬件上可运行，113 种方言识别在中文场景中几乎无人能及；Qwen 3.6 Plus 的百万上下文免费开放则直接挑战了 Gemini 和 Claude 的定价体系。当全球最大的几家 AI 公司还在为安全事故灭火时，阿里选择用产品说话——这或许是 2026 年 Q2 最值得关注的竞争态势变化。
