---
title: "大模型训练中的数据配比调优指南"
description: "如何科学地确定预训练和中训练阶段的数据配比，包含实验方法论、经验公式和案例分析。"
date: 2026-03-15
category: "教程指南"
tags: ["数据配比", "预训练", "中训练", "调优", "Data Mix"]
---

## 为什么数据配比如此重要？

在相同的总训练 token 数下，不同的数据配比可以导致模型性能的巨大差异。一个直观的例子：

假设你有 1T tokens 的预算，以下两种配比训出的模型表现可能天差地别：

| 配比方案 | 英文 Web | 代码 | 数学 | MMLU | HumanEval | GSM8K |
|----------|---------|------|------|------|-----------|-------|
| 方案 A | 80% | 10% | 10% | 63.2 | 28.5 | 42.1 |
| 方案 B | 55% | 30% | 15% | 61.8 | 45.2 | 58.7 |

方案 B 牺牲了 1.4% 的 MMLU，但 HumanEval 提升 16.7%，GSM8K 提升 16.6%——这就是配比的力量。

## 数据配比的核心原则

### 原则 1: 目标驱动

**先明确你的模型要优化什么能力，再倒推数据需求。**

```
目标：通用聊天助手
→ 重点：英文通用、中文通用、代码基础、指令跟随
→ 配比倾向：英文 45%, 中文 25%, 代码 15%, 其他 15%

目标：代码助手
→ 重点：代码质量、多语言编程、代码理解
→ 配比倾向：代码 50%, 英文技术 20%, 中文技术 15%, 其他 15%

目标：科研助手
→ 重点：论文理解、数学推理、多语言学术
→ 配比倾向：学术文本 30%, 英文 25%, 代码 15%, 数学 15%, 中文 15%
```

### 原则 2: 数据源之间存在正向迁移

不同数据源的训练效果不是独立的，存在复杂的交互关系：

**正向迁移（verified）**：
- 代码训练 → 提升逻辑推理和数学能力
- 英文高质量文本 → 一定程度提升其他语言能力
- 数学训练 → 提升结构化推理能力
- 百科知识 → 提升事实问答能力

**负向迁移（需注意）**：
- 过多低质量 Web 文本 → 降低生成质量
- 过多代码 → 回复倾向于代码风格
- 过多特定语言 → 其他语言能力退化

### 原则 3: 边际收益递减

每种数据源都存在边际收益递减点。例如，代码数据从 0% 增加到 15% 时提升显著，但从 30% 增加到 45% 时提升明显减小。

## 实验方法论

### 方法 1: Proxy Model 实验

**核心思想**：用小模型快速验证配比，再应用到大模型。

```
设计配比方案 × 5-10 种
    ↓
训练 1B 模型 × 10B tokens (每个方案约 2-4 GPU·hours)
    ↓
在关键 benchmark 上评估
    ↓
选出 top-3 方案
    ↓
训练 7B 模型 × 30B tokens 验证 (每个方案约 200 GPU·hours)
    ↓
确定最终配比
    ↓
应用到目标模型
```

这种方法的假设是：**小模型上的配比趋势与大模型基本一致**。这在大多数情况下成立，但有时小模型上的最优配比与大模型会有偏差。

### 方法 2: DoReMi 风格的自动搜索

DoReMi 的核心思路：训练一个"参考模型"来指导数据权重的分配。

```python
# DoReMi 简化流程
def doremi_search(
    data_sources: dict[str, Dataset],
    proxy_model_config: dict,
    reference_model_config: dict,
    target_loss_by_domain: dict[str, float] = None,
):
    """
    1. 训练参考模型（均匀配比或某个初始配比）
    2. 计算每个数据源的"超额 loss"
    3. 根据超额 loss 调整权重
    4. 重复迭代
    """
    # 初始化均匀权重
    weights = {name: 1.0/len(data_sources) for name in data_sources}
    
    for iteration in range(max_iterations):
        # 用当前权重训练 proxy model
        proxy_model = train_proxy(data_sources, weights)
        
        # 计算每个源的 loss
        domain_losses = {}
        for name, dataset in data_sources.items():
            loss = evaluate_loss(proxy_model, dataset)
            domain_losses[name] = loss
        
        # 计算参考 loss（用参考模型）
        ref_losses = {}
        for name, dataset in data_sources.items():
            ref_losses[name] = evaluate_loss(reference_model, dataset)
        
        # 更新权重：loss 差距越大的源，权重越高
        for name in data_sources:
            excess_loss = domain_losses[name] - ref_losses[name]
            weights[name] *= math.exp(step_size * excess_loss)
        
        # 归一化
        total = sum(weights.values())
        weights = {k: v/total for k, v in weights.items()}
    
    return weights
```

### 方法 3: Data Mixing Laws (Yi-style)

基于幂律模型拟合数据配比与性能的关系：

```python
# Data Mixing Laws 实验设计
import itertools
import numpy as np
from scipy.optimize import curve_fit

# 1. 定义搜索空间
data_sources = ["web_en", "web_zh", "code", "math", "academic"]
N_SOURCES = len(data_sources)

# 2. 生成配比网格（Dirichlet 采样）
def sample_mixing_ratios(n_samples: int = 50, n_sources: int = 5):
    """用 Dirichlet 分布均匀采样配比"""
    # alpha=1 给出均匀分布
    ratios = np.random.dirichlet(np.ones(n_sources), size=n_samples)
    return ratios

# 3. 训练 proxy models
ratios = sample_mixing_ratios(50)
results = []
for i, ratio in enumerate(ratios):
    config = dict(zip(data_sources, ratio))
    # 训练 1B 模型 × 10B tokens
    scores = train_and_evaluate(config)
    results.append({"ratio": config, "scores": scores})

# 4. 拟合 mixing law
def mixing_law(ratios, *params):
    """
    L(p) = Σ c_i * p_i^(-α_i) + Σ_{i≠j} d_ij * p_i^β_i * p_j^β_j
    简化为线性交互项：
    L(p) = Σ c_i * p_i^(-α_i) + Σ_{i<j} d_ij * (p_i * p_j)^γ_ij
    """
    # ... 拟合实现
    pass

# 5. 在拟合的 law 上搜索最优配比
from scipy.optimize import minimize

def objective(ratios):
    """最小化目标 benchmark 的预测 loss"""
    return mixing_law(ratios, *fitted_params)

# 约束：所有比例和为 1，每个比例 >= 0.01
constraints = [
    {"type": "eq", "fun": lambda x: sum(x) - 1},
]
bounds = [(0.01, 0.8)] * N_SOURCES

result = minimize(objective, x0=np.ones(N_SOURCES)/N_SOURCES,
                 method='SLSQP', bounds=bounds, constraints=constraints)
optimal_ratios = dict(zip(data_sources, result.x))
```

## 各大模型的配比参考

### 已公开的配比信息

| 模型 | Web | 代码 | 学术/书籍 | 对话 | 其他 | 来源 |
|------|-----|------|----------|------|------|------|
| LLaMA-1 (65B) | 67% | 4.5% | 4.5% | 2.5% | 21.5% | 论文 |
| LLaMA-2 (70B) | ~80% | ~5% | ~5% | ~1% | ~9% | 估算 |
| LLaMA-3 (405B) | ~50% | ~25% | ~7% | ~3% | ~15% | 技术报告 |
| Qwen-2 (72B) | ~50% | ~20% | ~10% | ~5% | ~15% | 估算 |
| DeepSeek-V3 | ~40% | ~25% | ~15% | ~5% | ~15% | 技术报告 |

**趋势观察**：
- 代码比例逐年增加（4.5% → 25%）
- 高质量筛选后的 Web 数据占比下降
- 学术/书籍数据比例保持稳定
- 对话/指令数据开始加入预训练

### LLaMA-3 的配比策略分析

LLaMA-3 的配比值得深入分析，因为它的代码比例高达 ~25%，远超之前版本：

**代码数据的比例变化与影响**：

```
LLaMA-1: 4.5% 代码 → HumanEval 23.7%
LLaMA-2: ~5% 代码  → HumanEval 29.9%
LLaMA-3: ~25% 代码 → HumanEval 84.1%
```

代码比例翻了 5 倍，HumanEval 提升了 54.2 个百分点。当然这不全是配比的功劳（模型更大、训练更多 tokens、数据质量更好），但配比是核心因素之一。

## 中训练的配比特殊考量

中训练的配比与预训练有本质不同：**需要同时优化新能力的获取和旧能力的保持。**

### 配比框架

```
中训练配比 = 目标数据 × (1 - 回放比例) + 回放数据 × 回放比例

其中回放数据本身也有配比：
回放数据 = 通用Web × α + 代码 × β + 学术 × γ + ...
```

### 配比实验模板

```yaml
# 以"注入中文能力"为例的配比实验设计
experiments:
  - name: "exp-01-baseline"
    description: "30% 回放"
    mix:
      zh_web: 0.45
      zh_books: 0.15
      zh_wiki: 0.10
      replay_en_web: 0.15
      replay_code: 0.10
      replay_academic: 0.05
    
  - name: "exp-02-more-replay"
    description: "50% 回放"
    mix:
      zh_web: 0.30
      zh_books: 0.10
      zh_wiki: 0.10
      replay_en_web: 0.25
      replay_code: 0.15
      replay_academic: 0.10
    
  - name: "exp-03-quality-focus"
    description: "重质量轻数量"
    mix:
      zh_web_highq: 0.25  # 只用高质量筛选后的 Web
      zh_books: 0.20
      zh_wiki: 0.15
      replay_en_web: 0.20
      replay_code: 0.10
      replay_academic: 0.10
```

### 动态配比 (Curriculum-style)

更高级的做法是在训练过程中动态调整配比：

```python
def get_dynamic_ratio(step: int, total_steps: int) -> dict:
    """
    训练初期：更多通用数据，帮助平稳过渡
    训练中期：增加目标数据比例
    训练后期：高质量数据为主，进入精化阶段
    """
    progress = step / total_steps
    
    if progress < 0.1:  # 前 10%：warmup 阶段
        return {
            "target": 0.30,
            "replay": 0.50,
            "high_quality": 0.20,
        }
    elif progress < 0.8:  # 中间 70%：主训练阶段
        return {
            "target": 0.50,
            "replay": 0.30,
            "high_quality": 0.20,
        }
    else:  # 最后 20%：精化阶段
        return {
            "target": 0.30,
            "replay": 0.20,
            "high_quality": 0.50,
        }
```

## 调优实操步骤

### Step 1: 确定数据源和预算

```python
# 盘点可用数据
available_data = {
    "web_en":      {"tokens": "5T",   "quality": "medium"},
    "web_zh":      {"tokens": "800B", "quality": "medium"},
    "code":        {"tokens": "1T",   "quality": "high"},
    "math":        {"tokens": "50B",  "quality": "high"},
    "academic_en": {"tokens": "200B", "quality": "very_high"},
    "academic_zh": {"tokens": "30B",  "quality": "high"},
    "wiki_en":     {"tokens": "5B",   "quality": "very_high"},
    "wiki_zh":     {"tokens": "2B",   "quality": "very_high"},
    "books":       {"tokens": "100B", "quality": "high"},
}

training_budget = "2T tokens"
target_benchmarks = ["MMLU", "C-Eval", "HumanEval", "GSM8K", "MATH"]
```

### Step 2: 设计配比候选方案

基于经验和文献，设计 5-10 个候选方案：

```python
candidates = {
    "balanced": {
        "web_en": 0.40, "web_zh": 0.15, "code": 0.20,
        "math": 0.05, "academic": 0.10, "wiki": 0.02,
        "books": 0.08,
    },
    "code_heavy": {
        "web_en": 0.30, "web_zh": 0.10, "code": 0.35,
        "math": 0.08, "academic": 0.08, "wiki": 0.02,
        "books": 0.07,
    },
    "chinese_focus": {
        "web_en": 0.25, "web_zh": 0.30, "code": 0.15,
        "math": 0.05, "academic": 0.10, "wiki": 0.03,
        "books": 0.12,
    },
    "quality_first": {
        "web_en": 0.20, "web_zh": 0.10, "code": 0.20,
        "math": 0.10, "academic": 0.20, "wiki": 0.05,
        "books": 0.15,
    },
}
```

### Step 3: Proxy 实验

```bash
# 用 1B 模型跑每个配比方案
for config in balanced code_heavy chinese_focus quality_first; do
    python train.py \
        --model-size 1b \
        --tokens 10b \
        --data-mix configs/${config}.yaml \
        --output checkpoints/${config}/ \
        --eval-benchmarks mmlu,ceval,humaneval,gsm8k
done
```

### Step 4: 分析结果并微调

```python
# 分析 proxy 实验结果
results = load_experiment_results()

# 绘制雷达图对比各方案
plot_radar_chart(results, metrics=target_benchmarks)

# 基于结果微调配比
# 例如：balanced 方案整体最好，但数学偏弱
# → 创建 "balanced_v2"，增加 math 比例
refined = {
    "balanced_v2": {
        "web_en": 0.38, "web_zh": 0.14, "code": 0.18,
        "math": 0.10, "academic": 0.10, "wiki": 0.02,
        "books": 0.08,
    },
}
```

### Step 5: 大模型验证

```bash
# 用目标模型规模验证 top-2 方案
python train.py \
    --model-size 7b \
    --tokens 50b \
    --data-mix configs/balanced_v2.yaml \
    --output checkpoints/7b_balanced_v2/
```

## 常见误区

### 误区 1: "数据越多越好"

**事实**：数据量增加到一定程度后，质量比数量重要得多。FineWeb-Edu 用 1.3T tokens（经过严格筛选）训出的模型优于用 15T tokens（宽松筛选）训出的模型。

### 误区 2: "配比确定后就不用改了"

**事实**：最优配比随训练阶段变化。训练初期适合更多通用数据，后期适合更多高质量/专业数据。

### 误区 3: "小模型实验可以完全迁移到大模型"

**事实**：大部分趋势可以迁移，但最优点可能有偏移。通常大模型对数据质量更敏感，对配比变化更鲁棒。

### 误区 4: "代码数据只影响编程能力"

**事实**：代码训练被广泛观察到能提升逻辑推理和数学能力。LLaMA-3 的代码比例增加到 25% 后，不仅 HumanEval 大幅提升，GSM8K 也有明显提升。

## 实战案例：构建中英双语通用模型的配比

### 目标
- 7B 参数量
- 2T tokens 训练预算
- 中英双语同等重要
- 保持代码和数学能力

### 最终配比（经过 3 轮 proxy 实验确定）

```yaml
final_mix:
  # 英文 (50%)
  en_web_highq: 0.30    # 高质量筛选的英文 Web
  en_academic: 0.10     # 学术论文 + 教科书
  en_wiki: 0.02         # Wikipedia
  en_books: 0.08        # 开源书籍
  
  # 中文 (25%)
  zh_web_highq: 0.15    # 高质量中文 Web
  zh_academic: 0.05     # 中文学术 + 教材
  zh_wiki: 0.01         # 中文维基
  zh_books: 0.04        # 中文书籍
  
  # 代码 (15%)
  code_python: 0.06     # Python (最高权重)
  code_js: 0.03         # JavaScript
  code_other: 0.06      # Java/C++/Go/Rust 等
  
  # 数学 (7%)
  math_textbook: 0.03   # 数学教材
  math_problems: 0.02   # 数学题库
  math_code: 0.02       # 数学相关代码
  
  # 其他 (3%)
  multilingual: 0.02    # 其他语言
  misc: 0.01            # 杂项高质量数据

# 训练课程
curriculum:
  phase1:  # 0-20%
    upweight: [en_web_highq, zh_web_highq]
    factor: 1.2
  phase2:  # 20-80%
    # 使用标准配比
  phase3:  # 80-100%
    upweight: [en_academic, zh_academic, math_textbook]
    factor: 1.5
    downweight: [en_web_highq, zh_web_highq]
    factor: 0.7
```

### 实验结果

| Benchmark | 均匀配比 | 最终配比 | 提升 |
|-----------|---------|---------|------|
| MMLU | 58.2 | 62.1 | +3.9 |
| C-Eval | 50.1 | 57.8 | +7.7 |
| HumanEval | 35.4 | 42.1 | +6.7 |
| GSM8K | 38.6 | 48.3 | +9.7 |
| MATH | 12.1 | 18.5 | +6.4 |

通过系统的配比优化，在相同训练预算下获得了**平均 6.9 个百分点的提升**。
