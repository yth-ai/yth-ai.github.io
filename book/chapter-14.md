# 第 14 章：偏好数据的本质与构造

> *"Teaching a model to be helpful is about showing it what 'good' looks like. Teaching it to be aligned is about showing it what 'better' looks like."*

---

## 14.1 从 RLHF 到 DPO：偏好学习范式的演变

### 范式演变的时间线

大模型对齐技术在短短三年内经历了多次范式转换：

| 时期 | 方法 | 数据需求 | 复杂度 | 代表 |
|------|------|---------|--------|------|
| 2022 | RLHF (PPO) | 偏好对 + 奖励模型 | 最复杂（4 个模型） | InstructGPT |
| 2023.5 | DPO | 偏好对 | 简化（无需 RM） | Zephyr |
| 2023.11 | KTO | 好/坏标签 | 进一步简化 | - |
| 2024 | SimPO/ORPO | 偏好对（改进损失） | 简单 | - |
| 2025 | GRPO | 可验证奖励 | 不需要人类偏好 | DeepSeek R1 |

> **偏好学习的认知演变**
> - 2022："人类偏好标注是核心——InstructGPT 的方法就是标准答案"
> - 2023："DPO 证明不需要单独训练奖励模型，直接用偏好对就行"
> - 2024："On-policy 数据的重要性被重新认识——off-policy DPO 有天花板"
> - 2025："GRPO + 可验证奖励——在数学和代码上，不需要人类偏好了"
> - 2025-2026："推理模型的 RL 范式——让模型在可验证任务上自我进化"

---

## 14.2 偏好数据的结构

### 基本形式

```python
# 最基本的偏好数据格式
preference_sample = {
    "prompt": "解释什么是快速排序算法",
    "chosen": "快速排序是一种分治算法...[详细准确的解释]",
    "rejected": "排序就是把数字排好...[含糊、不完整的解释]",
}
```

### 扩展形式

```python
# 排序数据（ranking）—— 信息量更大
ranking_sample = {
    "prompt": "解释什么是快速排序算法",
    "responses": [
        {"text": "...", "rank": 1, "score": 4.5},  # 最好
        {"text": "...", "rank": 2, "score": 3.8},
        {"text": "...", "rank": 3, "score": 2.1},
        {"text": "...", "rank": 4, "score": 1.2},  # 最差
    ],
}

# 分数数据（rating）—— 绝对质量评估
rating_sample = {
    "prompt": "解释什么是快速排序算法",
    "response": "快速排序是一种分治算法...",
    "scores": {
        "helpfulness": 4.5,
        "accuracy": 5.0,
        "clarity": 4.0,
        "safety": 5.0,
    },
}
```

### Margin 的重要性

偏好对中 chosen 和 rejected 之间的**质量差距（margin）**对训练效果有重要影响：

```
Margin 太小（chosen 和 rejected 质量差不多）：
  → DPO 梯度信号弱，学习效果差
  → 模型很难区分"好"和"更好"

Margin 太大（一个很好，一个很差）：
  → 梯度信号强但信息少
  → 模型只学会了"避免很差的回复"，没学会"从好到更好"

Margin 适中（明显可区分但不极端）：
  → 最佳学习效果
  → 模型学会了精细的质量判别

推荐：构造偏好数据时，同时包含不同 margin 的样本
  - 30% 大 margin（教模型基本判别）
  - 50% 中 margin（教模型精细判别）
  - 20% 小 margin（教模型在边界情况下做决策）
```

---

## 14.3 人工偏好标注

### 标注协议设计

**成对比较（Pairwise Comparison）** 是最常用的标注方式：

```
标注界面设计：

┌──────────────────────────────────────────────┐
│ Prompt: "解释什么是量子纠缠"                    │
├──────────────────────┬───────────────────────┤
│     回复 A           │     回复 B             │
│ (随机左右排列)        │                       │
│ "量子纠缠是一种..."   │ "纠缠就是两个粒子..."   │
├──────────────────────┴───────────────────────┤
│ 哪个回复更好？                                  │
│ ○ A 明显更好  ○ A 稍好  ○ 差不多               │
│ ○ B 稍好     ○ B 明显更好                      │
│                                              │
│ 判断依据（多选）：                               │
│ □ 准确性  □ 完整性  □ 清晰度  □ 安全性          │
└──────────────────────────────────────────────┘
```

### 标注中最难定义的规则

```
困难 1: Helpful vs Harmless 的冲突
  User: "怎么配一把锁？"
  → 可能是锁匠学徒（合理请求）
  → 也可能是入室盗窃（有害请求）
  → 标注指南需要明确处理策略

困难 2: 主观偏好
  User: "写一首关于春天的诗"
  Response A: 古典风格，含蓄优美
  Response B: 现代风格，直白生动
  → 哪个"更好"？取决于标注员的个人品味
  → 解决方案：明确"不评判风格偏好，只评判执行质量"

困难 3: 长度偏好
  短而精确的回复 vs 长而详细的回复
  → 人类标注员倾向于偏好更长的回复（"信息更多=更好"）
  → 这个偏差会被模型学到，导致"啰嗦"
  → 解决方案：在标注指南中明确"简洁但完整优于冗长但重复"
```

---

## 14.4 自动偏好数据构造

### LLM-as-Judge

用强模型来评判弱模型的输出，生成偏好数据：

```python
"""
LLM-as-Judge 偏好数据生成
"""

JUDGE_PROMPT = """请比较以下两个回复的质量。

用户问题：{prompt}

回复 A：
{response_a}

回复 B：
{response_b}

请从以下维度评估：
1. 准确性：信息是否正确
2. 完整性：是否充分回答了问题
3. 清晰度：是否易于理解
4. 实用性：是否对用户有实际帮助

请给出你的判断：
- 如果 A 更好，输出 "[[A]]"
- 如果 B 更好，输出 "[[B]]"
- 如果差不多，输出 "[[tie]]"

简要说明理由（1-2 句话）。"""

def generate_preference_pair(
    prompt: str,
    model_a_response: str,
    model_b_response: str,
    judge_model,
    swap_positions: bool = True,
) -> dict:
    """
    用 LLM-as-Judge 生成偏好对

    关键：进行位置交换来消除位置偏好
    """
    # 正序评判
    result_1 = judge_model.generate(
        JUDGE_PROMPT.format(
            prompt=prompt,
            response_a=model_a_response,
            response_b=model_b_response,
        )
    )

    if swap_positions:
        # 反序评判（消除位置偏好）
        result_2 = judge_model.generate(
            JUDGE_PROMPT.format(
                prompt=prompt,
                response_a=model_b_response,
                response_b=model_a_response,
            )
        )

        # 只有两次评判一致时才采用
        winner_1 = parse_winner(result_1)  # "A", "B", or "tie"
        winner_2 = parse_winner(result_2)  # "A", "B", or "tie"

        # 反转 winner_2（因为位置交换了）
        winner_2_flipped = {"A": "B", "B": "A", "tie": "tie"}[winner_2]

        if winner_1 != winner_2_flipped:
            return {"status": "inconsistent", "discard": True}

        winner = winner_1
    else:
        winner = parse_winner(result_1)

    if winner == "A":
        return {"prompt": prompt, "chosen": model_a_response, "rejected": model_b_response}
    elif winner == "B":
        return {"prompt": prompt, "chosen": model_b_response, "rejected": model_a_response}
    else:
        return {"status": "tie", "discard": True}

def parse_winner(judge_output: str) -> str:
    if "[[A]]" in judge_output: return "A"
    if "[[B]]" in judge_output: return "B"
    return "tie"
```

### 合成偏好的偏差分析

LLM-as-Judge 有已知的系统性偏差：

| 偏差类型 | 表现 | 影响 | 缓解方法 |
|---------|------|------|---------|
| 位置偏好 | 倾向于选择第一个回复 | 数据不公平 | 位置交换 + 一致性检查 |
| 长度偏好 | 倾向于选择更长的回复 | 模型变啰嗦 | 长度归一化 + 明确指令 |
| 自我偏好 | 倾向于选择自己风格的回复 | 多样性下降 | 多模型交叉评判 |
| 格式偏好 | 偏好 markdown 格式 | 过度格式化 | 明确评判标准 |

---

## 本章要点回顾

1. **偏好学习从 RLHF 演变到 GRPO**，复杂度不断降低，但数据质量要求不变
2. **偏好对的 margin 很重要**：混合不同 margin 的样本效果最好
3. **人工标注的核心挑战**是处理 helpful/harmless 冲突和主观偏好
4. **LLM-as-Judge 是规模化的关键**，但需要位置交换来消除位置偏好
5. **On-policy 数据比 off-policy 重要**：用当前模型生成候选比用旧数据好
