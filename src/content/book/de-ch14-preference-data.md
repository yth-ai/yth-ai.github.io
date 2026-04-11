---
title: "偏好数据的本质与构造"
description: "从 RLHF 到 GRPO 的偏好学习范式演变与数据构造"
date: 2026-03-21
updatedDate: 2026-03-22
bookSlug: "data-engineering"
chapter: 14
part: "第四部分：RL 数据"
partOrder: 4
tags: [RLHF,DPO,GRPO,偏好数据]
---

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

## 动手环节：构造偏好对并分析 Margin 分布

**目标**：动手构造一批偏好数据，体验 margin 控制和偏差检测的核心技巧。

### 练习 1：模拟 LLM-as-Judge 偏好标注

```python
"""
实现 LLM-as-Judge 的核心逻辑（用规则模拟）
重点体验位置交换去偏差的技巧
"""

import random
from typing import Tuple

def mock_judge(response_a: str, response_b: str) -> str:
    """
    模拟 LLM 评判，带有位置偏好
    真实场景中这是一个 LLM API 调用
    """
    # 模拟评分
    score_a = score_response_quality(response_a)
    score_b = score_response_quality(response_b)

    # 模拟位置偏好：第一个位置有 15% 的额外加分
    POSITION_BIAS = 0.15
    biased_score_a = score_a + POSITION_BIAS
    biased_score_b = score_b

    if biased_score_a > biased_score_b + 0.1:
        return "A"
    elif biased_score_b > biased_score_a + 0.1:
        return "B"
    return "tie"

def score_response_quality(response: str) -> float:
    """启发式质量评分"""
    score = 0.5
    if "##" in response: score += 0.15
    if len(response) > 100: score += 0.1
    if "```" in response: score += 0.1
    if "\n1." in response or "\n-" in response: score += 0.1
    filler_count = sum(response.count(w) for w in ["好的", "嗯", "啦"])
    score -= filler_count * 0.1
    return max(0, min(1, score + random.gauss(0, 0.05)))

def judge_with_swap(
    prompt: str,
    response_a: str,
    response_b: str
) -> dict:
    """
    带位置交换的评判（消除位置偏好）
    """
    # 正序评判
    winner_1 = mock_judge(response_a, response_b)

    # 反序评判
    winner_2 = mock_judge(response_b, response_a)
    winner_2_flipped = {"A": "B", "B": "A", "tie": "tie"}[winner_2]

    # 一致性检查
    if winner_1 == winner_2_flipped:
        return {"winner": winner_1, "consistent": True}
    else:
        return {"winner": "discard", "consistent": False,
                "detail": f"正序={winner_1}, 反序翻转={winner_2_flipped}"}

# 测试
responses = {
    "good": "## 解答\n\n快速排序的核心思想是分治：\n\n"
            "1. 选择基准元素（pivot）\n"
            "2. 将数组分为小于和大于 pivot 的两部分\n"
            "3. 递归排序两个子数组\n\n"
            "```python\ndef quicksort(arr):\n    ...\n```",
    "medium": "快速排序是一种分治算法。选一个基准元素，"
              "把数组分成两部分，然后递归排序。平均时间复杂度 O(nlogn)。",
    "bad": "好的！排序的话就是把数字从小到大排列就行啦~很简单的！"
}

print("=== 位置交换去偏差实验 ===\n")
prompt = "解释快速排序算法"
pairs = [("good", "medium"), ("good", "bad"), ("medium", "bad")]

for a_key, b_key in pairs:
    # 无交换
    no_swap = mock_judge(responses[a_key], responses[b_key])
    # 有交换
    with_swap = judge_with_swap(prompt, responses[a_key], responses[b_key])

    print(f"对比 {a_key} vs {b_key}:")
    print(f"  无交换: winner = {no_swap}")
    print(f"  有交换: winner = {with_swap['winner']}, "
          f"一致 = {with_swap['consistent']}")
    print()
```

### 练习 2：Margin 分布分析

```python
"""
分析偏好对的 margin 分布
验证本章的建议：混合不同 margin 的样本效果最好
"""

def compute_margin(chosen: str, rejected: str) -> float:
    """计算偏好对的 margin（分数差）"""
    score_c = score_response_quality(chosen)
    score_r = score_response_quality(rejected)
    return score_c - score_r

def categorize_margin(margin: float) -> str:
    """根据 margin 大小分类"""
    if margin > 0.4:
        return "大margin（基础判别）"
    elif margin > 0.15:
        return "中margin（精细判别）"
    elif margin > 0:
        return "小margin（边界决策）"
    else:
        return "⚠️ 反转（chosen 可能不如 rejected）"

# 生成一批偏好对
def generate_preference_pairs(n: int = 50) -> list:
    """生成模拟的偏好对"""
    templates = {
        "high": [
            "## 详细解答\n\n这是一个重要的概念。\n\n"
            "### 核心原理\n1. 第一点\n2. 第二点\n3. 第三点\n\n"
            "```python\n# 代码示例\nprint('hello')\n```",
        ],
        "medium": [
            "这个概念比较重要，主要包括几个方面："
            "首先是定义，然后是应用，最后是注意事项。",
        ],
        "low": [
            "嗯这个嘛，就是那个意思吧，你懂的~",
            "好的好的！这个太简单了！就是那样！",
        ],
    }

    pairs = []
    for _ in range(n):
        # 随机选择 chosen 和 rejected 的质量
        chosen_q = random.choices(["high", "medium"], weights=[0.6, 0.4])[0]
        rejected_q = random.choices(["medium", "low"], weights=[0.5, 0.5])[0]

        chosen = random.choice(templates[chosen_q])
        rejected = random.choice(templates[rejected_q])
        margin = compute_margin(chosen, rejected)

        pairs.append({
            "chosen_quality": chosen_q,
            "rejected_quality": rejected_q,
            "margin": margin,
            "category": categorize_margin(margin),
        })

    return pairs

# 分析 margin 分布
pairs = generate_preference_pairs(100)
categories = {}
for p in pairs:
    cat = p["category"]
    categories[cat] = categories.get(cat, 0) + 1

print("=== Margin 分布分析 ===\n")
print(f"总偏好对数: {len(pairs)}\n")
for cat, count in sorted(categories.items()):
    pct = count / len(pairs) * 100
    bar = "█" * int(pct / 2)
    print(f"  {cat:<25} {count:>3} ({pct:>5.1f}%) {bar}")

# 推荐分布
print("\n推荐分布（本章建议）:")
print("  大 margin: 30%")
print("  中 margin: 50%")
print("  小 margin: 20%")

# 思考题：你生成的分布和推荐分布差距多大？如何调整数据构造策略来接近推荐分布？
```

### 练习 3：偏差检测清单

参考本章 14.4 节的偏差分析表，对你在练习 1 中的 mock_judge 做一个偏差审计：
1. 测量位置偏好的严重程度（做 100 次正反序对比，计算不一致率）
2. 测量长度偏好（用同等质量但不同长度的回复测试）
3. 针对发现的偏差，设计缓解策略

---

> **本章要点回顾**
>
> 1. **偏好学习从 RLHF 演变到 GRPO**，复杂度不断降低，但数据质量要求不变
> 2. **偏好对的 margin 很重要**：混合不同 margin 的样本效果最好
> 3. **人工标注的核心挑战**是处理 helpful/harmless 冲突和主观偏好
> 4. **LLM-as-Judge 是规模化的关键**，但需要位置交换来消除位置偏好
> 5. **On-policy 数据比 off-policy 重要**：用当前模型生成候选比用旧数据好

