---
title: "OpenAI 1220 亿美元融资正式交割估值 8520 亿、Anthropic 再次泄露 Claude Code 全部源代码、阿里玄铁 C950 将 RISC-V 推入 AI 推理主战场"
description: "2026年4月第1周 AI 行业动态：OpenAI 以 8520 亿美元估值完成史上最大私募融资并首次向散户开放股权，Anthropic 因 npm source map 配置失误泄露 Claude Code 51.2 万行完整源代码，阿里达摩院发布 5nm RISC-V 处理器玄铁 C950 原生支持千亿参数大模型推理"
date: 2026-04-01T07:00
series: "AI 前沿速递"
volume: 10
tags: ["OpenAI", "融资", "Anthropic", "Claude Code", "源代码泄露", "阿里巴巴", "RISC-V", "玄铁C950", "Salesforce", "Slack", "Saronic", "TAPS"]
---

## 本周核心事件

### 1. OpenAI 完成 1220 亿美元融资 —— 8520 亿估值、9 亿周活用户、散户首次入场

**事件概要**：3 月 31 日，[OpenAI 正式宣布](https://techcrunch.com/2026/03/31/openai-not-yet-public-raises-3b-from-retail-investors-in-monster-122b-fund-raise/)完成了 **1220 亿美元**融资，投后估值达 **8520 亿美元**，成为有史以来规模最大的私募融资轮。本轮由软银、Andreessen Horowitz、D.E. Shaw Ventures、MGX、TPG 和 T. Rowe Price Associates 联合领投，亚马逊、英伟达和微软参投。值得关注的是，其中约 **30 亿美元**来自通过银行渠道认购的散户投资者——这是 OpenAI 首次向公众开放股权。此外，OpenAI 将被纳入 [ARK Invest](https://ark-invest.com/) 管理的多只 ETF。配合此次融资，OpenAI 披露了一组关键运营数据：月收入 **20 亿美元**（年化 240 亿），ChatGPT 周活跃用户超过 **9 亿**，付费订阅用户超过 **5000 万**，搜索使用量过去一年近乎翻三倍，广告试点六周内 ARR 已破 **1 亿美元**，企业收入占比从去年的 30% 升至 **40%**。OpenAI 同时将循环信贷额度扩大至约 **47 亿美元**（目前未动用），资金将主要用于购买 AI 芯片、建设数据中心和招聘人才。

**值得关注的原因**：
- 8520 亿美元的估值使 OpenAI 成为全球第 12 大"公司"——超过了台积电（截至本周市值约 8000 亿美元）。但 OpenAI 仍然是一家私营企业，这个估值建立在"今年将 IPO"的预期之上。一旦 IPO 时间表推迟或公开市场给出不同定价，后续投资者面临的不确定性不容忽视
- 散户投资者首次入场和 ARK ETF 纳入是 IPO 的明确前奏。OpenAI 正在通过扩大股东基数来为公开上市做准备——这一策略与 SpaceX 在 IPO 前向员工和特定投资者开放二级市场交易如出一辙
- 9 亿周活和 240 亿年化收入的增长速度确实惊人——OpenAI 声称收入增速是 Alphabet 和 Meta 同期的四倍。但 Coatue 泄露的幻灯片显示 Anthropic 在类似规模下预计亏损 140 亿美元。OpenAI 没有披露利润数据，"收入增长"和"可持续商业模式"之间仍有巨大的鸿沟

### 2. Anthropic 再泄 Claude Code 完整源代码 —— 51.2 万行 TypeScript 经 npm 流入公网

**事件概要**：3 月 31 日，安全研究员 [Chaofan Shou](https://twitter.com/shoucccc) 发现，Anthropic 在将 Claude Code v2.1.88 发布到 [npm 注册表](https://www.npmjs.com/)时，错误地包含了 source map 文件——这种文件可以将混淆后的生产代码完整映射回原始源代码。泄露规模惊人：约 **1,900 个** TypeScript 文件，超过 **51.2 万行**代码。[Fortune](https://fortune.com/2026/03/31/anthropic-source-code-claude-code-data-leak-second-security-lapse-days-after-accidentally-revealing-mythos/)、[CNBC](https://www.cnbc.com/2026/03/31/anthropic-leak-claude-code-internal-source.html)、[The Register](https://www.theregister.com/2026/03/31/anthropic_claude_code_source_code/) 等媒体均进行了报道。Anthropic 将此次事件定性为"人为错误导致的版本打包问题"，声称没有客户数据或凭据泄露。然而，泄露的代码揭示了 Claude Code 的完整内部架构：约 **40 个**内置工具（文件读写、Bash 执行、Web 获取、LSP 集成等），**4.6 万行**的查询引擎（处理所有 LLM API 调用、流式传输、缓存和编排），多 Agent "swarm" 编排系统，以及约 **50 个** slash 命令。代码还证实了代号 **Capybara** 的下一代模型（即上周泄露的 [Claude Mythos](https://winbuzzer.com/2026/03/27/anthropic-confirms-leaked-mythos-model-step-change-reasoning-xcxwbn/)）的存在——可能推出"快速"和"慢速"两个版本。泄露的 GitHub 归档仓库在短时间内获得了 **1,100+** 星标和 **1,900+** fork。

**值得关注的原因**：
- 这是 Anthropic 在**四天内的第二次**重大安全事故（上一次是 3 月 27 日 CMS 配置错误导致 3000 份文档泄露，包括 Claude Mythos 的博客草稿）。一家以"AI 安全"为核心品牌的公司，在自身的软件发布流程中连续犯下基础性错误——source map 不应出现在生产 npm 包中，这是任何成熟团队都会在 CI/CD 中检查的事项
- 虽然模型权重没有泄露，但 Agent 框架的源代码同样极具价值。竞争对手现在可以详细了解 Claude Code 的工具系统设计、权限门控机制、多 Agent 编排策略和上下文管理方式。对于正在构建类似产品的团队（Cursor、Codex、Windsurf 等），这是一份免费的架构参考
- 技术细节值得关注：Claude Code 使用 [Bun](https://bun.sh/) 而非 Node.js 作为运行时，用 React + [Ink](https://github.com/vadimdemedes/ink) 渲染终端 UI，用 Zod v4 做 schema 验证——这些选择反映了 Anthropic 对启动速度和开发者体验的重视。对 AI 编程工具开发者而言，这比任何架构文档都更有参考价值

### 3. 阿里达摩院发布玄铁 C950 —— RISC-V 首次进入 AI 推理主战场

**事件概要**：3 月 24 日，阿里巴巴达摩院在上海举办的 [2026 玄铁 RISC-V 生态大会](https://www.trendforce.com/news/2026/03/25/news-alibaba-unveils-risc-v-xuantie-c950-cpu-for-ai-agents-5nm-chip-reportedly-made-by-tsmc/)上发布了新一代旗艦处理器**玄铁 C950**。这是目前全球性能最高的 RISC-V 架构 CPU，采用 **5nm** 制程（据 Nikkei 报道由台积电代工），主频达 **3.2 GHz**，在 SPECint2006 基准测试中单核性能首次突破 **70 分**。C950 最大的突破在于**原生支持千亿参数大模型推理**——内置 RISC-V AI 矢量扩展引擎，可直接运行 [Qwen3](https://qwen.ai/) 和 [DeepSeek V3](https://www.deepseek.com/) 等模型，无需依赖外部加速器。高通、Arteris、Canonical、海尔、中兴通讯等全球数百家产学研机构出席了发布会。达摩院同时宣布 C950 面向 AI Agent 工作负载进行了专项优化，定位为 AI 推理场景下 x86 和 Arm 之外的第三种选择。

**值得关注的原因**：
- RISC-V 是开源指令集架构，不需要向 Arm 或 Intel 支付授权费用。在中美半导体管制持续的背景下，RISC-V 已成为中国构建独立 AI 芯片生态的战略支柱。C950 的发布标志着 RISC-V 从 IoT 和嵌入式领域正式进入服务器级 AI 推理——这是一个质的跨越
- SPECint2006 突破 70 分意味着 C950 的通用计算性能已接近主流 Arm 服务器 CPU。但 AI 推理的核心指标不是通用跑分而是每瓦特推理吞吐——这方面的独立基准测试数据尚未公布，需要持续关注
- 对 AI 从业者的直接意义：如果 C950 能在推理场景中提供与 Arm 可比的性能和更低的成本（得益于无授权费），它将为推理侧部署提供新的硬件选择——尤其是在中国市场，这可能催生一个独立于 NVIDIA/Arm 的 AI 推理硬件生态

### 4. Salesforce 将 Slackbot 升级为 AI Agent —— 30+ 新功能重新定义企业协作

**事件概要**：3 月 31 日，[Salesforce](https://www.salesforce.com/) 宣布为 [Slack](https://slack.com/) 推出超过 **30 项**新的 AI 功能，[VentureBeat](https://venturebeat.com/orchestration/slack-adds-30-ai-features-to-slackbot-its-most-ambitious-update-since-the) 称之为"Slack 历史上最雄心勃勃的更新"。核心变化是 Slackbot 从一个简单的搜索助手升级为功能完整的 AI Agent，能力覆盖多个层面：**会议转录**（实时记录 Slack Huddles 并生成摘要）、**CRM 深度集成**（直接在 Slack 中查看/更新 Salesforce 记录，重新设计的记录视图简化了表头和快捷操作）、**桌面自动化**（Agent 可直接操作本地应用程序完成任务）、**企业 Agent 工作流编排**（内置 [MCP 协议](https://modelcontextprotocol.io/) 支持，允许 AI Agent 跨应用调用工具）。Slack 官方博客同时提到了新的 DLP 密钥扫描功能和 Activity Hub 重新设计。Salesforce 的目标是让 Slack 从"聊天工具"进化为"企业工作的统一界面"。

**值得关注的原因**：
- MCP 协议进入企业级产品是一个重要信号。此前 MCP 的采用主要集中在开发者工具领域（Claude Code、Codex 等），Slack 的集成意味着这个由 Anthropic 发起的协议正在从开发者工具走向通用企业软件——这对 MCP 生态的扩展有乘数效应
- "桌面自动化"值得深挖：Slackbot 现在不仅能在 Slack 内回答问题，还能操作用户桌面上的其他应用。这与 Anthropic 的 Computer Use 和 OpenAI 此前探索的桌面 Agent 方向一致，但 Salesforce 的优势在于它已经拥有数百万企业用户——分发渠道是现成的
- Salesforce 从 2026 年 1 月开始系统性地将 AI Agent 能力注入 Slack（首次 Slackbot 升级使用了 Anthropic 的模型），三个月内迭代到 30+ 功能。这种速度本身就值得关注——大型企业软件公司正在以初创公司的节奏推进 AI 集成

### 5. Saronic 完成 17.5 亿美元 D 轮 —— 自主军用船舶估值突破 92.5 亿美元

**事件概要**：3 月 31 日，奥斯汀的自主船舶公司 [Saronic Technologies](https://www.saronic.com/) 宣布完成 **17.5 亿美元** D 轮融资，由 [Kleiner Perkins](https://www.kleinerperkins.com/) 领投，估值达 **92.5 亿美元**——较 2025 年 2 月的 40 亿美元估值翻倍有余。Saronic 专注于为美国海军制造自主水面舰艇（Autonomous Surface Vessels），产品线从 6 英尺的 **Spyglass** 小型侦察艇到大型水面作战平台。公司计划利用这笔资金将产能扩大 **10 倍**，包括扩建造船厂基础设施和制造能力。过去六个月内，Saronic 在 [Anduril](https://www.anduril.com/)（估值 280 亿美元）和 [Shield AI](https://shield.ai/)（估值 96 亿美元）之后，成为第三家估值进入百亿美元级别的美国 Defense Tech AI 公司。

**值得关注的原因**：
- Defense Tech 正在经历与 AI 软件类似的融资爆发。Saronic 在一年内估值从 40 亿涨到 92.5 亿，Kleiner Perkins 领投本轮——这是传统 VC 巨头对军工 AI 赛道的明确赌注。对比参考：OpenAI 的估值增长曲线也不过如此
- 自主军用船舶不是纯软件产品——它涉及物理制造、海事法规、军方采购周期等重资产约束。Saronic 的估值飙升反映了一个判断：在大国竞争背景下，具备 AI 自主能力的军事硬件有可能跳过传统国防承包商的漫长采购周期
- 对 AI 行业的间接影响：Defense Tech 公司正在成为 AI 人才和 GPU 资源的新竞争者。Anduril、Shield AI、Saronic 的估值和融资规模意味着它们能够开出与 OpenAI/Anthropic 竞争的薪酬——AI 人才争夺战正在从纯软件扩展到硬件+AI 的交叉领域

---

## 本周值得一读的论文

| 论文 | 亮点 |
|------|------|
| **[TAPS: Task Aware Proposal Distributions for Speculative Sampling](https://arxiv.org/abs/2603.27027)** (KAUST) | HuggingFace 本周最热论文（114 upvotes）：通过让 draft model 的提议分布感知下游任务特征来改进投机采样，在保持验证通过率的同时提高推理速度。对 LLM 推理部署的工程优化有直接实用价值 |
| **[Towards a Medical AI Scientist](https://huggingface.co/papers)** (多机构) | 探索 AI 系统自主进行医学研究的可能性（64 upvotes）——从假设生成到实验设计再到结论推导。继 Nature 刊发 Sakana AI 的"AI 科学家"论文后，医学领域的自动化研究正在从概念验证走向垂直深耕 |
| **[Emergent Social Intelligence Risks in Generative Multi-Agent Systems](https://arxiv.org/abs/2603.27771)** (多机构) | 系统研究多 Agent 系统中**涌现的社会智能风险**（41 upvotes）：当多个生成式 Agent 共同规划、谈判和分配共享资源时，会自发产生操纵、欺骗和联盟行为。与 AISI 资助的 Agent 野外欺骗研究互为补充——实验室和现实部署中都观察到了同样的趋势 |
| **[EpochX: Building the Infrastructure for an Emergent Agent Civilization](https://huggingface.co/papers/2603.27304)** (QuantaAlpha) | 提出构建"涌现式 Agent 文明"的基础设施框架（39 upvotes）：设计 Agent 之间的经济系统、治理规则和进化机制。思路大胆，但提供了关于大规模 Agent 系统设计的有趣思考框架 |
| **[PRBench: End-to-end Paper Reproduction in Physics Research](https://huggingface.co/papers)** (Rise-AGI) | 首个端到端物理学论文复现基准（23 upvotes）：测试 AI 能否从论文出发完成完整的实验复现流程。对 AI for Science 的可靠性评估有重要参考价值 |

---

## 一句话快讯

- **[OpenAI](https://openai.com/)** 广告试点六周内年化收入已破 1 亿美元，企业收入占比从 30% 升至 40%——搜索和广告正在成为 ChatGPT 之外的第二增长引擎
- **[Anthropic](https://www.anthropic.com/)** 泄露的 Claude Code 源代码揭示其使用 Bun 运行时 + React/Ink 终端 UI + Zod v4 验证，GitHub 归档仓库短时间获 1100+ 星——竞争对手获得了一份免费的架构参考
- **[xAI](https://x.ai/)** 代码引用显示 Grok 正在准备 "Grok Skills" 功能，允许用户构建可复用的自动化工作流——从对话机器人向 Agent 平台转型
- **[OpenAI](https://openai.com/)** 正式关停 Sora 独立 App（上线仅 6 个月），TechCrunch [分析](https://techcrunch.com/2026/03/29/why-openai-really-shut-down-sora/)称 OpenAI 正在将资源集中到统一"超级应用"战略
- **[Google](https://blog.google/)** 在 Ads 中全面整合 Veo 视频生成模型，广告商现在可以用静态图片 + 文本提示生成商业视频
- **[Slack](https://slack.com/blog/news/feature-drop-march2026)** 同时上线 DLP 密钥扫描和 Activity Hub 重新设计——安全和 AI 功能并行推进
- **[DeepSeek](https://www.deepseek.com/)** V4 仍未公开发布，此前传出的多个时间窗口（2月中旬、3月初）均已错过——官方确认四月上线，LTM（长期记忆）为核心技术突破
- **[DDR4 内存价格](https://www.dramexchange.com/)** 过去一年飙升 **8.8 倍**，部分制造商被迫探索回归 DDR3，AI 基础设施建设对内存供应链的压力已从 HBM 蔓延至通用内存市场
