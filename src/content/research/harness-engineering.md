---
title: "Harness Engineering：Agent 时代的第三次工程范式跃迁"
description: "从 Prompt Engineering 到 Context Engineering 再到 Harness Engineering，系统研究这一 2026 年最热门的 AI 工程新范式——它的起源、核心理念、三大支柱、实战框架与行业争议。"
date: 2026-03-28
category: 专题研究
tags: ["Harness Engineering", "AI Agent", "Prompt Engineering", "Context Engineering", "软件工程", "Mitchell Hashimoto"]
draft: false
---

## 一、概述：什么是 Harness Engineering？

2026 年 2 月，HashiCorp 联合创始人 **Mitchell Hashimoto** 在博文 [*My AI Adoption Journey*](https://mitchellh.com/writing/my-ai-adoption-journey) 中首次正式命名了这一概念。他在描述自己使用 AI Agent 的第五个阶段时写道：

> "每当我看到 Agent 犯了一个错误，我就花时间进行工程化调整（engineer the harness），以确保它以后不会再犯同样的错误。"

**Harness Engineering（驾驭工程）** 不是 Prompt 技巧的升级版，也不仅仅是 RAG 知识库的优化。它是一种全新的工程范式——关注**模型之外的一切**：约束系统、反馈回路、验证机制、状态持久化和熵管理。

如果用一个公式来表达：

$$Agent = Model + Harness$$

如果用一个比喻来理解：
- **Prompt Engineering** = 教马"向左转""向右转"的口令
- **Context Engineering** = 给马一张地图
- **Harness Engineering** = 给马装上缰绳、马鞍和围栏——马可以自己跑，但跑不出划定的范围

或者用计算机的类比：如果 LLM 是 **CPU**，Harness 就是 **操作系统**，Agent 是运行在上的 **应用程序**。无论 CPU 多强大，操作系统糟糕的话性能依然低下。

---

## 二、范式演进：三次跃迁

| 范式 | 时间 | 核心问题 | 交互模式 | 角色关系 |
|:-----|:-----|:---------|:---------|:---------|
| **Prompt Engineering** | 2023-2024 | 怎么把话说清楚？ | 一问一答 | 出题者 ↔ 答题者 |
| **Context Engineering** | 2025 | 该让模型看到什么？ | 给信息，生成内容 | 信息提供者 ↔ 内容生成者 |
| **Harness Engineering** | 2026— | 整个环境该如何设计？ | 人造环境，AI 在里面跑 | 系统设计师 ↔ 自主执行者 |

三者是**集合包含关系**，而非替代关系：

$$Prompt\ Engineering \subset Context\ Engineering \subset Harness\ Engineering$$

**Context Engineering** 问的是："给 Agent 看什么？"
**Harness Engineering** 问的是："系统如何**防止、测量和修复** Agent 的行为？"

### 为什么需要这次跃迁？

随着 AI Agent 从"对话助手"进化为"自主执行者"，三个根本性问题浮出水面：

1. **Context Rot（上下文腐烂）**：随着对话历史堆积，模型的指令跟随能力持续下降
2. **无状态性**：LLM 每次会话从零开始，无法跨会话记忆经验和教训
3. **不可控性**：仅靠提示词无法阻止 Agent 做出架构违规、无限循环、降低标准等危险行为

Prompt 和 Context 优化无法根本解决这些问题。必须在模型**外部**建立工程化的约束和反馈体系。

---

## 三、起源：两个关键事件

### 3.1 Mitchell Hashimoto 的博文（2026.2.5）

Mitchell Hashimoto——HashiCorp 联合创始人、Terraform 和 Vagrant 的创造者——在 [*My AI Adoption Journey*](https://mitchellh.com/writing/my-ai-adoption-journey) 中描述了 AI 采用的六个阶段：

| 阶段 | 名称 | 内涵 |
|:-----|:-----|:-----|
| Stage 1 | 丢掉聊天机器人 | 从 ChatGPT 网页转向真正的 Agent |
| Stage 2 | 复现自己的工作 | 建立 Agent 能力边界的直觉 |
| Stage 3 | 下班前的 Agent | 利用 Agent 做深度调研 |
| Stage 4 | 外包"稳赢"任务 | 后台跑确定性任务 |
| **Stage 5** | **Engineer the Harness** | **Agent 犯错时，改善环境而非修改输出** |
| Stage 6 | 始终有 Agent 在运行 | 持续寻找可委托任务 |

他提出了两种具体的 Harness Engineering 形式：

1. **改进隐式提示词**：维护 `AGENTS.md` 配置文件，文件中的每一行规则都来自 Agent 过去犯过的错误。他以 [Ghostty 项目](https://github.com/ghostty-org/ghostty) 为例，展示了这种"错误驱动的规则积累"如何几乎完全消除了所有已知的 Agent 不良行为。

2. **编写程序化工具**：开发截图工具、特定过滤条件的测试脚本等，让 Agent 能够自动识别并纠正错误，而不是依赖人工审查。

### 3.2 OpenAI 的百万行代码实验

OpenAI 披露了一个内部实验：**3 名工程师在 5 个月内，使用 Codex Agent 生成了约 100 万行代码（1500 个 PR），全程无手动编码**。

团队发现，早期因 Harness 不完善导致生产力极低。只有在建立了一套精密的五层 Harness 系统后，效率才急剧提升：

| 层级 | 名称 | 功能 |
|:-----|:-----|:-----|
| 第一层 | 结构化知识体系 | 代码仓库即真理源，"渐进式披露"策略 + "文档园丁 Agent" |
| 第二层 | 架构约束 | 分层依赖模型 + Linter 教学式报错 + CI 阻止违规合并 |
| 第三层 | 运行时验证 | 接入 Chrome DevTools Protocol + 机器可读的可观测性 |
| 第四层 | 自修复闭环 | 后台"清洁 Agent"扫描坏模式 + 自动提交重构 PR |
| 第五层 | AI 互审 | Agent A 写代码 → Agent B 审代码，人类只介入架构决策 |

---

## 四、三大支柱

综合多个来源的分析，Harness Engineering 的核心架构可归纳为**三大支柱**：

### 支柱一：上下文工程（Context Engineering）

**核心命题**：从 Agent 视角看，运行时无法访问的内容等同于不存在。

关键实践——**AGENTS.md**：

```markdown
## 项目概览
用户认证服务，Spring Boot + PostgreSQL。

## 架构约束
- 依赖方向：domain → application → infrastructure
- infrastructure 层不得被 domain 层直接引用

## 编码规范
- 使用懒加载，N+1 问题用 fetch join 解决
- 提交信息用中文，句末不加句号
```

**关键原则**：
- AGENTS.md 是**导航地图**，不是百科全书（约 100 行）
- 精简指向深层文档（docs/architecture.md、docs/conventions.md）
- OpenAI 采用"渐进式披露"策略 + "文档园丁 Agent"自动修复文档与代码的不一致

### 支柱二：架构约束（Architectural Constraints）

**核心命题**：与其苦口婆心地"告诉" Agent 写好代码，不如**机械地强制**它执行标准。

关键实践——**自定义 Linter + 确定性验证**：

- Linter 错误信息不仅报错，还**嵌入修复指引**（将错误转化为教学时刻）
- 分层依赖规则由 CI 强制执行，违反即阻止合并
- 混合执行：LLM 审查 + 确定性 Linter 检查

```
错误：infrastructure 层代码直接引用了 domain 层的接口。

修复建议：
1. 在 application 层创建一个适配器接口
2. 让 infrastructure 层实现该适配器
3. domain 层仅依赖 application 层的抽象
```

### 支柱三：熵管理（Entropy Management）

**核心命题**：AI 生成的代码库会自然累积混乱，必须引入对抗机制。

关键实践——**垃圾回收 Agent 生态**：

| Agent | 运行频率 | 职责 |
|:------|:---------|:-----|
| 文档一致性 Agent | 每日 | 验证代码与文档是否匹配 |
| 约束违规扫描器 | 每 PR | 检查绕过早期检查的违规 |
| 依赖审计器 | 每周 | 追踪循环依赖 |
| 清洁 Agent | 持续 | 扫描偏离"黄金标准"的代码，自动提交重构 PR |

这形成了一个**正向复利飞轮**：随着规则库积累，Agent 能犯的错越来越少。

---

## 五、实战框架

### 5.1 LangChain 的性能验证

LangChain 在**不更换模型（GPT 5.2 Codex）**的情况下，仅通过优化 Harness，将 Terminal Bench 2.0 得分从 **52.8% 提升至 66.5%**（排名从第 30 升至第 5）。

三个关键中间件：

| 中间件 | 功能 |
|:-------|:-----|
| `PreCompletionChecklistMiddleware` | 在 Agent 退出前拦截，强制对照规格验证 |
| `LoopDetectionMiddleware` | 追踪文件编辑次数，超限注入"换思路"建议 |
| `LocalContextMiddleware` | 自动注入目录结构和工具列表 |

**推理三明治策略**：

| 阶段 | 推理强度 | 原因 |
|:-----|:---------|:-----|
| 规划 | xhigh | 高质量设计决策 |
| 实现 | high | 快速执行，避免超时 |
| 验证 | xhigh | 严格检查质量 |

全程 xhigh 得分仅 53.9%（因超时），三明治策略得分 **66.5%**。

### 5.2 Anthropic 的长期运行设计

针对上下文窗口有限的问题，Anthropic 提出了跨窗口方案：

- **双层架构**：Orchestrator（任务分解 + 状态持久化）→ Worker（具体执行）
- **全标失败策略**：所有功能初始标记为"失败"，Agent 只能通过修改状态字段标记完成，**禁止删除或编辑测试用例**
- **单任务约束**：强制每次只做一件事，防止上下文耗尽

### 5.3 五大核心模式

| 模式 | 说明 |
|:-----|:-----|
| 结构化任务分解 | 在系统层面实现规划阶段，产出机器可读的任务列表 |
| 跨会话状态持久化 | 使用外部 JSON 文件记录进度，实现会话恢复 |
| 显式验证节点 | 在执行图中插入强制验证点（测试 / Lint / 规格检查） |
| 机械化约束执行 | 用硬性规则阻止违规，错误信息转化为修复指令 |
| 精确的工具描述 | 明确工具的使用决策标准（何时用 / 何时不用） |

### 5.4 映射到 Claude Code

对于使用 Claude Code 的开发者，现有工具可直接对应 Harness 层级：

| 组件 | Harness 角色 | 层级 |
|:-----|:------------|:-----|
| **CLAUDE.md** | 仓库知识聚合、架构约束声明 | Context 层 |
| **Commands** | 可复现的常规任务执行 | Harness 层 |
| **Hooks** | 自动化事件触发处理（Pre/Post Tool Use, Stop） | Harness 层（反馈循环） |
| **Permissions** | 自动批准范围定义 | Harness 层（架构约束） |
| **Skills** | 最佳实践注入 | Context 层 |

---

## 六、成熟度阶梯

不要追求一步到位，根据诊断信号逐级提升：

| 等级 | 名称 | 实践 | 投入 |
|:-----|:-----|:-----|:-----|
| L0 | 裸用 | 每次对话从零开始 | 零 |
| L1 | 指令层 | 写 AGENTS.md（<200 行），结构化项目知识 | 低 |
| L2 | 约束层 | 用 Hooks / Linter 把规则变成"法律" | 中 |
| L3 | 工作流层 | 封装 Skills / Commands，引入反馈信号 | 中 |
| L4 | 委托层 | 多 Agent 分工（Writer / Reviewer） | 高 |
| L5 | 治理层 | 权限、审计、沙箱（团队级基础设施） | 很高 |

**关键原则**：
- L1 的具体规则（如"用 2 空格缩进"）优于抽象建议（如"保持代码整洁"）
- L2 的报错信息即教学——不仅告诉错了，还告诉怎么修
- **错误即规则**：每次 Agent 犯错，都应转化为一条新的约束

---

## 七、实证数据

三个实验有力证明了**优化 Harness 比升级模型更有效**：

| 实验 | 变量 | 结果 |
|:-----|:-----|:-----|
| **LangChain** | 固定 GPT 5.2 Codex，仅改 Harness | 52.8% → 66.5%（+26%） |
| **Hashline** | 仅改编辑格式（附加哈希标识） | 6.7% → 68.3%（+10x） |
| **OpenAI** | 同一团队 + 同一模型，逐步改进 Harness | 早期几乎不可用 → 日均产出数百 PR |

---

## 八、行业争议

### Big Model vs Big Harness

一派认为更强的模型会让 Harness 过时；另一派（包括 Hashimoto 和 OpenAI 团队）认为 **Harness 才是产品本身**，两者是乘法关系：

$$产出 = Model \times Harness$$

模型能力趋同时，Harness 成为唯一的差异化竞争力。

### AGENTS.md 的陷阱

试图把所有规则写进一个巨大的文档是注定失败的——它会让上下文窗口被占满，实际效果反而下降。正确做法是：
- 主文件作为导航地图
- 规则应工程化到 Linter、CI、Hooks 等确定性系统中
- 文档只存放 Agent 需要"理解"的部分，规则要"执行"的部分交给代码

### 可撕裂原则

随着模型能力进化，今天的复杂脚手架可能明天就成累赘。应定期审视并删除不再需要的 Harness 组件。

---

## 九、工程师角色的转变

Harness Engineering 标志着软件工程师角色的根本性转变：

| 维度 | 传统模式 | Harness Engineering |
|:-----|:---------|:-------------------|
| 核心工作 | 编写代码 | 设计让 AI 能安全写代码的环境 |
| 质量保证 | 代码审查 | 构建自动化约束和验证系统 |
| 知识管理 | 文档 + wiki | 结构化的 AGENTS.md + 文档园丁 Agent |
| 错误处理 | 修 bug | 修环境（确保同类错误不再发生） |
| 架构治理 | 人工审查 | 机械化执行 + 垃圾回收 Agent |

从"写代码的人"变为**"设计让 AI 可靠写代码的系统"的构建者**。

---

## 十、关键引用来源

1. Mitchell Hashimoto, [*My AI Adoption Journey*](https://mitchellh.com/writing/my-ai-adoption-journey), 2026.2.5
2. CuiLiang.ai, [*Harness Engineering：Agent 工程的第三次范式跃迁*](https://cuiliang.ai/posts/harness-engineering/), 2026.3.10
3. 晨涧云, [*Harness Engineering：从驾驭百万行AI代码到软件工程的范式革命*](https://www.mornai.cn/news/ai-agent/harness-engineering/), 2026.3.24
4. 宇擎智脑科技, [*Harness Engineering：继 Context Engineering 之后，AI Agent 时代的新工程范式*](https://blog.csdn.net/qhvssonic/article/details/159475751), CSDN, 2026.3.26
5. SmallYoung, [*Harness Engineering：重塑 AI Agent 时代的软件工程*](https://www.smallyoung.cn/docs/Harness%20Engineering), 2026.3.16
6. 虎嗅, [*Harness Engineering 成为 2026 年 AI 开发新范式*](https://www.huxiu.com/article/4841931.html), 2026.3.13
7. InfoQ, [*2026 年 AI 最大风口：驾驭工程*](https://xie.infoq.cn/article/7befec018fb1d72dcf5aac5d2), 2026.3
8. 姚利锋, [*2026 Harness Engineering*](https://yaolifeng.com/shorts/2026_harness_engineering), 2026.3.23
9. LangChain, *Building Effective AI Coding Agents for the Terminal*, [arXiv:2603.05344](https://arxiv.org/abs/2603.05344)
