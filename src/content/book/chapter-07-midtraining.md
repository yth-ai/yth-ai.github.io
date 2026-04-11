---
title: "中训练（Mid-training）"
description: "预训练之后、后训练之前——中训练如何增强模型的领域能力和长上下文处理"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 7
part: "第二部分：预训练"
partOrder: 2
tags: ["中训练", "Mid-training", "长上下文", "领域增强", "持续预训练"]
---

## 什么是中训练

中训练（Mid-training），也称为 continued pre-training 或 pre-SFT training，是介于预训练（Pre-training）和后训练（Post-training）之间的训练阶段：

```
预训练 (Pre-training)
  ↓ 数万亿 tokens，通用能力
  ↓
中训练 (Mid-training)        ← 本章
  ↓ 数百亿 ~ 数千亿 tokens
  ↓ 能力增强 & 领域注入
  ↓
后训练 (Post-training)
  ↓ SFT + RLHF/DPO
  ↓
最终模型
```

中训练不是一个新概念——早期的"领域预训练"（domain-adaptive pretraining）本质上就是中训练。但随着训练流水线的成熟和需求的多样化，中训练已经从"可选"变为"几乎必须"的阶段。

更准确地说，中训练与预训练使用**相同的训练目标**（next-token prediction），但在以下维度上有本质区别：

| 维度 | 预训练 | 中训练 |
|------|--------|--------|
| 数据量 | 5T - 20T+ tokens | 50B - 2T tokens |
| 目标 | 广泛的通用能力 | 定向增强特定能力 |
| 学习率 | 从 0 warmup 到 peak | 从预训练末态续接或重新 warmup |
| 数据分布 | 尽量均匀覆盖 | 有意识地偏向目标领域 |
| 核心挑战 | 训练稳定性和规模 | **遗忘控制**和**能力平衡** |
| 典型时长 | 数周到数月 | 数天到数周 |

### 为什么需要中训练

预训练阶段的目标是建立**广泛的通用能力**，数据覆盖面广但某些能力可能不够深入。中训练专门解决以下问题：

1. **长上下文能力**：从 8K 扩展到 128K 甚至更长
2. **代码和数学增强**：提升推理相关能力
3. **多语言增强**：增强目标语言（如中文）的能力
4. **领域知识注入**：医疗、法律、金融等专业知识
5. **数据格式适应**：结构化数据（表格、JSON）处理能力
6. **知识时效更新**：注入最新的知识而不重新预训练

> **本质洞察**：中训练的核心是一个 **"定向增强 vs 全局遗忘"的博弈问题**。增加目标领域数据会增强目标能力，但如果处理不当，通用能力会同比例退化。本章的核心就是如何赢得这场博弈。

## 长上下文中训练

### 为什么长上下文需要专门训练

虽然 RoPE 理论上支持任意长度外推，但直接在推理时使用远超训练长度的上下文，效果会严重下降。长上下文中训练是弥合这一差距的关键步骤。

### RoPE 扩展策略

从第二章的 RoPE 基础出发，长上下文训练通常涉及调整 RoPE 的基频：

**ABF（Adjusted Base Frequency）**：

将 RoPE 的基频 $\theta$ 从 10000 调大到更高的值：

$$\theta_i = b^{-2i/d}$$

例如 [LLaMA 3.1](https://arxiv.org/abs/2407.21783) 将基频从 500,000 进一步提升以支持 128K 上下文。

[Code LLaMA](https://arxiv.org/abs/2308.12950) 率先展示了通过修改 RoPE 基频 + 少量长上下文数据微调，即可将 LLaMA 从 4K 扩展到 100K 上下文长度。

### 训练策略

**渐进式扩展**：
1. 阶段 1：从 8K → 32K（2B tokens，RoPE 调频）
2. 阶段 2：从 32K → 128K（2B tokens，进一步调频）

**学习率**：通常使用预训练峰值 LR 的 1/10 ~ 1/5

**数据构造**：
- 长文档：书籍、论文、法律文书、代码仓库
- 合成长依赖数据："needle in a haystack" 式的训练样本
- 多文档聚合：将相关短文档拼接成长序列

### 长上下文评估

| 评测方法 | 说明 |
|---------|------|
| [NIAH（Needle in a Haystack）](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) | 在长文本中检索特定信息 |
| [RULER](https://arxiv.org/abs/2404.06654) | 多种长上下文能力的综合评测 |
| [LongBench](https://arxiv.org/abs/2308.14508) | 长文本理解 benchmark |
| 真实任务 | 长文档 QA、代码仓库理解、多轮长对话 |

## 代码和数学增强

### 动机

代码和数学能力不仅直接有用，还被认为能**间接提升通用推理能力**。[DeepSeek V3](https://arxiv.org/abs/2412.19437) 在中训练阶段大幅增加代码和数学数据的比例。

### 代码数据

**来源**：
- [The Stack V2](https://huggingface.co/datasets/bigcode/the-stack-v2)：67.5B tokens 的代码数据
- [StarCoderData](https://huggingface.co/datasets/bigcode/starcoderdata)：筛选后的高质量代码
- GitHub 自主爬取 + 过滤
- 代码相关的文档和教程

**质量控制**：
- 基于 star 数的仓库级过滤
- 去除自动生成的代码（如 `package-lock.json`）
- 去除测试文件的过度重复
- 去除含有个人信息（如 API key）的代码

### 数学数据

**来源**：
- [OpenWebMath](https://arxiv.org/abs/2310.06786)：从 Common Crawl 中提取的数学内容
- [Proof-Pile-2](https://huggingface.co/datasets/EleutherAI/proof-pile-2)：数学证明和教科书
- 合成数学数据（由 LLM 生成的数学推理链）
- LaTeX 论文中的数学部分

### 合成数据在中训练中的角色

[Phi 系列](https://arxiv.org/abs/2309.05463)（Microsoft）率先证明了合成数据在预训练阶段的威力。在中训练中，合成数据的典型用法：

1. **教科书质量的解释**：用 GPT-4/Claude 将维基百科知识改写为教科书风格
2. **数学推理链**：生成 step-by-step 的数学解题过程
3. **代码注释增强**：为高质量代码添加详细注释和解释
4. **多角度改写**：同一知识从不同难度、不同风格的角度阐述

> **注意**：合成数据的质量取决于生成模型的能力。用弱模型生成的合成数据可能反而损害训练效果——这就是所谓的 [model collapse](https://arxiv.org/abs/2305.17493) 风险。

## 多语言增强

### 中文能力的增强

如果基座模型主要在英文数据上预训练（如 LLaMA），中训练是增强中文能力的关键窗口。

**典型策略**：
- 中训练数据中中文比例提升到 30-50%（预训练可能只有 5-10%）
- 混合中英文数据，避免英文能力退化（catastrophic forgetting）
- 使用高质量中文语料：百科、教科书、新闻、优质博客

**词表扩展**：

如果原始 tokenizer 对中文不友好（如 LLaMA 的 32K 词表），可以在中训练前扩展词表：
1. 在中文语料上训练新的 BPE 子词
2. 将新 token 添加到词表
3. 初始化新 token 的 embedding（通常用已有 embedding 的平均值）
4. 中训练时重点训练新 token 的 embedding

[Chinese-LLaMA](https://arxiv.org/abs/2304.08177)（Cui et al., 2023）详细展示了这一流程。

### Catastrophic Forgetting 的缓解

中训练面临的核心挑战是**灾难性遗忘**——新数据可能覆盖旧知识。这不是理论问题——实际训练中，如果中训练数据配比不当，模型可能在 1000 步内丢失 10%+ 的英文 MMLU 分数。

**遗忘的量化定义**：

对于 benchmark $B$，遗忘率定义为：

$$\text{Forgetting}(B) = \frac{\text{Score}_\text{before} - \text{Score}_\text{after}}{\text{Score}_\text{before}} \times 100\%$$

一般认为遗忘率 < 3% 是可接受的，3-5% 需要关注，> 5% 必须调整。

**缓解策略矩阵**：

| 策略 | 原理 | 效果 | 成本 | 适用场景 |
|------|------|------|------|---------|
| 数据混合（Replay） | 保留预训练数据采样 | ★★★★★ | 低 | **所有场景**，必选 |
| 学习率控制 | 减小参数更新幅度 | ★★★★ | 零 | 所有场景，必选 |
| 渐进式注入 | 逐步增大领域数据比例 | ★★★ | 低 | 领域差异大时 |
| [EWC](https://arxiv.org/abs/1612.00796) | 约束"重要"参数变化 | ★★★ | 高 | 参数量小时 |
| Replay Buffer | 按重要性加权回放 | ★★★★ | 中 | 有旧 eval 数据时 |

> **最重要的策略是数据混合**。下一节将专门讨论如何设计混合比例。

**遗忘监控系统**：

在中训练过程中，你需要一个实时的遗忘监控系统。最小可用版本：

```python
import json
from dataclasses import dataclass, field
from typing import Dict, List

@dataclass
class ForgettingMonitor:
    """中训练遗忘监控器"""
    benchmarks: List[str] = field(default_factory=lambda: [
        "mmlu", "gsm8k", "humaneval", "c_eval", "hellaswag"
    ])
    baseline_scores: Dict[str, float] = field(default_factory=dict)
    history: List[Dict] = field(default_factory=list)
    alert_threshold: float = 0.05  # 5% 遗忘率告警
    
    def set_baseline(self, scores: Dict[str, float]):
        """在中训练开始前，记录基座模型的 baseline 分数"""
        self.baseline_scores = scores.copy()
        print(f"[Monitor] Baseline set: {scores}")
    
    def check(self, step: int, current_scores: Dict[str, float]) -> Dict:
        """检查当前遗忘情况"""
        report = {"step": step, "scores": {}, "alerts": []}
        
        for bench in self.benchmarks:
            if bench not in self.baseline_scores or bench not in current_scores:
                continue
            
            baseline = self.baseline_scores[bench]
            current = current_scores[bench]
            forgetting = (baseline - current) / baseline if baseline > 0 else 0
            improvement = (current - baseline) / baseline if baseline > 0 else 0
            
            report["scores"][bench] = {
                "baseline": baseline,
                "current": current,
                "forgetting": f"{forgetting:.2%}",
            }
            
            if forgetting > self.alert_threshold:
                report["alerts"].append(
                    f"⚠️ {bench}: 遗忘率 {forgetting:.1%} 超过阈值 "
                    f"({baseline:.2f} → {current:.2f})"
                )
        
        self.history.append(report)
        
        if report["alerts"]:
            print(f"\n{'='*50}")
            print(f"[Step {step}] ⚠️ 遗忘告警!")
            for alert in report["alerts"]:
                print(f"  {alert}")
            print(f"建议: 增加 replay 数据比例 或 降低学习率")
            print(f"{'='*50}\n")
        
        return report

# 使用示例
monitor = ForgettingMonitor()
monitor.set_baseline({
    "mmlu": 0.683, "gsm8k": 0.521, 
    "humaneval": 0.378, "c_eval": 0.542, "hellaswag": 0.789
})

# 中训练过程中每 500 步检查一次
# monitor.check(step=500, current_scores={...})
# monitor.check(step=1000, current_scores={...})
```

**关键监控指标**：

除了 benchmark 分数，还应监控以下指标来**早期预警**遗忘：

| 指标 | 计算方式 | 预警信号 |
|------|---------|---------|
| 通用语料 Perplexity | 在预训练 eval set 上计算 PPL | PPL 上升 > 2% |
| 参数漂移 (L2 norm) | $\|\theta_t - \theta_0\|_2 / \|\theta_0\|_2$ | 超过预设阈值 |
| Embedding 漂移 | 高频 token embedding 的余弦距离 | 距离增大 |
| 梯度投影 | 中训练梯度在预训练梯度方向的投影 | 负投影占比增大 |

## 中训练的数据配方

这是中训练中**最核心也最难的部分**。数据配比直接决定了中训练的成败。

### 数据配比的方法论

数据配比不是靠直觉拍脑袋的，而是需要系统的实验来确定。以下是工业界验证有效的方法论：

**方法 1：小模型搜索 + 大模型验证**

这是最常用的方法——利用 Scaling Laws 的可迁移性：

```python
from itertools import product
from dataclasses import dataclass
from typing import Dict, List, Tuple

@dataclass
class MixExperiment:
    """数据配比实验框架"""
    domains: List[str]  # 数据域列表
    proxy_model_size: str  # 代理模型大小 (如 "1B")
    tokens_per_exp: int  # 每个实验的 token 数
    
    def generate_grid(
        self, 
        domain_ranges: Dict[str, List[float]],
        step: float = 0.1
    ) -> List[Dict[str, float]]:
        """生成配比搜索网格
        
        Args:
            domain_ranges: 每个域的搜索范围, 如 {"code": [0.1, 0.3], "math": [0.05, 0.15]}
            step: 搜索步长
        """
        configs = []
        
        # 固定域和浮动域
        fixed_domains = {d: r for d, r in domain_ranges.items() if r[0] == r[1]}
        search_domains = {d: r for d, r in domain_ranges.items() if r[0] != r[1]}
        
        # 生成搜索空间
        search_values = {}
        for domain, (lo, hi) in search_domains.items():
            values = []
            v = lo
            while v <= hi + 1e-9:
                values.append(round(v, 2))
                v += step
            search_values[domain] = values
        
        # 枚举组合 (web 域作为补充域，自动计算)
        for combo in product(*search_values.values()):
            config = dict(zip(search_domains.keys(), combo))
            config.update(fixed_domains)
            
            used = sum(config.values())
            if used > 1.0:
                continue
            
            # 剩余分配给 replay/web 域
            config["replay_web"] = round(1.0 - used, 2)
            if config["replay_web"] < 0.1:  # replay 至少 10%
                continue
                
            configs.append(config)
        
        return configs

# 案例：中文增强的配比搜索
exp = MixExperiment(
    domains=["chinese", "code", "math", "replay_web"],
    proxy_model_size="1B",
    tokens_per_exp=10_000_000_000,  # 10B tokens per experiment
)

configs = exp.generate_grid({
    "chinese": [0.2, 0.5],    # 中文: 20%-50%
    "code":    [0.1, 0.2],    # 代码: 10%-20%
    "math":    [0.05, 0.10],  # 数学: 5%-10%
}, step=0.1)

print(f"搜索空间大小: {len(configs)} 个配置")
# 每个配置用 1B 代理模型训练 10B tokens
# 评估 MMLU/C-Eval/GSM8K/HumanEval 四个指标
# 选出 Pareto 最优的 2-3 个配置在 7B 上验证
```

**方法 2：在线配比调整（DoReMi 风格）**

[DoReMi](https://arxiv.org/abs/2305.10429)（Xie et al., 2023）提出了一种数据驱动的配比方法：训练一个小的代理模型来学习最优配比权重，然后将权重转移到大模型训练中。

核心思想：**让模型在表现差的域上分配更多数据**。

```
Step 1: 用均匀配比训练一个参考模型 M_ref (小模型)
Step 2: 训练一个代理模型 M_proxy，优化配比权重 w_i
        使得 M_proxy 在所有域上的 loss 接近 M_ref
        对 loss 高于 M_ref 的域，增大 w_i
Step 3: 用学到的 w_i 训练大模型
```

**方法 3：基于目标的反向配比**

先确定目标 benchmark 和权重，反向推导配比：

| 目标 benchmark | 权重 | 主要相关数据域 |
|---------------|------|-------------|
| MMLU | 0.25 | 百科、教材、学术论文 |
| C-Eval | 0.25 | 中文百科、中文教材 |
| GSM8K | 0.20 | 数学推理数据 |
| HumanEval | 0.20 | 代码数据 |
| HellaSwag | 0.10 | 通用 Web 数据 |

从这个目标权重出发，结合小模型实验的 (数据配比 → benchmark) 映射，反向求解最优配比。

### LLaMA 3.1 的中训练策略

[Meta LLaMA 3.1 论文](https://arxiv.org/abs/2407.21783) 描述了一个多阶段的中训练过程：

1. **长上下文扩展**：逐步从 8K → 128K
2. **数据配比调整**：在最后阶段上采样高质量数据
3. **退火（Annealing）**：学习率最后降到接近 0，数据质量拉到最高

### DeepSeek 的中训练策略

[DeepSeek V3](https://arxiv.org/abs/2412.19437) 在预训练 14.8T tokens 后，进行了两阶段的中训练：

1. **阶段 1**：增加数学、代码和合成数据的比例
2. **阶段 2**：长上下文扩展 + 退火

### 退火（Annealing）的深度解析

退火是中训练最后阶段的关键策略，其本质是 **"用最好的数据 + 最低的学习率 = 让模型稳定地记住最重要的知识"**。

**退火的实施**：

```python
# 退火阶段的典型配置
annealing_config = {
    # 学习率：从当前 LR 线性衰减到接近 0
    "lr_schedule": "linear_decay",
    "lr_start": 3e-5,       # 当前学习率
    "lr_end": 1e-6,          # 最终学习率
    
    # 数据质量：大幅上采样高质量数据
    "data_mix": {
        "high_quality_web": 0.30,    # ↑ FineWeb-Edu 等高质量网页
        "textbooks": 0.15,           # ↑ 教科书质量数据
        "curated_code": 0.15,        # ↑ 精选高质量代码
        "math_reasoning": 0.10,      # ↑ 数学推理链
        "wikipedia": 0.10,           # ↑ 百科全书
        "general_web": 0.20,         # ↓ 一般 Web 数据比例降低
    },
    
    # 数据量：通常占中训练总量的 5-10%
    "tokens": "50B",
    
    # 关键：退火阶段不做数据去重
    # 允许模型多次看到最高质量的数据
    "allow_repeat": True,
}
```

**退火的效果**：根据 [MiniCPM 论文](https://arxiv.org/abs/2404.06395) 的报告，退火阶段通常可以在不增加遗忘的情况下，将 benchmark 分数提升 2-5 个百分点。

### 通用配方建议

| 参数 | 建议值 | 说明 |
|------|--------|------|
| 数据量 | 50B - 500B tokens | 取决于领域和任务 |
| 学习率 | 预训练 peak 的 10-20% | 过高容易遗忘 |
| 调度方式 | WSD 或 cosine decay | WSD 更灵活 |
| 原始数据混合 | 20-50% | 保持通用能力 |
| 序列长度 | 渐进增长 | 从短到长，分阶段 |
| Warmup | 500-1000 步 | 从上一阶段平滑过渡 |
| 退火阶段 | 5-10% 的总 tokens | 最后阶段用最好的数据 |

### 中训练学习率：一个常被忽视的关键

学习率的设置是中训练成败的关键因素之一。过高导致遗忘，过低导致学不到新东西。

**续训学习率选择策略**：

```
方案 A：从预训练末态续接 (推荐)
  └─ 直接从预训练最后的 LR 开始，平滑过渡
  └─ 适用于：预训练和中训练数据分布相近
  └─ 典型 LR: 预训练末态 LR (如 3e-5)

方案 B：重新 warmup (更安全)
  └─ 短暂 warmup (200-500 步) 到目标 LR
  └─ 适用于：中训练数据分布与预训练差异大
  └─ 典型 LR: 预训练 peak 的 10-20% (如 3e-5 ~ 6e-5)

方案 C：WSD 续训 (最灵活)
  └─ 从预训练末态 warmup 到 stable LR
  └─ stable 阶段训练主体内容
  └─ 最后 decay + 退火
  └─ 适用于：所有场景
```

> **实战经验**：如果你不确定用什么学习率，一个安全的起点是 **预训练 peak LR 的 10%**。如果发现 eval loss 几乎不降，可以适当调高到 20%。如果发现遗忘严重，降到 5%。

## 中训练 vs 从头训练

什么时候应该中训练，什么时候应该从头训练？

| 场景 | 推荐方案 |
|------|---------|
| 增强特定能力（代码/数学/多语言） | 中训练 |
| 知识更新（时效性） | 中训练 |
| 长上下文支持 | 中训练 |
| 全面换代（新架构/新 tokenizer） | 从头训练 |
| 数据分布剧烈变化（如从英文为主到中文为主） | 从头训练 |
| 预训练数据质量严重不足 | 从头训练 |

> **经验法则**：如果目标领域数据量 < 原始预训练数据的 10%，通常中训练更高效。如果超过 30%，可以考虑从头训练。

更精确的判断框架：

```
                      新增数据量
                    少 (<5%)     多 (>30%)
                 ┌──────────┬──────────┐
    域距离  小   │  中训练   │  中训练   │
            大   │  中训练   │  从头训练  │
                 └──────────┴──────────┘
```

**"域距离"怎么衡量？** 一个简单的代理指标：在预训练模型上计算新数据的 perplexity。如果 PPL > 预训练 eval set PPL 的 3 倍，说明域距离大。

## 中训练完整实战 Pipeline

将上述所有内容串联起来，以下是一个完整的中训练 pipeline：

```
阶段 0: 准备
  ├─ 选定基座模型 & 收集目标领域数据
  ├─ 在基座模型上跑 baseline eval (记录所有 benchmark 分数)
  ├─ 准备 replay 数据 (从预训练数据中采样)
  └─ 设计配比搜索空间

阶段 1: 配比搜索 (1B 代理模型, ~1 周)
  ├─ 用 1B 模型跑 10-20 组配比实验 (每组 10B tokens)
  ├─ 评估每组的 {目标任务, 通用能力, 遗忘} 三维指标
  └─ 选出 Pareto 最优的 2-3 组配比

阶段 2: 验证 (7B 模型, ~3 天)
  ├─ 用候选配比在 7B 上跑 50B tokens
  ├─ 确认遗忘在可控范围
  └─ 锁定最终配比

阶段 3: 正式中训练 (目标模型, ~1-3 周)
  ├─ 主体训练: WSD 学习率, 监控遗忘
  ├─ 长上下文扩展 (如需要): 分阶段 8K→32K→128K
  └─ 退火: 最后 5-10% tokens, 最高质量数据, 学习率衰减到 0

阶段 4: 评估 & 交接
  ├─ 全量 eval: 目标任务 + 通用能力
  ├─ 对比 baseline, 确认遗忘可控
  └─ 交接给后训练团队
```

## 常见踩坑与经验

| 踩坑 | 症状 | 解决方案 |
|------|------|---------|
| 学习率太高 | 前 1000 步 MMLU 下降 > 5% | 降 LR 到 peak 的 5-10% |
| Replay 数据太少 | 通用能力持续退化 | Replay 比例提到 30-50% |
| 数据质量不均 | 特定域 loss 不降 | 检查该域数据质量，做清洗 |
| 序列长度突变 | Loss spike | 分阶段渐进扩展 |
| 退火缺失 | 最终 eval 不稳定 | 添加退火阶段，用最优数据 |
| 评估频率太低 | 遗忘发现太晚无法补救 | 每 500 步 eval 一次 |
| Tokenizer 不匹配 | 中文/代码 token 效率低 | 扩展词表后再中训练 |

> **最重要的一条建议**：中训练是一个需要**频繁评估和快速迭代**的过程。不要在配比确定之前就启动大规模训练——用 5% 的预算做配比搜索，可以让剩下的 95% 预算效果翻倍。

---

> **下一章预告**：训练一个大模型不仅需要好的配方，还需要强大的分布式训练系统。第八章我们将深入分布式训练工程——数据并行、模型并行、流水线并行，以及如何在数千张 GPU 上高效训练。
