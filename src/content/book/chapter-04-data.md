---
title: "预训练数据工程"
description: "从数据采集到清洗、去重、质量过滤——构建万亿 token 级数据管线的完整指南"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 4
part: "第一部分：基础篇"
partOrder: 1
tags: ["数据", "预训练", "数据清洗", "去重", "质量过滤"]
---

## 数据是 LLM 的第一生产力

如果说模型架构是 LLM 的"骨架"，训练算法是"肌肉"，那么数据就是"血液"。在大模型时代，一个被反复验证的共识是：

> **数据质量对模型能力的影响，往往超过架构改进和训练技巧的总和。**

[Chinchilla](https://arxiv.org/abs/2203.15556) 论文证明了数据量与参数量同等重要。而后续更多的实践表明，在数据量充足的前提下，**数据质量才是真正的瓶颈**。

本章将系统介绍预训练数据工程的全流程——从原始数据采集到最终的训练数据配方。

## 数据全景图

现代 LLM 的预训练数据通常包括以下来源：

| 数据类别 | 典型来源 | 占比估算 | 说明 |
|---------|---------|---------|------|
| 网页文本 | Common Crawl, 自主爬取 | 60-80% | 最大体量，质量参差不齐 |
| 代码 | GitHub, GitLab, Stack Overflow | 10-20% | 提升推理和代码能力 |
| 书籍 | Books3, Gutenberg | 3-5% | 高质量长文本 |
| 学术论文 | arXiv, Semantic Scholar | 2-5% | 学术知识 |
| 百科 | Wikipedia (多语言) | 2-3% | 高质量事实知识 |
| 对话/论坛 | Reddit, Stack Exchange | 2-5% | 对话能力 |
| 数学 | MATH, GSM8K, 合成数据 | 1-3% | 数学推理 |
| 多语言 | CC-100, OSCAR, CulturaX | 5-15% | 多语言覆盖 |

### 主要开源数据集

| 数据集 | 规模 | 描述 |
|--------|------|------|
| [Common Crawl](https://commoncrawl.org/) | PB 级 | 互联网最大的开放爬虫存档 |
| [FineWeb](https://huggingface.co/datasets/HuggingFaceFW/fineweb) | 15T tokens | HuggingFace 处理的高质量网页数据 |
| [FineWeb-Edu](https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu) | 1.3T tokens | FineWeb 中筛选的教育类高质量内容 |
| [RedPajama V2](https://together.ai/blog/redpajama-data-v2) | 30T tokens | Together AI 的大规模开放数据 |
| [DCLM](https://arxiv.org/abs/2406.11794) | 3T tokens | Apple 的 DataComp for Language Models |
| [The Stack V2](https://huggingface.co/datasets/bigcode/the-stack-v2) | 67.5B tokens | BigCode 项目的代码数据 |
| [Dolma](https://arxiv.org/abs/2402.00159) | 3T tokens | AI2 的开源预训练数据集 |
| [CulturaX](https://huggingface.co/datasets/uonlp/CulturaX) | 6.3T tokens | 167 种语言的清洗后数据 |

## 数据处理管线

一个完整的预训练数据管线通常包含以下步骤：

```
原始数据 (Raw Data)
  ↓ 1. 文本提取 (Text Extraction)
  ↓ 2. 语言检测 (Language Identification)
  ↓ 3. URL/Domain 过滤
  ↓ 4. 启发式规则过滤 (Heuristic Filtering)
  ↓ 5. 模型质量过滤 (Quality Classifier)
  ↓ 6. 去重 (Deduplication)
  ↓ 7. PII 移除 (Personal Information Removal)
  ↓ 8. 毒性过滤 (Toxicity Filtering)
  ↓ 9. 数据混合 & 采样 (Data Mixing)
  ↓
训练数据 (Training Data)
```

### 1. 文本提取

对于网页数据，主要挑战是从 HTML 中提取干净的文本内容：

- **[trafilatura](https://github.com/adbar/trafilatura)**：目前最流行的网页文本提取工具，支持正文提取、元数据解析
- **[resiliparse](https://github.com/chatnoir-eu/chatnoir-resiliparse)**：高性能的 HTML 解析器
- **[jusText](https://github.com/miso-belica/jusText)**：基于段落分类的正文提取
- Common Crawl 提供的 WET 文件已经做了初步的文本提取，但质量不够好

关键挑战：
- **模板内容（boilerplate）**：导航栏、页脚、广告等噪音
- **JavaScript 渲染**：SPA 应用的内容可能不在原始 HTML 中
- **编码问题**：非 UTF-8 编码的处理

### 2. 语言检测

多语言 LLM 需要准确识别每个文档的语言，以控制语言配比。

常用工具：
- **[fastText lid.176](https://fasttext.cc/docs/en/language-identification.html)**：Meta 的语言检测模型，支持 176 种语言，速度极快
- **[CLD3](https://github.com/google/cld3)**：Google 的 Compact Language Detector
- **[GlotLID](https://github.com/cisnlp/GlotLID)**：支持 1600+ 种语言的开源检测器

> **实战经验**：单一检测器在短文本（<50 字符）和混合语言文本上容易出错。工业实践中通常 ensemble 多个检测器，或对短文本使用更保守的阈值。

### 3. 启发式规则过滤

最基础但非常有效的过滤手段。以 [FineWeb 的处理流程](https://huggingface.co/spaces/HuggingFaceFW/blogpost-fineweb-v1) 为例：

**文档级过滤**：
- 文档长度：去掉过短（<50 词）或过长（>100K 词）的文档
- 重复率：如果文档中 n-gram 重复率过高（如 >50%），说明是模板生成的内容
- 特殊字符比例：如果非字母字符占比过高（如 >30%），说明可能是乱码或代码
- 停用词检查：英文文档如果常见停用词（the, is, of）出现频率异常低，可能是低质量内容

**行级过滤**：
- 去除全大写行（通常是标题或广告）
- 去除只包含 URL 的行
- 去除重复行

**来源过滤**：
- 黑名单域名（成人内容、垃圾网站、恶意软件）
- URL 模式匹配（如 `/login`, `/signup` 等非内容页面）

[Gopher](https://arxiv.org/abs/2112.11446)（Rae et al., 2021）论文详细定义了一组广泛使用的启发式过滤规则，已成为行业标准。

### 4. 模型质量过滤

启发式规则能去掉明显的低质量内容，但无法判断文本的"教育价值"或"信息密度"。这就需要用模型做质量分类。

#### 困惑度过滤（Perplexity Filtering）

用一个高质量语料（如 Wikipedia）训练的小型语言模型（如 KenLM），计算每个文档的困惑度。困惑度过高说明文本不通顺，过低说明文本可能过于简单/重复。

[CCNet](https://arxiv.org/abs/1911.00359)（Wenzek et al., 2020）首次大规模使用该方法处理 Common Crawl。

#### 质量分类器（Quality Classifier）

训练一个二分类器来区分"高质量"和"低质量"文档：

- **正例**：Wikipedia、教科书、高质量博客
- **负例**：随机网页数据

[FineWeb-Edu](https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu) 使用 LLaMA-3-70B-Instruct 作为标注器，对文档的教育价值评分（0-5），然后训练一个小的分类模型来大规模过滤。这种"LLM 标注 + 小模型推广"的模式已成为主流范式。

#### 数据重要性估计

[DSIR](https://arxiv.org/abs/2302.03169)（Xie et al., 2023）提出了基于重要性权重（importance resampling）的方法：给定一个目标分布（如高质量数据集），估计每个文档与目标分布的相似度，据此进行加权采样。

### 5. 去重

去重可能是数据处理中**投入产出比最高**的环节。[Hernandez et al. (2022)](https://arxiv.org/abs/2107.06499) 证明，去重可以在不增加任何其他成本的情况下提升模型质量。

#### 精确去重（Exact Deduplication）

- **URL 去重**：同一 URL 的多次爬取只保留最新版本
- **文档级哈希**：对文档内容计算哈希值（如 SHA-256），完全相同的文档去重
- **行级去重**：去除在数据集中出现次数过多的行（如版权声明、cookie 提示）

#### 模糊去重（Fuzzy Deduplication）

精确去重无法处理稍有差异的近似重复。模糊去重是核心技术：

**[MinHash + LSH](https://en.wikipedia.org/wiki/MinHash)**（Locality-Sensitive Hashing）：
1. 将文档表示为 n-gram 集合
2. 用 MinHash 生成紧凑的签名（signature）
3. 用 LSH 将相似签名映射到同一桶中
4. 桶内文档做精确比较

这种方法可以在近似 $O(n)$ 时间复杂度内完成全库去重。

**参数选择的经验值**：
- n-gram 大小：5（太小会误判，太大会漏判）
- MinHash 签名长度：128-256
- LSH band 数量 × 行数 = 签名长度，阈值取决于期望的 Jaccard 相似度
- 相似度阈值：0.7-0.8（FineWeb 使用 0.75）

下面用 Python 实现一个简化版 MinHash + LSH 去重管线：

```python
import hashlib
import struct
from typing import List, Set, Tuple
from collections import defaultdict

class MinHashDedup:
    """MinHash + LSH 模糊去重
    
    工业级实现可用 datasketch 库，这里展示核心原理。
    """
    def __init__(self, num_perm: int = 128, bands: int = 16,
                 ngram_size: int = 5, threshold: float = 0.75):
        self.num_perm = num_perm
        self.bands = bands
        self.rows = num_perm // bands  # 每个 band 的行数
        self.ngram_size = ngram_size
        self.threshold = threshold
        # 随机哈希函数参数: h(x) = (ax + b) mod p
        self._a = [hash(f"a_{i}") % (2**61 - 1) for i in range(num_perm)]
        self._b = [hash(f"b_{i}") % (2**61 - 1) for i in range(num_perm)]
        self._p = (1 << 61) - 1  # Mersenne prime

    def _get_ngrams(self, text: str) -> Set[str]:
        """提取字符级 n-gram"""
        tokens = text.lower().split()
        ngrams = set()
        for i in range(len(tokens) - self.ngram_size + 1):
            ngrams.add(" ".join(tokens[i:i + self.ngram_size]))
        return ngrams

    def _minhash(self, ngrams: Set[str]) -> List[int]:
        """计算 MinHash 签名"""
        signature = [float('inf')] * self.num_perm
        for gram in ngrams:
            h = int(hashlib.md5(gram.encode()).hexdigest(), 16)
            for i in range(self.num_perm):
                val = (self._a[i] * h + self._b[i]) % self._p
                signature[i] = min(signature[i], val)
        return signature

    def _lsh_buckets(self, signature: List[int]) -> List[str]:
        """LSH 分桶: 将签名分成 bands，每个 band 哈希到一个桶"""
        buckets = []
        for b in range(self.bands):
            start = b * self.rows
            band = tuple(signature[start:start + self.rows])
            bucket_id = f"b{b}_{hash(band)}"
            buckets.append(bucket_id)
        return buckets

    def deduplicate(self, documents: List[str]) -> List[int]:
        """对文档集合执行去重，返回保留的文档索引"""
        bucket_to_docs = defaultdict(set)
        signatures = []

        # Step 1: 计算所有文档的 MinHash 签名并 LSH 分桶
        for idx, doc in enumerate(documents):
            ngrams = self._get_ngrams(doc)
            if len(ngrams) < 2:
                signatures.append(None)
                continue
            sig = self._minhash(ngrams)
            signatures.append(sig)
            for bucket in self._lsh_buckets(sig):
                bucket_to_docs[bucket].add(idx)

        # Step 2: 找到候选重复对并验证
        duplicates = set()
        checked = set()
        for bucket, doc_ids in bucket_to_docs.items():
            doc_list = sorted(doc_ids)
            for i in range(len(doc_list)):
                for j in range(i + 1, len(doc_list)):
                    pair = (doc_list[i], doc_list[j])
                    if pair in checked:
                        continue
                    checked.add(pair)
                    # 用签名估算 Jaccard 相似度
                    s1, s2 = signatures[pair[0]], signatures[pair[1]]
                    if s1 and s2:
                        sim = sum(a == b for a, b in zip(s1, s2)) / self.num_perm
                        if sim >= self.threshold:
                            duplicates.add(pair[1])  # 保留前者，标记后者

        # 返回去重后保留的索引
        kept = [i for i in range(len(documents))
                if i not in duplicates and signatures[i] is not None]
        print(f"去重: {len(documents)} → {len(kept)} 篇 "
              f"(移除 {len(documents) - len(kept)} 篇, "
              f"{(len(documents) - len(kept)) / len(documents) * 100:.1f}%)")
        return kept

# 示例
docs = [
    "大语言模型是人工智能领域的重要突破 它改变了自然语言处理的范式",
    "大语言模型是人工智能领域的关键突破 它改变了自然语言处理的范式",  # 近似重复
    "预训练数据的质量对模型性能有决定性影响 高质量数据可以显著提升效果",
    "Transformer 架构采用了自注意力机制 实现了完全并行的序列建模",
    "预训练数据质量对模型性能有决定性的影响 高质量数据能显著提升效果",  # 近似重复
]
deduper = MinHashDedup(num_perm=64, bands=8, threshold=0.5)
kept_indices = deduper.deduplicate(docs)
for i in kept_indices:
    print(f"  [{i}] {docs[i][:40]}...")
```

#### 去重的规模

工业级数据集的去重规模惊人。以 Common Crawl 为例：
- 原始数据：约 250B 个网页
- URL 去重后：约 100B
- 精确去重后：约 50B
- MinHash 模糊去重后：约 15-25B

去重可能移除 **60-80%** 的数据，但这些"减少"实际上大幅提升了数据质量。

### 6. PII 移除与安全过滤

#### PII（个人可识别信息）移除

预训练数据中包含大量个人信息（邮箱、电话号码、地址等），如不移除可能导致隐私泄露。

常用方法：
- **正则表达式**：匹配邮箱、电话号码等固定格式
- **NER 模型**：识别人名、地址等非固定格式的 PII
- **[Presidio](https://github.com/microsoft/presidio)**：Microsoft 的开源 PII 检测和匿名化工具

实践中通常采用"替换"而非"删除"策略——用特殊标记（如 `[EMAIL]`, `[PHONE]`）替换 PII，保留文本的语义完整性。

#### 毒性过滤

去除有害内容（仇恨言论、暴力、色情等）：

- **[Perspective API](https://www.perspectiveapi.com/)**：Google 的毒性检测 API
- **关键词列表**：维护领域特定的敏感词列表
- **分类器**：训练专门的毒性检测模型

> **注意**：过度的毒性过滤可能导致代表性不足（under-representation），移除某些群体的正常讨论。需要在安全和公平之间取得平衡。

## 数据混合（Data Mixing）

确定不同来源数据的混合比例是预训练数据工程中最关键的决策之一。

### 经典方法

**按数据量比例**：直接按各来源的原始数据量做配比。简单但粗暴，大体量的低质量网页数据会淹没高质量的小数据集。

**手动调优**：基于经验和 ablation 实验手动调整配比。[LLaMA](https://arxiv.org/abs/2302.13971) 论文中的配比：

| 来源 | 占比 | 采样权重 |
|------|------|---------|
| CommonCrawl | 67% | 1.10 |
| C4 | 15% | 1.06 |
| GitHub | 4.5% | 0.64 |
| Wikipedia | 4.5% | 2.45 |
| Books | 4.5% | 2.23 |
| ArXiv | 2.5% | 1.06 |
| StackExchange | 2% | 1.03 |

注意 Wikipedia 和 Books 的采样权重远大于 1，意味着这些高质量数据会被**多次采样（多 epoch）**。

### 数据混合的理论

[DoReMi](https://arxiv.org/abs/2305.10429)（Xie et al., 2023）提出了一个优雅的自动化方法：

1. 先用均匀配比训练一个小的参考模型
2. 用参考模型计算每个数据域的 excess loss
3. 用在线优化算法（Distributionally Robust Optimization）自动调整配比
4. 用优化后的配比训练最终模型

实验表明，DoReMi 自动找到的配比优于人工调优。

### 数据重复（Multi-epoch）的影响

当高质量数据不足以支撑足够的训练步数时，不可避免要重复使用数据。[Muennighoff et al. (2024)](https://arxiv.org/abs/2305.16264) 系统研究了数据重复的影响：

- **4 epoch 以内**：性能与独立数据接近
- **4-16 epoch**：性能开始下降，但仍有正收益
- **超过 16 epoch**：收益递减甚至为负，开始过拟合

> **实战建议**：如果你的数据量有限，优先保证高质量数据多 epoch，低质量数据 1 epoch 即可。代码和数学数据的 epoch 容忍度通常高于网页文本。

## 构建数据处理管线

将上面的各个步骤整合为一个可复用的数据处理管线：

```python
import re
from dataclasses import dataclass, field
from typing import List, Optional, Callable

@dataclass
class Document:
    """单个文档的数据结构"""
    text: str
    url: str = ""
    language: str = ""
    quality_score: float = 0.0
    metadata: dict = field(default_factory=dict)

@dataclass
class FilterStats:
    """过滤统计"""
    total: int = 0
    passed: int = 0
    filter_reasons: dict = field(default_factory=lambda: {})

    def report(self):
        print(f"\n📊 过滤报告: {self.passed}/{self.total} 通过 "
              f"({self.passed/self.total*100:.1f}%)")
        for reason, count in sorted(self.filter_reasons.items(),
                                     key=lambda x: -x[1]):
            print(f"  ❌ {reason}: {count} ({count/self.total*100:.1f}%)")

class DataPipeline:
    """预训练数据处理管线
    
    支持链式添加过滤器，自动统计过滤结果。
    """
    def __init__(self):
        self.filters: List[tuple] = []  # (name, filter_fn)
        self.stats = FilterStats()

    def add_filter(self, name: str, fn: Callable[[Document], bool]):
        """添加过滤器: fn 返回 True 表示保留"""
        self.filters.append((name, fn))
        return self  # 支持链式调用

    def process(self, docs: List[Document]) -> List[Document]:
        """处理文档列表"""
        self.stats = FilterStats(total=len(docs))
        result = []
        for doc in docs:
            passed = True
            for name, fn in self.filters:
                if not fn(doc):
                    self.stats.filter_reasons[name] = \
                        self.stats.filter_reasons.get(name, 0) + 1
                    passed = False
                    break
            if passed:
                result.append(doc)
        self.stats.passed = len(result)
        return result

# === 常用过滤器 ===

def length_filter(min_words=50, max_words=100000):
    """文档长度过滤"""
    def _filter(doc: Document) -> bool:
        n_words = len(doc.text.split())
        return min_words <= n_words <= max_words
    return _filter

def repetition_filter(max_ratio=0.3):
    """行级重复率过滤（Gopher 规则）"""
    def _filter(doc: Document) -> bool:
        lines = doc.text.strip().split("\n")
        if len(lines) < 2:
            return True
        line_counts = {}
        for line in lines:
            line = line.strip()
            if line:
                line_counts[line] = line_counts.get(line, 0) + 1
        dup_lines = sum(c - 1 for c in line_counts.values() if c > 1)
        return dup_lines / len(lines) < max_ratio
    return _filter

def special_char_filter(max_ratio=0.3):
    """特殊字符比例过滤"""
    def _filter(doc: Document) -> bool:
        if not doc.text:
            return False
        special = sum(1 for c in doc.text if not c.isalnum() and not c.isspace())
        return special / len(doc.text) < max_ratio
    return _filter

def pii_redact(doc: Document) -> Document:
    """PII 脱敏（正则替换）"""
    text = doc.text
    text = re.sub(r'\b[\w.+-]+@[\w-]+\.[\w.-]+\b', '[EMAIL]', text)
    text = re.sub(r'\b1[3-9]\d{9}\b', '[PHONE]', text)  # 中国手机号
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)  # US
    doc.text = text
    return doc

# === 组装管线 ===

pipeline = (DataPipeline()
    .add_filter("too_short", length_filter(min_words=50))
    .add_filter("too_long", length_filter(max_words=100000))
    .add_filter("high_repetition", repetition_filter(max_ratio=0.3))
    .add_filter("special_chars", special_char_filter(max_ratio=0.3))
)

# 示例运行
sample_docs = [
    Document("这是一个太短的文档", url="http://a.com"),
    Document(" ".join(["高质量的预训练数据"] * 80), url="http://b.com"),
    Document("正常文档 " * 60 + "包含丰富的技术内容和多样化的表述", url="http://c.com"),
    Document("!!@#$%^&*" * 100, url="http://d.com"),
]
clean_docs = pipeline.process(sample_docs)
pipeline.stats.report()
```

## 数据处理的工程实践

### 分布式处理框架

处理 TB 级数据需要高效的分布式框架：

- **[Spark](https://spark.apache.org/)**：经典大数据处理框架，适合批处理
- **[Ray](https://github.com/ray-project/ray)**：灵活的分布式计算框架，适合 ML 工作负载
- **[datatrove](https://github.com/huggingface/datatrove)**：HuggingFace 开源的数据处理工具包，专为 LLM 预训练数据设计
- **[dolma](https://github.com/allenai/dolma)**：AI2 开源的数据处理工具包

### 数据格式

| 格式 | 优点 | 缺点 | 使用场景 |
|------|------|------|---------|
| JSONL | 人类可读，灵活 | 体积大，解析慢 | 中间处理 |
| Parquet | 列式存储，压缩好 | 不支持流式追加 | 数据存储和分析 |
| Arrow/IPC | 零拷贝读取，内存映射 | 文件较大 | 训练时高效读取 |
| MDS（[MosaicML](https://github.com/mosaicml/streaming)） | 流式读取，分布式友好 | 生态较新 | 大规模训练 |

### 数据溯源与可审计性

随着数据合规要求越来越严格，数据溯源（data provenance）变得至关重要：

- 记录每条数据的来源 URL、爬取时间、处理步骤
- 支持根据 URL/域名回溯和删除数据（应对版权要求）
- [Data Provenance Initiative](https://dataprovenance.org/) 推动了数据来源的标准化

## 中文数据的特殊挑战

### 中文网页质量

中文互联网的数据质量问题尤为突出：
- SEO 垃圾内容占比高
- 采集/伪原创内容泛滥
- 多平台相互转载导致高重复率
- 繁体/简体混合，拼音/混合编码

### 中文特有的处理步骤

1. **繁简转换**：统一为简体或繁体（使用 [OpenCC](https://github.com/BYVoid/OpenCC)）
2. **中文分词**：用于 n-gram 统计和去重（如 [jieba](https://github.com/fxsjy/jieba)）
3. **全角/半角统一**：标准化标点和数字
4. **乱码检测**：中文 UTF-8 编码错误很常见，需要专门的检测逻辑

### 推荐数据集

| 数据集 | 规模 | 说明 |
|--------|------|------|
| [WuDaoCorpora](https://data.baai.ac.cn/details/WuDaoCorporaText) | 200GB | 智源研究院，中文多来源 |
| [ChineseWebText](https://huggingface.co/datasets/CASIA-LM/ChineseWebText) | 1.4T tokens | 中文网页高质量数据 |
| [SkyPile](https://huggingface.co/datasets/Skywork/SkyPile-150B) | 150B tokens | 昆仑万维的中文数据 |

## 数据质量评估

如何知道你的数据处理管线是否有效？

### 下游任务评估

最直接的方法：用处理后的数据训练一个小模型（如 1B 参数），在 benchmark 上评估。

常用 benchmark：
- **英文**：[MMLU](https://arxiv.org/abs/2009.03300), [HellaSwag](https://arxiv.org/abs/1905.07830), [ARC](https://arxiv.org/abs/1803.05457)
- **中文**：[C-Eval](https://arxiv.org/abs/2305.08322), [CMMLU](https://arxiv.org/abs/2306.09212)
- **代码**：[HumanEval](https://arxiv.org/abs/2107.03374), [MBPP](https://arxiv.org/abs/2108.07732)

### 内在指标

不训练模型也能评估数据质量的方法：

- **困惑度分布**：用参考模型计算数据的困惑度，分析分布形态
- **Token 覆盖率**：检查词表的利用情况
- **语言/域分布**：确保配比符合预期
- **重复率**：文档级和 token 级的重复比例

### [DCLM 评估框架](https://arxiv.org/abs/2406.11794)

Apple 的 DataComp for Language Models 提供了一个标准化的数据质量评估框架：
1. 固定模型架构和训练配方
2. 只改变数据
3. 在标准 benchmark 集上评估
4. 数据质量的改进可以被公平比较

这种方法使得不同团队的数据处理技术可以在同一框架下对比。

---

### 📖 延伸阅读路线

- **下一章**：[第五章 Scaling Laws](/book/chapter-05-scaling-laws) — 有了数据，如何根据算力预算科学地决定模型大小、数据量和训练步数
- **数据配方深入**：[第六章 预训练配方](/book/chapter-06-pretraining-recipe) — 数据混合比例如何与训练超参（学习率、batch size）配合
- **中训练数据策略**：[第七章 中训练](/book/chapter-07-midtraining) — 预训练数据之外，中训练阶段的数据配方有独立的设计空间
- **Tokenizer 的上游影响**：[第三章 Tokenizer 设计哲学](/book/chapter-03-tokenizer) — Tokenizer 的选择直接影响数据管线中的"有效 token 数"
- **评估闭环**：[第十一章 评估与 Benchmark](/book/chapter-11-evaluation) — 如何用 benchmark 验证数据质量提升的效果
