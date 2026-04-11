---
title: "Tokenizer 设计哲学"
description: "BPE、Unigram、WordPiece 的原理与取舍，多语言 Tokenizer 的设计艺术"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 3
part: "第一部分：基础篇"
partOrder: 1
tags: ["Tokenizer", "BPE", "SentencePiece", "多语言"]
---

## 为什么 Tokenizer 如此重要

Tokenizer 是 LLM 的"眼睛"——模型看到的不是原始文本，而是 Tokenizer 切分后的 token 序列。一个设计不当的 Tokenizer 会导致：

1. **效率低下**：相同的文本被切成更多的 token，消耗更多的计算和内存
2. **多语言不公平**：某些语言（如中文、日文）需要比英文多 2-4 倍的 token 来表达同样的信息
3. **推理质量下降**：过度碎片化的切分可能破坏词义
4. **成本增加**：API 按 token 计费，低效的 tokenizer 意味着更高的成本

> **一个直观的例子**：用 GPT-4 的 tokenizer，英文 "Hello World" 是 2 个 token，但中文"你好世界"可能是 3-4 个 token。这意味着处理同等语义量的中文内容，成本可能是英文的 2 倍。

## 三种主流 Tokenization 算法

### BPE（Byte Pair Encoding）

[BPE](https://arxiv.org/abs/1508.07909)（Sennrich et al., 2016）是目前最流行的 tokenization 方法，被 GPT 系列、LLaMA 等使用。

**训练过程**（自底向上的合并策略）：

1. 初始化词表为所有单字符（或字节）
2. 统计相邻 token 对的出现频率
3. 合并出现频率最高的 token 对，生成新 token
4. 重复步骤 2-3，直到词表达到目标大小

**例子**：假设训练语料中 "low" 出现 5 次，"lowest" 3 次，"newer" 6 次，"wider" 3 次

```
初始: l o w (5), l o w e s t (3), n e w e r (6), w i d e r (3)

第一轮: 最高频对 "e r" → 合并为 "er"
       l o w (5), l o w e s t (3), n e w er (6), w i d er (3)

第二轮: "n e" 频率最高 → 合并为 "ne"
       l o w (5), l o w e s t (3), ne w er (6), w i d er (3)

第三轮: "ne w" → "new"
       l o w (5), l o w e s t (3), new er (6), w i d er (3)

...如此继续直到词表大小达标
```

**BPE 的优点**：
- 通过数据驱动的方式平衡词表大小和覆盖率
- 永远不会遇到 OOV（Out-Of-Vocabulary）问题（最坏情况回退到字节级）
- 训练高效，实现简单

**BPE 的缺点**：
- 贪心合并策略不一定是全局最优
- 同一个词在不同上下文可能有不同的切分（虽然 deterministic BPE 保证一致性）
- 对低资源语言不友好（语料少 → 学到的合并规则少 → 切分碎片化）

### Unigram Language Model

与 BPE 的自底向上策略相反，[Unigram](https://arxiv.org/abs/1804.10959)（Kudo, 2018）使用**自顶向下**的策略。

**训练过程**：

1. 初始化一个很大的候选词表（如所有子串 + 单字符）
2. 用 EM 算法估计每个子词的出现概率
3. 删除使训练语料 likelihood 下降最小的子词
4. 重复步骤 2-3，直到词表达到目标大小

**推理时的切分**：对于输入文本，找到使序列概率最大的切分方式：

$$x^* = \arg\max_{x \in S(X)} \prod_{i=1}^{|x|} P(x_i)$$

其中 $S(X)$ 是所有可能的切分方式集合。这可以用 **Viterbi 算法**（动态规划）高效求解。

**Unigram 的优势**：
- 基于概率模型，理论上更优雅
- 支持概率采样——同一个词可以有多种切分方式，训练时随机采样可以作为一种正则化（Subword Regularization）
- 对训练数据中的噪声更鲁棒

### WordPiece

WordPiece 是 BERT 使用的方法，与 BPE 类似但合并策略不同：

- **BPE** 选择**出现频率最高**的 token 对合并
- **WordPiece** 选择使训练语料 **likelihood 提升最大**的 token 对合并

具体来说，合并 $a, b$ 为 $ab$ 的收益是：

$$\text{score}(a, b) = \frac{\text{freq}(ab)}{\text{freq}(a) \times \text{freq}(b)}$$

这个指标实际上是 **互信息（PMI）** 的一个变体，倾向于合并经常共现的 token 对。

### 三种方法对比

| 特性 | BPE | Unigram | WordPiece |
|------|-----|---------|-----------|
| 策略 | 自底向上（合并） | 自顶向下（删减） | 自底向上（合并） |
| 合并依据 | 频率最高 | likelihood 最大 | PMI 最大 |
| 切分方式 | 确定性 | 概率性（可采样） | 确定性 |
| OOV 处理 | 回退到字节 | 回退到字符 | 标记为 [UNK] |
| 代表模型 | GPT, LLaMA | T5, ALBERT | BERT |

## Byte-Level BPE

现代 LLM 几乎都使用 **Byte-Level BPE**（也称 BBPE），即以字节（byte，0-255）而非字符作为最小单元。

**好处**：
- **零 OOV**：任何文本（甚至二进制数据）都可以被编码
- **语言无关**：不需要为每种语言做特殊处理
- **Unicode 友好**：UTF-8 编码的文本自然地被分解为字节序列

GPT-4 的 **[tiktoken](https://github.com/openai/tiktoken)** 就是一个高性能的 Byte-Level BPE 实现，词表大小约 100K。

LLaMA 使用 [SentencePiece](https://github.com/google/sentencepiece) 的 BPE 模式，词表 32K，后来扩展到 128K。

## 多语言 Tokenizer 的挑战

设计一个公平高效的多语言 Tokenizer 是 LLM 领域的一个重要问题。

### 效率不公平问题

以 LLaMA 2 的 tokenizer 为例：

| 语言 | 原始文本 | Token 数 | 每 token 平均字符数 |
|------|---------|---------|-------------------|
| 英文 | "The quick brown fox jumps" | 5 | 5.2 |
| 中文 | "敏捷的棕色狐狸跳跃" | 9-11 | 0.8-1.0 |
| 日文 | "素早い茶色の狐がジャンプ" | 12-15 | 0.8-1.1 |
| 阿拉伯文 | "الثعلب البني السريع يقفز" | 15-20 | 1.0-1.5 |

中文需要的 token 数是英文的 2-3 倍！这意味着：
- 处理同样语义量的中文，**上下文窗口的利用率只有英文的 1/2 到 1/3**
- API 按 token 收费时，中文用户要多付 2-3 倍的费用

### 解决方案

**1. 扩大词表 + 均衡训练数据**

Qwen 的 tokenizer 词表 151K，专门为中文优化，中文效率接近英文。

**2. 混合粒度策略**

对高频语言（英文、中文）使用较粗的粒度（词/字级别），对低频语言使用较细的粒度（字节级别）。

**3. 语言自适应 tokenizer**

根据检测到的输入语言，动态切换 tokenization 策略。但这增加了系统复杂度。

### 词表大小的权衡

词表大小 $V$ 是一个关键的设计参数：

- **太小**（如 8K）：分词粒度过细，序列变长，效率低
- **太大**（如 500K）：Embedding 矩阵参数量 $V \times d_{model}$ 过大，低频 token 训练不充分
- **最佳实践**：32K-128K 是目前的主流范围

| 模型 | 词表大小 | 说明 |
|------|---------|------|
| GPT-2 | 50,257 | 英文为主 |
| GPT-4 (cl100k) | ~100K | 改善多语言 |
| LLaMA | 32,000 | 偏英文 |
| LLaMA 3 | 128,256 | 大幅扩展，改善多语言 |
| Qwen | 151,936 | 中英优化 |
| DeepSeek V3 | 128,256 | 多语言 + 代码 |

## 特殊 Token 的设计

现代 LLM 的 tokenizer 包含多种特殊 token：

```
<|begin_of_text|>     -- 文本开始
<|end_of_text|>       -- 文本结束
<|start_header_id|>   -- 角色标识开始（system/user/assistant）
<|end_header_id|>     -- 角色标识结束
<|eot_id|>            -- 轮次结束
<|python_tag|>        -- 代码执行标记（工具调用）
```

这些特殊 token 在对话模板（chat template）中扮演关键角色，它们的设计直接影响模型的指令遵循和工具调用能力。

## Tokenizer 对模型的深层影响

### 对 Scaling Laws 的影响

Tokenizer 的效率直接影响"有效数据量"。假设 Tokenizer A 将 1TB 文本编码为 250B tokens，Tokenizer B 编码为 500B tokens，那么在同样的 token 数目下，Tokenizer A 的模型实际"看到"了更多的信息。

### 对代码生成的影响

代码的 tokenization 需要特殊关注：
- 缩进（空格/制表符）的处理方式影响生成质量
- 编程关键字是否作为整体 token 很重要
- 变量名的驼峰/下划线风格可能导致不同的切分

### 对数学推理的影响

数字的 tokenization 是一个已知的痛点。例如：
- "1234567" 可能被切为 "123" + "45" + "67"
- 这种切分不尊重数字的位值系统
- 一些研究尝试用特殊的数字 tokenization 方案（如逐位编码）来改善数学推理

## 动手实现：从零构建 BPE Tokenizer

理解 BPE 最好的方式是自己实现一个。下面是一个 ~60 行的简化 BPE 训练器：

```python
from collections import Counter, defaultdict
from typing import List, Dict, Tuple

class SimpleBPE:
    """简化版 BPE Tokenizer — 用于理解核心算法"""

    def __init__(self, vocab_size: int = 300):
        self.vocab_size = vocab_size
        self.merges: List[Tuple[str, str]] = []  # 合并规则（有序）
        self.vocab: Dict[str, int] = {}

    def train(self, text: str):
        """BPE 训练: 迭代合并最高频的 token 对"""
        # Step 1: 初始词表 = 所有唯一字节 + 特殊标记
        words = text.split()
        # 将每个词拆为字符序列，末尾加 </w> 标记词边界
        word_freqs = Counter(words)
        splits = {word: list(word) + ["</w>"] for word in word_freqs}

        # 初始词表
        self.vocab = {ch: i for i, ch in enumerate(
            sorted(set(ch for word in splits for ch in splits[word]))
        )}

        # Step 2: 迭代合并
        while len(self.vocab) < self.vocab_size:
            # 统计所有相邻 token 对的频率
            pair_freqs = Counter()
            for word, freq in word_freqs.items():
                tokens = splits[word]
                for i in range(len(tokens) - 1):
                    pair_freqs[(tokens[i], tokens[i + 1])] += freq

            if not pair_freqs:
                break

            # 找到频率最高的 pair
            best_pair = pair_freqs.most_common(1)[0][0]
            self.merges.append(best_pair)

            # 执行合并
            new_token = best_pair[0] + best_pair[1]
            self.vocab[new_token] = len(self.vocab)
            for word in splits:
                tokens = splits[word]
                new_tokens = []
                i = 0
                while i < len(tokens):
                    if (i < len(tokens) - 1 and
                        tokens[i] == best_pair[0] and
                        tokens[i + 1] == best_pair[1]):
                        new_tokens.append(new_token)
                        i += 2
                    else:
                        new_tokens.append(tokens[i])
                        i += 1
                splits[word] = new_tokens

        print(f"训练完成: 词表大小 {len(self.vocab)}, 合并规则 {len(self.merges)} 条")
        return self

    def encode(self, text: str) -> List[str]:
        """编码: 应用学习到的合并规则"""
        tokens = list(text) + ["</w>"]
        for pair in self.merges:
            new_tokens = []
            i = 0
            while i < len(tokens):
                if (i < len(tokens) - 1 and
                    tokens[i] == pair[0] and tokens[i + 1] == pair[1]):
                    new_tokens.append(pair[0] + pair[1])
                    i += 2
                else:
                    new_tokens.append(tokens[i])
                    i += 1
            tokens = new_tokens
        return tokens

# 示例用法
bpe = SimpleBPE(vocab_size=50)
bpe.train("low low low low low lowest lowest newest newest newest newest newest newest widest widest widest")
print("合并规则:", bpe.merges[:5])
print("编码 'lowest':", bpe.encode("lowest"))
print("编码 'newest':", bpe.encode("newest"))
```

### 用 HuggingFace tokenizers 库训练 BPE

实际项目中，我们使用高性能的 `tokenizers` 库（Rust 实现，速度极快）：

```python
from tokenizers import Tokenizer, models, trainers, pre_tokenizers

# 创建 Byte-Level BPE tokenizer
tokenizer = Tokenizer(models.BPE())
tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False)

# 配置训练器
trainer = trainers.BpeTrainer(
    vocab_size=32000,
    special_tokens=["<|begin_of_text|>", "<|end_of_text|>", "<|pad|>"],
    min_frequency=2,
    show_progress=True,
)

# 训练（传入文件路径列表）
tokenizer.train(files=["corpus_zh.txt", "corpus_en.txt", "corpus_code.txt"],
                trainer=trainer)
tokenizer.save("my_tokenizer.json")

# 测试
enc = tokenizer.encode("你好世界 Hello World")
print(f"Tokens: {enc.tokens}")
print(f"IDs: {enc.ids}")
print(f"Token 数: {len(enc.ids)}")
```

## Tokenizer 效率实测对比

选择 tokenizer 前一定要用实际数据测量效率：

```python
from transformers import AutoTokenizer

def measure_efficiency(text: str, model_names: list):
    """对比不同 tokenizer 的编码效率"""
    print(f"原文: {text[:60]}... ({len(text)} 字符)")
    print("-" * 60)
    for name in model_names:
        tok = AutoTokenizer.from_pretrained(name, trust_remote_code=True)
        ids = tok.encode(text)
        n_tokens = len(ids)
        chars_per_token = len(text) / n_tokens
        print(f"{name:30s} | {n_tokens:5d} tokens | "
              f"{chars_per_token:.2f} 字符/token")
    print()

# 中文文本效率对比
zh_text = "大语言模型的预训练数据工程是一个复杂的系统工程，涉及数据采集、清洗、去重、质量过滤等多个环节。" * 5

# 英文文本效率对比
en_text = "Large language model pretraining data engineering is a complex systems problem involving data collection, cleaning, deduplication, and quality filtering." * 5

# 代码效率对比
code_text = """
def transformer_block(x, attn, ffn, norm1, norm2):
    x = x + attn(norm1(x))
    x = x + ffn(norm2(x))
    return x
""" * 5

models = [
    "meta-llama/Llama-2-7b-hf",   # 32K 词表
    "meta-llama/Meta-Llama-3-8B",  # 128K 词表
    "Qwen/Qwen2.5-7B",            # 151K 词表，中文优化
    "deepseek-ai/DeepSeek-V3",    # 128K 词表
]

for text, label in [(zh_text, "中文"), (en_text, "English"), (code_text, "Code")]:
    print(f"=== {label} ===")
    measure_efficiency(text, models)
```

运行结果通常会显示：Qwen 在中文上效率最高（约 1.5-2 字符/token），LLaMA 2 最低（约 0.8 字符/token）。

## 实践建议

1. **选择 tokenizer 时，先测量目标语言的 token 效率**：用实际数据计算"每 token 平均字符数"
2. **如果你的应用场景以中文为主，优先考虑 Qwen 或 DeepSeek 的 tokenizer**
3. **训练自定义 tokenizer 时，确保训练数据的语言分布与模型训练数据一致**
4. **词表大小推荐 64K-128K**，除非有特殊需求
5. **不要低估 tokenizer 对下游任务的影响**——换一个 tokenizer 可能需要重新训练整个模型

---

### 📖 延伸阅读路线

- **下一章**：[第四章 预训练数据工程](/book/chapter-04-data) — 预训练数据是 LLM 的"燃料"。从数据采集到清洗、去重、质量过滤，构建完整的数据处理管线
- **效率影响链条**：[第五章 Scaling Laws](/book/chapter-05-scaling-laws) — Tokenizer 效率直接影响"有效数据量"，进而影响 Scaling Laws 的计算
- **架构依赖**：[第二章 Transformer 架构](/book/chapter-02-transformer) — Tokenizer 的输出维度决定了 Embedding 矩阵的行数（$V \times d_{model}$）
- **代码生成影响**：[第十一章 评估与 Benchmark](/book/chapter-11-evaluation) — Tokenizer 对代码和数学 benchmark 结果有直接影响
