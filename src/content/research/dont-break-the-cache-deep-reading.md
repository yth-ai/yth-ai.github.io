---
title: "Don't Break the Cache 精读：长视野 Agent Prompt Caching 评估"
description: "系统评估 Prompt Caching 在长视野 Agent 任务中的效果与优化策略"
date: 2026-03-08
category: 论文精读
tags: ["Prompt Caching", "Agent 推理", "系统优化"]
paperTitle: "Don't Break the Cache: An Evaluation of Prompt Caching for Long-Horizon Agentic Tasks"
arxiv: "2601.06007"
draft: false
---
# Don't Break the Cache: An Evaluation of Prompt Caching for Long-Horizon Agentic Tasks

> **论文精读笔记** | arXiv: 2601.06007v2  
> **作者**: Elias Lumer, Faheem Nizar, Akshaya Jangiti, Kevin Frank, Anmol Gulati, Mandar Phadate, Vamse Kumar Subbiah  
> **发表时间**: 2026年1月  
> **关键词**: Prompt Caching, LLM Agents, KV Cache, Cost Optimization, Latency Reduction

---

## 一、论文概览

### 1.1 核心问题

随着 LLM Agent 能力的增强，复杂的 **长视野代理任务（long-horizon agentic tasks）** 需要在多轮对话中进行大量工具调用，导致上下文窗口急剧膨胀，带来巨大的成本与延迟开销。主流 LLM 提供商（OpenAI、Anthropic、Google）均提供了 **Prompt Caching** 功能，但其在代理工作负载中的实际收益尚未被系统性研究。

### 1.2 研究贡献

> *"In this paper, we present the first comprehensive evaluation of prompt caching strategies for long-horizon agentic tasks across three LLM providers (OpenAI, Anthropic, and Google) using four flagship models."*

本文是 **首个** 系统性评估 Prompt Caching 在多轮代理任务中成本与延迟收益的研究。

### 1.3 三大核心发现

| # | 发现 | 原文摘录 |
|---|------|---------|
| 1 | **成本节省显著且一致** | *"Prompt caching reduces API costs by 41 to 80%"* across all providers |
| 2 | **延迟改善因策略而异** | *"Time to first token improvements range from 13% to 31% across providers"* |
| 3 | **策略性缓存边界优于朴素全缓存** | *"System prompt only caching provides the most consistent benefits across both cost and latency dimensions"* |

---

## 二、论文结构

```
1. Introduction
2. Background
   2.1 KV Cache and LLM Inference
   2.2 Prompt Caching in Provider APIs
   2.3 Agentic Workloads and Context Engineering
3. Methodology
   3.1 Experimental Setup
   3.2 Cache Mode Implementation
   3.3 Evaluation Protocol
   3.4 Statistical Analysis
4. Results
   4.1 Overall Results
   4.2 Cost Reduction
   4.3 Cache Strategy Comparison
5. Discussion
   5.1 Strategic Cache Boundary Control
   5.2 Tool Call Caching Considerations
   5.3 Provider Implementation Variability
6. Ablation Study
   6.1 Ablation by Prompt Size
   6.2 Ablation by Tool Count
   6.3 Discussion
7. Conclusion
Appendices: A (Pricing), B (Caching Mechanism), C (Strategy Implementations)
```

---

## 三、背景知识（Section 2）

### 3.1 KV Cache 与 LLM 推理

LLM 推理包含两个阶段：
- **Prefill 阶段**：处理输入 prompt，生成注意力 KV 张量
- **Decode 阶段**：逐 token 自回归生成输出

KV 张量 *"capture the contextual representations needed for subsequent generation"*，存储在 KV Cache 中以避免重复计算。

**与已有工作的区别**：已有研究聚焦于推理层面的 KV Cache 优化（如 PagedAttention、KV 压缩），而本文评估的是 **提供商层面的 API 级 Prompt Caching 功能**。

> *"Existing work on KV cache optimization focuses primarily on inference-level memory management and compression... rather than evaluating the enterprise-grade prompt caching features offered through provider APIs."*

### 3.2 各提供商的 Prompt Caching 实现

| 提供商 | 机制 | 最小token阈值 | 特点 |
|--------|------|--------------|------|
| **OpenAI** | 自动缓存，精确前缀匹配 | 1,024 | 对 GPT-4o 及更新模型自动激活 |
| **Anthropic** | 开发者显式设置缓存断点 | 1,024 | 可配置 TTL，需在 API 请求中指定 |
| **Google** | 隐式缓存 + 显式上下文缓存 | 4,096 | 显式缓存有保证折扣，额外收取存储费 $4.50/M tokens/hour |

> *"Implementation details such as minimum token thresholds (typically 1,024-4,096 tokens depending on model), TTL durations (ranging from 5 minutes to 24 hours), and pricing structures vary across providers and are subject to change."*

**关键约束**：Cache hit 要求 **精确前缀匹配（exact prefix matches）**，任何 token 差异都会导致 cache miss。

### 3.3 代理工作负载的挑战

现代代理系统特征：
- 单次会话可执行 **30-50+ 次工具调用**
- 上下文窗口累积至 **数万 token**
- 涉及 deep research、coding agent（Claude Code、Cursor）、自主任务完成（Manus）等场景

**Prompt Caching 面临的核心矛盾**：

> *"Tool results often contain user-specific data that will not benefit other sessions. The interleaving of static system prompts with dynamic tool outputs complicates cache reuse."*

静态系统提示词与动态工具输出的交错使得缓存复用变得复杂。

---

## 四、实验方法论（Section 3）

### 4.1 实验配置

| 配置项 | 详情 |
|--------|------|
| **模型** | GPT-5.2, GPT-4o, Claude Sonnet 4.5, Gemini 2.5 Pro |
| **基准测试** | DeepResearch Bench（100个PhD级研究问题，覆盖22个领域） |
| **会话数量** | 每种缓存条件 40 个独立会话，总计 500+ 会话 |
| **系统提示词** | 10,000 token（含代理指令、工具用法、问题分解策略等） |
| **Agent框架** | Deep Agents (LangChain)，执行迭代式 web search |
| **上下文隔离** | 每个会话从全新上下文开始 |

### 4.2 四种缓存策略（核心实验设计）

论文通过在提示词中插入 **UUID** 来精确控制缓存边界，设计了四种条件：

#### ① No Cache（基线）
- **方法**：在系统提示词 **开头** 加入 UUID
- **效果**：立即打破缓存，强制模型重新计算所有 token
- **意义**：模拟在系统提示词中包含动态内容（时间戳、用户信息）的真实场景

> *"Symbolizes including dynamic content, such as timestamps and user information, to the system prompt on inference time."*

#### ② Full Context Caching（全上下文缓存）
- **方法**：不添加任何 UUID，让提供商自动缓存
- **效果**：提供商自动缓存整个前缀（包括动态内容）
- **意义**：代表最朴素的 "开启缓存" 策略

> *"Naive caching where practitioners enable the feature without additional optimization."*

#### ③ System Prompt Only Caching（仅系统提示词缓存）⭐ 推荐
- **方法**：在系统提示词 **末尾** 加入 UUID
- **效果**：仅缓存静态系统提示词，对话历史和工具调用重新计算

> *"Only the static system prompt is cached, while the dynamic conversation history, tool calls, and tool results are recomputed on each request."*

#### ④ Exclude Tool Results（排除工具结果缓存）
- **方法**：在系统提示词末尾 **和** 每个工具结果后都加入 UUID
- **效果**：缓存系统提示词和对话结构，但排除动态工具返回值

> *"Tool results, which are dynamic and session-specific, do not contribute to the cache."*

### 4.3 评估指标

**API 成本**：
- 区分 standard input tokens、cached input tokens (cache reads)、cache creation tokens (cache writes)
- 按各提供商定价计算

**定价对比表（2026年1月）**：

| 提供商/模型 | Input | Output | Cached Input | Cache Write |
|------------|-------|--------|-------------|------------|
| OpenAI GPT-4o | $2.50/M | $10.00/M | $1.25/M | — |
| OpenAI GPT-5.2 | $1.75/M | $14.00/M | $0.175/M | — |
| Anthropic Claude Sonnet 4.5 | $3.00/M | $15.00/M | $0.30/M | $3.75/M |
| Google Gemini 2.5 Pro (≤200K) | $1.25/M | $10.00/M | $0.125/M | — |

> 注：缓存 token 价格仅为标准输入价格的 **10%**（90% 折扣）

**TTFT (Time to First Token)**：
> *"Time from request initiation to receipt of the first response chunk... captures the latency improvement from skipping prefill computation on cached tokens."*

### 4.4 实验流程控制

- **Cache 预热**：每次实验前执行 warmup calls，单独记录 cache creation tokens
- **Cache 过期隔离**：不同缓存条件之间等待超过 **24小时**，确保 cache 条目过期
- **统计检验**：独立样本 t 检验，α = 0.05，每种条件 n = 40

---

## 五、实验结果（Section 4）

### 5.1 总体结果

**各模型最佳缓存策略表现**：

| 模型 | 最佳策略 | 成本节省 | TTFT改善 |
|------|---------|---------|---------|
| **GPT-5.2** | Exclude Tool Results | **79.6%** | **13.0%** |
| **Claude Sonnet 4.5** | System Prompt | **78.5%** | **22.9%** |
| **Gemini 2.5 Pro** | System Prompt | **41.4%** | **6.1%** |
| **GPT-4o** | System Prompt | **45.9%** | **30.9%** |

> 所有改善均通过统计显著性检验 (p < 0.05)

### 5.2 完整策略对比

#### GPT-5.2

| 缓存策略 | 成本节省 | TTFT改善 |
|---------|---------|---------|
| Full Context | 79.3% | 9.5% |
| System Prompt | 81.4% | 10.5% |
| Exclude Tool Results | 79.6% | 13.0% |

#### Claude Sonnet 4.5

| 缓存策略 | 成本节省 | TTFT改善 |
|---------|---------|---------|
| Full Context | 77.8% | 21.8% |
| System Prompt | 78.5% | 22.9% |
| Exclude Tool Results | 78.1% | 20.9% |

#### Gemini 2.5 Pro

| 缓存策略 | 成本节省 | TTFT改善 |
|---------|---------|---------|
| Full Context | 38.3% | 6.0% |
| System Prompt | 41.4% | 6.1% |
| Exclude Tool Results | 27.8% | **-2.9%** ⚠️ |

#### GPT-4o

| 缓存策略 | 成本节省 | TTFT改善 |
|---------|---------|---------|
| Full Context | 47.8% | **-8.8%** ⚠️ |
| System Prompt | 45.9% | 30.9% |
| Exclude Tool Results | 46.8% | 28.1% |

### 5.3 关键发现

**发现1：成本节省在所有策略间高度一致**
- 同一模型下，不同策略的成本节省差异通常在 **2-4个百分点** 以内
- 系统提示词是成本节省的主要驱动力

**发现2：TTFT表现差异显著，且策略敏感**
- Full Context 缓存在某些模型上出现 **延迟退化** （GPT-4o: -8.8%, Gemini: -2.9%）
- System Prompt Only 在所有模型上表现最稳定

**发现3：全上下文缓存的悖论**

> *"Naively enabling full-context caching can paradoxically increase latency, as dynamic tool calls and results may trigger cache writes for content that will not be reused across sessions."*

全上下文缓存会为不会被复用的动态内容触发 cache write，引入额外开销。

---

## 六、深度讨论（Section 5）

### 6.1 策略性缓存边界控制

**核心原则**：

> *"Ensure that only stable, reusable content is cached. In agentic applications, the system prompt is the most stable component, containing agent instructions, tool definitions, and persona guidelines that remain constant across sessions."*

**具体建议**：
1. **禁止在系统提示词中嵌入动态值**：时间戳、session ID、用户信息都不应出现在系统提示词中
2. **动态内容放末尾**：如果必须包含动态信息，放在系统提示词末尾以 *"maximize the cacheable prefix"*
3. **避免动态函数调用**：使用 MCP 等协议的系统应 *"maintain a fixed set of general-purpose, reusable functions while implementing dynamic capabilities through code generation rather than traditional function calling"*

### 6.2 工具调用的缓存权衡

> *"For tool calls that produce variable results or are unlikely to be repeated, caching provides no benefit and may introduce overhead."*

**关键洞察**：上下文管理技术（如总结、剪枝旧的工具调用）会 **破坏已缓存的表示**：

> *"Context management strategies (summarizing or pruning old tool calls) break cached representations, making tool call caching counterproductive."*

**最佳实践**：保持系统提示词稳定用于缓存，将工具调用视为动态内容。

### 6.3 提供商实现差异

| 差异维度 | 说明 |
|---------|------|
| 最小token阈值 | OpenAI/Anthropic: 1,024 vs Google: 4,096 |
| TTL时长 | 5分钟 ~ 24小时 |
| 激活方式 | OpenAI自动 vs Anthropic显式 vs Google双模式 |
| 安全考量 | Prompt caching 可能引入 timing side-channel 攻击 |

> *"Practitioners should conduct experiments representative of their workloads and usage patterns rather than relying solely on published benchmarks."*

---

## 七、消融实验（Section 6）

### 7.1 按系统提示词大小消融（500 ~ 50,000 tokens）

**核心发现：成本节省随提示词大小线性增长**

| 提示词大小 | GPT-5.2 成本节省 | Claude Sonnet 4.5 | GPT-4o |
|-----------|----------------|-------------------|--------|
| 500 tokens | 10-45%（modest） | — | — |
| 10,000 tokens | ~80% | ~78% | ~46% |
| 50,000 tokens | **89%** ($0.253→$0.029) | **88%** ($0.667→$0.080) | **54%** ($0.414→$0.192) |

**TTFT 关键阈值效应**：
- **500 tokens（低于最小阈值）**：出现 TTFT **退化 10-18%**
  > *"Expected behavior, as the caching mechanism cannot activate below the threshold."*
- **2,000+ tokens（超过阈值后）**：TTFT 改善为正值并随提示词大小增长
- **50,000 tokens**：GPT-4o 达到 **60% TTFT 改善**（4,290ms → 1,699ms）

### 7.2 按工具调用次数消融（3 ~ 50 次）

**核心发现：成本节省不受工具调用次数影响**

| 模型 | 工具调用次数 | 成本节省范围 |
|------|------------|------------|
| GPT-5.2 | 3-50次 | **77-81%**（稳定） |
| GPT-4o | 3-50次 | **42-53%**（稳定） |

**TTFT 表现**：
- GPT-4o：在所有工具调用次数下保持 **16-36% 改善**
- Claude Sonnet 4.5：随工具调用增加出现 **收益递减**（3次: 19% → 50次: 5%）

### 7.3 消融实验结论

> *"The cacheable prefix length, primarily determined by the system prompt, is the dominant factor in caching effectiveness."*

**三个关键结论**：
1. **成本节省普遍为正**：所有模型、所有提示词大小、所有工具调用次数下，prompt caching 都能降低成本
2. **提示词大小比工具调用次数更重要**：可缓存前缀长度（由系统提示词决定）是缓存效果的主导因素
3. **TTFT 改善需要满足最小阈值**：低于阈值时不仅无改善，还可能退化

---

## 八、实践建议总结

基于论文发现，面向工程实践的建议：

### ✅ 推荐做法

| # | 建议 | 原因 |
|---|------|------|
| 1 | **启用 Prompt Caching** | 所有场景下成本节省 41-80%，稳定可靠 |
| 2 | **优先使用 System Prompt Only 策略** | 在成本和延迟两个维度上表现最一致 |
| 3 | **系统提示词保持静态** | Agent 指令、工具定义、persona 指南跨会话不变 |
| 4 | **增大系统提示词至 1,024+ tokens** | 满足最小阈值，且成本节省随大小线性增长 |
| 5 | **使用固定的通用函数集** | 通过代码生成而非动态函数调用实现灵活性 |
| 6 | **针对自己的工作负载做实验** | 不同提供商和场景差异显著 |

### ❌ 避免做法

| # | 反模式 | 后果 |
|---|--------|------|
| 1 | 在系统提示词中放时间戳/session ID | 破坏缓存前缀匹配 |
| 2 | 盲目启用全上下文缓存 | 可能 **反向增加延迟**（悖论性退化） |
| 3 | 对不可复用的工具结果做缓存 | 引入写缓存开销但无读缓存收益 |
| 4 | 对对话历史做总结/剪枝后仍期望缓存生效 | 破坏已有的缓存表示 |

---

## 九、局限性

1. **评估范围有限**：仅覆盖 3 个提供商 4 个模型，结果可能不适用于其他提供商或未来模型版本
2. **基准任务单一**：仅使用 DeepResearch Bench（web search 任务），其他类型代理工作负载可能有不同表现
3. **TTFT 测量噪声**：*"TTFT measurements exhibit natural variance due to factors including server load, network conditions, and provider infrastructure"*
4. **提供商政策可变**：定价和功能反映 2026 年 1 月快照，*"subject to change"*
5. **仅评估会话内缓存**：每个会话从全新上下文开始，未评估跨会话缓存复用

---

## 十、个人思考与延伸

### 10.1 对 Agent 系统设计的启示

- **系统提示词即资产**：它不仅是指令载体，更是成本优化的核心杠杆。精心设计一个大而全面的系统提示词（10K-50K tokens）反而能带来更大的成本节省
- **静态-动态分离架构**：Agent 架构设计时应清晰区分静态内容（系统提示词、工具定义）和动态内容（对话历史、工具结果），这种分离直接影响缓存效率
- **"Don't Break the Cache" 的本质**：任何打破前缀匹配的操作（如在系统提示词中注入时间戳）都会使缓存失效，这个标题本身就是最重要的实践指导

### 10.2 与 Context Engineering 的关系

论文揭示了一个有趣的张力：
- 上下文管理技术（总结、剪枝）有助于控制上下文窗口大小
- 但这些技术会 **破坏缓存**

这意味着在设计 Agent 时需要在 **上下文管理** 和 **缓存效率** 之间做权衡。

### 10.3 未来研究方向

- 跨会话缓存复用的评估
- 不同类型代理工作负载（coding、data analysis）的缓存效果
- 缓存感知的 Agent 架构设计
- Prompt caching 的安全性（timing side-channel attacks）深入分析

---

## 附：关键术语表

| 术语 | 定义 |
|------|------|
| **Prompt Caching** | 提供商级 API 功能，复用已计算的 KV 张量以避免重复计算 |
| **KV Cache** | 推理级缓存，存储注意力层的 Key-Value 张量 |
| **Exact Prefix Matching** | 缓存命中条件：新请求的前缀必须与缓存完全匹配 |
| **TTFT** | Time to First Token，从请求发起到收到第一个响应 token 的时间 |
| **Cache Boundary** | 缓存边界，通过控制哪些内容被缓存来优化效率 |
| **TTL** | Time-to-Live，缓存条目的有效期 |
| **Long-horizon Agentic Tasks** | 需要大量工具调用的多轮复杂代理任务 |
| **DeepResearch Bench** | 多轮代理基准测试，包含100个PhD级研究问题 |

---

*精读完成于 2026-03-08*
