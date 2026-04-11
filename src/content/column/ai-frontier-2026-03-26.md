---
title: "OpenAI 关停 Sora 全面转向 Agent、Arm 35 年来首颗自研芯片问世、AI 首次解决数学开放问题"
description: "2026年3月第5周 AI 行业动态：OpenAI 砍掉视频业务并预训练完成代号 Spud 的下一代模型，Arm 发布 136 核 AGI CPU 重塑数据中心格局，GPT-5.4 Pro 在 FrontierMath 上攻克了一个悬而未决七年的组合学难题"
date: 2026-03-26
series: "AI 前沿速递"
volume: 5
tags: ["OpenAI", "Sora", "Arm", "AGI CPU", "FrontierMath", "Claude", "Computer Use", "LiteLLM", "供应链安全", "Figma", "MCP"]
---

## 本周核心事件

### 1. OpenAI 关停 Sora、预训练完成"Spud"模型 —— 一场蓄谋已久的战略收缩

**事件概要**：3 月 24 日，[OpenAI 宣布关闭 Sora](https://www.cnn.com/2026/03/24/tech/openai-sora-video-app-shutting-down)——包括独立应用和 API——距其上线仅 6 个月。ChatGPT 内的视频功能也将一并下线，研究团队将转向"世界模拟研究以推进机器人技术"。与此同时，去年 12 月与 Disney 签署的 **10 亿美元**角色授权协议正式终止。OpenAI 给出的理由是需要将算力重新分配到"更高优先级"的方向。同日，[The Information 报道](https://www.theinformation.com/articles/openai-ceo-shifts-responsibilities-preps-spud-ai-model) Sam Altman 在内部备忘录中透露，代号"**Spud**"的下一个主要模型已完成预训练，他称其"真正能加速经济"，预计数周内将对外展示。此外，Altman 放弃了对安全和安保团队的直接监管，安全部门转归首席研究官 Mark Chen，安保部门移至总裁 Greg Brockman 旗下。Fidji Simo 领导的产品部门更名为"**AGI 部署**"。

**值得关注的原因**：
- Sora 曾是 OpenAI 消费级创意工具战略的核心赌注，上线 5 天即突破百万下载——但此后月下载量持续下滑 32%+，证明了"AI 生成视频"在当前阶段的产品-市场适配远不如预期
- 关停 Sora 的时间节点高度敏感：OpenAI 正筹备 IPO，砍掉高算力消耗且 ROI 不明的业务线，本质上是在向资本市场"瘦身"。将部门更名为"AGI 部署"更是在 IPO 叙事中抢占制高点——在 OpenAI 与微软的协议中，"AGI"一词具有合同效力
- Spud 模型的出现意味着 OpenAI 的模型迭代节奏仍在加速。结合超级应用（ChatGPT + Codex + 浏览器整合）的规划，OpenAI 的战略正从"多条产品线试错"收敛为"一个超级入口 + 一个最强模型"

### 2. Arm 发布首颗自研芯片 AGI CPU —— 35 年授权模式的历史性转折

**事件概要**：3 月 24 日，[Arm 正式发布 AGI CPU](https://newsroom.arm.com/news/arm-agi-cpu-launch)——这是公司 35 年历史上首颗以自有品牌销售的完整芯片。该处理器基于 Neoverse V3 架构，最高 **136 核**，采用 TSMC **3nm** 工艺，TDP 300W。每核心支持 **6GB/s** 内存带宽和亚 100ns 延迟。风冷配置下单机架可部署 8,160 核，液冷可达 **45,000 核**，号称同等机架性能是 x86 平台的 **2 倍以上**。[Meta 是首发客户](https://www.cnbc.com/2026/03/24/arm-launches-its-own-cpu-with-meta-as-first-customer.html)，将 AGI CPU 与其自研 MTIA 加速器搭配用于推理基础设施。OpenAI、Cerebras、Cloudflare、SAP 等也已签约。超过 50 家生态伙伴（含 AWS、NVIDIA、Google、Microsoft）提供支持，预计下半年通过 Supermicro、联想等 OEM 广泛供货。

**值得关注的原因**：
- Arm 从 IP 授权商转型为芯片制造商，是半导体行业数十年来最重大的商业模式变革之一。此前 Arm 只卖设计图纸，现在直接卖芯片——这意味着它与高通、联发科等授权客户的关系将发生微妙变化
- AGI CPU 的"每核心 6GB/s 带宽 + 亚 100ns 延迟"的组合专门针对 AI Agent 推理场景优化——当 Agent 系统需要持续运行、海量 token 生成时，CPU 侧的协调和数据搬运能力成为瓶颈。Arm 瞄准的正是这个被 GPU 厂商忽视的环节
- Arm 声称每 GW 数据中心容量可节省高达 **100 亿美元**资本支出。如果这一承诺兑现，对于正在疯狂扩建数据中心的 OpenAI（6650 亿美元算力承诺）和 Meta 而言，切换到 Arm 主机架构的经济激励极为显著

### 3. Claude 获得 Mac 电脑控制能力 —— AI Agent 从 API 走向桌面

**事件概要**：3 月 23 日，[Anthropic 宣布](https://venturebeat.com/technology/anthropics-claude-can-now-control-your-mac-escalating-the-fight-to-build-ai) Claude Code 和 [Claude Cowork](https://www.macrumors.com/2026/03/24/claude-use-mac-remotely-iphone/) 工具新增"Computer Use"功能，允许 Claude 远程控制用户的 Mac——点击应用、导航浏览器、填写表单、整理文件、生成报告。该功能目前以研究预览形式提供给 Pro 和 Max 订阅用户。Anthropic 同步发布了[经济指数报告](https://winbuzzer.com/2026/03/25/anthropic-claude-code-cowork-auto-mode-computer-use-xcxwbn/)，显示有经验的 Claude 用户在使用 Computer Use 时反而**更加谨慎**——他们迭代次数更多、处理更高价值的任务，但减少了全权委托式的使用方式。Anthropic 年收入已突破 **25 亿美元**。

**值得关注的原因**：
- Computer Use 是 AI Agent 能力边界的一次质变：从"通过 API 调用工具"升级为"像人类一样操作任何软件"。这意味着 Claude 理论上可以使用任何没有 API 的传统软件——这是 Agent 全面渗透工作流的关键能力
- Anthropic 的经济指数报告揭示了一个反直觉的发现：更强大的自主能力并没有让用户更"甩手"，反而让他们更审慎。这暗示 AI 工具的最佳使用模式可能不是完全自动化，而是"高能力 + 人类监督"的半自主模式
- 从时间线看，OpenAI 的 GPT-5.4 原生电脑控制（3 月初）→ Anthropic 的 Claude Computer Use（3 月下旬），两大厂商在一个月内相继交付了桌面控制能力，"Agent 操作电脑"正在从概念变为标配功能

### 4. GPT-5.4 Pro 首次解决数学开放问题 —— AI 从"做题"到"做研究"的里程碑

**事件概要**：[Epoch AI 独立验证](https://winbuzzer.com/2026/03/24/gpt-54-pro-solves-open-math-problem-epoch-ai-frontiermath-xcxwbn/)，OpenAI 的 GPT-5.4 Pro 成功解决了一个自 2019 年以来悬而未决的**超图 Ramsey 类组合学问题**——这是 AI 首次在 [FrontierMath](https://epoch.ai/frontiermath/open-problems) 基准中对真正的开放问题产出新颖的数学证明。该问题由数学家 Will Brian 和 Paul Larson 于 2019 年提出，涉及改进无穷级数同时收敛时产生的序列 H(n) 的下界。GPT-5.4 Pro 消除了现有构造中的低效性，生成了与上界匹配的紧致界——Brian 确认该结果可在标准学术期刊发表。值得注意的是，Anthropic Opus 4.6、Google Gemini 3.1 Pro 也在后续测试中复现了这一结果。FrontierMath 总分已从 2024 年 GPT-4 的约 **5%** 飙升至 GPT-5.4 Pro 的 **50%**。自 2025 年圣诞节以来，共有 15 个数学开放问题从"未解决"变为"已解决"，其中 **11 个（73%）**有 AI 参与。

**值得关注的原因**：
- 这是 AI 从"数学做题"迈向"数学研究"的标志性事件：解决教科书习题和解决开放问题是本质不同的任务——后者要求创造力和新颖的构造方法，而非模式匹配
- FrontierMath 两年内从 5% 到 50% 的进步曲线令人震撼。菲尔兹奖得主陶哲轩评论称 AI 解决了数学研究中的"资源限制"问题，可作为人类数学家的强大协作者
- 提示工程的作用不可忽视：首先从 GPT-5.4 Pro 中获得解决方案的 Kevin Barreto 和 Liam Price 可能被列为论文合著者——"人类提问 + AI 求解"正在成为一种新的科研协作范式

### 5. LiteLLM 遭供应链攻击 —— AI 基础设施的安全警钟

**事件概要**：3 月 24 日，安全研究人员发现 [LiteLLM](https://docs.litellm.ai/blog/security-update-march-2026)——一个月下载量达 **9700 万次**的 AI 代理代理框架——在 PyPI 上的 1.82.7 和 1.82.8 版本[被植入恶意代码](https://thehackernews.com/2026/03/teampcp-backdoors-litellm-versions.html)。攻击者 TeamPCP 利用维护者账号被盗的 PyPI 凭证发布了携带后门的版本。恶意载荷通过 `.pth` 文件在每次 Python 启动时自动执行，收集 **SSH 密钥、AWS 凭证、Kubernetes secrets** 并尝试在集群中横向移动。多家安全厂商（Endor Labs、JFrog）随后确认了攻击细节。LiteLLM 团队已发布安全更新，建议所有用户立即检查并升级。

**值得关注的原因**：
- LiteLLM 是几乎所有主流 AI Agent 框架（LangChain、CrewAI、AutoGen 等）的底层依赖。9700 万月下载量意味着爆炸半径极大——这不是一个小众库被攻击，而是 AI 基础设施的核心供应链被渗透
- `.pth` 文件攻击向量极其隐蔽：它绕过了常规的代码审计流程，在 Python 启动时自动执行，用户无需 `import litellm` 即可中招。这对依赖 `pip install` 部署 AI 服务的团队敲响了警钟
- AI 生态的"供应链安全债"正在显现：当 AI Agent 被赋予越来越多的系统权限（如文件操作、API 调用、Kubernetes 编排），底层依赖被攻陷的后果将远超传统软件供应链攻击

---

## 本周值得一读的论文

| 论文 | 亮点 |
|------|------|
| **[TurboQuant: Training-Free Extreme KV Cache Compression](https://www.marktechpost.com/2026/03/25/google-introduces-turboquant-a-new-compression-algorithm-that-reduces-llm-key-value-cache-memory-by-6x-and-delivers-up-to-8x-speedup-all-with-zero-accuracy-loss/)** (Google Research) | KV Cache 压缩到 3 bit，内存减少 **5-6 倍**、推理加速 **8 倍**，且零精度损失。基于数据无关的随机旋转 + 最优标量量化，无需微调即可部署。在 10.4 万 token 上下文中仍匹配全精度性能 |
| **[SRLM: Self-Reflective Program Search for Long Context](https://arxiv.org/abs/2603.15653)** (Apple) | 让 LLM 在处理长文本时学会"自我反思"：模型主动检查推理过程的合理性并决定是否回溯。在超长上下文任务上性能提升高达 **22%**——首次将元认知机制引入长上下文推理 |
| **[On the Direction of RLVR Updates for LLM Reasoning](https://huggingface.co/papers/2603.22117)** | 深入分析 RL 验证器反馈（RLVR）如何影响 LLM 推理方向的更新动态，为 RL-based reasoning 的训练策略提供了理论基础和实践指导 |
| **[LightMem: Lightweight and Efficient Memory-Augmented Generation](https://arxiv.org/abs/2510.18866)** (ICLR 2026) | 在不牺牲准确率的前提下大幅降低 LLM 外部记忆系统的 token 消耗和 API 调用次数。对于需要长期记忆的 Agent 系统，这是一个高度实用的工程优化方案 |
| **[Reasoning Trap: LLM Reasoning Risks Emergent Self-Awareness](https://arxiv.org/abs/2603.09200)** (剑桥大学/Amazon/Google/斯坦福) | ICLR 2026 研讨会论文：改进 LLM 推理能力可能无意中创造出具有自我意识的智能体——当推理者将推理转向自身时会发生什么？提出了"推理陷阱"概念 |

---

## 一句话快讯

- **[Figma](https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/)** 推出 `use_figma` MCP 工具和 Agent Skills 系统，AI Agent 可直接在 Figma 画布上创建和编辑设计元素——设计工作流的"氛围编码"时代开始了
- **[Apple](https://www.macrumors.com/)** 正在测试独立的 Siri 应用，配备全新"询问 Siri"按钮（iOS 27），暗示 Apple Intelligence 即将迎来重大升级
- **[Google DeepMind](https://ai.google.dev/)** 在 AI Studio 推出 Flash-Lite Browser，可实时生成网页；Google TV 新增三项 Gemini 功能（视觉回应、深度探索、体育简报）
- **[Anthropic](https://github.com/anthropics)** 在 GitHub 开源"Agent Skills"框架，试图建立 Agent 能力描述的行业标准，OpenAI 尚未跟进
- **[Kleiner Perkins](https://www.kleinerperkins.com/)** 推出 **35 亿美元**新基金专注 AI 初创企业，Cursor 母公司 Anysphere D 轮融资 **23 亿美元**估值达 293 亿美元
- **[Jensen Huang](https://www.nvidia.com/)** 在播客中声称 AGI 已经实现，将其定义为"能创造十亿美元价值公司的 AI"——这一宽松定义引发 Karpathy 等人的质疑
- **[Amazon](https://www.aboutamazon.com/)** 收购 Fauna Robotics 正式进入消费级人形机器人市场，Zoox 计划在美国推出付费自动驾驶出租车服务
- **[Cognition AI（Devin）](https://www.cognition.ai/)** 完成 **4 亿美元** C 轮融资，估值从 40 亿跃升至 **102 亿美元**——AI 编程赛道的估值天花板继续上移
