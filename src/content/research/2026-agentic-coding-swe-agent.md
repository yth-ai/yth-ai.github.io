---
title: "2026 年 Agentic Coding / SWE Agent 详细对比报告"
description: "覆盖 12 个核心项目的行业趋势、商业 Agent 产品、开源框架及训练方法论"
date: 2026-03-07
category: 综合调研
tags: ["SWE Agent", "Agentic Coding", "Agent 对比"]
draft: false
---
# 2026 年 Agentic Coding / SWE Agent 详细对比报告

> **覆盖范围**: 行业趋势报告 · 商业 Agent 产品 · 开源 Agent 框架 · Agent 训练与评测方法论  
> **项目数量**: 12 个核心项目  
> **时间范围**: 2025.12 — 2026.03  
> **WorkBuddy 生成 | 2026.03.07**

---

## 目录

**第一部分：全局对比**
1. [项目分类总览](#一项目分类总览)
2. [全局对比表——基本信息](#二全局对比表基本信息)
3. [全局对比表——技术架构与能力](#三全局对比表技术架构与能力)
4. [全局对比表——评测成绩](#四全局对比表评测成绩)

**第二部分：行业趋势**
5. [Anthropic 2026 Agentic Coding 趋势报告](#五anthropic-2026-agentic-coding-趋势报告)

**第三部分：商业 Agent 产品**
6. [Claude Code Agent Teams](#六claude-code-agent-teams)
7. [OpenAI Codex CLI](#七openai-codex-cli)
8. [Droid (Factory AI)](#八droid-factory-ai)
9. [GitHub Copilot Agent Mode](#九github-copilot-agent-mode)
10. [Gemini CLI](#十gemini-cli)
11. [Amazon Q Developer Agent](#十一amazon-q-developer-agent)

**第四部分：开源 Agent 框架与工具**
12. [OpenCode](#十二opencode)
13. [OpenHands](#十三openhands)

**第五部分：Agent 训练与评测方法论**
14. [DeepSWE](#十四deepswe)
15. [mini-SWE-agent 2.0](#十五mini-swe-agent-20)
16. [Agentless](#十六agentless)

**第六部分：综合分析**
17. [技术趋势与竞争格局](#十七技术趋势与竞争格局)
18. [选型建议](#十八选型建议)

---

## 一、项目分类总览

| 分类 | 项目 | 核心定位 |
|------|------|---------|
| **行业趋势** | Anthropic 趋势报告 | 18 页报告，定义 2026 年 6 大趋势 |
| **商业 Agent** | Claude Code Agent Teams | 多智能体协作编码 |
| | OpenAI Codex CLI | Rust 构建的本地 Agent + 多级沙箱 |
| | Droid (Factory AI) | "Agent 设计 > 模型选择"方法论 |
| | GitHub Copilot Agent Mode | /fleet 并行 + 持久记忆 + 后台任务 |
| | Gemini CLI | Google 开源终端 Agent (Apache 2.0) |
| | Amazon Q Developer Agent | AWS 生态深度集成的 5 大 Agent 命令 |
| **开源框架** | OpenCode | 118K Star, Plan/Build 双 Agent 架构 |
| | OpenHands | 事件驱动架构 + CodeAct + Docker 沙箱 |
| **训练与评测** | DeepSWE | 纯 RL 训练 Agent (GRPO++, 59% SWE-bench) |
| | mini-SWE-agent 2.0 | ~100 行 Python 统一评测 harness |
| | Agentless | 无 Agent 三阶段流水线基线方法 |

---

## 二、全局对比表——基本信息

| 项目 | 机构 | 发布时间 | 类型 | 许可证 | 底层模型 | GitHub Stars |
|------|------|---------|------|--------|---------|-------------|
| **Claude Code Agent Teams** | Anthropic | 2026.02 | 商业 | 专有 | Claude Opus 4.6 | — |
| **OpenAI Codex CLI** | OpenAI | 2026.02 | 商业开源 | Apache 2.0 | GPT-5.3/5.4 | — |
| **Droid** | Factory AI | 2026.02 | 商业 | 专有 | 多模型适配 | — |
| **Copilot Agent Mode** | GitHub | 2026.01 | 商业 | 专有 | Claude Sonnet 4.5 / GPT-5 | — |
| **Gemini CLI** | Google | 2025.06→2026 | 商业开源 | Apache 2.0 | Gemini 3/3.1 | 53K+ |
| **Amazon Q Developer** | AWS | 持续更新 | 商业 | 专有 | 自研模型 | — |
| **OpenCode** | SST/Anomaly | 持续更新 | 开源 | **MIT** | 75+ 供应商 | **118K** |
| **OpenHands** | All-Hands-AI | 持续更新 | 开源 | **MIT** | 任意 LLM (LiteLLM) | **68.7K** |
| **DeepSWE** | UC Berkeley + Together AI | 2026 初 | 研究开源 | **MIT** | Qwen3-32B | — |
| **mini-SWE-agent 2.0** | Princeton + Stanford | 2026.02 | 研究开源 | MIT | 任意模型 | — |
| **Agentless** | UIUC | 2024→2026 | 研究开源 | MIT | 任意 LLM | — |

---

## 三、全局对比表——技术架构与能力

| 项目 | 架构类型 | 多 Agent | 沙箱隔离 | MCP 支持 | 多模型 | Agent 训练 |
|------|---------|---------|---------|---------|-------|-----------|
| **Claude Code Agent Teams** | 分层多 Agent | ✅ Team Lead + Teammates | — | ✅ | 仅 Claude | — |
| **Codex CLI** | 单 Agent + 子 Agent | ✅ spawn_agents | ✅ Seatbelt/Landlock/Windows | ✅ MCP 2.0 | 仅 OpenAI | — |
| **Droid** | 模型适配单 Agent | ❌ | — | — | ✅ 多模型 | — |
| **Copilot Agent Mode** | 并行多 Agent | ✅ /fleet | ✅ GitHub Actions | ✅ | ✅ 多供应商 | — |
| **Gemini CLI** | 单 Agent | ❌ | ✅ Trusted Folders | ✅ | 仅 Gemini | — |
| **Amazon Q Developer** | 5 Agent 命令 | ✅ 专用 Agent | ✅ AWS 环境 | — | 仅自研 | — |
| **OpenCode** | Plan/Build 双 Agent | ✅ General + Explore 子 Agent | — | — | ✅ 75+ 供应商 | — |
| **OpenHands** | 事件驱动 Agent | ✅ 子 Agent | ✅ Docker 沙箱 | ✅ MCPAction | ✅ LiteLLM | RL 微调 |
| **DeepSWE** | RL 训练 Agent | ❌ | ✅ Docker 环境 | — | 仅 Qwen3-32B | **纯 RL (GRPO++)** |
| **mini-SWE-agent 2.0** | 极简 Bash Agent | ❌ | ✅ subprocess | — | ✅ LiteLLM | — |
| **Agentless** | 无 Agent 流水线 | ❌ | — | — | ✅ 任意 LLM | — |

---

## 四、全局对比表——评测成绩

| 项目 | SWE-bench Verified | SWE-bench Pro | Terminal-Bench 2.0 | Multi-SWE-bench | 评测条件 |
|------|-------------------|---------------|--------------------|-----------------|---------| 
| **Claude Code Agent Teams** | 75.6%~81.4% | — | 最高分 | — | Opus 4.6, 自有框架 |
| **Codex CLI** | — | **56.8%** | 75.1% (Simple Codex) | — | GPT-5.3-Codex |
| **Droid** | — | — | **77.3%** | — | GPT-5.3-Codex + Droid |
| **Copilot Agent Mode** | — | — | — | — | Claude Sonnet 4.5 |
| **Gemini CLI** | — | — | — | — | Gemini 3.1 Pro |
| **Amazon Q Developer** | "最高分" (官方声明) | — | — | — | 自研模型 |
| **OpenCode** | — | — | — | — | 依赖底层模型 |
| **OpenHands** | >50% (平台) / 37.2% (自有LM) | — | — | — | 依赖底层模型 |
| **DeepSWE** | **59.0%** (Hybrid TTS) / 42.2% (Pass@1) | — | — | — | Qwen3-32B + R2E-Gym |
| **mini-SWE-agent 2.0** | **76.8%** (Opus 4.6 high) / **74%+** (Gemini 3 Pro) | — | — | — | 统一 harness |
| **Agentless** | **50.8%** | — | — | — | Claude 3.5 Sonnet |

> **注**: mini-SWE-agent 2.0 作为统一评测 harness，其成绩反映的是底层模型能力而非 Agent 本身的创新。

---

## 五、Anthropic 2026 Agentic Coding 趋势报告

**Anthropic | 2026.02 | [PDF 报告](https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf)**

### 报告概况

18 页行业报告，副标题 *"How coding agents are reshaping software development"*（编码 Agent 如何重塑软件开发）。报告将趋势组织为三个维度、**6 大趋势**：

| 维度 | 趋势 |
|------|------|
| **基础变革 (Foundation)** | 1. 软件开发生命周期剧变 |
| **能力演进 (Capability)** | 2. 单 Agent → 协调团队 |
| | 3. 长时运行 Agent 构建完整系统 |
| | 4. 人类监督通过智能协作扩展 |
| | 5. Agentic Coding 扩展到新场景和新用户 |
| **影响趋势 (Impact)** | 6. 生产力增益重塑软件开发 |

### 趋势 1：软件开发生命周期剧变

> 📜 *"The software development lifecycle changes dramatically"*

- 工程师角色从**写代码**转变为**编排 Agent 写代码**
- 战术性工作（编码、调试、维护）委派给 AI，人类聚焦架构设计和战略决策
- 新员工上手时间从数周压缩到数小时
- 可动态"召唤"专家 Agent，无需经历传统的效率低谷
- 报告称这是**自 GUI 以来最重要的人机交互范式转变**

### 趋势 2：单 Agent 进化为协调团队

> 📜 *"Single agents evolve into coordinated teams"*

- 多 Agent 系统取代单一对话窗口
- 架构：**编排者 Agent**（任务分解、工作分配、结果合成）+ **专家 Agent**（架构、编码、测试——并行工作）
- 多窗口并行推理最大化性能增益

### 趋势 3：长时运行 Agent 构建完整系统

> 📜 *"Long-running agents build complete systems"*

- 任务持续时间从分钟级扩展到**天/周级**
- Agent 可自主规划、迭代、从失败恢复、维护项目状态
- 人类仅在关键决策点介入
- 系统性消除积累的技术债务

**📜 Rakuten 案例**：一名工程师让 Claude 在 vLLM（**1250 万行代码**的开源库）中实现特定的激活向量提取方法。Claude 在**单次 7 小时连续运行**中自主完成任务，**准确率 99.9%**。工程师仅负责任务发起和结果验证。

### 趋势 4：人类监督通过智能协作扩展

> 📜 *"Human oversight scales through intelligent collaboration"*

**协作悖论**：Anthropic 内部研究发现——

| 指标 | 数据 |
|------|------|
| 工程师在工作中使用 AI 的比例 | **60%** |
| 可完全委派给 AI 的任务比例 | 仅 **0-20%** |

- 成熟的 Agent 能识别何时需要人类判断，并主动请求介入
- AI 审查 AI 生成的代码；人类聚焦高风险、新颖或战略性部分

### 趋势 5：Agentic Coding 扩展到新场景和新用户

> 📜 *"Agentic coding expands to new surfaces and users"*

- AI 支持遗留语言（COBOL、Fortran、领域特定语言）
- **民主化**：任何能定义问题的人都可以用 AI 编写解决方案
- 安全团队编写扫描规则、研究团队构建可视化、非技术人员处理数据
- Anthropic 自己的法务团队将合同审查周转时间从 **2-3 天缩短到 24 小时**

### 趋势 6：生产力增益重塑软件开发

> 📜 *"Productivity gains reshape software development"*

- 不仅是更快——更多功能发布、更多 bug 修复、更多实验运行
- 以前不可行的项目（周级→天级）变得可行
- 微小的"体验痛点"现在因成本降低而被系统性修复
- 约 **27%** 的 AI 辅助工作涉及**"以前想做但没时间做"的任务**

**📜 TELUS 案例**：

| 指标 | 数据 |
|------|------|
| 创建定制 AI 解决方案数 | **13,000+** |
| 工程代码发布速度提升 | **30%** |
| 累计节省时间 | **500,000+ 小时** |

### 四大组织优先级建议

1. 掌握多 Agent 协调
2. 建立人-AI 监督循环（AI 自动审查；人类聚焦战略决策）
3. 将 Agentic Coding 扩展到工程以外的非技术部门
4. 从设计阶段就嵌入安全架构

---

## 六、Claude Code Agent Teams

**Anthropic | 2026.02 | [官方文档](https://code.claude.com/docs/en/agent-teams) · 实验特性**

### 核心定位

Claude Code 内置的**多智能体协作系统**，让多个 Claude Code 实例组成团队，自主协调完成复杂任务。

### 架构设计

四大组件构成分层多 Agent 架构：

| 组件 | 角色 | 说明 |
|------|------|------|
| **Team Lead** | 队长 | 主 Claude Code 会话，创建团队、分发任务、协调工作 |
| **Teammates** | 队员 | 独立的 Claude Code 实例，各自领取并完成任务 |
| **Task List** | 共享任务列表 | 带依赖关系的工作项，队员自主认领 |
| **Mailbox** | 邮箱系统 | Agent 间直接通信的消息机制 |

**📜 与 Subagent 的关键区别**（原文）：

> *Agent Teams: "Own context window; fully independent" / "Teammates message each other directly" / "Shared task list with self-coordination" / "Complex work requiring discussion and collaboration"*
>
> *Subagents: "Own context window; results return to caller" / "Report results back to main agent only" / "Main agent manages all work" / "Focused tasks where only result matters"*

### 任务分解与并行执行

- 自然语言请求触发团队创建
- Team Lead 将工作分解为共享任务列表，包含依赖关系
- 任务状态流转：`pending` → `in_progress` → `completed`
- 有未解决依赖的 pending 任务不可被认领
- 两种认领方式：Team Lead 分配，或 Teammates 自主认领
- **文件锁**防止竞态条件

### 最佳实践

**团队规模**：

> 📜 *"Start with 3-5 teammates for most workflows. This balances parallel work with manageable coordination. Having 5-6 tasks per teammate keeps everyone productive without excessive context switching."*
>
> 📜 *"If 15 independent tasks exist, 3 teammates is good starting point. Scale up only when work genuinely benefits from simultaneous teammate work. Three focused teammates often outperform five scattered ones."*

**最适合的任务类型**：

> 📜 *"Most effective for: Research and review: Multiple teammates investigate different aspects simultaneously, then share and challenge findings. New modules or features: Teammates each own separate pieces without stepping on each other. Debugging with competing hypotheses: Teammates test different theories in parallel and converge faster. Cross-layer coordination: Changes spanning frontend, backend, and tests, each owned by different teammate."*

### 竞争性调试模式

> 📜 *"Spawn 5 agent teammates to investigate different hypotheses. Have them talk to each other to try to disprove each other's theories, like a scientific debate. Update the findings doc with whatever consensus emerges."*
>
> 📜 *"Debate structure fights anchoring bias. Sequential investigation becomes biased toward first explored theory; multiple independent investigators actively disproving each other produces more reliable root cause identification."*

### 质量门禁

| 钩子 | 触发时机 | 机制 |
|------|---------|------|
| **TeammateIdle** | 队员即将空闲 | 退出码 2 = 发送反馈并继续工作 |
| **TaskCompleted** | 任务标记完成 | 退出码 2 = 阻止完成并发送反馈 |

### 计划审批机制

> 📜 *"Teammate works in read-only plan mode. Sends plan approval request to lead when finished. Lead reviews and approves or rejects with feedback. If rejected, teammate revises and resubmits. Once approved, teammate exits plan mode and implements."*

### 通信机制

- `message`：发送给指定队员
- `broadcast`：发送给所有队员（成本随团队规模线性增长）
- 自动消息投递和空闲通知
- 每个队员加载相同项目上下文（CLAUDE.md, MCP, Skills），但**不继承** Team Lead 的对话历史

### 现有限制

- 不支持进程内队员的会话恢复
- 每个会话只能有一个团队
- 不支持嵌套团队
- Team Lead 终身固定
- Token 消耗随活跃队员数线性增长

### 实际案例

| 案例 | 规模 | 成果 |
|------|------|------|
| Linux 内核 C 编译器 | 16 个 Claude Agent 并行 | 用 Rust 从零构建 C 编译器 |
| 视觉设计项目 | 多 Agent 协作 | 3 个月工作压缩到 1 周 |
| 工业级场景 | 30+ Agent 同时协调 | 生产环境部署 |

---

## 七、OpenAI Codex CLI

**OpenAI | 2026.02→持续更新 | [GitHub](https://github.com/openai/codex) · Apache 2.0 · 581 个发布版本 · 389 位贡献者**

### 核心定位

> 📜 *"Codex CLI is a coding agent from OpenAI that runs locally on your computer."*

**Rust 重写**的本地 AI 编码 Agent，主打**多级沙箱隔离 + MCP 2.0 生态 + 跨平台原生支持**。

### Rust 重写架构

从 TypeScript/Node.js 完全重写为 Rust（代码占比 **96.1%**），核心驱动力四点：

| 驱动力 | 说明 |
|--------|------|
| **零依赖安装** | 消除 Node.js v22+ 的安装门槛 |
| **沙箱隔离** | macOS: Apple Seatbelt; Linux: Landlock; Windows: 原生沙箱 |
| **性能** | 无 GC、更低内存占用 |
| **MCP 原生支持** | Rust 原生 MCP 实现，可同时作为 MCP 客户端和服务端 |

Rust 工作区精细拆分（原文）：

> 📜 *"Split codex-common into focused codex-utils-* crates to simplify dependency boundaries across Rust workspace components."*
>
> 📜 *"refactor: decouple shell-escalation from codex-core"*

关键 crate：`codex-core`、`codex-config`、`codex-command`、`codex-utils-*`、`shell-escalation`

### 多级沙箱隔离

**三平台原生沙箱**——业界最完善的 Agent 安全隔离方案：

**macOS**：Apple Seatbelt (`sandbox-exec`)

**Linux**：
> 📜 *"feat(core): promote Linux bubblewrap sandbox to Experimental"*
>
> 📜 *"feat(linux-sandbox): implement proxy-only egress via TCP-UDS-TCP bridge"*
>
> 📜 *"fix(linux-sandbox): block io_uring syscalls in no-network seccomp policy"*

**Windows**：
> 📜 *"The Codex app runs natively on Windows using PowerShell and a native Windows sandbox for bounded permissions, so you can use Codex on Windows without moving your workflow into WSL, onto a virtual machine, or by deactivating the sandbox."*

**安全细节**：
> 📜 *"don't grant sandbox read access to ~/.ssh and a few other dirs"*

### 三种审批模式

| 模式 | 行为 |
|------|------|
| **Auto（默认）** | 工作目录内的文件读写/执行自动通过；超出范围或网络访问需审批 |
| **Read-only** | 咨询式——可浏览文件但不修改 |
| **Full Access** | 全权限，包括网络访问 |

### MCP 2.0 集成

> 📜 *"Added a plugin system that can load skills, MCP entries, and app connectors from config or a local marketplace, with an install endpoint for enabling plugins from the app server."*
>
> 📜 *"Required MCP servers now fail fast during start/resume flows instead of continuing in a broken state."*
>
> 📜 *"Process-group cleanup for stdio MCP servers to prevent orphan process storms"*

### 模型支持

**GPT-5.4（最新）**：
> 📜 *"GPT-5.4 is now available in Codex as OpenAI's most capable and efficient frontier model for professional work. It combines recent advances in reasoning, coding, and agentic workflows in one model."*
>
> 📜 *"In Codex, GPT-5.4 is the first general-purpose model with native computer-use capabilities."*
>
> 📜 *"GPT-5.4 in Codex includes experimental support for the 1M context window."*

**GPT-5.3-Codex-Spark**：
> 📜 *"Codex-Spark is optimized to feel near-instant, delivering more than 1000 tokens per second while remaining highly capable for real-world coding tasks."*
>
> 📜 *"At launch, Codex-Spark is text-only with a 128k context window."*

### 多 Agent 能力

> 📜 *"Agent jobs (spawn_agents_on_csv) + progress UI"*
>
> 📜 *"Made sub-agents faster and more reliable by reusing shell state correctly"*
>
> 📜 *"feat: add customizable roles for multi-agents"*

### 其他特性

- **语音输入**：长按空格键录音转文字
- **记忆系统**：SQLite 存储，支持遗忘和巩固
- **快速模式**：默认开启，优化响应速度
- **跨平台**：macOS (arm64/x86_64) + Linux (x86_64/arm64) + Windows 原生

---

## 八、Droid (Factory AI)

**Factory AI | 2026.02 | [官方博客](https://factory.ai/news/terminal-bench) · [Terminal-Bench 排行榜](https://tbench.ai)**

### 核心定位

"Agent 设计比模型选择更重要"——Droid 用同一个 Agent 框架搭配不同模型，在 Terminal-Bench 上始终领先。

> 📜 *"Agent design, not just choice of model, is the decisive factor as we achieve leading performance on every model."*
>
> 📜 *"Although models ultimately drive agentic capabilities, we find that the right agent framework can lead to greater improvements than model selection."*

### Terminal-Bench 2.0 成绩

| 排名 | Agent | 模型 | 准确率 |
|------|-------|------|--------|
| 1 | Forge Code | Gemini 3.1 Pro | **78.4%** ± 1.8 |
| **2** | **Droid** | **GPT-5.3-Codex** | **77.3%** ± 2.2 |
| 3 | Simple Codex | GPT-5.3-Codex | 75.1% ± 2.4 |
| 10 | Droid | Claude Opus 4.6 | 69.9% ± 2.5 |

**关键对比**（Terminal-Bench 1.0）：
- Droid + Sonnet **超过**所有其他 Agent + Opus 的组合
- Droid + Opus (58.8%) 和 Droid + Sonnet (50.5%) 均超过 Claude Code + Opus (43.2%)
- Droid + GPT-5 (52.5%) 超过 Codex CLI (42.8%)

### Agent 架构三大设计要素

**1. 分层提示策略 (Hierarchical Prompting)**

三层层次结构：**工具描述** → **系统提示** → **系统通知**

- 解决模型的"近因偏差"（recency bias）——模型倾向于优先处理最近的上下文而忽略系统级指令
- System Notifications 被描述为"特别关键"

**2. 模型特化架构 (Model-Specific Architectures)**

> 📜 *"A modular architecture sharing core components while allowing model-specific adaptations."*

- 不同模型对文件编辑格式有偏好（FIND_AND_REPLACE vs. V4A diff 格式）
- 路径处理差异（相对路径 vs. 绝对路径）

**3. 极简工具设计 (Minimalist Tool Design)**

> 📜 *"Strictly limiting the tool repertoire to essential operations"*
>
> 📜 *"Simplifying input schemas to reduce ambiguity."*
>
> 📜 *"By reducing individual tool call error rates, we observed multiplicative gains in full-task completion rates."*

核心洞见：单个工具调用错误率的降低会在完整任务完成率上产生**乘法效应**。

### 其他技术细节

- 每次新会话启动时注入广泛的系统信息（bootstrapping）
- 使用规划工具创建和更新简洁计划
- 支持**受控后台执行原语**——服务可以超过 Droid 进程生命周期
- 使用 ripgrep 替代原生 grep 提升搜索速度
- 精调默认工具超时时间，以短超时为默认值来**快速失败**

### 集成方式

5 种接入方式：终端/IDE、Web 浏览器、CLI、Slack/Teams、项目管理器

> 📜 *"Interface and vendor agnostic"* — 兼容任意模型供应商和开发工具链

---

## 九、GitHub Copilot Agent Mode

**GitHub | 2026.01→持续更新 | [GitHub Copilot CLI](https://github.com/github/copilot-cli) · 版本 v0.0.409**

### 核心定位

> 📜 *"Powered by the same agentic harness as GitHub's Copilot coding agent, it provides intelligent assistance while staying deeply integrated with your GitHub workflow."*

深度集成 GitHub 生态的 AI 编码 Agent，主打 **/fleet 并行多 Agent + 持久记忆 + 后台自主任务**。

### /fleet 并行多 Agent

> 📜 *"Copilot CLI supports subagents and multi‑agent workflows. With /fleet, you can run the same task across multiple subagents in parallel and converge on one decision‑ready result, with full control over what's applied."*
>
> 📜 *"USE ANY /MODEL, PARALLELIZE WITH /FLEET — Use /model to switch, then /fleet to execute in parallel or run multiple models at once."*

可同时使用不同模型（如 Claude + GPT）并行探索同一任务的不同解法，然后汇聚为一个决策。

### 持久记忆与上下文压缩

> 📜 *"/RESUME WHERE YOU LEFT OFF — Return to long-running work and keep moving. Memory and compaction keep sessions from collapsing under their own history."*
>
> 📜 *"Copilot CLI maintains session persistence within and across sessions, allowing you to build on previous conversations and maintain context throughout your development workflow."*

**Copilot Memory（Pro/Pro+ 用户）**：

> 📜 *"If you have a Copilot Pro or Copilot Pro+ plan, you can enable Copilot Memory. This allows Copilot to store useful details it has worked out for itself about a repository."*

### 自主执行模式

> 📜 *"Shift+Tab into plan mode to outline the work, use /model to compare approaches, and then Shift+Tab into autopilot mode when you want Copilot to carry the task forward without step-by-step approval."*

三种模式切换：Plan Mode → Manual → **Autopilot Mode**（全自主）

### Coding Agent（后台任务）

> 📜 *"With Copilot coding agent, GitHub Copilot can work independently in the background to complete tasks, just like a human developer."*
>
> 📜 *"While working on a coding task, Copilot coding agent has access to its own ephemeral development environment, powered by GitHub Actions, where it can explore your code, make changes, execute automated tests and linters and more."*

### 自定义 Agent 和技能

> 📜 *"SHAPE BEHAVIOR WITH /AGENT AND /SKILLS — Use AGENTS.md and Agent Skills to define custom instructions and tool access, so behavior stays consistent across models, sessions, and delegated work."*

### MCP 集成

> 📜 *"Built on GitHub's native /mcp integration, Copilot can search issues, analyze labels and activity, and summarize scope so you can move from backlog to implementation without context hunting."*

### 支持模型

> 📜 *"By default, copilot utilizes Claude Sonnet 4.5. Run the /model slash command to choose from other available models, including Claude Sonnet 4 and GPT-5."*
>
> 📜 *"Copilot CLI supports models from multiple foundation model providers, such as Anthropic, Google, and OpenAI."*

### 关键命令

| 命令 | 功能 |
|------|------|
| `/fleet` | 多 Agent 并行执行 |
| `/model` | 切换 AI 模型 |
| `/plan` | 规划模式，对比方案 |
| `/resume` | 恢复长时运行会话 |
| `/agent` | 自定义 Agent 行为 |
| `/diff` | 审查变更 |
| `/mcp` | MCP 工具集成 |

### 定价

> 📜 *"Included in Copilot Free, Pro, Pro+, Business, and Enterprise subscriptions."*

---

## 十、Gemini CLI

**Google | 2025.06→持续更新 | [GitHub](https://github.com/google-gemini/gemini-cli) · Apache 2.0**

### 核心定位

> 📜 *"Gemini CLI is an open-source AI agent that brings the power of Gemini directly into your terminal. It provides lightweight access to Gemini, giving you the most direct path from your prompt to our model."*

Google 的**完全开源**终端 AI Agent，主打 **1M 上下文 + 多模态 + MCP 扩展 + 免费慷慨额度**。

### 关键特性

**1M Token 上下文**：

> 📜 *"Access to improved reasoning and 1M token context window"*
>
> 📜 *"Gemini 3 models with 1M token context window"*

**多模态能力**：

> 📜 *"Generate new apps from PDFs, images, or sketches using multimodal capabilities"*
>
> 📜 *"Ground your queries with built-in Google Search for real-time information"*

**MCP 扩展**：

> 📜 *"Extensible: MCP (Model Context Protocol) support for custom integrations"*
>
> 📜 *"Use MCP servers to connect new capabilities, including media generation with Imagen, Veo or Lyria"*

**会话管理**：

> 📜 *"Conversation checkpointing to save and resume complex sessions"*
>
> 📜 *"Custom context files (GEMINI.md) to tailor behavior for your projects"*

**安全沙箱**：

> 📜 *"Sandboxing & Security: Safe execution environments"*
>
> 📜 *"Trusted Folders: Control execution policies by folder"*

### GitHub Actions 集成

> 📜 *"Pull Request Reviews: Automated code review with contextual feedback and suggestions"*
>
> 📜 *"Issue Triage: Automated labeling and prioritization of GitHub issues based on content analysis"*
>
> 📜 *"On-demand Assistance: Mention @gemini-cli in issues and pull requests for help"*

### 自动化

> 📜 *"Run non-interactively in scripts for workflow automation"*

支持 headless JSON 输出：`gemini -p "Explain the architecture" --output-format json`

### 免费额度

| 指标 | 数值 |
|------|------|
| 请求频率 | 60 次/分钟 |
| 每日上限 | **1,000 次/天** |
| 认证方式 | Google 账号登录，无需 API Key |
| 模型 | Gemini 3 (Flash + Pro 混合) |

### 企业支持

> 📜 Vertex AI: *"Enterprise teams and production workloads"* with *"Advanced security and compliance"*

---

## 十一、Amazon Q Developer Agent

**AWS | 持续更新 | [官方页面](https://aws.amazon.com/q/developer/)**

### 核心定位

> 📜 *"The most capable generative AI–powered assistant for software development"*

深度集成 AWS 生态的 AI 编码助手，以 **5 大 Agent 命令**覆盖完整开发流程。

### Agentic 能力

> 📜 *"Amazon Q Developer agentic capabilities can autonomously perform a range of tasks–everything from implementing features, documenting, testing, reviewing, and refactoring code, to performing software upgrades."*
>
> 📜 *"The agentic coding experience can intelligently perform tasks on your behalf by automatically reading and writing files, generating code diffs, and running shell commands, while incorporating your feedback and providing real-time updates along the way."*

### 五大 Agent 命令

| 命令 | 功能 | 支持语言/框架 |
|------|------|-------------|
| `/dev` | 代码生成 | Java, Python, JS, TypeScript |
| `/test` | 单元测试生成 | JUnit, Pytest 等 |
| `/review` | 安全与代码质量扫描 | 多语言 |
| `/doc` | 文档生成 | — |
| `/transform` | 代码升级迁移 | .NET→Linux, Java 版本升级 |

### 评测与安全

> 📜 *"Amazon Q Developer agentic capabilities have achieved the highest scores on the SWE-Bench Leaderboard and Leaderboard Lite."*
>
> 📜 *"The highest reported code acceptance rate among assistants that perform multiline code suggestions."*
>
> 📜 *"Amazon Q Developer security scanning outperforms leading publicly benchmarkable tools on detection across most popular programming languages."*

### 企业级特性

**AWS IAM 集成**：

> 📜 *"Amazon Q provides familiar security and access controls and can understand and respect your existing AWS IAM Identity Center governance identities, roles, and permissions to personalize its interactions."*

**数据隐私**：

> 📜 *"YOUR CONTENT IS YOURS — When you use Amazon Q Developer Pro, your proprietary content is not used for service improvement."*

**私有仓库定制**：

> 📜 *"Securely connect Amazon Q Developer to your private repositories to generate even more relevant code recommendations, ask questions about your company code, and understand your internal code bases faster."*

### 多平台支持

JetBrains · IntelliJ IDEA · Visual Studio · VS Code · Eclipse (preview) · CLI · AWS Console · Mobile App (iOS/Android) · GitLab Duo · GitHub (preview) · Teams · Slack

### 定价

> 📜 *"The Amazon Q Developer perpetual Free Tier gives you 50 agentic chat interactions per month."*

---

## 十二、OpenCode

**SST/Anomaly 开源社区 | 持续更新 | [GitHub](https://github.com/anomalyco/opencode) · [官网](https://opencode.ai) · MIT**

### 核心数据

| 指标 | 数值 |
|------|------|
| GitHub Stars | **118K** |
| 贡献者 | 797 |
| 总发布版本 | 730 (最新 v1.2.20) |
| 月活开发者 | **250 万+** |
| 许可证 | MIT |
| 主要语言 | TypeScript 53.4%, MDX 42.3% |

### 核心定位

> 📜 *"The open source AI coding agent."*

最大规模开源 AI 编码 Agent 社区项目，主打 **Plan/Build 双 Agent 架构 + 75+ 模型供应商 + 客户端/服务器分离**。

### Plan/Build 双 Agent 架构

**Build Agent（默认主 Agent）**：

> 📜 *"Build is the default primary agent with all tools enabled. This is the standard agent for development work where you need full access to file operations and system commands."*

**Plan Agent（受限分析 Agent）**：

> 📜 *"A restricted agent designed for planning and analysis. We use a permission system to give you more control and prevent unintended changes."*
>
> 📜 *"This agent is useful when you want the LLM to analyze code, suggest changes, or create plans without making any actual modifications to your codebase."*

Plan Agent 默认拒绝文件编辑，执行 bash 命令前需确认。

**子 Agent**：

| 子 Agent | 能力 | 说明 |
|----------|------|------|
| **General** | 全工具访问 | *"A general-purpose agent for researching complex questions and executing multi-step tasks. Use this to run multiple units of work in parallel."* |
| **Explore** | 只读 | *"A fast, read-only agent for exploring codebases. Cannot modify files."* |

### 权限模型

> 📜 *"You can configure permissions to manage what actions an agent can take. Currently, the permissions for the edit, bash, and webfetch tools can be configured to: 'ask' — Prompt for approval before running the tool; 'allow' — Allow all operations without approval; 'deny' — Disable the tool"*

### 核心差异化

> 📜 *"100% open source"*
>
> 📜 *"Not coupled to any provider"* — *"OpenCode can be used with Claude, OpenAI, Google, or even local models"*
>
> 📜 *"Out-of-the-box LSP support"*
>
> 📜 *"A focus on TUI"* — *"OpenCode is built by neovim users and the creators of terminal.shop"*
>
> 📜 *"A client/server architecture"* — *"This, for example, can allow OpenCode to run on your computer while you drive it remotely from a mobile app, meaning that the TUI frontend is just one of the possible clients"*

### 多平台支持

| 平台 | 状态 | 说明 |
|------|------|------|
| **TUI** | 主要 | 终端界面（核心体验） |
| **Desktop App** | Beta | macOS (Apple Silicon + Intel), Windows, Linux |
| **IDE** | 可用 | VSCode SDK 扩展 |
| **Mobile** | 可用 | 通过客户端/服务器架构远程控制 |

### 安装方式

```bash
curl -fsSL https://opencode.ai/install | bash
```

同时支持：npm, bun, pnpm, yarn, Homebrew, scoop, choco, pacman/paru (Arch), mise, nix

### 数据隐私

> 📜 *"OpenCode does not store any of your code or context data"*

---

## 十三、OpenHands

**All-Hands-AI | 持续更新 | [GitHub](https://github.com/All-Hands-AI/OpenHands) · MIT · ICLR 2025 Poster**

### 核心数据

| 指标 | 数值 |
|------|------|
| GitHub Stars | **68.7K** |
| 贡献者 | 188+ |
| 总 Commits | 6,208 |
| 最新版本 | v1.4.0 (2026.02.18) |
| 许可证 | MIT (核心), 专有 (企业版) |
| 论文 | arXiv: 2407.16741 |

### 核心定位

> 📜 *"We introduce OpenHands (f.k.a. OpenDevin), a platform for the development of powerful and flexible AI agents that interact with the world in similar ways to those of a human developer: by writing code, interacting with a command line, and browsing the web."*

### 事件驱动架构

5 大核心组件：

| 组件 | 角色 | 原文 |
|------|------|------|
| **LLM** | 模型交互 | *"brokers all interactions with large language models. Works with any underlying completion model, thanks to LiteLLM."* |
| **Agent** | 决策引擎 | *"responsible for looking at the current State, and producing an Action that moves one step closer toward the end-goal."* |
| **AgentController** | 状态管理 | *"initializes the Agent, manages State, and drive the main loop that pushes the Agent forward, step by step"* |
| **EventStream** | 通信中枢 | *"a central hub for Events, where any component can publish Events, or listen for Events published by other components"* |
| **Runtime / Sandbox** | 执行环境 | *"responsible for performing Actions, and sending back Observations"* |

> 📜 *"In reality, most of this is achieved through message passing, via the EventStream. The EventStream serves as the backbone for all communication in OpenHands."*

**Agent 主循环伪代码**：

```python
while True:
    prompt = agent.generate_prompt(state)
    response = llm.completion(prompt)
    action = agent.parse_response(response)
    observation = runtime.run(action)
    state = state.update(action, observation)
```

每个事件包含：`id`、`source`（AGENT/USER/ENVIRONMENT）、`timestamp`、`cause`（触发事件 ID，形成因果链）

### CodeAct Agent（默认 Agent）

> 📜 *"This agent implements the CodeAct idea that consolidates LLM agents' actions into a unified code action space for both simplicity and performance."*

每轮可选择两种行动：
1. **Converse** — *"Communicate with humans in natural language to ask for clarification, confirmation, etc."*
2. **CodeAct** — *"Choose to perform the task by executing code"*（任意有效的 Linux bash 命令或 Python 代码）

### Docker 沙箱

> 📜 *"Executing untrusted code can pose significant risks to the host system. A sandboxed environment prevents malicious code from accessing or modifying the host system's resources"*

客户端-服务器架构：

> 📜 *"OpenHands builds a new Docker image (the 'OH runtime image') based on the user-provided image. This new image includes OpenHands-specific code, primarily the 'runtime client'"*
>
> 📜 *"The OpenHands backend communicates with the action execution server over RESTful API, sending actions and receiving observations"*

三标签 Docker 镜像管理：Versioned Tag · Lock Tag · Source Tag（保证可复现性）

### 5 种产品形态

| 形态 | 说明 | 原文 |
|------|------|------|
| **SDK** | Python 库 | *"A composable Python library that contains all of our agentic tech"* |
| **CLI** | 命令行 | *"The experience will be familiar to anyone who has worked with e.g. Claude Code or Codex"* |
| **Local GUI** | 本地 UI | REST API + React 应用 |
| **Cloud** | 云服务 | Slack/Jira/Linear 集成, RBAC, 多用户 |
| **Enterprise** | 企业版 | VPC 内 Kubernetes 自托管 |

### OpenHands-LM（自研微调模型）

- 基座：**Qwen Coder 2.5 Instruct 32B**，通过 RL 微调
- SWE-Bench Verified: **37.2%** — 与 DeepSeek V3 (671B) 的 38.8% 相当
- 32B 参数达到 671B 模型的水平，体现了 RL 微调的巨大价值

---

## 十四、DeepSWE

**UC Berkeley Sky Computing Lab + Together AI | 2026 初 | [HuggingFace](https://huggingface.co/agentica-org/DeepSWE-Preview) · [rLLM 框架](https://github.com/agentica-project/rllm) · [博客](https://www.together.ai/blog/deepswe) · MIT**

### 核心定位

> 📜 *"DeepSWE-Preview is a fully open-sourced, state-of-the-art coding agent trained with only reinforcement learning (RL) to excel at software engineering (SWE) tasks."*

**纯 RL（无 SFT）训练的开源代码 Agent**，证明了 RL 可以从零训练出 SOTA 级别的 SWE Agent。

### 训练方法：GRPO++ 算法

> 📜 *"trained entirely from scratch atop Qwen/Qwen3-32B using only reinforcement learning"*
>
> 📜 *"Similar to GRPO+ in our DeepCoder work, we enhance the original GRPO algorithm, integrating insights from DAPO, Dr. GRPO, LOOP/RLOO, and our innovations to enable stable training and improved performance."*

**7 大组件**：

| # | 组件 | 来源 | 原文 |
|---|------|------|------|
| 1 | **Clip High** | DAPO | *"Increasing the upper bound of GRPO/PPO's surrogate loss encourages exploration and stabilizes entropy"* |
| 2 | **No KL Loss** | DAPO | *"Eliminating KL loss prevents the LLM from being constrained to the trust region of the original SFT model"* |
| 3 | **No Reward Std Dev** | Dr.GRPO | *"Removing reward standard deviation removes difficulty bias in GRPO's loss, ensuring hard and easy problems are better differentiated"* |
| 4 | **Length Normalization** | Dr.GRPO | *"Dividing surrogate loss by max context length removes length bias present in GRPO, which increases the length of incorrect responses"* |
| 5 | **Leave One Out** | LOOP/RLOO | *"Removing one sample for advantage estimation reduces variance for policy gradient without introducing bias"* |
| 6 | **Compact Filtering** | **Novel** | *"We mask the loss for trajectories that reach max context length, timeout during generation (20 minutes), or reach maximum steps"* |
| 7 | **No Entropy Loss** | **Novel** | *"Entropy loss introduces higher instability and eventually leads to exponentially increasing entropy, which collapses training"* |

**多轮扩展**：

> 📜 *"Extending GRPO to the multi-turn, or agent, setting involves masking out environment observations, or user messages in ChatML format, for each trajectory"*

### 奖励函数（稀疏 ORM）

| 奖励 | 条件 |
|------|------|
| **Reward = 1** | *"LLM's generated patch passes a selected sample of tests (Pass2Pass and Fail2Pass) within a time limit"*（训练 5 分钟 / 官方 30 分钟） |
| **Reward = 0** | *"LLM's code fails on at least one test case or times out"* |

### 训练硬件与数据

| 指标 | 数值 |
|------|------|
| 硬件 | **64× H100 GPU** |
| 训练时间 | **6 天** |
| 工作节点 | 每节点 200 CPU cores + 6TB NVMe SSD |
| 集群规模 | 可扩展到 1000+ CPU cores |
| 训练数据 | 4,500 个真实 SWE 任务（R2E-Gym） |
| 数据过滤 | 排除 SWE-Bench-Verified 重叠仓库（如 sympy） |
| 环境 | 每个问题映射到独立 Docker 镜像 |

### 动作空间（4 种工具）

| 工具 | 说明 |
|------|------|
| **Execute Bash** | *"Outputs both stdout and stderr of an LLM-generated bash command"* |
| **Search** | *"Searches and returns all occurrences of an LLM-defined query in either a directory or a single file"* |
| **File Editor** | *"Allows for viewing, creating, replacing strings, inserting, and undoing edits to a specific file"* |
| **Finish/Submit** | *"LLM has decided that it has resolved the pull request, which terminates trajectory generation"* |

### SWE-Bench Verified 成绩

| 模型 | 框架 | Pass@1 | Pass@16 | + TTS |
|------|------|--------|---------|-------|
| **DeepSWE (32B)** | R2E-Gym + Hybrid | **42.2%** | **71.0%** | **59.0%** |
| Devstral-Small (24B) | OpenHands | 46.6% | — | — |
| OpenHands-LM (32B) | OpenHands | 37.2% | — | — |
| SWE-Agent-LM (32B) | SWE-Agent | 40.2% | — | — |
| Skywork-SWE (32B) | OpenHands + TTS | 38.0% | — | 47.0% |

> 📜 *"With hybrid TTS, DeepSWE-Preview achieves 59%, beating the current SOTA open-weights model (SkyWork + TTS, 47%) by 12%"*

### 纯 RL vs. SFT 对比

> 📜 *"training with only reinforcement learning (RL) outperforms various prior approaches which leverage similar or more training data and distillation, or SFT, from stronger proprietary teacher models"*

SFT 尝试均失败：

> 📜 *"We have attempted RL on top of four SFT'ed models, Claude-Sonnet 3.7/4 with thinking/non-thinking trajectories on top of Qwen3-32B... For all attempts, the model performance did not improve after 100 iterations"*

**关键结论**：SFT 作为 RL 的预热不仅无益，反而可能有害。纯 RL 直接在基座模型上训练效果更好。

### 训练效率

> 📜 *"With just 200 steps of RL training, SWE-Bench-Verified score increases from 23→42% (+20%) for Pass@1"*

仅 200 步 RL 就能让 Pass@1 从 23% 翻到 42%，效率惊人。

### 测试时扩展 (TTS)

> 📜 *"Performance scales for DeepSWE-Preview and other baselines. However, the performance increase beyond 32K context is marginal (≤2%)"*
>
> 📜 *"For SWE-related tasks, scaling the number of output tokens does not seem to be effective"*

Rollout 扩展：K=16 → 59.0%, K=8 → 57.9%

> 📜 *"For most practical scenarios, a majority of TTS's performance gains can be achieved with K=8"*

### 涌现行为

> 📜 *"Surprisingly, we find that during the course of RL run, the agent learns to automatically think through the edge cases (different inputs, data types etc) when trying to fix the bug. Furthermore, the agent seems to always try to find the relevant tests in the current repository to ensure that the proposed changes don't break existing regression tests"*

> 📜 *"The model learns to allocate a large number of thinking tokens while trying to localize and think of how to fix the bug (often using ~2K tokens for thinking at a single step). However, for other steps such as moving through a file or searching for a term in the codebase, it uses very few thinking tokens (~100-200)"*

模型自主学会了**动态分配思考 token**：Bug 定位时用 ~2K tokens 深度思考，文件浏览时仅用 ~100-200 tokens。

### 完全开源

> 📜 *"To accelerate community progress, we are open-sourcing everything: the dataset, our training code & recipe, and evaluation logs"*

公开内容：模型权重 · 训练代码 · 训练日志 (WandB) · 评测日志 (16 passes) · 数据集

---

## 十五、mini-SWE-agent 2.0

**Princeton + Stanford | 2026.02 | [GitHub](https://github.com/SWE-agent/SWE-agent) · [SWE-bench 排行榜](https://www.swebench.com/) · v2.2.6**

### 核心定位

> 📜 *"Just some 100 lines of python for the agent class (and a bit more for the environment, model, and run script) — no fancy dependencies!"*

用**约 100 行 Python** 实现的极简 SWE Agent，同时也是 SWE-bench Verified 的**统一评测 harness**。

### 设计哲学

> 📜 *"SWE-agent jump-started the development of AI agents in 2024. Back then, we placed a lot of emphasis on tools and special interfaces for the agent. However, one year later, as LMs have become more capable, a lot of this is not needed at all to build a useful agent!"*

**从 SWE-agent 到 mini-SWE-agent 的范式转变**：

> 📜 *"Most of our current development effort is on mini-swe-agent, which has superseded SWE-agent. It matches the performance of SWE-agent, while being much simpler."*
>
> 📜 *"Our general recommendation is to use mini-SWE-agent instead of SWE-agent going forward."*

### 架构：Bash-Only + 线性历史

**只用 Bash，不需要工具调用接口**：

> 📜 *"Does not have any tools other than bash — it doesn't even need to use the tool-calling interface of the LMs. This means that you can run it with literally any model."*

**完全线性的历史记录**：

> 📜 *"Has a completely linear history — every step of the agent just appends to the messages and that's it. So there's no difference between the trajectory and the messages that you pass on to the LM."*

**独立动作执行**：

> 📜 *"Executes actions with subprocess.run — every action is completely independent (as opposed to keeping a stateful shell session running)."*

### 工具哲学

> 📜 *"Instead of implementing custom tools for every specific thing the agent might want to do, the focus is fully on the LM utilizing the shell to its full potential."*
>
> 📜 *"Want it to do something specific like opening a PR? Just tell the LM to figure it out rather than spending time to implement it in the agent."*

**核心洞见**：随着 LLM 能力增强，精心设计的工具接口价值递减，不如直接让模型用 shell。

### 统一评测 harness

> 📜 *"Verified is a human-filtered subset of 500 instances. We use mini-SWE-agent to evaluate all models with the same harness."*

SWE-bench Verified 排行榜现在统一使用 mini-SWE-agent 2.0 作为评测框架，确保所有模型在相同条件下对比。

### SWE-bench Verified 排行榜（2026.02, mini-SWE-agent v2 harness）

| 模型 | 推理模式 | 解决率 | 平均成本 |
|------|---------|--------|---------|
| Claude 4.5 Opus | high reasoning | **76.8%** | $0.75 |
| Gemini 3 Flash | high reasoning | **75.8%** | $0.36 |
| MiniMax M2.5 | high reasoning | **75.8%** | **$0.07** |
| Claude Opus 4.6 | standard | 75.6% | $0.55 |
| GPT-5.2 Codex | standard | 72.8% | $0.45 |
| GLM-5 | high reasoning | 72.8% | $0.53 |

> 📜 *"Gemini 3 Pro reaches 74% on SWE-bench verified with mini-swe-agent!"*

### 模型兼容性

> 📜 *"Supports all models via litellm, openrouter, portkey, and more"*
>
> 📜 *"Support for /completion and /response endpoints, interleaved thinking etc."*

### 行业采用

> 📜 *"Widely adopted: Used by Meta, NVIDIA, Essential AI, IBM, Nebius, Anyscale, Princeton University, Stanford University, and many more."*

---

## 十六、Agentless

**UIUC | 2024→2026 | [GitHub](https://github.com/OpenAutoCoder/Agentless) · arXiv: 2407.01489**

### 核心定位

> 📜 *"Agentless is an agentless approach to automatically solve software development problems."*

**故意不用 Agent 的代码修复方法**——用简单的三阶段流水线替代复杂的自主 Agent。

### 研究动机

> 📜 *"Recent advancements in large language models (LLMs) have significantly advanced the automation of software development tasks... However, the complexity of these agent-based approaches, together with the limited abilities of current LLMs, raises the following question: Do we really have to employ complex autonomous software agents?"*

### 三阶段流水线

```
Issue → [定位] → [修复] → [验证] → Patch
```

**Phase 1 — 定位 (Localization)**：

> 📜 *"Agentless employs a hierarchical process to first localize the fault to specific files, then to relevant classes or functions, and finally to fine-grained edit locations"*

层次化定位：文件级 → 类/函数级 → 精确编辑位置

**Phase 2 — 修复 (Repair)**：

> 📜 *"Agentless takes the edit locations and samples multiple candidate patches per bug in a simple diff format"*

在定位到的位置采样多个候选补丁（简单 diff 格式）

**Phase 3 — 验证 (Patch Validation)**：

> 📜 *"Agentless selects the regression tests to run and generates additional reproduction test to reproduce the original error. Using the test results, Agentless re-ranks all remaining patches to selects one to submit"*

生成复现测试 → 运行回归测试 → 重新排序补丁 → 选择最优提交

### 与 Agent 方法的关键区别

> 📜 *"Compared to the verbose and complex setup of agent-based approaches, Agentless employs a simplistic three-phase process of localization, repair, and patch validation, without letting the LLM decide future actions or operate with complex tools."*

| 特征 | Agentless | Agent 方法 |
|------|-----------|-----------|
| LLM 决策权 | **无** — LLM 仅在预定义阶段内工作 | 全自主决策下一步行动 |
| 工具使用 | **无** — 直接生成 diff | 文件编辑、Shell、搜索等多种工具 |
| 交互轮次 | **固定** — 三阶段流水线 | 动态——可能数十轮 |
| 可解释性 | **高** — 每步可审计 | 低——Agent 轨迹复杂 |
| 成本 | **极低** — 少量 LLM 调用 | 高——大量工具调用和推理 |

### 评测成绩

| 版本 | 评测 | 成绩 | 成本/Issue |
|------|------|------|-----------|
| v1.0 (GPT-4o) | SWE-bench Lite | 27.3% (82 fixes) | **$0.34** |
| v1.0 (GPT-4o) | SWE-bench Lite | 32.0% (96 fixes) | $0.70 |
| + Claude 3.5 Sonnet | SWE-bench Lite | **40.7%** | — |
| + Claude 3.5 Sonnet | SWE-bench Verified | **50.8%** | — |

> 📜 *"Agentless is able to achieve both the highest performance (32.00%, 96 correct fixes) and low cost ($0.70) compared with all existing open-source software agents!"*

### 研究意义

> 📜 *"Our work highlights the current overlooked potential of a simple, interpretable technique in autonomous software development. We hope Agentless will help reset the baseline, starting point, and horizon for autonomous software agents, and inspire future work along this crucial direction."*

**核心洞见**：Agentless 作为"反 Agent"基线，证明了简单、可解释的方法仍有巨大潜力。在投入复杂 Agent 架构之前，这个基线值得认真审视。

### 基准改进贡献

> 📜 *"We manually classified the problems in SWE-bench Lite and found problems with exact ground truth patch or insufficient/misleading issue descriptions. As such, we construct SWE-bench Lite-S by excluding such problematic issues to perform more rigorous evaluation and comparison."*

提出了 SWE-bench Lite-S（排除有问题的评测实例），推动了更严格的评测标准。

---

## 十七、技术趋势与竞争格局

### 趋势一：多 Agent 协作成为标配

2026 年初，几乎所有主流 Agent 产品都引入了多 Agent 能力：

| 产品 | 多 Agent 实现 | 特色 |
|------|-------------|------|
| Claude Code Agent Teams | Team Lead + Teammates + Mailbox | 最完整的多 Agent 协作框架 |
| Copilot Agent Mode | /fleet 并行 + 多模型 | 可跨供应商并行 |
| Codex CLI | spawn_agents + 可定制角色 | 多 Agent + 沙箱隔离 |
| OpenCode | General + Explore 子 Agent | Plan/Build 分层 |
| OpenHands | 事件驱动子 Agent | 最灵活的架构 |

**竞争焦点**：从"能否多 Agent"转向"多 Agent 的协调质量"——任务分解、依赖管理、冲突解决。

### 趋势二：Agent 训练方法论的突破

DeepSWE 证明了纯 RL 训练 Agent 的可行性，这是方法论上的重大转变：

| 方法 | 代表 | 核心思路 | SWE-bench |
|------|------|---------|-----------|
| **纯 RL** | DeepSWE | 无需 SFT，直接从基座 RL 训练 | **59.0%** (TTS) |
| **RL 微调** | OpenHands-LM | SFT 后 RL 微调 | 37.2% |
| **SFT 蒸馏** | SWE-Agent-LM | 从强模型蒸馏轨迹 | 40.2% |
| **无训练** | Agentless | 直接用现成 LLM + 流水线 | 50.8% |

**关键发现**：
- DeepSWE 尝试在 SFT 模型上继续 RL，100 步后仍无改善 → SFT 可能干扰 RL 探索
- 仅 200 步 RL 就能让 Pass@1 从 23% 到 42%（+19%）
- 模型自主学会动态分配思考资源

### 趋势三：极简主义的回归

mini-SWE-agent 2.0 和 Agentless 代表了一种"反复杂化"运动：

> 从 SWE-agent（精心设计的工具接口）→ mini-SWE-agent（只用 bash，100 行 Python）

> 从 Agent（自主决策多轮交互）→ Agentless（固定三阶段流水线）

**核心洞见**：随着 LLM 能力增强，Agent 框架的复杂度应该**降低而非增加**。精心设计的工具接口在 2024 年很有价值，在 2026 年已不再必要。

Droid 的极简工具设计也呼应这一趋势——"reducing individual tool call error rates → multiplicative gains in full-task completion"。

### 趋势四：Agent-Native 基础设施成形

| 基础设施层 | 2024 | 2026 |
|-----------|------|------|
| **沙箱** | Docker 手工配置 | Seatbelt/Landlock/bubblewrap 原生集成 |
| **通信协议** | 自定义 API | MCP 2.0 标准化 |
| **评测** | 各自评测 harness | mini-SWE-agent 统一 harness |
| **部署** | 开发者本地 | GitHub Actions 后台 / Kubernetes 集群 |
| **记忆** | 无 | SQLite 持久化 / 跨会话记忆 |

### 竞争格局总览

```
                    闭源 ←————————————→ 开源
                    
    Agent Teams ●                              ● OpenHands
    Copilot     ●                         ● OpenCode
    Codex CLI   ●──────────────────────●  (Apache 2.0)
    Droid       ●                 ● DeepSWE (MIT)
    Amazon Q    ●            ● Gemini CLI (Apache 2.0)
    
              ↑
        商业产品                    研究/框架
              ↓
    
    ● mini-SWE-agent ● Agentless
              评测与方法论
```

---

## 十八、选型建议

### 按场景推荐

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| **追求极致 SWE-bench 成绩** | Claude Code Agent Teams (Opus 4.6) | 76.8% (high reasoning), 多 Agent 协作 |
| **终端/系统级任务** | Droid + GPT-5.3-Codex | Terminal-Bench 77.3%，Agent 架构设计领先 |
| **GitHub 深度集成** | Copilot Agent Mode | 原生 GitHub Actions 后台任务，/fleet 多 Agent |
| **Google 生态 / 免费额度** | Gemini CLI | Apache 2.0 开源，1000 次/天免费 |
| **AWS 企业部署** | Amazon Q Developer Agent | IAM 集成，数据隐私保障，多 IDE 支持 |
| **完全开源自主可控** | OpenCode + OpenHands | 118K + 68.7K Star，MIT 许可 |
| **Agent 训练研究** | DeepSWE + rLLM | 纯 RL 训练全开源，方法论突破 |
| **标准化评测** | mini-SWE-agent 2.0 | SWE-bench 官方统一 harness |
| **低成本批量修复** | Agentless | $0.34/issue，无需 Agent 架构 |
| **多模型灵活切换** | OpenCode / Copilot CLI | 75+ 供应商 / 多模型 /fleet 并行 |
| **本地部署极致安全** | Codex CLI | 三平台原生沙箱 + Apache 2.0 |

### 按团队规模推荐

| 团队 | 推荐组合 | 月成本估算 |
|------|---------|-----------|
| **个人开发者** | Gemini CLI (免费) + OpenCode (开源) | $0 |
| **小团队 (5-10人)** | Copilot Pro ($10/人/月) + OpenCode | ~$50-100/月 |
| **中型团队 (10-50人)** | Copilot Business + Claude Code | 按需 |
| **大型企业** | Amazon Q Enterprise / Claude Code Enterprise | 定制定价 |

---

### 🔗 相关报告

- [Code LLMs 详细对比](./2026_Code_LLMs_Comparison.md) — 7 款代码大模型横向对比
- [Qwen3-Coder-Next 精读](./Qwen3_Coder_Next_Deep_Reading.md) — 80B/3B 模型完整技术方案
- [Agentic RL Reward Hacking 报告](./Agentic_RL_Reward_Hacking_Report.md) — RL 训练中的奖励黑客问题
- [2026 LLM Code 新工作全景](./2026_LLM_Code_New_Works.md) — 全方向 36 项新工作概览

---

*2026 年 Agentic Coding / SWE Agent 详细对比报告 | WorkBuddy 生成 | 2026.03.07*

