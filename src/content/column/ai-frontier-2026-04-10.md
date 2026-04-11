---
title: "Anthropic 因能力过强封锁 Mythos、智谱 GLM-5.1 开源击败 GPT-5.4、Google Gemma 4 让前沿模型跑进手机"
description: "2026年4月第2周 AI 行业动态：Anthropic 发布史上首个因网安能力过强而不敢公开的模型，智谱以 MIT 协议开源 744B 模型刷新编码基准，Google 四款 Gemma 4 从树莓派到工作站全覆盖"
date: 2026-04-10T07:00
series: "AI 前沿速递"
volume: 11
tags: ["Anthropic", "Claude Mythos", "Project Glasswing", "智谱", "GLM-5.1", "Google", "Gemma 4", "OpenClaw", "DeepSeek V4", "华为昇腾", "Frontier Model Forum", "蒸馏"]
---

## 本周核心事件

### 1. Anthropic 正式发布 Claude Mythos —— 但因网安能力过强，仅限 50 家合作伙伴使用

**事件概要**：4 月 7 日，[Anthropic](https://www.anthropic.com/project/glasswing) 通过 **Project Glasswing** 计划正式推出了其最强模型 **Claude Mythos Preview**，但做出了一个前所未有的决定：不公开发布。Anthropic 在[系统卡片](https://www-cdn.anthropic.com/53566bf5440a10affd749724787c8913a2ae0841.pdf)和[安全能力评估报告](https://red.anthropic.com/2026/mythos-preview/)中披露了原因——Mythos 在网络安全攻击能力上实现了质的飞跃。具体而言：Claude Opus 4.6 在针对 Mozilla Firefox 147 的数百次自主漏洞利用开发尝试中仅成功 **2 次**（成功率接近 0%），而 Mythos Preview 在相同实验中成功开发了 **181 次**有效的 JavaScript shell 漏洞利用，并在 29 次尝试中实现了寄存器控制。更惊人的是，Mythos 能够将 3-5 个独立漏洞自主串联成复杂攻击链——包括编写结合 JIT heap spray 技术的浏览器漏洞利用程序（逃逸渲染器和操作系统沙箱），以及通过竞争条件和 KASLR 绕过在 Linux 上获取本地提权。安全研究员 [Nicholas Carlini](https://nicholas.carlini.com/) 验证了 Mythos 发现的一个存在 **27 年**的 OpenBSD 内核漏洞（仅需少量 TCP 数据包即可致服务器崩溃）。目前 Mythos 仅向 **AWS、Apple、Microsoft、Google、Linux Foundation** 等约 50 家关键基础设施组织开放，用于修补漏洞而非攻击。Anthropic 承诺投入 **1 亿美元**使用额度和 400 万美元直接捐赠支持开源安全。

**值得关注的原因**：
- 这是主要 AI 实验室历史上**首次公开声明"模型能力过强，不能向公众发布"**。此前的安全争议都集中在模型的潜在滥用上，而 Mythos 的情况不同——它在已部署基础设施中发现了数千个真实零日漏洞。这不是理论风险，是已证实的攻击能力
- 从 Opus 4.6 的近 0% 到 Mythos 的 181 次成功，这不是渐进式改进而是断崖式飞跃。一个合理的推测是：Mythos 的推理能力突破了某个临界点，使其能够理解多层安全机制之间的交互——而这正是人类安全研究员花费数周才能建立的直觉
- Project Glasswing 本质上创建了一个"先发制人修补"的时间窗口：让防御者在攻击者获得同等能力之前修复关键漏洞。但这个策略有保质期——当其他实验室的模型也达到类似能力时（考虑到 AI 能力增长曲线，这可能只需 6-12 个月），防御窗口就会关闭

### 2. 智谱开源 GLM-5.1 —— 744B 参数 MIT 协议，SWE-Bench Pro 击败 GPT-5.4 和 Opus 4.6

**事件概要**：4 月 7-8 日，[智谱 AI](https://z.ai/blog/glm-5.1)（Z.ai）以 **MIT 开源协议**发布了 **GLM-5.1**，一款拥有 **744B** 总参数（每次推理激活 40B）的混合专家模型。[VentureBeat 报道](https://venturebeat.com/technology/ai-joins-the-8-hour-work-day-as-glm-ships-5-1-open-source-llm-beating-opus-4)称之为"AI 加入八小时工作日"——GLM-5.1 被设计为可在单个任务上自主工作长达 **8 小时**，执行多达 **1,700 步**操作（去年底的 Agent 仅能执行约 20 步）。在 [SWE-Bench Pro](https://www.swebench.com/)（专家级软件工程基准）上，GLM-5.1 以 **58.4 分**刷新全球最高纪录，超越 GPT-5.4（57.7）、Claude Opus 4.6（57.3）和 Gemini 3.1 Pro（54.2）。在一项 8 小时压力测试中，模型从零开始构建了一个包含文件浏览器、终端、文本编辑器、系统监视器和功能性游戏的 Linux 风格桌面环境。API 定价为输入 $1.40 / 百万 token，输出 $4.40 / 百万 token，上下文窗口 **202K** token。值得注意的是，据报道 GLM-5.1 完全基于华为芯片训练，而非 NVIDIA GPU。

**值得关注的原因**：
- MIT 协议意味着任何人可以免费下载、修改、商用这个击败闭源旗舰模型的代码。对比 Anthropic 锁定 Mythos，智谱选择完全开放——这两种策略在同一周出现，完美诠释了 AI 行业在开放与安全之间的根本张力
- "8 小时自主执行" 是一个值得深思的里程碑。从聊天式交互（分钟级）到 Agent 式任务（小时级），模型的有效作用范围扩大了两个数量级。智谱引入的"楼梯模式"优化——通过增量调整和结构变化避免长时间运行中的策略漂移——对构建生产级 Agent 系统有直接工程参考
- SWE-Bench Pro 的自报成绩需要第三方验证（此前 GLM-5 的分数经验证基本成立，但 GLM-5.1 的独立测试尚未完成）。即便如此，一家中国公司在专业编码基准上超越 OpenAI 和 Anthropic 的旗舰模型并以 MIT 协议开源——这个事实本身就说明开源模型已不再是"退而求其次"的选择

### 3. Google 发布 Gemma 4 —— Apache 2.0 全系列开源，从树莓派到工作站全覆盖

**事件概要**：4 月 2 日，[Google DeepMind](https://deepmind.google/models/gemma/gemma-4/) 发布了 **Gemma 4** 开源模型家族，采用 **Apache 2.0** 许可证，提供四款模型全面覆盖从边缘设备到工作站的场景：**E2B**（2.3B 参数，手机/IoT 设备）、**E4B**（4B 参数，边缘计算）、**26B-A4B**（26B 总参数 / 3.8B 激活参数的 MoE 模型，成本效益推理）、**31B Dense**（31B 参数密集模型，工作站级）。全系列**原生支持多模态**——文本、图像和音频，不是拼接独立模块而是统一架构处理。31B Dense 在 [Arena AI](https://arena.ai/) 文本排行榜上排名全球开源模型**第 3 名**（得分 1452），在 [AIME 2026](https://www.maa.org/math-competitions/american-invitational-mathematics-examination-aime) 数学竞赛中达到 **89.2%**，[GPQA Diamond](https://arxiv.org/abs/2311.12022) 科学推理 **84.3%**。E2B 模型可在完全离线的树莓派和手机上运行多模态推理任务。截至发布日，Gemma 系列累计下载量超过 **4 亿次**，社区创建了超过 **10 万个**微调变体。

**值得关注的原因**：
- Gemma 4 的真正突破不在于 31B 旗舰版的绝对性能，而在于 **26B MoE 模型的效率**：26B 总参数但推理时只激活 3.8B，却达到了接近 31B 密集模型的性能。这意味着单张消费级 GPU 就能运行一个"准前沿"水平的多模态模型——API 成本和延迟的优势是巨大的
- 四款模型从 2B 到 31B 的全尺寸覆盖是对 Meta Llama 4 的正面竞争。Llama 4 Maverick（400B）虽然支持 1000 万 token 上下文，但部署门槛极高；Gemma 4 选择了相反的策略——让尽可能多的开发者能在自己的硬件上运行模型。4 亿次下载和 10 万个微调变体证明了这一策略的有效性
- 边缘部署是被低估的战场。当 2B 参数模型就能在手机上做多模态推理时，很多原本需要云端 API 的应用场景将被重新审视——这对隐私敏感领域（医疗、金融）和低延迟场景（自动驾驶、机器人）有直接影响

### 4. Anthropic 切断 OpenClaw 第三方订阅 —— 13.5 万实例一夜受影响

**事件概要**：4 月 4 日，[Anthropic](https://www.anthropic.com/) 宣布从次日起，Claude Pro/Max 订阅将**不再覆盖 OpenClaw 等第三方 Agent 工具**的使用。据 [TechCrunch](https://techcrunch.com/2026/04/04/anthropic-says-claude-code-subscribers-will-need-to-pay-extra-for-openclaw-support/) 和多家媒体报道，当时估计有 **13.5 万个 OpenClaw 实例**在运行，用户收到通知的时间不到 **24 小时**。受影响用户必须切换到按量计费的 API 访问或购买额外使用量包。时间点引发了广泛猜测：OpenClaw 的创建者 Peter Steinberger 已于 2 月加入 OpenAI，外界怀疑 Anthropic 在将热门功能吸收到自家 Claude Code 后，锁死了开源替代方案的入口。Anthropic 给出的官方解释是 Agent 工作负载的 24/7 持续请求"打爆了"订阅模型的资源配额。

**值得关注的原因**：
- 这是 AI 平台"先开放后锁定"策略的经典案例。Claude 的订阅模式最初允许第三方工具通过 OAuth 接入，吸引了大量开发者构建生态——但当这些工具的资源消耗超过平台预期时，平台单方面改变规则。对于依赖 Claude 订阅构建产品的开发者来说，这是一个痛苦的教训
- "Agent 工作负载打爆订阅"揭示了 Agent 时代的定价困境：传统订阅模型假设人类使用是有上限的（每天工作 8-12 小时），但 Agent 可以 24/7 不间断运行。这意味着所有基于"无限使用"承诺的 AI 订阅最终都将面临类似的调整
- OpenClaw 创建者加入 OpenAI + Anthropic 封堵 OpenClaw = 平台之间的人才和生态竞争正在白热化。开发者需要认真评估"平台依赖风险"——构建在闭源 API 之上的工具，其生命周期受制于 API 提供商的商业决策

### 5. 美国 AI 三巨头破天荒联手 —— 共享情报打击中国模型蒸馏

**事件概要**：4 月 6-7 日，[Bloomberg](https://www.bloomberg.com/) 独家报道，OpenAI、Anthropic 和 Google 这三家互为竞争对手的公司已开始通过 **[Frontier Model Forum](https://www.frontiermodelforum.org/)**（2023 年三家公司与微软共同创立的行业非营利组织）共享安全情报，协同识别和打击**中国竞争对手的对抗性模型蒸馏**行为。[Mercury News](https://www.mercurynews.com/2026/04/07/openai-anthropic-google-unite-to-combat-model-copying-in-china/)、[CNBC](https://www.cnbctv18.com/technology/openai-anthropic-google-come-together-to-combat-model-copying-in-china-ws-l-19881661.htm) 等主流媒体跟进报道。据披露，三家公司的联合调查发现了约 **24,000 个欺诈账号**，涉及至少 3 家中国 AI 公司，这些账号系统性地向美国 AI 模型发送精心构造的请求以提取能力。美国官员估计，未经授权的蒸馏行为每年造成硅谷实验室**数十亿美元**的利润损失。

**值得关注的原因**：
- 三家日常激烈竞争的公司选择在安全情报层面合作，说明对抗性蒸馏的规模已大到单一公司无法独自应对。Frontier Model Forum 从一个松散的行业倡议演变为具有实际情报共享功能的实体——这是 AI 行业治理结构的一个重要演变
- "对抗性蒸馏"不同于普通的 API 调用：攻击者精心设计提示以诱导目标模型暴露其推理策略和知识边界，然后用这些数据训练自己的模型。这本质上是一种知识产权的系统性提取，但在现有法律框架下很难界定为"盗窃"
- 对开源生态的潜在溢出效应值得警惕：如果美国公司为了对抗蒸馏而大幅收紧 API 访问（更严格的身份验证、请求模式审计、输出水印），合法的研究者和开发者也将受到影响。开放与安全的平衡在地缘科技竞争中正变得更加复杂

---

## 本周值得一读的论文

| 论文 | 亮点 |
|------|------|
| **[Video-MME-v2: Towards the Next Stage in Benchmarks for Comprehensive Video Understanding](https://arxiv.org/abs/2604.05015)** (多机构) | HuggingFace 本周最热论文（217 upvotes）：提出渐进式层次结构和基于组的评估方法来测试视频理解模型的鲁棒性和忠实度，为多模态评测建立新标准 |
| **[OpenWorldLib: A Unified Codebase for Advanced World Models](https://arxiv.org/abs/2604.04707)** (北京大学) | 171 upvotes：定义了整合感知、交互和长期记忆的高级世界模型标准化框架。对构建 Agent 环境理解能力有直接理论指导 |
| **[The Latent Space: Foundation, Evolution, Mechanism, Ability, and Outlook](https://arxiv.org/abs/2604.02029)** (多机构) | 133 upvotes：系统性综述潜在空间作为大模型核心计算基质的角色——从基础到机制到能力，对理解大模型"内部在做什么"有深度参考价值 |
| **[GLM-5: from Vibe Coding to Agentic Engineering](https://arxiv.org/abs/2602.15763)** (智谱 AI) | 136 upvotes：GLM-5 系列的技术报告，详述 DSA 稀疏注意力降低成本、异步强化学习改进对齐、以及从"氛围编码"到"Agent 工程"的范式转变。与 GLM-5.1 的发布互为参考 |
| **[VibeVoice Technical Report](https://arxiv.org/abs/2508.19205)** (Microsoft Research) | 158 upvotes：使用 next-token diffusion 和高效连续语音 tokenizer 合成长形式多说话人语音，在保真度和自然度上达到新高度。对语音 Agent 开发有直接工程价值 |

---

## 一句话快讯

- **[DeepSeek](https://www.deepseek.com/)** V4 确认将完全运行在**华为昇腾 950PR** 芯片上，1T 参数 MoE 架构，发布在即——这是全球首个顶级大模型彻底脱离 NVIDIA 生态的案例
- **[OpenAI](https://openai.com/)** IPO 前夕领导层剧烈动荡：COO 调离、AGI 部门 CEO Fidji Simo 病假、另有两名高管因健康原因休假——一家估值 8520 亿美元的公司在冲刺上市前失去了半个管理团队
- **[Anthropic](https://www.anthropic.com/)** 以约 **4 亿美元**收购 AI 生物技术初创公司 Coefficient Bio，团队将加入其医疗保健生命科学部门——这是 Anthropic 迄今最大的收购
- **[Claude](https://www.anthropic.com/)** 驱动的自主 AI Agent 在 **4 小时内**攻破 FreeBSD 内核（[CVE-2026-4747](https://www.freebsd.org/security/advisories/)），劫持内核线程并生成 root shell，全程无人工辅助——[Lyptus Research](https://lyptus.io/) 记录了完整攻击时间线
- **[NVIDIA](https://nvidia.com/)** 发布 NVFP4 压缩版 Gemma 4 31B，体积缩小 4 倍精度几乎无损——让消费级 GPU 也能跑满配置开源前沿模型
- **[微软](https://microsoft.com/)** 宣布四年内向日本投资 **100 亿美元**，与 Sakura Internet 和软银合作建设 AI 基础设施——亚太 AI 算力版图正在加速重构
- **[Anthropic](https://www.anthropic.com/)** 成立其首个政治行动委员会（PAC），正式进入华盛顿政治游说——当一家以"AI 安全"著称的公司开始组建 PAC，说明仅靠道德声誉已不足以提供政治保护
- **[白宫](https://www.whitehouse.gov/)** 发布 AI 政策蓝图，敦促联邦政府在州 AI 法律上拥有优先权；同一周桑德斯和 AOC 提议暂停所有新 AI 数据中心建设——华盛顿对 AI 的态度正在加速分化
