---
title: "OneMillion-Bench 精读报告"
description: "百万级别 benchmark 的设计理念与评测方法论"
date: 2026-03-11
category: 论文精读
tags: ["Benchmark", "LLM 评测"]
draft: false
---
# $OneMillion-Bench 精读报告

> **论文标题**: $OneMillion-Bench: How Far Are Language Agents From Human Experts?
>
> **作者**: Qianyu Yang, Yang Liu, Jiaqi Li, Jun Bai, Hao Chen, Kaiyuan Chen, Tiliang Duan, Jiayun Dong, Xiaobo Hu, Zixia Jia, Yang Liu, Tao Peng, Yixin Ren, Ran Tian, Zaiyuan Wang, Yanglihong Xiao, Gang Yao, Lingyue Yin, Ge Zhang, Chun Zhang, Jianpeng Jiao, Zilong Zheng, Yuan Gong
>
> **机构**: Humanlaya, BIGAI (北京通用人工智能研究院), xbench, M-A-P
>
> **发布时间**: 2026年3月9日
>
> **arXiv**: [2603.07980](https://arxiv.org/abs/2603.07980)
>
> **GitHub**: [humanlaya/OneMillion-Bench](https://github.com/humanlaya/OneMillion-Bench)

---

## 一、论文定位与核心贡献

### 1.1 问题意识

当前 LLM 已从聊天助手演变为具备多步推理和工具使用能力的长期自主 Agent，但现有 benchmark 大多停留在"考试题"范式——结构化、有标准答案、脱离真实工作场景。论文开篇即指出了这一根本矛盾：

> "As language models (LMs) evolve from chat assistants into long-horizon agents capable of multi-step reasoning and tool use, existing benchmarks—largely limited to structured or exam-style tasks—fall short of real-world professional demands."

这意味着：即便模型在 MMLU、GPQA 等 benchmark 上得分很高，也不能回答一个更关键的问题——**AI 到底能在多少真实的、有经济价值的专家工作中达到可交付标准？**

### 1.2 核心创新

$OneMillion-Bench 的独特之处在于引入了**经济价值（Economic Value）**这个全新的评测维度。它不是给模型打分，而是用"钱"来衡量模型到底能做多少事：

- 400 道高难度专家任务（200 英文 + 200 中文）
- 覆盖金融、法律、医疗、自然科学、工业 5 大领域，37 个二级领域，92 个三级领域
- 由 100+ 位来自 Morgan Stanley、世达律所、协和医院、国家电网、清华大学等顶级机构的资深专家构建
- 所有任务的人类专家完成成本加总超过 **100 万美元**

---

## 二、经济价值计算框架

### 2.1 定价模型

论文为每道任务赋予了显式的经济价值，计算公式如下：

$$V_{\text{\$OneMillion-Bench}} = T_{\text{ExpertCost}} \times W_{\text{HourlyWage}}$$

具体来说：

> "The economic value of the benchmark is estimated by the time required for senior experts to solve each task multiplied by the hourly wage."

- **专家耗时（T）**：由 2-3 名领域资深专家分别评估完成时间，取平均值
- **时薪（W）**：锚定美国劳工统计局（BLS）及中国一线城市劳动市场官方工资指南，将年薪换算为小时工资，并叠加约 31% 的福利成本调整系数

### 2.2 经济价值的意义

这套定价不是象征性的数字，而是有实际锚定的。它回答的核心问题是：

> 如果把 AI 当成"数字白领专家"，总价值 100 万美金的任务，模型到底能赚多少钱？

最终结果：当前 SOTA 模型（Claude Opus 4.6 + Web Search）约能交付 **48 万美元** 价值的任务，而 API 成本仅约 **100 美元**。投入产出比高达 **4800:1**。

---

## 三、评分体系设计

### 3.1 Expert Score（专家分数）

每道题配备 5-23 个加权评分标准（rubrics），评分公式：

$$\text{Expert Score}(q) = \max\left(0, \frac{\sum_{r \in R_q} s_r}{\sum_{r \in R_q^{+}} w_r}\right)$$

其中 $R_q$ 是问题 $q$ 的评分标准集，$s_r$ 是单条 rubric 得分，$w_r$ 是正向权重。分数裁剪至 $[0, 1]$。

评分标准按四个功能维度标注：

| 维度 | 英文标签 | 含义 |
|------|---------|------|
| 事实信息 | Factual Information (FI) | 检索和验证事实的能力 |
| 分析推理 | Analytical Reasoning (AR) | 因果归属和逻辑推理 |
| 指令遵循 | Instruction Following (IF) | 遵循显式约束和规则 |
| 结构格式 | Structure & Formatting (SF) | 逻辑流、结构和专业语言风格 |

### 3.2 非对称负分机制——防止 Reward Hacking

这是本文评分设计中最精彩的部分。论文指出，在开放式任务中，模型最容易通过"堆砌内容"来碰瓷得分。为此引入了**非对称分值机制**：

> 评分标准采取 **+10 ~ -20** 的非对称分值范围：正向能力给分克制，但致命错误（如违反行业规范、产生幻觉、指令遵循失败）惩罚极重。

原文描述：

> "The rubric-based scoring with negative scores (range -20 to 10) penalizes violations of industry norms, hallucination generation, or instruction-following failures."

这套设计的核心洞察是：**在真实工作中，做对不一定加分很多，但做错往往会带来更大代价。** 模型如果只是堆砌内容、没有合理的逻辑展开，无法"撞到"高分。

### 3.3 Pass Rate（通过率）

除了平均分，论文引入了更贴近落地的"通过率"指标：

$$\text{Pass Rate}(Q) = \frac{1}{|Q|} \sum_{q \in Q} \mathds{1}\left[\text{Expert Score}(q) \geq 0.7\right]$$

即单题得分达到 70% 及以上才算"通过"。经济价值也严格按"可交付"口径计算——只有通过的任务才计入"能赚到的钱"。论文的形象比喻是：

> 平均分像"考试成绩"，而通过率才是"上岗证"。

---

## 四、数据构建流程

### 4.1 三阶段专家标注 Pipeline

论文采用了高质量的三阶段标注流程：

**阶段一：任务创建（Task Creation）**
- 资深专家设计任务、撰写参考答案和详细评分标准
- 每道题设计 **15-35 个考点**，累计 **7000+ 考点**
- 任务经对抗性验证：只有多个前沿模型均未通过阈值的题目才保留

**阶段二：同行评审（Peer Review）**
- 第二位独立专家审查清晰度、专业性和公平性

**阶段三：解决与修订（Resolution & Revision）**
- 有争议的任务由第三位专家仲裁
- 双向截断策略：剔除过易和过难样本

### 4.2 质量控制

论文对数据质量的把控极为严苛：

> 专家平均整体通过率低于 **5%**，题目最终质检通过率仅为 **38.1%**。

这意味着：在专家招募环节，95% 的候选专家被淘汰；在数据产出环节，超过 60% 的题目被返工或剔除。整个构建过程耗时 **2000+ 小时**。

### 4.3 双语与本地化设计

数据集包含 CN（中文）和 Global（英文）两个子集：

> "Chinese tasks incorporate mainland China-specific legal regulations (e.g., Cybersecurity Law) and cultural contexts."

中文子集不是英文题的翻译，而是独立设计的本地化题目，涵盖中国大陆特有的法规、流程和业务语境，以还原真实的地域性业务场景。

---

## 五、评测结果与关键发现

### 5.1 评测设置

论文评测了 35 个模型，分为三类：

| 类别 | 数量 | 说明 |
|------|------|------|
| Vanilla Models | 17 | 未使用外部工具的开源/专有模型 |
| Search Agents | 17 | 配备网络搜索工具的上述模型 |
| Deep Research Agents | 3 | 专门优化的复杂推理系统（如 o3-DeepResearch） |

### 5.2 主要结果（Global 子集）

| 模型 | Economic Value ($) | Expert Score (%) | Pass Rate (%) |
|------|-------------------|------------------|---------------|
| **Claude-Opus-4.6 (Search)** | **483.8k** | **63.0** | **43.5** |
| GPT-5.4-High (Search) | 365.5k | 59.2 | 38.0 |
| GPT-5.2-High (Search) | 335.9k | 56.9 | 32.0 |
| Gemini-3-Pro-Preview (Search) | 345.3k | 52.8 | 28.5 |
| Qwen3.5-Plus (Search) | 263.7k | 49.0 | 23.5 |

中国子集（CN）的结果趋势类似，Claude-Opus-4.6 (Search) 同样领先，Expert Score 64.5%，Pass Rate 48.5%。

### 5.3 关键发现

#### 发现一：平均分合格，但通过率骤降

头部模型平均分已进入合格区间（60%+），但通过率的表现令人警醒：

> 即使排名第一的 Claude Opus 4.6 Web Search，通过率也骤降到 **43.5%**，即只有不到 45% 的任务可以通过验收；第二梯队多在 **25-30%** 区间。

这说明模型在单题层面覆盖到不少考点，但要在一道题上全面满足所有专家要求，仍然非常困难。

#### 发现二：Web Search 是双刃剑

搜索工具对顶级模型（如 Claude）有明显增益，尤其在金融领域的时效性问题上。但对较弱模型却可能导致性能下降：

> "Web Search scaffolding improves top models (e.g., Claude) but causes performance degradation for some weaker models (e.g., Hunyuan-2.0, Step-3.5-Flash)."

论文指出，下一阶段竞争的关键不是"有没有搜索"，而是"**会不会搜索**"——会不会选源、交叉验证、把证据链写进推理、在噪声下保持一致性。

#### 发现三：Deep Research Agent 未超越通用搜索模型

一个令人意外的结论：

> "Specialized Deep Research Agents did not outperform search-augmented top general-purpose models."

专门优化的深度研究 Agent（如 o3-DeepResearch, Sonar-DeepResearch）并未在这个 benchmark 上超越配备搜索的通用顶级模型。这可能暗示当前 Deep Research 系统在专业领域的适应性仍有不足。

#### 发现四：结构格式得分最高，事实信息得分最低

按评分标准类型分析（以 Claude-Opus-4.6 Search 为例）：

| 维度 | Vanilla | Search |
|------|---------|--------|
| Factual Information (FI) | 54.0 | **66.5** |
| Analytical Reasoning (AR) | 61.3 | **73.0** |
| Instruction Following (IF) | 74.6 | **82.1** |
| Structure & Formatting (SF) | 88.9 | 90.0 |

模型在"结构和格式"上得分最高（接近 90%），但在"事实信息"上仍最为薄弱。Web Search 对事实信息和分析推理的提升最为显著。

#### 发现五：复杂推理仍是通用瓶颈

> "Models excel at writing coherent explanations, but once a task requires deep understanding, multi-step deduction, or exploration in a large possibility space, depth and accuracy still fluctuate."

模型容易给出"方向正确但缺乏可执行细节"的回复。医疗场景中遗漏关键临床要素、自然科学任务中对实验条件约束考虑不足——这类失败在落地中杀伤力最大，因为它看起来"很对"，但没有可实践的信息量。

### 5.4 LM-as-Judge 的鲁棒性

论文对评分法官进行了敏感性分析：不同法官模型（GPT-5.2-High, GLM-5 等）给出的绝对分数有差异（GPT-5.2-High 最严格，GLM-5 最宽容），但模型的排名顺序保持相对稳定，说明评分体系具有较好的鲁棒性。

### 5.5 Test-Time Scaling

论文还研究了测试时扩展性。随着采样次数 $k$ 增加：

- `pass@k`（至少一个样本通过）呈**对数增长**
- `pass^k`（聚合输出的可靠性）呈**下降趋势**

> 这意味着增加采样次数可以提高"碰到正确答案"的概率，但会降低输出的一致性——在需要稳定交付的专业场景中，这是一个值得警惕的现象。

---

## 六、与相关工作的对比

论文将 $OneMillion-Bench 与三类既有工作进行了对比：

| 类别 | 代表工作 | $OneMillion-Bench 的差异化 |
|------|---------|--------------------------|
| 硬问答 Benchmark | GPQA, LiveBench | 超越选择/简答，面向开放式专家任务 |
| Agent 工作流 Benchmark | SWE-bench, TravelPlanner | 不限于代码/规划，覆盖五大专业领域 |
| 现实 Grounded 评估 | LiveTradeBench | 引入经济价值量化，中英双语，评分体系含负分 |

$OneMillion-Bench 填补的空白是：**静态考试评估与高风险专业部署之间的鸿沟。**

---

## 七、讨论与展望

### 7.1 成本的帕累托最优性

论文指出搜索型 Agent 提供的经济价值远高于基础模型，且边际成本极低、利润率极高。这为 AI Agent 的商业化落地提供了量化依据。

### 7.2 动态扩展计划

> 未来计划扩展到能源、气候科学等领域，并引入实时更新机制。

### 7.3 自动化评估的挑战

当前依赖 LLM-as-Judge 评分，未来需要开发基于规则或学习的自动评分机制，以降低评估成本并提高一致性。

---

## 八、个人思考与点评

### 8.1 创新性评价

$OneMillion-Bench 最核心的创新是将"经济价值"引入 AI 评测体系。这一思路跳出了传统 accuracy/F1 的框架，直接回答了产业界最关心的问题：**AI 今天能赚多少钱？** 非对称负分机制也是一个精巧的设计，有效抑制了模型"堆砌内容碰运气"的策略。

### 8.2 局限性

- **规模有限**：400 道题覆盖 5 个领域，每个三级分类仅有少量样本，统计效力可能不足
- **评分依赖 LLM Judge**：虽然论文验证了排名稳定性，但绝对分数的可靠性仍有待考察
- **经济价值计算的主观性**：专家耗时估算和时薪锚定都包含主观成分
- **时间敏感性**：部分任务涉及时效性信息，不同评测时间点的结果可能不同

### 8.3 对领域的启示

这篇论文释放了一个重要信号：AI 评测正在从"能力测试"转向"价值测量"。当模型在专业任务上的通过率仍不到 50%，这意味着距离真正可信赖的"数字员工"还有相当路程。但同时，4800:1 的投入产出比也说明：在适当的任务选择和质量把控下，AI Agent 已经具备了极高的经济效率。

---

## 参考资料

1. [arXiv: $OneMillion-Bench: How Far Are Language Agents From Human Experts?](https://arxiv.org/abs/2603.07980)
2. [GitHub: humanlaya/OneMillion-Bench](https://github.com/humanlaya/OneMillion-Bench)
3. [HuggingFace Dataset: humanlaya-data-lab/OneMillion-Bench](https://huggingface.co/datasets/humanlaya-data-lab/OneMillion-Bench)
4. [机器之心报道: 1美元Token撬动4800美元收益!AI挑战百万美元级基准](https://www.sohu.com/a/994508418_211762)
5. [Humanlaya 官网](https://lab.humanlaya.com/)
