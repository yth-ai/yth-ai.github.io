---
title: "SFT 数据的构造方法"
description: "人工标注、自动合成、拒绝采样与数据混合配比"
date: 2026-03-21
updatedDate: 2026-04-11
bookSlug: "data-engineering"
chapter: 12
part: "第三部分：SFT 数据"
partOrder: 3
tags: [SFT构造,合成数据,拒绝采样,标注]
---

> *"给模型写 SFT 数据，就像给一个天才写演讲稿——他什么都懂，但你得告诉他什么时候该幽默、什么时候该严肃。"*

---

## 12.1 人工标注

### 种子数据的重要性

SFT 数据构造的第一步不是"大规模标注"，而是**精心设计 100-500 条种子数据**。

种子数据的作用：
1. **定义标准**：什么样的回复是"好的"
2. **指导风格**：模型应该用什么语气和格式
3. **覆盖核心场景**：最重要的任务类型都有范例

```python
"""
种子数据设计框架
"""

SEED_DATA_TEMPLATE = {
    "task_categories": [
        # 每个类别至少 5-10 条种子数据
        {
            "category": "知识问答",
            "count": 20,
            "difficulty_distribution": {"easy": 5, "medium": 10, "hard": 5},
            "requirements": [
                "回答必须结构化（使用标题和列表）",
                "涉及不确定的知识点时要说明",
                "适当给出参考来源",
            ],
        },
        {
            "category": "代码生成",
            "count": 30,
            "difficulty_distribution": {"easy": 5, "medium": 15, "hard": 10},
            "requirements": [
                "代码必须包含注释",
                "给出运行示例",
                "说明时间/空间复杂度（如适用）",
            ],
        },
        {
            "category": "创意写作",
            "count": 15,
            "difficulty_distribution": {"easy": 5, "medium": 5, "hard": 5},
            "requirements": [
                "风格多样化",
                "避免陈词滥调",
                "根据用户要求调整语气",
            ],
        },
        {
            "category": "数学推理",
            "count": 20,
            "difficulty_distribution": {"easy": 5, "medium": 10, "hard": 5},
            "requirements": [
                "必须展示完整推理步骤",
                "关键步骤要有解释",
                "最终答案明确标出",
            ],
        },
        {
            "category": "拒绝与安全",
            "count": 15,
            "requirements": [
                "有害请求要明确但礼貌地拒绝",
                "说明拒绝的原因",
                "如可能，提供替代建议",
            ],
        },
    ],
}
```

### 标注指南的撰写

标注指南（Annotation Guidelines）是 SFT 数据质量的基石。一份好的标注指南应该包含：

```
标注指南结构（模板）：

第 1 部分：总体原则
  - 回答的核心价值观（有帮助、准确、无害）
  - 回答的风格要求（专业但友好）
  - 格式规范（何时用 markdown、何时用纯文本）

第 2 部分：任务类型指南
  - 知识问答：如何组织回答结构
  - 代码：代码规范、注释要求、测试用例
  - 创作：创意自由度、长度建议
  - 推理：步骤展示要求

第 3 部分：质量标准
  - 评分标准（1-5 分的定义）
  - 好坏样本对比（至少 20 组）
  - 常见错误清单

第 4 部分：边界情况处理
  - 不确定时怎么办
  - 主观问题如何回答
  - 安全敏感话题的处理
  - 多语言混合的处理
```

### 标注一致性的保证

```python
"""
标注一致性评估
"""

from typing import List, Dict
import numpy as np

def compute_inter_annotator_agreement(
    annotations: Dict[str, List[int]],  # {annotator_name: [ratings]}
    method: str = "cohens_kappa"
) -> dict:
    """
    计算标注员间一致性

    annotations: 每个标注员对同一批样本的评分
    """
    annotators = list(annotations.keys())

    if method == "cohens_kappa" and len(annotators) == 2:
        ratings_a = np.array(annotations[annotators[0]])
        ratings_b = np.array(annotations[annotators[1]])

        # 计算观察到的一致率
        observed_agreement = np.mean(ratings_a == ratings_b)

        # 计算期望的偶然一致率
        categories = set(ratings_a) | set(ratings_b)
        expected_agreement = 0
        for cat in categories:
            p_a = np.mean(ratings_a == cat)
            p_b = np.mean(ratings_b == cat)
            expected_agreement += p_a * p_b

        # Cohen's Kappa
        kappa = (observed_agreement - expected_agreement) / (1 - expected_agreement)

        interpretation = (
            "几乎完全一致" if kappa > 0.80 else
            "高度一致" if kappa > 0.60 else
            "中等一致" if kappa > 0.40 else
            "一致性不足" if kappa > 0.20 else
            "几乎没有一致性"
        )

        return {
            "kappa": round(kappa, 3),
            "observed_agreement": round(observed_agreement, 3),
            "interpretation": interpretation,
            "sample_size": len(ratings_a),
        }

    return {"error": "method not implemented"}
```

**一致性不达标时的处理流程：**

```
Kappa < 0.4（一致性不足）
  → 暂停标注
  → 分析分歧点：哪些类型的样本分歧最大？
  → 修改标注指南，增加边界情况的说明
  → 举办校准会议（calibration session）
  → 重新标注试点样本
  → Kappa > 0.6 后才能继续正式标注
```

### LLM 辅助标注：从纯人工到人机协同

纯人工标注质量高但成本也高——标注一条高质量 SFT 数据的时间可能在 15-60 分钟。随着 LLM 能力的提升，一个自然的问题是：能否让 LLM 承担部分标注工作？

直接使用 LLM 标注存在质量风险。[ACT（Annotation with Critical Thinking）](https://openreview.net/forum?id=V1FlwrsseI)（NeurIPS 2025）的实验表明，纯 LLM 标注数据训练会导致最高 10.15% 的准确率下降。ACT 提出的解决方案是让 LLM 同时担任**标注员和审查员**——先标注，再批判性审查自己的标注，识别并修正潜在错误。这一"双角色"管线将性能差距缩小到不到 2%。

一个可行的人机协同标注流程：

```
阶段 1：人工标注种子数据（100-500 条）
  → 建立质量标准和标注规范
  → 这批数据是"标准答案"

阶段 2：LLM + ACT 管线批量生成
  → LLM 按标注指南生成回复
  → 同一 LLM 或更强模型进行批判性审查
  → 标记低置信度样本

阶段 3：人工抽样审核（10-20%）
  → 重点检查低置信度样本
  → 校正系统性偏差
  → 更新标注指南
```

需要注意的是，ACT 的实验主要在多模态场景验证，文本 SFT 场景的迁移效果需要更多确认。但核心思路——"LLM 自我审查"比"LLM 直接标注"更可靠——具有普遍的指导意义。

---

## 12.2 自动合成（Synthetic Generation）

### Self-Instruct 范式

Self-Instruct（2022）开创了用模型自身来生成 SFT 数据的范式：

```
Self-Instruct 流程：

  种子指令集（175 条人工编写）
         ↓
  从种子集中随机采样 5 条作为示例
         ↓
  提示模型生成新指令
         ↓
  对每条新指令生成输入/输出对
         ↓
  过滤（去重、格式检查、质量筛选）
         ↓
  加入指令池，循环迭代
```

传统 Self-Instruct 的一个局限是"随机采样→直接生成"的单步流程——从种子集中随机抽样示例，然后直接生成新指令，缺乏对已有指令覆盖范围的分析，导致生成的指令多样性受限。[CoT-Self-Instruct](https://arxiv.org/abs/2507.23751)（Meta, 2025）在生成步骤前引入了一个**推理与规划阶段**：

```
CoT-Self-Instruct 升级流程：

  种子指令集
         ↓
  采样示例
         ↓
  【新增】CoT 推理：分析已有指令的特征、识别覆盖缺口
         ↓
  定向生成：填补缺口的新指令（而非随机生成）
         ↓
  生成输入/输出对
         ↓
  过滤 + 迭代
```

核心思想是"先思考再出题"——让模型在生成新指令之前，先推理分析种子任务的能力维度和覆盖盲区，然后有针对性地生成填补空白的指令。实验表明，CoT-Self-Instruct 生成的数据在推理基准上达到 57.2% 的平均准确率，相比标准 Self-Instruct 的 42.7% 提升显著，说明指令生成阶段的"思考质量"直接决定了合成数据的多样性和有效性。

#### 迭代合成的安全边界：模型崩溃防护

Self-Instruct 的核心是**迭代合成**——用模型生成数据，再用这些数据训练模型（或其后继版本），再用训练后的模型生成新数据。这个闭环有一个系统性风险：**模型崩溃（model collapse）**——当合成数据在分布的尾部缺乏多样性时，迭代训练会导致模型逐步丧失对低频但重要模式的覆盖。

[Escaping Model Collapse](https://arxiv.org/abs/2510.16657)（ICLR 2026）给出了一个重要的理论保证：**通过外部验证器注入信息，合成数据迭代训练可以证明不会导致模型崩溃**。关键定理的核心条件是验证器必须是"外部的"——不能由生成模型自身充当，必须引入独立的信息源（人类评审、更强的模型、或可执行验证器）。

这对 Self-Instruct 的实践含义很直接：流程中的"过滤"步骤不只是质量优化——它是防止模型崩溃的数学必要条件。具体而言：
- **每轮迭代后应使用独立评估器**验证数据质量，而非仅靠生成模型自身的去重和格式检查
- **可执行验证**（代码通过测试、数学答案可验证）天然满足"外部信息注入"条件，因此代码和数学领域的迭代合成相对安全
- **开放域指令**的迭代合成风险最高，建议限制迭代轮数或引入人类抽样审核

### Evol-Instruct（WizardLM）

Evol-Instruct 是 Self-Instruct 的重要进化，核心创新是**渐进式复杂化**：

```python
"""
Evol-Instruct 的演化策略
"""

EVOLUTION_STRATEGIES = {
    # 深度演化（增加复杂度）
    "add_constraints": {
        "prompt": "请在以下指令中增加一个约束条件，使其更具挑战性：\n{instruction}",
        "example": "写一首诗 → 写一首藏头诗，首字连起来是'人工智能'",
    },
    "deepen_reasoning": {
        "prompt": "请增加推理步骤的要求，使回答需要更深入的分析：\n{instruction}",
        "example": "比较 A 和 B → 从性能、成本、可维护性三个维度比较 A 和 B，给出量化分析",
    },
    "concretize": {
        "prompt": "请将以下抽象指令具体化，增加具体的场景和参数：\n{instruction}",
        "example": "写排序算法 → 实现一个能处理百万级数据的外部排序算法",
    },
    "increase_steps": {
        "prompt": "请将以下指令扩展为一个多步骤任务：\n{instruction}",
        "example": "分析数据 → 先清洗数据，然后做 EDA，最后建模并评估",
    },

    # 广度演化（增加多样性）
    "topic_shift": {
        "prompt": "请创建一个类似但领域完全不同的指令：\n{instruction}",
        "example": "写 Python 排序 → 用 SQL 优化一个慢查询",
    },
    "format_change": {
        "prompt": "请改变回答的格式要求：\n{instruction}",
        "example": "解释概念（文字）→ 用表格对比来解释概念",
    },
}

def evolve_instruction(
    instruction: str,
    strategy: str,
    model_api,  # LLM API
    max_attempts: int = 3,
) -> str:
    """
    对一条指令进行演化
    """
    prompt_template = EVOLUTION_STRATEGIES[strategy]["prompt"]
    prompt = prompt_template.format(instruction=instruction)

    for attempt in range(max_attempts):
        evolved = model_api.generate(prompt, temperature=0.7)

        # 质量检查
        if len(evolved) > len(instruction) * 0.5:  # 不能太短
            if evolved != instruction:  # 不能和原始一样
                return evolved

    return None  # 演化失败
```

#### Evol-Instruct 的局限与下一代方法

Evol-Instruct 有两个内在局限：**单向合成**（一次只能选择一个演化方向）和**随机驱动**（缺乏明确的优化目标来判断哪个方向最好）。当种子指令通过 `add_constraints` 演化后，如果效果不佳，无法回退尝试 `deepen_reasoning`——演化是不可逆的。

[Tree-of-Evolution](https://aclanthology.org/2025.acl-long.14/)（ACL 2025）将指令演化从线性流程升级为**树结构多路径探索**：

```
线性 Evol-Instruct：
  种子指令 → 约束 → 约束+深化 → ...（一条路走到底）

Tree-of-Evolution：
  种子指令 ─┬─ 约束 ─┬─ 约束+深化 ★
            │        └─ 约束+场景化
            ├─ 深化 ─── 深化+多步 
            └─ 场景化 ─ 场景化+约束
  （★ = 优化函数选择的最优路径）
```

每个节点是一个指令变体，分支代表不同的演化方向，用目标函数（而非随机选择）评估并选择最优路径。这种方法在代码指令合成场景特别有效——因为代码有可执行验证的天然优势，可以用通过率作为优化目标。实验表明，仅用 75K 训练数据即可达到 SOTA 性能，说明结构化探索比大量随机演化更高效。

### 用强模型生成数据训练弱模型

这是当前最主流的 SFT 数据生成方式：用 GPT-4 / Claude 级别的模型生成训练数据，然后用这些数据训练更小的开源模型。

#### 离策略学习的内在挑战

这种方法有一个容易被忽略的理论问题。从强化学习的视角看，SFT 本质上是**离策略（off-policy）学习**——训练数据来自"行为策略"（GPT-4 等强模型），但优化目标是不同的"学习策略"（你的目标模型）。两者之间的分布差距越大，训练的方差越大、效果越不稳定。

[Mind the Gap](https://arxiv.org/abs/2509.15157)（2025）将这一问题形式化：当行为策略和学习策略的分布差距较大时，标准 SFT 的梯度估计方差显著增加。论文提出的数据改写框架——主动将强模型生成的回复改写为更接近目标模型分布的版本——是缩小这一差距的可行方案。

这一发现与 GRAPE（见 12.3 节）形成呼应：为什么"适合目标模型的数据"比"客观最优的数据"更重要？因为跨模型数据生成本身就引入了分布偏移，选择与目标模型分布匹配的回复本质上是在缓解离策略学习的方差问题。

**实践建议**：用强模型生成数据时，不应只关注 Prompt 设计来提升"绝对质量"，还应考虑生成回复与目标模型能力范围的匹配度。如果目标模型是 7B 规模，让 GPT-4 生成过于复杂的推理链可能适得其反。

**关键细节——Prompt 设计对质量的巨大影响：**

```python
"""
高质量 SFT 数据生成的 Prompt 设计
"""

# ❌ 差的 prompt（太简单，生成质量不可控）
bad_prompt = "请为以下指令生成一个高质量的回答：{instruction}"

# ✅ 好的 prompt（详细的质量要求）
good_prompt = """你是一个专业的 AI 助手。请为以下用户指令生成一个高质量的回答。

用户指令：{instruction}

要求：
1. 回答必须准确、完整、有帮助
2. 使用清晰的结构（标题、列表、代码块等）
3. 如果涉及代码，必须：
   - 包含注释
   - 给出完整的可运行示例
   - 说明关键设计决策
4. 如果涉及分析或推理，必须：
   - 展示推理过程
   - 考虑多个角度
   - 给出明确的结论
5. 长度：根据问题复杂度调整，简单问题简短回答，复杂问题详细展开
6. 如果你不确定某个事实，明确说明
7. 禁止编造不存在的工具、库或 API

请直接给出回答（不要加"好的，我来回答"之类的前缀）："""
```

---

## 12.3 拒绝采样（Rejection Sampling）

### 核心思路

拒绝采样是提升 SFT 数据质量的最有效方法之一：**对同一个指令生成多个回复，然后选择最好的。**

```
指令 → 生成 N 个回复（通常 N=4-16）
  ↓
对每个回复评分
  ↓
选择得分最高的回复
  ↓
（指令, 最佳回复）作为训练数据
```

不过，"最好的回复"并非一个客观概念。[GRAPE](https://arxiv.org/abs/2502.04194)（NeurIPS 2025）揭示了一个关键洞见：**最佳回复不是绝对的——它取决于目标模型的预训练分布**。对同一条指令的同一组候选回复，不同的基座模型有不同的最优选择。GRAPE 通过为每条指令选择与目标模型分布最匹配（而非人类评分最高）的回复，仅用 1/3 的数据和一半的训练 epoch，使 LLaMA-3.1-8B 超过 Tulu3-SFT 性能 3.5%，在平均性能上超出 4.5 倍数据量的基线 6.1%。

这意味着拒绝采样的核心逻辑需要一个补充维度：除了"选最好的"，还要考虑"选最适合目标模型的"。

### 评分函数的选择

| 评分方法 | 优点 | 缺点 | 适用场景 |
|---------|------|------|---------|
| 规则评分 | 快速、确定性 | 只能评表面质量 | 格式检查、长度控制 |
| 奖励模型 | 综合质量评估 | 有偏差 | 通用质量评分 |
| LLM-as-Judge | 灵活、可解释 | 慢、贵 | 复杂任务 |
| 自动验证 | 精确 | 只适用于可验证任务 | 代码、数学 |
| 分布匹配 | 模型定制化、数据高效 | 需要目标模型的推理成本 | 任何 SFT 数据选择场景 |

前四种方法隐含一个假设：存在一个"客观最优"的回复。分布匹配则打破这一假设——**好回复是相对于目标模型而言的**。这两种视角不矛盾：实践中可以先用前四种方法过滤掉明显低质量的候选，再在达标候选中用分布匹配选择最适合目标模型的回复。

```python
"""
拒绝采样实现
"""

from typing import List, Tuple, Callable

def rejection_sampling(
    instruction: str,
    generator,             # 生成模型
    scorer: Callable,      # 评分函数
    n_samples: int = 8,    # 采样数量
    temperature: float = 0.8,
    min_score_threshold: float = 0.7,  # 最低可接受分数
) -> Tuple[str, float]:
    """
    拒绝采样生成最佳回复
    """
    candidates = []
    for _ in range(n_samples):
        response = generator.generate(instruction, temperature=temperature)
        score = scorer(instruction, response)
        candidates.append((response, score))

    # 按分数排序
    candidates.sort(key=lambda x: x[1], reverse=True)

    best_response, best_score = candidates[0]

    if best_score < min_score_threshold:
        return None, best_score  # 最佳候选也不达标

    return best_response, best_score

def batch_rejection_sampling(
    instructions: List[str],
    generator,
    scorer: Callable,
    n_samples: int = 8,
    temperature: float = 0.8,
    min_score_threshold: float = 0.7,
) -> dict:
    """
    批量拒绝采样
    """
    results = []
    stats = {"total": len(instructions), "passed": 0, "failed": 0}

    for inst in instructions:
        response, score = rejection_sampling(
            inst, generator, scorer,
            n_samples=n_samples,
            temperature=temperature,
            min_score_threshold=min_score_threshold,
        )
        if response is not None:
            results.append({"instruction": inst, "response": response, "score": score})
            stats["passed"] += 1
        else:
            stats["failed"] += 1

    stats["pass_rate"] = stats["passed"] / max(stats["total"], 1)
    stats["avg_score"] = (
        sum(r["score"] for r in results) / max(len(results), 1)
    )
    return {"data": results, "stats": stats}
```

### 采样温度与数量的权衡

| 温度 | 多样性 | 最佳候选质量 | 推荐 N |
|------|--------|------------|--------|
| 0.6 | 低 | 稳定但可能不够好 | 4-8 |
| 0.8 | 中 | 较好的平衡点 | 8-16 |
| 1.0 | 高 | 有机会出现出色回复 | 16-32 |
| 1.2 | 很高 | 有好有坏，需要更多采样 | 32+ |

### 被拒绝的数据：丢弃还是回收？

拒绝采样的 `min_score_threshold` 机制意味着不达标的候选会被完全丢弃。在传统范式中，这是理所当然的——质量不够，就不要。但 [ENTP](https://arxiv.org/abs/2510.23160)（2025）提出了一个不同的视角：被丢弃的低质量数据中可能包含有价值的信号（任务覆盖、领域知识、推理骨架等），问题出在噪声而非内容本身。

ENTP 的核心方法是**符号净化 + 神经增强**——先通过规则和符号操作去除回复中的噪声信息（冗余内容、格式混乱、逻辑跳跃），再将净化后的数据与高质量数据混合增强。实验表明，仅使用低质量数据经 ENTP 增强后，即可超越 13 种已有数据选择方法的表现。

这一发现值得关注但需要审慎对待——该工作尚未在顶会正式发表，其结论的普适性有待更多验证。不过核心思路有实践参考价值：拒绝采样的"废品"不必直接丢弃，可以进入一个修复管线作为候选数据源，尤其在数据稀缺的领域场景下。

---

## 12.4 数据混合与配比

### 任务类型配比

一个通用助手模型的 SFT 数据配比参考：

```
推荐配比（100K 条数据为例）：

知识问答      : 15K (15%)
代码生成/调试  : 20K (20%)  ← 代码通常需要较多样本
数学推理      : 12K (12%)
创意写作      : 8K  (8%)
翻译/摘要     : 8K  (8%)
对话/闲聊     : 10K (10%)
工具调用      : 10K (10%)
指令遵循      : 7K  (7%)   ← 格式约束、角色扮演等
拒绝/安全     : 5K  (5%)
多轮对话      : 5K  (5%)
```

### 难度分布设计

```
推荐的难度分布（倒金字塔形）：

  Level 1 (简单): 30%
    → 建立基础的指令遵循能力
    → 让模型学会"按格式回答"

  Level 2 (中等): 40%
    → 主体能力训练
    → 覆盖各类实际使用场景

  Level 3 (困难): 25%
    → 挑战性任务，提升上限
    → 多步骤推理、复杂分析

  Level 4 (专家): 5%
    → 少量极难样本
    → 避免过多导致训练不稳定
```

> **💡 反直觉发现**
>
> 过多的难样本反而会降低模型表现。研究发现，当 Level 3+4 的比例超过 40% 时，模型在简单任务上的表现反而会退化。原因是模型学会了"过度思考"——即使简单问题也会给出冗长的分析。

### 长度分布设计

SFT 数据的长度分布直接影响模型的输出长度偏好：

```
如果训练数据的回复普遍很长：
  → 模型倾向于给出冗长回复，即使问题很简单
  
如果训练数据的回复普遍很短：
  → 模型回复不够详细，复杂问题回答不充分

推荐策略：
  - 回复长度应该与问题复杂度相匹配
  - 简单问题：50-200 tokens
  - 中等问题：200-500 tokens
  - 复杂问题：500-2000 tokens
  - 不应该有统一的"目标长度"
```

---

## 动手环节：构建一个迷你 SFT 数据合成流水线

**目标**：实现本章介绍的 Evol-Instruct + 拒绝采样的核心流程。

### 练习 1：Evol-Instruct 指令演化

```python
"""
实现 Evol-Instruct 的演化策略
不需要调用 LLM API，用规则模拟演化过程
"""

import random

EVOLUTION_RULES = {
    "add_constraint": {
        "description": "增加约束条件",
        "templates": [
            "在以下指令基础上，增加约束'{constraint}'：\n{instruction}",
        ],
        "constraints": [
            "用不超过 100 字回答",
            "以表格形式呈现",
            "从初学者角度解释",
            "需要给出具体数字和来源",
            "用类比的方式解释",
        ],
    },
    "deepen": {
        "description": "增加深度",
        "suffixes": [
            "，并深入分析其背后的原因",
            "，包括常见的误区和反直觉发现",
            "，给出具体的数据和案例支撑",
            "，并与其他方法进行对比分析",
        ],
    },
    "add_steps": {
        "description": "增加多步骤",
        "templates": [
            "请分步骤完成以下任务：\n1. 先{step1}\n2. 然后{step2}\n3. 最后{step3}",
        ],
    },
}

def evolve_instruction(instruction: str, strategy: str) -> str:
    """对指令进行一次演化"""
    rule = EVOLUTION_RULES.get(strategy)
    if not rule:
        return instruction

    if strategy == "add_constraint":
        constraint = random.choice(rule["constraints"])
        return f"{instruction}（要求：{constraint}）"

    elif strategy == "deepen":
        suffix = random.choice(rule["suffixes"])
        return instruction.rstrip("。？！") + suffix

    elif strategy == "add_steps":
        return f"请分步骤完成：首先理解问题，然后{instruction}，最后总结要点"

    return instruction

# 种子指令集
seed_instructions = [
    "解释什么是 TCP 协议",
    "用 Python 实现二分查找",
    "对比 SQL 和 NoSQL 数据库",
    "解释什么是微服务架构",
    "写一个正则表达式匹配邮箱",
]

print("=== 指令演化示例 ===\n")
for inst in seed_instructions[:3]:
    print(f"原始: {inst}")
    for strategy in ["add_constraint", "deepen", "add_steps"]:
        evolved = evolve_instruction(inst, strategy)
        print(f"  [{strategy}] → {evolved}")
    print()

# 批量演化
print("=== 批量演化（从 5 条种子生成 15 条）===\n")
evolved_set = set()
for inst in seed_instructions:
    for strategy in ["add_constraint", "deepen", "add_steps"]:
        evolved = evolve_instruction(inst, strategy)
        evolved_set.add(evolved)

for i, inst in enumerate(sorted(evolved_set)[:15], 1):
    print(f"{i:2d}. {inst}")
```

### 练习 2：模拟拒绝采样

```python
"""
模拟拒绝采样流程
用启发式规则代替真实的评分模型
"""

import random

def mock_generate(instruction: str, temperature: float = 0.8) -> str:
    """模拟 LLM 生成回复（用模板 + 随机变化）"""
    templates = {
        "good": [
            f"## 回答\n\n关于「{instruction}」：\n\n"
            f"核心概念：这是一个重要的技术主题。\n\n"
            f"### 关键要点\n1. 第一个要点的详细解释\n"
            f"2. 第二个要点及其应用\n3. 第三个要点和注意事项",
        ],
        "medium": [
            f"好的，让我来解释一下。{instruction.replace('解释', '')}是一个"
            f"常见的概念，主要包括几个方面。首先是基本定义，"
            f"其次是应用场景，最后是注意事项。",
        ],
        "bad": [
            f"这个问题很好。嗯，让我想想。{instruction}的话，"
            f"就是那个意思啦，你可以去百度搜搜看。",
            f"好的好的！！！这个{instruction}真是太棒了！！！"
            f"让我来告诉你这个超级厉害的东西！！！",
        ],
    }

    # 温度越高，越可能出现差的回复
    rand = random.random()
    if temperature < 0.6:
        quality = "good" if rand < 0.6 else "medium"
    elif temperature < 1.0:
        quality = "good" if rand < 0.35 else ("medium" if rand < 0.7 else "bad")
    else:
        quality = "good" if rand < 0.2 else ("medium" if rand < 0.5 else "bad")

    return random.choice(templates[quality])

def score_response(instruction: str, response: str) -> float:
    """启发式评分函数"""
    score = 0.5

    # 结构加分
    if "##" in response: score += 0.15
    if "\n1." in response or "\n-" in response: score += 0.1

    # 长度适当加分
    if 100 < len(response) < 1000: score += 0.1

    # 填充语扣分
    fillers = ["好的", "让我想想", "嗯", "啦", "！！！"]
    filler_count = sum(response.count(f) for f in fillers)
    score -= filler_count * 0.05

    # 空洞回复扣分
    if "百度搜" in response or "谷歌搜" in response:
        score -= 0.3

    return max(0, min(1, score))

def rejection_sampling(instruction: str, n_samples: int = 8) -> dict:
    """拒绝采样"""
    candidates = []
    for _ in range(n_samples):
        response = mock_generate(instruction, temperature=0.8)
        score = score_response(instruction, response)
        candidates.append({"response": response, "score": score})

    candidates.sort(key=lambda x: x["score"], reverse=True)
    best = candidates[0]
    worst = candidates[-1]

    return {
        "instruction": instruction,
        "best_response": best["response"][:80] + "...",
        "best_score": round(best["score"], 2),
        "worst_score": round(worst["score"], 2),
        "margin": round(best["score"] - worst["score"], 2),
        "pass": best["score"] >= 0.6,
    }

# 批量拒绝采样
instructions = [
    "解释什么是 Docker 容器",
    "用 Python 实现快速排序",
    "对比 React 和 Vue 框架",
]

print(f"{'指令':<25} {'最佳分':>6} {'最差分':>6} {'Margin':>7} {'通过'}")
print("-" * 55)
for inst in instructions:
    result = rejection_sampling(inst, n_samples=8)
    status = "✅" if result["pass"] else "❌"
    print(f"{inst:<25} {result['best_score']:>6.2f} "
          f"{result['worst_score']:>6.2f} {result['margin']:>7.2f} {status}")
```

### 练习 3：标注指南草案

为一个中文编程助手写一份简短的 SFT 标注指南（不超过一页）。参考本章 12.1 节的标注指南模板，至少包含：
- 总体原则（3 条）
- 代码类回复的格式要求
- 好坏样本对比（2 组）
- 不确定时的处理原则

---

> **本章要点回顾**
>
> 1. **种子数据先行**：精心设计 100-500 条种子数据，定义质量标准
> 2. **标注指南是基石**：详细到边界情况，包含正反面示例
> 3. **一致性 > 速度**：Cohen's Kappa 低于 0.4 时应暂停标注
> 4. **人机协同标注**：LLM + 批判性审查（ACT）可将成本降低一个数量级，性能差距控制在 2% 以内
> 5. **指令合成需要"先思考再出题"**：CoT-Self-Instruct 通过推理驱动生成，比随机采样多样性更高
> 6. **迭代合成须防模型崩溃**：外部验证器是迭代安全的数学必要条件
> 7. **Evol-Instruct 从线性到树结构**：Tree-of-Evolution 的多路径探索比单向随机演化更高效
> 8. **跨模型数据生成是离策略学习**：强模型生成的数据需匹配目标模型的能力范围
> 9. **拒绝采样的"最佳"是相对的**：GRAPE 证明与目标模型分布匹配的回复优于客观评分最高的回复
> 10. **配比需要多维度设计**：任务类型 × 难度 × 长度三个维度都需考量

