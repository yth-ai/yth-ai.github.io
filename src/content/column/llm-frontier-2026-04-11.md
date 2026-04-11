---
title: "GPT-6 确认下周一发布、Mythos 零日漏洞修补率不足 1% 惊动美联储、DeepSeek V4 锁定四月下旬"
description: "OpenAI 官宣 GPT-6（代号 Spud）4 月 14 日上线，Anthropic Mythos 发现的数千零日漏洞修补进度惊人缓慢迫使鲍威尔紧急召集六大银行 CEO，DeepSeek V4 确认四月下旬发布并首次深度适配华为昇腾芯片"
date: 2026-04-11T09:00
series: "大模型前沿动态"
volume: 15
tags: ["OpenAI", "GPT-6", "Spud", "Anthropic", "Mythos", "零日漏洞", "Project Glasswing", "美联储", "DeepSeek", "V4", "华为昇腾", "阿里巴巴", "生数科技", "Vidu", "世界模型"]
---

## 今日动态

> 本期追踪到 4 家机构的 4 项核心进展，以及 2 项快讯。

---

### 🏢 OpenAI：GPT-6（代号"Spud"）确认 4 月 14 日全球发布——200 万 Token 上下文，性能提升 40%

**发布时间**：2026-04-07（官宣）/ 4 月 14 日（正式上线）
**来源**：[新浪](https://news.sina.cn/bignews/2026-04-05/detail-inhtnckv6854538.d.html) · [品玩](https://www.163.com/dy/article/KPTFA1T305566WT8.html) · [Elser AI](https://www.elser.ai/zh/blog/what-is-gpt-6) · [CometAPI](https://www.cometapi.com/zh-CN/gpt-6-revealed-when-will-it-be-released/)

**内容摘要**：

OpenAI 正式确认：内部代号 **"Spud"（土豆）** 的下一代旗舰模型 **GPT-6** 将于 **4 月 14 日（下周一）全球上线**。这是 OpenAI 秘密研发约两年的成果——预训练已于 3 月 17 日在德克萨斯州阿比林的 **Stargate 超级集群**上完成，后训练阶段也已全部结束。

GPT-6 的核心规格令人瞩目：
- **上下文窗口**：扩展至 **200 万 Token**（GPT-5.4 为 40 万），一次性处理约 300 万字或数十个完整代码仓库
- **性能提升**：较 GPT-5.4 整体提升约 **40%**，重点强化代码生成、逻辑推理与智能体任务能力
- **原生全模态**：首次原生支持文本、音频、图像、视频的统一处理
- **超级应用整合**：ChatGPT、Codex 编程引擎、Atlas 浏览器将彻底融合为统一的智能体系统

据 Fortune 报道，OpenAI 也在准备与 Anthropic 类似的分阶段发布策略——"Spud" 的网络安全能力可能与 Mythos 相当，将优先向防御性合作伙伴开放。

总裁 Greg Brockman 在 Big Technology Podcast 上透露，GPT-6 并非 GPT-5 的简单迭代，而是一次 **架构级重构**——砍掉了 Sora 等非核心业务线，集中全部资源押注下一代推理与智能体能力。

**值得关注的原因**：
- 200 万 Token 上下文是当前行业最大窗口——这意味着 GPT-6 可以一次性"阅读"整个大型代码库或数百页文档，Agent 场景的实用性将发生质变
- 40% 的性能提升如果在编码基准上兑现，将直接挑战 Mythos Preview 的 SWE-Bench Pro 77.8%——下周将迎来 2026 年最激烈的模型能力对决
- "Spud" 与 "Mythos" 同时具备强大的网络安全能力，两家公司都选择分阶段发布——AI 军备竞赛正式进入"能力封锁"时代
- 砍掉 Sora 集中资源的战略决策，说明 OpenAI 已经从"什么都做"转向"在推理和 Agent 上下最大赌注"

**相关链接**：
- [新浪详细报道](https://news.sina.cn/bignews/2026-04-05/detail-inhtnckv6854538.d.html) · [品玩](https://www.163.com/dy/article/KPTFA1T305566WT8.html) · [澎湃新闻](https://www.thepaper.cn/newsDetail_forward_32923894) · [36氪深度分析](https://www.36kr.com/p/3754726863012361)

---

### 🏢 Anthropic：Mythos 零日漏洞修补率不足 1%——鲍威尔紧急召集六大银行 CEO 讨论金融系统安全

**发布时间**：2026-04-10
**来源**：[CNBC](https://www.cnbc.com/2026/04/10/powell-bessent-us-bank-ceos-anthropic-mythos-ai-cyber.html) · [Fortune](https://fortune.com/2026/04/10/anthropic-mythos-ai-driven-cybersecurity-risks-already-here/) · [humAI](https://www.humai.blog/anthropic-found-thousands-of-zero-days-in-windows-macos-chrome-and-firefox-less-than-1-are-patched/) · [CBS News](https://www.cbsnews.com/news/mythos-anthropic-ai-project-glasswing-hacker-threat/)

**内容摘要**：

Vol.12 报道了 Anthropic 发布 Claude Mythos Preview 并启动 Project Glasswing。三天后，这件事的后续发展已经从技术领域升级到了**国家金融安全层面**。

4 月 10 日，CNBC 独家报道：**美联储主席鲍威尔**和**财政部长贝森特**紧急召集了美国六大银行 CEO——美国银行的 Brian Moynihan、花旗的 Jane Fraser、高盛的 David Solomon、摩根士丹利的 Ted Pick、富国银行的 Charlie Scharf 前往财政部参加特别会议。唯一缺席的是摩根大通的杰米·戴蒙。议题只有一个：**Mythos 对金融系统构成的网络安全威胁**。

与此同时，humAI Blog 发布了一篇深度调查，揭示了 Project Glasswing 的惊人现实：Mythos Preview 在约四周内发现了数千个零日漏洞，但**修补率不足 1%**。问题不是技术能力——而是数学：AI 以机器速度发现漏洞，人类以日历速度修补漏洞。具体案例包括：

- **OpenBSD 27 年前的 TCP SACK 漏洞**：仅需 50 美元计算资源即可远程使任何 OpenBSD 主机崩溃
- **FreeBSD 17 年前的 NFS 远程代码执行**：未经认证即可获取完整 root 权限，经历了 17 年的代码审查和安全审计都未被发现
- **FFmpeg 16 年前的 H.264 编解码器缺陷**：自动化测试工具曾在约 500 万次测试中触发相关代码行但未检测到
- **浏览器漏洞利用链**：Mythos 自主编写了将四个漏洞链接在一起的 exploit，同时逃逸了渲染器和操作系统沙箱

Microsoft 副总裁 Igor Tsyganskiy 的表态最为直接："漏洞被发现和被对手利用之间的窗口已经崩溃。以前需要几个月的事情，现在在 AI 帮助下几分钟就能发生。"

Anthropic 承诺将在启动后 90 天内（约 7 月初）发布公开报告。研究预览结束后，Mythos Preview 将通过 Claude API 向合作伙伴开放，定价为每百万输入 Token **25 美元**、输出 **125 美元**。

**值得关注的原因**：
- 美联储主席亲自出面召集银行 CEO 讨论一个 AI 模型的安全影响——这在历史上是第一次，标志着 AI 能力已经上升到国家安全议程的最高层级
- 不足 1% 的修补率暴露了一个结构性问题：**AI 发现漏洞的速度和人类修补漏洞的速度之间存在数量级差距**——这个差距不会随时间缩小，只会扩大
- Anthropic 估计类似能力将在 6-18 个月内扩散——这意味着当前的"防御窗口期"极其有限
- Fortune 报道称 OpenAI 的 Spud 模型具备类似的网络安全能力——两大前沿实验室同时开发出"攻防一体"的 AI 系统，网络安全行业的游戏规则正在被彻底改写

**相关链接**：
- [CNBC 鲍威尔会议独家](https://www.cnbc.com/2026/04/10/powell-bessent-us-bank-ceos-anthropic-mythos-ai-cyber.html) · [Fortune 专家分析](https://fortune.com/2026/04/10/anthropic-mythos-ai-driven-cybersecurity-risks-already-here/) · [humAI 深度调查](https://www.humai.blog/anthropic-found-thousands-of-zero-days-in-windows-macos-chrome-and-firefox-less-than-1-are-patched/) · [Forecast International](https://dsm.forecastinternational.com/2026/04/10/anthropics-mythos-and-the-fear-in-the-hearts-of-cyber-defenders/)

---

### 🏢 DeepSeek：V4 锁定四月下旬发布——万亿参数级别，首次深度适配华为昇腾芯片

**发布时间**：2026-04-10（AIBase 报道）
**来源**：[AIBase](https://news.aibase.com/news/27011) · [FindSkill](https://findskill.ai/blog/deepseek-v4-release-date-specs/) · [TechStartups](https://techstartups.com/2026/04/06/deepseek-v4-model-will-run-on-huawei-chips-as-china-accelerates-ai-independence/)

**内容摘要**：

Vol.12 报道了 DeepSeek 悄然上线"快速模式"和"专家模式"双入口架构。4 月 10 日，多个信息源确认了更具体的时间表和技术细节：**DeepSeek V4 将于 4 月下旬正式发布**，参数规模预计达到**万亿级别**，支持百万级上下文窗口。

最值得关注的技术突破是：V4 首次实现与**华为昇腾芯片**的深度适配。DeepSeek 在过去数月与华为和寒武纪密切合作，将模型调优至在国产算力上高效运行。这意味着 DeepSeek 正在构建**完全独立于 NVIDIA CUDA 生态的训练和推理路径**。

这一消息的市场影响已经显现：据 AIBase 报道，阿里巴巴、字节跳动、腾讯等科技巨头已预订数十万块新的 AI 芯片以通过云服务集成 V4，AI 芯片价格近期上涨了约 20%。

目前 DeepSeek 网页版的"专家模式"被推测为 V4 的某种早期形态，已展现出显著优于快速模式的深度推理能力。正式版预计将补齐多模态能力，并进一步提升推理性价比。

**值得关注的原因**：
- 万亿参数 + 华为昇腾适配，标志着中国开源大模型首次在顶级参数规模上实现国产算力独立——这对全球 AI 算力供应链格局的影响是深远的
- 如果 V4 在华为芯片上的推理效率接近 NVIDIA H100，将证明"去 NVIDIA 化"在技术上是可行的——这个信号的地缘意义远超技术本身
- V4 的发布时间（4 月下旬）与 GPT-6（4 月 14 日）几乎重叠——2026 年 4 月可能成为大模型历史上最密集的"旗舰对决"月
- 芯片预订潮和 20% 价格上涨说明行业已经在为 V4 的规模化部署做准备——市场信心先于产品落地

**相关链接**：
- [AIBase 报道](https://news.aibase.com/news/27011) · [FindSkill 技术规格](https://findskill.ai/blog/deepseek-v4-release-date-specs/) · [TechStartups 华为芯片报道](https://techstartups.com/2026/04/06/deepseek-v4-model-will-run-on-huawei-chips-as-china-accelerates-ai-independence/) · [36氪 分析](https://www.36kr.com/p/3724953084637700)

---

### 🏢 阿里巴巴：领投生数科技 Vidu 2.9 亿美元——从大语言模型到世界模型的范式转移

**发布时间**：2026-04-10
**来源**：[CNBC](https://www.cnbc.com/2026/04/10/alibaba-cloud-invests-world-model-ai-shengshu-vidu.html)

**内容摘要**：

4 月 10 日，CNBC 报道阿里巴巴云**领投**了生数科技 **20 亿元人民币（约 2.9 亿美元）** 的 B 轮融资，好未来教育和百度风投跟投。这距离生数科技两个月前完成 A 轮融资（启明创投等领投，6 亿元）仅过去很短时间——融资节奏之快反映了资本对"世界模型"赛道的极度看好。

生数科技的核心产品 **Vidu** 是一款 AI 视频生成工具，最新发布的 Vidu Q3 Pro 在文本和图像生成视频的能力上已进入全球前十。但这笔投资指向的不是视频生成本身——而是更宏大的 **"通用世界模型"** 愿景。

与大语言模型（LLM）基于文本理解世界不同，世界模型基于视频和物理场景构建，目标是**模拟和理解物理世界的运作规律**。这被认为是实现 AGI 和推动机器人技术的关键缺失环节：LLM 提供了知识和推理，世界模型填补了对物理世界的感知和理解。

生数科技已在与多家"具身智能"公司建立合作，覆盖工业、商业和家庭环境。阿里巴巴近期还投资了 Tripo AI（3D 模型生成）和 PixVerse（实时视频生成），并发布了支持机器人的开源模型——一条从"数字内容生成"到"物理世界交互"的投资链条正在成型。

**值得关注的原因**：
- "世界模型"是继 LLM 之后最值得关注的技术范式——它试图解决 LLM 无法解决的问题：理解物理世界的因果关系和空间逻辑
- 阿里、百度同时参与投资，说明中国 AI 巨头们已经达成共识：下一个战场不在文本，而在物理世界建模
- Vidu 在 OpenAI 发布 Sora 之前就已全球推出，如今 Sora 已关停（Vol.5），Vidu 仍在快速迭代——先发优势正在兑现
- 从 LLM 到世界模型的投资转向，可能预示着 2026 下半年 AI 行业叙事的重大变化——"让 AI 理解物理世界"将取代"让 AI 更会说话"成为新的主线

**相关链接**：
- [CNBC 独家报道](https://www.cnbc.com/2026/04/10/alibaba-cloud-invests-world-model-ai-shengshu-vidu.html)

---

## 今日速览

- **腾讯新闻发布《AI 趋势研究白皮书 2026Q1》**：4 月 10 日，腾讯新闻发布了长达 59 页的 AI Agent 行业报告，核心判断是"2026 年 Q1，AI Agent 完成了成人礼"——从"更聪明的聊天机器人"蜕变为具备工具调用、多步规划、跨应用协作能力的"新劳动力"。报告追踪了产品化驱动的增长飞轮（Agent 产品化 → 商业模式验证 → 企业采购 → 数据反馈 → 能力提升），认为 Q1 是这个飞轮第一次完整转动的季度。([腾讯新闻](https://news.qq.com/rain/a/20260409A089VS00) · [极客公园](https://www.geekpark.net/news/362374))
- **面壁智能完成数亿元融资，跻身基座大模型独角兽**：4 月 10 日，面壁智能宣布完成由深创投和汇川产投联合领投的新一轮融资，金额数亿元。加上此前融资，面壁智能 Q1 累计融资规模超 10 亿元，正式跻身基座大模型独角兽行列——端侧模型赛道的融资热度持续升温。([格熊](https://www.gexiong.com/rmzx/281.html))

---

## 编者按

> 下周一（4 月 14 日）可能是 2026 年 AI 行业最重要的一天。
>
> GPT-6 的 200 万 Token 上下文窗口不仅仅是一个技术指标——它重新定义了"AI 能一次性处理多少信息"的边界。当一个模型可以一次性读完一个中等规模的代码仓库或一整本教材，很多原本需要分步处理、手动切片的 Agent 工作流就会被"暴力简化"。这对下游的编码助手、文档分析、研究工具意味着什么，值得每个开发者认真思考。
>
> 但今天最让人不安的新闻来自 Mythos 的后续。美联储主席亲自出面讨论一个 AI 模型的安全影响——这在人类历史上是第一次。不足 1% 的修补率揭示了一个我们还没准备好面对的结构性问题：**AI 发现问题的速度和人类解决问题的速度之间存在无法弥合的鸿沟**。当 Mythos 可以在四周内发现几千个零日漏洞，而人类需要几个月才能修补其中的几十个，"安全"这个词的定义就需要被重新书写。
>
> DeepSeek V4 适配华为昇腾则是另一条暗线。当中国最强的开源模型可以在完全脱离 NVIDIA 的国产芯片上运行时，算力制裁的有效性就需要被重新评估。这不是一个技术问题，而是一个地缘战略信号——而且这个信号是以开源的方式向全世界广播的。
>
> 四月下旬，GPT-6、DeepSeek V4、可能还有其他惊喜将密集落地。做好准备。
