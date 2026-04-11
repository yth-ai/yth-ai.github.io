---
title: "合成数据——银弹还是定时炸弹？"
description: "合成数据全景、Model Collapse、Scaling Law 与质量控制"
date: 2026-03-21
updatedDate: 2026-03-22
bookSlug: "data-engineering"
chapter: 17
part: "第五部分：横切主题"
partOrder: 5
tags: [合成数据,Model Collapse,Scaling Law]
---

> *"合成数据不是魔法。它是一面放大镜——放大优点，也放大缺陷。"*
>
> *2025 年，合成数据从"锦上添花"变成了"不可或缺"。但这面放大镜照出了两种截然不同的前途：一边是 Phi 系列证明了高质量合成数据可以让小模型逼近大模型的能力；另一边是多项研究发现不加控制的合成数据会导致不可逆的模型退化。这一章，我们要搞清楚这条钢丝该怎么走。*

---

## 17.1 合成数据的全景图

### 为什么合成数据变得不可或缺

合成数据在大模型中的角色经历了一个认知转变：

```
认知演变时间线：

2022 年  "合成数据只是数据增强的手段之一"
    ↓
2023 年  Phi-1 发布："教科书即一切"——高质量合成数据训练出的 1.3B 模型
         在编码能力上超过很多 10B+ 模型
    ↓
2024 年  两个方向同时爆发：
         ✅ Phi-3/4 → 合成数据是小模型崛起的关键
         ❌ Nature 论文 → Model Collapse 是真实风险
    ↓
2025 年  "第二代合成数据"兴起：
         → 合成不是简单生成，而是带验证、带反馈、带课程的工程
         → EMNLP 论文量化了合成数据的 Scaling Law
    ↓
2026 年  合成数据成为每个训练阶段的标配
         → 但混合比例、质量控制、多样性保证变成核心工程问题
```

### 不同阶段的合成数据策略

合成数据在大模型的每个训练阶段都有应用，但角色、方法和风险各不相同：

| 阶段 | 合成数据类型 | 生成方法 | 目的 | 推荐比例 | 关键风险 |
|------|------------|---------|------|---------|---------|
| 预训练 | 改写、翻译、摘要、教科书化 | 大模型改写 + 模板化 | 增加数据量和多样性 | 5-20% | 信息损失、风格均一化 |
| 中训练 | 教科书化、知识增强、代码生成 | 种子知识 + 大模型扩展 | 提高知识密度 | 10-30% | 幻觉传播、模式坍缩 |
| SFT | 指令合成、回复合成、对话生成 | Self-Instruct / Evol-Instruct | 扩大覆盖面 | 30-80% | 多样性不足、质量下限 |
| RL | 偏好合成、自我对弈、拒绝采样 | On-policy 生成 + 验证 | 自动化偏好学习 | 50-100% | 奖励黑客、分布偏移 |

> **🔍 反直觉发现**：很多人以为合成数据主要用于 SFT 阶段。实际上，2025-2026 年最大的变化发生在**预训练阶段**——Apple、Microsoft（Phi 系列）、HuggingFace 都在预训练中引入了大量合成数据来改善数据质量，这在两年前是不可想象的。

### 合成数据的三大范式

不同的合成方法产出的数据质量、多样性和成本差异巨大：

**范式 1：基于改写（Rephrasing）**
```
输入: 一篇维基百科原文
   ↓ Prompt: "请将这段文字改写为教科书风格，适合大学生阅读"
输出: 同一内容的教科书版本

特点：信息保真度高，但多样性受限于原文
成本：~$0.5/1M tokens（使用 API）
典型应用：Phi-1/2/3 的预训练数据
```

**范式 2：基于种子扩展（Seed-based Generation）**
```
输入: 一个知识种子（如 "微积分基本定理"）
   ↓ Prompt: "以此为主题，写一个包含例题和解析的教学章节"
输出: 一个完整的教学内容

特点：内容丰富度高，但需要验证准确性
成本：~$2/1M tokens
典型应用：中训练知识增强
```

**范式 3：基于进化（Evolution-based）**
```
输入: 一条简单指令 "写一首诗"
   ↓ Evol-Instruct: 增加约束、深化、具体化、增加推理步骤
第1代: "写一首关于春天的诗"
第2代: "写一首关于春天的七言绝句，要求包含'燕'字"
第3代: "以王维的风格写一首关于春天的七言绝句，要求首联含'燕'，尾联含'柳'..."

特点：多样性好，但可能偏离实际用户需求分布
成本：~$5/1M tokens（多轮生成）
典型应用：WizardLM 的 SFT 数据
```

---

## 17.2 合成数据的管线实现

### 通用合成管线架构

一个生产级合成数据管线需要以下组件：

```python
"""
合成数据管线框架
支持多种合成策略、质量过滤、多样性控制
"""
import json
import hashlib
from dataclasses import dataclass, field
from collections import Counter
from typing import Callable

@dataclass
class SyntheticSample:
    """合成数据样本"""
    content: str
    source_type: str          # "rephrased" | "seed_expanded" | "evolved" | "translated"
    seed_id: str              # 种子数据 ID（用于溯源）
    generator_model: str      # 生成模型名称
    generation_config: dict   # 生成参数（温度、top_p 等）
    quality_scores: dict = field(default_factory=dict)
    metadata: dict = field(default_factory=dict)

class SyntheticDataPipeline:
    """合成数据管线"""

    def __init__(self, generator_fn: Callable, quality_scorer_fn: Callable):
        self.generator = generator_fn
        self.quality_scorer = quality_scorer_fn
        self.generated_hashes = set()  # 用于去重

    def generate_batch(
        self,
        seeds: list[dict],
        strategy: str = "rephrase",
        n_variants: int = 3,
        temperature: float = 0.7,
        min_quality: float = 0.6,
    ) -> list[SyntheticSample]:
        """
        从种子数据批量生成合成样本

        Args:
            seeds: 种子数据列表，每个包含 content 和 id
            strategy: 合成策略
            n_variants: 每个种子生成的变体数
            temperature: 生成温度（越高越多样）
            min_quality: 最低质量分数阈值
        """
        results = []
        prompt_template = self._get_prompt_template(strategy)

        for seed in seeds:
            for i in range(n_variants):
                # 生成
                prompt = prompt_template.format(
                    content=seed["content"],
                    variant_hint=f"变体 {i+1}，尝试不同的表达方式和角度"
                )
                output = self.generator(
                    prompt,
                    temperature=temperature + i * 0.1,  # 逐渐增加温度提高多样性
                    max_tokens=2048,
                )

                # 去重检查
                content_hash = hashlib.md5(output.encode()).hexdigest()
                if content_hash in self.generated_hashes:
                    continue
                self.generated_hashes.add(content_hash)

                # 质量评估
                scores = self.quality_scorer(output, seed["content"])

                sample = SyntheticSample(
                    content=output,
                    source_type=strategy,
                    seed_id=seed["id"],
                    generator_model="llm-api",
                    generation_config={"temperature": temperature + i * 0.1},
                    quality_scores=scores,
                )

                # 质量过滤
                if scores.get("overall", 0) >= min_quality:
                    results.append(sample)

        return results

    def _get_prompt_template(self, strategy: str) -> str:
        templates = {
            "rephrase": (
                "请将以下内容改写为清晰易懂的教科书风格。保留所有关键信息，"
                "但改善表达的清晰度和教学效果。{variant_hint}\n\n"
                "原文：\n{content}\n\n改写版："
            ),
            "expand": (
                "基于以下知识点，撰写一段详细的教学内容。包含：\n"
                "1. 概念解释 2. 具体例子 3. 常见误区 4. 总结\n"
                "{variant_hint}\n\n知识点：\n{content}\n\n教学内容："
            ),
            "translate_style": (
                "将以下技术内容转换为面向初学者的通俗解释。"
                "使用类比和日常生活中的例子。{variant_hint}\n\n"
                "原文：\n{content}\n\n通俗版："
            ),
        }
        return templates.get(strategy, templates["rephrase"])

    def diversity_check(self, samples: list[SyntheticSample]) -> dict:
        """检查一批合成数据的多样性"""
        # 1. N-gram 多样性
        all_trigrams = []
        for s in samples:
            words = s.content.split()
            trigrams = [tuple(words[i:i+3]) for i in range(len(words)-2)]
            all_trigrams.extend(trigrams)

        unique_ratio = len(set(all_trigrams)) / max(len(all_trigrams), 1)

        # 2. 开头多样性（检测模式坍缩的早期信号）
        openings = [s.content[:50] for s in samples]
        unique_openings = len(set(openings)) / max(len(openings), 1)

        # 3. 长度分布
        lengths = [len(s.content) for s in samples]
        length_std = (sum((l - sum(lengths)/len(lengths))**2 for l in lengths) / len(lengths)) ** 0.5

        return {
            "trigram_unique_ratio": round(unique_ratio, 4),
            "opening_unique_ratio": round(unique_openings, 4),
            "length_mean": round(sum(lengths) / len(lengths), 1),
            "length_std": round(length_std, 1),
            "sample_count": len(samples),
            "health": "good" if unique_ratio > 0.7 and unique_openings > 0.8 else "warning",
        }
```

### 各阶段的具体合成策略

**预训练阶段：教科书化改写**

Phi 系列的核心洞察是：**数据质量比数据量更重要**。通过将网络文本改写为教科书风格，可以在更少的 token 上训练出更强的模型。

```python
"""
预训练合成数据：教科书化改写管线
参考 Phi-1 "Textbooks Are All You Need" 的方法
"""

TEXTBOOK_PROMPT = """你是一位优秀的大学教授。请将以下网络文本改写为高质量的教科书段落。

要求：
1. 保留所有核心知识点和技术细节
2. 使用清晰的结构：概念定义 → 原理解释 → 示例 → 总结
3. 去除广告、个人观点、口语化表达
4. 如果原文包含代码，保留并添加注释
5. 对于不确定的事实，标注"需要验证"

原始文本：
{raw_text}

教科书版本："""

# 质量过滤：教科书化内容的评估维度
QUALITY_RUBRIC = {
    "coherence": "内容是否逻辑连贯、结构清晰",
    "informativeness": "信息密度是否足够（避免废话）",
    "accuracy": "改写是否保留了原文的关键事实",
    "educational_value": "是否适合作为学习材料",
    "fluency": "语言是否流畅自然（非机器翻译腔）",
}
```

**SFT 阶段：Self-Instruct + Evol-Instruct**

```python
"""
SFT 合成数据：指令进化管线
结合 Self-Instruct (Stanford) + Evol-Instruct (WizardLM)
"""

# 阶段 1：从种子指令生成新指令（Self-Instruct）
SELF_INSTRUCT_PROMPT = """以下是一些高质量的指令示例：
{seed_instructions}

请生成 5 条新的、不同类别的指令。
要求：
- 涵盖不同的任务类型（问答/分析/创作/代码/推理）
- 避免与示例相似
- 指令应该清晰、可执行
- 难度适中

新指令："""

# 阶段 2：指令进化（Evol-Instruct）
EVOLUTION_STRATEGIES = {
    "add_constraints": "在原指令基础上增加 2-3 个约束条件",
    "deepen": "要求更深入的分析或更详细的解释",
    "concretize": "将抽象指令具体化到某个领域或场景",
    "add_reasoning": "要求展示推理过程，而不仅仅是最终答案",
    "complicate": "增加任务复杂度，如多步骤推理、条件分支",
    "broaden": "扩大任务范围，要求综合多个知识领域",
}

def evolve_instruction(instruction: str, strategy: str, model_fn) -> str:
    """单步指令进化"""
    prompt = (
        f"请对以下指令进行'{EVOLUTION_STRATEGIES[strategy]}'的变换。\n"
        f"保持核心意图不变，但提高复杂度和挑战性。\n\n"
        f"原始指令：{instruction}\n\n进化后的指令："
    )
    return model_fn(prompt, temperature=0.7)

def multi_step_evolution(
    seed_instruction: str,
    model_fn,
    n_generations: int = 3,
) -> list[str]:
    """多步进化，生成一系列难度递增的指令"""
    chain = [seed_instruction]
    strategies = ["add_constraints", "deepen", "complicate"]

    for i in range(min(n_generations, len(strategies))):
        evolved = evolve_instruction(chain[-1], strategies[i], model_fn)
        chain.append(evolved)

    return chain
```

**RL 阶段：拒绝采样 + 自验证**

```python
"""
RL 合成数据：On-policy 拒绝采样
DeepSeek-R1 风格的自我生成 + 验证
"""

def rejection_sampling_for_math(
    problems: list[dict],
    policy_model_fn,
    n_samples: int = 64,
    temperature: float = 0.8,
) -> list[dict]:
    """
    拒绝采样生成数学 RL 训练数据

    对每个问题:
    1. 用 policy model 采样 N 个解
    2. 通过答案验证筛选正确解
    3. 保留正确解作为正样本，错误解作为负样本
    """
    rl_data = []

    for problem in problems:
        prompt = f"Problem: {problem['question']}\n\nSolve step by step:"
        solutions = []

        for _ in range(n_samples):
            response = policy_model_fn(prompt, temperature=temperature)
            answer = extract_final_answer(response)
            is_correct = (answer == problem["ground_truth"])
            solutions.append({
                "response": response,
                "answer": answer,
                "correct": is_correct,
            })

        correct_solutions = [s for s in solutions if s["correct"]]
        incorrect_solutions = [s for s in solutions if not s["correct"]]

        if correct_solutions and incorrect_solutions:
            # 选择最短的正确解（通常推理更清晰）和最长的错误解
            best_positive = min(correct_solutions, key=lambda x: len(x["response"]))
            hard_negative = max(incorrect_solutions, key=lambda x: len(x["response"]))

            rl_data.append({
                "prompt": prompt,
                "chosen": best_positive["response"],
                "rejected": hard_negative["response"],
                "pass_rate": len(correct_solutions) / n_samples,
                "difficulty": "hard" if len(correct_solutions) / n_samples < 0.3 else "medium",
            })

    return rl_data

def extract_final_answer(text: str) -> str:
    """从推理文本中提取最终答案"""
    import re
    match = re.search(r'\\boxed\{(.+?)\}', text)
    if match:
        return match.group(1).strip()
    numbers = re.findall(r'-?\d+\.?\d*', text)
    return numbers[-1] if numbers else ""
```

---

## 17.3 Model Collapse：递归训练的坍缩

### Nature 论文的核心发现

2024 年 Nature 上发表的论文《The Curse of Recursion: Training on Generated Data Makes Models Forget》（Shumailov et al.）揭示了一个深刻的风险：

**当模型 A 生成数据训练模型 B，模型 B 再生成数据训练模型 C……经过多代递归后，模型的能力会系统性地退化。**

```
递归坍缩的过程：

  真实数据分布 P_real
      ↓ 训练
  模型 1 → 生成分布 P_1（近似 P_real，有微小偏差）
      ↓ 训练
  模型 2 → 生成分布 P_2（近似 P_1，偏差累积）
      ↓ 训练
  模型 3 → 生成分布 P_3（偏差进一步累积）
      ↓
  ... 经过 N 代 ...
      ↓
  模型 N → 生成分布 P_N（严重退化，丢失长尾）
```

### 信息论视角

从信息论的角度理解坍缩：

- 每一轮合成都是对原始分布的一次**有损压缩**
- 低概率事件（长尾分布中的罕见模式）在每轮压缩中被优先丢弃
- 经过多轮后，只剩下高频模式——输出变得单一和重复

数学上，这可以用 KL 散度的不可逆性来理解：

```
D_KL(P_real || P_1) ≤ D_KL(P_real || P_2) ≤ ... ≤ D_KL(P_real || P_N)

每一代模型与真实分布的距离单调递增，
因为 KL 散度在数据处理不等式下只能增大或不变。
```

### 实验证据：坍缩的量化观察

论文中的实验揭示了几个重要的量化规律：

| 代数 | PPL 变化 | Unique 3-gram 比例 | 下游任务准确率 | 可观察现象 |
|------|---------|-------------------|-------------|-----------|
| 第 0 代（真实数据） | 基准 | 100% | 基准 | 正常 |
| 第 1 代 | +2-5% | ~95% | -0.5~1% | 几乎看不出差异 |
| 第 3 代 | +10-20% | ~80% | -3~5% | 输出开始趋同 |
| 第 5 代 | +30-50% | ~60% | -8~15% | 明显的模式重复 |
| 第 9 代 | +100%+ | ~30% | -20~40% | 严重退化，输出近乎相同 |

> **🔬 显微镜案例：Phi-3 如何避免 Model Collapse**
>
> Microsoft 的 Phi-3 模型大量使用合成数据（占训练数据约 60%），但并没有出现 Model Collapse。他们的关键做法：
>
> 1. **单代生成**：所有合成数据都由 GPT-4 直接生成，而不是用 Phi-2 的输出再训练 Phi-3——避免了递归链
> 2. **种子多样性保证**：种子数据覆盖 >20 个知识领域和 >50 种题目类型
> 3. **真实数据锚定**：即使合成数据占比很高，仍保留 ~40% 的真实网络数据
> 4. **质量过滤**：合成数据经过严格的质量过滤，淘汰率约 40%
> 5. **多模型集成**：部分合成数据使用多个不同模型（GPT-4, Claude, Gemini）生成，增加风格多样性
>
> **教训**：合成数据的"多少"不是关键，"怎么合成"才是。

### 实践防护策略

```python
"""
Model Collapse 防护：多样性监控 + 自动告警
"""

class CollapseMonitor:
    """监控合成数据管线的多样性健康度"""

    def __init__(self, baseline_stats: dict = None):
        self.baseline = baseline_stats
        self.history = []

    def check_batch(self, texts: list[str]) -> dict:
        """检查一批合成数据的健康度"""
        stats = self._compute_diversity_stats(texts)
        self.history.append(stats)

        alerts = []

        # 检查 1：绝对多样性
        if stats["unique_trigram_ratio"] < 0.5:
            alerts.append("🚨 CRITICAL: trigram 多样性 < 0.5，疑似严重坍缩")
        elif stats["unique_trigram_ratio"] < 0.7:
            alerts.append("⚠️ WARNING: trigram 多样性偏低")

        # 检查 2：相对于基线的退化
        if self.baseline:
            diversity_drop = (
                self.baseline["unique_trigram_ratio"] - stats["unique_trigram_ratio"]
            ) / self.baseline["unique_trigram_ratio"]
            if diversity_drop > 0.2:
                alerts.append(f"🚨 多样性相比基线下降 {diversity_drop:.1%}")

        # 检查 3：批次间趋势
        if len(self.history) >= 3:
            recent = [h["unique_trigram_ratio"] for h in self.history[-3:]]
            if all(recent[i] > recent[i+1] for i in range(len(recent)-1)):
                alerts.append("⚠️ 多样性连续 3 个批次下降，可能正在坍缩")

        # 检查 4：开头重复度
        openings = [t[:100] for t in texts]
        opening_unique = len(set(openings)) / len(openings)
        if opening_unique < 0.6:
            alerts.append("⚠️ 开头高度重复，模型可能在使用模板化输出")

        return {
            "stats": stats,
            "alerts": alerts,
            "health": "critical" if any("CRITICAL" in a for a in alerts)
                      else "warning" if alerts
                      else "healthy",
        }

    def _compute_diversity_stats(self, texts: list[str]) -> dict:
        from collections import Counter
        all_trigrams = []
        all_words = []
        for text in texts:
            words = text.split()
            all_words.extend(words)
            trigrams = [tuple(words[i:i+3]) for i in range(len(words)-2)]
            all_trigrams.extend(trigrams)

        trigram_counts = Counter(all_trigrams)

        return {
            "unique_trigram_ratio": len(set(all_trigrams)) / max(len(all_trigrams), 1),
            "unique_word_ratio": len(set(all_words)) / max(len(all_words), 1),
            "top10_trigram_concentration": (
                sum(c for _, c in trigram_counts.most_common(10)) / max(len(all_trigrams), 1)
            ),
            "avg_length": sum(len(t) for t in texts) / max(len(texts), 1),
            "n_samples": len(texts),
        }
```

---

## 17.4 合成数据的 Scaling Law

### EMNLP 2025 的关键发现

2025 年的研究（Demystifying Synthetic Data in LLM Pre-training, EMNLP 2025）首次系统地量化了合成数据的 scaling 规律，得出了几个重要结论：

**发现 1：边际收益递减显著**

```
合成数据比例 vs 下游任务提升（以代码能力为例）：

合成比例    HumanEval 提升    边际收益
   0% →  5%     +8.2%          +1.64%/每1%
   5% → 10%     +4.1%          +0.82%/每1%
  10% → 20%     +3.5%          +0.35%/每1%
  20% → 40%     +2.0%          +0.10%/每1%
  40% → 60%     +0.8%          +0.04%/每1%
  60% → 80%     -0.3%          < 0（开始负面影响）
  80% →100%     -2.1%          < 0（明显退化）

→ 存在一个最优点，超过之后弊大于利
→ 对于代码任务，最优合成比例约在 20-40%
```

**发现 2：最优混合比例与任务高度相关**

| 能力维度 | 最优合成比例 | 原因 |
|---------|------------|------|
| 代码生成 | 30-50% | 代码可以自动验证，合成质量有保证 |
| 数学推理 | 20-40% | 数学有标准答案，但推理路径多样性重要 |
| 知识问答 | 10-20% | 知识需要事实准确，合成容易引入幻觉 |
| 创意写作 | 5-10% | 创意高度依赖多样性，合成数据风格趋同 |
| 多语言 | 20-30% | 低资源语言可以借助翻译合成，但翻译腔是风险 |

**发现 3：质量 > 数量的量化证据**

```
实验设置：固定总 token 数 = 100B

方案 A: 100B token 全部真实数据
方案 B: 80B 真实 + 20B 低质量合成（未过滤）
方案 C: 80B 真实 + 20B 高质量合成（严格过滤，原始的 50% 被淘汰）
方案 D: 80B 真实 + 10B 高质量合成（严格过滤 + 仅保留最优的 25%）

MMLU 结果: A(62.3) < B(63.1) < D(65.8) < C(66.4)
代码结果: A(38.2) < B(40.1) < D(43.5) < C(44.7)

→ 方案 C（严格过滤的 20%）比 方案 B（未过滤的 20%）高 3 个点
→ 方案 D（10% 最优）与 方案 C（20% 过滤后）接近
→ 结论：1 份高质量合成 ≈ 4-5 份未过滤合成
```

---

## 17.5 合成数据的质量评估

### 多维度评估框架

合成数据的质量评估不能只看单一指标，需要多维度交叉验证：

```python
"""
合成数据质量评估框架
覆盖 5 个维度 × 4 层检查
"""

class SyntheticDataEvaluator:
    """合成数据多维度评估器"""

    def evaluate(self, synthetic_samples: list[str], real_samples: list[str] = None) -> dict:
        """
        全面评估一批合成数据的质量

        Args:
            synthetic_samples: 待评估的合成数据
            real_samples: 真实数据参考（用于分布比较）
        """
        results = {}

        # 维度 1: 内在质量
        results["intrinsic"] = self._intrinsic_quality(synthetic_samples)

        # 维度 2: 多样性
        results["diversity"] = self._diversity_metrics(synthetic_samples)

        # 维度 3: 与真实数据的分布一致性
        if real_samples:
            results["distributional"] = self._distributional_alignment(
                synthetic_samples, real_samples
            )

        # 维度 4: 可检测性（越难区分越好）
        if real_samples:
            results["detectability"] = self._detectability(
                synthetic_samples, real_samples
            )

        # 维度 5: 下游任务贡献（需要实际训练，这里给出估算方法）
        results["utility_proxy"] = self._utility_proxy(synthetic_samples)

        return results

    def _intrinsic_quality(self, samples: list[str]) -> dict:
        """内在质量检查"""
        issues = {"too_short": 0, "too_long": 0, "repetitive": 0, "encoding_error": 0}

        for s in samples:
            if len(s) < 100:
                issues["too_short"] += 1
            if len(s) > 50000:
                issues["too_long"] += 1
            # 重复检测：同一句话出现 3 次以上
            sentences = s.split("。")
            if len(sentences) != len(set(sentences)):
                issues["repetitive"] += 1
            try:
                s.encode('utf-8').decode('utf-8')
            except UnicodeError:
                issues["encoding_error"] += 1

        return {
            "total_samples": len(samples),
            "issues": issues,
            "pass_rate": 1 - sum(issues.values()) / (len(samples) * len(issues)),
        }

    def _diversity_metrics(self, samples: list[str]) -> dict:
        """多样性指标"""
        # Self-BLEU：越低越多样
        # 这里用简化版的 n-gram 多样性替代
        all_bigrams = []
        all_trigrams = []
        for s in samples:
            words = s.split()
            all_bigrams.extend(zip(words, words[1:]))
            all_trigrams.extend(zip(words, words[1:], words[2:]))

        return {
            "bigram_diversity": len(set(all_bigrams)) / max(len(all_bigrams), 1),
            "trigram_diversity": len(set(all_trigrams)) / max(len(all_trigrams), 1),
            "vocab_size": len(set(w for s in samples for w in s.split())),
            "avg_sample_length": sum(len(s) for s in samples) / len(samples),
        }

    def _distributional_alignment(
        self, synthetic: list[str], real: list[str]
    ) -> dict:
        """合成数据与真实数据的分布对齐度"""
        # 长度分布对比
        syn_lengths = sorted(len(s) for s in synthetic)
        real_lengths = sorted(len(s) for s in real)

        # 词频分布对比（简化版，完整版应使用 embedding 空间距离）
        syn_words = Counter(w for s in synthetic for w in s.split())
        real_words = Counter(w for s in real for w in s.split())

        # 共享词比例
        common_words = set(syn_words.keys()) & set(real_words.keys())
        vocab_overlap = len(common_words) / max(
            len(set(syn_words.keys()) | set(real_words.keys())), 1
        )

        return {
            "vocab_overlap": round(vocab_overlap, 4),
            "syn_avg_length": sum(syn_lengths) / len(syn_lengths),
            "real_avg_length": sum(real_lengths) / len(real_lengths),
            "length_ratio": (
                sum(syn_lengths) / len(syn_lengths)
            ) / max(sum(real_lengths) / len(real_lengths), 1),
        }

    def _detectability(self, synthetic: list[str], real: list[str]) -> dict:
        """可检测性评估（合成数据越难与真实数据区分越好）"""
        # 简化版：基于统计特征的可区分性
        syn_features = self._extract_features(synthetic)
        real_features = self._extract_features(real)

        # 特征差异越小，越难区分
        diffs = {
            k: abs(syn_features[k] - real_features[k])
            for k in syn_features if k in real_features
        }

        return {
            "feature_diffs": diffs,
            "avg_diff": sum(diffs.values()) / max(len(diffs), 1),
            "assessment": "hard_to_detect" if sum(diffs.values()) / max(len(diffs), 1) < 0.1
                         else "detectable",
        }

    def _extract_features(self, texts: list[str]) -> dict:
        words = [w for t in texts for w in t.split()]
        return {
            "avg_word_len": sum(len(w) for w in words) / max(len(words), 1),
            "punct_ratio": sum(1 for w in words if not w.isalnum()) / max(len(words), 1),
            "avg_sent_len": len(words) / max(sum(t.count("。") + t.count(".") for t in texts), 1),
        }

    def _utility_proxy(self, samples: list[str]) -> dict:
        """下游效用的代理指标"""
        # 信息密度：unique 内容词比例
        all_words = [w for s in samples for w in s.split()]
        stopwords = {"的", "了", "是", "在", "和", "有", "我", "他", "这", "那", "就", "也",
                     "the", "a", "an", "is", "are", "was", "in", "on", "at", "to", "of"}
        content_words = [w for w in all_words if w not in stopwords and len(w) > 1]
        info_density = len(set(content_words)) / max(len(content_words), 1)

        return {
            "info_density": round(info_density, 4),
            "content_word_ratio": round(len(content_words) / max(len(all_words), 1), 4),
        }
```

### 四层质量控制体系

```
第 1 层：格式与完整性检查（自动，100% 覆盖）
  ├── 文本完整性（无截断、无乱码）
  ├── 编码正确（UTF-8）
  ├── 长度合理（排除 < 50 字或 > 50000 字的异常样本）
  ├── 格式正确（JSON/Markdown 解析成功）
  └── 淘汰率：通常 5-10%

第 2 层：模型打分（自动，100% 覆盖）
  ├── 用独立的评分模型（非生成模型本身）评估
  ├── 维度：连贯性、信息量、准确性、教学价值
  ├── 使用 5 分制或 0-1 连续分数
  ├── 阈值：通常保留 top 60-80%
  └── 淘汰率：20-40%

第 3 层：多样性检查（自动，批次级）
  ├── N-gram 多样性（trigram unique ratio > 0.7）
  ├── Embedding 空间覆盖度（聚类分析）
  ├── 开头/结尾模式检测（防止模板化输出）
  ├── 与已有数据的去重（MinHash 近似去重）
  └── 作用：防止 Model Collapse 的早期信号

第 4 层：人工抽检（人工，1-5% 采样）
  ├── 深入检查事实性（特别是数字、日期、专有名词）
  ├── 逻辑一致性（推理链是否有跳跃）
  ├── 评估"AI 味"（是否过度使用特定句式）
  ├── 发现自动检测遗漏的系统性偏差
  └── 反馈用于改进 Prompt 和过滤策略
```

---

## 17.6 合成数据的前沿趋势

### 第二代合成数据

2025-2026 年，合成数据正在从"简单生成"进化到"带反馈的精炼生成"：

| 特征 | 第一代（2023-2024） | 第二代（2025-2026） |
|------|-------------------|-------------------|
| 生成方式 | 单次生成 | 生成→验证→修正→再生成 |
| 质量控制 | 事后过滤 | 生成过程中内嵌验证 |
| 多样性 | 温度调节 | 主动探索未覆盖区域 |
| 事实性 | 依赖生成模型 | 外部知识库验证 |
| 反馈 | 无 | 下游任务信号反传 |

### 多模态合成数据

随着多模态模型的兴起，合成数据也在向多模态扩展：

```
文本→图像描述合成：
  用 LLM 生成详细的图像描述 → 用图像生成模型验证描述的可行性

代码→测试用例合成：
  给定一段代码 → 自动生成单元测试 → 运行测试验证代码正确性
  → 代码和测试用例都成为训练数据

数学→形式化验证：
  用 LLM 生成数学证明 → 用 Lean 4 形式化验证器检验
  → 只保留通过验证的证明
```

### 合成数据的伦理考量

```
需要关注的伦理问题：

1. 偏见放大
   合成数据可能放大生成模型中的偏见
   → 需要专门的偏见检测和缓解步骤

2. 版权灰区
   用受版权保护的数据训练的模型生成的合成数据
   → 法律上是否算"衍生作品"？目前无定论

3. "数据霸权"
   只有拥有强大模型的公司才能生成高质量合成数据
   → 可能加剧 AI 领域的垄断

4. 环境成本
   大规模合成数据生成的计算成本很高
   → 生成 1T token 的合成数据约消耗 100 MWh 电力
```

---

## 动手环节：构建一个合成数据质量评估流水线

**目标**：对一批合成的 SFT 数据进行多维度质量评估，生成质量报告。

```python
"""
动手练习：合成数据质量评估流水线
评估一批模拟的合成 SFT 数据
"""
import json
from collections import Counter

# 模拟数据
synthetic_sft_data = [
    {"instruction": "解释什么是梯度下降", "response": "梯度下降是一种优化算法...（假设 500 字回复）"},
    {"instruction": "写一段 Python 排序代码", "response": "```python\ndef sort_list(arr):...```"},
    {"instruction": "解释什么是梯度下降", "response": "梯度下降是机器学习中最常用的优化方法..."},  # 重复指令
    {"instruction": "你好", "response": "你好！"},  # 过短
    # ... 假设共 1000 条
]

def evaluate_sft_batch(data: list[dict]) -> dict:
    """SFT 合成数据批量评估"""
    report = {
        "total": len(data),
        "issues": {
            "duplicate_instructions": 0,
            "too_short_response": 0,
            "too_long_response": 0,
            "low_diversity": False,
        },
        "quality_distribution": {"excellent": 0, "good": 0, "acceptable": 0, "poor": 0},
    }

    # 1. 指令去重检查
    instructions = [d["instruction"] for d in data]
    instruction_counts = Counter(instructions)
    report["issues"]["duplicate_instructions"] = sum(
        count - 1 for count in instruction_counts.values() if count > 1
    )

    # 2. 回复长度检查
    for d in data:
        resp_len = len(d["response"])
        if resp_len < 50:
            report["issues"]["too_short_response"] += 1
        elif resp_len > 10000:
            report["issues"]["too_long_response"] += 1

    # 3. 多样性检查
    unique_instruction_ratio = len(set(instructions)) / len(instructions)
    if unique_instruction_ratio < 0.9:
        report["issues"]["low_diversity"] = True

    # 4. 汇总报告
    report["unique_instruction_ratio"] = round(unique_instruction_ratio, 4)
    report["avg_response_length"] = sum(len(d["response"]) for d in data) / len(data)

    # 5. 建议
    report["recommendations"] = []
    if report["issues"]["duplicate_instructions"] > len(data) * 0.05:
        report["recommendations"].append("指令重复率过高，建议增加种子多样性或提高温度")
    if report["issues"]["too_short_response"] > len(data) * 0.1:
        report["recommendations"].append("短回复过多，建议设置最小生成长度或过滤短回复")
    if report["issues"]["low_diversity"]:
        report["recommendations"].append("整体多样性不足，建议使用 Evol-Instruct 进化策略")

    return report

# 运行评估
report = evaluate_sft_batch(synthetic_sft_data)
print(json.dumps(report, indent=2, ensure_ascii=False))
```

**练习扩展**：
1. 在 `evaluate_sft_batch` 中添加回复质量打分（可以用规则或调用 LLM-as-Judge）
2. 添加 embedding 空间的多样性分析（使用 sentence-transformers）
3. 对比不同温度生成的合成数据的质量-多样性 tradeoff

---

## 本章要点回顾

> 1. **合成数据已从"锦上添花"变为"不可或缺"**——但"怎么合成"比"合成多少"更重要
> 2. **三大范式各有适用场景**：改写（保真度高）、种子扩展（内容丰富）、进化（多样性好）
> 3. **Model Collapse 是真实风险**——100% 合成数据必然坍缩，混入真实数据是必须的
> 4. **合成数据有自己的 Scaling Law**——边际收益递减显著，每个能力维度有不同的最优比例
> 5. **质量 > 数量**：1 份高质量合成 ≈ 4-5 份未过滤合成
> 6. **四层质量控制**：格式检查 → 模型打分 → 多样性监控 → 人工抽检
> 7. **多样性是核心防线**——trigram unique ratio 和开头重复度是坍缩的早期预警信号
> 8. **第二代合成数据**的核心特征：生成-验证-修正循环，而非一次性生成

