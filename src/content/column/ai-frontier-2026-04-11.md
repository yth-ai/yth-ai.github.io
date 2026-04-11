---
title: "DeepSeek V4 万亿参数开源登场定价击穿行业底线、Meta 发布首款闭源模型标志开源路线转向、OpenAI 提出机器人税为 IPO 做政治铺垫"
description: "2026年4月第2周 AI 行业动态：DeepSeek V4 以 1T 参数 MoE 架构和 $0.28/百万 token 的定价正式开源发布，Meta 超智能实验室推出闭源 Muse Spark 放弃一贯的开源策略，OpenAI 发布 13 页政策蓝图提出对 AI 利润征税并创建公共财富基金"
date: 2026-04-11T07:00
series: "AI 前沿速递"
volume: 12
tags: ["DeepSeek V4", "Engram", "华为昇腾", "Meta", "Muse Spark", "OpenAI", "机器人税", "Anthropic", "Claude Managed Agents", "Claude Cowork", "纽约客", "Sam Altman"]
---

## 本周核心事件

### 1. DeepSeek V4 正式发布 —— 万亿参数开源定价击穿行业底线

**事件概要**：多次跳票之后，[DeepSeek](https://www.deepseek.com/) 在 4 月初正式推出了 **DeepSeek-V4**，一款总计约 **1 万亿（1T）参数**的稀疏混合专家模型。V4 采用 **Top-16 路由机制**（256 个专家子网络中每次推理仅激活 16 个），单 token 推理仅触发约 **32 亿**激活参数——比上代 V3 的 37 亿还少，模型规模扩大 50% 的同时单次推理成本不升反降。核心技术创新 **[Engram 条件记忆架构](https://lushbinary.com/blog/deepseek-v4-developer-guide-trillion-parameter-moe-engram/)** 支持超过 **100 万 token** 的超长上下文窗口，配合 Lightning Indexer 实现亚线性检索，有效解决传统 Transformer 的"迷失中间"问题。API 定价极具侵略性：输入 **$0.28 / 百万 token**（缓存命中低至 $0.028），输出 **$1.10 / 百万 token**——相比 GPT-5.4 便宜约 **10 倍**，相比 Claude Opus 4.6 便宜约 **16 倍**。[TechNews](https://technews.tw/2026/04/10/deepseek-v4/) 测算，每月处理 10 亿 token 的场景下，V4 启用缓存后成本仅 **30 美元**，而 Opus 4.6 需要约 5,000 美元。预发布基准测试显示：[SWE-Bench Verified](https://www.swebench.com/) **~78-81%**（接近 Opus 4.6 的 81.4%），HumanEval+ **~92%**，[GPQA Diamond](https://arxiv.org/abs/2311.12022) **~88%**。V4 完全基于**华为昇腾芯片**训练和推理，计划以 **Apache 2.0** 许可证开源权重。

**值得关注的原因**：
- V4 的定价不是渐进式降价，而是断崖式重定义价格底线。当输入成本低于 $0.03/百万 token（缓存命中）时，很多之前因 API 成本不可行的应用场景——全文档级 RAG、大规模代码库分析、长时间 Agent 运行——突然变得经济可行。这不只是"便宜一点"，而是打开了新的应用品类
- Engram 条件记忆是 V4 最值得深挖的技术贡献。传统 Transformer 的注意力机制在超长上下文中性能急剧衰减，而 Engram 通过条件索引实现 O(1) 级别的记忆检索，本质上是给模型加了一个"工作记忆"。这对构建需要长期上下文保持的 Agent 系统（如 8 小时自主编码、多文档法律审查）有直接的架构参考
- 全量华为芯片训练是 V4 发布延期数月的主要原因之一——早期训练中遭遇了硬件故障。但最终的成功意味着中国 AI 生态在算力层面的"去 NVIDIA 化"已不再是愿景而是现实。上周 Vol.11 报道的 GLM-5.1 同样基于华为芯片训练，这不是孤例而是趋势

### 2. Meta 发布 Muse Spark —— 超智能实验室首款模型，放弃开源走专有路线

**事件概要**：4 月 8 日，[Meta](https://about.fb.com/news/2026/04/introducing-muse-spark-meta-superintelligence-labs/) 正式发布 **Muse Spark**，这是其超智能实验室（Meta Superintelligence Labs, MSL）的开山之作——也是 Meta AI 历史上**首款非开源的专有模型**。MSL 由前 Scale AI CEO [Alexandr Wang](https://fortune.com/2026/04/08/meta-unveils-muse-spark-mark-zuckerberg-ai-push/) 领导，Meta 为此投入了 **143 亿美元**引进其团队。Muse Spark 从零构建（不是 Llama 衍生），原生支持多模态（文本+图像+语音输入），上下文窗口 **262K token**。在 [Artificial Analysis Intelligence Index](https://artificialanalysis.ai/articles/muse-spark-everything-you-need-to-know) 上综合得分 **52**，排名全球第五（Gemini 3.1 Pro 和 GPT-5.4 并列 57、Opus 4.6 得 53）。亮点在于健康和科学领域：[HealthBench Hard](https://nerdleveltech.com/meta-muse-spark-proprietary-ai-model-benchmarks) **42.8%**（超越 GPT-5.4 的 40.1%）、科学推理 **86.4**（超越 GPT-5.4 的 82.8）。但编码能力 **59.0**（GPT-5.4 为 75.1）和抽象推理 **42.5**（GPT-5.4 为 76.1）明显短板。Muse Spark 引入"**思维压缩**"训练技术——对过长推理链进行惩罚，迫使模型用更少 token 达到同等准确度。实测中 Muse Spark 仅使用 **5800 万**输出 token 完成评测，而 GPT-5.4 需 1.2 亿、Opus 4.6 需 1.57 亿。模型提供三种模式：即时（日常）、思考（逐步推理）、**沉思**（多子 Agent 并行推理后综合，[Humanity's Last Exam](https://arxiv.org/abs/2501.14249) 达 **50.2%**，超越 GPT-5.4 Pro 的 43.9%）。目前在 meta.ai 免费提供，API 仅限受邀预览，**未公布定价**。

**值得关注的原因**：
- 这是 Meta 在 AI 模型策略上的一次重大转向。从 Llama 1 到 Llama 4，Meta 一直是开源 AI 的旗手——Llama 系列在过去三年内塑造了"开源模型也能匹敌闭源"的行业共识。Muse Spark 选择闭源，标志着 Meta 认为在超智能竞赛中，完全开放策略的边际收益已不足以证明成本合理
- "思维压缩"是一个值得关注的训练方法。当前推理模型（o1/o3 系列、Gemini Deep Think）的趋势是"想得越多越好"——更长的思维链通常带来更高准确度但也带来更高成本和延迟。Meta 反其道而行之，通过在 RL 中惩罚冗余推理来压缩思维链，实现了用不到 GPT-5.4 一半的输出 token 完成评测。这对推理成本的优化有直接工程启发
- 沉思模式的"多子 Agent 并行推理后综合"架构值得深思。它不是让单个模型思考更久，而是编排多个独立推理路径然后融合——这在概念上接近 AI 领域的"集成学习"，但应用在推理阶段。HLE 50.2% 的成绩（目前公开最高分之一）证明了这一架构的潜力

### 3. OpenAI 发布 13 页政策蓝图 —— 提出机器人税、公共财富基金和四天工作制

**事件概要**：4 月 6 日，[OpenAI](https://techcrunch.com/2026/04/06/openais-vision-for-the-ai-economy-public-wealth-funds-robot-taxes-and-a-four-day-work-week/) 发布了一份名为"**智能时代的产业政策**"的 13 页政策蓝图，提出了一系列应对 AI 驱动的经济变革的激进政策建议。核心提案包括：**机器人税**——将税负从劳动力转向资本和 AI 驱动的利润（概念源自比尔·盖茨 2017 年的提议）；**公共财富基金**——参照阿拉斯加永久基金模式，让每位美国公民自动获得 AI 公司和基础设施的公共股份并分享分红；**四天工作制**——建议政府补贴试行 **32 小时全薪工作周**；**便携式福利账户**——福利随工人而非随雇主，应对 AI 导致的频繁职业转换。蓝图还将 AI 定位为**公用事业**，建议通过补贴和税收抵免加速 AI 基础设施建设，同时确保 AI"负担得起且广泛可用"。[TechCrunch](https://techcrunch.com/2026/04/06/openais-vision-for-the-ai-economy-public-wealth-funds-robot-taxes-and-a-four-day-work-week/) 分析称，这一系列提案融合了左倾再分配机制和资本主义市场框架。Sam Altman 同期向 [Axios](https://www.axios.com/) 表示，未来一年内发生重大 AI 网络攻击是"完全可能的"，且 AI 辅助生物武器的制造"不再是理论上的"。

**值得关注的原因**：
- 时机耐人寻味：OpenAI 在估值 8520 亿美元、即将 IPO 之际发布这份蓝图。一个合理的解读是——这是 OpenAI 在为上市做政治风险管理。提出"向自己征税"和"全民分享 AI 红利"，本质上是向监管者和公众传递信号："我们在主动考虑社会影响"。IPO 前的政治叙事构建，比文件中的具体政策建议可能更重要
- "AI 作为公用事业"的定位值得深思。如果 AI 真的被归类为公用事业（类似水电气），意味着政府有权干预定价、要求普遍服务义务、并限制垄断行为。这对 OpenAI 和其竞争对手的商业模式有深远影响——但提案者恰恰是拥有最大市场份额的 OpenAI，这里面的博弈逻辑并不简单
- 同一周，佛罗里达州总检察长 [Uthmeier 宣布正式调查 OpenAI](https://flvoicenews.com/florida-ag-launches-openai-investigation-over-alleged-chatgpt-link-to-fsu-shooting/)，原因是 2025 年 FSU 校园枪击案嫌疑人的 ChatGPT 聊天记录被公开——检方指控 ChatGPT 在策划攻击中发挥了作用。政策蓝图和法律调查在同一周出现，显示 OpenAI 正同时面对"愿景塑造"和"现实追责"两条战线

### 4. Anthropic 三连发 —— Managed Agents 公测 + Cowork GA + 大脑与双手分离架构

**事件概要**：4 月 8-9 日，[Anthropic](https://www.anthropic.com/) 在两天内连续发布三项重要产品更新。**第一**，[Claude Managed Agents](https://www.anthropic.com/engineering/managed-agents) 进入 public beta——这是一组可组合的 API，允许企业在云端构建和部署生产级 AI Agent，承诺"从原型到上线只需数天"。[工程博客](https://www.anthropic.com/engineering/managed-agents)详述了核心架构创新"**大脑与双手分离**"：将 Claude 模型（大脑）与执行环境（双手/沙盒）和会话日志彻底解耦。大脑通过标准化接口 `execute(name, input) → string` 调用容器，容器崩溃时大脑捕获错误并重新初始化新容器——从"宠物"模式转为"牲畜"模式。凭证永远不会到达 Claude 运行生成代码的沙盒，OAuth 令牌存储在安全 Vault 中通过代理调用。这一架构使 p50 首字节延迟降低约 **60%**，p95 降低超过 **90%**。**第二**，[Claude Cowork](https://www.anthropic.com/product/claude-cowork) 从研究预览升级为 **GA（正式发布）**，面向所有付费订阅用户开放。Cowork 将 Claude Code 的 Agent 能力带入知识工作领域——研究综合、文档准备、文件管理。企业版新增角色访问控制、组支出上限、使用分析仪表板和 [OpenTelemetry](https://opentelemetry.io/) 支持。**第三**，同步发布 **Zoom MCP 集成**，Claude 可直接访问会议记录和转写内容。

**值得关注的原因**：
- "大脑与双手分离"架构解决了 Agent 开发中最棘手的工程问题之一：如何让长时间运行的 Agent 系统具备容错能力。传统做法是将模型、工具和状态打包在同一个容器中——一旦容器崩溃，整个任务丢失。Anthropic 的方案通过外部化会话日志实现了"大脑可重生、容器可替换"，对构建生产级 Agent 系统有直接的架构参考
- Managed Agents 的凭证隔离设计（Vault + 代理模式）值得其他 Agent 平台学习。当前 Agent 安全的一个核心风险是：模型生成的代码可以访问到用于调用外部服务的凭证。Anthropic 通过架构层面的物理隔离（而非依赖模型行为约束）来解决这个问题——这是正确的工程方向
- Cowork GA + Managed Agents + Zoom MCP = Anthropic 正在构建一个从"个人 AI 助手"到"企业 Agent 平台"的完整栈。将 Claude Code 的 Agent 能力包装成面向非技术用户的知识工作工具（Cowork），同时为开发者提供底层 Agent 基础设施（Managed Agents）——双轨并行的产品策略

### 5.《纽约客》18 月调查 Sam Altman —— 百人访谈揭示"不受真相约束"的领导风格

**事件概要**：4 月 6 日，[《纽约客》](https://www.newyorker.com/) 发表了一篇由普利策奖记者 **Ronan Farrow** 和 Andrew Marantz 联合署名的长篇调查报道，基于 **18 个月**的调查和超过 **100 人**的采访（包括 OpenAI 现任和前任员工、董事会成员、合作伙伴和竞争对手），深入审视了 Sam Altman 在领导 OpenAI 过程中的行为模式。[据多家媒体](https://www.simplenews.ai/news/new-yorker-investigation-questions-sam-altmans-trustworthiness-ebu7)报道，调查揭示了内部人士对 Altman "不受真相约束"的描述——指控涉及在非营利转营利过程中的信息不对称、对董事会的选择性披露、以及在关键决策中的叙事操控。文章发表当天登上 [Hacker News](https://news.ycombinator.com/) 榜首，在 X/Twitter 引发广泛讨论。同一周，OpenAI 内部传出 COO 调离、AGI 部门 CEO Fidji Simo 病假等管理层动荡。

**值得关注的原因**：
- 调查的规模（18 个月、100+ 访谈、Ronan Farrow 署名）本身就值得重视。Farrow 以#MeToo 运动中对 Harvey Weinstein 的调查闻名——他的介入意味着这不是一篇普通的科技报道，而是试图建立一个关于权力滥用的叙事框架
- 对 AI 行业的影响不止于 OpenAI 一家。整篇调查的核心问题是："一个被指控不诚实的人，是否应该被信任掌握超级智能？"这个问题的答案不仅关乎 Altman 个人，更关乎 AI 行业的治理结构——当少数人掌握可能影响全人类的技术时，现有的公司治理机制是否足够？
- 文章发布的时间节点（IPO 前夕）使其影响被放大。潜在投资者现在必须在"AI 行业最大 IPO"和"创始人信任危机"之间做出判断——这种叙事冲突是否会影响 IPO 定价，值得持续观察

---

## 本周值得一读的论文

| 论文 | 亮点 |
|------|------|
| **[HY-Embodied-0.5: Embodied Foundation Models for Real-World Agents](https://huggingface.co/papers/2604.07430)** (腾讯混元) | HuggingFace 本周最热论文（223 upvotes）：腾讯混元发布的具身智能基础模型，面向真实世界 Agent，标志着国内大厂在机器人基础模型方向的正式入场 |
| **[OpenVLThinkerV2: A Generalist Multimodal Reasoning Model for Multi-domain Visual Tasks](https://huggingface.co/papers/2604.08539)** (UCLA NLP) | 138 upvotes：通用多模态推理模型，跨领域视觉任务的统一解决方案。对构建能"看懂"复杂视觉场景的 Agent 有直接参考价值 |
| **[LPM 1.0: Video-based Character Performance Model](https://huggingface.co/papers/2604.07823)** (多机构) | 77 upvotes：基于视频的角色表演模型，25 位作者联合发布。在数字人和虚拟角色生成方向有潜在突破性意义 |
| **[DMax: Aggressive Parallel Decoding for dLLMs](https://huggingface.co/papers/2604.08302)** (新加坡国立大学) | 53 upvotes：提出针对离散扩散语言模型的激进并行解码策略，有望大幅降低推理延迟。对下一代非自回归 LLM 架构的工程优化有直接启发 |
| **[Prediction Arena: Benchmarking AI Models on Real-World Prediction Markets](https://arxiv.org/abs/2604.07355)** (多机构) | 让 AI 模型在真实预测市场中自主交易来评估其预测能力——这比静态基准测试更能反映模型的实际决策质量，为 AI 评估方法论提供了新思路 |

---

## 一句话快讯

- **[佛罗里达州总检察长](https://flvoicenews.com/florida-ag-launches-openai-investigation-over-alleged-chatgpt-link-to-fsu-shooting/)** 4 月 9 日正式宣布对 OpenAI 展开调查，指控 ChatGPT 在 2025 年 FSU 校园枪击案中被用于策划攻击——AI 公司首次面临因用户犯罪行为引发的州级执法调查
- **[Anthropic](https://www.anthropic.com/)** Opus 4.5 计算容量翻倍，同时与 Google 达成新的算力协议以缓解当前产能紧张——当最大的 AI 安全公司也在抢算力时，说明 Agent 工作负载的计算需求已超出所有人预期
- **[美国联邦法官](https://aiflashreport.com/)** 裁定特朗普政府禁止 Anthropic AI 在政府系统中使用的行政令违反第一修正案——AI 模型是否属于"言论"的法律先例正在建立
- **[DeepSeek](https://news.qq.com/rain/a/20260408A03T6X00)** 在 V4 发布前低调上线**专家模式**，与原有快速模式形成双模式选择——用户可在速度与深度推理之间按需切换
- **[Cisco](https://www.theinformation.com/)** 正在洽谈收购以色列安全公司 Astrix Security，估值 2.5-3.5 亿美元——Astrix 专注于监控和保护 AI Agent 的安全软件，Agent 安全正在成为独立赛道
- **[Blackstone](https://www.bloomberg.com/)** 申请新的数据中心收购 IPO 工具，计划筹集约 20 亿美元——当私募巨头为 AI 数据中心专门设立 IPO 融资载体时，基础设施投资的规模已进入新量级
- **[OpenAI](https://openai.com/)** 被报道每周约有 50 万用户与 ChatGPT 的对话中表现出心理健康相关模式——AI 陪伴的心理健康风险正从个案上升为统计现象
- **[品牌反 AI 营销趋势](https://www.neuralbuddies.com/p/ai-news-recap-april-10-2026)** 正在扩大：Aerie、Almond Breeze 等品牌在广告中强调"不使用 AI"——当"反 AI"成为营销卖点时，公众对生成式 AI 的信任裂痕比行业内部感知的更深
