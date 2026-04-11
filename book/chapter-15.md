# 第 15 章：奖励模型的数据需求

> *"奖励模型是偏好的压缩表示——它的质量上限由训练数据决定。"*

---

## 15.1 奖励模型的角色

### 奖励模型 vs 直接偏好学习

```
RLHF (PPO) 路线：
  偏好数据 → 训练奖励模型 → 用奖励模型指导 RL 训练
  优点：奖励模型可以复用、可以评估
  缺点：多一个模型要维护，reward hacking 风险

DPO 路线：
  偏好数据 → 直接训练策略模型
  优点：简单、不需要单独的奖励模型
  缺点：隐式奖励，不够灵活

混合路线（当前主流）：
  偏好数据 → 训练奖励模型（用于评估和数据选择）
  偏好数据 → DPO/SimPO 直接训练（用于策略优化）
```

### 过程奖励模型（PRM）vs 结果奖励模型（ORM）

| 类型 | 评估粒度 | 数据需求 | 适用场景 |
|------|---------|---------|---------|
| ORM（结果奖励模型） | 评估最终答案 | 偏好对 | 通用对齐 |
| PRM（过程奖励模型） | 评估每个推理步骤 | 步骤级标注 | 数学/代码推理 |

PRM 的优势在于能够提供更细粒度的反馈，特别适合推理任务——它能告诉模型"你在第 3 步推理错了"，而不只是"最终答案错了"。

---

## 15.2 奖励模型训练数据

### 数据量需求

| 模型规模 | 最少数据量 | 推荐数据量 | 说明 |
|---------|-----------|-----------|------|
| 1-3B RM | 5K 对 | 20-50K 对 | 小规模 RM，适合特定领域 |
| 7-13B RM | 20K 对 | 50-200K 对 | 通用 RM |
| 70B+ RM | 50K 对 | 200K-1M+ 对 | 生产级 RM |

### 边界样本的重要性

奖励模型最需要学习的不是"明显好 vs 明显差"，而是**边界样本**——质量差异微妙的样本对。

```python
"""
偏好数据的难度分层策略
"""

def stratify_preference_data(
    preference_pairs: list,  # [{"prompt", "chosen", "rejected", "margin"}]
    target_distribution: dict = None,
) -> dict:
    """
    按 margin 分层，确保边界样本充足
    """
    if target_distribution is None:
        target_distribution = {
            "easy": 0.20,     # 大 margin（明显差异）
            "medium": 0.40,   # 中 margin（明确但不极端）
            "hard": 0.30,     # 小 margin（微妙差异）
            "boundary": 0.10, # 极小 margin（几乎相当）
        }

    stratified = {"easy": [], "medium": [], "hard": [], "boundary": []}

    for pair in preference_pairs:
        margin = pair.get("margin", 0.5)
        if margin > 2.0:
            stratified["easy"].append(pair)
        elif margin > 1.0:
            stratified["medium"].append(pair)
        elif margin > 0.3:
            stratified["hard"].append(pair)
        else:
            stratified["boundary"].append(pair)

    # 统计
    stats = {level: len(pairs) for level, pairs in stratified.items()}
    return {"stratified": stratified, "stats": stats, "target": target_distribution}
```

### Negative 的构造

**Hard Negative vs Easy Negative：**

```
Easy Negative（容易区分的差回复）：
  Prompt: "Python 怎么排序列表？"
  Chosen: "使用 sorted() 函数或 list.sort() 方法..."
  Rejected: "排序是一个很复杂的问题，涉及到算法和数据结构..."
  → 差距明显，但训练价值有限

Hard Negative（难以区分的差回复）：
  Prompt: "Python 怎么排序列表？"
  Chosen: "使用 sorted() 函数：sorted([3,1,2]) → [1,2,3]，默认升序..."
  Rejected: "使用 sort() 函数：sort([3,1,2]) → [1,2,3]..."
  → 差距微妙（sort 不是函数而是方法，且没有返回值），训练价值更高
```

### Reward Overoptimization

当策略模型过度优化奖励模型的评分时，会出现**奖励黑客**（reward hacking）：模型找到了获得高分但实际上不好的"捷径"。

```
常见的 reward hacking 模式：
1. 长度黑客：奖励模型偏好长回复 → 模型生成极其冗长的回复
2. 格式黑客：奖励模型偏好 markdown → 模型过度使用标题和列表
3. 谄媚黑客：奖励模型偏好"有帮助"的回复 → 模型过度附和用户
4. 风格黑客：奖励模型偏好某种写作风格 → 模型丢失风格多样性

防范策略：
- 训练数据中明确包含"长但差"、"格式好但内容差"等反例
- 使用 KL 散度约束，限制策略模型偏离 SFT 模型太远
- 多维度评分，而非单一分数
```

---

## 15.3 PRM 数据的特殊构造

### 过程级标注的方法

PRM 需要对推理过程的每一步进行正确性标注，这比结果级标注困难得多。

**方法 1：人工标注**
- PRM800K（OpenAI）：人工标注了 80 万个推理步骤
- 成本极高，但质量最好
- 适合：构建种子数据和黄金评测集

**方法 2：Monte Carlo 采样（Math-Shepherd）**
```python
"""
Monte Carlo 方法估计推理步骤的正确性
"""

def estimate_step_correctness(
    problem: str,
    solution_steps: list,  # 推理步骤列表
    model,                 # 生成模型
    n_rollouts: int = 64,  # 采样次数
    ground_truth: str = None,
) -> list:
    """
    对每个步骤，从该步骤开始采样多个后续推理路径，
    如果大多数路径能到达正确答案，则该步骤可能是对的。
    """
    step_scores = []

    for i, step in enumerate(solution_steps):
        # 构造到第 i 步为止的部分解
        partial_solution = "\n".join(solution_steps[:i + 1])

        # 从第 i 步开始，采样 n_rollouts 个完整解
        correct_count = 0
        for _ in range(n_rollouts):
            completion = model.generate(
                f"Problem: {problem}\n"
                f"Solution so far: {partial_solution}\n"
                f"Continue the solution:",
                temperature=0.8,
            )
            final_answer = extract_answer(completion)
            if final_answer == ground_truth:
                correct_count += 1

        # 该步骤的正确性估计 = 从该步骤出发能到达正确答案的概率
        step_score = correct_count / n_rollouts
        step_scores.append({
            "step_index": i,
            "step_text": step,
            "correctness_estimate": round(step_score, 3),
            "label": "correct" if step_score > 0.5 else "incorrect",
        })

    return step_scores

def extract_answer(text: str) -> str:
    """从推理文本中提取最终答案（简化版）"""
    import re
    match = re.search(r'\\boxed\{(.+?)\}', text)
    if match:
        return match.group(1).strip()
    # fallback: 取最后一个数字
    numbers = re.findall(r'-?\d+\.?\d*', text)
    return numbers[-1] if numbers else ""
```

**方法 3：自动验证（代码执行）**

对于代码推理任务，可以通过执行代码来自动验证每一步的正确性——这是成本最低、准确性最高的方法，但只适用于可执行的代码推理。

---

## 本章要点回顾

1. **奖励模型是偏好数据的压缩表示**，质量上限由数据决定
2. **PRM 比 ORM 更适合推理任务**，但标注成本更高
3. **边界样本（hard negative）是训练高质量 RM 的关键**
4. **Reward hacking 是真实风险**——训练数据中要包含反例
5. **Monte Carlo 采样是自动化 PRM 标注的实用方法**
