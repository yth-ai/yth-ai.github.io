---
title: "中训练概论——为什么需要这个阶段"
description: "中训练的定位、核心问题与术语辨析"
date: 2026-03-21
updatedDate: 2026-04-01
bookSlug: "data-engineering"
chapter: 8
part: "第二部分：中训练数据"
partOrder: 2
tags: [中训练,Continual Pretraining,领域适应]
---

> *"Mid-training is the new pre-training."*
> *——Noam Brown (OpenAI), 2025.7*
>
> 当 OpenAI 的研究员公开说出这句话时，中训练（mid-training）正式从一个模糊的工程实践升级为大模型训练的核心范式。

---

## 8.1 中训练的定位

### 什么是中训练？

中训练是大规模预训练结束后、SFT/RLHF 之前的一个独立训练阶段。在这个阶段，模型在精选的高质量数据上继续训练，通常伴随学习率的退火（annealing）和数据分布的调整。

如果把大模型训练比作培养一个人：
- **预训练**是通识教育——大量阅读，建立广泛的知识基础
- **中训练**是本科专业课——在保持通识的前提下，系统化地增强特定能力
- **SFT** 是职业培训——学习如何与人打交道、如何按规矩做事
- **RL** 是实习——在实际反馈中打磨判断力

中训练的核心定位是**承上启下**：它承接预训练建立的通用知识基础，通过定向的数据策略来增强特定能力（如长上下文理解、代码生成、数学推理、多语言能力），同时为后续的 SFT 和 RL 做好准备。

### 术语的演变

"中训练"这个概念并不是一夜之间冒出来的。它经历了一个从"工程技巧"到"独立范式"的认知跃迁：

| 时期 | 术语 | 含义 | 代表实践 |
|------|------|------|---------|
| 2020 | Domain Adaptation | 在特定领域数据上继续预训练 | Google 的 domain-specific BERT |
| 2021-2022 | Continued Pretraining | 在更多/更新的数据上继续训练 | Code Llama 在代码上继续预训练 |
| 2023 | Annealing Phase | 预训练末期的学习率退火+数据调整 | Llama 2 的退火策略 |
| 2024 | Mid-training | 作为独立阶段被明确提出 | Llama 3/3.1 的多阶段训练 |
| 2025 | Mid-training 成为共识 | arXiv 2510.23081 综述论文正式梳理 | DeepSeek V3、Qwen 2.5、Llama 4 |
| 2025.7 | "Mid-training is the new pre-training" | Noam Brown 的论断标志着范式转变 | OpenAI 内部实践 |
| 2025.9 | Reinforcement Mid-Training (RMT) | 中训练与 RL 融合的框架 | 动态 token 预算 + 课程采样 |
| 2026.2 | ReMiT | RL 引导中训练的飞轮循环 | RL 推理先验 → token 重加权 |
| 2026.3 | PRISM | 首次大规模实证证明中训练是 RL 必要前提 | IBM 7 模型对照实验 |

### 认知演变

> **中训练的认知演变**
> - 2020-2021："继续训练？就是在领域数据上多跑几步呗"
> - 2022："Code Llama 证明继续预训练能显著增强代码能力"
> - 2023："Llama 2 的退火阶段其实就是原始版本的中训练——只是没这么叫"
> - 2024："Llama 3 把中训练做成了系统性的多阶段策略：长上下文扩展、数据上采样、退火"
> - 2025："中训练的综述论文出现（arXiv: 2510.23081），概念正式体系化"
> - 2025-2026："Mid-training is the new pre-training——中训练的数据策略可能比预训练更影响最终效果"
> - 2026："中训练从单向准备阶段进化为与后训练双向优化的闭环——PRISM 证明不做中训练的 RL 几乎失效，ReMiT 证明 RL 可以反向改善中训练"

---

## 8.2 中训练要解决的核心问题

中训练不是"多跑几步"。它有明确的目标和针对性的数据策略。

### 8.2.1 长上下文能力增强

这是中训练最广泛的应用之一。

**为什么不在预训练就做长上下文？**

1. **计算成本**：Attention 的复杂度是 O(n²)，128K 上下文的训练成本是 8K 的 256 倍
2. **数据稀缺**：自然存在的长文档远少于短文档，强行在预训练中大量使用长文档会打破数据分布
3. **分阶段更高效**：先在短上下文上建立语言能力，再逐步扩展上下文窗口

**Llama 3 的长上下文策略（里程碑级实践）：**

Llama 3 的技术报告详细披露了他们的长上下文扩展方案：

1. **预训练阶段**：在 8K 上下文长度上训练 15T token
2. **中训练阶段 1**：逐步将上下文长度从 8K 扩展到 128K
   - 分 6 个阶段：8K → 16K → 32K → 65K → 128K
   - 每个阶段训练约 800M token
   - RoPE 的 base frequency 从 500,000 逐步增大到 8,000,000
3. **验证标准**：在每个阶段检查
   - 短上下文任务不退化
   - Needle-in-a-Haystack 测试在当前长度上通过
   - 长上下文下的 loss 收敛

**128K 之后：从百万到千万级上下文**

Llama 3 的 8K→128K 是里程碑，但 2025 年这一前沿已经跃迁了两个数量级：

| 实践 | 扩展范围 | 数据量 | 关键技术 | 来源 |
|------|---------|--------|---------|------|
| Llama 3 | 8K→128K | ~4B token | RoPE base frequency 渐进调整 | Meta, 2024 |
| UltraLong-8B | 128K→4M | 仅 ~1B token | YaRN RoPE 扩展 + 按领域上采样 + 文档分隔符 | [Nvidia, 2025](https://arxiv.org/abs/2504.06214) |
| Llama 4 Scout | →10M | 未公开 | iRoPE（交错旋转位置编码）+ MoE 架构 | [Meta, 2025](https://www.llama.com/models/llama-4/) |

UltraLong-8B 的意义在于数据效率——仅用约 1B token 就将 Llama-3.1-8B-Instruct 的上下文从 128K 扩展到 4M，数据效率比 Llama 3 高一个数量级。其两阶段配方（阶段 1 继续预训练扩展窗口 + 阶段 2 指令微调保持能力）证明了长上下文扩展并不需要海量数据，关键在于 RoPE 扩展策略和数据的领域分布。

Llama 4 Scout（17B 激活/109B 总参，16 专家选 1）则通过 MoE 架构和 iRoPE 将上下文窗口直接推到 10M token。从 8K→128K→4M→10M 的时间线来看，长上下文中训练正在加速进化——每一代的扩展倍率都在增大，而所需的数据量增长却趋于平缓。

### 8.2.2 代码和数学能力提升

在预训练数据中，代码和数学数据的占比通常在 10-15%。但如果你想让模型具备强大的编程和数学推理能力，这个比例远远不够。

**中训练的策略是上采样（upsampling）**：在中训练阶段大幅提升代码和数学数据的占比。

```
预训练阶段的数据配比：
  网页文本: 65%  |  代码: 12%  |  数学: 3%  |  学术: 10%  |  书籍: 5%  |  其他: 5%

中训练阶段的数据配比（典型）：
  网页文本: 30%  |  代码: 35%  |  数学: 15%  |  学术: 10%  |  书籍: 5%  |  其他: 5%
```

关键洞察：**代码能力的增强不仅提升编程任务表现，还对数学推理和逻辑推理有显著的溢出效应。** 我们在第 6 章详细讨论过这一现象。

### 8.2.3 多语言能力补充

对于非英文为主的模型（如中文模型），中训练是补充目标语言能力的关键阶段。

**典型场景**：基础模型在英文为主的数据上预训练，然后在中训练阶段大幅增加中文数据比例：

```
预训练：英文 80% | 中文 10% | 其他 10%
   ↓
中训练：英文 40% | 中文 40% | 代码 15% | 其他 5%
```

AMD 在 2026 年的一篇实践报告中详细记录了多语言中训练的经验，特别指出了一个关键发现：**在中训练中排除数学数据会导致数学能力严重退化**——这说明数据配比的决策需要全局考量，不能只关注目标语言的增强。

### 8.2.4 知识时效性更新

模型的预训练数据有截止日期。如果你在 2025 年初完成预训练，模型对 2025 年之后的事件一无所知。中训练可以注入最新的知识。

**策略：**
- 收集训练数据截止日期之后的高质量网页数据
- 混合新数据和少量旧数据（防止遗忘）
- 训练量相对较小（通常 50B-200B token）

### 8.2.5 特定领域知识注入

当需要构建医疗、法律、金融等垂直领域的模型时，中训练是注入专业知识的最佳阶段。

**为什么不用 SFT 来注入领域知识？**

这是一个常见的误解。SFT 的本质是教模型"如何对话"和"如何遵循指令"，而不是教模型新知识。要让模型真正掌握一个领域的知识体系，需要在中训练阶段用足够量的领域语料来训练。

```
比喻：
- 中训练注入知识 = 让一个人系统地学习医学教材
- SFT 注入知识 = 教一个人在面试中如何回答医学问题

后者只能教"表面功夫"——如果底层知识不够扎实，模型很容易在稍微变化的问题上露馅。
```

### 8.2.6 中训练与后训练的协同——为什么中训练是 RL 的前置必要条件

2026 年初，一个过去被低估的事实得到了严格的实验验证：**中训练不仅是能力增强，更是后续 RL 能够生效的"起飞平台"。**

IBM 的 PRISM 项目对 7 个基础模型（Granite/LLaMA/Mistral/Nemotron-H，3B-24B，涵盖密集和 Mamba 混合架构）进行了对照实验，结论非常清晰：

| 训练路径 | AIME（数学推理） | 代码基准 | 科学基准 |
|---------|-----------------|---------|---------|
| 基础模型 → 直接 RL | ≈ 0 分 | 几乎无提升 | 几乎无提升 |
| 基础模型 → 中训练 → RL | 29-42 分（3-4 倍提升） | +5~12 分 | +6~13 分 |

更关键的发现来自机制分析：中训练重构了模型 >90% 的权重，而 RL 仅精调约 5% 的参数。CKA 分析（Centered Kernel Alignment >0.998）表明 RL 几乎完全保持了中训练建立的表征几何——换句话说，RL 是在中训练创造的"地形"上行走，而不是重塑地形。

另一项基于合成任务的因果分析（[arXiv: 2512.07783](https://arxiv.org/abs/2512.07783)）从另一个角度验证了同样的结论：

1. **RL 只在模型的"能力边缘"有效**——任务太简单或太难都不行
2. **固定计算预算下，增加中训练比增加 RL 更有效**
3. **上下文泛化需要"最小但充分"的预训练暴露**
4. **过程级奖励优于结果级奖励**

这意味着中训练的数据量需要一个令人惊喜的下限——PRISM 实验显示仅需约 27B 高质量 token 的中训练就能为后续 RL 创造有效条件。但如果完全跳过中训练，无论投入多少 RL 计算，效果都微乎其微。

> **核心启示**：设计中训练方案时，不应只评估中训练本身的 benchmark 增益，还需要评估它为后续 RL 阶段创造了多大的"可提升空间"。这也是为什么越来越多的团队将中训练和 RL 视为一个耦合系统来设计，而非两个独立阶段。

---

## 8.3 中训练的技术框架

### 8.3.1 退火式中训练（Annealing-based Mid-training）

这是当前最主流的中训练范式，Llama 3 是其典型代表。

**核心思路**：
1. 预训练结束后，将学习率逐渐降低到接近零
2. 同时切换到更高质量的数据分布
3. 在退火过程中，模型"巩固"已学知识，同时吸收精选数据的信号

```python
"""
退火式中训练的学习率调度
"""

import math

def annealing_lr_schedule(
    step: int,
    total_steps: int,
    peak_lr: float = 3e-4,          # 预训练的峰值学习率
    start_lr_ratio: float = 0.3,     # 中训练起始 lr 占峰值的比例
    min_lr_ratio: float = 0.01,      # 最终 lr 占峰值的比例
    warmup_steps: int = 100,         # 中训练开始时的短暂 warmup
) -> float:
    """
    中训练的学习率调度
    包含一个短暂的 warmup，然后 cosine 退火到最小值
    """
    start_lr = peak_lr * start_lr_ratio
    min_lr = peak_lr * min_lr_ratio

    if step < warmup_steps:
        # 短暂 warmup
        return min_lr + (start_lr - min_lr) * step / warmup_steps
    else:
        # Cosine 退火
        progress = (step - warmup_steps) / (total_steps - warmup_steps)
        return min_lr + 0.5 * (start_lr - min_lr) * (1 + math.cos(math.pi * progress))

# 示例：中训练 100B token，batch size = 4M token/step
total_steps = 25000
for step in [0, 100, 5000, 12500, 25000]:
    lr = annealing_lr_schedule(step, total_steps)
    print(f"Step {step:>6d}: lr = {lr:.6f}")
```

**Llama 3 的退火策略具体参数：**
- 预训练峰值学习率：8 × 10⁻⁵
- 中训练起始学习率：~3 × 10⁻⁵（逐步降低）
- 退火到 0
- 中训练 token 数：~800B（在 15T 预训练之后）
- 数据策略：上采样高质量数据、增加代码和数学、扩展上下文长度

### 8.3.2 多阶段中训练（Multi-stage Mid-training）

更复杂的方案将中训练分为多个子阶段，每个阶段有不同的目标和数据策略。

```
                    ┌─────────────────────────────────────────────┐
                    │              中训练                          │
                    │                                             │
  预训练  ──→       │  阶段 1        阶段 2         阶段 3         │  ──→  SFT
  (15T)             │  能力增强      长上下文       知识巩固        │       
                    │  (200B)       (100B)        (100B)         │
                    │  代码↑数学↑   8K→128K       高质量退火      │
                    └─────────────────────────────────────────────┘
```

**阶段设计的关键考量：**

1. **能力增强阶段**
   - 目标：提升代码/数学/多语言能力
   - 数据：大幅上采样目标领域数据
   - 学习率：相对较高（接近预训练末期）
   - 时长：100B-500B token

2. **长上下文扩展阶段**
   - 目标：扩展上下文窗口
   - 数据：逐步引入长文档
   - 学习率：中等
   - 特殊处理：RoPE base frequency 调整

3. **知识巩固阶段（退火）**
   - 目标：巩固所有能力，消除不稳定
   - 数据：最高质量的均衡数据
   - 学习率：余弦退火到接近零
   - 时长：50B-200B token

### 8.3.3 "稳定-衰减"两阶段范式

2025 年创智学院的 OctoThinker 项目（[arXiv: 2506.20512](https://arxiv.org/abs/2506.20512)）提出了一个简洁的两阶段框架：

1. **稳定阶段（Stable Phase）**：以恒定学习率在目标数据上训练，让模型充分吸收新知识
2. **衰减阶段（Decay Phase）**：学习率快速衰减，同时数据切换到最高质量的子集，让模型"记住"最重要的内容

这个框架的优势在于简洁性——只需要做一个决策：在哪里开始衰减。

OctoThinker 的消融实验揭示了几个重要的定量发现：

- **数据质量是 RL 兼容性的关键**：高质量数学语料（MegaMath-Web-Pro-Max，700B token）使 Llama 在后续 RL 阶段追平 Qwen 的性能。换用低质量数学语料则导致 RL 退化——这说明中训练数据的质量影响不仅局限于中训练本身，还决定了后训练的天花板。
- **指令遵循数据是"稳定剂"**：在中训练数据中混入指令遵循样本，能激发 QA 数据的潜力并稳定后续 RL 的响应长度。
- **长 CoT 直接注入是一个反面教训**：在中训练阶段直接注入长链式推理数据会导致后续 RL 训练不稳定。推理链的习得应该留给 RL 阶段，中训练只负责建立基础能力。
- **token 预算的 scaling 效应**：中训练从 20B 扩展到 100B token 时，下游 RL 性能持续提升——"scale mid-training is all Llama need"。
- **三分支设计**：将数据按粒度分为 Long（长推理）、Short（短答案）、Hybrid（混合），不同分支对后续 RL 行为有精细影响。衰减阶段混合三分支的效果优于单一分支。

### 8.3.4 强化中训练——后训练信号引导的闭环范式

2025-2026 年出现了一类全新的中训练范式：**后训练阶段的信号（尤其是 RL）不再只是中训练的"下游消费者"，而是反过来指导中训练的数据选择和 token 权重。** 中训练从传统的单向流水线进化为与后训练双向优化的闭环。

目前有三条代表性的技术路线：

**路线 1：RMT（Reinforcement Mid-Training）——RL 直接融入中训练阶段**

正式定义了"强化中期训练"问题（[arXiv: 2509.24375](https://arxiv.org/abs/2509.24375)），提出三个创新组件：

- **动态 token 预算**：限制过度思考，仅用 21% 的推理长度实现 +64.91% 提升
- **课程式自适应采样**：适应不平衡的 token 熵分布
- **RL + NTP 双重训练目标**：同时优化强化学习和 next-token prediction

后续接入标准后训练流程，数学任务额外提升 +18.76%。

**路线 2：ReMiT——RL 推理先验引导的 token 重加权**

利用 RL 微调模型的推理先验，在中训练阶段对 token 动态重加权——优先处理对推理至关重要的 token（[arXiv: 2602.03075](https://arxiv.org/abs/2602.03075)）。核心思想是建立"RL→中训练→更好 RL"的自强化飞轮。实验显示在 10 个基准上平均提升 3%，后训练保持 2% 增益。

**路线 3：RGA——RL 引导的退火 token 重加权**

在退火阶段通过计算基础模型和 RL 模型在 token 级别的损失差异来重新分配权重（[OpenReview: Ir78DvyQA1](https://openreview.net/forum?id=Ir78DvyQA1)，ICLR 2026 投稿）。在 10 个预训练基准上平均 +1.78~5.21%，后训练下游 +2%。

```
传统单向流水线：
  预训练 ──→ 中训练 ──→ SFT ──→ RL
                                  ×  无反馈

强化中训练闭环：
  预训练 ──→ 中训练 ←──→ RL
               ↑          │
               └──────────┘
             RL信号反馈指导中训练
```

三条路线的共性：**将后训练信号（RL 模型的推理偏好）作为中训练的数据信号，使中训练从"为后训练做准备"变为"与后训练协同优化"。** 这代表了 2025-2026 年中训练领域最重要的范式转变之一。

---

## 8.4 中训练的数据量级

中训练的数据量级介于预训练和 SFT 之间，但其范围变化很大：

| 目标 | 典型数据量 | 占预训练的比例 | 代表案例 |
|------|-----------|---------------|---------|
| 知识时效更新 | 50B-200B token | 0.5-2% | 一般增量更新 |
| 长上下文扩展 | 50B-500B token | 0.5-5% | Llama 3 的上下文扩展 |
| 代码/数学增强 | 100B-1T token | 1-10% | Code Llama, DeepSeek Coder |
| 多语言增强 | 200B-2T token | 2-20% | 中文增强、多语言适配 |
| 综合中训练 | 500B-2T token | 5-20% | Llama 3/3.1 的完整中训练 |

**一个关键认知**：中训练的数据量不能太少也不能太多。

- **太少**（<50B）：模型来不及调整内部表示，效果不明显
- **太多**（>预训练的 30%）：可能引发严重的遗忘问题，或者让模型过拟合于中训练数据

---

## 8.5 中训练 vs 继续预训练 vs 领域适应：辨析

这三个概念经常被混用。让我们厘清它们的区别和联系：

| 维度 | 中训练 | 继续预训练 | 领域适应 |
|------|--------|-----------|---------|
| **目标** | 多维度能力增强 | 增加训练量或更新知识 | 适应特定领域 |
| **数据** | 精选的多领域混合 | 通用数据（可能更新） | 领域专用数据 |
| **学习率** | 通常退火 | 可继承/重新warmup | 通常降低 |
| **数据量** | 100B-2T token | 可以很大 | 通常较小（10B-200B） |
| **遗忘风险** | 中等（通过配比控制） | 低（数据分布相似） | 高（数据分布偏移） |
| **典型场景** | Llama 3 的退火阶段 | 在新的 CC 快照上继续训练 | 构建法律/医疗模型 |

**实际上，中训练包含了继续预训练和领域适应的元素，但比两者都更系统化。** 它的核心创新在于：

1. **多目标同时优化**：不是只增强一个维度，而是同时提升长上下文、代码、数学等多种能力
2. **精心设计的数据策略**：不是简单地"在更多数据上训练"，而是根据能力需求调整配比
3. **与训练流程的深度集成**：学习率、batch size、上下文长度都需要协调调整

---

## 8.6 主要模型的中训练实践

### Llama 3/3.1（Meta，2024）

Llama 3 是中训练实践的标杆，它的技术报告提供了最详细的公开信息。

**关键细节：**
- 预训练 15T token 后，进入退火阶段
- 退火期间上采样高质量数据（维基百科类、精选书籍、优质网页）
- 数学数据额外上采样，提升推理能力
- 长上下文扩展分阶段进行（8K→128K）
- 退火期间同时加入少量多语言数据

### DeepSeek V3（DeepSeek，2024.12）

DeepSeek V3 的中训练策略体现了极致的工程化：
- 总预训练 14.8T token
- 最后 2T token 进入退火阶段
- 退火期间的数据分布发生了显著变化：代码和数学的占比大幅提升
- 使用了 MoE 架构（671B 总参数，37B 激活参数），这对中训练的数据需求有特殊影响

### Qwen 2.5（阿里，2024）

Qwen 2.5 的中训练聚焦于中文能力的增强：
- 在大规模预训练后，增加中文数据的比例
- 特别强化了中文代码和数学能力
- 多语言配比经过了大量的消融实验

### Llama 4（Meta，2025）

Llama 4 是 MoE 架构在中训练中的首个标杆级实践。Scout 模型（17B 激活/109B 总参，16 专家选 1）的训练流程明确分为三阶段：

- **预训练**：大规模多模态预训练，采用路由专家 + 共享专家结构
- **中训练**：长上下文扩展阶段，通过 iRoPE（交错旋转位置编码）将上下文扩展到 10M token，同时包含早期融合的多模态数据
- **后训练**：轻量 SFT + 在线 RL + 轻量 DPO，刻意保持轻量化

MoE 架构对中训练策略有本质影响：

1. **路由/共享专家结构**：共享专家充当通用知识的"锚点"——中训练时即使路由专家在不同领域数据上产生分化，共享专家保留了跨领域的通用表征，天然缓解了遗忘问题
2. **负载均衡约束**：中训练阶段的数据配比需要考虑专家路由的负载均衡，避免某些专家过度激活
3. **计算效率**：109B 总参数中仅 17B 激活，使得更长的中训练（更多 token）在计算成本上可行

### 通用模式

从这些实践中，我们可以提炼出中训练的通用模式：

```
模式 1: 能力增强 → 退火
   - 先在目标能力相关的数据上集中训练
   - 然后在高质量混合数据上退火

模式 2: 渐进式扩展
   - 逐步扩展能力维度（如上下文长度逐步增大）
   - 每扩展一步，都验证旧能力不退化

模式 3: 多轮退火
   - 经历多轮"升温-退火"周期
   - 每轮聚焦不同的能力维度

模式 4: MoE 专家特化中训练
   - 利用 MoE 的稀疏结构，不同专家对不同能力维度特化
   - 共享专家保留通用知识作为抗遗忘"锚点"
   - 中训练数据配比需与专家路由策略协同设计
```

---

## 8.7 中训练的关键决策

在设计中训练方案时，你需要做出以下关键决策：

### 决策 1：从哪个检查点开始？

```
选项 A：从预训练的最后一个检查点开始
  → 最自然，但学习率需要从预训练末期的值开始衰减

选项 B：从预训练中间的某个检查点开始
  → 如果预训练末期的数据有问题，可以"回退"重来
  → 需要重新跑预训练的部分步骤

选项 C：从预训练退火前的检查点开始
  → 中训练本身就是一个"定制版退火"
  → 这是 Llama 3 采用的方式
```

**推荐**：从退火开始前的检查点出发，设计你自己的退火策略。这样你拥有最大的灵活性。

### 决策 2：中训练多少 token？

一个经验性的指导框架：

```python
def estimate_midtraining_tokens(
    pretrain_tokens: float,     # 预训练总 token 数
    num_objectives: int = 3,     # 中训练目标数量
    difficulty: str = "medium"   # 目标难度
) -> dict:
    """
    估算中训练所需的 token 数
    """
    # 基线：预训练的 3-10%
    base_ratio = {
        "easy": 0.03,    # 简单目标（如知识更新）
        "medium": 0.07,  # 中等目标（如代码增强）
        "hard": 0.15,    # 困难目标（如大幅扩展上下文+多语言+代码）
    }

    ratio = base_ratio.get(difficulty, 0.07)

    # 多目标需要更多数据
    ratio *= (1 + 0.2 * (num_objectives - 1))

    tokens = pretrain_tokens * ratio

    return {
        "estimated_tokens": f"{tokens/1e9:.0f}B",
        "ratio_to_pretrain": f"{ratio*100:.1f}%",
        "note": f"基于 {pretrain_tokens/1e12:.1f}T 预训练, "
                f"{num_objectives} 个目标, 难度={difficulty}",
    }

# 示例
print(estimate_midtraining_tokens(15e12, num_objectives=3, difficulty="medium"))
# {'estimated_tokens': '1470B', 'ratio_to_pretrain': '9.8%', ...}
```

### 决策 3：学习率策略

```
选项 A: 继承预训练学习率，直接退火
  → 最简单，适合目标简单的中训练

选项 B: 短暂 warmup 后退火
  → 避免学习率突变带来的不稳定
  → 推荐作为默认策略

选项 C: 重新 warmup 到较高学习率
  → 适合需要大幅改变模型能力的场景（如大规模领域适应）
  → 遗忘风险较高，需要仔细控制
```

### 决策 4：数据配比策略

这是最关键也最难的决策。我们将在第 9 章深入讨论。

---

## 8.8 中训练的风险与挑战

### 灾难性遗忘

这是中训练面临的最大风险。我们将在第 10 章用一整章来讨论，这里先概述：

- 中训练的数据分布与预训练不同，可能导致模型"忘记"预训练中学到的知识
- 遗忘的严重程度取决于：数据分布偏移的程度、中训练的时长、学习率的大小
- 核心对策：在中训练数据中混入一定比例的通用数据（回放策略）

### 能力冲突

不同能力之间可能存在冲突：

```
案例：数学增强 vs 创意写作
  - 大幅增加数学数据后，模型的创意写作能力下降
  - 原因：数学数据的格式化、结构化风格"压制"了创造性表达
  - 对策：在配比中保留足够的文学/创意类数据
```

### 训练不稳定

中训练阶段的数据分布切换可能导致训练不稳定（loss spike）：

- 特别是在上下文长度突然变化时
- 或者在数据域占比剧烈调整时
- 对策：渐进式调整，而非突变

---

## 8.9 展望：中训练的未来

### "Mid-training is the new pre-training"

Noam Brown 的这句话蕴含着一个深刻的趋势：**预训练可能会变得越来越通用化和标准化**，而真正的差异化将发生在中训练阶段。

原因在于：
1. 预训练数据逐渐收敛（大家都在用 Common Crawl + 类似的高质量源）
2. 预训练的方法论趋于成熟（Transformer + 类似的超参数）
3. 中训练提供了在通用基座上"雕刻"特定能力的灵活性

### Agent 数据的中训练

随着 AI Agent 的兴起，工具调用、环境交互、多步骤规划等能力的需求日益增长。这些能力很难在预训练阶段获得（因为互联网上没有足够的 Agent 交互数据），而中训练阶段是注入这些能力的天然窗口。

### 持续中训练

传统的中训练是"一次性"的——做完中训练就进入 SFT。但未来可能会出现**持续中训练**的模式：模型定期在新数据上进行中训练更新，保持知识的时效性，而无需每次都从预训练重来。

### RL-中训练闭环

传统流水线是单向的（预训练→中训练→SFT→RL），但 ReMiT 和 RGA 开启了"后训练→中训练"的反向通路，形成自强化飞轮（详见 8.3.4 节）。远期看，中训练可能不再是训练流程中固定的"一个阶段"，而是与 RL 交替进行的迭代循环——每一轮 RL 的发现（如哪些 token 对推理至关重要、哪些知识缺口导致了推理失败）反馈到下一轮中训练的数据选择中。这与第 7 章讨论的"迭代数据飞轮"形成呼应：数据飞轮不仅存在于预训练阶段，中训练-后训练的闭环可能是效率更高的飞轮。

---

## 动手环节：设计一个中训练方案

**目标**：为一个真实场景设计完整的中训练策略，包括阶段规划、数据配比和学习率调度。

### 练习 1：中训练方案规划器

```python
"""
中训练方案设计工具
输入你的需求，输出分阶段的中训练计划
"""

from dataclasses import dataclass
from typing import List

@dataclass
class MidTrainingObjective:
    name: str
    priority: str        # "critical", "important", "nice-to-have"
    estimated_tokens_B: float
    data_ratio_shift: dict  # 相比预训练的配比变化

@dataclass
class MidTrainingStage:
    name: str
    tokens_B: float
    lr_strategy: str
    data_ratios: dict
    context_length: int
    validation_criteria: List[str]

def design_midtraining_plan(
    pretrain_tokens_T: float,
    objectives: List[MidTrainingObjective],
) -> List[MidTrainingStage]:
    """根据目标自动设计中训练分阶段计划"""

    # 估算总中训练量
    total_tokens_B = sum(obj.estimated_tokens_B for obj in objectives)

    # 安全检查
    ratio = total_tokens_B / (pretrain_tokens_T * 1000)
    if ratio > 0.2:
        print(f"⚠️ 中训练量占预训练的 {ratio*100:.1f}%，超过 20%，"
              f"遗忘风险较高！")

    stages = []

    # 阶段 1：能力增强
    critical_objs = [o for o in objectives if o.priority == "critical"]
    if critical_objs:
        enhance_tokens = sum(o.estimated_tokens_B for o in critical_objs)
        combined_ratios = {}
        for obj in critical_objs:
            for domain, ratio in obj.data_ratio_shift.items():
                combined_ratios[domain] = combined_ratios.get(domain, 0) + ratio
        # 归一化
        total = sum(combined_ratios.values())
        combined_ratios = {k: v/total for k, v in combined_ratios.items()}

        stages.append(MidTrainingStage(
            name="能力增强",
            tokens_B=enhance_tokens,
            lr_strategy="恒定 (预训练末期 LR × 0.3)",
            data_ratios=combined_ratios,
            context_length=8192,
            validation_criteria=[
                "目标能力 benchmark 提升 > 5%",
                "通用能力退化 < 2%",
            ],
        ))

    # 阶段 2：长上下文扩展（如果需要）
    ctx_objs = [o for o in objectives if "长上下文" in o.name]
    if ctx_objs:
        stages.append(MidTrainingStage(
            name="长上下文扩展",
            tokens_B=ctx_objs[0].estimated_tokens_B,
            lr_strategy="较低恒定 LR (预训练末期 × 0.1)",
            data_ratios={"长文档": 0.6, "通用": 0.4},
            context_length=131072,
            validation_criteria=[
                "Needle-in-a-Haystack 在 128K 通过",
                "短上下文任务不退化",
            ],
        ))

    # 阶段 3：退火巩固
    stages.append(MidTrainingStage(
        name="知识巩固（退火）",
        tokens_B=max(50, total_tokens_B * 0.15),
        lr_strategy="Cosine 退火到 0",
        data_ratios={"高质量通用": 0.5, "代码": 0.2, "数学": 0.1,
                     "书籍": 0.1, "学术": 0.1},
        context_length=stages[-1].context_length if stages else 8192,
        validation_criteria=[
            "全部能力 benchmark 稳定",
            "Loss 完全收敛",
        ],
    ))

    return stages

# === 设计方案 ===
objectives = [
    MidTrainingObjective(
        "代码能力增强", "critical", 200,
        {"代码": 0.35, "通用": 0.30, "数学": 0.15, "学术": 0.10, "书籍": 0.10}
    ),
    MidTrainingObjective(
        "中文能力补充", "critical", 300,
        {"中文网页": 0.40, "中文书籍": 0.15, "英文": 0.25, "代码": 0.15, "数学": 0.05}
    ),
    MidTrainingObjective(
        "长上下文扩展", "important", 100,
        {"长文档": 0.60, "通用": 0.40}
    ),
]

stages = design_midtraining_plan(pretrain_tokens_T=15, objectives=objectives)

print("=" * 60)
print("中训练方案")
print("=" * 60)
total = 0
for i, stage in enumerate(stages, 1):
    total += stage.tokens_B
    print(f"\n阶段 {i}: {stage.name}")
    print(f"  Token 数: {stage.tokens_B:.0f}B")
    print(f"  学习率: {stage.lr_strategy}")
    print(f"  上下文长度: {stage.context_length:,}")
    print(f"  数据配比:")
    for domain, ratio in sorted(stage.data_ratios.items(),
                                 key=lambda x: -x[1]):
        print(f"    {domain}: {ratio*100:.0f}%")
    print(f"  验证标准:")
    for criterion in stage.validation_criteria:
        print(f"    ✓ {criterion}")

print(f"\n总计: {total:.0f}B token "
      f"(占预训练的 {total/15000*100:.1f}%)")
```

### 练习 2：学习率退火可视化

```python
"""
可视化不同中训练学习率策略
"""

import math

def cosine_annealing(step, total_steps, start_lr, min_lr, warmup_steps=100):
    if step < warmup_steps:
        return min_lr + (start_lr - min_lr) * step / warmup_steps
    progress = (step - warmup_steps) / (total_steps - warmup_steps)
    return min_lr + 0.5 * (start_lr - min_lr) * (1 + math.cos(math.pi * progress))

# 模拟三种策略
total_steps = 10000
pretrain_peak_lr = 3e-4

strategies = {
    "直接退火": lambda s: cosine_annealing(s, total_steps, pretrain_peak_lr * 0.3, pretrain_peak_lr * 0.01, 0),
    "Warmup+退火": lambda s: cosine_annealing(s, total_steps, pretrain_peak_lr * 0.3, pretrain_peak_lr * 0.01, 200),
    "重新Warmup": lambda s: cosine_annealing(s, total_steps, pretrain_peak_lr * 0.8, pretrain_peak_lr * 0.01, 500),
}

# 打印关键点的 LR
print(f"{'步骤':<8}", end="")
for name in strategies:
    print(f"{name:>15}", end="")
print()
print("-" * 55)

for step in [0, 100, 500, 2500, 5000, 7500, 10000]:
    print(f"{step:<8}", end="")
    for name, fn in strategies.items():
        lr = fn(min(step, total_steps - 1))
        print(f"{lr:>15.6f}", end="")
    print()

# 思考题：
# 1. 哪种策略最适合"微调式中训练"（目标变化小）？
# 2. 哪种策略最适合"大规模能力注入"（如加强代码能力）？
# 3. 为什么 Llama 3 选择了"从退火前的检查点开始"而不是从最终检查点开始？
```

### 练习 3：遗忘风险评估

根据本章 8.8 节，为你在练习 1 中设计的中训练方案做一个遗忘风险评估：

- 计算每个阶段的**数据分布偏移度**（与预训练配比的 KL 散度）
- 估算遗忘风险等级（低/中/高）
- 为每个高风险阶段设计**回放策略**（混入多少比例的通用数据）

这个练习为第 10 章（灾难性遗忘）的深入学习做铺垫。

---

> **本章要点回顾**
>
> 1. **中训练是预训练和 SFT 之间的独立阶段**，已从"工程技巧"升级为"核心范式"
> 2. **五大目标**：长上下文、代码/数学增强、多语言补充、知识更新、领域注入
> 3. **中训练是 RL 的前置必要条件**：PRISM 实验证明不做中训练的 RL 几乎无效，仅 27B token 即可创造有效条件
> 4. **四种技术框架**：退火式、多阶段、稳定-衰减、强化中训练（RL 引导的闭环范式）
> 5. **长上下文扩展加速进化**：从 8K→128K→4M→10M，数据效率持续提高
> 6. **数据量级**：通常是预训练的 3-20%，即 100B-2T token
> 7. **区分中训练、继续预训练、领域适应**三个相关但不同的概念
> 8. **MoE 架构开启专家特化中训练**：共享专家保留通用知识，路由专家实现能力维度特化
> 9. **灾难性遗忘是最大风险**，需要通过数据回放和配比控制来防范
> 10. **"Mid-training is the new pre-training"**——中训练正在成为模型差异化的关键战场，且正从单向流水线进化为与后训练双向优化的闭环

