---
title: "Mistral 首发开放权重语音模型 Voxtral TTS、xAI Grok Imagine 1.0 登顶视频生成排行榜、Claude 付费用户年内翻倍"
description: "Mistral 发布 40 亿参数开源 TTS 模型以 68% 胜率击败 ElevenLabs，xAI 以 1/7 价格登顶视频生成质量榜并推出 $10 平民套餐，Anthropic 信用卡数据揭示付费订阅爆炸式增长"
date: 2026-03-29
series: "大模型前沿动态"
volume: 8
tags: ["Mistral", "Voxtral TTS", "语音合成", "xAI", "Grok Imagine", "视频生成", "SuperGrok Lite", "Anthropic", "Claude", "付费订阅", "中关村论坛", "CERN", "Bluesky"]
---

## 今日动态

> 本期追踪到 3 项核心进展，以及 4 项快讯。

---

### 🏢 Mistral AI：发布 Voxtral TTS——40 亿参数开放权重语音合成模型，3 秒克隆语音

**发布时间**：2026-03-26
**来源**：[Mistral 官方博客](https://mistral.ai/news/voxtral-tts) · [TechCrunch](https://techcrunch.com/2026/03/26/mistral-releases-a-new-open-source-model-for-speech-generation/) · [SiliconAngle](https://siliconangle.com/2026/03/26/mistral-releases-open-weights-speaking-ai-model-voxtral-tts/)

**内容摘要**：

法国 AI 公司 Mistral AI 正式发布了 **Voxtral TTS**——这是其首个文本转语音（TTS）模型，也是开源 TTS 领域的一次重要突破。此前 Mistral 已发布过语音转录模型 Voxtral Transcribe，此次 TTS 的推出补齐了其语音 AI 的最后一块拼图，形成了端到端的语音交互闭环。

**模型架构** 采用三层级设计，总计 40 亿参数：
1. **Transformer 解码器主干**（34 亿参数）：基于 Ministral 架构，负责文本理解和语义预测
2. **流匹配声学变换器**（3.9 亿参数）：将语义表示转换为细粒度声学特征
3. **神经音频编解码器**（3 亿参数）：生成高保真音频波形

关键性能指标极为亮眼：对于 500 字符输入（约 10 秒语音），模型延迟仅 **70ms**，实时率（RTF）达到 **9.7 倍**——合成速度几乎是实际说话速度的 10 倍。模型支持 **9 种语言**（英/法/德/西/荷/葡/意/印地/阿拉伯），且仅需 **3 秒参考音频** 即可实现零样本语音克隆，精准保留说话者的音色、音调和口音特征。

在人类盲测中，Voxtral TTS 的表现令人瞩目：对比行业标杆 **ElevenLabs Flash v2.5**，多语言语音克隆偏好度达到 **68.4%**；对比 ElevenLabs v3，在说话人相似度上达到同等或更高水平。

该模型以 **CC BY-NC**（署名-非商业）许可发布开放权重，经量化后可在消费级智能手机和笔记本电脑上运行。

**值得关注的原因**：
- 这是 Mistral 从文本/代码模型向多模态全面扩展的标志性一步——语音是 AI Agent 的核心交互界面，掌握了 TTS 就掌握了 Agent 的「嘴巴」
- 40 亿参数 + 70ms 延迟的组合意味着这是一个真正可部署到边缘设备的语音模型，对企业私有化部署极为友好
- 开放权重直接挑战 ElevenLabs 和 OpenAI 的闭源 TTS 垄断——开发者终于有了一个性能媲美商业方案的开源替代
- 与 Voxtral Transcribe 的原生集成可构建低延迟语音到语音（S2S）管线，为 Voice Agent 提供完整基础设施

**相关链接**：
- [Mistral 官方公告](https://mistral.ai/news/voxtral-tts) · [TechCrunch 报道](https://techcrunch.com/2026/03/26/mistral-releases-a-new-open-source-model-for-speech-generation/) · [MarkTechPost 技术详解](https://www.marktechpost.com/2026/03/28/mistral-ai-releases-voxtral-tts-a-4b-open-weight-streaming-speech-model-for-low-latency-multilingual-voice-generation/) · [腾讯云中文报道](https://cloud.tencent.com/developer/news/3755270)

---

### 🏢 xAI：Grok Imagine 1.0 以 1/7 价格登顶视频生成质量榜，SuperGrok Lite 开启 $10 平民化时代

**发布时间**：2026-03-25（SuperGrok Lite）/ 2026-03-27（Grok Imagine 1.0 排行榜）
**来源**：[DeepLearning.AI](https://charonhub.deeplearning.ai/grok-imagine-1-0-sharply-cuts-costs-for-high-quality-video-generation/) · [Business Today](https://www.businesstoday.in/technology/story/xai-makes-grok-affordable-with-new-supergrok-lite-plan-check-price-and-what-it-offers-522462-2026-03-26)

**内容摘要**：

Elon Musk 的 xAI 在本周密集出击，从视频生成到订阅定价全面发力。

**Grok Imagine 1.0** 视频生成器在 Artificial Analysis 的盲测排行榜中**发布即登顶**，超越 Runway Gen-4.5、Kling 2.5 Turbo 和 Google Veo 3.1。在 LMArena 的图生视频类别中以 1,400 Elo 分排名第一（Veo 3.1 为 1,395），文生视频排名第四（1,362 分）。更具冲击力的是定价：API 价格仅 **$4.20/分钟**（含音频），是 OpenAI Sora 2 Pro（$30/分钟）的 **七分之一**，与 Kling 2.5 Turbo 持平。

生成速度方面仍有优化空间：平均 110 秒生成一个视频，慢于 Kling 2.5 Turbo（89 秒）和 Vidu Q2（39 秒），但远快于 Sora 2 Pro（448 秒）。IVEBench 用户评测中，用户 64% 的时间更偏好 Grok Imagine 1.0 而非 Runway Aleph，57% 偏好其超过 Kling O1。

与此同时，xAI 推出了 **SuperGrok Lite** 订阅计划——每月仅 **$10**，是标准 SuperGrok（$30/月）的三分之一。该计划提供基础的 AI 图像和视频生成能力，但引发争议的是：**此前免费用户可用的部分 Imagine 功能现在需要付费才能使用**。

**值得关注的原因**：
- 在 OpenAI 关停 Sora 仅一周后，xAI 就以压倒性的性价比占据了视频生成赛道的质量榜首——时机选择极具攻击性
- $4.20/分钟的定价策略延续了 xAI「以价换量」的一贯风格，直接给 Google 和 Runway 施加价格压力
- SuperGrok Lite 的推出是 AI 消费市场分层化的又一信号——$10/$30/$200 三档覆盖从入门到专业的全部用户群
- 但将免费功能移入付费层的做法可能引发用户反弹，需要关注社区反馈

**相关链接**：
- [DeepLearning.AI 分析](https://charonhub.deeplearning.ai/grok-imagine-1-0-sharply-cuts-costs-for-high-quality-video-generation/) · [Business Today 报道](https://www.businesstoday.in/technology/story/xai-makes-grok-affordable-with-new-supergrok-lite-plan-check-price-and-what-it-offers-522462-2026-03-26) · [abit.ee 详解](https://abit.ee/en/artificial-intelligence/supergrok-lite-grok-xai-elon-musk-ai-subscription-chatbot-artificial-intelligence-en)

---

### 🏢 Anthropic：信用卡数据揭示 Claude 付费用户年内翻倍，五角大楼纠纷竟成「最佳广告」

**发布时间**：2026-03-28
**来源**：[TechCrunch](https://techcrunch.com/2026/03/28/anthropics-claude-popularity-with-paying-consumers-is-skyrocketing/)

**内容摘要**：

TechCrunch 3 月 28 日发布了一份基于消费者交易分析公司 **Indagari** 的独家数据报告，通过追踪约 **2,800 万美国消费者的匿名信用卡交易记录**，首次用硬数据描绘了 Claude 的付费订阅增长全貌。Anthropic 发言人向 TechCrunch 确认：**Claude 的付费订阅量在 2026 年已经翻了一倍多**。

具体数据点：
- **1-2 月新增付费订阅**创下历史纪录
- **2 月回流用户**（此前退订后重新订阅）数量同样创纪录
- 大多数新订阅者选择了最低档的 **Pro 计划（$20/月）**，而非 $100 或 $200 的高级档
- Claude 消费者总用户数估算在 **1,800 万到 3,000 万**之间（包含免费用户）

最引人注目的发现是增长驱动因素：付费用户增长的**最大爆发点**并非来自产品发布，而是来自**与五角大楼的公开冲突**。数据显示，在 1 月下旬媒体报道 Anthropic 拒绝国防部将 AI 用于武器系统之后，以及 CEO Dario Amodei 2 月 26 日发表公开声明期间，新用户注册出现了最急剧的攀升。Anthropic 此前投放的超级碗广告（嘲讽 OpenAI 向用户展示广告）也起到了品牌认知的推波助澜作用。

不过报告也指出：尽管增长迅猛，Claude 在付费消费者绝对数量上仍**远落后于 ChatGPT**——OpenAI 仍在以快速速度获取新付费用户，维持着最大消费者 AI 平台的地位。

**值得关注的原因**：
- 这是首次有第三方信用卡数据定量验证了 Claude 的消费者增长——此前的讨论多基于 Ramp 的企业端数据或社区口碑
- 「五角大楼事件驱动增长」这一发现极具讽刺性——政府试图打击 Anthropic 的行为反而成了最有效的用户获取渠道，某种意义上印证了「站在用户价值观一边」的品牌策略
- Pro 计划（$20/月）占比最高说明 Claude 正在从「开发者工具」向「大众消费品」转型，但高端套餐的渗透率仍有巨大提升空间
- 结合 Vol.7 报道的 Claude 限流事件，增长和算力之间的矛盾正在加剧——这将是 Anthropic 2026 年最大的运营挑战

**相关链接**：
- [TechCrunch 独家报道](https://techcrunch.com/2026/03/28/anthropics-claude-popularity-with-paying-consumers-is-skyrocketing/) · [AI Chief 分析](https://aichief.com/news/anthropics-claude-paid-consumer-demand-soars/)

---

## 今日速览

- **中关村论坛 AI 开源前沿论坛**：3 月 27 日召开，智谱 CEO 张鹏透露因 Agent 时代「干活」的 Token 消耗量是问答的 **10-100 倍**，已推动智谱近期提价。无问芯穹 CEO 夏立雪称自 1 月底起 Token 消耗量**每两周翻一番**。小米 MiMo 大模型负责人罗福莉预测大模型将实现「自进化」，竞争维度已从算法下沉到芯片和能源层面 ([新浪财经](https://finance.sina.com.cn/jjxw/2026-03-27/doc-inhsmxrn5138617.shtml))
- **CERN**：将超小型定制 AI 模型**物理烧入硅芯片**，用于大型强子对撞机（LHC）的实时数据过滤。LHC 每秒产生 40 TB 数据，传统软件无法实时处理，而「烧入硅」的 AI 模型可在**纳秒级**完成筛选决策。这是 AI 硬件化（从 GPU 推理到 ASIC 固化）的一个极端但极具启发性的案例 ([The Register](https://www.theregister.com/2026/03/22/cern_eggheads_burn_ai_into/) · [ORNL](https://www.ornl.gov/news/photon-framework-scales-ai-vulnerability-discovery))
- **Bluesky**：在 Atmosphere 大会上发布 AI 应用 **Attie**，由首席创新官 Jay Graber（前 CEO）和 CTO Paul Frazee 联合展示。Attie 利用 AI 帮助用户基于开源社交协议 AT Protocol 构建个性化信息流，标志着去中心化社交网络开始拥抱 AI——但选择的是「用户控制 AI」而非「AI 控制用户」的路线 ([TechCrunch](https://techcrunch.com/) · [AI Chief](https://aichief.com/news/bluesky-unlocks-personalized-feeds-with-attie-ai/))
- **斯坦福大学**：发布研究量化 AI 聊天机器人在提供个人建议时的「谄媚」（sycophancy）倾向及其潜在危害，为 AI 安全研究提供了新的评估维度——不仅要防止 AI「说错话」，还要防止 AI「说太好听的话」 ([TechCrunch](https://techcrunch.com/))

---

## 编者按

> 今天的三条核心新闻串联起来，呈现出 AI 行业正在同时发生的三场「定价革命」。
>
> **Mistral 重新定义了语音 AI 的价格**：一个 40 亿参数的开源模型，在盲测中以 68% 胜率击败了行业标杆 ElevenLabs，而且完全免费（非商业用途）。这对 ElevenLabs 和 OpenAI 的闭源 TTS 服务来说是一记重拳——当开源替代品在质量上已经不输甚至更优时，闭源的溢价空间还有多大？
>
> **xAI 重新定义了视频生成的价格**：$4.20/分钟 vs Sora 2 Pro 的 $30/分钟，质量还更好——这是一个 7 倍的价格差距。联想到 OpenAI 一周前刚关停 Sora，xAI 的时机选择几乎有种「趁你病要你命」的残酷。在 AI 消费端，$10 的 SuperGrok Lite 则标志着一个新阈值的出现：**AI 订阅正在进入「咖啡价」时代**。
>
> **Anthropic 重新定义了「危机公关」的价格**：与五角大楼的冲突非但没有打击用户信心，反而成了最强大的用户获取引擎。这个结论的含义远比数据本身更深远——它说明在 AI 时代，**用户忠诚度不再仅仅来自产品体验，更来自价值观认同**。当你公开拒绝让 AI 用于武器系统时，你赢得的不仅是道德高地，更是真金白银的订阅收入。
>
> 中关村论坛上「Token 消耗量每两周翻一番」的数据则提醒我们：无论价格怎么降，**总需求的指数级增长正在吞噬一切效率提升**。从问答到 Agent，从文本到视频，从云端到硅芯片——AI 正在以前所未有的速度渗透到物理世界的每一个角落。
