---
title: "2026 年 LLM Code 方向新工作全景"
description: "代码大模型、Agentic Coding、训练方法、评测基准、工具基础设施全景覆盖"
date: 2026-03-07
category: 综合调研
tags: ["Code LLM", "全景综述"]
draft: false
---
# 2026 年 LLM Code 方向新工作全景

> **时间跨度**: 2026.01 — 2026.03  
> **覆盖范围**: 代码大模型、Agentic Coding、训练方法、评测基准、代码推理、工具基础设施  
> **WorkBuddy 生成 | 2026.03.07**

---

## 目录

1. [代码大模型 (Code LLMs)](#一代码大模型-code-llms)
2. [Agentic Coding / SWE Agent](#二agentic-coding--swe-agent)
3. [训练方法创新](#三训练方法创新)
4. [评测基准](#四评测基准)
5. [代码生成与推理](#五代码生成与推理)
6. [工具与基础设施](#六工具与基础设施)
7. [趋势总结](#七趋势总结)

---

## 一、代码大模型 (Code LLMs)

### 1.1 Claude Opus 4.6

- **机构 / 时间**: Anthropic, 2026.02
- **核心贡献**: 100 万 token 上下文窗口；MRCR v2 检索准确率从 18.5% 跃升至 76%；ARC-AGI 2 提升 83%；SWE-bench Verified 达 **80.8%**；支持 Agent Teams 多智能体协作
- **引用**: [Anthropic 官方公告](https://www.anthropic.com/news/claude-opus-4-6)

---

### 1.2 GPT-5.3-Codex

- **机构 / 时间**: OpenAI, 2026.02
- **核心贡献**: 号称"首个参与自身开发的 AI 编码模型"；Terminal-Bench 2.0 从 64% 跃升至 **77.3%**；SWE-bench Pro 达 **56.8%**；推理速度比前代快 25%
- **引用**: [OpenAI GPT-5.3-Codex-Spark 公告](https://openai.com/index/introducing-gpt-5-3-codex-spark/)

---

### 1.3 GPT-5.3 Instant

- **机构 / 时间**: OpenAI, 2026.03
- **核心贡献**: 即时响应版本，面向日常交互优化，减少过度谨慎问题，向所有 ChatGPT 用户和 API 开发者开放
- **引用**: [OpenAI GPT-5.3 Instant 公告](https://openai.com/index/gpt-5-3-instant/)

---

### 1.4 Qwen3-Coder-Next

- **机构 / 时间**: 阿里通义千问, 2026.02
- **核心贡献**: 基于 Qwen3-Next-80B-A3B-Base，总参 80B 但激活仅 3B (MoE)；混合注意力架构（Sliding Window + 线性记忆）；262K 上下文；166 万可验证任务训练；SWE-bench Verified **70.6%**；开源 Base + Instruct
- **引用**: [arXiv:2603.00729](https://arxiv.org/abs/2603.00729) · [GitHub: QwenLM/Qwen3-Coder](https://github.com/QwenLM/Qwen3-Coder)

---

### 1.5 GLM-5

- **机构 / 时间**: 智谱 AI, 2026.02
- **核心贡献**: 744B 参数（激活 40B）；预训练数据 28.5T tokens；异步 RL 框架 "Slime" + 稀疏注意力；代理编程评测开源第一，代码成本仅 $0.14/任务；适配华为昇腾；配套发布 ZCode 工具，从"写片段"升级到"完成系统工程"
- **引用**: [GitHub: THUDM](https://github.com/THUDM) · [HuggingFace: THUDM](https://huggingface.co/THUDM)

---

### 1.6 MiniMax M2.5

- **机构 / 时间**: MiniMax, 2026.02
- **核心贡献**: 激活参数仅 10B；SWE-bench Verified **80.2%**；Multi-SWE-bench **51.3%**；推理速度超 100 TPS；原生 Agent 生产级模型
- **引用**: [GitHub: MiniMax-AI](https://github.com/MiniMax-AI) · [HuggingFace: MiniMaxAI](https://huggingface.co/MiniMaxAI)

---

### 1.7 Gemini 3.1 Pro / Flash-Lite

- **机构 / 时间**: Google DeepMind, 2026.02-03
- **核心贡献**: Gemini 3.1 Pro 推理能力翻倍升级（Preview 开放）；Flash-Lite 极致性价比，百万输入 token 仅 $0.25
- **引用**: [Google DeepMind 博客](https://blog.google/technology/google-deepmind/gemini-3-1-pro/)

---

### 1.8 DeepSeek V3.2

- **机构 / 时间**: DeepSeek, 2025.12 → 2026
- **核心贡献**: 685B 参数，强化 Agent 能力并融入思考推理，正式版全平台上线（网页端、APP、API）
- **引用**: [GitHub: deepseek-ai/DeepSeek-V3.2-Exp](https://github.com/deepseek-ai/DeepSeek-V3.2-Exp) · [API 文档](https://api-docs.deepseek.com/zh-cn/news/news251201)

---

## 二、Agentic Coding / SWE Agent

### 2.1 Anthropic 2026 Agentic Coding 趋势报告

- **机构 / 时间**: Anthropic, 2026.02
- **核心贡献**: 18 页重磅报告，提出 **6 大趋势**：多 Agent 协同取代单体 Agent、长时运行 Agent 构建完整系统、人类从编码者变为"指挥官"、非技术人员也能用 Agent 开发应用、代码审查与安全升级、基础设施向 Agent-native 演进
- **引用**: [Anthropic 趋势报告 PDF](https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf)

---

### 2.2 Claude Code Agent Teams

- **机构 / 时间**: Anthropic, 2026.02
- **核心贡献**: Claude Code 支持多智能体协作——编排者 Agent 拆解任务，多个专家 Agent 并行处理架构设计、编码、测试等工作
- **引用**: [Claude Code Agent Teams 文档](https://code.claude.com/docs/zh-CN/agent-teams)

---

### 2.3 OpenAI Codex CLI v2.1

- **机构 / 时间**: OpenAI, 2026.02
- **核心贡献**: Rust 构建的命令行 AI 编程代理；支持 GPT-4.1 和 o4-mini；MCP 2.0 协议集成；200K+ token 超长上下文；多级沙箱隔离；跨平台原生支持
- **引用**: [GitHub: openai/codex](https://github.com/openai/codex)

---

### 2.4 Droid (Factory AI)

- **机构 / 时间**: Factory AI, 2026.02
- **核心贡献**: Terminal-Bench 2.0 排名第一 (**77.3%**)，搭配 GPT-5.3-Codex，证明了 Agent 架构设计比单纯模型选择更重要
- **引用**: [Factory AI — Terminal-Bench 公告](https://factory.ai/news/terminal-bench)

---

### 2.5 DeepSWE

- **机构 / 时间**: Agentica (UC Berkeley), 2026 初
- **核心贡献**: 基于 Qwen3-32B，**纯强化学习**训练的开源代码 Agent；SWE-bench 准确率 **59%**（开源 SOTA）；使用 rLLM 框架在 64 块 H100 上训练；证明纯 RL（无需 SFT 预热）可大幅提升代码 Agent 能力；全部开源
- **引用**: [HuggingFace: agentica-org/DeepSWE-Preview](https://huggingface.co/agentica-org/DeepSWE-Preview) · [GitHub: rLLM 训练框架](https://github.com/agentica-project/rllm)

---

### 2.6 OpenCode

- **机构 / 时间**: SST 开源社区, 2026.02
- **核心贡献**: 开源 AI Coding Agent，GitHub **99.8K Star**，月活 250 万+ 开发者；支持 75+ 模型供应商；MIT 许可；独创 Plan/Build 架构；支持终端、IDE、桌面端三种使用方式
- **引用**: [GitHub: anomalyco/opencode](https://github.com/anomalyco/opencode)

---

### 2.7 GitHub Copilot CLI 更新

- **机构 / 时间**: GitHub, 2026.01
- **核心贡献**: 引入 4 个专用 Agent 并行执行；95% token 上限时自动压缩；Pro 用户支持持久记忆
- **引用**: [GitHub: github/copilot-cli](https://github.com/github/copilot-cli)

---

### 2.8 OpenHands

- **机构 / 时间**: All-Hands-AI, 持续活跃至 2026.03
- **核心贡献**: 6193+ commits 的活跃开源 AI 开发平台，支持多种模型后端，持续迭代
- **引用**: [GitHub: All-Hands-AI/OpenHands](https://github.com/All-Hands-AI/OpenHands)

---

### 2.9 mini-SWE-agent 2.0

- **机构 / 时间**: Princeton (SWE-agent 团队), 2026.02
- **核心贡献**: SWE-bench 官方统一评测 harness 升级到 2.0 版本，用于所有模型的标准化对比评估
- **引用**: [SWE-bench 官方排行榜](https://www.swebench.com/) · [GitHub: SWE-agent/SWE-agent](https://github.com/SWE-agent/SWE-agent)

---

## 三、训练方法创新

### 3.1 rLLM 框架

- **机构 / 时间**: Agentica, 2026.02
- **核心贡献**: 开源的语言 Agent **强化学习后训练框架**，支持自定义 Agent 和环境；用于训练 DeepSWE 等模型；证明纯 RL 可大幅提升代码 Agent 能力
- **引用**: [GitHub: rllm-org/rllm](https://github.com/rllm-org/rllm)

---

### 3.2 Co-rewarding

- **机构 / 时间**: TMLR Group, ICLR 2026
- **核心贡献**: 自监督 RL 框架，通过**互补监督信号**提升训练稳定性，解决推理训练中的训练崩溃和平凡解问题；三个实例化方案（数据交叉引用、模型自蒸馏、组合方案）
- **引用**: [arXiv:2508.00410](https://arxiv.org/abs/2508.00410) · [GitHub: tmlr-group/Co-Reward](https://github.com/tmlr-group/Co-Reward)

---

### 3.3 智谱 Slime 框架

- **机构 / 时间**: 智谱 AI, 2026.02
- **核心贡献**: **异步强化学习框架**，用于 GLM-5 训练，配合稀疏注意力机制，大幅降低部署成本
- **引用**: [GitHub: THUDM](https://github.com/THUDM)（随 GLM-5 发布）

---

### 3.4 RAGEN

- **机构 / 时间**: mll-lab (Northwestern), 持续至 2026.02
- **核心贡献**: 利用强化学习训练 LLM 推理 Agent 在**交互式随机环境**中工作，支持 2048、Rubik's Cube 等新环境
- **引用**: [GitHub: ZihanWang314/ragen](https://github.com/ZihanWang314/ragen) · [项目主页](https://ragen-ai.github.io/)

---

### 3.5 EigenData + 可验证奖励 RL

- **机构 / 时间**: 2026.01
- **核心贡献**: 统一框架——**自进化数据合成 + 基于验证器的 RL**，用于后训练多轮交互式工具使用 Agent；层级化多 Agent 引擎合成工具基础对话并生成可执行的实例级检查器
- **引用**: [arXiv:2601.22607](https://arxiv.org/abs/2601.22607)

---

### 3.6 Proxy State-Based Evaluation

- **机构 / 时间**: 2026.02
- **核心贡献**: 面向多轮工具调用 LLM Agent 的**可扩展可验证奖励**方案，提出基于代理状态的评估方法，解决完全确定性后端构建成本高的问题
- **引用**: [arXiv:2602.16246](https://arxiv.org/abs/2602.16246)

---

## 四、评测基准

### 4.1 SWE-bench Verified 2.0 评测体系

- **机构 / 时间**: Princeton + SWE-agent 团队, 2026.02
- **核心贡献**: 使用 mini-SWE-agent 2.0 统一评测所有模型。当前排行：Claude 4.5 Opus (high reasoning) **76.8%** > Gemini 3 Flash 75.8% = MiniMax M2.5 75.8% > Claude Opus 4.6 75.6% > GPT-5-2 Codex 72.8% = GLM-5 72.8%
- **引用**: [SWE-bench 官方排行榜](https://www.swebench.com/) · [GitHub: swe-bench/SWE-bench](https://github.com/swe-bench/SWE-bench)

---

### 4.2 SWE-bench Pro

- **机构 / 时间**: Scale AI (OpenAI 推荐), 2026
- **核心贡献**: OpenAI 宣布 SWE-bench Verified **已无法区分前沿模型**，推荐 SWE-bench Pro 作为更难替代评测；GPT-5.3-Codex 在 Pro 上达 **56.8%**
- **引用**: [arXiv:2509.16941](https://arxiv.org/abs/2509.16941) · [GitHub: scaleapi/SWE-bench_Pro-os](https://github.com/scaleapi/SWE-bench_Pro-os)

---

### 4.3 SWE-bench Live

- **机构 / 时间**: Microsoft, NeurIPS 2025 D&B → 持续更新至 2026.02
- **核心贡献**: 从真实 GitHub 持续收集新问题，**避免数据污染**，提供动态更新的评测集
- **引用**: [GitHub: microsoft/SWE-bench-Live](https://github.com/microsoft/SWE-bench-Live)

---

### 4.4 Terminal-Bench 2.0

- **机构 / 时间**: Laude Institute / Terminal-Bench 团队, 2026
- **核心贡献**: 评估自主 AI Agent 在真实终端任务上的表现。当前排行：Droid + GPT-5.3-Codex **77.3%** > Simple Codex 75.1%；配套发布 Harbor 运行框架
- **引用**: [Terminal-Bench 排行榜](https://www.tbench.ai/leaderboard/terminal-bench/2.0) · [GitHub: laude-institute/terminal-bench](https://github.com/laude-institute/terminal-bench)

---

### 4.5 Multi-SWE-bench

- **机构 / 时间**: 字节豆包 (ByteDance Seed), 2025 → 持续使用至 2026
- **核心贡献**: 首个**多语言代码修复基准**，覆盖 Python 外 7 种语言（Java, Go, Rust, C, C++, TypeScript, JavaScript），1632 个实例。MiniMax M2.5 达 **51.3%**
- **引用**: [HuggingFace: ByteDance-Seed/Multi-SWE-bench](https://huggingface.co/datasets/ByteDance-Seed/Multi-SWE-bench) · [GitHub: bytedance/Multi-SWE-bench](https://github.com/bytedance/Multi-SWE-bench)

---

### 4.6 SWE-World

- **机构 / 时间**: 中国人民大学 RUCAIBox, 2026.02-03
- **核心贡献**: 将 SWE-bench 转化为**可用于 RL 训练的环境** (SWE-World)，支持 DeepSWE_RL 和 SFT 训练（2026.03.02 最新更新）
- **引用**: [GitHub: RUCAIBox/SWE-World](https://github.com/RUCAIBox/SWE-World)

---

### 4.7 LiveCodeBench

- **机构 / 时间**: 持续更新
- **核心贡献**: 从 LeetCode、AtCoder、CodeForces 竞赛平台持续收集新题，提供**无数据污染**的代码生成评估，覆盖代码生成、自修复、执行预测等多维度
- **引用**: [LiveCodeBench 主页](https://livecodebench.github.io/) · [GitHub: LiveCodeBench/LiveCodeBench](https://github.com/LiveCodeBench/LiveCodeBench)

---

## 五、代码生成与推理

### 5.1 Claude Opus 4.6 自适应推理

- **机构 / 时间**: Anthropic, 2026.02
- **核心贡献**: **四级推理强度调节**（快速 / 平衡 / 深度 / 极致），支持将复杂任务自动拆解为多个子任务并行处理，在代码审查、多文件分析等场景表现优异
- **引用**: [Anthropic 官方公告](https://www.anthropic.com/news/claude-opus-4-6)

---

### 5.2 GPT-5.3-Codex 自我开发能力

- **机构 / 时间**: OpenAI, 2026.02
- **核心贡献**: 在开发过程中**参与调试自身代码**，代表了模型参与自身迭代优化的新范式
- **引用**: [OpenAI GPT-5.3-Codex-Spark 公告](https://openai.com/index/introducing-gpt-5-3-codex-spark/)

---

### 5.3 GLM-5 "写工程" + ZCode

- **机构 / 时间**: 智谱 AI, 2026.02
- **核心贡献**: 从"写代码片段"升级到"完成系统工程"；配套 ZCode 工具支持自然语言描述需求后自动拆解任务、指挥多 Agent 完成编码调试全流程；支持手机远程指挥桌面端 Agent
- **引用**: [GitHub: THUDM](https://github.com/THUDM)

---

### 5.4 Vision-R1

- **机构 / 时间**: 开源项目, ICLR 2026
- **核心贡献**: 首个探索如何有效将 **R1 式 RL** 应用于多模态大模型的工作，为代码 + 视觉理解奠定基础
- **引用**: ICLR 2026 (具体论文链接待补充)

---

## 六、工具与基础设施

### 6.1 MCP 2.0 协议

- **机构 / 时间**: Anthropic + 生态, 2025-2026
- **核心贡献**: 成为 AI Agent 与外部工具交互的**事实标准**；Codex CLI v2.1、Claude Code、Gemini CLI 等工具全面支持；定义了 Tool 定义、调用、结果返回的统一规范
- **引用**: [MCP 官方文档](https://modelcontextprotocol.io/) · [GitHub: modelcontextprotocol](https://github.com/modelcontextprotocol)

---

### 6.2 Qwen Code CLI

- **机构 / 时间**: 阿里通义, 持续至 2026
- **核心贡献**: 终端命令行 AI Coding Agent，中国大陆用户每天 2000 次免费调用，无 token 限制；支持 OpenAI 兼容 API 接入
- **引用**: [GitHub: QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) · [Qwen Code 文档](https://qwenlm.github.io/qwen-code-docs/zh/users/overview/)

---

### 6.3 Gemini CLI

- **机构 / 时间**: Google, 2025 发布 → 2026 持续迭代
- **核心贡献**: 开源 AI 终端编程工具，免费使用 Gemini 2.5 Pro / 3 Pro 模型，支持 MCP 协议，内置 Google 搜索
- **引用**: [GitHub: google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)

---

### 6.4 Trae (字节跳动 AI IDE)

- **机构 / 时间**: 字节跳动, 持续至 2026
- **核心贡献**: AI 原生 IDE，集成 **SOLO 模式**（AI 自动执行全流程）；国内版搭配豆包 / DeepSeek，海外版支持 GPT-4o / Claude；支持自然语言对话编程
- **引用**: [Trae 海外版](https://www.trae.ai/) · [Trae 国内版](https://www.trae.com.cn/)

---

### 6.5 JetBrains Junie

- **机构 / 时间**: JetBrains, 2025-2026
- **核心贡献**: AI 编程 Agent 达到**"生产就绪"**状态，支持 IntelliJ IDEA、PyCharm 等 IDE，可执行编写代码、调试、测试等多步骤任务
- **引用**: [JetBrains Junie 官方页](https://www.jetbrains.com/junie/)

---

### 6.6 Cursor Web App

- **机构 / 时间**: Anysphere, 2025-2026
- **核心贡献**: 从桌面 IDE 扩展到**浏览器端管理多 Agent 网络**，推出 Web 端应用
- **引用**: [Cursor 官网](https://www.cursor.com/)

---

## 七、趋势总结

### 📊 五大核心趋势

| # | 趋势 | 关键信号 |
|---|------|---------|
| **1** | **模型竞争白热化** | Opus 4.6 / GPT-5.3 / GLM-5 / MiniMax M2.5 同周发布，SWE-bench Verified 已超 80% |
| **2** | **Agent 化是主旋律** | 从单模型补全 → 多 Agent 协同、长时运行、自主规划。[Anthropic 趋势报告](https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf)定义方向 |
| **3** | **RL for Code 崛起** | [DeepSWE](https://huggingface.co/agentica-org/DeepSWE-Preview) 证明纯 RL 可训练 SOTA 开源 Agent，[rLLM](https://github.com/rllm-org/rllm) / Slime 等框架使 RL 训练民主化 |
| **4** | **评测体系重建** | SWE-bench Verified 饱和 → [SWE-bench Pro](https://arxiv.org/abs/2509.16941) / [Terminal-Bench 2.0](https://www.tbench.ai/leaderboard/terminal-bench/2.0) / [SWE-World](https://github.com/RUCAIBox/SWE-World) 等更难基准涌现 |
| **5** | **CLI Agent 大爆发** | Claude Code / [Codex CLI](https://github.com/openai/codex) / [Gemini CLI](https://github.com/google-gemini/gemini-cli) / [Qwen Code](https://github.com/QwenLM/qwen-code) / [OpenCode](https://github.com/anomalyco/opencode) 全面铺开，[MCP](https://modelcontextprotocol.io/) 成为互操作标准 |

### 🏆 SWE-bench Verified 2.0 最新排行（截至 2026.03）

| 排名 | 模型 | 得分 |
|------|------|------|
| 1 | Claude 4.5 Opus (high reasoning) | **76.8%** |
| 2 | Gemini 3 Flash | 75.8% |
| 2 | MiniMax M2.5 | 75.8% |
| 4 | Claude Opus 4.6 | 75.6% |
| 5 | GPT-5-2 Codex | 72.8% |
| 5 | GLM-5 | 72.8% |

> 注：上表为 mini-SWE-agent 2.0 统一 harness 评测结果，数据来源 [swebench.com](https://www.swebench.com/)

### 🔗 与前期研究报告的关联

本报告中的多项工作与 `OpenStudy/` 目录下已有的精读报告密切关联：

- [Qwen3-Coder-Next 精读](./Qwen3_Coder_Next_Deep_Reading.md) — 覆盖 §1.4 的完整技术细节
- [Agentic RL Reward Hacking 报告](./Agentic_RL_Reward_Hacking_Report.md) — 覆盖 §3.1 rLLM / DeepSWE 的 RL 训练 + Reward Hacking 防御

---

*2026 年 LLM Code 方向新工作全景 | WorkBuddy 生成 | 2026.03.07*
