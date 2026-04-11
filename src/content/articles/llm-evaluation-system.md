---
title: "LLM 评估体系设计与 Benchmark 选择"
description: "如何为大模型构建科学的评估体系：Benchmark 选择、评估方法论、结果分析和常见陷阱。"
date: 2026-03-13
category: "技术文档"
tags: ["评估", "Benchmark", "MMLU", "HumanEval", "评估方法论"]
---

## 为什么评估如此重要？

没有好的评估体系，模型训练就像在黑暗中摸索。评估体系的核心作用：

1. **指导训练方向**：数据配比、超参调优都依赖评估反馈
2. **发现模型短板**：系统性地识别模型的薄弱环力
3. **横向对比**：在公平基准上比较不同方案的效果
4. **防止过拟合**：监控训练过程中的泛化能力变化

## 主流 Benchmark 全景图

### 通用知识与推理

| Benchmark | 规模 | 评估内容 | 难度 | 评估方式 |
|-----------|------|---------|------|---------|
| **MMLU** | 14K 题 | 57 学科知识 | 中 | 4 选 1 |
| **MMLU-Pro** | 12K 题 | MMLU 升级版，10 选 1 | 高 | 10 选 1 |
| **ARC-Challenge** | 2.6K 题 | 科学推理 | 中 | 4 选 1 |
| **HellaSwag** | 10K 题 | 常识推理/句子补全 | 中 | 4 选 1 |
| **Winogrande** | 1.3K 题 | 常识消歧 | 中 | 2 选 1 |
| **TruthfulQA** | 817 题 | 事实准确性 | 高 | 多选/生成 |

### 数学推理

| Benchmark | 规模 | 评估内容 | 难度 | 评估方式 |
|-----------|------|---------|------|---------|
| **GSM8K** | 1.3K 题 | 小学数学应用题 | 低-中 | 计算结果匹配 |
| **MATH** | 5K 题 | 高中/竞赛数学 | 高 | 计算结果匹配 |
| **AIME 2024** | 30 题 | 数学竞赛 | 极高 | 精确匹配 |
| **MathBench** | 3.7K 题 | 多阶段数学 | 中-高 | 混合 |

### 代码能力

| Benchmark | 规模 | 评估内容 | 难度 | 评估方式 |
|-----------|------|---------|------|---------|
| **HumanEval** | 164 题 | Python 函数生成 | 中 | 执行测试用例 |
| **HumanEval+** | 164 题 | 增强测试用例 | 中-高 | 执行测试用例 |
| **MBPP** | 974 题 | Python 基础编程 | 低-中 | 执行测试用例 |
| **LiveCodeBench** | 持续更新 | 竞赛编程 | 高 | 执行测试用例 |
| **SWE-bench** | 2.3K 题 | 真实 GitHub Issue 修复 | 极高 | PR 测试通过 |

### 中文能力

| Benchmark | 规模 | 评估内容 | 难度 | 评估方式 |
|-----------|------|---------|------|---------|
| **C-Eval** | 13.9K 题 | 52 科中文知识 | 中 | 4 选 1 |
| **CMMLU** | 11.5K 题 | 67 主题中文知识 | 中 | 4 选 1 |
| **GAOKAO** | 多科 | 中国高考题 | 高 | 混合 |

### 长上下文

| Benchmark | 评估内容 | 上下文长度 |
|-----------|---------|-----------|
| **RULER** | 多种检索/推理任务 | 4K-128K |
| **LongBench** | 跨文档 QA/摘要 | 4K-32K |
| **Needle in a Haystack** | 信息检索 | 可变 |
| **InfiniteBench** | 超长上下文理解 | 100K+ |

## 评估体系设计

### 评估矩阵

根据模型的目标用途，选择合适的评估矩阵：

```yaml
# 通用基座模型评估矩阵
evaluation_matrix:
  tier1_must_have:  # 必须评估
    knowledge:
      - mmlu (en)
      - ceval (zh)
    reasoning:
      - gsm8k
      - arc_challenge
    code:
      - humaneval
      - mbpp
    
  tier2_recommended:  # 建议评估
    knowledge:
      - mmlu_pro
      - cmmlu
    math:
      - math
      - aime_2024
    code:
      - humaneval_plus
      - livecodebench
    language:
      - hellaswag
      - winogrande
    safety:
      - truthfulqa
    
  tier3_nice_to_have:  # 可选评估
    long_context:
      - ruler
      - longbench
    instruction_following:
      - ifeval
      - mt_bench
    multilingual:
      - mgsm (多语言 GSM8K)
```

### 针对中训练的评估设计

中训练需要同时关注"提升"和"保持"两个维度：

```yaml
mid_training_evaluation:
  target_improvement:  # 期望提升的指标
    primary:
      - benchmark: "target_benchmark"
        baseline: 38.2
        target: 55.0
        must_achieve: true
    secondary:
      - benchmark: "related_benchmark"
        baseline: 42.1
        target: 48.0
        must_achieve: false
  
  regression_monitoring:  # 监控不退化的指标
    strict:  # 不能降超过 3%
      - mmlu
      - humaneval
    moderate:  # 不能降超过 5%
      - arc_challenge
      - hellaswag
    relaxed:  # 不能降超过 10%
      - winogrande
      - truthfulqa
```

## 评估方法论

### Few-shot vs Zero-shot

```python
# 不同 shot 设置对分数的影响
# 以 MMLU 为例的典型表现
shot_impact = {
    "0-shot": 58.3,
    "3-shot": 62.1,  # +3.8
    "5-shot": 63.5,  # +5.2
    "10-shot": 63.8,  # +5.5 (边际收益递减)
}
```

**建议**：
- 报告分数时**必须标注 shot 数**
- 横向对比时确保 shot 数一致
- 通用做法：MMLU 用 5-shot，GSM8K 用 8-shot，HumanEval 用 0-shot

### Prompt 格式的影响

同一个 benchmark，不同的 prompt 格式可能导致 5-10% 的分数差异：

```python
# MMLU 的两种常见 prompt 格式

# 格式 A: 直接选择
prompt_a = """
Question: {question}
A. {choice_a}
B. {choice_b}  
C. {choice_c}
D. {choice_d}
Answer:"""

# 格式 B: Chain-of-thought
prompt_b = """
Question: {question}
A. {choice_a}
B. {choice_b}
C. {choice_c}
D. {choice_d}

Let me think step by step.
"""

# 格式 C: 特定于模型的 chat template
prompt_c = """<|im_start|>user
{question}
A. {choice_a}
B. {choice_b}
C. {choice_c}
D. {choice_d}
请选择正确答案。<|im_end|>
<|im_start|>assistant
"""
```

**建议**：使用标准评估框架（如 lm-evaluation-harness）确保 prompt 一致性。

### 采样策略

代码和数学 benchmark 通常使用 **pass@k** 指标：

```python
def pass_at_k(n: int, c: int, k: int) -> float:
    """
    n: 总生成数
    c: 通过测试的数量
    k: pass@k 的 k
    """
    if n - c < k:
        return 1.0
    return 1.0 - math.comb(n - c, k) / math.comb(n, k)

# 推荐设置
EVAL_CONFIG = {
    "humaneval": {
        "n_samples": 200,      # 每题生成 200 个
        "temperature": 0.8,
        "top_p": 0.95,
        "report": ["pass@1", "pass@10", "pass@100"],
    },
    "gsm8k": {
        "n_samples": 1,        # 贪婪解码
        "temperature": 0.0,
        "report": ["accuracy"],
    },
    "mmlu": {
        "n_samples": 1,
        "method": "log_likelihood",  # 比较各选项的 log prob
        "report": ["accuracy"],
    },
}
```

## 评估工具链

### lm-evaluation-harness

目前最广泛使用的开源评估框架：

```bash
# 安装
pip install lm-eval

# 评估示例
lm_eval --model hf \
    --model_args pretrained=meta-llama/Meta-Llama-3-8B \
    --tasks mmlu,gsm8k,humaneval,arc_challenge \
    --num_fewshot 5 \
    --batch_size 16 \
    --output_path results/
```

### OpenCompass

国内社区广泛使用的评估框架，对中文 benchmark 支持更好：

```bash
# 安装
pip install opencompass

# 评估
python run.py \
    --models meta-llama/Meta-Llama-3-8B \
    --datasets mmlu ceval gsm8k humaneval \
    --work-dir results/
```

### 自建评估服务

对于频繁评估的场景，建议搭建评估服务：

```yaml
# eval_service_config.yaml
service:
  name: "llm-eval-service"
  port: 8080
  
  # 模型接入
  model_backends:
    - type: "vllm"
      url: "http://localhost:8000/v1"
    - type: "tgi"
      url: "http://localhost:8001"
  
  # 评估任务配置
  tasks:
    quick_eval:  # 快速评估（~30 min）
      benchmarks: [mmlu_lite, gsm8k, humaneval]
      description: "训练中间 checkpoint 快速评估"
      
    full_eval:  # 完整评估（~4 hours）
      benchmarks: [mmlu, mmlu_pro, ceval, cmmlu, gsm8k, math,
                   humaneval, humaneval_plus, mbpp, arc_challenge,
                   hellaswag, winogrande, truthfulqa]
      description: "最终模型完整评估"
    
    chinese_eval:  # 中文专项
      benchmarks: [ceval, cmmlu, gaokao, gsm8k_zh]
```

## 结果分析方法

### 分数可视化

**雷达图**：直观展示多维能力分布

```python
import matplotlib.pyplot as plt
import numpy as np

def plot_radar(models: dict[str, dict[str, float]], 
               benchmarks: list[str]):
    """
    models: {"model_name": {"mmlu": 65.2, "gsm8k": 58.3, ...}}
    """
    angles = np.linspace(0, 2*np.pi, len(benchmarks), endpoint=False)
    angles = np.concatenate([angles, [angles[0]]])  # 闭合
    
    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
    
    for name, scores in models.items():
        values = [scores[b] for b in benchmarks]
        values += [values[0]]  # 闭合
        ax.plot(angles, values, label=name)
        ax.fill(angles, values, alpha=0.1)
    
    ax.set_thetagrids(angles[:-1] * 180/np.pi, benchmarks)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1))
    plt.title("Model Comparison")
    plt.tight_layout()
    return fig
```

### 统计显著性

单次评估的分数波动可能很大，需要做统计显著性检验：

```python
from scipy import stats

def is_significant_improvement(
    scores_a: list[float],  # 模型 A 的多次评估分数
    scores_b: list[float],  # 模型 B 的多次评估分数
    alpha: float = 0.05,
) -> dict:
    """配对 t 检验"""
    t_stat, p_value = stats.ttest_rel(scores_b, scores_a)
    
    return {
        "mean_a": np.mean(scores_a),
        "mean_b": np.mean(scores_b),
        "improvement": np.mean(scores_b) - np.mean(scores_a),
        "p_value": p_value,
        "significant": p_value < alpha,
        "confidence": f"{(1-alpha)*100}%",
    }
```

### 错误分析

除了看分数，更重要的是分析错误模式：

```python
def error_analysis(model_outputs: list[dict]) -> dict:
    """
    对模型在 benchmark 上的错误进行分类分析
    """
    error_types = {
        "knowledge_gap": [],      # 知识缺失
        "reasoning_error": [],     # 推理错误
        "instruction_mismatch": [], # 指令理解错误
        "format_error": [],        # 输出格式错误
        "calculation_error": [],   # 计算错误
    }
    
    for item in model_outputs:
        if item["correct"]:
            continue
        
        # 分类错误类型（简化示例）
        pred = item["prediction"]
        gold = item["gold"]
        
        if item.get("has_correct_reasoning") and not item["correct"]:
            error_types["calculation_error"].append(item)
        elif item.get("misunderstood_question"):
            error_types["instruction_mismatch"].append(item)
        # ... 更多分类逻辑
    
    # 统计
    total_errors = sum(len(v) for v in error_types.values())
    return {
        etype: {
            "count": len(errors),
            "ratio": len(errors) / max(total_errors, 1),
            "examples": errors[:3],  # 前 3 个示例
        }
        for etype, errors in error_types.items()
    }
```

## 常见陷阱

### 陷阱 1: Benchmark Contamination

**问题**：训练数据中包含评估数据。这是预训练数据处理中最需要警惕的问题。

**检测方法**：
```python
# 8-gram 重叠检测
def check_contamination(train_data: str, test_item: str, n: int = 8):
    """检测训练数据中是否包含测试题目"""
    test_ngrams = set()
    words = test_item.split()
    for i in range(len(words) - n + 1):
        test_ngrams.add(" ".join(words[i:i+n]))
    
    train_words = train_data.split()
    for i in range(len(train_words) - n + 1):
        ngram = " ".join(train_words[i:i+n])
        if ngram in test_ngrams:
            return True, ngram
    
    return False, None
```

**预防措施**：
- 数据处理 pipeline 中加入去污染步骤
- 使用 n-gram 匹配检测训练数据与所有 benchmark 的重叠
- 发布模型时报告去污染结果

### 陷阱 2: 过度优化特定 Benchmark

**问题**：针对 MMLU 格式做特殊优化（如在训练数据中加入大量 ABCD 选择题），导致 MMLU 分数虚高，但实际能力没有提升。

**检测**：使用同领域但不同格式的评估
```python
# MMLU 用选择题 vs 同领域知识用开放式问答
mmlu_score = 72.5       # 选择题分数
open_qa_score = 45.2    # 同领域开放式问答
gap = mmlu_score - open_qa_score  # 如果 gap > 20，可能过拟合了格式
```

### 陷阱 3: 忽略评估的随机性

**问题**：单次评估结果的波动可能很大。

```python
# 实际测量：同一模型多次评估 GSM8K 的结果
run_1 = 56.8
run_2 = 58.2
run_3 = 55.9
run_4 = 57.5
# 标准差约 1.0，所以 ±1.5% 以内的差异可能没有意义
```

**建议**：
- 重要对比至少评估 3 次取平均
- 报告标准差或置信区间
- 差异 < 2% 时谨慎声称"提升"

### 陷阱 4: Benchmark Saturation

**问题**：某些 benchmark 已经接近饱和，区分度不够。

```python
# 2024 年底部分 benchmark 的 SOTA
saturated_benchmarks = {
    "HellaSwag": 95.7,      # 接近人类水平
    "Winogrande": 87.5,     # 区分度下降
    "ARC-Easy": 98.2,       # 已经没有区分度
    "BoolQ": 93.8,          # 接近饱和
}

# 仍有区分度的 benchmark
discriminating_benchmarks = {
    "MMLU-Pro": 72.1,       # 10 选 1，更难
    "MATH": 67.8,           # 数学竞赛级别
    "SWE-bench": 43.8,      # 真实工程问题
    "AIME 2024": 72.6,      # 数学竞赛
    "LiveCodeBench": 45.2,  # 持续更新
}
```

**建议**：使用更难的 benchmark 替代已饱和的；关注持续更新的动态 benchmark。

## 构建评估报告模板

```markdown
# 模型评估报告

## 基本信息
- 模型: {model_name}
- 参数量: {param_count}
- 训练数据: {data_summary}
- 评估日期: {date}
- 评估框架: lm-evaluation-harness v0.4.x

## 总分概览

| 类别 | Benchmark | Shot | 分数 | vs Baseline |
|------|-----------|------|------|-------------|
| 知识 | MMLU | 5 | XX.X | +X.X |
| 知识(中) | C-Eval | 5 | XX.X | +X.X |
| 数学 | GSM8K | 8 | XX.X | +X.X |
| 数学 | MATH | 4 | XX.X | +X.X |
| 代码 | HumanEval | 0 | XX.X | +X.X |
| 推理 | ARC-C | 25 | XX.X | +X.X |

## 详细分析

### 强项
- ...

### 弱项
- ...

### 错误模式分析
- ...

## 结论与建议
- ...
```

## 参考资源

1. lm-evaluation-harness: https://github.com/EleutherAI/lm-evaluation-harness
2. OpenCompass: https://github.com/open-compass/opencompass
3. Chatbot Arena: https://chat.lmsys.org
4. Open LLM Leaderboard: https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard
5. LiveCodeBench: https://livecodebench.github.io
6. A Survey on Evaluation of Large Language Models (2023)
