---
title: "Meta 发布 Muse Spark 重返前沿竞争、Anthropic 五角大楼诉讼败诉、OpenAI 基金会押注阿尔茨海默病"
description: "Meta Superintelligence Labs 交出第一份答卷——Muse Spark 在健康推理和科学基准上击败 GPT-5.4，DC 上诉法院驳回 Anthropic 暂停供应链风险标签的请求，OpenAI Foundation 宣布超 1 亿美元阿尔茨海默病研究资助"
date: 2026-04-09T09:00
series: "大模型前沿动态"
volume: 13
tags: ["Meta", "Muse Spark", "Alexandr Wang", "MSL", "Anthropic", "五角大楼", "供应链风险", "OpenAI", "阿尔茨海默", "Google", "LiteRT-LM", "边缘推理", "xAI", "联合创始人"]
---

## 今日动态

> 本期追踪到 4 家机构的 4 项核心进展，以及 3 项快讯。

---

### 🏢 Meta：Muse Spark 发布——Alexandr Wang 的 MSL 交出第一份答卷，告别 Llama 一年后重返前沿

**发布时间**：2026-04-08
**来源**：[CNBC](https://www.cnbc.com/2026/04/08/meta-debuts-first-major-ai-model-since-14-billion-deal-to-bring-in-alexandr-wang.html) · [OfficeChai](https://officechai.com/ai/meta-muse-spark-benchmarks/) · [VentureBeat](https://venturebeat.com/technology/goodbye-llama-meta-launches-new-proprietary-ai-model-muse-spark-first-since) · [Wired](https://www.wired.com/story/muse-spark-meta-open-source-closed-source/)

**内容摘要**：

距离 Llama 4 发布整整一年，Meta 终于带着全新模型回来了。4 月 8 日，**Meta Superintelligence Labs（MSL）** 发布了其成立以来的首款前沿模型 **Muse Spark**（内部代号 "Avocado"）。这是 Alexandr Wang 去年 6 月以 143 亿美元 Scale AI 交易加入 Meta 担任首席 AI 官后的第一个重大产出。

与 Llama 系列的开源路线不同，**Muse Spark 是闭源的**——Meta 表示"希望未来能开源版本"，但目前 API 仅向"选定合作伙伴"提供私有预览。这是 Meta AI 战略的一次重大转向。

基准测试数据显示 Muse Spark 并非全面领先，但在特定垂直领域表现惊人：

**领先项**：
- **HealthBench Hard**（开放式健康查询）：**42.8**，超越 GPT 5.4（40.1）和 Gemini 3.1 Pro（20.6）——Meta 与 1000+ 名医生合作策划了训练数据
- **CharXiv Reasoning**（图表理解，Thinking 模式）：**86.4**，超越 GPT 5.4（82.8）和 Gemini 3.1 Pro（80.2）
- **Humanity's Last Exam**（Contemplating 模式）：**50.2**，超越 Gemini Deep Think（48.4）和 GPT 5.4 Pro（43.9）
- **FrontierScience Research**（Contemplating 模式）：**38.3**，超越 GPT 5.4 Pro（36.7）和 Gemini Deep Think（23.3）

**落后项**：
- **ARC AGI 2**（抽象推理）：42.5，远低于 Gemini 3.1 Pro（76.5）和 GPT 5.4（76.1）
- **Terminal-Bench 2.0**（代理编码）：59.0，低于 GPT 5.4（75.1）和 Gemini 3.1 Pro（68.5）

一个关键工程指标：MSL 声称 Muse Spark 使用的算力比 Llama 4 Maverick **少一个数量级**，但在多项基准上性能相当甚至更优。这意味着 Meta 九个月重建技术栈的核心成果是训练效率的飞跃，而非暴力堆参数。

Muse Spark 目前已部署到独立 Meta AI 应用和桌面网站，未来数周将登陆 Facebook、Instagram、WhatsApp、Messenger 以及 Ray-Ban Meta AI 智能眼镜。Meta 还推出了 **Contemplating 模式**——通过"AI 代理小组"并行推理处理复杂任务，对标 Gemini Deep Think 和 GPT Pro。

**值得关注的原因**：
- 从开源（Llama）到闭源（Muse Spark）的战略转向，标志着 Meta 意识到纯开源路线在前沿模型竞争中难以变现——这将改变整个开源 AI 生态的预期
- 健康领域的突出表现（1000+ 医生参与数据策划）暗示 Meta 正在押注 AI+医疗作为差异化赛道
- 算力效率提升一个数量级是最值得关注的技术信号——如果 MSL 的训练方法论被验证，它将证明"重建技术栈"比"在旧架构上堆规模"更有效
- Meta 2026 年 AI 资本支出 1150-1350 亿美元（去年的近两倍），Muse Spark 只是 MSL 路线图的起点

**相关链接**：
- [CNBC 独家报道](https://www.cnbc.com/2026/04/08/meta-debuts-first-major-ai-model-since-14-billion-deal-to-bring-in-alexandr-wang.html) · [OfficeChai 基准分析](https://officechai.com/ai/meta-muse-spark-benchmarks/) · [VentureBeat](https://venturebeat.com/technology/goodbye-llama-meta-launches-new-proprietary-ai-model-muse-spark-first-since) · [Wired](https://www.wired.com/story/muse-spark-meta-open-source-closed-source/) · [Simon Willison 分析](https://simonwillison.net/2026/Apr/8/muse-spark/)

---

### 🏢 Anthropic：DC 上诉法院驳回暂停动议——五角大楼"供应链风险"标签仍生效

**发布时间**：2026-04-08
**来源**：[Reuters](https://wkzo.com/2026/04/08/us-court-declines-to-block-pentagons-anthropic-blacklisting-for-now/) · [CCIA](https://ccianet.org/news/2026/04/dc-federal-court-denies-motion-to-stay-pentagons-action-against-anthropic-ccia-comments-on-ruling/)

**内容摘要**：

Anthropic 与五角大楼的法律拉锯战在 4 月 8 日迎来了不利转折。**华盛顿特区联邦上诉法院拒绝了 Anthropic 的暂停动议**，意味着国防部将其列为"供应链风险"的决定在上诉期间继续生效。

事件时间线回顾：
- **Vol.6**（3 月 27 日）报道了加州法官 Rita Lin 初步裁定联邦机构不得对 Anthropic 执行该标签
- **4 月 2 日**，五角大楼通过司法部正式提起上诉，要求推翻 Lin 法官的裁定
- **4 月 8 日**，DC 上诉法院站在了五角大楼一边——驳回 Anthropic 的暂停请求

这意味着 Anthropic 目前面临**两个相互矛盾的法院裁决**：加州法院说"不能对 Anthropic 使用该标签"，DC 法院说"可以在上诉期间继续使用"。在这种法律混乱状态下，联邦机构在实践中如何对待 Claude 模型将取决于各机构自己的风险判断。

**值得关注的原因**：
- 两个法院的矛盾裁决为整个 AI 行业的政府合规制造了空前的不确定性——如果连法院都无法统一意见，企业如何规划政府业务
- 对 Anthropic 的直接商业影响：联邦政府是 AI 服务的最大单一客户群体之一，"供应链风险"标签可能导致部分政府合同被冻结或重新招标
- 这是 AI 公司与国防部之间权力边界的标志性案例——Anthropic 拒绝五角大楼将 Claude 用于进攻性军事目的，五角大楼则通过行政手段施压
- 时间点微妙：这一败诉发生在 Anthropic ARR 达到 300 亿美元、Mythos 发布的同一周——商业和技术上的强势未能转化为法律上的优势

**相关链接**：
- [Reuters 报道](https://wkzo.com/2026/04/08/us-court-declines-to-block-pentagons-anthropic-blacklisting-for-now/) · [CCIA 评论](https://ccianet.org/news/2026/04/dc-federal-court-denies-motion-to-stay-pentagons-action-against-anthropic-ccia-comments-on-ruling/) · [Inside Defense](https://insidedefense.com/insider/pentagon-appealing-order-remove-anthropic-supply-chain-risk-label)

---

### 🏢 OpenAI Foundation：AI for Alzheimer's——超 1 亿美元押注阿尔茨海默病研究

**发布时间**：2026-04-08
**来源**：[OpenAI Foundation](https://openaifoundation.org/news/ai-for-alzheimers)

**内容摘要**：

4 月 8 日，OpenAI Foundation 宣布正在向六家研究机构敲定超过 **1 亿美元**的拨款，专门用于加速阿尔茨海默病的研究。这是 Vol.4 中报道的"OpenAI Foundation 一年内拨款 10 亿美元"承诺中的第一个大规模定向落地项目。

Foundation 表示将在 2026 年全年及以后持续追加阿尔茨海默病领域的资助，覆盖更多科学家和研究机构，目标是"最终实现对阿尔茨海默病的预防和治疗"。

这标志着 OpenAI 的慈善战略从"广泛承诺"进入"定向落地"阶段——从一年前的 10 亿美元框架性宣布，到现在具体到疾病领域、具体到六家机构、具体到超 1 亿美元的金额。

**值得关注的原因**：
- 阿尔茨海默病影响全球超过 5500 万人，是最昂贵的慢性疾病之一——AI 在药物发现和生物标志物分析中的应用是一个高影响力的交叉领域
- 1 亿美元级别的定向拨款使 OpenAI Foundation 跻身该领域最大的私人资助者行列
- 从商业角度看，这也是 OpenAI IPO 前的叙事建设——"不仅赚钱，还在解决人类最大的健康挑战"

**相关链接**：
- [OpenAI Foundation 公告](https://openaifoundation.org/news/ai-for-alzheimers)

---

### 🏢 Google：LiteRT-LM 开源——把大模型塞进手机和树莓派的生产级推理框架

**发布时间**：2026-04-07
**来源**：[GitHub](https://github.com/google-ai-edge/LiteRT-LM) · [Google AI Edge](https://ai.google.dev/edge/litert-lm/overview?hl=zh-CN) · [AIToolly 中文解析](https://aitoolly.com/zh/ai-news/article/2026-04-08-google-launches-litert-lm-a-high-performance-open-source-framework-for-edge-device-llm-inference)

**内容摘要**：

Google AI Edge 团队开源了 **LiteRT-LM**——一个生产级的高性能推理框架，专为在边缘设备上部署大语言模型而设计。这不是又一个实验性项目，而是直接定位于生产环境。

LiteRT-LM 的核心价值主张是：弥合复杂 AI 模型与资源受限硬件之间的鸿沟。它支持在 Android 手机、iOS 设备、树莓派等边缘硬件上实现低延迟、隐私保护的 LLM 推理，**无需依赖云基础设施**。与 Vol.12 中报道的 Gemma 4 E2B/E4B 移动端模型形成互补——Gemma 4 是"模型"，LiteRT-LM 是"引擎"。

配套发布的 **Google AI Edge Gallery** 是一款实验性应用，展示完全离线运行的设备端生成式 AI 功能，已上架 Google Play 和 App Store。

**值得关注的原因**：
- 这完成了 Google 的边缘 AI 全栈布局：Gemma 4（开源模型）+ LiteRT-LM（推理引擎）+ AI Edge Gallery（Demo 应用）——从模型到部署工具到展示应用一条龙
- 隐私保护的离线推理能力对医疗、金融等敏感行业尤其关键——数据不出设备是许多企业的硬性合规要求
- 开源且生产级的定位使其成为 NVIDIA TensorRT-LLM 在边缘场景的直接替代

**相关链接**：
- [GitHub 仓库](https://github.com/google-ai-edge/LiteRT-LM) · [Google AI Edge 文档](https://ai.google.dev/edge/litert-lm/overview?hl=zh-CN)

---

## 今日速览

- **xAI 创始团队"全灭"**：据 TechCrunch 3 月 28 日报道，xAI 最后一位联合创始人 **Ross Nordeen** 已离开公司，至此 12 位联合创始人中**全部 12 人均已离职**。此前 Vol.10 中提到的 Terafab 项目和 SpaceX 收购背景下，马斯克在 3 月中旬公开承认 xAI"需要重建"。SpaceX 高级副总裁 Michael Nicolls 已接管 xAI 总裁一职，内部备忘录显示其认为 xAI"明显落后于竞争对手"。创始人集体出走 + 高管空降 + 架构重组——xAI 正在经历一次彻底的组织重置 ([TechCrunch](https://techcrunch.com/2026/03/28/elon-musks-last-co-founder-reportedly-leaves-xai/) · [36氪](https://www.36kr.com/p/3724759367383685))
- **OpenAI IPO 动态**：CFO Sarah Friar 确认 OpenAI 在 IPO 时"肯定"会为散户投资者预留股份，延续 Vol.10 中报道的 30 亿美元散户参与融资的路线——从私募到公募的大众化策略已成定局 ([CNBC](https://www.cnbc.com/))
- **Gemini App 新增 Notebooks 功能**：Google 在 Gemini 应用中引入"Notebooks"功能，深化与 NotebookLM 的集成，为用户提供整理聊天记录和文件的空间——Google 正在将 Gemini 从"对话工具"升级为"个人知识管理系统" ([9to5Google](https://9to5google.com/))

---

## 编者按

> 今天的新闻中最值得细品的是 **Meta 的战略转向**。
>
> 一年前，Meta 还是开源 AI 的最大旗手——Llama 系列让"开源即正义"的叙事深入人心。今天，Muse Spark 以闭源姿态登场，API 仅向"选定合作伙伴"开放。Alexandr Wang 的加入不仅带来了 Scale AI 的数据工程能力，更带来了一种截然不同的商业哲学：**模型可以开源，但前沿能力是要收费的**。
>
> 有趣的是，Muse Spark 并没有试图在所有基准上称王。ARC AGI 2 的 42.5 分（vs Gemini 的 76.5）说明 MSL 清楚自己的短板。但它选择了一条更聪明的路——用 1000+ 名医生策划训练数据，在 HealthBench 上超越所有对手。**垂直领域的深度碾压比全面平庸的追赶更有商业价值**。当 GPT 和 Gemini 在通用基准上互相追逐时，Meta 选择在医疗健康领域建立护城河——这可能是 2026 年最值得关注的产品策略分化。
>
> 另一条暗线是 **AI 公司与政府的关系**正在经历前所未有的重塑。Anthropic 在 DC 败诉意味着"以安全之名拒绝军事合作"的路线并不能获得法律保护——相反，它可能招致行政报复。OpenAI 则选择了另一种与政府共处的方式：1 亿美元阿尔茨海默病拨款，既是真实的社会贡献，也是政治资本的积累。在 IPO 前夕，"解决人类最大的健康挑战"的叙事比任何基准测试分数都更有说服力。
