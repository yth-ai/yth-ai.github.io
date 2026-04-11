# 第 13 章：SFT 数据质量的精细控制

> *"SFT 数据的质量控制不是一个检查清单，而是一种持续精进的工艺。"*

---

## 13.1 什么是好的 SFT 样本

### 好样本的四个维度

```
维度 1: 指令清晰
  ✅ "用 Python 实现一个 LRU 缓存，要求线程安全，支持过期时间"
  ❌ "写个缓存"

维度 2: 回复准确
  ✅ 代码能正确运行，事实准确无误
  ❌ 代码有 bug，或引用不存在的 API

维度 3: 信息密度
  ✅ 每句话都传递有价值的信息
  ❌ 大量填充语（"好的，让我来帮你..."）和无关内容

维度 4: 格式规范
  ✅ 代码在代码块中，步骤用列表，关键词加粗
  ❌ 代码和文字混在一起，没有结构
```

### 案例分析：好样本 vs 差样本

**指令**：*"解释什么是梯度消失问题，以及如何解决"*

**❌ 差样本：**
```
好的！梯度消失问题是深度学习中很常见的一个问题哦~简单来说就是
当神经网络很深的时候梯度会变得很小很小然后就没法训练了。解决方
法有很多比如用ReLU激活函数或者用残差连接等等。希望这个回答对
你有帮助！
```
*问题：口语化严重、信息密度低、没有结构、技术细节不足*

**✅ 好样本：**
```markdown
## 梯度消失问题

### 现象
在深层神经网络的反向传播中，梯度通过链式法则逐层相乘。当每层
的梯度值 < 1 时，经过 N 层后梯度指数级衰减到接近零，导致浅层
参数几乎无法更新。

### 数学本质
对于 L 层网络：∂Loss/∂W₁ = ∏ᵢ₌₁ᴸ (∂hᵢ/∂hᵢ₋₁) · ∂Loss/∂hₗ

当 |∂hᵢ/∂hᵢ₋₁| < 1 时，乘积 → 0

### 主要解决方案

| 方法 | 原理 | 典型应用 |
|------|------|---------|
| ReLU 激活函数 | 正区间梯度恒为 1 | CNN |
| 残差连接 | 梯度可以跳过层直接回传 | ResNet, Transformer |
| BatchNorm | 标准化中间表示，控制梯度范围 | 多数深度网络 |
| LSTM 门控 | 选择性保留/遗忘梯度 | RNN 序列模型 |
| 参数初始化 | Xavier/He 初始化保持方差稳定 | 所有网络 |
```

---

## 13.2 数据清洗与过滤

### 自动化质量检查管线

```python
"""
SFT 数据质量检查管线
"""

from dataclasses import dataclass
from typing import List, Optional
import re

@dataclass
class QualityCheckResult:
    passed: bool
    score: float  # 0-1
    issues: List[str]

def check_sft_sample(
    instruction: str,
    response: str,
    language: str = "zh",
) -> QualityCheckResult:
    """
    SFT 样本的多维度质量检查
    """
    issues = []
    score = 1.0

    # === 格式检查 ===

    # 1. 代码块完整性
    code_block_opens = response.count("```")
    if code_block_opens % 2 != 0:
        issues.append("代码块未正确闭合")
        score -= 0.3

    # 2. Markdown 结构检查
    if len(response) > 500 and "##" not in response and "\n-" not in response:
        issues.append("长回复缺少结构化格式")
        score -= 0.1

    # === 内容检查 ===

    # 3. 空回复或过短回复
    if len(response.strip()) < 20:
        issues.append("回复过短")
        score -= 0.5

    # 4. 过长的前缀废话
    filler_patterns = [
        r"^(好的|当然|没问题|好呢)[!！,，。.]*\s*(我来|让我)",
        r"^(Sure|Of course|Absolutely)[!,.]",
    ]
    for pattern in filler_patterns:
        if re.match(pattern, response):
            issues.append("包含不必要的前缀填充语")
            score -= 0.05

    # 5. 重复内容检测
    sentences = [s.strip() for s in response.split("。") if len(s.strip()) > 10]
    if len(sentences) > 3:
        unique_ratio = len(set(sentences)) / len(sentences)
        if unique_ratio < 0.7:
            issues.append(f"内容重复度高 (unique ratio: {unique_ratio:.2f})")
            score -= 0.2

    # 6. 截断检测
    if response.rstrip()[-1:] not in ["。", ".", "!", "！", "?", "？", "`", "）", ")", "】", "]", "\n"]:
        if not response.rstrip().endswith("```"):
            issues.append("回复可能被截断")
            score -= 0.15

    # === 一致性检查 ===

    # 7. 指令-回复相关性（简单关键词检查）
    instruction_keywords = set(instruction.lower().split())
    response_keywords = set(response.lower().split()[:100])
    overlap = len(instruction_keywords & response_keywords)
    if overlap < 1 and len(instruction_keywords) > 3:
        issues.append("回复可能与指令不相关")
        score -= 0.2

    # 8. 语言一致性
    if language == "zh":
        zh_chars = len(re.findall(r'[\u4e00-\u9fff]', response))
        total_chars = max(len(response), 1)
        if zh_chars / total_chars < 0.1 and "```" not in response:
            issues.append("中文指令但回复可能不是中文")
            score -= 0.3

    return QualityCheckResult(
        passed=score >= 0.6,
        score=max(0, score),
        issues=issues,
    )
```

### IFD 方法：Instruction-Following Difficulty

IFD（Instruction-Following Difficulty）是一种数据筛选方法：用模型自身来评估每条数据的"价值"。

**核心思想**：
- 对每条 (instruction, response) 对，计算模型生成 response 的困惑度（perplexity）
- PPL 过低 → 模型"已经会了"，这条数据的训练价值有限
- PPL 过高 → 回复可能与模型的能力差距太大，训练效果也不好
- PPL 适中 → 这条数据在模型的"学习区"（zone of proximal development），价值最高

```
数据价值的 PPL 分布：

  PPL 很低（< 5）     → "已经会了" → 训练价值低
  PPL 适中（5-50）    → "学习区"  → 训练价值最高
  PPL 很高（> 50）    → "太难了"  → 训练效果差
```

---

## 13.3 数据多样性的保证

### 多样性的多个维度

```
维度 1: 任务多样性
  - 覆盖尽可能多的任务类型
  - 避免某一类任务过度主导

维度 2: 领域多样性
  - 科技、医学、法律、教育、金融、日常...
  - 每个领域都有代表性样本

维度 3: 长度多样性
  - 短回复（一两句话）到长回复（数千字）
  - 不要让模型形成固定的长度偏好

维度 4: 难度多样性
  - 从入门到专家级的全谱系覆盖

维度 5: 风格多样性
  - 正式/非正式、技术/通俗、详细/简洁
```

### 使用 Embedding 进行多样性分析

```python
"""
基于 Embedding 的 SFT 数据多样性分析
"""

import numpy as np
from typing import List

def analyze_diversity(
    instructions: List[str],
    embeddings: np.ndarray,  # (N, dim) 的 embedding 矩阵
    n_clusters: int = 20,
) -> dict:
    """
    分析 SFT 数据集的多样性
    """
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score

    N = len(instructions)

    # 1. 聚类分析
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(embeddings)

    # 各类别大小
    cluster_sizes = np.bincount(labels)
    size_std = np.std(cluster_sizes)

    # 2. 覆盖度分析
    # 理想情况下，类别大小应该相对均匀
    coverage_score = 1 - (size_std / np.mean(cluster_sizes))

    # 3. 平均余弦距离（全局多样性）
    # 采样计算避免 O(N²)
    sample_size = min(5000, N)
    indices = np.random.choice(N, sample_size, replace=False)
    sample_emb = embeddings[indices]
    # 归一化
    norms = np.linalg.norm(sample_emb, axis=1, keepdims=True)
    normalized = sample_emb / np.maximum(norms, 1e-8)
    # 平均余弦距离
    cos_sim_matrix = normalized @ normalized.T
    avg_similarity = (cos_sim_matrix.sum() - sample_size) / (sample_size * (sample_size - 1))
    avg_diversity = 1 - avg_similarity

    # 4. 识别稀疏区域（可能缺少样本的类别）
    sparse_clusters = [i for i, size in enumerate(cluster_sizes)
                       if size < N / n_clusters * 0.3]

    return {
        "total_samples": N,
        "n_clusters": n_clusters,
        "cluster_sizes": cluster_sizes.tolist(),
        "coverage_score": round(float(coverage_score), 3),
        "avg_diversity": round(float(avg_diversity), 3),
        "sparse_cluster_count": len(sparse_clusters),
        "silhouette_score": round(float(silhouette_score(embeddings, labels)), 3),
        "recommendation": (
            "多样性良好" if coverage_score > 0.7 and avg_diversity > 0.5
            else "建议增加稀疏领域的样本"
        ),
    }
```

### 避免合成数据中的多样性不足

合成数据最常见的问题是**模式坍缩**：模型倾向于生成相似模式的回复。

**检测方法：**

```python
def detect_pattern_collapse(responses: List[str], n_samples: int = 1000) -> dict:
    """
    检测合成回复中的模式坍缩
    """
    from collections import Counter

    # 1. 开头句式检测
    first_sentences = [r.split("。")[0][:50] if "。" in r else r[:50]
                       for r in responses[:n_samples]]
    opening_counter = Counter(first_sentences)
    top_openings = opening_counter.most_common(10)
    repetitive_openings = sum(c for _, c in top_openings if c > n_samples * 0.05)

    # 2. 结构模式检测
    structures = []
    for r in responses[:n_samples]:
        # 简单的结构指纹：标题数量、列表项数量、代码块数量
        n_headers = r.count("##")
        n_list_items = r.count("\n-") + r.count("\n1.")
        n_code_blocks = r.count("```") // 2
        structures.append((n_headers, n_list_items, n_code_blocks))

    structure_counter = Counter(structures)
    top_structures = structure_counter.most_common(5)

    # 3. 汇总
    collapse_risk = "low"
    if repetitive_openings > n_samples * 0.3:
        collapse_risk = "high"
    elif repetitive_openings > n_samples * 0.15:
        collapse_risk = "medium"

    return {
        "collapse_risk": collapse_risk,
        "top_repeated_openings": top_openings[:5],
        "repetitive_opening_ratio": repetitive_openings / n_samples,
        "top_structural_patterns": top_structures,
        "unique_structures": len(structure_counter),
    }
```

---

## 13.4 多轮对话数据的特殊考量

### 多轮依赖关系的构造

多轮对话数据需要有真实的轮次间依赖——不能是"把多个单轮拼在一起"。

```
❌ 假多轮（没有真正的依赖）：
  User: "什么是 TCP？"
  Assistant: "TCP 是传输控制协议..."
  User: "Python 怎么读文件？"  ← 和第一轮完全无关
  Assistant: "可以使用 open() 函数..."

✅ 真多轮（有上下文依赖）：
  User: "什么是 TCP？"
  Assistant: "TCP 是传输控制协议..."
  User: "它和 UDP 有什么区别？"  ← 依赖第一轮的上下文
  Assistant: "TCP 和 UDP 的主要区别在于..."
  User: "什么场景下应该用 UDP？"  ← 依赖前两轮
  Assistant: "UDP 适合实时性要求高..."
```

### 上下文一致性检查

```python
def check_multi_turn_consistency(
    conversation: list,  # [{"role": "user"|"assistant", "content": str}, ...]
) -> dict:
    """
    多轮对话一致性检查
    """
    issues = []

    for i in range(1, len(conversation)):
        current = conversation[i]
        if current["role"] == "assistant":
            # 检查是否与自己之前的回复矛盾
            for j in range(i - 1, -1, -1):
                if conversation[j]["role"] == "assistant":
                    # 简化检查：关键实体是否前后一致
                    # 实际中应该用 NLI 模型检查
                    pass

            # 检查是否遵循了最近的用户指令
            prev_user = None
            for j in range(i - 1, -1, -1):
                if conversation[j]["role"] == "user":
                    prev_user = conversation[j]["content"]
                    break

            if prev_user and len(current["content"]) < 10:
                issues.append(f"Turn {i}: 回复过短，可能未充分回应用户")

    # 检查对话长度合理性
    assistant_turns = [c for c in conversation if c["role"] == "assistant"]
    lengths = [len(c["content"]) for c in assistant_turns]
    if len(lengths) > 2:
        if max(lengths) / max(min(lengths), 1) > 10:
            issues.append("各轮回复长度差异过大")

    return {
        "turn_count": len(conversation),
        "issues": issues,
        "is_consistent": len(issues) == 0,
    }
```

---

## 13.5 SFT 的评估与迭代

### 如何评估 SFT 数据的效果

不要把"模型表现"和"数据质量"混为一谈。以下是专门针对 SFT 数据质量的评估方法：

**1. 数据影响力分析**

找出哪些训练样本对模型表现贡献最大：

```
方法 A: Leave-One-Out（太贵，不实用）
  → 每次移除一条数据，重新训练，观察影响

方法 B: 影响函数（Influence Functions）
  → 近似计算每条数据的影响
  → 计算成本可控

方法 C: 数据 Shapley 值
  → 用采样方法估计每条数据的边际贡献
  → 最公平但也最贵
```

**2. 类别覆盖度评估**

```python
def evaluate_data_coverage(
    sft_data: list,          # SFT 数据集
    eval_failures: list,     # 模型在评估中失败的案例
) -> dict:
    """
    分析评估失败案例与训练数据的覆盖度关系
    """
    # 对失败案例做分类
    failure_categories = categorize_failures(eval_failures)

    # 检查每个失败类别在训练数据中的覆盖度
    coverage_gaps = {}
    for category, count in failure_categories.items():
        training_count = count_category_in_data(sft_data, category)
        if training_count < 10:
            coverage_gaps[category] = {
                "eval_failures": count,
                "training_samples": training_count,
                "recommendation": "严重不足，建议增加该类型的训练数据",
            }

    return coverage_gaps
```

### 认知变化：从"一次性标完"到"持续数据飞轮"

> **SFT 数据迭代的认知演变**
> - 2022："标注 10K 条，训练，发布"
> - 2023："标注 → 训练 → 评估 → 补充标注 → 再训练"
> - 2024："建立数据飞轮——模型的失败案例成为新的标注重点"
> - 2025-2026："全自动化的数据飞轮——模型评估 → 自动识别弱点 → 自动合成补充数据 → 人工验证 → 训练"

**数据飞轮的流程：**

```
  模型部署
      ↓
  收集真实用户交互 + 失败案例
      ↓
  分析失败模式（按类型、领域、难度分类）
      ↓
  针对性地合成/标注补充数据
      ↓
  质量过滤 + 人工抽检
      ↓
  混入新数据 + 重新训练
      ↓
  评估 → 如有改善，部署新版本
      ↓
  循环 ↑
```

---

## 本章要点回顾

1. **好的 SFT 样本四要素**：指令清晰、回复准确、信息密度高、格式规范
2. **自动化质量检查**应覆盖格式、内容、一致性三个层面
3. **IFD 方法**用模型自身的困惑度筛选最有价值的训练样本
4. **多样性需要主动管理**：用 embedding 聚类分析 + 模式坍缩检测
5. **多轮对话的核心**是真实的轮次间依赖，不是拼接
6. **建立数据飞轮**：模型的失败案例 → 新的训练数据 → 循环迭代
