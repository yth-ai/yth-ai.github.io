---
title: "从 RLHF 到 DPO：后训练对齐技术的演进之路"
description: "全面梳理 LLM 后训练对齐技术的发展，从 RLHF 到 DPO、KTO、ORPO，覆盖理论基础、算法对比和工程实践。"
date: 2026-03-21
category: "深度解析"
tags: ["RLHF", "DPO", "对齐", "后训练", "LLM"]
---

如何让大模型 "听话"？这是后训练（Post-Training）要解决的核心问题。从 InstructGPT 的 RLHF 到 DPO 的简洁革命，对齐技术在短短两年内经历了剧烈的演化。本文将系统梳理这条技术演进之路。

## 一、对齐问题的本质

### 1.1 为什么需要对齐

预训练后的 LLM 是一个 "概率鹦鹉"——它学会了语言的统计规律，但不知道什么是 "好的回答"。

**未对齐模型的典型问题**：
- 不遵循指令（你问东它答西）
- 生成有害内容（暴力、歧视）
- 编造事实（幻觉，Hallucination）
- 冗长啰嗦（不知道何时停止）
- 风格不一致（一会儿像论文，一会儿像聊天）

### 1.2 对齐三阶段

现代对齐流程通常分为三个阶段：

```
阶段 1: SFT (Supervised Fine-Tuning)
  └─ 让模型学会 "如何回答" 的格式
  
阶段 2: 偏好学习 (Preference Learning)
  └─ 让模型学会 "什么是好回答"
  
阶段 3: 安全对齐 (Safety Alignment)
  └─ 让模型学会 "什么不该说"
```

## 二、SFT：对齐的基石

### 2.1 SFT 的作用

SFT 用高质量的 (指令, 回答) 对来微调模型，效果是：
1. 学会遵循指令的格式
2. 学会回答问题的风格
3. 初步学会拒绝不当请求

### 2.2 SFT 数据的质量 > 数量

一个关键发现是：**SFT 数据的质量比数量重要得多**。

| 数据集 | 规模 | 特点 |
|---|---|---|
| Alpaca (Stanford) | 52K | GPT-3.5 生成，质量一般 |
| Vicuna (LMSYS) | 70K | ShareGPT 对话，质量较高 |
| LIMA (Meta) | 1,000 | 精心策划，证明了 "Less is More" |
| OpenHermes 2.5 | 1M | 大规模合成，多样性高 |

**LIMA 的启示**：仅 1,000 条精选数据就能让 65B 模型达到接近 GPT-4 的 SFT 效果。这说明 SFT 的核心作用是 "格式化"（formatting）而非 "学知识"。

### 2.3 SFT 的关键细节

- **学习率**：通常为 1e-6 到 2e-5，远小于预训练
- **训练轮次**：通常 1-3 个 epoch，过多容易过拟合
- **只计算回答的 Loss**：不计算指令部分的 Loss（避免学习 "提问"）
- **长度控制**：适当截断或填充，保持 batch 内长度一致

## 三、RLHF：强化学习从人类反馈中学习

### 3.1 RLHF 的基本框架

RLHF 是 InstructGPT 和 ChatGPT 成功的关键技术。它的核心思路是：

1. **训练奖励模型（Reward Model, RM）**：学习人类偏好
2. **用 RL 优化策略模型**：在 RM 的引导下改进回答质量

### 3.2 奖励模型训练

**数据格式**：人类标注者对同一问题的多个回答进行排序

```
Prompt: "解释什么是黑洞"
Response A: [详细、准确的科学解释]  ← 偏好
Response B: [简短、不太准确的解释]  ← 非偏好
```

**训练目标**（Bradley-Terry Model）：

$$\mathcal{L}_{RM} = -\mathbb{E}_{(x,y_w,y_l)}\left[\log \sigma\left(r_\theta(x, y_w) - r_\theta(x, y_l)\right)\right]$$

其中 $y_w$ 是偏好回答，$y_l$ 是非偏好回答，$r_\theta$ 是奖励模型的输出分数。

### 3.3 PPO 优化

有了奖励模型后，使用 PPO（Proximal Policy Optimization）来优化策略模型：

$$\mathcal{L}_{PPO} = \mathbb{E}\left[\min\left(\frac{\pi_\theta}{\pi_{old}} A, \text{clip}\left(\frac{\pi_\theta}{\pi_{old}}, 1-\epsilon, 1+\epsilon\right) A\right)\right]$$

加上 KL 散度约束（防止模型偏离太远）：

$$\text{Reward}_{final} = r_\theta(x, y) - \beta \cdot \text{KL}[\pi_\theta \| \pi_{ref}]$$

### 3.4 RLHF 的问题

尽管效果好，RLHF 有很多工程难点：

1. **需要训练两个额外模型**：奖励模型 + 策略模型的旧版本
2. **训练不稳定**：PPO 的超参数敏感，容易训练崩溃
3. **显存需求大**：同时需要 4 个模型（Policy, Reference, Reward, Value）
4. **奖励 Hacking**：策略模型学会 "骗" 奖励模型，获得高分但实际质量下降
5. **人类标注成本高**：需要大量高质量的偏好标注数据

## 四、DPO：直接偏好优化

### 4.1 DPO 的核心洞察

**Direct Preference Optimization（DPO）** 的核心洞察是：**奖励模型可以被解析地消除，直接用偏好数据优化策略模型。**

DPO 论文证明了，在 Bradley-Terry 模型下，最优策略有一个闭式解：

$$\pi^*(y|x) = \frac{\pi_{ref}(y|x) \exp\left(\frac{r^*(x,y)}{\beta}\right)}{Z(x)}$$

由此可以推导出隐式奖励：

$$r^*(x, y) = \beta \log \frac{\pi^*(y|x)}{\pi_{ref}(y|x)} + \beta \log Z(x)$$

### 4.2 DPO Loss

将隐式奖励代入 Bradley-Terry 模型，得到 DPO 的训练目标：

$$\mathcal{L}_{DPO} = -\mathbb{E}_{(x,y_w,y_l)}\left[\log \sigma\left(\beta \log \frac{\pi_\theta(y_w|x)}{\pi_{ref}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{ref}(y_l|x)}\right)\right]$$

**直觉理解**：DPO 同时做了两件事：
1. **增大偏好回答的概率**（相对于参考模型）
2. **减小非偏好回答的概率**（相对于参考模型）

### 4.3 DPO vs RLHF 对比

| 维度 | RLHF (PPO) | DPO |
|---|---|---|
| 需要奖励模型 | 是 | 否 |
| 算法复杂度 | 高（PPO + 4模型） | 低（类似 SFT） |
| 训练稳定性 | 差（超参敏感） | 好 |
| 显存需求 | 4x 模型大小 | 2x 模型大小 |
| 实现复杂度 | 数千行代码 | 数百行代码 |
| 理论最优解 | 相同（在 BT 模型下） | 相同 |
| 实际效果 | 在超大规模下可能更好 | 在大多数场景下相当或更好 |

### 4.4 DPO 的局限性

DPO 并非完美：

1. **对参考模型敏感**：DPO 需要一个好的参考模型（通常是 SFT 后的模型）
2. **数据质量要求高**：对偏好数据中的噪声更敏感（因为没有奖励模型来平滑）
3. **探索不足**：DPO 是离线算法，不像 PPO 有在线探索
4. **长度偏见**：容易学到 "长回答=好回答" 的虚假相关

## 五、DPO 的后继者们

### 5.1 IPO（Identity Preference Optimization）

IPO 修正了 DPO 的一个理论问题——DPO 在偏好数据完美时会过拟合（reward gap → ∞）。

$$\mathcal{L}_{IPO} = \mathbb{E}\left[\left(\log \frac{\pi_\theta(y_w|x)}{\pi_{ref}(y_w|x)} - \log \frac{\pi_\theta(y_l|x)}{\pi_{ref}(y_l|x)} - \frac{1}{2\beta}\right)^2\right]$$

用回归代替分类，避免了极端情况。

### 5.2 KTO（Kahneman-Tversky Optimization）

KTO 的创新在于**不需要成对的偏好数据**——只需要知道每条回答是 "好" 还是 "坏"。

这大幅降低了数据标注成本，因为：
- 成对偏好标注需要同时比较两个回答（更复杂）
- 单条质量标注只需要判断一条回答好不好（更简单）

$$\mathcal{L}_{KTO} = \mathbb{E}_{y_w}\left[\sigma\left(\beta(\hat{r}_w - z_0)\right)\right] - \mathbb{E}_{y_l}\left[\sigma\left(\beta(z_0 - \hat{r}_l)\right)\right]$$

其中参考点 $z_0$ 的引入借鉴了 Kahneman-Tversky 的前景理论（Prospect Theory）。

### 5.3 ORPO（Odds Ratio Preference Optimization）

ORPO 更进一步——**连参考模型都不需要了**，直接在 SFT 的过程中同时做偏好学习。

$$\mathcal{L}_{ORPO} = \mathcal{L}_{SFT} + \lambda \cdot \mathcal{L}_{OR}$$

$$\mathcal{L}_{OR} = -\log \sigma\left(\log \frac{\text{odds}_\theta(y_w|x)}{\text{odds}_\theta(y_l|x)}\right)$$

其中 $\text{odds}_\theta(y|x) = \frac{P_\theta(y|x)}{1 - P_\theta(y|x)}$。

**优势**：一步到位，SFT + 偏好学习同时完成，不需要参考模型。

### 5.4 SimPO（Simple Preference Optimization）

SimPO 是 2024 年的工作，核心想法是用**平均 log 概率**代替总 log 概率作为隐式奖励：

$$r(x, y) = \frac{1}{|y|} \log \pi_\theta(y|x) - \gamma$$

这自然地解决了长度偏见问题，因为用了平均而非求和。

### 5.5 GRPO（Group Relative Policy Optimization）

DeepSeek 提出的 GRPO 是一个重要的创新，它结合了 RL 的在线探索和 DPO 式的简洁：

1. 对每个 prompt 采样一组回答
2. 在组内计算相对奖励（无需单独的 value model）
3. 用组内排名作为优势函数

$$A_i = \frac{r_i - \text{mean}(\{r_j\})}{\text{std}(\{r_j\})}$$

**GRPO 的优势**：
- 保留了在线探索（PPO 的优势）
- 不需要 Value Model（减少显存）
- 组内相对排名天然稳定

## 六、偏好数据的工程

### 6.1 数据收集策略

**人工标注**：
- 最高质量，但成本最高
- 适合关键领域（安全、准确性）
- 需要详细的标注指南和质量控制

**AI 辅助标注**：
- 用强模型（如 GPT-4）标注偏好
- 成本低 10-100 倍
- 质量与人工标注接近（在很多任务上）
- 存在 "强模型偏好" 的系统性偏差

**自我对弈（Self-Play）**：
- 模型自己生成多个回答
- 用奖励模型或规则评分
- 构成在线数据生成循环

### 6.2 数据质量控制

偏好数据常见的质量问题：

1. **标注不一致**：不同标注者对同一对回答给出相反的偏好
2. **虚假相关**：长度、格式等表面特征与偏好强相关
3. **难度不均**：太容易或太难的对比都学不到有用信息
4. **领域偏差**：某些领域的数据过多或过少

**应对策略**：
- 多标注者投票 + 一致性过滤
- 长度均衡采样（控制偏好对的长度差异）
- Curriculum Learning（先简单后困难）
- 按领域分层采样

### 6.3 偏好数据规模

| 阶段 | 推荐规模 | 说明 |
|---|---|---|
| 初始对齐 | 10K-50K 对 | 基础偏好学习 |
| 迭代优化 | 50K-200K 对 | 持续改进 |
| 大规模对齐 | 200K-1M 对 | 覆盖更多场景 |
| 安全对齐 | 10K-50K 对 | 专注安全相关 |

## 七、实践建议

### 7.1 算法选择指南

```
Q: 你有偏好数据吗？
├─ 没有 → 先收集数据（或用 AI 生成）
└─ 有
   └─ Q: 你有成对偏好还是单条评分？
      ├─ 成对偏好 → DPO / SimPO
      └─ 单条评分 → KTO
         └─ Q: 你需要在线探索吗？
            ├─ 需要 → GRPO / Online DPO
            └─ 不需要 → DPO 足够
```

### 7.2 超参数参考

| 参数 | DPO | KTO | GRPO |
|---|---|---|---|
| β (KL 系数) | 0.1-0.5 | 0.1-0.5 | 0.01-0.1 |
| 学习率 | 1e-7 ~ 5e-6 | 1e-7 ~ 5e-6 | 1e-6 ~ 5e-6 |
| Batch Size | 32-128 | 32-128 | 256-1024 |
| Epoch | 1-3 | 1-3 | 在线 |
| Warmup | 10% | 10% | 5% |

### 7.3 训练流程

推荐的完整后训练流程：

```
SFT（1-3 epochs）
   ↓
DPO/KTO（1-2 epochs）
   ↓
评估（MMLU, MT-Bench, AlpacaEval, Safety）
   ↓
如果需要 → 再来一轮（使用新生成的偏好数据）
```

## 八、总结与展望

| 方法 | 年份 | 核心创新 | 复杂度 |
|---|---|---|---|
| RLHF (PPO) | 2022 | 奖励模型 + 强化学习 | 高 |
| DPO | 2023 | 消除奖励模型 | 中 |
| IPO | 2023 | 修正 DPO 过拟合 | 中 |
| KTO | 2024 | 不需要成对数据 | 低 |
| ORPO | 2024 | SFT + 偏好一步到位 | 低 |
| SimPO | 2024 | 长度归一化，无需参考模型 | 低 |
| GRPO | 2024 | 组内相对排名 + 在线探索 | 中 |

对齐技术的趋势非常明确：**越来越简洁、越来越高效、越来越不依赖外部组件**。

未来值得关注的方向：
1. **Constitutional AI**：用规则而非人类偏好来对齐
2. **Process Reward Model**：对推理过程而非最终结果给奖励
3. **多目标对齐**：同时优化多个维度（有用性、无害性、诚实性）
4. **在线自我改进**：模型持续从自己的输出中学习改进
