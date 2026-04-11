---
title: "中训练的灾难性遗忘与稳定性"
description: "灾难性遗忘的防控、训练策略与遗忘检测评估"
date: 2026-03-21
updatedDate: 2026-04-09
bookSlug: "data-engineering"
chapter: 10
part: "第二部分：中训练数据"
partOrder: 2
tags: [灾难性遗忘,Replay,稳定性]
---

> *"学习新事物最困难的部分不是记住新东西，而是不忘掉旧东西。"*
>
> 这句话对大模型同样成立——甚至更为残酷：**模型不会告诉你它忘了什么。**

---

## 10.1 灾难性遗忘（Catastrophic Forgetting）

### 什么是遗忘？

在中训练的语境下，灾难性遗忘指的是：**模型在新数据上训练后，在之前已经掌握的任务或知识上表现显著退化。**

这不是一个理论风险——它是每个做过中训练的团队都会遇到的实际问题。

```
一个典型的场景：
  - 你有一个通用 7B 模型，MMLU 分数 55%，C-Eval 50%
  - 你在 200B 的代码+数学数据上做中训练
  - 中训练后：HumanEval 从 25% 飙升到 50% ✓
  - 但是：MMLU 从 55% 跌到 45%，C-Eval 从 50% 跌到 38% ✗
  
  你增强了代码能力，但付出了丢失通用知识的代价。
```

### 遗忘的机制

从参数更新的角度理解遗忘：

1. **参数覆盖**：模型的权重是有限的。当在新分布上训练时，参数会被更新以适应新分布，但这些更新可能覆盖了之前学到的模式

2. **表示漂移**：中间层的表示会向新数据的分布漂移。如果新数据和旧数据的分布差异大，漂移就大，遗忘就严重

3. **注意力重分配**：注意力头可能从关注"通用模式"转向关注"领域特定模式"，导致通用能力下降

### 遗忘的模式

2025 年 ACL 的论文《Exploring Forgetting in LLM Pre-Training》首次系统性地研究了预训练/中训练过程中的遗忘模式，发现遗忘不是均匀的：

**选择性遗忘**：
- 低频知识比高频知识更容易被遗忘
- 与新训练数据分布差异大的知识更容易被遗忘
- 跨语言知识比同语言知识更脆弱

**遗忘的阶段性**：
- 遗忘在中训练初期最严重（前 10% 的训练步）
- 之后遗忘速率逐渐放缓
- 但总遗忘量随训练量增加而持续增长

**模型规模的影响**：
- 令人意外的是，**更大的模型遗忘更严重**
- 假说：大模型的参数有更多"冗余"用于适应新分布，因此更容易发生参数覆盖
- 但大模型的绝对能力基数也更高，所以遗忘后的绝对水平可能仍然高于小模型

### 虚假遗忘：性能下降 ≠ 知识丢失

上面讨论的遗忘机制默认了一个假设：**评估指标下降就意味着模型丢失了知识。** 但这个假设并不总是成立。

2025 年 ICLR 上发表的 [Spurious Forgetting](https://arxiv.org/abs/2501.13453) 研究首次揭示了一种被长期忽视的现象——**虚假遗忘（Spurious Forgetting）**：模型在持续学习后，虽然在旧任务上的评估分数下降了，但知识并未真正丢失。真正发生的是模型丧失了对旧任务格式的**任务对齐（task alignment）**。

```
真实遗忘 vs 虚假遗忘：

真实遗忘（Genuine Forgetting）：
  └── 知识确实从参数中被覆盖/丢失
  └── 无论怎么提示，模型都无法恢复

虚假遗忘（Spurious Forgetting）：
  └── 知识仍存在于参数中
  └── 但模型"忘记了"如何按旧格式输出
  └── 通过少量 re-alignment（如 few-shot 提示或轻量微调）可以恢复
```

这一发现的实践意义很大：

1. **评估遗忘前先做 re-alignment 验证**：在判定模型"遗忘"之前，先尝试用少量 in-context examples 或轻量提示工程恢复表现。如果能恢复，就是虚假遗忘，不需要加大回放比例
2. **避免对虚假遗忘过度反应**：如果把虚假遗忘当真实遗忘处理，可能会不必要地增加回放数据量，浪费训练容量
3. **监控体系需要升级**：仅看 benchmark 分数变化不够，需要区分两类遗忘。实操上可以在评估 pipeline 中增加一个"re-alignment 验证"步骤

### 哪些能力最容易被遗忘？

基于多个研究和实践经验的总结：

| 能力维度 | 遗忘风险 | 原因 | 保护策略 |
|---------|---------|------|---------|
| 世界知识（MMLU 类） | 高 | 知识点分散，中训练不覆盖就会退化 | 回放通用数据 |
| 语言理解（阅读理解） | 中 | 基础语言能力较鲁棒 | 保留自然语言数据 |
| 数学推理 | 中-高 | 依赖特定的推理模式 | 保留数学数据 |
| 代码生成 | 中 | 依赖语法和模式记忆 | 保留代码数据 |
| 多语言能力 | 极高 | 非目标语言的数据减少后快速退化 | 多语言回放 |
| 创意写作 | 高 | 格式化数据训练压制创造性 | 保留文学数据 |
| 安全对齐 | 中 | 中训练可能冲淡安全训练 | 重新做安全对齐 |

---

## 10.2 数据层面的遗忘防控

### 回放策略（Experience Replay）

**回放是对抗遗忘最有效且最直接的方法。** 核心思路：在中训练数据中混入一定比例的预训练数据（或其高质量子集），让模型在学习新知识的同时"复习"旧知识。

```python
"""
回放数据的配置框架
"""

from dataclasses import dataclass
from typing import Dict

@dataclass
class ReplayConfig:
    """回放策略配置"""

    # 回放数据占中训练总数据的比例
    replay_ratio: float = 0.3

    # 回放数据的来源分布（应该近似预训练的分布）
    replay_distribution: Dict[str, float] = None

    # 是否按能力维度精选回放数据
    targeted_replay: bool = True

    def __post_init__(self):
        if self.replay_distribution is None:
            self.replay_distribution = {
                "high_quality_web": 0.40,
                "code": 0.15,
                "math": 0.10,
                "academic": 0.10,
                "books": 0.10,
                "multilingual": 0.10,
                "creative_writing": 0.05,
            }

def design_replay_strategy(
    midtraining_objective: str,
    midtraining_tokens: float,
    forgetting_tolerance: str = "low"
) -> ReplayConfig:
    """
    根据中训练目标设计回放策略

    forgetting_tolerance:
    - "low": 不能接受任何能力退化 → 回放比例高
    - "medium": 可以接受 1-2% 的退化 → 回放比例中等
    - "high": 可以接受 3-5% 的退化 → 回放比例低
    """
    # 回放比例
    ratio_map = {
        "low": 0.40,
        "medium": 0.25,
        "high": 0.15,
    }
    replay_ratio = ratio_map.get(forgetting_tolerance, 0.25)

    # 根据中训练目标调整回放分布
    if midtraining_objective == "code":
        # 代码中训练时，回放重点保留数学和自然语言
        replay_dist = {
            "high_quality_web": 0.30,
            "math": 0.20,     # 保护数学能力
            "academic": 0.15,
            "books": 0.15,
            "multilingual": 0.15,
            "creative_writing": 0.05,
        }
    elif midtraining_objective == "domain_medical":
        # 医学领域中训练，回放重点保留通用能力
        replay_dist = {
            "high_quality_web": 0.35,
            "code": 0.15,
            "math": 0.10,
            "academic": 0.15,
            "books": 0.10,
            "multilingual": 0.10,
            "creative_writing": 0.05,
        }
    elif midtraining_objective == "long_context":
        # 长上下文扩展，回放保持原有能力
        replay_dist = {
            "high_quality_web": 0.30,
            "code": 0.20,
            "math": 0.15,
            "academic": 0.15,
            "books": 0.10,
            "multilingual": 0.10,
        }
    else:
        replay_dist = None  # 使用默认分布

    return ReplayConfig(
        replay_ratio=replay_ratio,
        replay_distribution=replay_dist,
        targeted_replay=True,
    )

# 示例
config = design_replay_strategy("code", 500e9, "medium")
print(f"回放比例: {config.replay_ratio*100}%")
print(f"回放数据量: {config.replay_ratio * 500e9 / 1e9:.0f}B tokens")
for domain, ratio in config.replay_distribution.items():
    print(f"  {domain}: {ratio*100:.0f}%")
```

### 回放比例的选择

这是中训练中最关键的超参数之一。以下是经验性的指导：

| 中训练场景 | 经验回放比例 | 理由 |
|-----------|------------|------|
| 长上下文扩展 | 30-40% | 数据分布变化小，但能力要求高 |
| 代码/数学增强 | 25-35% | 数据分布变化中等 |
| 单一领域注入 | 35-50% | 数据分布变化大，遗忘风险高 |
| 多语言增强 | 30-40% | 需要保护原语言能力 |
| 综合中训练 | 20-30% | 目标数据本身已较多样 |

> **⚠️ 注意**：上表是基于 2023-2024 年工程经验的**经验性指导**，适合作为快速参考的起点。但 2025-2026 年的研究表明，回放比例可以通过 Scaling Laws 更精确地计算。

#### 从经验值到 Scaling Law 预测

两项研究从根本上改变了回放比例的设定方式：

**Apple Forgetting Scaling Laws**（[ICLR 2026](https://arxiv.org/abs/2502.06042)）推导出遗忘量与回放比例之间存在**幂律关系**，并量化了目标域、可用目标数据量、模型规模三个维度的交互。关键发现：在特定条件下，仅需混入 **1% 的预训练数据**即可有效防止遗忘——远低于传统经验的 20-40%。

**CMR Scaling Law**（[EMNLP 2024](https://arxiv.org/abs/2407.17467)）提出了 Critical Mixture Ratio 的概念：给定目标域和模型规模，可以用小规模实验预测"恰好不遗忘"的最小回放比例。这使得回放比例可以从"经验猜测"走向"数学预测"。

两项研究的实践指导可以归纳为：

```
回放比例的设定路线：

经验时代（2023-2024）：
  └── 查表 → 设定 20-40% → 观察效果 → 手动调整

Scaling Law 时代（2025-）：
  └── 小规模实验 → 拟合幂律关系 → 计算 CMR → 精确设定
  └── 关键变量：目标域分布差异越大 → 需要回放越多
                模型规模越大 → 需要回放越少
                回放数据质量越高 → 需要回放越少
```

需要注意的是，1% 是理想条件下的下界。实际工程中通常需要更高比例来覆盖多个能力维度（语言、推理、知识等）。但核心变化是：**不再盲目设定 30%**，而是根据具体场景计算最优比例。

> **💡 反直觉发现**
>
> 回放数据不需要和预训练数据一模一样。实际上，**用预训练数据的高质量子集做回放效果更好**——因为回放的目标不是"重现预训练"，而是"保持关键能力"。高质量子集在更少的 token 中包含了更密集的知识信号。这也解释了为什么 Scaling Law 预测的比例远低于经验值——质量上去了，数量可以下来。

### 智能回放选择：从静态到动态

上面讨论的回放配比假设回放数据是预先选好的静态子集。但回放的效果还取决于另一个维度：**选什么样本来回放。**

[SuRe（Surprise-prioritised Replay）](https://arxiv.org/abs/2511.22367)提出将回放从"静态选择"升级为"动态优先级排序"，核心思想是将回放效果拆解为两个独立维度：

1. **选择策略（What to replay）**：不是随机选，而是用模型当前参数对候选回放数据计算 NLL（负对数似然），优先回放模型最"惊讶"的样本——这些正是模型正在遗忘的内容
2. **整合方式（How to consolidate）**：使用 EMA（指数移动平均）维护一个慢权重（slow weights），快学习器适应新数据，慢学习器保持旧知识的表示

> **实践定位**：静态均匀回放仍然是合理且简单的默认策略。惊奇度驱动的回放更适用于回放预算受限、需要最大化每个回放样本效率的场景。这种方法目前主要在持续学习研究中得到验证，尚未在大规模中训练（>100B token）中被广泛采用。

### 配比策略：新域数据 vs 旧域数据

```python
"""
中训练数据配比的决策框架
"""

def midtraining_mix_calculator(
    target_abilities: list,           # 要增强的能力列表
    ability_priorities: dict,          # 每个能力的优先级 (1-10)
    total_tokens: float,              # 总训练 token 数
    available_data: dict,             # 各类数据的可用量
    forgetting_tolerance: str = "low" # 遗忘容忍度
) -> dict:
    """
    计算中训练的数据配比

    算法：
    1. 先分配回放数据（保底）
    2. 按优先级分配目标能力数据
    3. 用高质量通用数据填充剩余
    """
    # Step 1: 回放分配
    replay_ratios = {"low": 0.35, "medium": 0.25, "high": 0.15}
    replay_ratio = replay_ratios[forgetting_tolerance]
    replay_tokens = total_tokens * replay_ratio

    # Step 2: 目标能力数据分配
    remaining = total_tokens - replay_tokens
    total_priority = sum(ability_priorities.values())
    target_allocation = {}
    for ability in target_abilities:
        priority = ability_priorities.get(ability, 5)
        allocation = remaining * (priority / total_priority)
        # 不能超过可用量
        available = available_data.get(ability, float('inf'))
        allocation = min(allocation, available)
        target_allocation[ability] = allocation

    # Step 3: 剩余用通用高质量数据填充
    allocated = sum(target_allocation.values()) + replay_tokens
    filler = total_tokens - allocated

    result = {
        "total_tokens": f"{total_tokens/1e9:.0f}B",
        "replay": {
            "tokens": f"{replay_tokens/1e9:.0f}B",
            "ratio": f"{replay_ratio*100:.0f}%",
        },
        "target_abilities": {
            ability: {
                "tokens": f"{tokens/1e9:.0f}B",
                "ratio": f"{tokens/total_tokens*100:.1f}%",
            }
            for ability, tokens in target_allocation.items()
        },
        "filler_high_quality": {
            "tokens": f"{filler/1e9:.0f}B",
            "ratio": f"{filler/total_tokens*100:.1f}%",
        }
    }

    return result
```

### 数据排列顺序对遗忘的影响

中训练数据的排列顺序不是无关紧要的。

**三种策略：**

1. **均匀混合（Uniform Mixing）**
   - 每个 batch 中均匀混合新旧数据
   - 优点：简单，遗忘最少
   - 缺点：新知识的学习效率可能不是最优
   - **推荐作为默认策略**

2. **渐进式过渡（Progressive Transition）**
   - 开始时回放比例高，逐渐降低；新数据比例逐渐升高
   - 优点：平滑过渡，减少初期遗忘
   - 缺点：实现稍复杂

3. **先新后旧（New First, Then Review）**
   - 先大量训练新数据，然后用旧数据"恢复"遗忘
   - 优点：新知识学习效率高
   - 缺点：遗忘恢复可能不完全；如果旧数据不够，恢复效果差
   - **不推荐**

```python
"""
中训练数据排列策略
"""

import numpy as np

def generate_mixing_schedule(
    total_steps: int,
    strategy: str = "uniform",
    new_data_final_ratio: float = 0.6,  # 最终新数据占比
) -> list:
    """
    生成每个 step 的数据混合比例
    返回每个 step 的 new_data_ratio
    """
    if strategy == "uniform":
        # 均匀混合
        return [new_data_final_ratio] * total_steps

    elif strategy == "progressive":
        # 渐进式：从 0.3 线性增长到 final_ratio
        start_ratio = 0.3
        return [start_ratio + (new_data_final_ratio - start_ratio) * i / total_steps
                for i in range(total_steps)]

    elif strategy == "warmup_stable":
        # warmup 后稳定
        warmup_steps = int(total_steps * 0.1)
        schedule = []
        for i in range(total_steps):
            if i < warmup_steps:
                ratio = 0.2 + (new_data_final_ratio - 0.2) * i / warmup_steps
            else:
                ratio = new_data_final_ratio
            schedule.append(ratio)
        return schedule

    else:
        raise ValueError(f"Unknown strategy: {strategy}")
```

---

## 10.3 训练策略层面的稳定性

### 学习率的选择

学习率是影响遗忘程度的最重要训练超参数。

**经验法则：**
- 中训练的起始学习率通常是预训练峰值学习率的 **1/5 到 1/3**
- 学习率越高，学习新知识越快，但遗忘也越严重
- 学习率越低，遗忘越少，但学习效率也越低

```
预训练峰值 lr = 3e-4
  ├── 激进中训练: lr = 1e-4   → 学得快，忘得多
  ├── 平衡中训练: lr = 5e-5   → 推荐默认值
  └── 保守中训练: lr = 2e-5   → 忘得少，学得慢
```

**三种学习率策略的选择：**

| 策略 | 学习率方案 | 适用场景 | 遗忘程度 |
|------|-----------|---------|---------|
| 直接退火 | 从预训练末期 lr 开始余弦退火 | 目标与预训练相近 | 最低 |
| 短暂 warmup 后退火 | 先 warmup 到中等 lr，然后退火 | 通用中训练（推荐） | 低-中 |
| 重新 warmup | warmup 到较高 lr，然后退火 | 大幅领域转换 | 中-高 |

### 权重平均（Weight Averaging / Model Merging）

一种优雅的遗忘缓解方案是**权重平均**：将中训练后的模型权重与中训练前的模型权重做加权平均。

```python
"""
权重平均缓解遗忘
"""

import torch

def weight_averaging(
    pretrained_state_dict: dict,
    midtrained_state_dict: dict,
    alpha: float = 0.7,  # 中训练权重的比例
) -> dict:
    """
    简单的线性权重平均

    alpha=1.0: 完全使用中训练权重（无回退）
    alpha=0.5: 等权平均
    alpha=0.7: 偏向中训练（推荐起点）
    """
    merged = {}
    for key in pretrained_state_dict:
        if key in midtrained_state_dict:
            merged[key] = (
                alpha * midtrained_state_dict[key] +
                (1 - alpha) * pretrained_state_dict[key]
            )
        else:
            merged[key] = midtrained_state_dict[key]
    return merged

def find_optimal_alpha(
    pretrained_state_dict: dict,
    midtrained_state_dict: dict,
    eval_fn,  # 评估函数，输入 state_dict，返回 (new_task_score, old_task_score)
    alpha_range: list = None,
) -> dict:
    """
    搜索最优的 alpha 值
    通过在多个 alpha 上评估，找到新旧能力的最佳平衡点
    """
    if alpha_range is None:
        alpha_range = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

    results = []
    for alpha in alpha_range:
        merged = weight_averaging(pretrained_state_dict, midtrained_state_dict, alpha)
        new_score, old_score = eval_fn(merged)
        results.append({
            "alpha": alpha,
            "new_task_score": new_score,
            "old_task_score": old_score,
            "harmonic_mean": 2 * new_score * old_score / max(new_score + old_score, 1e-8),
        })

    # 选择调和平均最高的 alpha
    best = max(results, key=lambda x: x["harmonic_mean"])
    return {
        "optimal_alpha": best["alpha"],
        "all_results": results,
        "recommendation": f"alpha={best['alpha']}: new={best['new_task_score']:.1f}%, "
                         f"old={best['old_task_score']:.1f}%"
    }
```

**权重平均的优势：**
- 零额外训练成本——只需做一次权重合并
- 可以在不同 alpha 上快速实验
- 效果出奇地好：通常能恢复 50-80% 的遗忘

**权重平均的限制：**
- 线性平均假设参数空间是凸的，但实际并非如此
- 对于差异很大的模型（中训练很长时间），效果会下降
- 不能完全替代数据回放——两者配合使用效果最好

### 更高级的合并方法

除了简单的线性平均，还有多种更高级的模型合并方法：

1. **SLERP（球面线性插值）**：在球面上进行插值，理论上更适合高维参数空间
2. **TIES-Merging**：只合并"重要"的参数变化，消除冲突
3. **DARE**：随机删除小的参数变化，然后重新缩放
4. **Task Arithmetic**：用"任务向量"（中训练后减去中训练前的参数差）进行加减运算
5. **RECALL（表示对齐合并）**：利用隐层表示（hidden representations）的相似度指导**逐层合并**（[EMNLP 2025](https://arxiv.org/abs/2510.20479)）

前四种方法的合并系数都是**全局统一**的——所有层使用同一个 alpha。RECALL 的关键升级在于引入了**逐层自适应**：

```
全局统一合并 vs 逐层自适应合并：

全局统一（方法 1-4）：
  所有层统一 alpha=0.7
  └── 简单，但忽略了不同层的漂移差异

逐层自适应（RECALL）：
  Layer 0: alpha=0.9  ← 表示漂移大，保留更多旧权重
  Layer 5: alpha=0.6  ← 表示漂移小，可以用更多新权重
  Layer 10: alpha=0.8 ← 中等漂移
  ...
  └── 只需在少量聚类样本上计算表示相似度，成本很低
```

RECALL 不需要访问历史训练数据，可以和 TIES/DARE 组合使用——先用 TIES 消除参数冲突，再用 RECALL 决定逐层合并比例。

### EWC 与参数高效方案

**弹性权重巩固（Elastic Weight Consolidation, EWC）**是经典的遗忘防控方法：

```python
"""
EWC 的核心思想（简化版）
"""

def ewc_loss(
    model_params: dict,
    pretrained_params: dict,
    fisher_information: dict,  # 预训练参数的 Fisher 信息矩阵
    lambda_ewc: float = 1.0,   # EWC 正则化强度
    standard_loss: float = 0.0, # 正常训练损失
) -> float:
    """
    EWC 损失 = 标准损失 + λ * Σ F_i * (θ_i - θ*_i)²

    核心思想：
    - Fisher 信息矩阵的对角元素 F_i 衡量参数 θ_i 对旧任务的重要性
    - 重要的参数（F_i 大）变化被惩罚得更重
    - 不重要的参数（F_i 小）可以自由变化去适应新任务
    """
    ewc_penalty = 0.0
    for name in model_params:
        if name in fisher_information:
            ewc_penalty += (
                fisher_information[name] *
                (model_params[name] - pretrained_params[name]) ** 2
            ).sum()

    total_loss = standard_loss + lambda_ewc * ewc_penalty
    return total_loss
```

**EWC 在大模型中训练中的实际应用有限**，原因包括：
- Fisher 信息矩阵的计算对大模型来说成本很高
- 只用对角近似效果有限
- 在实践中，数据回放 + 学习率调整通常就够了

**LoRA/QLoRA 作为遗忘缓解方案：**

一种越来越流行的做法是在中训练中使用参数高效微调（PEFT）方法。2026 年的[大规模实证研究](https://www.semanticscholar.org/paper/Low-Rank-Adaptation-Reduces-Catastrophic-Forgetting-Pandey/a274edd844ccdde5022ef062f9a391a2c5d0cc38)表明，标准 LoRA（无任何额外正则化）本身就是持续学习中强大的遗忘缓解基线——低秩约束提供了**选择性可塑性（selective plasticity）**：只允许模型在低秩子空间内调整，天然限制了参数空间中的干扰范围。

```
LoRA 的遗忘缓解技术路线：

标准 LoRA（基线）：
  ├── 低秩约束 → 天然限制参数干扰 → 遗忘小
  ├── 但仍可能干扰预训练权重的主要奇异方向
  └── 适用：轻量级领域适应

OPLoRA（正交投影 LoRA）：
  ├── 双边正交投影约束：更新限制在主要奇异方向的正交补空间
  ├── 理论保证：微调不会干扰已学知识的编码
  └── 适用：遗忘敏感场景（LLaMA-2 7B / Qwen2.5 7B 上已验证）
```

[OPLoRA](https://arxiv.org/abs/2510.13003) 揭示了标准 LoRA 的一个盲区：虽然只更新低秩矩阵、主干参数不变，但低秩更新仍然可能干扰预训练权重的**主要奇异方向**——这些方向编码了模型最重要的已学知识。OPLoRA 的双边正交投影将更新约束在这些方向的正交补空间内，从理论上保证微调不会覆盖已有知识。

```
全参数中训练 vs LoRA 中训练

全参数中训练：
  ├── 优点：学习能力强，能做大幅度调整
  ├── 缺点：遗忘风险高，需要大量回放数据
  └── 适用：大规模中训练（>100B token）

LoRA 中训练：
  ├── 优点：低秩约束天然缓解遗忘（选择性可塑性）
  ├── 注意：学习容量受秩限制，大幅调整需要更高的秩或多阶段策略
  └── 适用：轻量级领域适应（10B-50B token）

折中方案：阶段性 LoRA → 合并 → 再 LoRA
  ├── 第 1 阶段：LoRA 训练一段（遗忘小）
  ├── 合并 LoRA 参数到主干
  ├── 第 2 阶段：在合并后的模型上再加 LoRA
  └── 优点：分步累积变化，每步遗忘都可控
```

---

## 10.4 遗忘检测与评估

### 遗忘监控指标体系

```python
"""
中训练遗忘监控系统
"""

from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class ForgettingMetrics:
    """遗忘监控指标"""
    # 绝对分数
    current_scores: Dict[str, float]    # 当前各 benchmark 分数
    baseline_scores: Dict[str, float]   # 中训练前的分数

    # 遗忘量
    forgetting: Dict[str, float] = None  # 各维度的遗忘量

    # 汇总
    max_forgetting: float = 0.0         # 最大遗忘量
    avg_forgetting: float = 0.0         # 平均遗忘量
    num_degraded: int = 0               # 退化的维度数量

    def __post_init__(self):
        self.forgetting = {}
        for key in self.baseline_scores:
            if key in self.current_scores:
                delta = self.current_scores[key] - self.baseline_scores[key]
                self.forgetting[key] = round(delta, 2)

        degraded = [v for v in self.forgetting.values() if v < -0.5]
        self.max_forgetting = min(self.forgetting.values()) if self.forgetting else 0
        self.avg_forgetting = sum(degraded) / max(len(degraded), 1) if degraded else 0
        self.num_degraded = len(degraded)

    def report(self) -> str:
        lines = ["遗忘监控报告", "=" * 50]

        # 汇总
        status = "🟢 正常" if self.max_forgetting > -2 else (
            "🟡 轻微遗忘" if self.max_forgetting > -5 else "🔴 严重遗忘"
        )
        lines.append(f"状态: {status}")
        lines.append(f"退化维度数: {self.num_degraded}/{len(self.forgetting)}")
        lines.append(f"最大遗忘: {self.max_forgetting:+.2f}%")
        lines.append(f"平均遗忘: {self.avg_forgetting:+.2f}%")
        lines.append("")

        # 详细
        lines.append(f"{'维度':<20} {'基线':>8} {'当前':>8} {'变化':>8} {'状态':>4}")
        lines.append("-" * 52)
        for key in sorted(self.forgetting.keys()):
            baseline = self.baseline_scores[key]
            current = self.current_scores[key]
            delta = self.forgetting[key]
            status = "✅" if delta > -1 else ("⚠️" if delta > -3 else "❌")
            lines.append(f"{key:<20} {baseline:>7.1f}% {current:>7.1f}% {delta:>+7.1f}% {status}")

        return "\n".join(lines)

# 使用示例
metrics = ForgettingMetrics(
    baseline_scores={
        "MMLU": 55.0, "C-Eval": 50.0, "HellaSwag": 72.0,
        "ARC": 48.0, "HumanEval": 25.0, "GSM8K": 40.0,
    },
    current_scores={
        "MMLU": 52.0, "C-Eval": 46.0, "HellaSwag": 71.5,
        "ARC": 47.0, "HumanEval": 50.0, "GSM8K": 58.0,
    },
)
print(metrics.report())
```

### 实时评估 vs 离线评估

| 评估方式 | 频率 | 成本 | 覆盖面 | 适用场景 |
|---------|------|------|--------|---------|
| **实时评估** | 每 1-5B token | 低 | 2-3 个 benchmark | 日常监控 |
| **定期评估** | 每 20-50B token | 中 | 6-10 个 benchmark | 里程碑检查 |
| **离线评估** | 完成后 | 高 | 全部 benchmark + 人工 | 最终验证 |

**实时评估的关键**：选择对遗忘最敏感的 benchmark 作为"金丝雀"指标。

推荐的"金丝雀" benchmark：
- **MMLU**：对世界知识遗忘最敏感
- **HellaSwag**：对常识推理遗忘敏感
- **C-Eval/CMMLU**：对中文能力遗忘敏感（如果是中文模型）

### 快速遗忘检测的 Proxy 方法

完整的 benchmark 评估耗时较长。以下是几种快速检测遗忘的方法：

**方法 1：训练数据子集的 Perplexity**

```python
def quick_forgetting_check(
    model,
    pretrain_sample: list,  # 预训练数据的小样本（1000-5000 条）
    midtrain_sample: list,  # 中训练数据的小样本
) -> dict:
    """
    快速遗忘检测
    
    如果模型在预训练数据上的 PPL 显著升高，说明遗忘正在发生
    """
    pretrain_ppl = compute_perplexity(model, pretrain_sample)
    midtrain_ppl = compute_perplexity(model, midtrain_sample)

    return {
        "pretrain_ppl": pretrain_ppl,
        "midtrain_ppl": midtrain_ppl,
        "ppl_ratio": pretrain_ppl / max(midtrain_ppl, 1),
        "warning": pretrain_ppl > midtrain_ppl * 1.5,
        # 如果预训练数据的 PPL 比中训练数据高 50% 以上，可能有遗忘
    }
```

**方法 2：隐层表示的漂移检测**

监控模型中间层输出的变化，如果特定层的表示发生大幅漂移，可能预示着遗忘。

**方法 3：生成样本的定性检查**

给模型一组固定的 prompt，在中训练过程中定期生成回复，人工检查是否出现退化。这是最直观但也最难自动化的方法。

---

## 10.5 🔬 显微镜案例：一次遗忘问题的发现与修复

### 背景

某团队在一个 13B 中英双语模型上做中训练，目标是增强代码和数学能力。

### 配置

```
预训练模型：13B, 在 5T token 上预训练
中训练数据：300B token
  - 代码数据: 40% (120B)
  - 数学数据: 15% (45B)
  - 通用回放: 20% (60B)
  - 高质量网页: 15% (45B)
  - 中文数据: 10% (30B)
学习率：6e-5, 余弦退火到 1e-6
```

### 发现问题

中训练进行到 150B token（一半）时，实时监控报告了异常：

```
监控告警：
  MMLU: 55.0 → 51.2 (-3.8%)  ⚠️ 超过阈值
  C-Eval: 50.0 → 43.5 (-6.5%) ❌ 严重退化
  HellaSwag: 72.0 → 70.8 (-1.2%)  ✅ 可接受
  
  HumanEval: 25.0 → 42.0 (+17.0%)  ✅ 增长如期
  GSM8K: 40.0 → 55.0 (+15.0%)  ✅ 增长如期
```

代码和数学能力的增长符合预期，但中文知识（C-Eval）出现了严重退化。

### 分析原因

团队进行了详细的排查：

1. **查看中文数据的实际配比**
   - 发现中文数据只有 10%，但预训练中中文数据占 25%
   - 这意味着中训练中中文的"浓度"大幅降低

2. **检查回放数据的语言分布**
   - 20% 的通用回放数据中，中文只占 15%（约 3% 的总训练量）
   - 总的中文数据比例：10% + 20%×15% = 13%，远低于预训练的 25%

3. **对比不同能力的遗忘速率**
   - 英文知识（MMLU）遗忘较慢（-3.8%）
   - 中文知识（C-Eval）遗忘较快（-6.5%）
   - 验证了"非目标语言遗忘更快"的规律

### 修复方案

```
方案：调整后半段训练的数据配比

后 150B token 的数据配比（修正后）：
  - 代码数据: 35% (52.5B)   ← 略降
  - 数学数据: 12% (18B)     ← 略降
  - 通用回放: 18% (27B)     ← 略降
  - 高质量网页: 10% (15B)    ← 降
  - 中文数据: 25% (37.5B)    ← 大幅增加
  
中文数据细分：
  - 中文百科+知乎: 10B
  - 中文学术论文: 5B
  - 中文书籍: 5B
  - 中文代码相关: 7.5B   ← 中文代码注释+文档
  - 中文数学: 5B         ← 中文数学题+教材
  - 中文通用网页: 5B
```

### 结果

中训练完成后的最终评估：

| Benchmark | 中训练前 | 修复前(150B) | 修复后(300B) | 变化 |
|-----------|---------|-------------|-------------|------|
| MMLU | 55.0 | 51.2 | 53.8 | -1.2% ✅ |
| C-Eval | 50.0 | 43.5 | 48.2 | -1.8% ✅ |
| HellaSwag | 72.0 | 70.8 | 71.0 | -1.0% ✅ |
| HumanEval | 25.0 | 42.0 | 48.0 | +23.0% ✅ |
| GSM8K | 40.0 | 55.0 | 60.0 | +20.0% ✅ |

通过及时发现和修复，C-Eval 的退化从 -6.5% 恢复到了 -1.8%，在可接受范围内。

### 教训

1. **中文数据（或目标语言数据）在回放中的比例应该至少等于预训练中的比例**
2. **实时监控是关键**——如果到训练结束才发现遗忘，已经来不及了
3. **数据配比的调整可以在训练中途进行**——这比重新训练划算得多
4. **不同语言的遗忘速率不同**——需要分别监控

---

## 10.6 中训练稳定性的其他考量

> **📌 三阶段视角**
>
> [2026 年最新综述](https://arxiv.org/abs/2603.12658)将 LLM 持续学习方法按训练阶段分为三类，不同阶段的遗忘模式和最优缓解策略截然不同：
> 1. **持续预训练/中训练**（本章主题）：数据回放 + 学习率控制为核心
> 2. **持续微调**：参数高效方法（LoRA/正交约束）+ 正则化为核心
> 3. **持续对齐**：偏好保持 + 安全性维护为核心
>
> 本章聚焦第一阶段。持续微调和持续对齐的数据策略分别在后续的 SFT（第 11-13 章）和对齐（第 14-16 章）中讨论。

### Loss Spike 的预防

中训练中的 loss spike（训练损失突然飙升）是另一个常见问题，通常由以下原因引起：

1. **数据分布突变**：从一个 epoch 切换到另一个 epoch 时，数据分布可能突然变化
2. **上下文长度切换**：从 8K 突然变到 32K
3. **异常数据批次**：少量极端样本导致梯度爆炸

**预防措施：**

```python
"""
中训练稳定性的关键配置
"""

stability_config = {
    # 梯度裁剪（必须设置）
    "gradient_clip_norm": 1.0,

    # 学习率 warmup（中训练开始时）
    "warmup_steps": 200,

    # 数据混合的平滑性
    "batch_mixing": "uniform",  # 每个 batch 都均匀混合各类数据

    # 异常检测
    "loss_spike_threshold": 2.0,  # loss 突然升高超过 2 倍时告警
    "auto_rollback": True,        # loss spike 时自动回退到上一个检查点

    # 检查点频率
    "save_every_steps": 500,      # 频繁保存，方便回退
}
```

### 训练过程中的数据配比动态调整

更高级的方案是根据模型的实时评估结果动态调整数据配比：

```
训练过程中的反馈循环：

  每 N 步 → 快速评估（金丝雀 benchmark）
      ↓
  检测到某维度退化？
      ↓ 是                     ↓ 否
  增加该维度的回放数据比例     保持当前配比
      ↓
  调整后继续训练
```

这种方法在理论上最优，但在实践中有挑战：
- 评估有延迟，可能不够及时
- 频繁调整配比可能引入训练不稳定
- 需要足够灵活的数据加载基础设施

---

## 10.7 认知演变时间线

| 时间 | 认知阶段 | 代表性发现 |
|------|---------|-----------|
| 2019 | "遗忘是微调的问题" | 主要在任务级微调中讨论 |
| 2022 | "继续预训练也会遗忘" | Code Llama 等实践暴露问题 |
| 2023 | "回放数据是关键" | 经验性地发现 20-30% 回放效果好 |
| 2024 | "系统化的遗忘研究" | ACL/EMNLP 上多篇论文量化遗忘；CMR Scaling Law 首次将回放比例形式化 |
| 2025 前半 | "虚假遗忘被识别" | ICLR 2025 Spurious Forgetting——部分遗忘是评测假象而非真实知识丢失 |
| 2025 后半 | "遗忘可数学建模" | Apple Forgetting Scaling Laws（ICLR 2026）——回放比例可精确计算；OPLoRA 正交投影 LoRA 提供理论级遗忘防护 |
| 2026 | "遗忘管理全栈成熟" | 三层防线：Scaling Law 预测回放比例 + 智能回放选择 + 表示对齐逐层合并；方法按训练阶段（预训练/微调/对齐）分化 |

---

> **本章要点回顾**
>
> 1. **灾难性遗忘在中训练中是真实且严重的风险**——不是理论问题
> 2. **区分虚假遗忘和真实遗忘**：性能下降不一定意味着知识丢失，先尝试 re-alignment 验证
> 3. **遗忘是选择性的**：低频知识和非目标语言最脆弱
> 4. **回放是最有效的防控手段**：经验值 20-40%，但 Scaling Laws 可以针对具体场景精确计算最优比例
> 5. **学习率控制是第二道防线**：中训练 lr 应为预训练峰值的 1/5 到 1/3
> 6. **权重平均是零成本的补救方案**：能恢复 50-80% 的遗忘；逐层自适应合并（RECALL）效果更优
> 7. **LoRA 的低秩约束天然缓解遗忘**：正交投影（OPLoRA）提供更严格的理论保证
> 8. **实时监控不可或缺**：发现越早，修复成本越低
> 9. **数据配比可以在训练中途调整**——不需要完全重来
> 10. **分别监控不同语言和不同能力维度的遗忘**

---

## 🛠 动手环节

### 练习 1：遗忘监控 Dashboard

设计一个遗忘监控 dashboard 的 schema：
- 定义需要监控的 5-8 个维度
- 设定每个维度的告警阈值
- 设计监控频率和上报策略

### 练习 2：权重平均实验

如果你有一个微调前和微调后的模型检查点：
- 在不同的 alpha 值（0.3, 0.5, 0.7, 0.9）上做权重平均
- 在 2-3 个 benchmark 上评估每个 alpha 值的效果
- 画出"alpha vs 新能力分数"和"alpha vs 旧能力分数"的帕累托前沿

### 练习 3：回放策略设计

假设你要在一个通用模型上做法律领域中训练：
- 法律数据：50B token
- 总训练预算：150B token
- 回放数据来源：预训练数据的高质量子集（可用 500B token）

设计完整的数据配比方案，包括：回放比例、各领域分布、中文/英文比例、评估方案。

