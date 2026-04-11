---
title: "MoE 路由策略前沿进展"
description: "从 Top-K 到 Expert Choice，从固定路由到自适应路由，系统梳理 MoE 路由策略的最新研究进展。"
date: 2026-03-14
category: 综合调研
tags: ["MoE", "路由策略", "稀疏激活", "Expert Choice", "负载均衡"]
draft: false
---

## 引言

Mixture-of-Experts (MoE) 已成为大模型 scaling 的主流范式——DeepSeek-V3 (671B)、Mixtral (8×7B)、Grok-1 (314B)、DBRX (132B) 等头部模型均采用了 MoE 架构。**路由策略（Router）是 MoE 的核心组件**，直接决定了参数利用效率、计算负载均衡和模型性能。本文系统梳理路由策略的演进和最新进展。

## MoE 路由基础回顾

### 标准路由公式

给定输入 token 的隐藏表示 $x \in \mathbb{R}^d$，路由器计算每个专家的分配概率：

$$g(x) = \text{TopK}(\text{softmax}(W_r \cdot x), K)$$

其中 $W_r \in \mathbb{R}^{N \times d}$ 是路由矩阵，$N$ 是专家数量，$K$ 是每个 token 选择的专家数。

### 路由的核心挑战

1. **负载均衡 (Load Balancing)**：所有专家应被均匀使用，避免部分专家过载而其他闲置
2. **专家坍塌 (Expert Collapse)**：训练过程中部分专家得不到充分训练，逐渐退化
3. **路由振荡 (Routing Oscillation)**：相似的 token 在不同 step 被分配给不同专家
4. **训练-推理一致性**：训练时的路由决策应与推理时一致

## 路由策略演进

### 第一代：Top-K + 辅助 Loss

**Switch Transformer (2022)**

Switch Transformer 使用 Top-1 路由（每个 token 只选 1 个专家）配合辅助损失：

$$\mathcal{L}_{aux} = \alpha \cdot N \sum_{i=1}^{N} f_i \cdot P_i$$

其中 $f_i$ 是专家 $i$ 实际接收的 token 比例，$P_i$ 是路由器分配给专家 $i$ 的平均概率。

**优点**：简单有效
**缺点**：$\alpha$ 需要精细调节；辅助 loss 与主任务 loss 竞争梯度信号

**Mixtral (2024)**

Mixtral 使用 Top-2 路由，两个被选中的专家通过 softmax 权重进行加权求和：

$$y = \sum_{i \in \text{Top2}} g_i(x) \cdot E_i(x)$$

Top-2 相比 Top-1 的优势：
- 更稳定的训练（每个 token 有两个专家"投票"）
- 更好的容错性（一个专家出问题，还有另一个）
- 更平滑的梯度流

### 第二代：Expert Choice

**Expert Choice Routing (2022)**

核心转变：**不是让 token 选专家，而是让专家选 token。**

```
Token Choice: 每个 token 选 Top-K 个专家 → 专家负载不可控
Expert Choice: 每个专家选 Top-C 个 token → 负载完全均衡
```

具体实现：

$$S = W_r \cdot X^T \quad (N \times B)$$

$$\text{对每行 } S_i \text{（即每个专家），选 Top-C 个 token}$$

其中 $C = \frac{K \cdot B}{N}$ 是每个专家的容量（$B$ 是 batch 中的 token 数）。

**优点**：
- 天然负载均衡，**不需要辅助 loss**
- 允许重要 token 被多个专家处理
- 允许不重要 token 不被任何专家处理（跳过）

**缺点**：
- 推理时无法预知 batch composition，需要特殊处理
- Token 被处理的次数不固定（0 到 N 次），可能导致信息不均

### 第三代：Soft/Continuous Routing

**Soft MoE (2023)**

Google 提出的 Soft MoE 完全避免了离散的路由决策：

$$\tilde{X} = \Phi(X) \cdot X$$

其中 $\Phi$ 是一个连续的分配矩阵，每个专家接收的是所有 token 的加权组合（而非特定的 token 子集）。

这消除了 Top-K 选择的不可导问题，但代价是：
- 每个专家的输入失去了明确的语义意义
- 计算复杂度更高（所有 token 都要参与所有专家的分配计算）

### DeepSeek 方案：Loss-free Load Balancing

DeepSeek-V3 的创新在于不使用辅助 loss，而是通过**可调节的 bias** 实现负载均衡：

```python
class DeepSeekRouter(nn.Module):
    def __init__(self, d_model, n_experts):
        super().__init__()
        self.gate = nn.Linear(d_model, n_experts, bias=False)
        # bias 不参与梯度计算
        self.expert_bias = nn.Parameter(
            torch.zeros(n_experts), requires_grad=False
        )
    
    def forward(self, x):
        logits = self.gate(x)  # (batch, n_experts)
        # 加入 bias
        adjusted_logits = logits + self.expert_bias
        # Top-K 选择
        topk_vals, topk_ids = torch.topk(adjusted_logits, k=self.top_k)
        # softmax 归一化（在原始 logits 上，不含 bias）
        weights = F.softmax(logits.gather(-1, topk_ids), dim=-1)
        return weights, topk_ids
    
    def update_bias(self, expert_counts, target_count):
        """训练后定期更新 bias"""
        for i in range(self.n_experts):
            if expert_counts[i] > target_count * 1.1:
                self.expert_bias[i] -= self.bias_step
            elif expert_counts[i] < target_count * 0.9:
                self.expert_bias[i] += self.bias_step
```

**关键洞察**：bias 影响路由决策，但不参与 loss 计算和梯度传播。这使得主任务的梯度信号完全不受负载均衡约束的干扰。

## 最新研究进展 (2024-2025)

### 1. 自适应路由 (Adaptive Routing)

**MoE-Mamba + Adaptive Top-K**

不同 token 的复杂度不同，用固定的 K 不够灵活。自适应路由让 K 变成输入相关的：

```python
def adaptive_topk_route(x, gate, min_k=1, max_k=4):
    logits = gate(x)
    probs = F.softmax(logits, dim=-1)
    
    # 计算 token 复杂度（熵）
    entropy = -(probs * probs.log()).sum(dim=-1)
    
    # 熵越高（越不确定）→ 选更多专家
    k = (min_k + (max_k - min_k) * entropy / math.log(gate.out_features))
    k = k.round().long().clamp(min_k, max_k)
    
    # 对每个 token 选不同数量的专家
    results = []
    for i in range(x.size(0)):
        top_vals, top_ids = torch.topk(probs[i], k=k[i].item())
        results.append((top_vals / top_vals.sum(), top_ids))
    
    return results
```

这样简单的 token（如 "the", "is"）可能只用 1 个专家，复杂的 token（如 "eigendecomposition"）可以用 4 个专家。

### 2. 层级路由 (Hierarchical Routing)

将专家组织成层级结构，先选组再选组内专家：

```
Level 1: 选 Top-2 Expert Groups (共 8 组)
    ↓
Level 2: 在选中的组内选 Top-1 Expert (每组 16 个)
    ↓
最终: 2 个专家参与计算
```

**优势**：
- 路由决策更结构化
- 组间负载均衡更容易控制
- 可以让组有明确的语义分工（如"语言组"、"数学组"、"代码组"）

### 3. 共享专家 + 路由专家

DeepSeek 首创的"共享专家"设计越来越被广泛采纳：

```
输入 x
    ↓
┌──────────┐    ┌──────────────────────────────┐
│ 共享专家  │    │     路由专家 (选 K 个)         │
│ (always  │    │  ┌──┐ ┌──┐ ┌──┐    ┌──┐      │
│  active) │    │  │E1│ │E2│ │E3│... │EN│      │
│ ┌──┐┌──┐ │    │  └──┘ └──┘ └──┘    └──┘      │
│ │S1││S2│ │    └──────────────────────────────┘
│ └──┘└──┘ │
└──────────┘
    ↓                     ↓
    y_shared    +    y_routed    =    y
```

共享专家的作用：
1. **编码通用知识**：语法、常识等每个 token 都需要的知识
2. **减少路由专家的冗余**：路由专家不需要都存储通用知识
3. **提供稳定的梯度信号**：即使路由决策不理想，共享专家也能提供合理的输出

### 4. Hash-based 路由

令人意外的是，完全不需要学习的 hash 路由在某些场景下表现不差：

```python
def hash_route(token_ids, n_experts, k=2):
    """基于 token ID 的确定性路由"""
    expert_ids = []
    for token_id in token_ids:
        # 用不同 seed 的 hash 选择 k 个专家
        selected = set()
        for seed in range(k):
            h = hash((token_id, seed)) % n_experts
            while h in selected:
                h = (h + 1) % n_experts
            selected.add(h)
        expert_ids.append(list(selected))
    return expert_ids
```

**优点**：零开销、完全可复现、推理友好
**缺点**：无法根据上下文做动态路由

2024 年的研究表明，hash 路由 + 共享专家的组合可以达到学习路由 85-90% 的性能，同时完全消除路由器的计算和通信开销。

### 5. Token Merging + MoE

将相似的 token 先合并，再路由到专家：

```
原始 sequence: [t1, t2, t3, t4, t5, t6, t7, t8]
                         ↓ Token Merging
合并后:        [t1, m(t2,t3), t4, m(t5,t6), t7, t8]
                         ↓ Router
路由:          [E2, E5, E1, E3, E2, E7]
                         ↓ Expert Computation
结果:          [y1, y2, y3, y4, y5, y6]
                         ↓ Token Unmerging
还原:          [y1, y2, y2, y3, y4, y4, y5, y6]
```

这样做的好处是减少了路由和专家计算的 token 数量，同时相似 token 共享路由决策（天然的一致性）。

## 路由策略对比总结

| 策略 | 负载均衡 | 训练稳定性 | 推理效率 | 实现复杂度 |
|------|---------|-----------|---------|-----------|
| Top-K + Aux Loss | 中等 | 中等 | 高 | 低 |
| Expert Choice | 完美 | 高 | 中等 | 中 |
| Soft MoE | 完美 | 高 | 低 | 高 |
| Loss-free Bias | 好 | 高 | 高 | 低 |
| Adaptive Top-K | 好 | 中等 | 中等 | 中 |
| Hierarchical | 好 | 高 | 高 | 高 |
| Hash-based | 完美 | - | 最高 | 最低 |

## 路由策略的评估方法

### 指标 1: 专家利用率 (Expert Utilization)

```python
def compute_expert_utilization(routing_decisions, n_experts):
    """衡量所有专家是否被均匀使用"""
    counts = np.bincount(routing_decisions.flatten(), minlength=n_experts)
    # 理想情况下每个专家被选中次数相同
    expected = counts.sum() / n_experts
    cv = np.std(counts) / np.mean(counts)  # 变异系数
    return {
        "coefficient_of_variation": cv,  # 越低越均衡
        "min_utilization": counts.min() / expected,
        "max_utilization": counts.max() / expected,
        "dead_experts": (counts == 0).sum(),
    }
```

### 指标 2: 路由一致性 (Routing Consistency)

```python
def compute_routing_consistency(
    model, inputs, n_trials=10
):
    """衡量相同输入是否总是路由到相同专家"""
    all_routes = []
    for _ in range(n_trials):
        routes = model.get_routing_decisions(inputs)
        all_routes.append(routes)
    
    # 计算一致率
    consistency = 0
    for i in range(len(inputs)):
        route_set = [tuple(sorted(r[i])) for r in all_routes]
        most_common = max(set(route_set), key=route_set.count)
        consistency += route_set.count(most_common) / n_trials
    
    return consistency / len(inputs)
```

### 指标 3: 专家特化度 (Expert Specialization)

```python
def compute_specialization(routing_decisions, token_categories):
    """
    衡量专家是否形成了明确的领域分工
    token_categories: 每个 token 的类别（代码/数学/自然语言等）
    """
    n_experts = routing_decisions.max() + 1
    n_categories = len(set(token_categories))
    
    # 构建专家-类别分布矩阵
    matrix = np.zeros((n_experts, n_categories))
    for token_idx, expert_id in enumerate(routing_decisions):
        cat = token_categories[token_idx]
        matrix[expert_id][cat] += 1
    
    # 每个专家的类别分布熵
    entropies = []
    for i in range(n_experts):
        probs = matrix[i] / max(matrix[i].sum(), 1)
        probs = probs[probs > 0]
        entropy = -(probs * np.log(probs)).sum()
        entropies.append(entropy)
    
    max_entropy = np.log(n_categories)
    avg_specialization = 1 - np.mean(entropies) / max_entropy
    
    return avg_specialization  # 越高说明专家分工越明确
```

## 开放问题与研究方向

1. **路由策略是否应该层间共享？** 目前大多数模型每层独立路由，但层间路由相关性研究表明可能存在优化空间。

2. **推理时是否可以用更简单的路由？** 训练时用 learned router，推理时切换到 hash router，能否保持大部分性能？

3. **路由决策的可解释性**：我们能否理解为什么某个 token 被路由到某个专家？这对 debugging 和模型改进有重要价值。

4. **MoE 在小模型上的价值**：当前 MoE 主要用在大模型上，7B 以下的 MoE 模型能否在边缘设备上体现优势？

## 参考文献

1. Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity (2022)
2. Mixtral of Experts (2024)
3. DeepSeek-V2/V3 Technical Reports (2024)
4. From Sparse to Soft Mixtures of Experts (2023)
5. Expert Choice Routing (2022)
6. Adaptive Mixtures of Local Experts (原始 MoE 论文, 1991)
7. Scaling Vision with Sparse Mixture of Experts (ViT-MoE, 2022)
8. MoE-Mamba: Efficient Selective State Space Models with Mixture of Experts (2024)
