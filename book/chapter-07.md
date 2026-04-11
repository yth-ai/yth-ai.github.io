# 第 7 章：预训练数据的评估与迭代

> *"You can't improve what you can't measure."*
> *——Peter Drucker*
>
> 在数据工程中，这句话需要补充一个前提：**你还得知道该测什么。**

---

## 7.1 如何知道你的数据好不好？

### 训练 Loss 不等于数据质量

这是一个需要反复强调的认知：**预训练 loss 的下降不代表数据质量好。**

训练 loss 本质上衡量的是模型对当前数据分布的拟合程度。如果你的训练数据充斥着重复的模板化内容（比如电商网站的千篇一律的产品描述），模型的 loss 会下降得很漂亮——因为这些数据的熵很低，容易预测。但这样训练出的模型在开放式生成任务上会表现得索然无味。

反过来，如果你的数据多样性极高、包含大量专业领域的低频知识，训练 loss 可能下降得很慢，但模型的下游表现可能非常好。

因此，评估数据质量需要跳出"盯着 loss 曲线"的思维定式，建立一套多维度的评估体系。

### 认知演变

> **数据评估的认知演变**
> - 2020：GPT-3 时代——"loss 在降就行了"
> - 2021-2022："在下游 benchmark 上测一测"（但测完发现 benchmark 泄露了）
> - 2023：DCLM 提出系统化的 data ablation 方法论——"用小模型快速验证数据管线"
> - 2024：FineWeb 展示了完整的"数据管线 → 小模型训练 → 评估 → 迭代"闭环
> - 2025-2026：学界开始质疑小模型代理的可靠性（arXiv: 2512.24503），同时出现了可扩展的模块化消融方法

---

## 7.2 小模型快速验证法

### 核心思路

大模型预训练动辄需要数千到数万 GPU·小时。你不可能每次调整一个过滤阈值就重新跑一遍完整训练。因此，业界广泛采用"小模型代理"方案：用一个参数量小得多的模型（通常 400M-1.5B）在你的数据上快速训练，然后评估这个小模型的表现来间接判断数据质量。

**基本流程：**

```
数据管线 A  ──→  训练 400M 模型  ──→  在 proxy benchmark 上评估
                                          ↓
数据管线 B  ──→  训练 400M 模型  ──→  在 proxy benchmark 上评估
                                          ↓
                                    比较 A vs B，选优
                                          ↓
                                  用最优管线训练大模型
```

FineWeb 团队正是用这种方法系统化地优化了他们的数据管线。他们训练了超过几十个 1.8B 参数的模型，每个模型训练 28B token（大约需要几天时间），然后在一组精心挑选的 benchmark 上比较不同数据管线的效果。

### 实操：搭建一个小模型验证流程

```python
"""
小模型快速验证框架
用于对比不同数据管线的效果
"""

import json
from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime

@dataclass
class DataPipelineConfig:
    """数据管线配置"""
    name: str
    description: str
    # 关键参数
    text_extractor: str = "trafilatura"       # 提取器
    lang_threshold: float = 0.65              # 语言识别阈值
    min_doc_length: int = 200                 # 最短文档长度
    max_doc_length: int = 100000              # 最长文档长度
    dedup_threshold: float = 0.8              # 去重阈值
    quality_filter: str = "fasttext"          # 质量分类器
    quality_threshold: float = 0.5            # 质量阈值
    # 配比
    domain_weights: Dict[str, float] = field(default_factory=lambda: {
        "web": 0.65, "code": 0.15, "academic": 0.10,
        "books": 0.05, "math": 0.05
    })

@dataclass
class AblationExperiment:
    """消融实验配置"""
    pipeline_config: DataPipelineConfig
    model_size: str = "400M"           # 代理模型大小
    training_tokens: str = "10B"       # 训练 token 数
    eval_benchmarks: List[str] = field(default_factory=lambda: [
        "hellaswag", "arc_challenge", "winogrande",
        "piqa", "mmlu_5shot", "ceval"
    ])

def design_ablation_matrix(base_config: DataPipelineConfig) -> List[AblationExperiment]:
    """
    设计消融实验矩阵
    核心原则：每次只变一个变量
    """
    experiments = []

    # 基准实验
    experiments.append(AblationExperiment(
        pipeline_config=base_config
    ))

    # 变量 1：语言识别阈值
    for threshold in [0.5, 0.6, 0.7, 0.8]:
        config = DataPipelineConfig(
            **{**base_config.__dict__,
               "name": f"lang_threshold_{threshold}",
               "lang_threshold": threshold}
        )
        experiments.append(AblationExperiment(pipeline_config=config))

    # 变量 2：质量过滤阈值
    for threshold in [0.3, 0.5, 0.7, 0.9]:
        config = DataPipelineConfig(
            **{**base_config.__dict__,
               "name": f"quality_threshold_{threshold}",
               "quality_threshold": threshold}
        )
        experiments.append(AblationExperiment(pipeline_config=config))

    # 变量 3：去重阈值
    for threshold in [0.7, 0.8, 0.9, 1.0]:
        config = DataPipelineConfig(
            **{**base_config.__dict__,
               "name": f"dedup_threshold_{threshold}",
               "dedup_threshold": threshold}
        )
        experiments.append(AblationExperiment(pipeline_config=config))

    return experiments

def analyze_results(results: Dict[str, Dict[str, float]]) -> str:
    """
    分析消融实验结果
    results: {experiment_name: {benchmark: score}}
    """
    report = []
    report.append("=" * 60)
    report.append("消融实验结果分析")
    report.append("=" * 60)

    # 找到基准
    baseline = results.get("baseline", {})
    if not baseline:
        return "Error: no baseline found"

    for exp_name, scores in results.items():
        if exp_name == "baseline":
            continue

        # 计算每个 benchmark 相对基准的变化
        deltas = {}
        for bench, score in scores.items():
            if bench in baseline:
                delta = score - baseline[bench]
                deltas[bench] = delta

        avg_delta = sum(deltas.values()) / len(deltas) if deltas else 0
        report.append(f"\n{exp_name}: avg delta = {avg_delta:+.2f}%")
        for bench, delta in sorted(deltas.items(), key=lambda x: abs(x[1]), reverse=True):
            direction = "↑" if delta > 0 else "↓"
            report.append(f"  {bench}: {delta:+.2f}% {direction}")

    return "\n".join(report)
```

### 小模型代理的可靠性问题

2025 年底，一篇引发广泛讨论的论文《Can Small Training Runs Reliably Guide Data Curation?》（arXiv: 2512.24503）对小模型代理方法提出了系统性质疑。

研究者的核心发现是：**在 400M 到 1.5B 的代理模型上，不同数据管线的排名在不同的随机种子下并不稳定。** 具体来说：

- 用 3 个随机种子训练同一管线的小模型，benchmark 分数的方差可以达到 ±1.5%
- 而两个竞争管线之间的差距往往只有 0.5-2%
- 这意味着你可能会因为随机波动而选错管线

**应对策略：**

1. **多种子训练**：每个管线至少跑 3 个随机种子，报告均值和方差
2. **多 benchmark 交叉验证**：不要只看一个 benchmark 的排名
3. **增大代理模型**：如果预算允许，用 1.5B 比 400M 更可靠
4. **关注大幅差异**：只有在差距超过 2-3% 时才做决策
5. **模块化消融**：2024 年 EMNLP 的工作提出了一种"训练后合并"的方法，让消融实验的成本从指数级变成线性级

> **💡 反直觉发现**
>
> 小模型代理法并不像看起来那么可靠。一个在 400M 模型上"赢了"0.8% 的数据管线，放到 70B 模型上可能反而差了 0.3%。原因在于小模型和大模型对数据的"口味"不完全一致——大模型对数据多样性的需求更高，而小模型可能更偏好低熵、模式明确的数据。

---

## 7.3 数据消融实验的设计方法

### 控制变量法

数据消融的核心是**控制变量**：在其他条件不变的前提下，改变一个数据管线参数，观察其对模型表现的影响。

**常见的消融维度：**

| 消融维度 | 典型变量 | 关键观察指标 |
|---------|---------|------------|
| 提取器选择 | trafilatura vs resiliparse vs jusText | 文档质量、信息保留率 |
| 语言过滤阈值 | 0.5 → 0.6 → 0.7 → 0.8 | 数据量 vs 语言纯度 |
| 质量分类器 | 无过滤 / fastText / LLM 打分 | benchmark 分数变化 |
| 质量阈值 | 保留 top-10% / 30% / 50% / 80% | 质量-多样性权衡 |
| 去重粒度 | 文档级 / 段落级 / 仅精确去重 | 去重率 vs 多样性损失 |
| 领域配比 | web 50-80% / code 10-30% / math 5-15% | 各能力维度分数 |

### 分层消融 vs 全因子消融

在消融实验设计中，一个常见的误区是试图做"全因子设计"——如果你有 5 个维度，每个维度 4 个选项，那就是 4^5 = 1024 个实验。这在大模型数据工程中完全不现实。

**推荐的分层消融策略：**

```
第 1 轮：粗筛（每个维度 2-3 个选项，单独消融）
   → 确定每个维度的大致最优范围

第 2 轮：交互实验（选择最可能存在交互效应的 2-3 个维度，组合消融）
   → 发现维度间的交互效应

第 3 轮：精调（在最优范围内细粒度搜索）
   → 确定最终参数
```

### 可扩展的模块化消融方法

2024 年 EMNLP 上发表的《Scalable Data Ablation Approximations》提出了一种创新方法：

**核心思路：**
1. 将训练数据分成 N 个独立的"模块"（module），每个模块大约 1-5B token
2. 每个模块独立训练一个小模型
3. 通过权重合并（weight merging）来近似"在组合数据上训练"的效果

**优势：**
- 新增一个数据模块，只需要训练一个新的小模型，然后与已有模型合并
- 成本从 O(2^N) 降到 O(N)，是线性增长而非指数增长
- 已有模块的训练结果可以复用

**限制：**
- 权重合并只是近似，对于强交互效应可能不准确
- 在模块数量很多时，合并效果会退化
- 目前主要在 1B 以下模型上验证过

---

## 7.4 数据统计与可视化

### 数据分布 Dashboard

在正式训练之前，你需要对数据的全貌有清晰的了解。一个好的数据 dashboard 应该覆盖以下维度：

**1. 语言分布**

```python
"""
数据语言分布统计与可视化
"""

from collections import Counter
from typing import List, Tuple

def analyze_language_distribution(
    lang_labels: List[str],
    lang_scores: List[float],
    target_distribution: dict = None
) -> dict:
    """
    分析语言分布并与目标分布对比
    """
    # 统计实际分布
    total = len(lang_labels)
    actual_dist = Counter(lang_labels)
    actual_pct = {lang: count / total * 100
                  for lang, count in actual_dist.most_common(20)}

    report = {
        "total_documents": total,
        "unique_languages": len(actual_dist),
        "top_20_languages": actual_pct,
    }

    # 与目标分布对比
    if target_distribution:
        gaps = {}
        for lang, target_pct in target_distribution.items():
            actual = actual_pct.get(lang, 0)
            gap = actual - target_pct
            gaps[lang] = {
                "target": target_pct,
                "actual": round(actual, 2),
                "gap": round(gap, 2),
                "status": "✅" if abs(gap) < 2 else ("⚠️" if abs(gap) < 5 else "❌")
            }
        report["distribution_gaps"] = gaps

    # 低置信度文档比例
    low_confidence = sum(1 for s in lang_scores if s < 0.8) / total * 100
    report["low_confidence_pct"] = round(low_confidence, 2)

    return report
```

**2. 文档长度分布**

长度分布是数据质量的重要晴雨表。典型的健康分布应该呈对数正态分布，如果出现异常的双峰或长尾，往往暗示着数据问题。

```python
import numpy as np

def analyze_length_distribution(
    lengths: List[int],  # 每篇文档的 token 数
    bins: int = 50
) -> dict:
    """
    分析文档长度分布
    """
    lengths = np.array(lengths)

    stats = {
        "count": len(lengths),
        "mean": float(np.mean(lengths)),
        "median": float(np.median(lengths)),
        "std": float(np.std(lengths)),
        "min": int(np.min(lengths)),
        "max": int(np.max(lengths)),
        "p10": float(np.percentile(lengths, 10)),
        "p90": float(np.percentile(lengths, 90)),
        "p99": float(np.percentile(lengths, 99)),
    }

    # 异常检测
    # 1. 极短文档比例（可能是提取失败）
    very_short = (lengths < 50).sum() / len(lengths) * 100
    stats["very_short_pct"] = round(very_short, 2)

    # 2. 极长文档比例（可能是拼接错误）
    very_long = (lengths > 50000).sum() / len(lengths) * 100
    stats["very_long_pct"] = round(very_long, 2)

    # 3. 可疑的"精确长度"聚集（可能是截断或模板）
    length_counts = Counter(lengths)
    suspicious_peaks = [
        (length, count) for length, count in length_counts.most_common(20)
        if count > len(lengths) * 0.01  # 超过 1% 的文档长度完全相同
    ]
    stats["suspicious_length_peaks"] = suspicious_peaks

    return stats
```

**3. 质量分数分布**

```python
def analyze_quality_distribution(
    quality_scores: List[float],
    labels: List[str] = None  # 可选：每篇文档的领域标签
) -> dict:
    """
    分析质量分数分布
    """
    scores = np.array(quality_scores)

    overall = {
        "mean": float(np.mean(scores)),
        "median": float(np.median(scores)),
        "std": float(np.std(scores)),
        "below_0.3": float((scores < 0.3).sum() / len(scores) * 100),
        "between_0.3_0.7": float(((scores >= 0.3) & (scores < 0.7)).sum() / len(scores) * 100),
        "above_0.7": float((scores >= 0.7).sum() / len(scores) * 100),
    }

    # 按领域细分
    if labels:
        by_domain = {}
        for label in set(labels):
            domain_scores = [s for s, l in zip(quality_scores, labels) if l == label]
            by_domain[label] = {
                "count": len(domain_scores),
                "mean": round(np.mean(domain_scores), 3),
                "median": round(np.median(domain_scores), 3),
            }
        overall["by_domain"] = by_domain

    return overall
```

**4. 重复率统计**

```python
def analyze_duplication_stats(
    docs: List[str],
    n_gram_size: int = 5,
    sample_size: int = 10000
) -> dict:
    """
    快速评估数据集的重复程度
    通过采样 + n-gram 统计实现
    """
    import random
    from collections import Counter

    # 采样
    if len(docs) > sample_size:
        sample = random.sample(docs, sample_size)
    else:
        sample = docs

    # 文档级精确重复
    doc_hashes = Counter()
    for doc in sample:
        doc_hash = hash(doc.strip())
        doc_hashes[doc_hash] += 1
    exact_dup_rate = sum(c - 1 for c in doc_hashes.values() if c > 1) / len(sample) * 100

    # N-gram 重复率
    all_ngrams = Counter()
    for doc in sample:
        tokens = doc.split()
        for i in range(len(tokens) - n_gram_size + 1):
            ngram = tuple(tokens[i:i + n_gram_size])
            all_ngrams[ngram] += 1

    total_ngrams = sum(all_ngrams.values())
    unique_ngrams = len(all_ngrams)
    ngram_dup_rate = (1 - unique_ngrams / total_ngrams) * 100 if total_ngrams > 0 else 0

    return {
        "exact_document_dup_rate": round(exact_dup_rate, 2),
        f"{n_gram_size}-gram_dup_rate": round(ngram_dup_rate, 2),
        "unique_ngram_ratio": round(unique_ngrams / total_ngrams, 4) if total_ngrams > 0 else 0,
        "total_ngrams_sampled": total_ngrams,
        "sample_size": len(sample),
    }
```

### 异常检测：数据管线中的质量监控点

一条成熟的数据管线应该在关键节点设置质量监控。以下是推荐的监控点和对应的异常检测规则：

| 管线阶段 | 监控指标 | 正常范围 | 异常信号 |
|---------|---------|---------|---------|
| 爬取/下载 | 下载成功率 | >95% | 某个 CC 快照成功率骤降 |
| HTML 提取 | 空文档比例 | <5% | 提取器对某类网页失效 |
| 语言识别 | 低置信度比例 | <15% | 混合语言页面增多 |
| 启发式过滤 | 过滤掉的比例 | 30-60% | 过低=过滤太松，过高=过滤太严 |
| 去重 | 去重率 | 20-40% | 过高=数据源重复度大 |
| 质量过滤 | 保留比例 | 20-50% | 分布发生显著漂移 |
| 最终数据集 | 平均文档长度 | 500-3000 tokens | 突然变短/变长 |

---

## 7.5 基于下游任务的评估

### 选择合适的 Proxy Benchmark

不是所有 benchmark 都适合用来评估数据质量。好的 proxy benchmark 应该满足：

1. **对数据变化敏感**：数据管线的微调能在该 benchmark 上体现出差异
2. **评估稳定**：多次运行结果波动小
3. **覆盖多能力维度**：不偏向某个特定领域
4. **不容易被"刷"**：对过拟合有一定抵抗力

**FineWeb 团队的 benchmark 组合（经过实践验证）：**

| Benchmark | 评估能力 | 数据敏感度 | 稳定性 |
|-----------|---------|-----------|-------|
| HellaSwag | 常识推理 | 高 | 高 |
| ARC-Challenge | 科学推理 | 高 | 中 |
| WinoGrande | 语义理解 | 中 | 中 |
| PIQA | 物理直觉 | 中 | 高 |
| MMLU (5-shot) | 知识广度 | 中 | 中 |
| OpenBookQA | 开放知识推理 | 高 | 中 |

**对于中文场景，建议加入：**

| Benchmark | 评估能力 | 备注 |
|-----------|---------|------|
| C-Eval | 中文知识广度 | 类似中文 MMLU |
| CMMLU | 中文多学科 | 覆盖更广 |
| CLUE-WSC | 中文指代消解 | 中文语言理解 |

### 评估集与训练数据的隔离

这是一个看似显然但实际上经常被忽视的问题：**你的评估结果可靠的前提是评估数据没有出现在训练集中。**

Benchmark 数据泄露（data contamination）已经成为 LLM 评估中最头疼的问题之一。2024-2025 年间，大量研究揭示了泄露的普遍性和严重性：

- GPT-4 的论文中承认部分 benchmark 数据可能存在于训练集中
- 有研究发现，在某些模型上，被污染的 benchmark 子集上的分数比未污染的高出 5-15%
- 即使做了"去污染"处理，也不能保证完全干净——因为 benchmark 的变体、改述版本可能通过其他渠道进入训练集

**去污染（Decontamination）的方法：**

```python
"""
训练数据去污染检测
在数据管线的最后阶段运行，确保评测集不泄露到训练集
"""

from typing import List, Set, Tuple
import hashlib

class DecontaminationChecker:
    """
    多层次去污染检测器
    """
    def __init__(self, benchmark_data: List[str], ngram_size: int = 13):
        self.ngram_size = ngram_size
        # 构建 benchmark 的 n-gram 索引
        self.benchmark_ngrams: Set[str] = set()
        self.benchmark_hashes: Set[str] = set()

        for item in benchmark_data:
            # 精确匹配
            self.benchmark_hashes.add(
                hashlib.sha256(item.strip().encode()).hexdigest()
            )
            # N-gram 匹配
            tokens = item.lower().split()
            for i in range(len(tokens) - ngram_size + 1):
                ngram = " ".join(tokens[i:i + ngram_size])
                self.benchmark_ngrams.add(ngram)

    def check_document(self, doc: str) -> dict:
        """
        检查单个文档是否包含 benchmark 数据
        返回 contamination 报告
        """
        result = {
            "exact_match": False,
            "ngram_overlap_count": 0,
            "ngram_overlap_ratio": 0.0,
            "is_contaminated": False,
        }

        # 层次 1：精确匹配
        doc_hash = hashlib.sha256(doc.strip().encode()).hexdigest()
        if doc_hash in self.benchmark_hashes:
            result["exact_match"] = True
            result["is_contaminated"] = True
            return result

        # 层次 2：N-gram 重叠
        tokens = doc.lower().split()
        total_ngrams = max(1, len(tokens) - self.ngram_size + 1)
        overlap_count = 0

        for i in range(total_ngrams):
            ngram = " ".join(tokens[i:i + self.ngram_size])
            if ngram in self.benchmark_ngrams:
                overlap_count += 1

        overlap_ratio = overlap_count / total_ngrams
        result["ngram_overlap_count"] = overlap_count
        result["ngram_overlap_ratio"] = round(overlap_ratio, 4)

        # 阈值判定：超过 70% 的 13-gram 重叠视为污染
        # 这个阈值参考了 GPT-3 论文和 Llama 的做法
        if overlap_ratio > 0.7:
            result["is_contaminated"] = True

        return result

    def check_dataset(self, docs: List[str]) -> dict:
        """
        检查整个数据集的污染情况
        """
        total = len(docs)
        contaminated_count = 0
        contaminated_indices = []

        for i, doc in enumerate(docs):
            result = self.check_document(doc)
            if result["is_contaminated"]:
                contaminated_count += 1
                contaminated_indices.append(i)

        return {
            "total_documents": total,
            "contaminated_documents": contaminated_count,
            "contamination_rate": round(contaminated_count / total * 100, 4),
            "contaminated_indices": contaminated_indices[:100],  # 前 100 个
        }
```

### 快速评估 vs 完整评估的权衡

在数据迭代的不同阶段，评估的粒度应该不同：

**日常开发阶段（快速评估）：**
- 只用 2-3 个对数据敏感的 benchmark（如 HellaSwag + ARC）
- 模型训练到 10B token 就评估
- 耗时：1-2 天
- 精度：能检测出 >2% 的差异

**里程碑阶段（完整评估）：**
- 用 6-10 个 benchmark 全面评估
- 模型训练到 28-50B token
- 增加多种子验证
- 耗时：5-7 天
- 精度：能检测出 ~1% 的差异

**发布前（深度评估）：**
- 完整 benchmark suite + 人工评估
- 在目标规模模型上验证
- 包含安全性和偏见评估
- 耗时：2-4 周

---

## 7.6 数据迭代的闭环

### 发现问题 → 分析原因 → 调整管线 → 验证效果

数据工程不是一锤子买卖。真正的价值在于建立一个**持续迭代**的闭环。

**一个完整的迭代周期：**

```
Step 1: 发现问题
  ├── 训练中发现 loss 异常
  ├── 评估中发现某维度退化
  ├── 人工抽检发现系统性问题
  └── 用户反馈（如果模型已部署）

Step 2: 定位原因
  ├── 数据抽样分析
  ├── 回溯管线日志
  ├── 按维度分桶排查（语言、领域、来源）
  └── 与历史版本对比

Step 3: 调整管线
  ├── 修改过滤规则/阈值
  ├── 增加/移除某个数据源
  ├── 调整配比
  └── 修复 bug

Step 4: 验证效果
  ├── 小模型消融实验
  ├── 人工抽检新数据
  ├── 数据统计对比
  └── 确认无回归
```

### 🔬 显微镜案例：一次数据迭代的完整记录

让我用一个真实案例来展示这个闭环是如何运转的。

**背景**：某团队在训练一个中英双语的 13B 模型，训练进行到 5T token 时，发现模型在数学推理任务上的表现异常低下——比同期的开源模型低了 8 个百分点。

**Step 1: 发现问题**

团队的监控 dashboard 在训练到 4T token 时就发出了预警：GSM8K 的 5-shot 准确率停滞在 32%，而预期应该在 45% 左右。

**Step 2: 定位原因**

```python
# 数据分析过程（简化版）
# 1. 先看数学相关数据的占比
math_data_ratio = count_domain(training_data, "math") / total_tokens
# 结果：2.1%（预期 5%）

# 2. 检查数学数据的质量
math_quality = sample_and_inspect(training_data, domain="math", n=500)
# 发现：大量数学数据来自一个质量较差的来源
# 其中约 30% 的数据包含被截断的 LaTeX 公式

# 3. 回溯管线日志
# 发现：某次管线更新中，数学数据的来源权重被意外修改
# 一个高质量的 arXiv 数学子集被错误地排除了
```

**Step 3: 调整管线**

1. 恢复 arXiv 数学子集
2. 增加数学数据占比从 2.1% 到 5.5%
3. 对数学数据增加 LaTeX 完整性检查
4. 额外混入合成数学题（经过质量验证的）

**Step 4: 验证效果**

在 400M 代理模型上训练 10B token，对比调整前后：

| Benchmark | 调整前 | 调整后 | 变化 |
|-----------|-------|--------|------|
| GSM8K (5-shot) | 12.3% | 16.7% | +4.4% |
| MATH | 4.1% | 6.2% | +2.1% |
| HellaSwag | 58.2% | 57.9% | -0.3% |
| ARC-Challenge | 35.6% | 36.1% | +0.5% |

数学能力显著提升，通用能力无回归。批准上线。

最终在 13B 模型上，GSM8K 分数从 32% 提升到 48%，达到预期目标。

### 数据版本管理

**为什么版本管理很重要？**

当你的数据管线每周都在迭代时，你需要能够：
- 回溯到任意历史版本的数据
- 对比两个版本的差异
- 在不同版本上复现训练结果
- 追踪每条数据的来龙去脉

**推荐的版本管理方案：**

```
方案 1: DVC（Data Version Control）
├── 优点：与 Git 深度集成，学习成本低
├── 缺点：对 PB 级数据的支持较弱
└── 适用：中小规模团队，数据 < 10TB

方案 2: lakeFS
├── 优点：Git-like 分支模型，支持 S3/GCS
├── 缺点：需要额外维护服务
└── 适用：中大规模团队，云原生架构

方案 3: Delta Lake / Iceberg
├── 优点：PB 级数据的高效版本管理
├── 缺点：需要 Spark 生态
└── 适用：大规模团队，已有 data lake 基础设施
```

**最低可行的版本管理实践：**

即使你没有上述工具，也应该至少做到：

```python
"""
最小版本管理方案
用 manifest 文件记录每个版本的数据组成
"""

import json
import hashlib
from datetime import datetime

def create_data_manifest(
    version: str,
    data_sources: dict,
    pipeline_config: dict,
    output_stats: dict,
    notes: str = ""
) -> dict:
    """
    创建数据版本 manifest
    每次数据管线运行后生成
    """
    manifest = {
        "version": version,
        "created_at": datetime.now().isoformat(),
        "data_sources": data_sources,
        # 例如: {"cc_2024_10": {"path": "...", "doc_count": 1000000, "sha256": "..."}, ...}
        "pipeline_config": pipeline_config,
        # 记录所有管线参数
        "output_stats": output_stats,
        # 例如: {"total_tokens": "500B", "total_docs": 50000000, "lang_distribution": {...}}
        "notes": notes,
    }

    # 生成 manifest 自身的 hash
    manifest_str = json.dumps(manifest, sort_keys=True, ensure_ascii=False)
    manifest["manifest_hash"] = hashlib.sha256(manifest_str.encode()).hexdigest()[:16]

    return manifest

# 使用示例
manifest = create_data_manifest(
    version="v2.3",
    data_sources={
        "cc_2024_10": {"doc_count": 500_000_000, "tokens": "2T"},
        "cc_2024_06": {"doc_count": 480_000_000, "tokens": "1.8T"},
        "arxiv_2024": {"doc_count": 2_000_000, "tokens": "50B"},
        "github_code": {"doc_count": 50_000_000, "tokens": "300B"},
    },
    pipeline_config={
        "text_extractor": "trafilatura",
        "lang_threshold": 0.65,
        "dedup_method": "minhash",
        "dedup_threshold": 0.8,
        "quality_filter": "fasttext_edu_v2",
        "quality_threshold": 0.5,
    },
    output_stats={
        "total_tokens": "1.5T",
        "total_docs": 200_000_000,
    },
    notes="修复了数学数据配比问题，arXiv 子集恢复"
)
```

---

## 7.7 构建数据质量监控系统

### 持续监控 vs 一次性检查

数据管线不是搭完就完了。互联网数据在变化，爬取策略在更新，上游数据源在演化。你需要一个**持续运行的监控系统**来捕捉数据质量的漂移。

**监控系统的核心组件：**

```
                    ┌──────────────┐
                    │  数据管线输入  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  阶段性检查点  │
                    │  (每个阶段末)  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
    ┌─────────▼──┐  ┌──────▼─────┐  ┌──▼──────────┐
    │ 统计指标采集 │  │ 异常检测引擎 │  │ 人工抽样队列  │
    └─────────┬──┘  └──────┬─────┘  └──┬──────────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼───────┐
                    │   告警系统    │
                    │  (阈值触发)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Dashboard   │
                    │  (可视化)     │
                    └──────────────┘
```

### 关键监控指标

```python
"""
数据管线监控指标定义
"""

MONITORING_METRICS = {
    # 数量指标
    "input_doc_count": {
        "description": "管线输入文档数",
        "alert_rule": "与上一批次偏差 > 20%",
    },
    "output_doc_count": {
        "description": "管线输出文档数",
        "alert_rule": "与上一批次偏差 > 20%",
    },
    "pass_through_rate": {
        "description": "通过率 = output / input",
        "alert_rule": "< 15% 或 > 80%",
    },

    # 质量指标
    "avg_quality_score": {
        "description": "平均质量分",
        "alert_rule": "较历史均值偏差 > 0.05",
    },
    "quality_score_distribution": {
        "description": "质量分分布",
        "alert_rule": "分布形状发生显著变化（KL 散度 > 0.1）",
    },

    # 分布指标
    "language_distribution": {
        "description": "语言分布",
        "alert_rule": "任一语言占比变化 > 5%",
    },
    "length_distribution": {
        "description": "长度分布",
        "alert_rule": "中位数变化 > 30%",
    },
    "domain_distribution": {
        "description": "领域分布",
        "alert_rule": "任一领域占比变化 > 10%",
    },

    # 管线健康指标
    "processing_time": {
        "description": "处理耗时",
        "alert_rule": "较历史均值慢 > 50%",
    },
    "error_rate": {
        "description": "处理错误率",
        "alert_rule": "> 1%",
    },
}
```

### A/B 测试数据的方法论

当你有两个候选的数据管线，并且小模型消融给出的结论不够确定时，你可能需要在真正的大模型训练中做 A/B 测试。

**数据 A/B 测试的设计要点：**

1. **时间切片法**：在同一次训练中，前 N% 的 step 用管线 A，后 N% 用管线 B，观察切换前后的评估指标变化
   - 优点：只需要一次训练
   - 缺点：顺序效应，不够严谨

2. **并行训练法**：同时启动两次训练，分别用管线 A 和管线 B
   - 优点：最严谨
   - 缺点：2 倍 GPU 成本

3. **混合比例法**：用管线 A 作为基线，逐渐混入管线 B 的数据（比如 10%、30%、50%），观察效果变化
   - 优点：可以发现最优混合比例
   - 缺点：需要多次实验

> **💡 反直觉发现**
>
> 数据 A/B 测试的结论在不同训练阶段可能不同。某个数据管线在训练前期（<1T token）表现更好，但在后期（>5T token）可能被另一个管线反超。这是因为模型在不同训练阶段对数据的"需求"不同——前期需要高信息密度的数据来快速建立知识基础，后期需要高多样性的数据来避免过拟合和提升泛化能力。

---

## 7.8 认知演变时间线

| 时间 | 认知阶段 | 代表性实践 |
|------|---------|-----------|
| 2020 | "loss 下降就好了" | GPT-3 只报告了训练 loss 曲线 |
| 2021-2022 | "用 benchmark 评估" | 但很快发现 benchmark 泄露问题 |
| 2023 | "系统化消融实验" | DCLM 建立了数据消融方法论 |
| 2024 | "数据管线的 CI/CD" | FineWeb 展示了完整的迭代闭环；模块化消融方法出现 |
| 2025 | "小模型代理的局限" | arXiv 2512.24503 指出代理方法的可靠性问题 |
| 2026 | "多信号融合评估" | 结合小模型消融、统计指标、人工抽检的多维度评估成为主流 |

---

## 本章要点回顾

1. **训练 loss 不等于数据质量**——低 loss 可能只是因为数据容易预测
2. **小模型代理法是当前最实用的评估方案**，但有可靠性限制；建议多种子、多 benchmark
3. **消融实验要分层设计**，避免不切实际的全因子实验
4. **数据分布 dashboard 是必需品**，而非锦上添花
5. **Benchmark 去污染是评估的前提**——泄露的评估结果毫无价值
6. **数据迭代是持续闭环**，不是一锤子买卖
7. **版本管理和持续监控**是数据管线工程化的基础

---

## 🛠 动手环节

### 练习 1：搭建一个简单的数据质量 dashboard

从任意一个开源预训练数据集（如 FineWeb 的一个子集）中随机采样 10 万条数据，计算并可视化：
- 语言分布
- 长度分布（直方图）
- 质量分数分布
- N-gram 重复率

### 练习 2：实现 benchmark 去污染检测

选择一个 benchmark（如 HellaSwag），对你的训练数据运行 13-gram 重叠检测。报告：
- 有多少训练文档与 benchmark 有高度重叠？
- 这些文档来自哪些数据源？
- 移除这些文档后，数据总量减少了多少？

### 练习 3：设计一个消融实验

假设你有一个基础数据管线，需要决定质量过滤的阈值（保留 top-20% vs top-40% vs top-60%）。设计一个最小成本的消融实验方案，包括：
- 代理模型大小和训练量
- 评估 benchmark 选择
- 需要多少个随机种子
- 预期总成本（GPU·小时）
