---
title: "WildToolBench 精读：真实场景下的 LLM 工具使用评测"
description: "ICLR 2026 Poster——构建真实场景工具使用 Benchmark"
date: 2026-03-11
category: 论文精读
tags: ["Tool Use", "Benchmark", "ICLR 2026"]
paperTitle: "WildToolBench: Benchmarking LLM Tool-Use in the Wild"
draft: false
---
# WildToolBench: Benchmarking LLM Tool-Use in the Wild — 论文精读

> **论文标题**: Benchmarking LLM Tool-Use in the Wild
> **作者**: Peijie Yu, Wei Liu, Yifan Yang, Jinjian Li, Zelong Zhang, Xiao Feng, Feng Zhang
> **会议**: ICLR 2026 (Poster)
> **OpenReview**: https://openreview.net/forum?id=yz7fL5vfpn
> **代码**: https://github.com/yupeijei1997/WildToolBench

---

## 一、研究动机与核心问题

WildToolBench 这篇论文的出发点非常尖锐：现有的 LLM 工具使用（tool-use）基准测试忽略了真实用户行为的复杂性，导致我们观察到的所谓"模型能力进步"可能是虚假的。

论文的 TL;DR 一句话概括了核心发现：

> **"WildToolBench reveals that what truly challenges LLM tool-use is not artificial complexity, but simple, realistic user behaviors."**

这里的 "artificial complexity" 指的是现有 benchmark（如 ToolBench）中人为设计的复杂多工具调用链，而 "realistic user behaviors" 指的是真实用户交互中那些看似简单、实则对模型极具挑战性的行为模式。

论文摘要中的关键表述：

> **"Fulfilling user needs through Large Language Model multi-turn, multi-step tool-use is rarely a straightforward process. Real user interactions are inherently wild, being intricate, messy, and flexible."**

"wild"（野生）这个词是全文的核心隐喻。真实用户不会像 benchmark 设计者那样提出结构化、明确的指令，他们的行为是 intricate（错综复杂）、messy（混乱）和 flexible（灵活多变）的。

---

## 二、三大用户行为挑战

论文从真实用户行为中识别出三个被现有 benchmark 忽略的关键挑战维度：

### 2.1 Combinatory Tasks（组合任务）

> **"Combinatory tasks requiring orchestration of tool-call topologies."**

组合任务不是简单的顺序工具调用链，而是需要模型理解和编排工具调用的**拓扑结构**（topology）。这意味着模型需要判断哪些工具调用之间存在依赖关系、哪些可以并行执行、哪些需要串行执行，以及如何在多个工具之间正确传递参数。

在数据生成框架中，组合任务对应多种任务类型的组合：
- **ST（Single Tool）**：单工具调用
- **MT（Multi Tool）**：多工具组合调用

这些类型可以在不同层级（layer）中自由组合，形成复杂的调用拓扑。

### 2.2 Implicit Intent（隐式意图）

> **"Implicit intents scattered across multi-turn dialogues, demanding contextual inference."**

隐式意图是指用户的真实需求不是一次性完整表达的，而是**分散在多轮对话中**，模型需要进行跨轮次的上下文推理才能正确理解。

论文给出了一个非常直观的例子：
- **第 1 轮**：用户请求"我需要最新的 5 张动漫壁纸"，模型返回包含 ID 的壁纸列表
- **第 2 轮**：用户追问"第三张壁纸的上传者是谁？"

```
User: Who is the uploader of the third wallpaper?
Planner: getWaifuDetails(image_id=778899)
```

在第 2 轮中，"第三张壁纸"是一个**指代消解**（coreference resolution）问题。模型必须回溯到第 1 轮的返回结果，识别出"第三张"对应的 image_id 是 778899，然后才能正确调用 `getWaifuDetails` 工具。这正是 "Continue Question User Agent" 在数据生成框架中的核心职责。

### 2.3 Instruction Shift（指令转换）

> **"Instruction shifts mixing task queries, clarifications, and casual dialogue, forcing LLMs to dynamically adjust their strategies."**

指令转换描述的是真实对话中用户表达方式的频繁切换：用户可能在一轮中给出明确的任务指令，下一轮提出澄清性问题，再下一轮突然插入闲聊。模型需要能够**实时识别用户当前的交互模式**并动态调整自己的策略。

在数据生成框架中，这对应的任务类型包括：
- **CQ（Continue Question）**：基于前文结果提出后续隐含查询
- **CC（Casual Chat）**：随意闲聊或偏离任务的对话

---

## 三、为什么现有 Benchmark 不够？

论文的核心论断是现有 benchmark 上观测到的进步是"虚假的"（spurious）：

> **"Existing benchmarks overlook these behaviors, leading to the observed spurious progress in LLM tool-use."**

具体而言，现有 benchmark 的主要缺陷包括：

1. **任务设计过于结构化**：以 ToolBench 为例，它包含 16,464 个来自 RapidAPI 的真实 API，但其任务指令是明确的、一次性给出的，模型只需理解指令并选择正确工具即可。

2. **缺少真实多轮特性**：大部分现有 benchmark 中的"多轮"仅仅是对话形式上的多轮，而非需要跨轮次推理的"真多轮"。WildToolBench 强调，除第一轮外的所有轮次都是**真正的多轮任务**。

3. **忽略用户行为的不确定性**：现有 benchmark 中的"用户"总是理性的、配合的，不会偏题、不会给出模糊信息、不会在任务中途改变话题。这与现实严重脱节。

---

## 四、WildToolBench 方法论

### 4.1 可控多智能体数据生成框架

WildToolBench 的核心技术贡献是一个**可控多智能体数据生成框架**（Controllable Multi-Agent Data Generation Framework）。该框架设计了五个关键角色：

| Agent 角色 | 职责 | 功能描述 |
|---|---|---|
| **User Agent** | 用户模拟 | 模拟真实用户行为，包括初始用户（提出初始任务）和继续提问用户（根据前文结果提出隐含查询） |
| **Planner Agent** | 任务规划 | 分析用户需求，生成工具调用计划（Action_List），决定下一步是调用工具、询问用户还是直接回答 |
| **Tool Agent** | 工具执行 | 模拟工具的实际执行，根据传入参数返回工具调用结果 |
| **Agent** | 助手回复 | 根据 Planner 的指令向用户提问或生成最终回复 |
| **Checker Agent** | 质量控制 | 检查 Planner 的决策和 Tool 的执行结果是否合理，确保数据质量 |

**Checker 的双重检查机制**是该框架的一大亮点：

1. **Checker (Planner)**：检查 Planner 的决策是否合理。如果决策不合理（例如选错工具、参数传递错误），Checker 会拒绝，Planner 需要重新生成（最多 3 次重试）。
2. **Checker (Tool)**：检查 Tool 的调用参数和返回值是否匹配预期。如果不匹配，Tool 需要重新执行。

### 4.2 数据生成流程

整个数据生成流程可以分为四个阶段：

**阶段一：初始化**
- 加载 `.env` 配置文件，解析命令行参数（层数、各角色模型名称、温度等）
- 根据配置实例化各角色的模型句柄
- 生成任务路径树（`gen_path`），定义任务类型的组合序列（如 ST → MT → CQ → CC）
- 读取预定义工具列表（支持中英文：`tools_zh.jsonl` / `tools_en.jsonl`）

**阶段二：单轮数据生成（`gen_one_data`）**
- 设置随机环境信息（如当前时间）
- 随机选择 User Agent，根据选定工具和任务类型生成第一个任务请求
- 进入交互管道（pipeline）

**阶段三：交互管道（`pipeline`）**
通过 `while True` 循环模拟动态交互：
- 根据上一条消息的发送者（User, Planner, Tool, Agent）决定下一步行动
- User 发起任务 → Planner 决策 → Checker 校验 → 执行（工具调用/询问用户/生成回答）
- 一轮对话结束后，如果未达到总层数限制，User 会基于上下文提出新的相关任务

**阶段四：数据后处理**
生成的数据保留三种格式：
1. **原始生成数据**（Raw Generated Data）：包含所有 Agent 的完整交互记录
2. **精简数据**（Streamlined Data）：移除了 Checker 消息和角色切换消息
3. **各 Agent 捕获数据**（Captured Data）：每个 Agent 视角的独立数据

框架的配置命令展示了其灵活性：

```bash
python3 generate.py \
    --layer-num-total 4 \
    --user-model "deepseek-chat" \
    --planner-model "deepseek-chat" \
    --tool-model "deepseek-chat" \
    --agent-model "deepseek-chat" \
    --checker-model "deepseek-chat"
```

`--layer-num-total` 参数控制生成的任务层级数，每一层对应一轮对话。各个 Agent 可以使用不同的底座模型，这使得研究者可以探索不同模型组合的效果。

### 4.3 核心技术创新点

> 论文声明的核心创新在于 WildToolBench 能够 **"覆盖任意数量任务的所有可能动作空间"**，并且除第一轮外，**"全部是真正的多轮任务"**。

这里的"所有可能动作空间"指的是框架不限制工具调用的拓扑结构，可以生成任意复杂度的任务组合。而"真正的多轮"则意味着每一轮的任务都依赖前文上下文，模型无法孤立地处理单个轮次。

---

## 五、实验结果与关键发现

### 5.1 模型评估概况

论文进行了大规模的模型评估，覆盖了 57 个 LLM：

> **"Comprehensive evaluations of 57 LLMs reveal that no model achieves an accuracy of more than 15%, indicating a substantial gap in the robustness of LLMs' agentic ability."**

57 个模型涵盖了当前主流的开源和闭源模型（推测包括 GPT-4 系列、Claude 系列、Qwen 系列、Llama 系列等）。**没有任何模型的准确率超过 15%**，这与现有 benchmark 上的表现形成了鲜明对比——例如在 ToolBench 上，GPT-4 使用 DFSDT 方法可以达到 71.1% 的通过率。

这个数据的震撼之处在于，即使是最先进的闭源模型，在面对"野生"用户行为时，也只能正确完成不到 15% 的任务。

### 5.2 关键发现：真正的瓶颈不是复杂度

> **"Controlled experiments and in-depth analyses further indicate that the real challenge for LLM tool-use lies not in artificially complex tasks, but in the wild nature of user behavior, emphasizing the need to reconsider the interactions among LLMs, users, and tools."**

论文通过受控实验（controlled experiments）证明了：
- **人工复杂度不是主要瓶颈**：在现有 benchmark 上，模型通过学习结构化的复杂调用序列获得了较好性能
- **真实性才是真正的瓶颈**：用户行为的"野生"特性（不可预测性、灵活性、混乱性）才是模型无法应对的真正挑战

这意味着学界和工业界可能需要从根本上重新思考三个关键要素之间的关系：LLM 本身的能力、用户与 LLM 的交互方式、以及工具与 LLM 的集成方式。

### 5.3 性能差距分析

从 ToolBench 的 71.1%（GPT-4 最佳成绩）到 WildToolBench 的不足 15%，性能下降超过了 56 个百分点。这个巨大的差距说明：

1. **泛化能力严重不足**：模型在结构化 benchmark 上的高分并不能代表其在真实场景中的表现
2. **鲁棒性存在巨大缺口**：即使微小的用户行为变化（如隐含引用、话题切换）就能导致模型失败
3. **评估方法需要革新**：仅依靠人工构造的 benchmark 来评判模型的 tool-use 能力是不充分的

---

## 六、数据集与评估方法

### 6.1 数据集

WildToolBench 的测试数据存储在 `wild-tool-bench/data/Wild-Tool-Bench.jsonl`，采用 JSONL 格式。数据集的核心特征是：

- **基于真实用户行为模式**：而非 API 文档驱动的任务构造
- **真正的多轮交互**：除第一轮外，每一轮都需要上下文推理
- **覆盖三大挑战维度**：组合任务、隐式意图、指令转换

### 6.2 评估流程

评估分为两步：

**推理（Inference）**：使用 OpenAI 格式的 API 调用被测模型
```bash
cd wild-tool-bench/
python3 -u -m wtb.openfunctions_evaluation --model=deepseek-chat
```

**评估（Evaluation）**：对模型的预测结果进行评分
```bash
cd wild-tool-bench
python3 -u -m wtb.eval_runner --model=deepseek-chat
```

评估指标推测主要包括准确率（Accuracy），即模型正确完成整个多轮任务的比例。由于每个任务都包含多个轮次和多个工具调用，只有所有步骤都正确才算任务完成，这使得评估标准非常严格。

---

## 七、与现有工作的对比

### 7.1 与 ToolBench 的对比

| 对比维度 | ToolBench | WildToolBench |
|---|---|---|
| **数据来源** | RapidAPI 的 16,464 个真实 API | 基于真实用户行为模式的多智能体生成 |
| **任务形式** | 明确、结构化的单次指令 | 多轮、隐含、混合模式的"野生"交互 |
| **评估难度** | GPT-4 可达 71.1% 通过率 | 57 个模型均不超过 15% 准确率 |
| **多轮特性** | 部分支持 | 全部为真正的多轮任务（除首轮） |
| **用户模拟** | 较为理想化 | 模拟真实用户的混乱行为 |
| **质量控制** | 人工标注 + LLM 评判 | Checker Agent 双重质量校验 |

### 7.2 更广泛的相关工作

论文在 Related Work 中还对比了以下 benchmark：
- **API-Bank**：API 级别的 benchmark
- **ToolAlpaca**：工具学习的数据和模型
- **MINT-Bench**（ICLR 2024）：多工具交互基准
- **T-Eval**：工具评估框架
- **TaskBench**：任务导向基准
- **MetaTool**：元工具学习方法

WildToolBench 与这些工作的核心差异在于：它不仅关注"模型能否正确调用工具"，更关注"模型能否在真实的、混乱的用户交互中正确使用工具"。

---

## 八、论文的启示与局限

### 8.1 对 LLM Agent 研究的启示

1. **重新定义 benchmark 设计理念**：benchmark 不应该追求"人工复杂度"，而应该追求"真实性"。简单但真实的用户行为可能比精心设计的复杂任务更能暴露模型的短板。

2. **训练数据需要覆盖"野生"行为**：如果模型仅在结构化数据上训练，它将无法泛化到真实场景。训练数据中需要包含隐式引用、话题切换、模糊表达等真实用户行为。

3. **LLM-User-Tool 三角关系需要重新设计**：当前的 tool-use 范式（用户给指令→LLM 选工具→调用工具→返回结果）可能需要根本性的改进，以应对真实交互的复杂性。

### 8.2 局限性

1. **论文未提供 57 个模型的详细排名**：我们只知道没有模型超过 15%，但不清楚具体的模型排名和各模型的详细性能数据。

2. **三个挑战维度的独立贡献**：论文虽然进行了受控实验，但对于三个维度（组合、隐含、转换）各自的贡献程度和交互效应，需要更详细的消融分析。

3. **数据集规模和覆盖度**：与 ToolBench 的 126,486 个实例相比，WildToolBench 的具体数据规模需要进一步确认。

4. **评估指标的严格性**：15% 的准确率天花板是否部分由于评估标准过于严格？如果采用更细粒度的评估指标（如部分正确分），模型的表现可能会有不同的画面。

---

## 九、技术细节补充

### 9.1 数据生成的质量控制机制

多智能体框架中的 Checker Agent 采用了**双重校验 + 重试机制**：

- Planner 的决策经过 Checker 校验后，如果被判定为错误，Planner 需重新生成，最多重试 3 次
- Tool 的执行结果同样经过 Checker 校验，不合理的结果会触发 Tool 重新执行
- 这种 Self-Correction 机制有效保证了生成数据的逻辑一致性和质量

### 9.2 支持中英双语

框架支持中英双语数据生成，通过环境变量 `LANGUAGE` 控制：
```bash
LANGUAGE=en  # 英文
LANGUAGE=zh  # 中文
```

工具定义文件也有对应的中英版本：`tools_zh.jsonl` 和 `tools_en.jsonl`。

### 9.3 路径树与任务组合

框架通过 `gen_path` 函数生成任务路径树，定义了任务类型的组合序列。这使得框架可以灵活地生成不同复杂度和类型组合的数据，例如：
- 简单路径：ST → ST → ST（三轮单工具调用）
- 复杂路径：ST → MT → CQ → CC（单工具→多工具→隐含追问→闲聊）

---

## 十、总结

WildToolBench 这篇论文的核心价值在于它提出了一个非常重要但被学界长期忽视的问题：**我们一直在用"干净"的 benchmark 来衡量模型在"脏乱"的现实世界中的表现，这种评估方式本身就是有偏的。**

57 个 LLM 无一突破 15% 准确率的实验结果，是一个对整个 LLM Agent 社区的强烈警示。它告诉我们：

1. 现有 benchmark 上的 SOTA 并不意味着模型真的能在实际应用中很好地使用工具
2. 真实用户行为的"野生"特性是 LLM 工具使用能力的真正试金石
3. 我们需要从用户行为的角度重新设计 benchmark、训练方法和系统架构

可控多智能体数据生成框架是论文的另一个重要贡献，它不仅为 WildToolBench 提供了高质量的数据，也为未来的研究者提供了一个灵活的数据生成工具。

---

## References

1. [Benchmarking LLM Tool-Use in the Wild - OpenReview (ICLR 2026)](https://openreview.net/forum?id=yz7fL5vfpn)
2. [WildToolBench - GitHub Repository](https://github.com/yupeijei1997/WildToolBench)
3. [ToolBench - GitHub Repository (OpenBMB)](https://github.com/OpenBMB/ToolBench)
4. [StableToolBench - arXiv Paper](https://arxiv.org/pdf/2403.07714)
5. [MINT-Bench: Evaluating LLMs in Multi-turn Interaction with Tools and Language (ICLR 2024)](https://github.com/xingyaoww/mint-bench)
