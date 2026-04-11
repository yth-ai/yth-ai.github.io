---
title: "上海AI实验室发布「珠穆朗玛计划」、智谱 GLM-5.1 编码能力飙升28%、OpenAI Sora 日烧1500万美元终被关停"
description: "浦江AI学术年会发布万亿参数科学大模型与AGI4S基础设施蓝图，智谱以国产芯片适配的编码旗舰逼近 Claude Opus 4.6，Sora 因经济灾难关停致迪士尼10亿美元交易崩塌"
date: 2026-03-31
series: "大模型前沿动态"
volume: 9
tags: ["上海AI实验室", "AGI4S", "珠穆朗玛计划", "Intern-S1-Pro", "智谱", "GLM-5.1", "OpenAI", "Sora", "Disney", "月之暗面", "Kimi K2.5", "Anthropic", "ARR"]
---

## 今日动态

> 本期追踪到 3 项核心进展，以及 4 项快讯。

---

### 🏢 上海AI实验室：浦江AI学术年会发布「AGI4S珠穆朗玛计划」，万亿参数科学大模型 Intern-S1-Pro 亮相

**发布时间**：2026-03-29
**来源**：[中新网上海](https://www.sh.chinanews.com.cn/kjjy/2026-03-29/145637.shtml) · [量子位](https://www.qbitai.com/2026/03/393344.html) · [上海AI实验室官网](https://www.shlab.org.cn/event/detail/102)

**内容摘要**：

3月29日，由图灵奖得主姚期智与上海AI实验室主任周伯文共同担任大会主席的第二届浦江AI学术年会在上海东方枢纽国际商务合作区召开，汇聚了百余位国内外AI领域顶尖学者。会上发布的核心成果是**「AGI for Science 珠穆朗玛计划」**——一个面向重大科学突破的系统性基础设施蓝图。

该计划的核心支撑体系包含三个层次：

**基础设施协同**：通过 **DeepLink 超智融合算力平台**连接通算、超算、智算集群，构建「算力一张图」；以 **Sciverse 科学智能数据库**（100PB 级，已开放 2500 万篇文献 / 6000 亿词元）提供 AI Ready 数据支撑；基于书生具身智能全栈引擎搭建自主实验平台，将合成科学等领域的研发周期从数年缩短至 3-6 个月。

**模型能力**：推出「通专融合」SAGE 架构和**万亿参数科学多模态大模型 Intern-S1-Pro**，具备奥赛金牌水平的数理逻辑推理能力。书生科学发现平台已支持调用 200 余个智能体、2200+ 专业工具及 PB 级数据集。

**场景共建**：联合中国航天、复旦大学、中国银联、商汤科技等 15 家顶尖机构，将 AGI 能力植入高能物理、新药创制、生物结构、疾病诊断、新材料开发等前沿场景。同步启动「浦江青年学者」计划和「攀登者计划 2.0」，构建从种子期培育到产业化落地的全周期项目支持体系。

**值得关注的原因**：
- 这是国内首个将算力、数据、自主实验和万亿参数模型打通的科学智能「全栈计划」——不是只发一个模型，而是构建了从基础设施到应用场景的完整闭环
- Intern-S1-Pro 的「奥赛金牌级」数理推理定位直接对标 Google DeepMind 的 Gemini 3 系列在科学推理上的能力，但走的是「通专融合」路线而非纯通用模型
- 100PB 级 Sciverse 数据库 + 2200+ 工具链的组合，如果开放程度足够高，可能成为中国科研界的「科学智能基础设施」——类似 Hugging Face 对开源社区的作用
- 自主实验平台将 AI 从「数字世界」延伸到「物理世界」，这是继 Vol.8 报道的 CERN 将 AI 烧入硅芯片之后，又一个 AI 深入实验科学的重要案例

**相关链接**：
- [中新网报道](https://www.sh.chinanews.com.cn/kjjy/2026-03-29/145637.shtml) · [量子位详细解读](https://www.qbitai.com/2026/03/393344.html) · [百度百科](https://baike.baidu.com/item/%E7%AC%AC%E4%BA%8C%E5%B1%8A%E6%B5%A6%E6%B1%9FAI%E5%AD%A6%E6%9C%AF%E5%B9%B4%E4%BC%9A/67551097)

---

### 🏢 智谱 AI：GLM-5.1 全量开放，编码能力飙升 28% 逼近 Claude Opus 4.6

**发布时间**：2026-03-27
**来源**：[IT之家](https://news.qq.com/rain/a/20260327A07A9B00) · [虎嗅](https://www.huxiu.com/ainews/10291.html) · [知乎讨论](https://www.zhihu.com/question/2020954059209803141)

**内容摘要**：

智谱 AI 于 3 月 27 日正式发布 **GLM-5.1** 旗舰模型，并面向所有 GLM Coding Plan 用户（Max、Pro、Lite）全量开放。这距离 2 月 11 日 GLM-5 发布仅过去了 44 天，3 月 16 日发布的 GLM-5-Turbo 更是只隔了 11 天——智谱正以惊人的迭代速度追赶前沿。

核心数据：
- **编码基准得分 45.3**，较 GLM-5 提升 **28%**
- 编码能力已「无限逼近 Claude Opus 4.6」
- 支持 **204,800 tokens** 上下文窗口，最大输出 **131,072 tokens**
- 内置推理模式，原生适配 Agent 场景

GLM-5.1 的一个差异化卖点是**国产芯片全适配**，价格仅为美国同等级模型的 1/5。这使得它在政策敏感的企业场景中具有独特优势。用户可通过 Claude Code 和 OpenClaw 两种方式手动配置调用——智谱直接提供了与 Anthropic API 兼容的接口（`open.bigmodel.cn/api/anthropic`），开发者几乎无需修改现有工作流即可切换。

一线开发者的反馈相当积极：有用户反馈在处理数据分析脚本时，GLM-5.1 半小时内完成了原本需要一天的工作；在知乎上的评测中，多位开发者称其在游戏开发、动效生成等场景中的表现「比 GLM-5 强至少一代」。

**值得关注的原因**：
- 44 天内从 GLM-5 迭代到 GLM-5.1 并实现 28% 的编码能力提升，这个迭代速度在国内大模型厂商中罕见——作为对比，OpenAI 从 GPT-5 到 GPT-5.4 用了约 7 个月
- 直接提供 Anthropic API 兼容接口是一个聪明的策略——利用 Claude Code 的生态红利，降低开发者迁移成本
- 国产芯片适配 + 1/5 价格的组合，在当前中美科技脱钩的大背景下，可能成为国内企业选择编程 AI 工具时的关键决策因素
- 智谱 3 月 31 日还将发布 2025 年度业绩（港股 02513），GLM-5.1 的快速迭代或将成为财报中的亮点叙事

**相关链接**：
- [IT之家报道](https://news.qq.com/rain/a/20260327A07A9B00) · [虎嗅分析](https://www.huxiu.com/ainews/10291.html) · [苏米客配置教程](http://xmsumi.com/detail/2781)

---

### 🏢 OpenAI：Sora 日烧 1500 万美元终被关停，迪士尼 10 亿美元交易随之崩塌

**发布时间**：2026-03-24（关停公告）/ 2026-03-25-26（迪士尼退出报道）
**来源**：[Ars Technica](https://arstechnica.com/ai/2026/03/the-end-of-sora-also-means-the-end-of-disneys-1-billion-openai-investment/) · [TechSpot](https://www.techspot.com/news/111812-openai-pulls-plug-sora-ending-1-billion-disney.html) · [law.com 法律分析](https://www.law.com/corpcounsel/2026/03/27/openais-sora-shutdown-scuttles-1b-disney-deal-raising-slow-roll-suspicions/)

**内容摘要**：

OpenAI 于 3 月 24 日正式宣布关停 Sora——这款仅上线 6 个月就曾登顶 iPhone App Store 的 AI 视频生成应用。App、API 和 sora.com 将全部下线。关停的核心原因是灾难性的经济账：**Sora 在高峰期每天消耗约 1500 万美元的推理算力成本**（年化约 54 亿美元），而其整个生命周期的累计收入仅约 **210 万美元**。

这一决定的连锁反应迅速波及商业合作。迪士尼随即宣布退出此前与 OpenAI 达成的**价值 10 亿美元的投资及内容授权协议**。据 Ars Technica 报道，迪士尼方面「完全被打了个措手不及」——没有资金实际交割。法律专家指出，这一事件暴露了 AI 领域「轻量协议」（light agreements）的风险：当核心产品被突然关停时，基于该产品的商业承诺形同虚设。

OpenAI 表示，释放出的算力将重新分配给更具商业价值的企业级 AI 工作负载。有分析认为这也是 OpenAI 为计划中的 2026 年 IPO 「止血」——一个日亏 1500 万美元的消费级产品显然不利于招股书中的财务叙事。

**值得关注的原因**：
- 日烧 1500 万美元 vs 终身收入 210 万美元——这可能是 AI 行业迄今为止最极端的「单位经济学失败」案例，直接挑战了「先烧钱抢用户再变现」的消费互联网逻辑在 AI 时代的可行性
- Sora 的关停与 Vol.8 报道的 xAI Grok Imagine 以 1/7 价格登顶形成鲜明对比——视频生成赛道正在经历残酷的淘汰赛，而非共同繁荣
- 迪士尼的退出向整个好莱坞发出信号：与 AI 公司签署大额协议时，产品稳定性和经济可持续性必须纳入尽职调查
- OpenAI 正从「什么都做的 AI 实验室」转型为「聚焦企业和编程的 AI 平台」——Sora 的关停是这一战略收缩的标志性事件

**相关链接**：
- [Ars Technica 独家](https://arstechnica.com/ai/2026/03/the-end-of-sora-also-means-the-end-of-disneys-1-billion-openai-investment/) · [NerdLevelTech 深度分析](https://nerdleveltech.com/openai-sora-shutdown-lessons-from-ais-most-expensive-failure) · [law.com 法律风险解读](https://www.law.com/corpcounsel/2026/03/27/openais-sora-shutdown-scuttles-1b-disney-deal-raising-slow-roll-suspicions/)

---

## 今日速览

- **月之暗面**：据界面新闻 3 月 30 日独家报道，Kimi K2.5 模型发布一个月后，月之暗面 **ARR（年度经常性收入）突破 1 亿美金**。K2.5 上线后 API 供应已趋于稳定。此前 3 月初月之暗面曾以 180 亿美元投前估值启动 10 亿美元新一轮融资，创下国内 AI 企业单轮融资规模与估值增速双纪录 ([36氪](https://m.36kr.com/p/3745160078868737) · [同花顺](https://stock.10jqka.com.cn/20260330/c675630709.shtml))
- **Anthropic**：多家分析机构估算 Anthropic 的 ARR 已飙升至约 **190 亿美元**（2024 年 12 月仅 10 亿），15 个月内增长 19 倍。增长三大引擎为 Claude Code（贡献约 25 亿 ARR）、超级碗广告（App Store 排名从 #42 跃升至 #7）、以及五角大楼争议带来的品牌效应。企业客户贡献了约 80% 的收入，使其 ARR 已超越 OpenAI（约 116 亿）。但 ChatGPT 在绝对用户数上仍远超 Claude（5000 万 vs 200-500 万付费用户） ([Awesome Agents](https://awesomeagents.ai/news/anthropic-claude-paid-subscriptions-double-arr-19b/) · [Sacra](https://sacra.com/c/anthropic/))
- **全球 AI 人才格局**：据 MSN 3 月 30 日报道，中国顶尖 AI 研究人才占比已**超过全球总数的一半**，超越美国、欧洲和亚洲其他地区的总和。更关键的变化在于「留存率」——中国本科毕业生选择留在国内从事 AI 研究的比例从 2019 年的 30% 攀升至 2025 年的 50%，人才回流趋势明显 ([MSN](https://www.msn.com/en-xl/news/other/half-of-top-ai-talent-now-chinese-surpassing-us/ar-AA1ZGMkF))
- **美国 AI 监管**：特朗普政府任命扎克伯格、黄仁勋、拉里·埃里森等 13 位科技巨头领袖加入总统科技顾问委员会（PCAST），意味着美国 AI 监管政策将主要由大型基础设施公司的利益相关者塑造。与此同时，上周已有四项 AI 相关法案在三个州签署成为法律，两个州通过了聊天机器人法案 ([ReadAboutAI](https://www.readaboutai.com/march-31-2026/) · [Troutman Privacy](https://www.troutmanprivacy.com/2026/03/proposed-state-ai-law-update-march-30-2026/))

---

## 编者按

> 今天的三条核心新闻恰好构成了 AI 行业「攻守易势」的三个剖面。
>
> **上海AI实验室的珠穆朗玛计划**，代表的是中国在 AI for Science 赛道上从「追赶论文数量」转向「构建基础设施」的战略升级。万亿参数的 Intern-S1-Pro 固然引人瞩目，但更值得关注的是 100PB 级数据库、跨集群算力互联、自主实验平台这些「看不见的基础设施」——这些是短期内无法通过一篇论文或一个模型复制的系统性优势。当 Google DeepMind 的 AGI 认知框架还停留在「如何定义和测量 AGI」时，上海AI实验室已经在回答一个更务实的问题：「如何让 AI 在科学发现中真正可用」。
>
> **智谱 GLM-5.1 的 44 天迭代**，则是国产大模型在编程赛道上的一次关键突破。28% 的编码能力提升和「逼近 Claude Opus 4.6」的定位，如果经过广泛的独立验证，将意味着中美在 AI 编程工具上的差距正在急剧缩小。更具战略意义的是那个 Anthropic API 兼容接口——智谱选择「寄生」于 Claude Code 生态而非另起炉灶，这是一种极其精明的市场进入策略。
>
> 而 **Sora 的关停**，则是对整个行业最深刻的警示：**在 AI 时代，「技术可行」和「经济可行」之间的鸿沟可能比以往任何时候都更宽广**。一个能生成令人惊叹视频的模型，如果每天要烧掉 1500 万美元、一生只赚 210 万美元，那它就不是产品，而是一场代价高昂的技术演示。OpenAI 有勇气关停它，说明这家公司正在从「什么都要做的 AI 实验室」向「必须赚钱的上市公司」转型——而这个转型过程中，会有更多的 Sora 被牺牲。
