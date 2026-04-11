---
title: "中训练数据的构造"
description: "能力增强、知识注入与合成数据在中训练中的应用"
date: 2026-03-21
updatedDate: 2026-04-02
bookSlug: "data-engineering"
chapter: 9
part: "第二部分：中训练数据"
partOrder: 2
tags: [中训练数据,长上下文,代码增强,合成数据]
---

> *"The data you use for mid-training determines whether you're sharpening a blade or dulling it."*
>
> 中训练的数据不是"更多预训练数据"。它是精心设计的、针对特定目标的战略性资源。

---

## 9.1 能力增强型数据

### 9.1.1 长上下文数据

#### 长文档的来源

构建长上下文训练数据的第一步是找到**自然存在的长文档**。以下是经过实践验证的主要来源：

| 数据来源 | 典型长度 | 质量 | 获取难度 | 适用场景 |
|---------|---------|------|---------|---------|
| 书籍（Gutenberg等） | 50K-500K token | 高 | 低 | 通用长文本理解 |
| 法律文书 | 10K-200K token | 高 | 中 | 专业长文本，逻辑严密 |
| 学术论文（含引用） | 5K-30K token | 高 | 低 | 知识密集型 |
| 代码仓库（repo 级） | 10K-500K token | 变化大 | 低 | 跨文件理解 |
| 维基百科+链接文章 | 10K-100K token | 高 | 低 | 知识关联 |
| 专利文档 | 5K-50K token | 中 | 中 | 技术描述 |
| 政府报告 | 10K-200K token | 高 | 低 | 长篇分析 |

2024 年的一项重要研究《How to Train Long-Context Language Models (Effectively)》（发表于 ACL 2025）发现了两个关键结论：

1. **代码仓库和书籍是最佳的长上下文数据源**——它们的内部结构天然具有长距离依赖
2. **长数据必须与高质量的短数据混合**——单独使用长数据会导致短上下文能力退化

#### 长度分布设计

长上下文训练不是简单地"把文档拼长"。你需要精心设计训练数据的长度分布。

截至 2026 年初，128K 上下文已成为主流模型的**基线能力**而非"目标上限"。[UltraLong-8B](https://arxiv.org/abs/2504.06214) 在 Llama-3.1-8B-Instruct 上实现了 128K→4M 的上下文扩展，RULER 1M 评测从 0 提升到 77.2。一个关键发现是：**超长样本（>1M）在训练数据中的比例可以低至 <5%，大部分样本仍应在 8K-128K 范围**。

```python
"""
长上下文训练数据的长度分布设计
注：128K 已是基线，目标上限可设到 1M-4M
"""

import numpy as np
from typing import List, Tuple

def design_length_curriculum(
    target_max_length: int = 4_194_304,  # 4M（当前前沿水平）
    num_stages: int = 7,
    tokens_per_stage: int = 50_000_000_000,  # 50B per stage
) -> List[dict]:
    """
    设计渐进式长度课程

    关键原则：
    1. 每个阶段的最大长度逐步增加
    2. 短文档在每个阶段都保持一定比例（≥30%）
    3. 目标长度的文档占比逐步增加
    4. 超长样本（>1M）比例可以很低（<5%）——UltraLong 的发现
    """
    stages = []
    lengths = np.geomspace(4096, target_max_length, num_stages + 1).astype(int)

    for i in range(num_stages):
        stage_min = lengths[i]
        stage_max = lengths[i + 1]

        # 超长阶段的超长样本比例控制在较低水平
        long_ratio = min(0.40, 0.05 + i * 0.06)
        short_ratio = max(0.30, 0.65 - i * 0.06)

        stage = {
            "stage": i + 1,
            "max_context_length": stage_max,
            "tokens": tokens_per_stage,
            "length_distribution": {
                "short (< 8K)": short_ratio,
                f"medium (8K-{stage_min//1024}K)": round(1 - short_ratio - long_ratio, 2),
                f"long ({stage_min//1024}K-{stage_max//1024}K)": long_ratio,
            },
            "rope_scaling": "YaRN" if stage_max > 131072 else "base_adjustment",
            "rope_base": int(500000 * (2 ** i)),
        }
        stages.append(stage)

    return stages

# 设计从 8K 到 4M 的课程
stages = design_length_curriculum(target_max_length=4_194_304, num_stages=7)
for s in stages:
    print(f"阶段 {s['stage']}: max_len={s['max_context_length']//1024}K, "
          f"RoPE={s['rope_scaling']}, base={s['rope_base']:,}")
```

> **位置编码扩展的演进**：早期的做法是直接调整 RoPE base frequency，但这在超过 128K 时效果衰减。更先进的方法包括 YaRN（Yet another RoPE extensioN）和 NTK-aware 插值，它们能在保持短上下文性能的同时支持百万级上下文。UltraLong 的实践表明，两阶段策略（持续预训练 + 对齐微调）是当前最可靠的超长上下文训练配方。

#### 长上下文数据的质量要求

不是所有"长"的文本都适合用来训练长上下文。**关键标准是文本的内部连贯性和长距离依赖**。

**好的长上下文数据：**
- 一本小说（角色在 50 页前出现，在最后一章被提到）
- 一个代码仓库（函数定义在文件 A，调用在文件 B）
- 一篇法律文书（第 1 条的定义在第 37 条被引用）

**差的长上下文数据：**
- 把 10 篇不相关的短文章拼在一起——模型学不到跨段落的依赖关系
- 模板化的超长列表（如产品目录）——长度大但信息密度低
- 重复性很高的文本——模型可以用局部模式预测，不需要长距离注意力

```python
def filter_long_context_quality(
    doc: str,
    min_length: int = 32768,  # 32K tokens minimum
) -> dict:
    """
    长上下文数据质量检查
    """
    tokens = doc.split()  # 简化的 tokenization
    length = len(tokens)

    if length < min_length:
        return {"pass": False, "reason": "too_short"}

    # 检查 1：内部重复度
    # 把文档分成 1K 的块，检查块间相似度
    chunk_size = 1000
    chunks = [" ".join(tokens[i:i+chunk_size])
              for i in range(0, length, chunk_size)]

    if len(chunks) < 4:
        return {"pass": False, "reason": "not_enough_chunks"}

    # 简单的重复度检测：用前后半段的 n-gram 重叠
    first_half = set(" ".join(tokens[:length//2]).split())
    second_half = set(" ".join(tokens[length//2:]).split())
    overlap = len(first_half & second_half) / max(len(first_half | second_half), 1)

    if overlap > 0.95:
        return {"pass": False, "reason": "too_repetitive",
                "overlap": round(overlap, 3)}

    # 检查 2：信息密度（通过 unique n-gram 比例估计）
    trigrams = set()
    for i in range(len(tokens) - 2):
        trigrams.add(tuple(tokens[i:i+3]))
    unique_ratio = len(trigrams) / max(len(tokens) - 2, 1)

    if unique_ratio < 0.3:
        return {"pass": False, "reason": "low_information_density",
                "unique_trigram_ratio": round(unique_ratio, 3)}

    return {
        "pass": True,
        "length_tokens": length,
        "overlap_score": round(overlap, 3),
        "unique_trigram_ratio": round(unique_ratio, 3),
    }
```

### 9.1.2 代码数据

代码是中训练中最重要的数据类型之一——不仅因为它直接提升编程能力，更因为它对推理能力有显著的溢出效应。

#### 代码质量分层

不是所有代码都值得用来训练。代码数据需要严格的质量分层：

```
层级 1（最高质量）：知名开源项目的核心代码
  - 特征：高 star 数、活跃维护、完善的文档
  - 来源：GitHub top 1000 项目、知名框架（PyTorch, React, Linux kernel）
  - 用途：中训练的核心代码数据

层级 2（高质量）：质量良好的开源代码
  - 特征：有测试、有文档、lint 通过率高
  - 筛选标准：star > 10, 有 CI/CD, docstring 覆盖率 > 50%
  - 用途：中训练的主体代码数据

层级 3（中等质量）：一般的开源代码
  - 特征：功能性代码，但缺少文档和测试
  - 筛选标准：star > 1, 非 fork, 有 README
  - 用途：预训练可用，中训练需谨慎

层级 4（低质量）：学习/练习/低质量代码
  - 特征：作业代码、教程复制品、无意义的代码
  - 筛选标准：自动检测（重复度高、文件数少、无 commit 历史）
  - 用途：通常不用于训练
```

```python
"""
代码数据质量评分
"""

from dataclasses import dataclass
from typing import List, Optional

@dataclass
class RepoMetrics:
    """仓库级指标"""
    stars: int = 0
    forks: int = 0
    has_tests: bool = False
    has_ci: bool = False
    has_readme: bool = False
    has_license: bool = False
    last_commit_days_ago: int = 999
    num_contributors: int = 1
    primary_language: str = ""

@dataclass
class FileMetrics:
    """文件级指标"""
    lines_of_code: int = 0
    comment_ratio: float = 0.0       # 注释行占比
    docstring_coverage: float = 0.0   # 函数/类的 docstring 覆盖率
    avg_function_length: int = 0      # 平均函数长度
    has_type_hints: bool = False      # 是否有类型注解 (Python)
    lint_errors: int = 0              # lint 错误数
    import_count: int = 0             # 导入数量

def score_code_quality(
    repo: RepoMetrics,
    file: FileMetrics
) -> dict:
    """
    综合评分（0-100）
    """
    score = 0

    # 仓库级评分 (0-50)
    if repo.stars >= 100: score += 15
    elif repo.stars >= 10: score += 10
    elif repo.stars >= 1: score += 5

    if repo.has_tests: score += 10
    if repo.has_ci: score += 5
    if repo.has_readme: score += 5
    if repo.has_license: score += 3
    if repo.num_contributors >= 5: score += 5
    elif repo.num_contributors >= 2: score += 3
    if repo.last_commit_days_ago < 365: score += 7

    # 文件级评分 (0-50)
    if file.comment_ratio > 0.15: score += 10
    elif file.comment_ratio > 0.05: score += 5

    if file.docstring_coverage > 0.7: score += 15
    elif file.docstring_coverage > 0.3: score += 8

    if file.has_type_hints: score += 5
    if file.lint_errors == 0: score += 10
    elif file.lint_errors < 5: score += 5

    if 50 < file.lines_of_code < 1000: score += 10
    elif 10 < file.lines_of_code <= 50: score += 5

    # 质量层级映射
    tier = "tier_4"
    if score >= 70: tier = "tier_1"
    elif score >= 50: tier = "tier_2"
    elif score >= 30: tier = "tier_3"

    return {"score": min(score, 100), "tier": tier}
```

#### 从过滤到改写：Transform-and-Retain 范式

传统的代码质量策略是"分层过滤"——低质量代码直接丢弃。但 2025 年出现的一项重要工作提出了截然不同的思路：**低质量代码不必丢弃，可以通过 LLM 驱动的改写升级为高质量训练数据**。

[SwallowCode](https://arxiv.org/abs/2505.02881)（ICLR 2026）在 The Stack v2 的 Python 代码上设计了四阶段改写管线：

```
Transform-and-Retain 管线（SwallowCode）:

  原始低质量代码（Tier 3-4）
         ↓
  阶段 1: 语法验证 — 过滤无法解析的代码
         ↓
  阶段 2: pylint 风格过滤 — 去除严重违规
         ↓
  阶段 3: SGCR（Style-Guided Code Rewriting）
          — 用 LLM 按风格指南改写代码结构和命名
         ↓
  阶段 4: SCOR（Self-Contained Optimization Rewriting）
          — 将代码改写为自包含、可独立理解的形式
         ↓
  改写后的高质量代码（提升至 Tier 2 级别）
```

关键结果：在 Llama-3.1-8B 上用 50B token 持续预训练后，HumanEval 提升 +17.0 pp，GSM8K 提升 +7.2 pp。SwallowMath 用类似方法处理数学文本（~2.3B token），也取得了显著收益。

这一范式的意义在于**从"排除法"转向"提升法"**：前面定义的 Tier 3-4 代码不再是废料，而是可以通过改写管线回收利用的资源。对于代码数据总量有限的场景，这种方法可以将可用训练数据量提升 2-3 倍。

#### Repo 级代码 vs 文件级代码

这是中训练代码数据的一个关键决策：**是把代码按文件级处理，还是保留仓库的完整结构？**

```
文件级代码：
  ├── 优点：处理简单，可以大规模高效处理
  ├── 缺点：丢失了跨文件的依赖关系
  └── 适用：预训练（量大质参差）

仓库级代码：
  ├── 优点：保留跨文件依赖、模块结构、导入关系
  ├── 缺点：处理复杂，需要设计序列化格式
  └── 适用：中训练（精选高质量仓库）
```

**仓库级代码的序列化方案：**

```python
def serialize_repository(
    repo_path: str,
    max_tokens: int = 65536,
    file_order: str = "dependency"  # "dependency" | "alphabetical" | "random"
) -> str:
    """
    将代码仓库序列化为训练文本

    关键：保留文件间的引用关系
    """
    # 1. 收集所有源代码文件
    # 2. 分析依赖关系（import 图）
    # 3. 按依赖顺序排列文件
    # 4. 用特殊标记分隔

    # 示例输出格式
    output = """
<|repo_start|>
<|repo_name|>pytorch/pytorch<|repo_name_end|>
<|file_start|>torch/nn/modules/linear.py<|file_end|>
import torch
from torch import Tensor
from ..module import Module
...
<|file_start|>torch/nn/modules/activation.py<|file_end|>
from .linear import Linear
...
<|repo_end|>
"""
    return output
```

**2024 年的 CodeChain 数据集**采用了一种创新的"随机游走"方法来捕获仓库内的跨文件依赖：从一个入口文件开始，沿着导入关系随机游走，构建出一条有意义的代码路径。这种方法比简单拼接更好地保留了代码的语义结构。

#### 代码相关的自然语言

容易被忽视但极其重要的数据类型：

- **文档**：README、API 文档、技术博客
- **Issue 讨论**：bug 报告、feature request 中的技术讨论
- **PR Review**：代码审查中的反馈和讨论
- **Commit Message**：变更描述

这些数据建立了"代码 ↔ 自然语言"的映射关系，对模型理解和生成代码至关重要。

### 9.1.3 数学数据

数学是中训练的另一个重点领域，难度在于数学数据的处理有很多独特的挑战。

#### 数学数据的特殊处理

```python
"""
数学数据的预处理
"""

import re

def process_latex_math(text: str) -> str:
    """
    处理数学文本中的 LaTeX
    核心原则：保留数学表达式的完整性
    """
    # 1. 检查 LaTeX 公式的完整性
    # 确保 $ 成对出现
    inline_math_count = text.count('$') - text.count('\\$')
    if inline_math_count % 2 != 0:
        return None  # LaTeX 不完整，丢弃

    # 2. 检查 \begin{} 和 \end{} 的配对
    begins = re.findall(r'\\begin\{(\w+)\}', text)
    ends = re.findall(r'\\end\{(\w+)\}', text)
    if begins != ends:
        return None  # 环境不匹配，丢弃

    # 3. 标准化数学表示
    # 统一使用 \frac 而非 a/b（在数学上下文中）
    # 统一使用 \cdot 而非 *
    # 这些标准化有助于模型学习一致的数学表示

    # 4. 保留推理步骤
    # 确保解题过程的步骤完整
    # 检查是否有 "因此"、"所以"、"Therefore"、"Q.E.D." 等结论标志

    return text

def assess_math_difficulty(problem: str, solution: str) -> str:
    """
    评估数学题的难度级别
    """
    # 简单启发式
    indicators = {
        "elementary": ["加", "减", "乘", "除", "计算", "addition", "subtract"],
        "intermediate": ["方程", "函数", "概率", "equation", "function", "probability"],
        "advanced": ["积分", "微分", "群论", "integral", "differential", "topology"],
        "competition": ["证明", "充分必要", "当且仅当", "prove", "if and only if"],
    }

    solution_length = len(solution.split())

    for level, keywords in indicators.items():
        if any(kw in problem.lower() for kw in keywords):
            return level

    # 根据解答长度估计
    if solution_length > 500: return "advanced"
    if solution_length > 200: return "intermediate"
    return "elementary"
```

#### 合成数学题的策略

自然存在的高质量数学数据非常有限。合成数学数据是必要的补充。

**常见策略：**

1. **数值替换**：取一道经典题，替换其中的数值
   - 风险：模型可能只学会了模板，而非推理过程
   - 适用：基础算术和简单应用题

2. **条件变换**：修改题目的约束条件
   - 更好：迫使模型理解条件之间的关系
   - 适用：代数和几何题

3. **强模型生成**：用 GPT-4 级别的模型生成新题
   - 最好：多样性高，但需要严格的质量验证
   - 必须检查：答案正确性、推理步骤的逻辑性

4. **形式化验证**：用 Lean/Isabelle 等证明助手验证数学推理
   - 曾被认为"成本高，适用范围有限"，但这一判断已经过时
   - [AlphaProof](https://www.nature.com/articles/s41586-025-09833-y)（Nature 2025）用 RL + Lean 形式化验证达到 IMO 银牌水平，证明了形式化验证可以规模化
   - [DeepSeek-Prover-V2](https://arxiv.org/abs/2504.21801) 通过子目标分解 + RL + Lean 验证构建递归定理证明数据循环
   - 核心模式：RL 在形式化环境中自动生成候选证明 → Lean 自动验证 → 正确的证明作为训练数据 → 形成**数据生产飞轮**
   - 当前定位：正在从"验证工具"升级为**可规模化的数学数据生产引擎**

5. **格式转换**：将数学知识改写为不同的表达格式
   - [MIND](https://arxiv.org/abs/2410.12881) 将数学知识改写为对话式格式（师生对话、逐步推理对话）
   - 同一数学内容用对话式格式表达，GSM8K/MATH 等基准上额外提升 3-5%
   - 本质：数学数据增强不仅是"内容增强"（新题目），还可以是"格式增强"（同一知识的不同表达）

```
合成数学数据的质量控制流程：

  强模型生成题目+解答
         ↓
  自动格式检查（LaTeX 完整性、步骤结构）
         ↓
  答案验证（数值计算验证、交叉检验）
         ↓
  难度评估和分层
         ↓
  多样性检查（与已有数据去重）
         ↓
  人工抽检（每 1000 条抽检 50 条）
```

### 9.1.4 多语言数据

对于需要中文能力的模型，中训练阶段的多语言数据策略尤为关键。

```
中文数据的质量层级：

层级 1: 高质量原创中文内容
  - 来源：百度百科（非用户编辑版）、知乎优质回答、中文维基百科
  - 特征：语言规范、信息准确、内容原创
  - 用途：中训练的核心中文数据

层级 2: 专业领域中文内容
  - 来源：中文学术论文、专业书籍、法律法规文本
  - 特征：领域知识密集、表述规范
  - 用途：领域知识注入

层级 3: 高质量翻译内容
  - 来源：优质英中翻译内容（平行语料）
  - 特征：翻译质量高、内容有价值
  - 用途：跨语言对齐

层级 4: 一般网页中文内容
  - 来源：经过清洗的中文网页数据
  - 特征：质量参差，但覆盖面广
  - 用途：语言多样性和知识覆盖
```

---

## 9.2 知识注入型数据

### 领域语料的收集与清洗

当你要构建一个垂直领域的模型（如医学、法律、金融），中训练数据的构造需要额外的考量。

**领域数据构建流程：**

```
Step 1: 领域语料收集
  ├── 专业数据库：PubMed (医学), SEC EDGAR (金融), 裁判文书网 (法律)
  ├── 专业书籍：教材、专著
  ├── 行业报告：券商研报、行业白皮书
  └── 专业社区：丁香园 (医学), 雪球 (金融)

Step 2: 领域特定清洗
  ├── 专业术语保留：不把专业术语当做"生僻词"过滤掉
  ├── 格式处理：医学文献的结构化信息、法律条款的编号
  ├── 时效性检查：医学指南版本、法律条文的修订版本
  └── 准确性初筛：交叉验证关键事实

Step 3: 领域配比
  └── 关键决策：领域数据与通用数据的比例
```

#### 有限数据场景：从 CPT 到指令式注入

上面的流程假设领域语料量足够大（数十亿 token 级别）。但在实际企业场景中，专有知识库往往只有几百 MB 到几 GB。对于这种**数据量有限的领域**，传统的持续预训练（CPT）路径可能效率不高——数据不够多，模型难以通过 next-token prediction 充分吸收知识。

[Knowledge-Instruct](https://arxiv.org/abs/2504.05571) 提出了一种替代思路：将领域文档转化为信息密集的 QA/指令格式，然后用指令微调而非传统 CPT 来注入知识。在 <1B token 的小数据场景下，这种方法显著优于传统 CPT，且由于指令格式的学习效率更高，对通用能力的遗忘也更少。

两种路径的适用边界：

| | 传统 CPT 路径 | 指令式知识注入 |
|--|-------------|-------------|
| **数据规模** | >10B token | <1B token |
| **知识密度** | 原始文档即可 | 需转化为 QA/指令格式 |
| **遗忘风险** | 较高，需大比例回放 | 较低 |
| **前期成本** | 低（直接用原始语料） | 中（需要语料→指令转化） |
| **适用场景** | 大规模公开领域数据 | 企业专有知识库 |

### 领域数据与通用数据的配比

这是领域中训练最关键的决策之一。

```python
"""
领域中训练的配比框架
"""

def design_domain_midtraining_mix(
    domain: str,
    domain_data_size: str,         # 领域数据总量
    target_training_tokens: str,   # 计划训练的 token 数
    forgetting_tolerance: str = "low"  # 对遗忘的容忍度
) -> dict:
    """
    设计领域中训练的数据配比

    核心原则：
    1. 领域数据占比不宜超过 60%（遗忘风险）
    2. 通用回放数据至少 20%（保持基础能力）
    3. 代码和数学数据保留 10-15%（保持推理能力）
    """
    tolerance_to_domain_ratio = {
        "low": 0.30,     # 低容忍遗忘 → 领域数据占比较低
        "medium": 0.45,  # 中等
        "high": 0.60,    # 高容忍遗忘 → 领域数据占比较高
    }

    domain_ratio = tolerance_to_domain_ratio.get(forgetting_tolerance, 0.45)

    mix = {
        "domain_data": domain_ratio,
        "general_replay": max(0.20, 1 - domain_ratio - 0.25),
        "code": 0.10,
        "math": 0.05,
        "high_quality_web": 0.10,
    }

    # 归一化
    total = sum(mix.values())
    mix = {k: round(v / total, 2) for k, v in mix.items()}

    return {
        "domain": domain,
        "data_mix": mix,
        "target_tokens": target_training_tokens,
        "note": f"领域数据占比 {mix['domain_data']*100:.0f}%, "
                f"通用回放 {mix['general_replay']*100:.0f}%",
    }

# 示例：医学领域中训练
medical_mix = design_domain_midtraining_mix(
    domain="medical",
    domain_data_size="50B tokens",
    target_training_tokens="200B tokens",
    forgetting_tolerance="medium"
)
print(medical_mix)
```

上面的硬编码配比方法是快速起步的"经验法则"，但近期的研究提供了更精确和更自动化的替代方案。

#### 从经验法则到数学模型：遗忘的 Scaling Laws

Apple 团队在 [Scaling Laws for Forgetting](https://arxiv.org/abs/2502.06042)（ICLR 2026）中推导出遗忘的定量数学框架，将三个关键变量纳入统一公式：

- **模型规模**：模型越大，遗忘越少（幂律关系）
- **目标域数据量**：领域数据越多，遗忘风险越大
- **预训练数据注入比例**：注入仅 **1% 的预训练数据**到微调数据中就能显著防止遗忘

这一发现的实践意义很大：上面代码中的 `forgetting_tolerance` 映射到固定的 30%/45%/60% 比例，是粗粒度的近似。Apple 的框架允许你根据模型规模和领域数据量精确计算最优的回放比例，而不是依赖经验猜测。对于 7B 以上的模型，预训练回放的实际需求量可能远低于经验法则建议的 20-30%。

#### 从人工调参到自动学习：Data Mixing Agent

更进一步，[Data Mixing Agent](https://arxiv.org/abs/2507.15640) 提出了端到端的自动化方案：训练一个专门的 Agent 来动态学习不同域的数据权重，而非人工设定固定配比。在多个目标域上的实验表明，自动学习的配比持续优于手动调优的最优固定比例。

三个层次的配比策略总结：

| 方法 | 精确度 | 成本 | 适用场景 |
|------|--------|------|---------|
| 经验法则（上面的代码） | 低 | 零 | 快速原型、资源有限 |
| Scaling Laws 计算 | 高 | 低（只需小规模实验标定参数） | 生产级领域适配 |
| Data Mixing Agent | 最高 | 高（需要额外训练 Agent） | 大规模、多域并行 |

### 知识密度（Knowledge Density）

不是所有领域文本都具有相同的知识含量。**知识密度**是衡量一段文本中有多少"可学习的新知识"的概念。

| 文本类型 | 知识密度 | 适用阶段 |
|---------|---------|---------|
| 教科书（定义、定理、解释） | 极高 | 中训练首选 |
| 综述论文（系统梳理） | 高 | 中训练 |
| 原始研究论文 | 中高 | 中训练 |
| 专业问答 | 中 | 中训练 + SFT |
| 新闻报道 | 中低 | 预训练 |
| 社交媒体讨论 | 低 | 预训练（覆盖面） |

**实战案例：构建医学领域中训练数据集**

```
目标：将通用模型增强为医学领域模型

数据构成（200B token）：
1. 医学教科书 & 指南：30B token（15%）
   - 来源：公开医学教材 PDF、WHO 指南、诊疗规范
   - 处理：PDF 提取 + LaTeX 公式保留 + 表格结构化

2. 医学论文：40B token（20%）
   - 来源：PubMed Open Access、中文医学期刊
   - 处理：保留摘要+方法+结论，去除参考文献列表

3. 医学问答：10B token（5%）
   - 来源：丁香园、MedQA 数据集
   - 处理：保留高质量回答，去除广告

4. 通用高质量数据（回放）：60B token（30%）
   - 来源：预训练数据的高质量子集
   - 目的：防止遗忘

5. 代码 + 数学：30B token（15%）
   - 目的：保持推理能力

6. 一般中文数据：30B token（15%）
   - 目的：保持中文能力的多样性
```

---

## 9.3 合成数据在中训练中的应用

### 合成数据的角色

合成数据在中训练中可以扮演多种角色：

| 角色 | 方法 | 效果 | 风险 |
|------|------|------|------|
| **改写** | 将原始文本改写为更清晰的版本 | 提高数据质量 | 信息损失 |
| **教科书化** | 将散乱知识重写为教材格式 | 提高知识密度 | 幻觉 |
| **翻译** | 将高质量英文内容翻译为中文 | 增加中文数据 | 翻译质量 |
| **增强** | 为已有内容添加解释和示例 | 提高信息丰富度 | 注入错误 |
| **知识蒸馏** | 用强模型生成弱模型的训练数据 | 高效知识传递 | 多样性不足 |

### Phi 系列的启示：教科书风格合成数据

微软的 Phi 系列模型是合成数据在训练中应用的标杆案例。

**核心思路**：用 GPT-4 生成"教科书风格"的训练数据——结构清晰、概念准确、循序渐进。

**关键发现**：
- 仅用 1.3B 参数 + 精心构造的合成数据，Phi-1 在代码生成上超越了许多更大的模型
- Phi-2（2.7B）在多个 benchmark 上接近或超越 Llama-2 70B
- 证明了**数据质量可以在很大程度上弥补模型规模的不足**

**但要注意**：Phi 的成功不能简单地复制。后续研究发现：

1. **教科书风格数据在某些领域表现差**：特别是在需要口语化、创意性表达的任务上
2. **多样性不足**：合成数据的模式单一，长期训练可能导致模型"风格僵化"
3. **难度天花板**：强模型生成的数据难度受限于强模型自身的能力

### 认知变化：从"银弹"到"谨慎使用"

> **合成数据在中训练中的认知演变**
> - 2023："Phi 证明了合成数据是银弹！"
> - 2024："等等，100% 合成数据会导致 model collapse（Nature 论文）"
> - 2024："Meta 发现约 30% 的合成数据混合比例是最优的"
> - 2025(Q2)："SwallowCode 证明改写优于过滤——transform-and-retain 成为新范式"
> - 2025(Q4)："AlphaProof 在 Nature 发表——形式化验证 + RL 实现 IMO 银牌级数学数据生成"
> - 2025："合成数据有自己的 Scaling Law，边际收益递减显著"
> - 2026(Q1)："ICLR 发现 0.1% 合成数据即可引发 collapse——安全阈值概念被挑战"
> - 2026(Q1)："Apple 推导出遗忘的 Scaling Laws——领域配比从经验走向数学"
> - 2026："合成数据是有价值的工具，但必须搭配验证机制和数据溯源"

### Model Collapse 的风险

2024 年发表在 Nature 上的一篇重要论文系统研究了"递归训练"的风险：当模型 A 生成数据训练模型 B，模型 B 再生成数据训练模型 C……经过多轮迭代后，模型的多样性会严重退化。

**数学直觉**：
- 每一轮合成都是对原始分布的一次近似
- 近似过程中，低概率但有价值的模式（长尾分布）会逐渐消失
- 经过 N 轮，输出分布趋向于退化的高峰分布

**在中训练中的实践意义**：
- **永远不要用 100% 合成数据做中训练**
- **混入真实数据是必要条件，但不是充分条件**——ICLR 2025 的研究发现，即使混入 99.9% 真实数据 + 仅 0.1% 合成数据，model collapse 仍可能在多轮迭代后发生。这意味着没有简单的"安全比例阈值"
- **验证机制是关键**：2026 年的研究表明，打破 collapse 循环的有效手段不是调整混合比例，而是对合成数据做自动质量验证——只有通过验证的合成样本才能进入训练集
- **数据溯源**：水印技术正在成为 collapse 预防的重要工具——标记合成数据的来源和代次，使得多轮迭代中的"数据血统"可追踪

> **Model Collapse 认知的三次修正**
> - 2024 Nature：发现了 collapse 现象，结论是"混入真实数据维持多样性"
> - 2025 ICLR：发现即使 0.1% 合成数据也可能引发 collapse——问题比预想的更严重
> - 2026 ICML：验证驱动的逃逸方案——对合成数据做自动验证（而非单纯混合真实数据）可以打破 collapse 循环

**更新后的建议**：不再给出固定的"安全合成比例"。取而代之的原则是——合成数据可以使用，但**每一条合成样本都必须通过独立的质量验证**（自动或人工），且在多轮迭代场景下需要数据溯源机制。

### 合成数据的质量控制

```python
"""
中训练合成数据的质量控制管线
"""

from typing import List, Optional
from dataclasses import dataclass

@dataclass
class SyntheticQualityCheck:
    """合成数据质量检查结果"""
    factuality_score: float = 0.0    # 事实性 (0-1)
    coherence_score: float = 0.0     # 连贯性 (0-1)
    diversity_score: float = 0.0     # 与已有数据的差异度 (0-1)
    difficulty_level: str = ""       # 难度级别
    pass_all: bool = False           # 是否通过全部检查

def quality_control_pipeline(
    synthetic_docs: List[str],
    reference_docs: List[str],       # 对比用的真实文档
    batch_size: int = 100,
    factuality_threshold: float = 0.8,
    coherence_threshold: float = 0.7,
    diversity_threshold: float = 0.3,
) -> dict:
    """
    合成数据质量控制管线

    三层过滤：
    1. 自动检查（格式、长度、语言）
    2. 模型打分（事实性、连贯性）
    3. 多样性检查（与已有数据的差异）
    """
    results = {
        "total": len(synthetic_docs),
        "passed": 0,
        "failed_factuality": 0,
        "failed_coherence": 0,
        "failed_diversity": 0,
        "passed_docs": [],
    }

    for doc in synthetic_docs:
        # 层 1：格式检查
        if len(doc.split()) < 50:
            continue  # 太短

        # 层 2：事实性和连贯性
        # （实际中会调用 LLM 打分或专门的分类器）
        factuality = estimate_factuality(doc)
        coherence = estimate_coherence(doc)

        if factuality < factuality_threshold:
            results["failed_factuality"] += 1
            continue
        if coherence < coherence_threshold:
            results["failed_coherence"] += 1
            continue

        # 层 3：多样性（与已有数据的差异度）
        diversity = estimate_diversity(doc, reference_docs)
        if diversity < diversity_threshold:
            results["failed_diversity"] += 1
            continue

        results["passed"] += 1
        results["passed_docs"].append(doc)

    results["pass_rate"] = results["passed"] / max(results["total"], 1)
    return results

def estimate_factuality(doc: str) -> float:
    """事实性评估（简化版，实际应调用 LLM 或专用模型）"""
    # 检查常见的幻觉信号
    hallucination_signals = [
        "据研究表明",  # 没有具体引用
        "众所周知",     # 可能是错误的"常识"
    ]
    score = 1.0
    for signal in hallucination_signals:
        if signal in doc:
            score -= 0.1
    return max(score, 0.0)

def estimate_coherence(doc: str) -> float:
    """连贯性评估（简化版）"""
    sentences = doc.split("。")
    if len(sentences) < 3:
        return 0.5
    return min(1.0, len(sentences) / 50)  # 简化的占位逻辑

def estimate_diversity(doc: str, reference_docs: List[str]) -> float:
    """多样性评估（与参考文档的差异度）"""
    # 简化：使用 n-gram 重叠率
    doc_ngrams = set(doc.split()[:100])  # 取前 100 个词
    max_overlap = 0
    for ref in reference_docs[:1000]:  # 采样对比
        ref_ngrams = set(ref.split()[:100])
        overlap = len(doc_ngrams & ref_ngrams) / max(len(doc_ngrams), 1)
        max_overlap = max(max_overlap, overlap)
    return 1 - max_overlap
```

---

## 9.4 中训练数据的实战案例

### 案例：从通用模型到强代码+数学模型

**目标**：在一个 13B 通用模型上，通过中训练显著提升代码和数学能力，同时保持通用能力。

**约束**：
- 预训练模型：13B 参数，在 5T token 上预训练
- 可用 GPU：256 × A100 80G
- 时间约束：3 周

**数据策略设计：**

```
Step 1: 数据预算计算
  - 可训练 token 数 ≈ 256 GPU × 3 周 × ~500M token/GPU/天
  - 总计约 260B token

Step 2: 数据配比设计（260B token）
  ┌───────────────────────────────────────┐
  │  代码数据 (Tier 1+2)    : 90B (35%)  │
  │  数学数据              : 40B (15%)   │
  │  合成数学题            : 15B (6%)    │
  │  高质量网页（回放）      : 60B (23%)   │
  │  书籍 + 学术论文       : 25B (10%)   │
  │  中文高质量数据         : 20B (8%)    │
  │  代码相关自然语言       : 10B (4%)    │
  └───────────────────────────────────────┘

Step 3: 训练配置
  - 起始学习率：1.5e-5（预训练峰值的约 1/5）
  - 退火策略：余弦退火到 1e-6
  - Batch size：4M token
  - 上下文长度：前 200B 用 8K，后 60B 扩展到 32K

Step 4: 监控与评估
  - 每 20B token 在 proxy benchmark 上评估
  - 重点关注：HumanEval (代码), GSM8K (数学), HellaSwag (通用)
  - 遗忘监控：C-Eval (中文), MMLU (英文)
```

**预期效果（基于类似实践的估计）：**

| Benchmark | 中训练前 | 中训练后 | 变化 |
|-----------|---------|---------|------|
| HumanEval (pass@1) | 28% | 52% | +24% |
| GSM8K | 40% | 62% | +22% |
| MATH | 12% | 24% | +12% |
| HellaSwag | 72% | 71% | -1% |
| MMLU | 55% | 54% | -1% |
| C-Eval | 48% | 47% | -1% |

关键观察：代码和数学能力大幅提升，通用能力轻微退化（在可接受范围内）。

---

> **本章要点回顾**
>
> 1. **长上下文数据**：代码仓库和书籍是最佳来源；必须与短文档混合；128K 已是基线，4M 级别已经可行，超长样本比例可低至 <5%
> 2. **代码数据**：质量分层是基础（Tier 1-4）；低质量代码可通过 Transform-and-Retain 改写管线升级而非直接丢弃；仓库级代码优于文件级
> 3. **数学数据**：合成策略包括数值替换、条件变换、强模型生成、形式化验证（已从"成本高"升级为"可规模化引擎"）、格式转换五种
> 4. **领域数据**：知识密度是核心指标；配比方法从经验法则演进到 Scaling Laws 数学模型再到 Data Mixing Agent 自动学习
> 5. **有限数据场景**：<1B token 时，指令式知识注入可能优于传统 CPT
> 6. **合成数据**：是有价值的工具但不是银弹；Model Collapse 比预想更严重（0.1% 合成即可引发），关键在于验证机制而非固定比例
> 7. **质量控制**：三层过滤（格式→模型打分→多样性）；人工抽检不可省略；合成数据需数据溯源

---

## 🛠 动手环节

### 练习 1：代码质量评分器
从 The Stack v2 数据集中随机采样 100 个 Python 文件，为每个文件计算质量分数。分析：
- 各质量层级的文件分布
- 哪些指标最能区分高低质量代码

### 练习 2：设计一个长上下文训练课程
假设你要将一个 8K 上下文的模型扩展到 128K。设计一个 5 阶段的训练课程，包括：
- 每个阶段的上下文长度、训练量、数据来源
- RoPE base frequency 的调整方案
- 每个阶段的评估标准

### 练习 3：合成数学数据
使用一个可用的 LLM API，生成 100 道中等难度的数学题（含解答步骤）。然后：
- 手动验证每道题的答案正确性
- 评估解题步骤的逻辑性
- 统计错误率和错误类型

