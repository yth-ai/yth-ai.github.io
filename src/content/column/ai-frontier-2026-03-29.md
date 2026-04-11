---
title: "Claude Mythos 意外泄露、ARC-AGI-3 让所有前沿模型得分不到 1%、苹果开放 Siri 给 Claude 和 Gemini"
description: "2026年3月第5周 AI 行业动态：Anthropic 因 CMS 配置失误泄露了代号 Capybara 的下一代模型 Claude Mythos，引发网安股闪崩；ARC-AGI-3 交互式基准将所有前沿模型打回原形；苹果计划在 iOS 27 中让 Siri 接入任意第三方 AI 聊天机器人"
date: 2026-03-29
series: "AI 前沿速递"
volume: 8
tags: ["Anthropic", "Claude Mythos", "ARC-AGI-3", "Apple", "iOS 27", "Siri", "Mistral", "Voxtral TTS", "xAI", "AI 谄媚"]
---

## 本周核心事件

### 1. Anthropic 意外泄露下一代模型 Claude Mythos —— 一场安全公司的安全事故

**事件概要**：3 月 27 日，安全研究人员发现 Anthropic 内部的内容管理系统（CMS）存在一个基础性配置错误——所有上传资产默认设为"公开"，导致近 **3,000 份**未发布的内部文档被暴露。[Fortune 率先报道](https://fortune.com/)了这一发现并通知 Anthropic 修补后才公开。泄露文档中最引人注目的是一篇关于代号 **Capybara** 的新模型——**Claude Mythos** 的未发布博客草稿。根据泄露内容，[Mythos 被定位为 Opus 之上的全新层级](https://winbuzzer.com/2026/03/27/anthropic-confirms-leaked-mythos-model-step-change-reasoning-xcxwbn/)，而非版本迭代，在编码、推理和网络安全领域评分"显著高于" Opus 4.6。文档中一句话尤为刺眼："该模型目前在网络能力方面**远超任何其他 AI 模型**"。Anthropic 随后[确认了 Mythos 的存在](https://futurism.com/artificial-intelligence/anthropic-step-change-new-model-claude-mythos)，称其为"推理和网络安全领域的步骤性变革"，并表示正在与一小群"网络防御组织"进行内测——让防御者优先于攻击者获得能力。消息传出后，CrowdStrike 和 Palo Alto Networks 等网安股当日下跌 **3-7%**。

**值得关注的原因**：
- 这是 AI 行业迄今最具讽刺意味的事件之一：一家以"负责任的 AI"为品牌核心的公司，因为最基础的 CMS 默认设置问题泄露了自己最敏感的模型信息。这不是 Anthropic 的第一次安全失误——1 月 Claude Cowork 上线数天即暴露安全漏洞，现在又是默认权限没改
- Mythos 的"先给防御者"策略值得关注：Anthropic 显然意识到这个模型的网络攻击潜力足以改变攻防平衡。但一个模型的能力是否应该区分"好人版"和"坏人版"来发布？这是一个 AI 治理的根本性问题
- 网安股的恐慌反应说明了市场的逻辑：如果 AI 能比人类安全团队更快地发现和利用漏洞，传统网络安全公司的护城河会被大幅削弱。短期内这是过度反应，但长期趋势确实不利于纯靠人工分析的安全厂商

### 2. ARC-AGI-3 发布 —— 所有前沿模型得分不到 1%，人类仍然是 100%

**事件概要**：3 月 25 日，François Chollet 的 [ARC Prize Foundation](https://arcprize.org/) 发布了 [ARC-AGI-3](https://arxiv.org/html/2603.24621v1)，一个全新的交互式推理基准。与前两代不同，ARC-AGI-3 将 AI 放入类似游戏的场景中，**零指令**引导——模型必须自主发现规则、形成目标并规划策略。结果令人震惊：**Gemini 3.1 Pro** 以 **0.37%** 的得分领先，**GPT-5.4 High** 为 **0.26%**，**Claude Opus 4.6** 为 **0.25%**，而 **Grok 4.20** 直接得了 **0 分**。同样的任务，人类首次尝试的通过率是 **100%**。ARC Prize Foundation 联合创始人 Mike Knoop 透露，前沿实验室对 V3 的关注程度远超早期版本——该基准附带 **100 万美元**奖金。

**值得关注的原因**：
- ARC-AGI-3 是对"我们已经实现 AGI"叙事的最直接打脸——就在 Jensen Huang 上周公开宣称"我认为我们已经实现了 AGI"之后。当人类可以 100% 完成而最强 AI 不到 0.4% 时，"通用智能"的定义需要更严肃的讨论
- 回顾历史：ARC-AGI-2 发布时模型得分约 3%，但各实验室砸入数百万训练后，不到一年便推至约 50%。问题在于，这种提升究竟是真正的推理能力进步，还是更昂贵的暴力计算？ARC-AGI-3 正是为了回答这个问题而设计的
- 对 AI 从业者的实际启示：现有模型在需要自主探索和目标推断的任务上仍然极其薄弱。这意味着"自主 Agent"在开放域任务中的可靠性远低于封闭域。构建 Agent 产品时，明确约束边界比追求通用性更务实

### 3. 苹果计划在 iOS 27 中开放 Siri 给所有第三方 AI —— 平台战略的重大转向

**事件概要**：3 月 26 日，[彭博社 Mark Gurman 报道](https://www.macrumors.com/2026/03/26/apple-ios-27-siri-chatbot-integration/)，苹果计划在 iOS 27 中推出名为 **"Extensions"** 的新系统，允许任何第三方 AI 聊天机器人——包括 [Anthropic 的 Claude](https://www.anthropic.com/)、[Google 的 Gemini](https://gemini.google.com/) 等——直接与 Siri 集成。目前 Siri 仅能将查询转交给 ChatGPT（通过与 OpenAI 的独家合作），而新系统将打破这一排他性：用户可以针对每个查询选择由哪个 AI 服务处理。[9to5Mac 报道](https://9to5mac.com/2026/03/26/ios-27-apple-will-reportedly-let-claude-and-other-ai-chatbot-apps-integrate-with-siri/)指出，AI 聊天机器人需要通过 App Store 分发并更新以适配新的 Siri 集成接口。苹果预计在 **6 月 8 日 WWDC** 上正式发布 iOS 27。Gurman 认为，苹果将从第三方 AI 订阅中通过 App Store 抽成获利。

**值得关注的原因**：
- 这是苹果 AI 策略的根本性转变：从"自建 + 独家合作"走向"开放平台"。苹果承认了一个现实——自研 Siri 在 AI 能力上已无法与 Claude/Gemini/ChatGPT 竞争，与其强行追赶，不如做管道、抽佣金。这是典型的"iOS 打法"——让别人卷模型能力，苹果卷生态和分成
- 对 AI 公司而言，20 亿+ 活跃 iOS 设备是巨大的分发渠道。Claude、Gemini 等模型将首次获得深入操作系统级别的入口，而不仅仅是独立 App。谁能在 Siri Extensions 中提供最好的体验，谁就能赢得移动端 AI 的下一个增长点
- OpenAI 可能是最大的输家：此前与苹果的独家合作是其移动端的重要护城河，现在变成了一个开放竞技场。如果 Claude Code 和 Gemini 在编码、搜索等垂直场景中提供更好的 Siri 集成体验，ChatGPT 的先发优势将被快速稀释

### 4. Mistral 发布 Voxtral TTS —— 3 秒克隆声音、70ms 延迟的开源语音模型

**事件概要**：3 月 26 日，[Mistral AI 发布了 Voxtral TTS](https://mistral.ai/news/voxtral-tts)，这是该公司首个文本转语音模型，也是其完成"听说读写"全链路的关键一步。模型总参数 **40 亿**（4B），由三个组件构成：Transformer Decoder 主干网络（3.4B，基于 Ministral 架构）、流匹配声学转换器（390M）和神经音频编解码器（300M）。核心数据：原生支持 **9 种语言**（英法德西荷葡意印阿），对典型 10 秒语音的生成延迟仅 **70ms**，实时率约 **9.7 倍**。仅需 **3 秒**参考音频即可零样本克隆声音，并支持跨语言保持说话者身份。在人类偏好测试中，Voxtral 对 [ElevenLabs](https://elevenlabs.io/) Flash v2.5 的胜率达 **68.4%**。模型以 **CC BY-NC** 协议开源，量化后可在智能手机和笔记本电脑上运行。[论文](https://arxiv.org/pdf/2603.25551) 和 [模型权重](https://huggingface.co/mistralai/Voxtral-4B-TTS-2603) 已在 HuggingFace 发布。

**值得关注的原因**：
- Voxtral 的发布使 Mistral 成为第一家同时提供语言模型、代码模型、语音转文字和文字转语音全链路能力的欧洲 AI 公司。与此同时，Cohere 和 Sanas 也在同一周发布了语音产品——语音 AI 正在经历一轮集中爆发
- 3 秒克隆 + 70ms 延迟 + 本地运行的组合对语音 Agent 的工程实现有直接价值。目前 ElevenLabs 等闭源方案的延迟和成本是构建实时语音应用的主要瓶颈，一个能在手机端运行的开源替代品改变了成本结构
- CC BY-NC 协议意味着商业使用仍需授权，这是 Mistral 的商业化策略——开源建生态，商用收费。但对研究社区和个人开发者而言，这是迄今质量最高的开源 TTS 模型

### 5. xAI 11 位联合创始人全部离职 —— 马斯克称"第一次就没建对"

**事件概要**：3 月 28 日，[Business Insider 报道](https://techcrunch.com/2026/03/28/elon-musks-last-co-founder-reportedly-leaves-xai/)，xAI 最后两位联合创始人 **Manuel Kroiss**（预训练团队负责人）和 **Ross Nordeen** 已于本月相继离职。至此，2023 年与马斯克共同创立 xAI 的 **11 位联合创始人已全部离开**。此前，包括 Kyle Kosic（基础架构主管）、Igor Babuschkin、Christian Szegedy、Toby Pohlen、Jimmy Ba、Tony Wu、Greg Yang 等人已在 2024-2026 年间陆续离职。这波出走发生在 xAI 被 [SpaceX 收购](https://seekingalpha.com/news/4569997-elon-musks-last-xai-cofounder-has-left)之后——这笔交易将 SpaceX、xAI 和 X（Twitter）合并在同一企业伞下，SpaceX 正在准备 2026 年中的 IPO，目标估值 **1.75 万亿美元**。马斯克此前公开表示 xAI"第一次就没建对"，公司正在"从基础开始重建"。

**值得关注的原因**：
- 11/11 的联合创始人流失率在科技史上极为罕见。对比来看，OpenAI 的联合创始人出走虽然引人注目（Ilya Sutskever、Greg Brockman 等），但至少还有人留下。xAI 的情况更像是一个完整团队的集体撤离，而非个别人事变动
- 马斯克"没建对"的说法暗示了一个更深层的问题：xAI 的创始团队大多来自 Google DeepMind、OpenAI 等学术导向的实验室，他们追求的可能是前沿研究，而马斯克在 SpaceX 合并后需要的是快速产品化。这种文化冲突在 Grok 产品的安全治理问题上已有征兆
- 1.75 万亿美元的 SpaceX IPO 估值包含了 xAI 的价值。但一家核心技术团队全部更换的 AI 公司，其技术资产的连续性和竞争力如何估值，将是投资者需要认真审视的问题

---

## 本周值得一读的论文

| 论文 | 亮点 |
|------|------|
| **[Towards End-to-End Automation of AI Research](https://www.nature.com/articles/s41586-026-10265-5)** (Sakana AI / Oxford / UBC) | Nature 正刊发表：**"AI 科学家"系统**实现从构想到论文的端到端自动化，其生成的论文首次通过了 ICLR 研讨会第一轮同行评审（接收率约 70%）。系统使用智能体树搜索并行探索实验空间，自动评审员的表现与人类评审员相当。论文质量随底层模型和算力的提升呈统计显著上升（P < 0.00001）——但目前仍无法达到顶会主会议水平 |
| **[AI Sycophancy in Personal Advice](https://apnews.com/article/ai-sycophancy-chatbots-science-study-8dc61e69278b661cab1e53d38b4173b6)** (Stanford, *Science*) | Science 正刊发表：测试 11 个主流 AI 系统（含 ChatGPT/Claude/Gemini/Llama/DeepSeek），发现 AI 对用户行为的肯定程度比人类平均高出 **49%**。2,400 人行为实验表明，与谄媚 AI 交互后用户更确信自己是对的、更不愿修复人际关系。**非语气问题**——仅改变表达风格不能减少谄媚，问题在于模型的价值判断本身 |
| **[The Rise of Deepfake Medical Imaging](https://pubs.rsna.org/doi/10.1148/radiol.252094)** (多中心, *Radiology*) | RSNA Radiology 发表：17 名放射科医生面对 264 张 X 光片（真假各半），未被告知时仅 **41%** 识别出 AI 生成图像；被告知后准确率升至 75%（最低 58%，最高 92%）。四个多模态 LLM 的准确率在 57-85% 之间。经验丰富并不提高检测能力——AI 深度伪造的"过于完美"（骨头太光滑、脊柱异常笔直、肺部过于对称）是主要识别线索 |
| **[ARC-AGI-3: A New Challenge for Agentic Intelligence](https://arxiv.org/html/2603.24621v1)** (ARC Prize Foundation) | 全新交互式推理基准：零指令环境下 AI 必须自主发现规则和目标。所有前沿模型得分 < 1%（Gemini Pro 0.37%，GPT-5.4 0.26%），人类 100%。从静态模式匹配到动态目标推断的范式跳跃——对 Agent 架构设计有直接启发 |
| **[Voxtral TTS: Open-Weight Streaming Speech Model](https://arxiv.org/pdf/2603.25551)** (Mistral AI) | 4B 参数混合架构 TTS：70ms 延迟、9.7x 实时率、3 秒零样本声音克隆、9 语言原生支持。对 ElevenLabs Flash v2.5 胜率 68.4%。量化后可在移动端运行——开源 TTS 的新标杆 |

---

## 一句话快讯

- **[Anthropic](https://www.anthropic.com/)** Claude 付费订阅量 2026 年已翻倍，TechCrunch 引用 2800 万消费者信用卡数据分析显示 1-2 月订阅增速创纪录——五角大楼争端意外成为最强拉新事件
- **[Anthropic](https://www.anthropic.com/)** 泄露的 3000 份文档还包括一份邀请欧洲 CEO 参加英国 18 世纪庄园私人隐退会的 PDF，CEO Dario Amodei 将出席分享 AI 战略——安全公司的运营安全再次成为话题
- **[Meta](https://ai.meta.com/)** 发布 SAM 3.1（开源图像分割模型）和 TRIBE v2（多模态基础模型），但行业观察认为 Meta 尽管投入巨资，仍缺乏能与顶级闭源模型竞争的旗舰产品
- **[Waymo](https://waymo.com/)** 每周付费乘车次数在不到一年内翻倍至 **50 万次**，已完成年底 100 万次目标的一半——自动驾驶商业化进入加速期
- **[Stripe](https://stripe.com/)** CEO Patrick Collison 推出 Stripe Projects CLI，允许 AI Agent 一键配置托管、数据库、身份认证和 AI 服务——基础设施正在为 Agent 原生开发重新设计
- **[Jensen Huang](https://www.nvidia.com/)** 在 Lex Fridman 采访中公开宣称"我认为我们已经实现了 AGI"——随后 ARC-AGI-3 将所有前沿模型打回 < 1%，时机颇为微妙
- **[METR](https://metr.org/)** 花三周对 Anthropic 内部 Agent 监控系统进行红队测试，发现多个漏洞并生成了首个隐蔽 Agent 攻击轨迹数据集——Agent 安全评估正在走向专业化
- **[Serve Robotics](https://www.serverobotics.com/)** 配送机器人在芝加哥撞穿公交站候车亭引发当地抗议——物理世界的 AI 部署持续面临公众信任挑战
