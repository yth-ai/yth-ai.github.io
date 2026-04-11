---
title: "黄仁勋宣称 AGI 已实现、Anthropic 发布 AI 经济学习曲线报告、OpenAI Foundation 承诺 10 亿美元慈善拨款"
description: "NVIDIA CEO 在 Lex Fridman 播客上引爆 AGI 争论，Anthropic 用数据揭示 AI 使用的「学习曲线效应」，OpenAI 非营利基金会公布大规模资助计划"
date: 2026-03-25
series: "大模型前沿动态"
volume: 4
tags: ["NVIDIA", "AGI", "Jensen Huang", "Anthropic", "经济指数", "OpenAI Foundation", "慈善", "AI 代理"]
---

## 今日动态

> 本期追踪到 3 家机构的 3 项核心进展，以及 3 项快讯。

---

### 🏢 NVIDIA / Jensen Huang：在 Lex Fridman 播客上宣称「AGI 已经实现」

**发布时间**：2026-03-23（播客发布）/ 2026-03-24（广泛传播）
**来源**：[CNBC-TV18 报道](https://www.cnbctv18.com/technology/nvidias-jensen-huang-claims-agi-is-already-achieved-adds-caveats-ws-l-19874304.htm) · [The Verge 报道](https://www.theverge.com/) · [AIToolly](https://aitoolly.com/ai-news/article/2026-03-24-nvidia-ceo-jensen-huang-declares-achievement-of-artificial-general-intelligence-agi-on-lex-fridman-p)

**内容摘要**：

NVIDIA CEO 黄仁勋在 3 月 23 日的 Lex Fridman 播客中，面对「AGI 何时到来」的提问，给出了一个震动行业的回答：**「我觉得就是现在。我认为我们已经实现了 AGI。」**

他的论据主要基于 AI 代理（Agent）的快速发展——用户已经在用个人 AI 代理完成各种复杂任务，且新型应用（如数字网红、社交工具）正以超出预期的速度涌现。Fridman 在播客中将 AGI 定义为「能够执行复杂现实世界任务的系统，例如建立和运营一家价值数十亿美元的公司」。

然而，黄仁勋随即加了关键补充：他承认当前 AI 系统仍有明显局限，许多 AI 工具虽初期获得关注但后劲不足，且现有代理**独立建立起像 NVIDIA 这样规模的公司的可能性极低**。这一保留意见让他的「AGI 已实现」声明留下了巨大的讨论空间。

**值得关注的原因**：
- 黄仁勋是全球市值最高科技公司之一的掌舵人，他对 AGI 的判断直接影响资本市场和行业预期
- 这暴露了 AGI 定义之争的核心矛盾：如果用「实用主义」标准（AI 能完成大量有价值的任务），AGI 或许已到；如果用「科学标准」（通用推理、自主学习），还远远不够
- 有趣的是，OpenAI 的 Pachocki 上周刚表示 2028 年才可能实现「经济变革性 AI」，而黄仁勋直接跳过了这个时间线

**相关链接**：
- [Lex Fridman Podcast](https://lexfridman.com/) · [Silicon Republic 分析](https://www.siliconrepublic.com/machines/is-agi-really-here-as-nvidias-jensen-huang-claims)

---

### 🏢 Anthropic：发布经济指数报告「Learning Curves」，揭示 AI 使用的学习曲线效应

**发布时间**：2026-03-24
**来源**：[Anthropic Research](https://www.anthropic.com/research/economic-index-march-2026-report)

**内容摘要**：

Anthropic 发布了 2026 年 3 月的经济指数报告，标题为「Learning Curves」（学习曲线），这是继 1 月报告之后的第二期。报告基于 Claude.ai 和第一方 API 各 100 万次对话的隐私保护采样数据，覆盖 2026 年 2 月 5-12 日的使用情况，揭示了几个重要趋势：

**使用多样化**：Claude.ai 上前 10 大任务占总流量的比例从 2025 年 11 月的 24% 下降至 2026 年 2 月的 **19%**。编码任务正从 Claude.ai 大量迁移到 API（特别是 Claude Code），表明开发者正在将编程工具深度集成到工作流中。

**学习曲线效应**：这是报告的核心发现——**使用 Claude 超过 6 个月的「高任期用户」对话成功率比新用户高出 10%**。他们的个人对话减少 10%，工作用途高出 7 个百分点，且倾向于尝试更高价值、更复杂的任务。报告还发现，每增加一年使用经验，用户提示所需的教育年限增加近 1 年，说明用户在「学着用 AI 做更难的事」。

**模型选择与任务匹配**：付费用户会将更强的 Opus 模型分配给「更值钱」的任务——每增加 10 美元时薪的任务，使用 Opus 的比例增加 1.5 个百分点（API 用户为 2.8 个百分点）。

**值得关注的原因**：
- 「学习曲线效应」是首个大规模数据验证的发现：**用 AI 越久的人，用得越好**——这意味着 AI 带来的生产力提升不是即时的，而需要「干中学」
- 但报告也暗示了一个令人担忧的趋势：早期采用者（通常是高技能工人）获益更多，AI 可能加剧而非缩小劳动力市场不平等
- 编码任务从 Web 端迁移到 API 的趋势，说明开发者对 AI 编程工具的使用正从「偶尔问问」转向「深度嵌入工作流」

**相关链接**：
- [完整报告](https://www.anthropic.com/research/economic-index-march-2026-report) · [数据集 (Hugging Face)](https://huggingface.co/datasets/Anthropic/EconomicIndex)

---

### 🏢 OpenAI Foundation：承诺一年内拨款 10 亿美元，聚焦生命科学、就业影响和 AI 安全

**发布时间**：2026-03-24
**来源**：[ABC News / 美联社](https://abcnews.com/Business/wireStory/openai-foundation-pledges-1b-grants-ensure-ai-benefits-131363014) · [StartupHub](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/openai-foundation-unveils-1b-funding-plan)

**内容摘要**：

控制 OpenAI 公司的非营利组织——OpenAI Foundation 宣布，将在**未来一年内拨款至少 10 亿美元**，使命是确保 AI「造福全人类」。这是该基金会自去年秋季完成组织重组以来最大规模的资助行动。

资助将聚焦四大领域：

1. **生命科学与健康**：利用 AI 加速医疗研究，重点包括阿尔茨海默病路径映射和个性化治疗，由前 Coefficient Giving 成员 Jacob Trefethen 领导。
2. **就业与经济影响**：应对 AI 对劳动力市场的冲击，开发经济转型解决方案。
3. **AI 韧性**：由 OpenAI 联合创始人 Wojciech Zaremba 负责，关注 AI 对儿童的影响、生物安全准备、以及通过独立测试加强模型安全。
4. **社区支持**：延续「以人为本 AI 基金」，帮助社区组织应对 AI 驱动的变革。

值得注意的历史对比：OpenAI 非营利部门在 2018 年支出 5,100 万美元，但成立盈利业务后的 2019 年骤降至 330 万美元。2024 年全年仅发放 760 万美元赠款。此次 10 亿美元的承诺标志着战略性回归。

**值得关注的原因**：
- 10 亿美元使 OpenAI Foundation 瞬间跻身全球最大科技慈善机构之列，但能否真正独立于商业利益运作是关键问题
- 由 OpenAI 联合创始人 Zaremba 领导 AI 安全方向，既是优势（技术理解深），也是隐忧（利益冲突）
- 资助领域覆盖了当前 AI 伦理讨论的核心议题（就业冲击、儿童安全、生物风险），但执行力和独立性有待观察

**相关链接**：
- [ABC News 报道](https://abcnews.com/Business/wireStory/openai-foundation-pledges-1b-grants-ensure-ai-benefits-131363014) · [StartupHub 详细分析](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/openai-foundation-unveils-1b-funding-plan)

---

## 今日速览

- **字节跳动**：开源 Deer-Flow 超级代理架构，支持持续数分钟至数小时的长时运行任务，集成沙箱、内存管理和专用工具集，适用于研究、编程和创意任务 ([GitHub](https://github.com/bytedance/deer-flow))
- **Mozilla AI**：推出 Cq 平台——被称为「代理版的 Stack Overflow」。背景是 Stack Overflow 月活从 2014 年的 20 万骤降至 2025 年 12 月的 3,862，AI 编码代理面临知识孤岛问题，Cq 旨在为 AI 代理提供共享知识资源 ([来源](https://aitoolly.com/ai-news/2026-03-24))
- **OpenAI**：据 MIT Technology Review 报道，OpenAI 首席科学家 Pachocki 公布了「AI 研究员」路线图——2026 年 9 月推出「自主 AI 研究实习生」，2028 年推出完全自动化的多智能体研究系统，目标是构建数据中心内的「完整研究实验室」([来源](https://www.technologyreview.com/2026/03/20/1134438/openai-is-throwing-everything-into-building-a-fully-automated-researcher/))

---

## 编者按

> 本期最有争议的事件无疑是黄仁勋的「AGI 已实现」声明。作为 NVIDIA 的掌舵人，他有充分的商业动机推动这一叙事——AGI 的到来意味着对计算基础设施的更大需求。但抛开利益立场不谈，他的观点确实触及了一个真实的行业拐点：**AI 系统在越来越多的具体任务上已经达到甚至超过人类水平，但在「通用性」和「自主性」上仍有明显鸿沟。** 这到底算不算 AGI？答案取决于你用什么定义。
>
> Anthropic 的「Learning Curves」报告则提供了一个更冷静的视角：AI 的真实价值释放需要时间和学习。高任期用户成功率高出 10% 这一数据，说明 AI 不是开箱即用的万能工具，而是一个**需要「培养使用技能」的生产力伙伴**。对企业而言，这意味着仅仅部署 AI 工具远远不够——还需要投资于员工的 AI 素养培训。
>
> 而 OpenAI Foundation 的 10 亿美元承诺，则代表了 AI 行业对社会责任的一次大规模表态。在 OpenAI 估值突破 8,000 亿美元的背景下，这笔拨款是否只是「象征性的善举」，还是真能产生实质影响，值得持续关注。
