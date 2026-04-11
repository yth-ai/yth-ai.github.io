---
title: "Agent、工具使用与未来展望"
description: "从 Chat 到 Agent——LLM 如何从对话工具走向自主行动者"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 16
part: "第五部分：前沿与展望"
partOrder: 5
tags: ["Agent", "工具使用", "RAG", "MCP", "推理模型", "未来"]
---

## 从对话到行动

传统的 LLM 交互模式是**一问一答**——用户提问，模型回答。但一个真正有用的 AI 助手需要的不仅是"说"，还要能"做"：

```
用户: "帮我查一下北京明天的天气，如果下雨就取消我的户外日程"

传统 LLM: "我无法访问实时天气数据，也无法操作您的日历..."

Agent LLM:
  1. [调用天气 API] → 北京明天：小雨，14°C
  2. [调用日历 API] → 发现"公园跑步"日程
  3. [调用日历 API] → 取消"公园跑步"
  4. 回复: "北京明天有小雨，已帮您取消公园跑步。"
```

**LLM Agent** 是以 LLM 为"大脑"，配备工具、记忆和规划能力的自主系统。

## Agent 架构

### 核心组件

一个完整的 Agent 系统通常包含四个核心组件：

```
┌─────────────────────────────────────┐
│            Agent 系统                │
│                                     │
│  ┌──────────┐  ┌──────────────┐    │
│  │  规划器   │  │    记忆系统   │    │
│  │ (Planner) │  │   (Memory)   │    │
│  └────┬─────┘  └──────┬───────┘    │
│       │               │            │
│  ┌────▼───────────────▼────────┐   │
│  │         LLM（大脑）          │   │
│  └────────────┬────────────────┘   │
│               │                    │
│  ┌────────────▼────────────────┐   │
│  │       工具集 (Tools)          │   │
│  │  搜索 │ 代码 │ API │ 文件    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 规划（Planning）

Agent 需要将复杂任务分解为可执行的步骤。常见的规划策略：

**[ReAct](https://arxiv.org/abs/2210.03629)**（Yao et al., 2023）——交替进行推理（Reasoning）和行动（Acting）：

```
Thought: 我需要查找北京明天的天气
Action: weather_api(city="北京", date="明天")
Observation: 小雨, 14°C, 东风3级
Thought: 天气是下雨，需要检查用户的户外日程
Action: calendar_search(type="outdoor", date="明天")
Observation: 找到: "公园跑步" 9:00-10:00
Thought: 需要取消这个户外日程
Action: calendar_cancel(event_id="xxx")
Observation: 已取消
Thought: 任务完成，汇报结果
Answer: 北京明天有小雨，已帮您取消公园跑步。
```

**[Plan-and-Execute](https://arxiv.org/abs/2305.04091)**——先制定完整计划，再逐步执行：

```
Plan:
  1. 查询北京明天天气
  2. 判断是否下雨
  3. 如果下雨，搜索户外日程
  4. 取消找到的户外日程
  5. 汇报结果

Execute: [逐步执行上述计划]
```

**[Tree-of-Thought](https://arxiv.org/abs/2305.10601)**——探索多条推理路径，选择最佳：

```
        [问题]
       /   |   \
    [路径A] [路径B] [路径C]
     ↓       ↓       ↓
   评估     评估     评估
     ↓
  [选择最优路径继续]
```

### 记忆系统

| 类型 | 实现 | 用途 |
|------|------|------|
| **短期记忆** | 上下文窗口内的对话历史 | 当前任务的上下文 |
| **工作记忆** | 结构化的 scratchpad | 中间推理结果 |
| **长期记忆** | 向量数据库 + 检索 | 跨会话的知识 |
| **外部知识** | RAG / 搜索引擎 | 实时信息获取 |

## 工具使用（Tool Use / Function Calling）

### 工具调用机制

现代 LLM 通过 **function calling** 机制调用外部工具：

```json
// 工具定义
{
  "name": "search_web",
  "description": "搜索互联网获取实时信息",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {"type": "string", "description": "搜索关键词"},
      "max_results": {"type": "integer", "default": 5}
    },
    "required": ["query"]
  }
}

// 模型输出（决定调用工具）
{
  "tool_calls": [{
    "function": {
      "name": "search_web",
      "arguments": "{\"query\": \"北京明天天气\"}"
    }
  }]
}
```

### MCP（Model Context Protocol）

[MCP](https://modelcontextprotocol.io/)（Anthropic, 2024）是一个标准化的 Agent-工具通信协议：

```
┌─────────┐     MCP      ┌─────────────┐
│  LLM    │◄────────────►│  MCP Server  │
│  Agent  │   标准协议     │  (工具提供者) │
└─────────┘              └─────────────┘
                              │
                         ┌────┴────┐
                    [GitHub] [Slack] [DB] ...
```

MCP 的价值：
- **标准化**：一套协议连接所有工具，不用为每个工具写适配器
- **安全**：权限控制、审计日志
- **可发现**：工具可以自描述其能力
- **互操作**：不同的 LLM/Agent 框架都能使用同一套工具

### 工具使用训练

教模型正确使用工具需要专门的训练：

| 方法 | 思路 | 代表 |
|------|------|------|
| SFT on tool data | 在工具调用数据上微调 | [Gorilla](https://arxiv.org/abs/2305.15334) |
| Self-play | 模型自己生成工具使用轨迹 | [Toolformer](https://arxiv.org/abs/2302.04761) |
| RL with tool feedback | 工具执行结果作为奖励信号 | [ToolRL](https://arxiv.org/abs/2404.07995) |

[Toolformer](https://arxiv.org/abs/2302.04761)（Schick et al., 2023, Meta）的方法特别优雅——让模型自己决定在文本中"何时"、"何处"插入工具调用，用工具返回结果是否降低 PPL 作为选择标准。

## RAG（检索增强生成）

### 基本架构

[RAG](https://arxiv.org/abs/2005.11401)（Lewis et al., 2020）将检索系统与生成模型结合，解决 LLM 的知识过时和幻觉问题：

```
用户查询 → [Embedding 模型] → 查询向量
                                ↓
                    [向量数据库检索] → Top-K 相关文档
                                ↓
        [用户查询 + 检索到的文档] → LLM → 回答
```

### RAG 系统组件

| 组件 | 选项 | 说明 |
|------|------|------|
| Embedding 模型 | [BGE](https://huggingface.co/BAAI/bge-large-en-v1.5), [E5](https://arxiv.org/abs/2212.03533), [GTE](https://huggingface.co/thenlper/gte-large) | 将文本转为向量 |
| 向量数据库 | [Milvus](https://milvus.io/), [Pinecone](https://www.pinecone.io/), [Chroma](https://www.trychroma.com/) | 高效相似度搜索 |
| 文档处理 | 切分、清洗、元数据提取 | 预处理管线 |
| 重排序 | [Cohere Reranker](https://cohere.com/rerank), BGE-Reranker | 精排提高质量 |

### 高级 RAG 技术

**Chunk 策略**对 RAG 质量影响巨大：

```
固定长度切分:  [512 tokens] [512 tokens] ...  → 简单但可能切断语义
语义切分:     [段落A] [段落B] [段落C] ...       → 保持语义完整
层次切分:     [文档摘要] → [章节摘要] → [段落]   → 多粒度检索
```

**[Self-RAG](https://arxiv.org/abs/2310.11511)**（Asai et al., 2023）让模型自己决定是否需要检索：

```
生成过程中:
  Token Token Token [NEED_RETRIEVE] → 触发检索
  → 检索结果注入
  → [IS_RELEVANT] Token Token Token [CITE] → 带引用继续生成
```

## 代码 Agent

### Coding Agent

编程 Agent 是目前最成功的 Agent 应用之一：

| 系统 | 能力 | 评估 |
|------|------|------|
| [Cursor](https://cursor.sh/) | IDE 内代码生成/编辑 | 工业应用最广 |
| [Devin](https://devin.ai/) | 端到端软件工程 | [SWE-Bench 13.86%](https://arxiv.org/abs/2403.08299) |
| [SWE-Agent](https://arxiv.org/abs/2405.15793) | 自动修复 GitHub issue | SWE-Bench SOTA |
| [OpenHands](https://github.com/All-Hands-AI/OpenHands) | 开源 Coding Agent | 社区活跃 |

### 代码 Agent 的工作流

```
1. 理解问题 → 阅读 issue / 用户描述
2. 探索代码库 → 搜索相关文件、理解架构
3. 定位问题 → 找到需要修改的文件和位置
4. 编写代码 → 生成 patch / 新代码
5. 测试验证 → 运行测试、检查结果
6. 迭代修复 → 如果测试失败，分析原因并重试
```

## 推理模型（Reasoning Models）

### o1/o3 与 DeepSeek R1

推理模型（Reasoning Models）代表了 LLM 的一个新范式——**在推理时通过延长思考来提升能力**：

[OpenAI o1](https://openai.com/index/learning-to-reason-with-llms/)（2024）和 [DeepSeek R1](https://arxiv.org/abs/2501.12948)（2025）是这一方向的标志性工作。

核心思想是 **Test-Time Compute Scaling**：

```
传统模型: 输入 → [固定计算量] → 输出
推理模型: 输入 → [可变计算量: 思考链可以很长] → 输出

简单问题: 短 CoT → 快速回答
困难问题: 长 CoT (数千 token 的推理) → 仔细推导
```

### 推理模型的训练

DeepSeek R1 的训练流程揭示了推理能力是如何涌现的：

```
阶段 1: Cold Start（少量推理示例 SFT）
  → 模型学会基本的 CoT 格式

阶段 2: RL (GRPO)
  → 用数学/代码的正确性作为奖励
  → 模型自发学会更长、更深入的推理
  → "Aha moment"：模型学会自我纠错

阶段 3: Rejection Sampling + SFT
  → 用 RL 模型采样高质量推理数据
  → SFT 训练更稳定的推理模型

阶段 4: 再次 RL
  → 进一步精炼
```

关键发现：**推理能力可以通过 RL 自发涌现**——不需要人类编写详细的推理步骤，只需要给正确答案的奖励，模型就会自己学会推理。

### 推理模型蒸馏

DeepSeek 发现 R1 的推理能力可以有效蒸馏到小模型：

| 蒸馏模型 | 基座 | AIME 2024 | MATH-500 |
|---------|------|-----------|----------|
| R1-1.5B | Qwen2.5-1.5B | 28.9% | 83.9% |
| R1-7B | Qwen2.5-7B | 55.5% | 92.8% |
| R1-14B | Qwen2.5-14B | 69.7% | 93.9% |
| R1-32B | Qwen2.5-32B | 72.6% | 94.3% |
| R1-70B | LLaMA-3.3-70B | 79.8% | 94.5% |

小模型通过蒸馏获得的推理能力，甚至超过了直接 RL 训练的效果。

## Multi-Agent 系统

### 多 Agent 协作

复杂任务可以由多个专门化的 Agent 协作完成：

```
┌──────────┐
│ Planner  │ → 分解任务、分配给专家
└─────┬────┘
      │
  ┌───┴───┬───────┬──────┐
  ▼       ▼       ▼      ▼
[Coder] [Writer] [Researcher] [Reviewer]
  │       │       │            │
  └───────┴───────┴────────────┘
                  │
            ┌─────▼─────┐
            │ Integrator │ → 整合结果
            └───────────┘
```

代表框架：

| 框架 | 特点 | 适用场景 |
|------|------|---------|
| [AutoGen](https://github.com/microsoft/autogen) | 多 Agent 对话 | 通用协作 |
| [CrewAI](https://github.com/crewAIInc/crewAI) | 角色化 Agent 团队 | 业务流程 |
| [LangGraph](https://github.com/langchain-ai/langgraph) | 图结构工作流 | 复杂状态管理 |
| [MetaGPT](https://arxiv.org/abs/2308.00352) | SOP 驱动 | 软件开发 |

### Agent 安全

Agent 能"做事"也意味着能"搞破坏"。安全考量：

1. **权限最小化**：Agent 只应获得完成任务所需的最小权限
2. **人类确认**：关键操作（删除、支付、发送）前需人类确认
3. **沙箱执行**：代码执行在隔离环境中进行
4. **审计日志**：所有工具调用都需要记录
5. **输入验证**：防止注入攻击（prompt injection 通过工具输出注入恶意指令）

## 未来展望

### 1. 更长的上下文窗口

从 4K → 32K → 128K → 1M+ tokens，更长的上下文意味着：
- 更完整的文档理解
- 更长的对话记忆
- 减少 RAG 的依赖（直接把文档放进上下文）

但长上下文不是万能药——[Lost in the Middle](https://arxiv.org/abs/2307.03172) 研究表明模型在长上下文中间部分的信息检索能力显著下降。

### 2. 更高效的训练

- **数据效率**：用更少的数据达到同样的能力（合成数据、课程学习）
- **计算效率**：新的架构（如 [Mamba](https://arxiv.org/abs/2312.00752) 等 SSM）减少训练 FLOPs
- **通信效率**：更好的并行策略减少 GPU 间通信开销

### 3. 个性化与定制

让每个用户拥有"自己的" AI：
- 长期记忆：记住用户的偏好、习惯、历史
- 风格适应：根据用户沟通风格调整输出
- 领域专精：通过少量数据快速适应特定领域

### 4. 端侧模型

| 趋势 | 代表 | 意义 |
|------|------|------|
| 手机端 LLM | Apple Intelligence, Gemini Nano | 隐私保护、离线可用 |
| PC 端 LLM | Copilot+ PC, 本地 Ollama | 低延迟、无 API 成本 |
| 嵌入式 LLM | TinyLLM, Phi-3-mini | IoT、机器人 |

### 5. 科学发现

LLM 正在从"工具"走向"科学家"：
- [AlphaFold](https://www.nature.com/articles/s41586-021-03819-2)（蛋白质结构预测）
- [FunSearch](https://www.nature.com/articles/s41586-023-06924-6)（数学发现）
- 药物发现、材料科学、气候建模

### 6. 安全与对齐的长期挑战

随着模型能力增强，安全问题也在升级：

- **Scalable Oversight**：如何监督比人类更强的 AI？
- **Deceptive Alignment**：模型是否可能"假装"对齐？
- **Value Lock-in**：如何确保 AI 的价值观随社会演化？
- **Catastrophic Risk**：如何防止高能力 AI 系统的灾难性失败？

## 写在最后

大模型正处于一个**技术爆炸**的时代。从 GPT-3 到 GPT-5，从 Chat 到 Agent，从纯文本到多模态——每半年都有让人惊叹的进展。

但在兴奋之余，有几个原则值得铭记：

1. **基础比前沿重要**：理解 Transformer 的数学、Scaling Laws 的物理、数据工程的细节，比追赶最新论文更有价值
2. **工程和科学同样重要**：一个好的分布式训练系统、一套可靠的评估基础设施、一条高效的数据管线——这些"不性感"的工作，往往决定了项目的成败
3. **保持批判性思维**：不要盲目相信 benchmark 数字，不要轻信模型的输出，不要低估安全问题的复杂性
4. **动手实践**：读一百篇论文不如训一个小模型。从 NanoGPT 开始，亲手体验训练的每一个环节

这本书的目标不是让你"知道"大模型，而是让你**有能力动手做**。希望它能成为你在这个激动人心的领域中的可靠参考。

> *"The best way to predict the future is to invent it."* — Alan Kay

持续更新中。有问题、建议或勘误，欢迎联系作者。
