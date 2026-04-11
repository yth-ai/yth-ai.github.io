---
title: "Tool Search 技术研究报告"
description: "按需工具发现与加载机制、Just-in-Time Retrieval 及行业实践"
date: 2026-03-08
category: 专题研究
tags: ["Tool Search", "工具发现", "Agent 基础设施"]
draft: false
---
# Tool Search 技术研究报告

> **研究日期**: 2026-03-08
> **研究范围**: Tool Search 的定义、核心问题、技术方案、学术论文、工程实践与行业趋势

---

## 一、什么是 Tool Search

### 1.1 定义

Tool Search 是一种让 AI 模型**按需发现和加载工具**的机制。与传统的将所有工具定义一次性注入上下文不同，模型初始只持有一个轻量的"搜索工具"，当需要特定能力时，通过搜索查询找到相关工具，再将其完整定义动态注入上下文。

> **原文引用**（Boding 歪脖抠腚 - 微信公众号）:
> "Tool Search 的核心设计理念遵循 Just-in-Time Retrieval 原则——不要把所有可能有用的信息一次性塞入上下文，而是在模型需要时再检索注入。类比编程中的懒加载（Lazy Loading）或操作系统中的按需分页（Demand Paging）。"

### 1.2 核心思想：Just-in-Time Retrieval

Tool Search 的本质是**工具的"懒加载"机制**——模型只加载当前任务需要的工具，而非全量预载。这个理念与软件工程中的经典模式高度一致：

| 概念类比 | 说明 |
|----------|------|
| Lazy Loading（懒加载） | 只在真正需要时才加载资源 |
| Demand Paging（按需分页） | 操作系统只在访问时才将页面加载到内存 |
| Dynamic Linking（动态链接） | 运行时才链接所需的库 |

---

## 二、Tool Search 解决的核心问题

### 2.1 上下文膨胀（Context Bloat）

随着 MCP 生态发展，工具数量急剧增长，传统全量加载方式导致上下文严重膨胀。

> **原文引用**（GitHub Issue #11364, anthropics/claude-code）:
> "With 7 MCP servers active, tool definitions consume **67,300 tokens (33.7% of 200k context budget)** before any conversation begins."

**真实场景的 Token 消耗**：

| MCP 服务器 | 工具数量 | Token 消耗 |
|-----------|---------|-----------|
| GitHub | 35 | ~26K tokens |
| Slack | 11 | ~21K tokens |
| Jira | 20 | ~17K tokens |
| Sentry | 5 | ~3K tokens |
| **合计** | **78** | **~72K tokens** |

在 200K 上下文窗口中，超过三分之一的空间在对话开始前就被工具定义占据。

### 2.2 工具选择准确率下降

当可用工具超过 30-50 个时，模型面临**信息过载**问题，工具选择准确率显著下降。

> **原文引用**（微信公众号）:
> "Anthropic 内部评测数据显示，启用 Tool Search 后：
> - Claude Opus 4: 49% → 74%（+25pp）
> - Claude Opus 4.5: 79.5% → 88.1%（+8.6pp）"

### 2.3 Token 成本爆炸

> **原文引用**（微信公众号）:
> "5 服务器、78 个工具配置，每天 10,000 次 API 调用，仅工具定义成本约 **$2,160/天**。使用 Tool Search 后，成本降低 **85-95%**。"

### 2.4 Prompt Cache 失效

传统方式下，不同请求需要不同的工具子集，会破坏 Prompt Cache 的前缀匹配：
- 工具增删会破坏缓存
- 工具顺序变化会破坏缓存
- 工具参数更新会破坏缓存

Tool Search 的解决方案：延迟加载的工具完全排除在初始 prompt 之外，新发现的工具注入到上下文末尾，从而保护缓存前缀的稳定性。

---

## 三、工业界主要实现方案

### 3.1 Anthropic Claude 实现

**发布时间**: 2025年11月24日（Beta）  
**支持模型**: Claude Sonnet 4.0+、Claude Opus 4.0+

#### 两种搜索变体

| 变体 | 类型标识 | 查询方式 | 适用场景 |
|------|---------|---------|---------|
| BM25 自然语言搜索 | `tool_search_tool_bm25_20251119` | 自然语言 | 模糊搜索、语义匹配 |
| Regex 正则搜索 | `tool_search_tool_regex_20251119` | Python 正则 | 精确模式匹配 |

#### 关键 API 设计

```json
// 声明搜索工具（始终加载）
{
  "type": "tool_search_tool_bm25_20251119",
  "name": "tool_search"
}

// 标记延迟加载的工具
{
  "name": "create_pull_request",
  "defer_loading": true
}

// MCP 服务器级别的延迟加载
{
  "default_config": {"defer_loading": true},
  "configs": {
    "search_repos": {"defer_loading": false}  // 高频工具例外
  }
}
```

#### 效果数据

- 上下文消耗从 ~77K tokens 降至 ~8.7K tokens（**降低 85%+**）
- 每次搜索返回 3-5 个最相关工具
- 支持最多 **10,000 个工具**的目录

### 3.2 OpenAI GPT-5.4 实现

**发布时间**: 2026年3月（随 GPT-5.4 发布）

#### 两种执行模式

| 模式 | 执行方 | 适用场景 |
|------|--------|---------|
| Hosted（托管） | OpenAI 服务端 | 工具在请求时已知 |
| Client-executed（客户端） | 开发者应用 | 工具发现依赖外部系统 |

#### 核心设计差异：Namespace（命名空间）

> **原文引用**（微信公众号）:
> "OpenAI 强调 Namespace（命名空间）概念。模型主要训练在对 Namespace 和 MCP 服务器级别进行搜索，而非单个函数。模型只看到 Namespace 名称和描述，看不到里面各函数的参数 schema，直到 tool_search 加载某个 Namespace。"

**缓存优化设计**：新发现的工具被注入到上下文窗口末尾，确保前序内容的缓存不被打破。

### 3.3 Spring AI 跨平台实现

**发布时间**: 2025年12月  
**定位**: 将 Tool Search 模式从特定平台抽象为**可移植的跨 LLM 框架能力**

#### 三种可插拔搜索策略

| 策略 | 实现类 | 适用场景 |
|------|--------|---------|
| 语义搜索 | `VectorToolSearcher` | 自然语言查询、模糊匹配 |
| 关键词搜索 | `LuceneToolSearcher` | 精确术语匹配 |
| 正则匹配 | `RegexToolSearcher` | 工具名模式（如 `get_*_data`） |

#### 跨平台基准测试（28 个工具，Lucene 搜索）

| 模型 | 传统方式(tokens) | Tool Search(tokens) | 节省比例 |
|------|-----------------|-------------------|---------|
| Gemini 3 Pro | 5,375 | 2,165 | **60%** |
| GPT-5 Mini | 7,175 | 4,706 | **34%** |
| Claude Sonnet 4.5 | 17,342 | 6,273 | **64%** |

### 3.4 三平台对比总结

| 维度 | Anthropic Claude | OpenAI GPT-5.4 | Spring AI |
|------|-----------------|-----------------|----------|
| 搜索类型 | Regex + BM25 | Hosted + Client | Vector + Lucene + Regex |
| 延迟加载粒度 | 单工具 / MCP 服务器 | 单函数 / Namespace / MCP | 任意注册工具 |
| 搜索执行方 | 服务端 | 服务端或客户端 | 客户端（框架内） |
| 缓存策略 | 延迟工具排除在初始 prompt 外 | 新工具注入上下文末尾 | 依赖底层 LLM 实现 |
| 最大工具数 | 10,000 | 未公开 | 无硬限制 |
| 跨模型支持 | 仅 Claude | 仅 GPT-5.4 | 全部 LLM |

---

## 四、学术论文综述

### 4.1 ToolLLM / ToolBench（ICLR 2024 Spotlight）

**论文**: *ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs*  
**作者**: Yujia Qin 等（清华大学 / OpenBMB）  
**arXiv**: 2307.16789  
**GitHub**: https://github.com/OpenBMB/ToolBench

**核心贡献**：
- 构建了基于 RapidAPI Hub 的 **16,464 个 API**（涵盖 49 个类别）的大规模工具调用数据集
- 训练了开源的 ToolLLaMA 模型
- 提出基于 DFSDT（Depth-First Search Decision Tree）的工具调用推理策略

> **原文引用**（网易新闻）:
> "ToolLLM 使用了 RapidAPI Hub 提供的真实世界各类 API，通过初步的调用测试过滤了类似高延时、404 调不通之类的工具后，总共保留了 3451 个工具，包含 16464 个 API。"

**对 Tool Search 的意义**：ToolLLM 开创性地将大规模真实 API 引入 LLM 训练，验证了 LLM 有能力在海量工具中进行选择。其分层的工具检索机制（Category → Tool → API）为后续 Tool Search 方案提供了重要参考。

---

### 4.2 AnyTool: Self-Reflective, Hierarchical Agents for Large-Scale API Calls

**论文**: *AnyTool: Self-Reflective, Hierarchical Agents for Large-Scale API Calls*  
**作者**: Yu Du, Fangyun Wei, Hongyang Zhang（清华大学 / 微软 / 滑铁卢大学）  
**arXiv**: 2402.04253（2024年2月）

**核心方法**：
1. **分层 API 检索器（Hierarchical API Retriever）**：从 16,000+ 个 API 中通过分层结构高效检索相关候选
2. **求解器（Solver）**：使用 GPT-4 的函数调用功能，基于候选 API 集合解决用户查询
3. **自反思机制（Self-Reflection）**：当初始方案不可行时，自动重新激活检索流程

> **原文引用**（arXiv 摘要）:
> "We introduce AnyTool, a large language model agent designed to revolutionize the utilization of a vast collection of tools. It leverages over 16,000 APIs from Rapid API, operating under the assumption that a subset of these APIs can resolve user queries."

**实验结果**：
- 相比 ToolLLM，在 ToolBench 上**平均通过率提升 +35.4%**
- 无需额外训练，纯 prompt 驱动方案
- 引入了更严格的评估基准 AnyToolBench

**对 Tool Search 的意义**：AnyTool 展示了**分层检索 + 自反思**在大规模工具选择中的有效性，其"先粗筛再精选"的思路直接启发了工业界 Tool Search 的 Namespace 分组设计。

---

### 4.3 AutoTool: Efficient Tool Selection for Large Language Model Agents

**论文**: *AutoTool: Efficient Tool Selection for Large Language Model Agents*  
**作者**: Jingyi Jia, Qinbin Li  
**arXiv**: 2511.14650（2025年11月）  
**会议**: 已被 **AAAI 2026** 接收

**核心观察 — 工具使用惯性（Tool Usage Inertia）**：

> **原文引用**（arXiv 摘要）:
> "AutoTool, a novel graph-based framework that bypasses repeated LLM inference by exploiting a key empirical observation: **tool usage inertia** — the tendency of tool invocations to follow predictable sequential patterns."

**核心方法**：
1. 从历史 agent 轨迹构建**有向图**（节点=工具，边=转移概率）
2. 通过图遍历进行工具选择，**最小化 LLM 推理调用**
3. 集成参数级信息优化工具输入生成

**实验结果**：
- 推理成本**降低高达 30%**
- 在降低成本的同时保持具有竞争力的任务完成率

**对 Tool Search 的意义**：AutoTool 揭示了工具调用序列中存在的**统计规律性**，这为基于历史模式的预测性工具加载（Predictive Loading）提供了理论基础。

---

### 4.4 MCP-Zero: Active Tool Discovery for Autonomous LLM Agents

**论文**: *MCP-Zero: Active Tool Discovery for Autonomous LLM Agents*  
**作者**: Xiang Fei, Xiawu Zheng, Hao Feng（厦门大学 / 中科大）  
**arXiv**: 2506.01056（2025年6月）  
**GitHub**: https://github.com/xfey/MCP-Zero

**核心创新 — 主动工具发现（Active Tool Discovery）**：

MCP-Zero 提出了三种工具选择范式的对比：

| 范式 | 方法 | 问题 |
|------|------|------|
| (A) 全量注入 | 将所有工具 schema 注入系统提示 | 上下文过长，信息过载 |
| (B) 检索增强 | 用户查询时一次性检索相关工具 | 仅适用简单单步任务 |
| **(C) MCP-Zero** | **动态迭代的推理-检索循环** | **支持复杂多步任务** |

> **原文引用**（博客园分析文章）:
> "MCP-Zero 将 LLM 定位为'聪明的总规划师'，而非'万能工匠'，采用动态迭代的'思考-请求-执行'循环，实现高效、准确且可扩展的零样本任务自动化。"

**工作流程**：
1. **思考（Think）**：LLM 分解任务，识别当前步骤所需能力
2. **请求（Request）**：向检索器发出精确的工具需求
3. **执行（Execute）**：获取工具定义后调用执行
4. **循环迭代**：重复以上过程直到任务完成

**对 Tool Search 的意义**：MCP-Zero 将 Tool Search 从**静态的一次性检索**推进到**动态的多轮迭代发现**，与工业界 Anthropic/OpenAI 的 Tool Search 实现高度吻合，验证了"按需加载"思想在学术环境中的有效性。

---

### 4.5 Don't Break the Cache: Prompt Caching for Agentic Tasks

**论文**: *Don't Break the Cache: An Evaluation of Prompt Caching for Long-Horizon Agentic Tasks*  
**作者**: Elias Lumer, Faheem Nizar 等（PwC）  
**arXiv**: 2601.06007（2026年1月）

**核心研究**：首项量化多轮 Agent 任务中 Prompt Cache 成本节省的实证研究。

> **原文引用**（论文摘要）:
> "While major LLM providers offer prompt caching to reduce costs and latency, its benefits in agentic workloads are underexplored in the research literature."

**实验规模**：
- 4 个模型，500+ agent 会话，10,000-token 系统提示
- 评估 OpenAI、Anthropic、Google 三大提供商

**关键发现**：

| 指标 | 改进幅度 |
|------|---------|
| API 成本降低 | **41-80%** |
| 首 Token 时间改进 | **13-31%** |

**三种缓存策略对比**：
1. **全上下文缓存**：可能反而增加延迟（朴素方式有风险）
2. **仅系统提示缓存**：最稳定、性价比最高
3. **排除动态工具结果**：策略性效果优于朴素缓存

**对 Tool Search 的意义**：该研究从实证角度证明了 Tool Search 对 Prompt Cache 的保护效果——通过将动态工具定义排除在缓存前缀之外，可以显著提升缓存命中率，降低成本。

---

### 4.6 ToolSandbox: Evaluation Benchmark for LLM Tool Use

**论文**: *ToolSandbox: A Stateful, Conversational, Interactive Evaluation Benchmark for LLM Tool Use Capabilities*  
**作者**: Apple Research  
**arXiv**: 2408.04682（2024年8月）

**核心贡献**：提出了一个面向 LLM 工具使用能力的**有状态、对话式、交互式**评估框架。

> **原文引用**（arXiv 摘要）:
> "ToolSandbox includes stateful tool execution, implicit state dependencies between tools, a built-in user simulator supporting on-policy conversational evaluation and a dynamic evaluation strategy for intermediate and final milestones over an arbitrary trajectory."

**与 Tool Search 的关联**：ToolSandbox 的有状态工具评估框架为衡量 Tool Search 机制的效果提供了更真实的评估环境——在多轮有状态交互中，按需加载工具的优势更加明显。

---

## 五、关键技术方案深度分析

### 5.1 技术路线分类

根据文献和工程实践，Tool Search 的技术路线可分为以下几类：

```
Tool Search 技术路线
├── 1. 基于文本匹配的检索
│   ├── BM25 (Anthropic)
│   ├── Lucene (Spring AI)
│   └── Regex (Anthropic / Spring AI)
├── 2. 基于语义向量的检索
│   ├── Embedding + 向量搜索 (Spring AI VectorToolSearcher)
│   └── 分层语义检索 (AnyTool)
├── 3. 基于图结构的选择
│   └── 工具转移概率图 (AutoTool)
├── 4. 基于 LLM 推理的动态发现
│   ├── 主动工具发现 (MCP-Zero)
│   └── Namespace 分级搜索 (OpenAI)
└── 5. 混合方案
    └── 多策略可插拔 (Spring AI / Claude)
```

### 5.2 方案对比分析

| 维度 | 文本匹配 | 语义向量 | 图结构 | LLM 推理 |
|------|---------|---------|--------|---------|
| **检索精度** | 中（依赖关键词） | 高（语义理解） | 高（历史模式） | 最高（上下文理解） |
| **延迟** | 最低 | 中 | 低 | 最高（需 LLM 推理） |
| **成本** | 最低 | 中（需 embedding） | 低（预计算） | 最高（LLM 调用） |
| **冷启动** | 无问题 | 需要预先 embedding | 需要历史数据 | 无问题 |
| **多步任务** | 弱（一次性） | 弱（一次性） | 中（可预测） | 强（迭代发现） |
| **适用规模** | 任意 | 大规模 | 中等规模 | 任意 |

### 5.3 传统全量加载 vs Tool Search 工作流对比

**传统 Tool Calling 流程**：
```
系统提示词 + 所有工具定义（一次性全量加载 ~72K tokens）
     ↓
用户提问
     ↓
模型从所有工具中选择 → 调用工具 → 返回结果
```

**Tool Search 流程**：
```
系统提示词 + Tool Search 工具（~500 tokens）
     ↓
用户提问
     ↓
模型调用 tool_search("github pull request")
     ↓
发现 github.createPullRequest → 动态加载该工具定义（~800 tokens）
     ↓
模型调用已加载的工具 → 返回结果
```

> **原文引用**（微信公众号）:
> "总计：~1.3K tokens（vs 传统方式 ~72K），节省 ~98% 的工具定义 Token 开销。"

---

## 六、配套能力与协同效应

Tool Search 不是独立的能力，它与其他技术形成协同体系：

### 6.1 三驾马车

> **原文引用**（微信公众号）:
> "Tool Search → 发现正确的工具；Tool Use Examples → 正确地调用工具；Programmatic Tool Calling → 高效地执行工具。三者协同构成完整的工具使用体系。"

| 能力 | 作用 | 效果 |
|------|------|------|
| **Tool Search** | 发现正确的工具 | Token 节省 85%+ |
| **Tool Use Examples** | 正确地调用工具 | 准确率从 72% → 90% |
| **Programmatic TC** | 高效地执行工具 | Token 消耗减少 37% |

### 6.2 Programmatic Tool Calling

模型编写 Python 代码来编排多个工具调用，中间结果在代码执行环境中处理：
- Token 消耗从 43,588 降至 27,297（减少 37%）

### 6.3 Tool Use Examples

在工具定义中直接提供 `input_examples`，让模型通过示例学习正确的调用模式：
- 复杂参数处理的准确率从 72% 提升至 90%

---

## 七、Context Engineering 视角下的 Tool Search

Tool Search 是 **Context Engineering**（上下文工程）的重要实践之一。

### 7.1 Context Engineering 公式

> **原文引用**（GitHub - Context Engineering 解读）:
> ```
> context = Assemble(instructions, knowledge, tools, memory, state, query)
> |context| ≤ MaxTokens (context window limitation)
> ```
> "Context Engineering 是设计和优化这些组件和格式，以最大限度地提高模型在给定任务上效果的工程设计。"

### 7.2 Tool Search 在 Context Engineering 中的位置

Tool Search 本质上是对 `tools` 组件的**动态优化**——从静态全量注入变为按需检索注入：

```
传统: context = Assemble(instructions, ALL_tools, memory, query)  // tools 占比过大
优化: context = Assemble(instructions, search_tool, memory, query)  // 初始精简
        → Assemble(instructions, search_tool + found_tools, memory, query)  // 按需扩展
```

### 7.3 Claude Code 的缓存工程实践

> **原文引用**（微信公众号）:
> "Claude Code 团队的实践：像监控 uptime 一样监控缓存命中率；Plan Mode 的缓存友好设计；用工具表示状态而非改变工具集；Compaction 的缓存安全设计。"

---

## 八、实践指南与最佳实践

### 8.1 何时使用 Tool Search

**推荐使用**：
- 系统中有 **10+ 个**可用工具
- 构建**多 MCP 服务器**的系统
- 工具定义消耗超过 **10K tokens**
- 遇到工具选择准确率问题
- 工具库会随时间增长

**不推荐使用**：
- 工具少于 10 个
- 所有工具在每次请求中都会被使用
- 工具定义非常精简（总计 <100 tokens）

### 8.2 最佳实践

> **原文引用**（微信公众号）:
> 1. 保留 3-5 个高频工具始终加载
> 2. 工具命名和描述要清晰、可搜索
> 3. 使用一致的命名空间前缀
> 4. 在系统提示词中概述可用能力
> 5. 利用 Namespace 分组（OpenAI）

### 8.3 三层上下文加载方案（社区实践）

> **原文引用**（GitHub Issue #11364 提出的方案）:

| 层级 | 始终加载内容 | Token 成本 |
|------|------------|-----------|
| **Tier 1: 最小上下文** | 服务器名 + 工具名 + 一行描述 | ~50-100 tokens/工具 |
| **Tier 2: 完整定义** | 按需加载完整参数 schema | ~550-850 tokens/工具 |
| **Tier 3: 扩展文档** | 用户提供的详细使用模式 | 按需加载 |

> **社区洞察**:
> "You generally know about all of the tools and what they do. When you need more information on how to use a tool, you pull the instruction files. Then use the tool if needed. You should only need enough context to decide IF you need to use the tool, then you can pull the specifics."

---

## 九、行业趋势与未来展望

### 9.1 范式演进

> **原文引用**（微信公众号）:
> "范式转移：从'函数调用' → '多工具编排' → '工具生态'"

```
2022: Function Calling（单工具调用）
2023: Multi-Tool Orchestration（多工具编排）
2024: Tool Learning at Scale（大规模工具学习）
2025: Tool Search / Dynamic Discovery（按需发现）
2026: Predictive Tool Loading（预测性加载）
```

### 9.2 MCP 与 Tool Search 的共生关系

> **原文引用**（微信公众号）:
> "MCP 让 Agent 能连接无限工具 → 工具数量爆炸导致上下文不可承受 → Tool Search 让 Agent 能管理无限工具"

这形成了一个正向循环：
- MCP 降低了工具接入门槛 → 工具数量激增
- Tool Search 解决了规模化管理问题 → 更多工具可以被接入
- 两者共同推动 Agent 工具生态的繁荣

### 9.3 未来方向

| 方向 | 说明 |
|------|------|
| **更智能的搜索策略** | 结合用户画像、历史偏好的个性化工具推荐 |
| **工具元数据标准化** | 统一的工具描述格式，提升跨平台检索效果 |
| **跨 Agent 工具共享** | Agent 之间共享工具发现结果 |
| **工具质量评估** | 自动评估工具的可靠性和性能 |
| **预测性加载** | 基于历史模式预测下一步可能需要的工具（AutoTool 的延伸） |

---

## 十、参考文献与资源

### 学术论文

1. **ToolLLM** - Yujia Qin et al. "ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs." ICLR 2024 Spotlight. arXiv:2307.16789
2. **AnyTool** - Yu Du et al. "AnyTool: Self-Reflective, Hierarchical Agents for Large-Scale API Calls." arXiv:2402.04253 (2024)
3. **AutoTool** - Jingyi Jia, Qinbin Li. "AutoTool: Efficient Tool Selection for Large Language Model Agents." AAAI 2026. arXiv:2511.14650
4. **MCP-Zero** - Xiang Fei et al. "MCP-Zero: Active Tool Discovery for Autonomous LLM Agents." arXiv:2506.01056 (2025)
5. **Don't Break the Cache** - Elias Lumer et al. "Don't Break the Cache: An Evaluation of Prompt Caching for Long-Horizon Agentic Tasks." arXiv:2601.06007 (2026)
6. **ToolCaching** - "ToolCaching: Towards Efficient Caching for LLM Tool-calling." arXiv:2601.15335 (2026)
7. **ToolSandbox** - Apple Research. "ToolSandbox: A Stateful, Conversational, Interactive Evaluation Benchmark for LLM Tool Use Capabilities." arXiv:2408.04682 (2024)

### 官方文档与博客

8. Anthropic - Tool Search Tool Documentation (2025.11)
9. OpenAI - Tool Search Guide for GPT-5.4 (2026.03)
10. Spring AI - Smart Tool Selection: 34-64% Token Savings with Dynamic Tool Discovery (2025.12)
11. Anthropic - Effective Context Engineering for AI Agents
12. GitHub Issue #11364 - Lazy-load MCP tool definitions (anthropics/claude-code)

### 技术分析文章

13. Boding 歪脖抠腚 - "OpenAI 和 Anthropic 同时押注：Tool Search 正在重定义 Agent 工具调用"（微信公众号）
14. 博客园 - "解决多MCP服务、复杂多步任务的MCP-Zero"
15. CSDN - "解密Prompt系列：LLM Agent之真实世界海量API解决方案"
16. Context Engineering 解读 - GitHub SimonAKing/weibo #162
17. AWS 官方博客 - "Agentic AI基础设施实践：Context Engineering 上下文工程"

---

## 附录：关键数据速查表

| 指标 | 传统方式 | Tool Search | 改进 |
|------|---------|------------|------|
| 初始 Token 消耗 | ~72K | ~1.3K | **-98%** |
| 上下文利用率 | 33.7% 被工具占据 | <5% | **解放 28%+** |
| 工具选择准确率（Opus 4） | 49% | 74% | **+25pp** |
| 工具选择准确率（Opus 4.5） | 79.5% | 88.1% | **+8.6pp** |
| 每日 API 成本（78 工具） | $2,160 | $108-$324 | **-85~95%** |
| Prompt Cache 命中率 | 低（频繁失效） | 高（前缀稳定） | **显著提升** |
| 支持最大工具数 | ~50（准确率瓶颈） | 10,000+ | **200x** |
