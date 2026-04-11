# 第 12 章：SFT 数据的构造方法

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

### 用强模型生成数据训练弱模型

这是当前最主流的 SFT 数据生成方式：用 GPT-4 / Claude 级别的模型生成训练数据，然后用这些数据训练更小的开源模型。

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

### 评分函数的选择

| 评分方法 | 优点 | 缺点 | 适用场景 |
|---------|------|------|---------|
| 规则评分 | 快速、确定性 | 只能评表面质量 | 格式检查、长度控制 |
| 奖励模型 | 综合质量评估 | 有偏差 | 通用质量评分 |
| LLM-as-Judge | 灵活、可解释 | 慢、贵 | 复杂任务 |
| 自动验证 | 精确 | 只适用于可验证任务 | 代码、数学 |

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

## 本章要点回顾

1. **种子数据先行**：精心设计 100-500 条种子数据，定义质量标准
2. **标注指南是基石**：详细到边界情况，包含正反面示例
3. **一致性 > 速度**：Cohen's Kappa 低于 0.4 时应暂停标注
4. **Evol-Instruct 渐进式复杂化**：通过深度和广度演化增加数据多样性
5. **Prompt 设计对合成质量影响巨大**：详细的约束条件比简单指令效果好得多
6. **拒绝采样是质量提升利器**：从 N 个候选中选最佳，N=8-16 通常足够
7. **配比需要多维度设计**：任务类型 × 难度 × 长度三个维度都需考量
