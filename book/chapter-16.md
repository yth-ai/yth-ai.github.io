# 第 16 章：推理模型的 RL 数据——新范式

> *"The most exciting phrase to hear in science, the one that heralds new discoveries, is not 'Eureka!' but 'That's funny...'"*
> *——Isaac Asimov*
>
> DeepSeek-R1 的"aha moment"——模型自发地学会了反思和自我纠正——正是这样一个"That's funny"时刻。

---

## 16.1 DeepSeek-R1 的启示

### 纯 RL 训练出推理能力的里程碑

2025 年 1 月，DeepSeek 发布了 R1 系列模型，其中 DeepSeek-R1-Zero 是一个里程碑：**它仅通过强化学习（无 SFT warm-start）就获得了强大的推理能力。**

```
DeepSeek-R1-Zero 的训练过程：

  基座模型（DeepSeek-V3-Base）
          ↓
  直接进入 RL 训练
  ├── 算法：GRPO（Group Relative Policy Optimization）
  ├── 数据：数学+代码推理题（含可验证答案）
  ├── 奖励：基于答案正确性的规则奖励
  └── 无 SFT 数据、无人类偏好数据

  训练过程中出现的"涌现"行为：
  1. 模型自发地学会了"chain of thought"推理
  2. 出现了自我反思：生成 "wait, let me reconsider..."
  3. 出现了"aha moment"：模型发现自己之前的错误并修正
```

### GRPO 算法对数据的要求

GRPO 的核心是**不需要独立的奖励模型**，而是用"组内相对排名"来提供学习信号：

```python
"""
GRPO 的数据流程（简化）
"""

def grpo_data_pipeline(
    prompt: str,          # 推理问题
    model,                # 当前策略模型
    reward_fn,            # 奖励函数（如答案正确性）
    group_size: int = 16, # 每组采样数量
) -> dict:
    """
    GRPO 的一次数据生成循环
    """
    # Step 1: 对同一个 prompt，采样 group_size 个回复
    responses = []
    for _ in range(group_size):
        response = model.generate(prompt, temperature=1.0)
        responses.append(response)

    # Step 2: 对每个回复计算奖励
    rewards = [reward_fn(prompt, r) for r in responses]

    # Step 3: 计算组内相对优势
    mean_reward = sum(rewards) / len(rewards)
    std_reward = max(np.std(rewards), 1e-8)
    advantages = [(r - mean_reward) / std_reward for r in rewards]

    # Step 4: 高于平均的回复被"鼓励"，低于平均的被"抑制"
    training_pairs = []
    for response, advantage in zip(responses, advantages):
        training_pairs.append({
            "prompt": prompt,
            "response": response,
            "advantage": advantage,
        })

    return {
        "prompt": prompt,
        "pairs": training_pairs,
        "group_stats": {
            "mean_reward": mean_reward,
            "max_reward": max(rewards),
            "min_reward": min(rewards),
            "solve_rate": sum(1 for r in rewards if r > 0) / group_size,
        },
    }
```

---

## 16.2 可验证奖励（Verifiable Rewards）

### 什么是可验证奖励

可验证奖励是指**可以通过规则或程序自动判断正确性的奖励信号**，不需要人类标注或奖励模型。

| 任务类型 | 验证方法 | 奖励信号 | 可靠性 |
|---------|---------|---------|-------|
| 数学题 | 比较最终答案 | 答案正确 +1，错误 -1 | 高 |
| 代码题 | 运行测试用例 | 全部通过 +1，部分 +0.5 | 极高 |
| 逻辑推理 | 形式化验证器 | 证明有效 +1 | 极高 |
| 翻译 | BLEU/参考答案 | 连续分数 | 中 |
| 问答 | 字符串匹配 | 匹配 +1 | 中 |

**关键认知**：可验证奖励消除了人类偏好标注的瓶颈。在数学和代码领域，你可以生成几乎无限量的训练信号——只需要有足够的题目和正确答案。

### 适用范围与局限

```
可验证奖励适用的场景：
  ✅ 数学推理（有标准答案）
  ✅ 代码生成（有测试用例）
  ✅ 逻辑推理（可形式化验证）
  ✅ 棋类/游戏（有明确胜负）

不适用的场景：
  ❌ 创意写作（什么是"好"的创意？）
  ❌ 对话质量（"有帮助"很难量化）
  ❌ 安全对齐（"无害"的边界模糊）
  ❌ 主观偏好（风格、语气等）

→ 实际的 RL 训练通常混合使用：
   - 可验证任务用规则奖励
   - 主观任务用奖励模型
   DeepSeek-R1 正是这样做的
```

---

## 16.3 推理数据的构造

### 数学推理数据的难度梯度

```
难度级别设计：

Level 1: 基础运算和简单应用
  - GSM8K 级别（小学数学）
  - 只需 2-4 步推理
  - 用途：warm-up，建立基础推理习惯

Level 2: 中等数学
  - MATH 数据集中的中低难度
  - 需要 4-8 步推理
  - 涉及代数、几何基础
  - 用途：主体训练数据

Level 3: 竞赛预备
  - AMC/AIME 级别
  - 需要 8-15 步推理
  - 需要组合不同数学工具
  - 用途：提升上限

Level 4: 竞赛级
  - IMO/Putnam 级别
  - 需要深度证明和创造性思考
  - 用途：少量使用，推动极限

推荐配比：
  Level 1: 20%  |  Level 2: 45%  |  Level 3: 30%  |  Level 4: 5%
```

### 代码推理数据的粒度

```
函数级 → 文件级 → 项目级

函数级：
  "实现一个函数，判断一棵二叉树是否是 BST"
  验证：10-20 个测试用例
  适用：基础代码能力

文件级：
  "实现一个 LRU 缓存类，支持 get/put/delete，线程安全"
  验证：完整的单元测试套件
  适用：模块设计能力

项目级：
  "实现一个简单的 key-value 数据库，支持持久化和并发访问"
  验证：集成测试 + 性能测试
  适用：系统设计能力（当前最难）
```

### 难度控制

RL 训练对难度非常敏感：

```
太简单（模型 solve rate > 90%）：
  → 梯度信号太弱，学不到东西
  → 浪费计算资源

太难（模型 solve rate < 5%）：
  → 几乎所有采样都是失败的
  → 无法产生有效的正向信号
  → 可能导致训练不稳定

最佳难度（solve rate 20-50%）：
  → 足够的正向信号来学习
  → 足够的挑战来提升能力
  → 组内差异大，GRPO 梯度信号强
```

---

## 16.4 RL 数据的在线生成与迭代

### On-policy vs Off-policy

```
Off-policy 数据：
  用旧版本的模型（或其他模型）生成的数据
  优点：可以提前准备，不阻塞训练
  缺点：与当前模型的分布不匹配，效果有折扣

On-policy 数据：
  用当前版本的模型实时生成的数据
  优点：分布完全匹配，学习效率最高
  缺点：需要实时推理，增加训练复杂度
```

**当前的共识**：On-policy 数据显著优于 off-policy，特别是在 RL 训练的后期。DeepSeek-R1 采用的就是完全 on-policy 的方式。

### 数据新鲜度的重要性

```python
"""
RL 训练中的数据新鲜度管理
"""

def rl_data_freshness_check(
    model_version: int,
    data_generated_at_version: int,
    max_stale_versions: int = 3,
) -> dict:
    """
    检查 RL 数据的新鲜度
    """
    staleness = model_version - data_generated_at_version

    status = (
        "fresh" if staleness == 0 else
        "acceptable" if staleness <= max_stale_versions else
        "stale"
    )

    return {
        "model_version": model_version,
        "data_version": data_generated_at_version,
        "staleness": staleness,
        "status": status,
        "recommendation": {
            "fresh": "直接使用",
            "acceptable": "可以使用但建议混入新数据",
            "stale": "丢弃，重新生成",
        }[status],
    }
```

### 动态难度调整

一个高级的 RL 训练系统应该能够动态调整题目难度：

```
自适应难度调整：

  每 N 步 → 评估当前模型在各难度级别的 solve rate
      ↓
  Level 1 solve rate > 90%? → 降低 Level 1 比例
  Level 3 solve rate < 10%? → 降低 Level 3 比例
      ↓
  重新平衡难度分布，确保"最佳学习区"
      ↓
  继续训练
```

---

## 16.5 认知演变

> **推理模型 RL 数据的认知演变**
> - 2023："推理能力需要 CoT 数据 + SFT"
> - 2024.1："o1 证明 RL 可以产生强大的推理——但方法未公开"
> - 2025.1："DeepSeek-R1 开源证明纯 RL 也能训练出推理！关键是可验证奖励 + GRPO"
> - 2025："'先蒸馏后 RL'被证明是更实用的路线——但纯 RL 的理论上限更高"
> - 2025-2026："RL 数据从'人类标注偏好'转向'自动可验证奖励'，数据瓶颈转为算力瓶颈"

---

## 本章要点回顾

1. **DeepSeek-R1 证明了纯 RL 可以训练出推理能力**——这是范式级的转变
2. **GRPO 消除了单独奖励模型的需求**，用组内相对排名提供信号
3. **可验证奖励是关键突破**——在数学/代码上可以生成无限训练信号
4. **难度控制至关重要**：solve rate 20-50% 是最佳学习区
5. **On-policy 数据远优于 off-policy**——RL 训练的数据必须"新鲜"
6. **动态难度调整**是高级 RL 系统的标配

---

## 🛠 动手环节

### 练习 1：构造可验证奖励
为 GSM8K 中的 10 道题设计奖励函数：
- 支持数值答案和分数答案
- 处理等价表示（如 1/2 = 0.5 = 50%）

### 练习 2：分析 GRPO 的采样效率
对同一道题采样 16 次，记录：
- 有多少次正确？（solve rate）
- 正确和错误回复之间的差异在哪里？
- 这个 solve rate 是否在"最佳学习区"内？
