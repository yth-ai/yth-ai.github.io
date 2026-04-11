---
title: "RLHF 与偏好对齐"
description: "从 RLHF 到 DPO 到 GRPO——让模型学会'什么该说什么不该说'"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 10
part: "第三部分：后训练与对齐"
partOrder: 3
tags: ["RLHF", "DPO", "GRPO", "对齐", "奖励模型", "PPO"]
---

## 为什么 SFT 不够

SFT 教会模型"怎么回答问题"，但没有教会它区分好回答和坏回答。一个 SFT 模型可能会：

- 自信地输出错误信息（幻觉）
- 回答本应拒绝的有害请求
- 在多种合理回答中选择不够好的那个
- 给出正确但不友好的回复

**偏好对齐（Preference Alignment）** 的目标是：让模型的输出不仅"正确"，而且"好"——符合人类的价值观和偏好。

## RLHF：经典框架

### 三阶段流程

[InstructGPT](https://arxiv.org/abs/2203.02155)（Ouyang et al., 2022）奠定了 RLHF 的经典三阶段框架：

```
阶段 1: SFT
  预训练模型 → SFT 模型（指令跟随）

阶段 2: 奖励模型训练 (RM)
  人类标注偏好对 → 训练奖励模型

阶段 3: RL 优化
  SFT 模型 + 奖励模型 → PPO 优化 → 对齐后的模型
```

### 阶段 2：奖励模型（Reward Model）

奖励模型的训练数据是**偏好对**（preference pair）：

```
Prompt: "解释量子纠缠"
Response A: "量子纠缠是两个粒子之间的量子关联，当测量其中一个..."  ← 人类选择更好
Response B: "量子纠缠很复杂，你可以上网搜索一下。"               ← 人类认为更差
```

给定 prompt $x$ 和两个回复 $y_w$（preferred，更好的）和 $y_l$（rejected，更差的），奖励模型的训练目标基于 [Bradley-Terry 模型](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model)：

$$\mathcal{L}_{\text{RM}} = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma\left( r_\phi(x, y_w) - r_\phi(x, y_l) \right) \right]$$

其中 $r_\phi(x, y)$ 是奖励模型对 prompt $x$ 和回复 $y$ 的打分，$\sigma$ 是 sigmoid 函数。

直觉上，这个 loss 鼓励奖励模型给好回复打更高的分，给坏回复打更低的分。

**奖励模型的架构**通常与策略模型相同（去掉 LM head，加一个线性层输出标量分数）：

```
输入序列 → Transformer → [最后一个 token 的 hidden state] → Linear → scalar reward
```

### 阶段 3：PPO 优化

[PPO（Proximal Policy Optimization）](https://arxiv.org/abs/1707.06347)（Schulman et al., 2017）是 RLHF 中最常用的 RL 算法。优化目标：

$$\max_\theta \mathbb{E}_{x \sim \mathcal{D}, y \sim \pi_\theta(\cdot|x)} \left[ r_\phi(x, y) - \beta \cdot D_{\text{KL}}(\pi_\theta \| \pi_{\text{ref}}) \right]$$

两项的含义：

- $r_\phi(x, y)$：奖励模型的评分，越高越好
- $\beta \cdot D_{\text{KL}}$：KL 散度惩罚，防止策略模型偏离 SFT 模型太远

**为什么需要 KL 惩罚？** 没有 KL 惩罚，模型会学会"奖励 hack"——找到奖励模型的漏洞，生成得分很高但实际质量很低的回复。比如不断重复某些高分词汇，或生成看似深奥实际无意义的文本。

PPO 的训练涉及四个模型同时在 GPU 上：

| 模型 | 作用 | 是否更新 |
|------|------|---------|
| 策略模型 (Actor) | 生成回复 | 是 |
| 价值模型 (Critic) | 估计 state value | 是 |
| 奖励模型 (RM) | 打分 | 否（冻结） |
| 参考模型 (Ref) | 计算 KL 惩罚 | 否（冻结） |

这意味着训练 PPO 的显存需求大约是 SFT 的 **4 倍**，这是 RLHF 落地困难的主要原因之一。

## DPO：去掉奖励模型

[DPO（Direct Preference Optimization）](https://arxiv.org/abs/2305.18290)（Rafailov et al., 2023）是对 RLHF 的重大简化。核心思想是：**可以跳过奖励模型训练和 RL 过程，直接用偏好数据优化策略模型**。

### 数学推导

DPO 的关键洞察：RLHF 的最优策略有闭式解：

$$\pi^*(y|x) = \frac{1}{Z(x)} \pi_{\text{ref}}(y|x) \exp\left(\frac{r(x, y)}{\beta}\right)$$

将这个关系反转，可以用策略的概率来表达隐式的奖励：

$$r(x, y) = \beta \log \frac{\pi_\theta(y|x)}{\pi_{\text{ref}}(y|x)} + \beta \log Z(x)$$

代入 Bradley-Terry 偏好模型，配分函数 $Z(x)$ 消掉，得到 DPO loss：

$$\mathcal{L}_{\text{DPO}} = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma\left( \beta \log \frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)} \right) \right]$$

### DPO vs. RLHF 对比

| 维度 | RLHF (PPO) | DPO |
|------|-----------|-----|
| 训练阶段 | 3 阶段（SFT → RM → RL） | 2 阶段（SFT → DPO） |
| 需要的模型 | 4 个（Actor + Critic + RM + Ref） | 2 个（Policy + Ref） |
| GPU 显存 | 4x SFT | 2x SFT |
| 训练稳定性 | 不稳定（RL 固有问题） | 非常稳定（普通梯度下降） |
| 超参数敏感性 | 高（PPO clip, GAE λ 等） | 低（主要是 β） |
| 效果上限 | 可能更高（在线探索） | 受限于离线数据质量 |
| 实现复杂度 | 高 | 低（几十行代码） |

### DPO 的局限

1. **离线数据瓶颈**：DPO 只能从已有的偏好对中学习，不能像 PPO 那样通过在线采样探索新的回复空间
2. **过拟合风险**：在小数据集上容易过拟合到特定的偏好模式
3. **似然位移（likelihood displacement）**：优化 $y_w$ 和 $y_l$ 的概率比时，可能导致两者的绝对概率同时下降

## DPO 变体家族

DPO 的简洁性催生了一大波变体：

### IPO（Identity Preference Optimization）

[IPO](https://arxiv.org/abs/2310.12036)（Azar et al., 2023）指出 DPO 在偏好确定性很高时会过拟合，提出了正则化版本：

$$\mathcal{L}_{\text{IPO}} = \mathbb{E} \left[ \left( \log \frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)} - \frac{1}{2\beta} \right)^2 \right]$$

### KTO（Kahneman-Tversky Optimization）

[KTO](https://arxiv.org/abs/2402.01306)（Ethayarajh et al., 2024）灵感来自前景理论——人类对损失比收益更敏感。它不需要成对的偏好数据，**只需要单独标注每个回复是好是坏**：

$$\mathcal{L}_{\text{KTO}} = \mathbb{E}_{y_w} \left[ 1 - \sigma(\beta \cdot r_w) \right] + \lambda \cdot \mathbb{E}_{y_l} \left[ 1 - \sigma(-\beta \cdot r_l) \right]$$

其中 $\lambda > 1$ 反映了"损失厌恶"。

### SimPO（Simple Preference Optimization）

[SimPO](https://arxiv.org/abs/2405.14734)（Meng et al., 2024）更进一步——连参考模型都不需要了。用**平均 log 概率**作为隐式奖励：

$$r_{\text{SimPO}}(x, y) = \frac{1}{|y|} \log \pi_\theta(y|x)$$

这消除了参考模型的显存开销，训练速度更快。

### ORPO（Odds Ratio Preference Optimization）

[ORPO](https://arxiv.org/abs/2403.07691)（Hong et al., 2024）将 SFT 和偏好对齐**合并为一个训练阶段**：

$$\mathcal{L}_{\text{ORPO}} = \mathcal{L}_{\text{SFT}} + \lambda \cdot \mathcal{L}_{\text{OR}}$$

## GRPO：推理模型的对齐利器

[GRPO（Group Relative Policy Optimization）](https://arxiv.org/abs/2402.03300)（Shao et al., 2024，DeepSeek 团队）是专门为推理任务设计的对齐方法，在 DeepSeek-R1 中取得了显著效果。

### 核心思想

GRPO 不需要奖励模型，而是通过**组内相对排序**来计算奖励：

1. 对每个 prompt $x$，采样一组回复 $\{y_1, y_2, ..., y_G\}$
2. 用规则 verifier（如数学题正确性检查）为每个回复打分 $\{r_1, ..., r_G\}$
3. 将奖励标准化：$\hat{r}_i = \frac{r_i - \text{mean}(r)}{\text{std}(r)}$
4. 用标准化后的奖励做策略梯度更新

$$\mathcal{L}_{\text{GRPO}} = -\frac{1}{G} \sum_{i=1}^{G} \hat{r}_i \cdot \sum_{t=1}^{|y_i|} \log \pi_\theta(y_{i,t} | x, y_{i,<t})$$

### GRPO vs. PPO vs. DPO

| 特性 | PPO | DPO | GRPO |
|------|-----|-----|------|
| 需要奖励模型 | 是 | 否 | 否 |
| 需要 Critic | 是 | 否 | 否 |
| 数据方式 | 在线采样 | 离线偏好对 | 在线采样 |
| 奖励信号 | 学习得到 | 隐式 | 规则 verifier |
| 适用场景 | 通用 | 通用 | 可验证任务（数学、代码） |
| 显存占用 | 4x | 2x | 1.5x |

GRPO 特别适合数学和代码等有**确定性验证器**的任务——答案对就对，错就错，不需要模糊的人类偏好。

## 偏好数据工程

### 数据收集方式

| 方式 | 优点 | 缺点 | 代表 |
|------|------|------|------|
| 人工标注 | 质量最高 | 成本高、速度慢 | InstructGPT |
| AI 标注 | 低成本、快速 | 可能继承偏见 | [Constitutional AI](https://arxiv.org/abs/2212.08073) |
| AI 生成 + 人工审核 | 平衡成本和质量 | 人工审核仍是瓶颈 | LLaMA 2 |
| 模型自采样 + 规则验证 | 无需标注 | 限于可验证任务 | GRPO / [RLVR](https://arxiv.org/abs/2411.15124) |

### Constitutional AI（RLAIF）

[Constitutional AI](https://arxiv.org/abs/2212.08073)（Bai et al., 2022，Anthropic）用 AI 自身来替代人类标注偏好：

1. 定义一组"宪法原则"（如"回复应该无害"、"应该诚实"）
2. 让模型根据宪法原则对回复做自我批判和修改
3. 让另一个模型根据宪法原则在两个回复中选择更好的
4. 用 AI 偏好数据训练奖励模型（RLAIF）

这种方法的核心优势是**可扩展性**——不依赖人类标注员的速度限制。

### 开源偏好数据集

| 数据集 | 规模 | 来源 |
|--------|------|------|
| [HH-RLHF](https://huggingface.co/datasets/Anthropic/hh-rlhf) | 170K | Anthropic 人工标注 |
| [UltraFeedback](https://huggingface.co/datasets/openbmb/UltraFeedback) | 64K | GPT-4 多维评分 |
| [Nectar](https://huggingface.co/datasets/berkeley-nest/Nectar) | 183K | 7 个模型对比 |
| [Chatbot Arena](https://huggingface.co/datasets/lmsys/chatbot_arena_conversations) | 33K+ | 真实用户盲评 |
| [Skywork Reward](https://huggingface.co/datasets/Skywork/Skywork-Reward-Preference-80K-v0.2) | 80K | 高质量多维偏好 |

## 对齐的挑战与前沿

### Reward Hacking（奖励 Hack）

模型可能找到奖励模型的漏洞，生成高分但低质的回复。常见模式：

- **冗长偏见**：更长的回复往往得分更高，模型学会"凑字数"
- **格式偏见**：使用 Markdown 列表和加粗会提高分数
- **逢迎偏见**：同意用户的说法（即使是错的）得分更高

对策：
- 多奖励模型集成
- 奖励模型定期刷新
- 长度归一化

### Alignment Tax（对齐税）

对齐过程可能损害模型的基础能力。典型表现：

- 过度拒绝无害请求（"我无法帮助..."）
- 知识类任务性能下降
- 创造力和多样性降低

### 迭代对齐

一次对齐往往不够。工业界通常采用**迭代流程**：

```
SFT → DPO/RLHF → 收集新偏好数据 → 再次 DPO/RLHF → ...
```

每一轮使用当前模型采样新的回复，收集新的偏好标注，持续改进。[LLaMA 3](https://arxiv.org/abs/2407.21783) 的技术报告中详细描述了他们的多轮迭代流程。

## 章节小结

| 方法 | 核心思路 | 适用场景 |
|------|---------|---------|
| RLHF (PPO) | 训练 RM → RL 优化 | 预算充足、追求极致 |
| DPO | 直接优化偏好概率 | 通用场景、快速迭代 |
| GRPO | 组内相对排序 + 规则验证 | 数学/代码等可验证任务 |
| KTO | 非配对数据 + 前景理论 | 只有好/坏标签的场景 |
| SimPO | 无参考模型 | 显存受限 |
| ORPO | SFT + 对齐一步完成 | 极简流程 |

对齐是一个活跃的研究领域，新方法层出不穷。但核心原则不变：**让模型的输出既有能力（helpful），又安全（harmless），还诚实（honest）**。
