---
title: "预训练数据处理 Pipeline 设计文档"
description: "一套可复现的大模型预训练数据处理流水线设计，覆盖采集、清洗、去重、质量过滤全流程。"
date: 2026-03-18
category: "技术文档"
tags: ["数据处理", "Pipeline", "去重", "质量过滤", "工程实践"]
---

## 概述

本文档定义了一套标准化的预训练数据处理 Pipeline（以下简称 DataPipe），目标是将原始 Web Crawl 数据转化为可直接用于大模型预训练的高质量语料。设计参考了 FineWeb、DCLM、RedPajama 等开源方案的最佳实践。

## 系统架构

### 整体流程

```
┌─────────────────────────────────────────────────┐
│                   DataPipe v2.0                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Stage 1: 采集与提取                              │
│  ┌────────┐   ┌────────┐   ┌────────────┐       │
│  │ WARC   │──▶│ 正文   │──▶│ 格式标准化  │       │
│  │ 下载   │   │ 提取   │   │ (JSON-Lines)│       │
│  └────────┘   └────────┘   └────────────┘       │
│                     │                            │
│  Stage 2: 基础过滤                               │
│  ┌────────┐   ┌────────┐   ┌──────────┐         │
│  │ URL    │──▶│ 语言   │──▶│ 规则过滤  │         │
│  │ 过滤   │   │ 识别   │   │ (行+文档) │         │
│  └────────┘   └────────┘   └──────────┘         │
│                     │                            │
│  Stage 3: 去重                                   │
│  ┌────────┐   ┌────────┐   ┌──────────┐         │
│  │ URL    │──▶│ MinHash│──▶│ 精确子串  │         │
│  │ 去重   │   │ 去重   │   │ 去重     │          │
│  └────────┘   └────────┘   └──────────┘         │
│                     │                            │
│  Stage 4: 质量过滤                               │
│  ┌────────┐   ┌──────────┐  ┌──────────┐        │
│  │ PPL    │──▶│ 质量分类 │──▶│ 教育价值 │        │
│  │ 过滤   │   │ 器打分   │  │ 过滤     │        │
│  └────────┘   └──────────┘  └──────────┘        │
│                     │                            │
│  Stage 5: 后处理与打包                            │
│  ┌────────┐   ┌──────────┐  ┌──────────┐        │
│  │ PII    │──▶│ Tokenize │──▶│ 打包成   │        │
│  │ 脱敏   │   │ + 统计   │  │ 训练格式 │         │
│  └────────┘   └──────────┘  └──────────┘        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 技术选型

| 组件 | 选型 | 理由 |
|------|------|------|
| 任务调度 | Ray / Spark | 分布式处理，易扩展 |
| 存储 | HDFS / S3 | 支持 PB 级数据 |
| 正文提取 | trafilatura | 准确率高，社区活跃 |
| 语言识别 | fastText lid.176 | 176 种语言，ms 级延迟 |
| 去重 | text-dedup | MinHash + SA 双引擎 |
| 质量分类 | 自训练 DeBERTa-v3 | 平衡精度和推理速度 |
| 数据格式 | JSON Lines + Parquet | 流式处理 + 高效查询 |

## Stage 1：采集与提取

### 1.1 WARC 数据获取

从 Common Crawl 获取原始 WARC 文件：

```python
# warc_downloader.py
import warcio
from dataclasses import dataclass

@dataclass
class WARCConfig:
    crawl_id: str = "CC-MAIN-2024-51"
    segment_list: str = "warc.paths.gz"
    max_workers: int = 64
    output_dir: str = "/data/raw_warc/"
    
    # 过滤条件
    min_content_length: int = 200  # bytes
    allowed_content_types: tuple = ("text/html",)
```

### 1.2 正文提取

使用 trafilatura 提取 HTML 正文：

```python
import trafilatura

def extract_content(html: str, url: str) -> dict | None:
    result = trafilatura.extract(
        html,
        url=url,
        include_comments=False,
        include_tables=True,
        no_fallback=False,  # 允许回退到 readability
        favor_precision=True,
        deduplicate=True,
    )
    if result is None or len(result) < 100:
        return None
    
    return {
        "text": result,
        "url": url,
        "source": "common_crawl",
        "crawl_id": config.crawl_id,
        "extracted_at": datetime.utcnow().isoformat(),
    }
```

### 1.3 输出格式

统一为 JSON Lines 格式，每行一个文档：

```json
{
    "id": "cc-2024-51-00001-a3f2b9c1",
    "text": "文档正文内容...",
    "url": "https://example.com/article/123",
    "source": "common_crawl",
    "crawl_id": "CC-MAIN-2024-51",
    "language": null,
    "metadata": {
        "content_length": 2847,
        "extracted_at": "2026-03-18T10:30:00Z"
    }
}
```

## Stage 2：基础过滤

### 2.1 URL 过滤

维护黑名单 + 白名单：

```python
# URL 黑名单规则
URL_BLACKLIST_PATTERNS = [
    r"\.xxx$", r"\.porn$",           # 成人内容
    r"buy.*cheap", r"viagra",         # 垃圾广告
    r"login|signup|register",         # 登录/注册页
    r"terms-of-service|privacy-policy",  # 法律页面
    r"\.pdf$|\.doc$|\.ppt$",         # 非 HTML 文件
]

# 高质量域名优先级
QUALITY_DOMAINS = {
    "tier1": ["wikipedia.org", "arxiv.org", "github.com"],
    "tier2": ["medium.com", "stackoverflow.com", "zhihu.com"],
    "tier3": ["*.edu", "*.gov", "*.ac.*"],
}
```

### 2.2 语言识别

```python
import fasttext

model = fasttext.load_model("lid.176.bin")

def detect_language(text: str) -> tuple[str, float]:
    # 取前 500 字符，避免长文本影响速度
    predictions = model.predict(text[:500].replace("\n", " "))
    lang = predictions[0][0].replace("__label__", "")
    confidence = predictions[1][0]
    return lang, confidence

# 过滤策略
LANGUAGE_CONFIG = {
    "zh": {"min_confidence": 0.65, "target_ratio": 0.25},
    "en": {"min_confidence": 0.80, "target_ratio": 0.55},
    "code": {"min_confidence": 0.50, "target_ratio": 0.15},
    "other": {"min_confidence": 0.85, "target_ratio": 0.05},
}
```

### 2.3 规则过滤

分为行级过滤和文档级过滤两个层次：

**行级过滤**（移除特定行）：

```python
LINE_FILTERS = {
    "nav_elements": r"^(Home|About|Contact|Menu|Navigation|Copyright|©)",
    "social_media": r"(Share on|Follow us|Tweet|Like us)",
    "boilerplate": r"(Cookie|Accept|Subscribe|Newsletter|Click here)",
    "short_lines": lambda line: len(line.split()) < 3,
    "all_uppercase": lambda line: line == line.upper() and len(line) > 10,
}
```

**文档级过滤**（丢弃整个文档）：

```python
DOC_FILTERS = {
    "min_words": 50,
    "max_words": 100000,
    "min_avg_word_length": 3,       # 过短 → 可能是缩写/乱码
    "max_avg_word_length": 20,      # 过长 → 可能是 URL/代码
    "max_special_char_ratio": 0.3,  # 特殊字符占比
    "max_digit_ratio": 0.5,         # 数字占比
    "min_unique_word_ratio": 0.1,   # 去重词占比（过低=重复）
    "max_line_dup_ratio": 0.3,      # 重复行占比
    "required_stop_word_ratio": 0.06,  # (英文) stopword 最低占比
}
```

**中文特殊规则**：

```python
ZH_DOC_FILTERS = {
    "min_chars": 100,               # 中文按字符数
    "max_chars": 200000,
    "min_cn_char_ratio": 0.3,       # 中文字符最低占比
    "max_punctuation_ratio": 0.15,  # 标点占比
    "no_garbled": True,             # 检测乱码 (编码问题)
}
```

## Stage 3：去重

### 3.1 URL 去重

最简单但非常有效——完全相同的 URL 只保留一个：

```python
def url_dedup(docs: Iterator[dict]) -> Iterator[dict]:
    seen_urls = BloomFilter(capacity=10_000_000_000, error_rate=0.001)
    for doc in docs:
        normalized_url = normalize_url(doc["url"])
        if normalized_url not in seen_urls:
            seen_urls.add(normalized_url)
            yield doc
```

### 3.2 MinHash 模糊去重

检测内容高度相似但不完全相同的文档：

```python
from datasketch import MinHash, MinHashLSH

MINHASH_CONFIG = {
    "num_perm": 128,          # 签名长度
    "ngram_size": 5,          # 英文 5-gram
    "ngram_size_zh": 3,       # 中文 3-gram (字级别)
    "threshold": 0.8,         # Jaccard 相似度阈值
    "bands": 9,               # LSH bands
    "rows": 13,               # LSH rows per band
    # bands × rows ≈ num_perm, 阈值 ≈ (1/bands)^(1/rows) ≈ 0.8
}
```

### 3.3 精确子串去重

用于移除跨文档的重复段落（常见于新闻转载、模板内容）：

```python
SUBSTR_DEDUP_CONFIG = {
    "min_substr_length": 200,     # 最短重复子串长度 (bytes)
    "method": "suffix_array",     # 使用 suffix array
    "window_size": 6,             # sliding window for hash
}
```

### 3.4 各阶段去重效果（经验数据）

| 去重步骤 | 数据缩减比例 | 累计剩余 |
|----------|-------------|----------|
| 原始提取 | - | 100% |
| URL 去重 | ~15% | 85% |
| MinHash 去重 | ~25% | 60% |
| 子串去重 | ~10% | 50% |
| **总计** | **~50%** | **50%** |

## Stage 4：质量过滤

### 4.1 困惑度过滤

使用在高质量数据上训练的 KenLM 模型计算文档困惑度：

```python
import kenlm

class PerplexityFilter:
    def __init__(self, model_path: str, percentile_range: tuple = (5, 95)):
        self.model = kenlm.Model(model_path)
        self.low_pct, self.high_pct = percentile_range
    
    def score(self, text: str) -> float:
        words = text.split()
        log_prob = self.model.score(" ".join(words))
        ppl = 10 ** (-log_prob / len(words))
        return ppl
    
    def filter(self, text: str) -> bool:
        ppl = self.score(text)
        # 困惑度过低 → 重复/模板内容
        # 困惑度过高 → 乱码/低质量
        return self.low_threshold <= ppl <= self.high_threshold
```

### 4.2 模型驱动的质量分类

训练一个轻量级质量分类器：

```python
# 训练数据准备
# 正样本：Wikipedia, 教科书, 优质学术内容
# 负样本：从 CommonCrawl 随机采样的低质量文本

QUALITY_CLASSIFIER_CONFIG = {
    "model": "microsoft/deberta-v3-small",
    "max_length": 512,
    "batch_size": 256,
    "threshold": 0.5,        # 质量分 > 0.5 保留
    "training_samples": 500_000,
}
```

### 4.3 教育价值过滤（可选）

仿照 FineWeb-Edu 的方案，对筛选后的数据进一步按教育价值评分：

```python
EDU_FILTER_CONFIG = {
    "model": "HuggingFaceTB/fineweb-edu-classifier",
    "min_score": 3,          # 满分 5，≥3 保留
    "apply_to": ["en"],      # 目前只对英文有效
}
```

## Stage 5：后处理与打包

### 5.1 PII 脱敏

```python
PII_PATTERNS = {
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "phone_cn": r"1[3-9]\d{9}",
    "phone_us": r"\+?1?\d{10,11}",
    "id_card_cn": r"\d{17}[\dXx]",
    "ip_address": r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",
    "credit_card": r"\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}",
}

def redact_pii(text: str) -> str:
    for pii_type, pattern in PII_PATTERNS.items():
        text = re.sub(pattern, f"[{pii_type.upper()}_REDACTED]", text)
    return text
```

### 5.2 Tokenization 与统计

```python
from transformers import AutoTokenizer

def tokenize_and_stats(doc: dict, tokenizer) -> dict:
    tokens = tokenizer.encode(doc["text"])
    doc["token_count"] = len(tokens)
    doc["char_count"] = len(doc["text"])
    doc["compression_ratio"] = doc["char_count"] / doc["token_count"]
    return doc
```

### 5.3 训练数据打包

最终输出为训练框架可直接加载的格式：

```python
# 方案 A: 预 tokenize 的 numpy memmap
# 适合 Megatron-LM / GPT-NeoX
OUTPUT_FORMAT_A = {
    "format": "numpy_memmap",
    "dtype": "uint16",  # 对应 vocab_size < 65536
    "chunk_size": 1024 * 1024 * 100,  # 100M tokens per file
}

# 方案 B: Arrow / Parquet
# 适合 HuggingFace datasets
OUTPUT_FORMAT_B = {
    "format": "parquet",
    "row_group_size": 10000,
    "compression": "zstd",
}
```

## 监控与质量保障

### 关键指标看板

```yaml
dashboard_metrics:
  pipeline_health:
    - throughput_docs_per_second
    - stage_latency_p50_p99
    - error_rate_by_stage
    - retry_count
    
  data_quality:
    - language_distribution
    - quality_score_distribution
    - token_count_histogram
    - dedup_rate_by_stage
    
  output_stats:
    - total_tokens_by_language
    - domain_distribution_top100
    - category_distribution
    - daily_output_volume
```

### 质量抽检流程

每个 batch 产出后，随机抽样 1000 条进行人工审查：

```python
QUALITY_AUDIT = {
    "sample_size": 1000,
    "dimensions": [
        "factual_accuracy",     # 事实准确性
        "coherence",            # 连贯性
        "relevance",            # 内容相关性
        "language_quality",     # 语言质量
        "formatting",           # 格式规范性
    ],
    "min_pass_rate": 0.95,     # 95% 通过率
    "escalation_threshold": 0.90,  # 低于 90% 触发告警
}
```

## 资源估算

### 处理 1T tokens 的参考资源

| 阶段 | CPU 核·时 | GPU 核·时 | 存储 (TB) |
|------|-----------|-----------|-----------|
| 采集与提取 | 50K | 0 | 20 |
| 基础过滤 | 10K | 0 | 15 |
| 去重 | 100K | 0 | 30 (临时) |
| 质量过滤 | 20K | 2K (A100) | 10 |
| 后处理与打包 | 10K | 0 | 5 |
| **总计** | **~190K** | **~2K** | **~80** |

按云服务价格估算，处理 1T tokens 的总成本约 **$2,000-5,000**。

## 附录：配置模板

```yaml
# datapipe_config.yaml
pipeline:
  name: "datapipe-v2.0"
  version: "2.0.0"
  
stages:
  extraction:
    tool: trafilatura
    min_content_length: 200
    
  language_detection:
    model: fasttext-lid-176
    languages:
      zh: {min_confidence: 0.65}
      en: {min_confidence: 0.80}
      
  deduplication:
    url_dedup: true
    minhash:
      enabled: true
      num_perm: 128
      threshold: 0.8
    suffix_array:
      enabled: true
      min_length: 200
      
  quality_filter:
    perplexity:
      model: kenlm-wiki
      range: [5, 95]  # percentile
    classifier:
      model: deberta-v3-small-quality
      threshold: 0.5
      
  output:
    format: parquet
    compression: zstd
    tokenizer: null  # 可选预 tokenize
```
