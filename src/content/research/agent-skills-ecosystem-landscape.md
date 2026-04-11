---
title: "AI Agent Skills 生态全景：从开放标准到万级市场的爆发式增长"
description: "全面调研 2026 年 AI Agent Skills 生态系统——覆盖 12+ 平台、50 万+ Skills、30+ 兼容工具，深入分析各平台的规模、分类、安全机制、商业模式与技术架构"
date: 2026-03-28
category: 专题研究
tags: ["Agent Skills", "SKILL.md", "MCP", "Claude Code", "Copilot", "Gemini CLI", "Marketplace", "开放标准", "生态系统"]
htmlVersion: "/research-html/agent-skills-ecosystem-landscape.html"
draft: false
---

## 研究背景

2025 年下半年，Anthropic 在推出 MCP（Model Context Protocol）之后，进一步提出了 **Agent Skills** 的概念——一种轻量级的、基于 Markdown 文件（`SKILL.md`）的 AI 代理能力扩展机制。与 MCP 侧重于"连接外部数据和工具"不同，Skills 侧重于"赋予代理领域专业知识和工作流程"。

短短几个月内，这一概念经历了从单一产品功能到**行业开放标准**的蜕变，催生了一个由数十个平台、数十万个 Skills、数千名贡献者组成的庞大生态。本文对这一生态进行全面调研，从规模、分类、安全、商业模式等多个维度进行系统性分析。

---

## 一、开放标准：Agent Skills 的技术基石

### 1.1 SKILL.md 规范

Agent Skills 的核心是一个名为 `SKILL.md` 的 Markdown 文件，包含 YAML 前置元数据和自然语言指令：

```yaml
---
name: skill-name
description: 技能描述，帮助 Agent 决定何时使用
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Grep, Write
context: fork          # 可选：在子代理中运行
agent: Explore         # 可选：指定子代理类型
effort: medium         # 努力程度
paths: "src/**"        # 激活路径限制
---

# 指令内容
当用户请求 X 时，按以下步骤执行...
```

**核心设计原则**：
- **自然语言优先**：用 Markdown 而非代码定义能力
- **按需加载**：Agent 根据上下文自动选择合适的 Skill
- **渐进式披露**：从简单指令到脚本执行，复杂度可控
- **零依赖**：不需要安装运行时，一个文件即可运行

### 1.2 开放标准组织

[Agent Skills 开放标准](https://agentskills.io) 由 Anthropic 发起，已获得超过 **30+ AI 工具**的原生支持：

| 类别 | 工具 |
|------|------|
| **一线 IDE/CLI** | Claude Code, GitHub Copilot, Cursor, Codex CLI, Gemini CLI, Windsurf |
| **JetBrains 生态** | Junie (JetBrains) |
| **独立工具** | VS Code, Roocode, Ampcode, Kiro, OpenCode, Trae |
| **平台型** | GitHub, Databricks, Snowflake Cortex, Factory AI |
| **框架级** | Spring AI, Goose (Block), Letta, Laravel Boost |
| **其他** | AutoHand, Emdash, Piebald, Agentman, Mux, Firebender |

### 1.3 Skills vs MCP：互补而非替代

| 维度 | Agent Skills | MCP (Model Context Protocol) |
|------|-------------|------------------------------|
| **核心定位** | 领域知识 & 工作流 | 外部数据 & 工具连接 |
| **表现形式** | Markdown 文件（`SKILL.md`） | JSON-RPC 服务（Server/Client） |
| **加载方式** | 注入到 Agent 上下文窗口 | 工具调用（Tool Call） |
| **类比** | "教科书 / 操作手册" | "API 接口 / 数据管道" |
| **运行时依赖** | 无 | 需要 MCP Server 进程 |
| **典型场景** | 代码审查流程、TDD 方法论 | 数据库查询、文件系统操作 |
| **生态规模** | 50 万+（含各平台） | 1.9 万+（mcp.so 统计） |
| **关系** | 可在同一 Plugin 中共存，互补使用 |

---

## 二、生态全景：12+ 平台深度对比

### 2.1 规模概览

| 平台 | Skills 数量 | 贡献者 | 分类 | 安全机制 | 定位 |
|------|-----------|--------|------|---------|------|
| **SkillsMP** | 500,000+ | — | 多维分类 | — | 最大聚合市场 |
| **OpenClaw Registry** | 12,200+（含过滤前） | 2,917+ | 30 类 | 7,060 过滤 | 官方注册表 |
| **ClawSkills** | 5,147（精选） | 2,917 | 30 类 | 严格过滤 | 精选子集 |
| **ClawdHub** | 3,286+ | — | 多类 | 社区验证 | CLI 安装市场 |
| **Claudate** | 数千 | — | — | 一键安装 | Claude 专属市场 |
| **OpenAIToolsHub 排行** | 349（精选排名） | — | 12 类 | Stars + 文档质量 | 排名榜单 |
| **GetAgentSkills** | 数千（声称） | — | 3 大类 | 社区验证 | 综合市场 |
| **MCP.so** | 19,095（MCP Servers） | — | 3 层分类 | 官方认证 | MCP 专属目录 |
| **cursor.directory** | 数千 | 社区 | 按框架/语言 | — | Cursor Rules 库 |
| **Anthropic 官方** | ~40（核心） | Anthropic | — | 官方 | 参考实现 |
| **obra/superpowers** | 14 | Jesse Vincent | 方法论 | 94K Stars | 方法论框架 |

### 2.2 各平台深度分析

#### 🏆 SkillsMP（skillsmp.com）—— 最大聚合市场

- **规模**：声称 **500,000+** Agent Skills
- **格式**：标准 `SKILL.md` 格式
- **兼容性**：Claude Code, Codex CLI, ChatGPT
- **特色**：多语言支持（含中文站），搜索聚合

SkillsMP 是目前规模最大的 Skills 聚合平台，但需注意其数据可能包含大量自动生成或低质量条目。

#### 🦞 OpenClaw Registry & ClawSkills —— 生态中枢

OpenClaw（原 Clawdbot）的官方 Skills 注册表是目前最成熟的分发基础设施：

- **原始注册表**：12,200+ Skills
- **ClawSkills 精选**：5,147 Skills（经严格过滤）
- **过滤掉的内容**：7,060 条
  - 垃圾/低质量：4,065
  - 重复/名称相似：1,040
  - 低质量/非英语：851
  - 加密货币/金融：731
  - 恶意软件：373

**热门 Skills TOP 10**（按安装量）：

| 排名 | 名称 | 功能 | 安装量 |
|------|------|------|--------|
| 1 | agent-browser | 无头浏览器自动化 CLI | 137.7K |
| 2 | gog | Google Workspace CLI（Gmail/日历/云盘） | 117.1K |
| 3 | auto-updater | 自动更新所有已安装 Skills | 46.8K |
| 4 | api-gateway | 第三方 API 网关 + 托管身份验证 | 45.7K |
| 5 | baidu-search | 百度 AI 搜索引擎集成 | 45.2K |
| 6 | automation-workflows | 自动化工作流设计与实施 | 41.9K |
| 7 | free-ride | 管理来自 OpenRouter 的免费 AI 模型 | 37.1K |
| 8 | elite-longterm-memory | 终极 AI 智能体记忆系统 | 32.6K |
| 9 | stock-analysis | 股票/加密货币分析（Yahoo Finance） | 32.4K |
| 10 | clawddocs | 文档专家 + 决策树导航 | 29.2K |

#### 🏪 ClawdHub —— CLI 优先的安装市场

- **规模**：3,286+ Skills
- **安装方式**：`clawhub install <skill-name>`
- **特色**：命令行原生体验，类似 `npm install`
- **贡献模式**：开放提交，社区审核

#### 📊 OpenAIToolsHub 排行榜 —— 权威评估

对 **349** 个公开 Claude Code Skills 进行了编目，分 **12 个类别**排名，评估维度：

1. **GitHub Stars**（使用代理指标）
2. **时效性**（90 天内有更新）
3. **文档质量**（功能说明清晰度）
4. **类别覆盖**（不偏向特定用例）

**skills.sh 全网安装量 TOP 5**：

| 排名 | 名称 | 来源 | 安装量 |
|------|------|------|--------|
| 1 | find-skills | Vercel Labs | 418.6K |
| 2 | vercel-react-best-practices | Vercel | 176.4K |
| 3 | web-design-guidelines | — | 137.0K |
| 4 | remotion-best-practices | Remotion | 126.0K |
| 5 | frontend-design | Anthropic | 124.1K |

#### 🛡️ GetAgentSkills（getagentskills.com）—— 验证型市场

- **规模**：声称数千，实际展示约 13 个核心 Skills
- **安全机制**：社区验证 + 只读安全模式（如 SQL 技能）
- **模型兼容**：GPT-4o、Claude 3、GPT-5
- **下载统计**：展示的 Skills 总下载量超 20 万次
- **热门**：Frontend Design (42K+), XLSX Master (35K+), PDF Toolkit (32K+)

#### 🔌 MCP.so —— MCP Server 专属目录

虽然不是 Skills 平台，但作为互补生态值得关注：

- **规模**：**19,095** 个 MCP Servers
- **分层**：Featured（精选）/ Hosted（托管）/ Official（官方认证）
- **热门服务**：Playwright, PostgreSQL, Redis, GitLab, Sentry, 百度地图, 高德地图

---

## 三、分类体系：Skills 在做什么？

综合各平台数据，Agent Skills 可归纳为以下主要类别：

### 3.1 十二类能力图谱

| 类别 | 占比（估） | 代表 Skills | 说明 |
|------|-----------|-------------|------|
| **💻 开发与编码** | ~35% | brainstorming, test-driven-development, writing-plans | 最大类别，覆盖全栈开发 |
| **🎨 设计与前端** | ~12% | frontend-design, landing-page-guide, ui-ux-pro-max | UI/UX、响应式、设计系统 |
| **🔧 DevOps & 测试** | ~10% | docker-optimize, deploy-checklist, test-harness, security-scan | CI/CD、部署、安全扫描 |
| **📊 数据与分析** | ~8% | postgres-best-practices, data-pipeline, Agent-SQL-Pro | ETL、查询优化、数据库 |
| **📝 文档与内容** | ~8% | DOCX Editor, PDF Toolkit, PPTX Creator | 文档生成、格式转换 |
| **🌐 浏览器与自动化** | ~7% | agent-browser, automation-workflows, Playwright 集成 | 网页自动化、爬取 |
| **🔍 搜索与研究** | ~5% | iterative-retrieval, baidu-search, web-search | RAG、信息检索 |
| **💬 通信与社交** | ~5% | gog (Google Workspace), Slack, Discord 集成 | IM、邮件、日程 |
| **🧠 记忆与上下文** | ~3% | elite-longterm-memory, context-manager | 长期记忆、会话管理 |
| **📈 金融与商业** | ~3% | stock-analysis, business-analysis | 股票分析、商业智能 |
| **🎯 方法论与流程** | ~2% | superpowers (14 skills), code-reviewer, systematic-debugging | 工程方法论、最佳实践 |
| **🛠️ 工具与实用** | ~2% | auto-updater, skill-installer, free-ride | 元工具、Skills 管理 |

### 3.2 Skills 的三种范式

| 范式 | 定义 | 例子 |
|------|------|------|
| **参考型（Reference）** | 编码约定、风格指南，自动加载到上下文 | vercel-react-best-practices |
| **任务型（Task）** | 具体操作步骤，通常手动调用 | PDF Toolkit, XLSX Master |
| **方法论型（Methodology）** | 完整工程流程，改变 Agent 工作方式 | superpowers, test-driven-development |

---

## 四、跨平台兼容性矩阵

### 4.1 Skills 发现路径

不同工具在项目中查找 Skills 的默认位置：

| 工具 | 项目级路径 | 用户级路径 |
|------|-----------|-----------|
| **Claude Code** | `.claude/skills/` | `~/.claude/skills/` |
| **GitHub Copilot** | `.github/skills/` | `~/.copilot/skills/` |
| **Codex CLI** | `.agents/skills/` | — |
| **Gemini CLI** | `.gemini/skills/` | `~/.gemini/skills/` |
| **Cursor** | `.cursor/skills/` | — |
| **Windsurf** | `.windsurf/skills/` | — |

### 4.2 功能支持对比

| 特性 | Claude Code | Copilot | Codex CLI | Gemini CLI | Cursor | Windsurf |
|------|:---------:|:-------:|:---------:|:----------:|:------:|:--------:|
| **SKILL.md** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **自动发现** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **脚本执行** | ✅ | ✅ | 🟡 | ✅ | 🟡 | 🟡 |
| **子代理运行** | ✅ | ✅ | ❌ | 🟡 | ❌ | ❌ |
| **动态上下文注入** | ✅ | 🟡 | ❌ | ✅ | ❌ | ❌ |
| **MCP 集成** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Hooks** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Plugin 打包** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Marketplace** | ✅ | ✅ | 🟡 | ✅ | ❌ | ❌ |

**结论**：`SKILL.md` 本身是完全可移植的（所有工具都支持），但高级功能（子代理、动态注入、Plugin 打包）仍有显著的工具差异。

---

## 五、安全与质量控制

### 5.1 安全挑战

Skills 生态的爆发式增长带来了严峻的安全问题：

- **ClawSkills 过滤统计**：从 12,200+ 原始条目中过滤掉 7,060 条（**57.8%**）
  - 恶意软件：373 条（**3%**）
  - 垃圾/低质量：4,065 条（**33.3%**）
  
这意味着超过一半的提交存在质量或安全问题。

### 5.2 各平台安全机制

| 平台 | 安全策略 |
|------|---------|
| **ClawSkills** | 7 维过滤（垃圾/重复/低质量/加密货币/恶意软件） |
| **Claude Code 官方** | 企业 > 个人 > 项目 优先级，allowed-tools 限制 |
| **GetAgentSkills** | 社区验证 + 功能级安全（如 SQL 只读模式） |
| **GitHub Copilot** | 文件夹信任 + 工具批准 |
| **obra/superpowers** | 代码审查 + TDD 内置于方法论 |

### 5.3 最佳实践建议

1. **安装前审查**：检查 `SKILL.md` 内容，特别是 `allowed-tools` 和脚本文件
2. **限制工具权限**：使用 `allowed-tools` 字段最小化 Skill 可用工具
3. **优先使用精选源**：ClawSkills（已过滤）优于原始注册表
4. **企业级管控**：利用企业级 Skills 覆盖机制确保合规
5. **版本控制**：将项目 Skills 纳入 Git 管理

---

## 六、商业模式与生态动态

### 6.1 三种商业模式

| 模式 | 代表 | 收入来源 |
|------|------|---------|
| **开放标准** | Agent Skills (agentskills.io) | 不盈利，推动标准采纳 |
| **平台抽成** | GetAgentSkills（Free + Premium） | 高级 Skills 付费 |
| **工具绑定** | Claude Code, Copilot 内置市场 | 绑定订阅收入 |

### 6.2 生态发展趋势

**🔥 2025 Q3-Q4：萌芽期**
- Anthropic 发布 Agent Skills 概念
- 仅 Claude Code 原生支持
- 社区手动分享 `SKILL.md` 文件

**🚀 2026 Q1：爆发期**
- 开放标准发布，30+ 工具接入
- OpenClaw 注册表突破 12,000
- SkillsMP 聚合量达 50 万+
- 三大平台（ClawdHub, ClawSkills, SkillsMP）形成

**📈 预判趋势**
1. **标准化深化**：Plugin 打包格式趋于统一
2. **质量分层**：精选 > 验证 > 原始 三层结构成为标配
3. **企业采纳**：企业级 Skills 管理（审批、部署、监控）兴起
4. **AI 生成 Skills**：元技能（如 skill-creator）将加速新 Skills 产出
5. **MCP + Skills 融合**：Plugin 同时打包知识层（Skills）和连接层（MCP）

---

## 七、与 MCP 生态的规模对比

| 维度 | Agent Skills | MCP Servers |
|------|-------------|-------------|
| **总量** | 500,000+（SkillsMP 聚合） | 19,095（mcp.so） |
| **精选量** | 5,147（ClawSkills） | ~500（Official + Featured） |
| **增长速度** | 极快（2026 Q1 爆发） | 稳步增长 |
| **入门门槛** | 极低（写 Markdown） | 中等（需开发 Server） |
| **运行成本** | 零（纯文本注入） | 需要进程运行 |
| **适用场景** | 领域知识、方法论、工作流 | API 集成、数据访问 |

Skills 的低门槛特性解释了其数量爆发式增长——任何懂 Markdown 的人都能创建一个 Skill，而 MCP Server 需要实际的编程能力。

---

## 八、标杆案例分析

### 8.1 obra/superpowers —— 方法论级 Skills

| 指标 | 数据 |
|------|------|
| **GitHub Stars** | 94,000+ |
| **Skills 数量** | 14 个方法论 Skills |
| **核心理念** | 将软件工程最佳实践固化为可执行流程 |
| **覆盖环节** | 构思 → 计划 → TDD → 实现 → 审查 → Git 管理 |

superpowers 证明了一个关键点：**质量 > 数量**。14 个精心设计的 Skills 比上万个低质量 Skills 对开发者的价值更大。

### 8.2 find-skills (Vercel Labs) —— 元技能之王

- **安装量**：418.6K（全网第一）
- **功能**：帮助用户发现和安装其他 Skills
- **意义**：Skills 生态的"搜索引擎"，降低了整个生态的使用门槛

### 8.3 agent-browser —— 能力型 Skills 标杆

- **安装量**：137.7K（ClawSkills 第一）
- **技术**：基于 Rust 的快速无头浏览器自动化
- **意义**：证明 Skills 不仅是"说明书"，也可以包装真正的工具能力

---

## 九、对从业者的启示

### 9.1 对 AI 工程师

- **立即行动**：将团队的编码规范、Review 流程、部署 Checklist 转化为 `SKILL.md`
- **版本控制**：项目 Skills 提交到仓库，确保团队共享
- **组合使用**：Skills（知识）+ MCP（工具）+ Plugin（分发）三层架构

### 9.2 对平台建设者

- **质量控制是核心**：ClawSkills 过滤掉 57.8% 内容的做法值得借鉴
- **安装量透明化**：skills.sh 的数据证明安装量是最可靠的质量信号
- **跨平台兼容**：遵循 Agent Skills 开放标准，避免锁定

### 9.3 对研究者

- **训练数据金矿**：50 万+ Skills 是"人类如何教 AI 做事"的大规模语料库
- **方法论研究**：superpowers 类框架提供了"将工程流程编码为指令"的研究方向
- **安全研究**：373 条恶意 Skills 的特征分析有助于 Agent 安全防护

---

## 十、总结

AI Agent Skills 生态在 2026 年初呈现出以下格局：

1. **标准统一**：Agent Skills 开放标准已获 30+ 工具支持，`SKILL.md` 成为事实标准
2. **规模爆发**：从零到 50 万+ 仅用半年，增速远超 MCP 生态
3. **质量分化**：原始注册表中超半数为低质量内容，精选平台价值凸显
4. **安全隐忧**：恶意 Skills 占比约 3%，安全审计机制仍在完善中
5. **工具收敛**：Claude Code 和 GitHub Copilot 在高级功能上领先，基础兼容性已全面打通
6. **商业萌芽**：从纯开源到 Free + Premium 模式，商业化开始试水

这是一个正在高速演化的生态系统。对于 AI 开发者而言，现在是参与标准制定、积累高质量 Skills 资产、建立工程化 Skills 管理流程的最佳时机。

---

## 附录：平台速查表

| 平台 | URL | 用途 | 推荐指数 |
|------|-----|------|---------|
| Agent Skills 标准 | agentskills.io | 了解规范 | ⭐⭐⭐⭐⭐ |
| ClawSkills | clawskills.sh | 发现精选 Skills | ⭐⭐⭐⭐⭐ |
| ClawdHub | clawhub.ai | CLI 安装 Skills | ⭐⭐⭐⭐ |
| SkillsMP | skillsmp.com | 海量搜索 | ⭐⭐⭐ |
| OpenAIToolsHub 排行 | openaitoolshub.org | 质量排名 | ⭐⭐⭐⭐ |
| GetAgentSkills | getagentskills.com | 验证型下载 | ⭐⭐⭐ |
| Claudate | claudate.com | Claude 专属 | ⭐⭐⭐ |
| MCP.so | mcp.so | MCP Server 目录 | ⭐⭐⭐⭐ |
| obra/superpowers | github.com/obra/superpowers | 方法论参考 | ⭐⭐⭐⭐⭐ |
| Claude Code 文档 | code.claude.com/docs/en/skills | 官方文档 | ⭐⭐⭐⭐⭐ |
