---
title: "从零构建高质量预训练数据集"
description: "手把手教程：从 Common Crawl 原始数据到可用于训练的高质量数据集，包含完整代码和配置。"
date: 2026-03-16
category: "教程指南"
tags: ["预训练数据", "Common Crawl", "数据清洗", "实战教程"]
---

## 前言

本教程面向需要自建预训练数据集的研究者和工程师。我们将从零开始，一步步构建一个约 **100B tokens** 的中英文预训练数据集。整个过程使用开源工具，可在单机或小规模集群上完成。

**目标读者**：有 Python 基础，了解大模型预训练概念，需要实际构建数据集的人。

**预计耗时**：
- 代码开发与调试：2-3 天
- 数据处理（100B tokens 规模）：3-7 天（取决于硬件）

## 环境准备

### 硬件需求

| 配置级别 | CPU | 内存 | 存储 | 适合规模 |
|----------|-----|------|------|----------|
| 最低配置 | 16核 | 64GB | 2TB SSD | 10B tokens |
| 推荐配置 | 64核 | 256GB | 10TB SSD | 100B tokens |
| 生产配置 | 集群 | - | HDFS/S3 | 1T+ tokens |

### 软件环境

```bash
# 创建 conda 环境
conda create -n datapipe python=3.11
conda activate datapipe

# 核心依赖
pip install \
    trafilatura==1.12.0 \
    fasttext-wheel==0.9.2 \
    datasketch==1.6.4 \
    datasets==2.21.0 \
    transformers==4.45.0 \
    kenlm==0.2.0 \
    warcio==1.7.4 \
    tqdm \
    orjson \
    xxhash \
    pyarrow

# 下载 fastText 语言识别模型
wget https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.bin
```

## 第一步：获取原始数据

### 选择 Common Crawl Snapshot

Common Crawl 每月发布一个新的爬取快照。建议选择最近的 2-3 个快照以获得新鲜数据。

```python
# step1_download.py
"""
从 Common Crawl 下载 WARC 文件并提取文本
"""
import os
import gzip
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from warcio.archiveiterator import ArchiveIterator
import trafilatura
import orjson
from tqdm import tqdm

# 配置
CRAWL_ID = "CC-MAIN-2024-51"
WARC_LIST_URL = f"https://data.commoncrawl.org/crawl-data/{CRAWL_ID}/warc.paths.gz"
OUTPUT_DIR = "data/raw"
MAX_SEGMENTS = 100  # 每个 segment 约 1GB 压缩，含约 50K 网页
NUM_WORKERS = 16

def get_warc_paths(max_segments: int = 100) -> list[str]:
    """获取 WARC 文件路径列表"""
    resp = requests.get(WARC_LIST_URL)
    paths = gzip.decompress(resp.content).decode().strip().split("\n")
    return paths[:max_segments]

def process_warc_segment(warc_path: str, output_path: str):
    """处理单个 WARC segment，提取文本"""
    url = f"https://data.commoncrawl.org/{warc_path}"
    
    results = []
    with requests.get(url, stream=True) as resp:
        for record in ArchiveIterator(resp.raw):
            if record.rec_type != "response":
                continue
                
            content_type = record.http_headers.get_header("Content-Type", "")
            if "text/html" not in content_type:
                continue
            
            url = record.rec_headers.get_header("WARC-Target-URI")
            html = record.content_stream().read()
            
            try:
                text = trafilatura.extract(
                    html,
                    url=url,
                    include_comments=False,
                    include_tables=True,
                    no_fallback=False,
                    favor_precision=True,
                )
            except Exception:
                continue
                
            if text and len(text) >= 100:
                results.append({
                    "text": text,
                    "url": url,
                    "source": CRAWL_ID,
                })
    
    # 写入 JSONL
    with open(output_path, "wb") as f:
        for doc in results:
            f.write(orjson.dumps(doc) + b"\n")
    
    return len(results)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    warc_paths = get_warc_paths(MAX_SEGMENTS)
    
    print(f"将处理 {len(warc_paths)} 个 WARC segment")
    
    with ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
        futures = {}
        for i, path in enumerate(warc_paths):
            output = os.path.join(OUTPUT_DIR, f"segment_{i:05d}.jsonl")
            future = executor.submit(process_warc_segment, path, output)
            futures[future] = i
        
        total_docs = 0
        for future in tqdm(as_completed(futures), total=len(futures)):
            count = future.result()
            total_docs += count
    
    print(f"提取完成，共 {total_docs} 篇文档")

if __name__ == "__main__":
    main()
```

### 补充高质量数据源

除了 Common Crawl，可以混入以下高质量数据源：

```python
# 高质量数据源清单
HIGH_QUALITY_SOURCES = {
    "wikipedia": {
        "source": "HuggingFace: wikimedia/wikipedia",
        "languages": ["zh", "en"],
        "quality": "very_high",
        "estimated_tokens": "~5B",
    },
    "stackexchange": {
        "source": "HuggingFace: HuggingFaceTB/stack-exchange",
        "quality": "high",
        "estimated_tokens": "~15B",
    },
    "arxiv": {
        "source": "HuggingFace: togethercomputer/RedPajama-Data-V2",
        "quality": "very_high",
        "estimated_tokens": "~8B",
    },
    "github_code": {
        "source": "HuggingFace: bigcode/the-stack-v2",
        "languages": ["python", "javascript", "java", "cpp", "go"],
        "quality": "high",
        "estimated_tokens": "~20B",
    },
}
```

## 第二步：语言识别与基础过滤

```python
# step2_filter.py
"""
语言识别 + 基于规则的基础过滤
"""
import fasttext
import re
import orjson
from pathlib import Path
from dataclasses import dataclass

# 加载语言识别模型
LID_MODEL = fasttext.load_model("lid.176.bin")

@dataclass
class FilterStats:
    total: int = 0
    passed: int = 0
    rejected_language: int = 0
    rejected_quality: int = 0
    rejected_length: int = 0

def detect_language(text: str) -> tuple[str, float]:
    """检测文本语言"""
    clean_text = text[:1000].replace("\n", " ")
    predictions = LID_MODEL.predict(clean_text)
    lang = predictions[0][0].replace("__label__", "")
    confidence = float(predictions[1][0])
    return lang, confidence

def is_chinese(text: str) -> float:
    """计算中文字符占比"""
    cn_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    return cn_chars / max(len(text), 1)

def rule_based_filter(text: str, lang: str) -> tuple[bool, str]:
    """基于规则的质量过滤"""
    
    # 1. 长度检查
    if lang == "zh":
        if len(text) < 100 or len(text) > 200000:
            return False, "length"
    else:
        words = text.split()
        if len(words) < 50 or len(words) > 100000:
            return False, "length"
    
    # 2. 特殊字符占比
    special_chars = sum(1 for c in text if not c.isalnum() and not c.isspace() 
                       and c not in '，。！？、；：""（）《》—…·')
    if special_chars / max(len(text), 1) > 0.3:
        return False, "special_chars"
    
    # 3. 数字占比
    digits = sum(1 for c in text if c.isdigit())
    if digits / max(len(text), 1) > 0.5:
        return False, "too_many_digits"
    
    # 4. 重复行检测
    lines = text.split("\n")
    if len(lines) > 5:
        unique_lines = set(lines)
        if len(unique_lines) / len(lines) < 0.5:
            return False, "duplicate_lines"
    
    # 5. 垃圾内容关键词
    spam_patterns = [
        r"click here", r"buy now", r"subscribe",
        r"点击这里", r"立即购买", r"免费领取",
        r"javascript:", r"cookie", r"lorem ipsum",
    ]
    text_lower = text.lower()
    spam_count = sum(1 for p in spam_patterns if re.search(p, text_lower))
    if spam_count >= 3:
        return False, "spam_content"
    
    # 6. 中文特殊检查
    if lang == "zh":
        cn_ratio = is_chinese(text)
        if cn_ratio < 0.3:
            return False, "low_chinese_ratio"
    
    return True, "passed"

def process_file(input_path: str, output_dir: str) -> FilterStats:
    """处理单个文件"""
    stats = FilterStats()
    
    output_paths = {
        "zh": Path(output_dir) / "zh" / Path(input_path).name,
        "en": Path(output_dir) / "en" / Path(input_path).name,
    }
    for p in output_paths.values():
        p.parent.mkdir(parents=True, exist_ok=True)
    
    writers = {
        lang: open(path, "wb") for lang, path in output_paths.items()
    }
    
    with open(input_path, "rb") as f:
        for line in f:
            stats.total += 1
            doc = orjson.loads(line)
            text = doc["text"]
            
            # 语言识别
            lang, confidence = detect_language(text)
            
            if lang == "zh" and confidence >= 0.65:
                target_lang = "zh"
            elif lang == "en" and confidence >= 0.80:
                target_lang = "en"
            else:
                stats.rejected_language += 1
                continue
            
            # 规则过滤
            passed, reason = rule_based_filter(text, target_lang)
            if not passed:
                stats.rejected_quality += 1
                continue
            
            # 添加语言标记
            doc["language"] = target_lang
            doc["lang_confidence"] = round(confidence, 3)
            
            writers[target_lang].write(orjson.dumps(doc) + b"\n")
            stats.passed += 1
    
    for w in writers.values():
        w.close()
    
    return stats
```

## 第三步：去重

去重通常是整个流水线中计算量最大的步骤。

```python
# step3_dedup.py
"""
两阶段去重：URL 精确去重 + MinHash 模糊去重
"""
from datasketch import MinHash, MinHashLSH
import xxhash
import re
from collections import defaultdict

# ========== URL 去重 ==========

def normalize_url(url: str) -> str:
    """URL 标准化"""
    url = url.lower().strip()
    # 移除协议
    url = re.sub(r'^https?://', '', url)
    # 移除 www.
    url = re.sub(r'^www\.', '', url)
    # 移除尾部斜杠
    url = url.rstrip('/')
    # 移除常见追踪参数
    url = re.sub(r'[?&](utm_\w+|ref|source|fbclid|gclid)=[^&]*', '', url)
    return url

class URLDeduplicator:
    def __init__(self):
        self.seen = set()
    
    def is_duplicate(self, url: str) -> bool:
        normalized = normalize_url(url)
        url_hash = xxhash.xxh64(normalized).hexdigest()
        if url_hash in self.seen:
            return True
        self.seen.add(url_hash)
        return False

# ========== MinHash 去重 ==========

def get_ngrams(text: str, n: int = 5, is_chinese: bool = False) -> set:
    """提取 n-gram 集合"""
    if is_chinese:
        # 中文按字符级 n-gram
        chars = re.sub(r'\s+', '', text)
        return {chars[i:i+n] for i in range(len(chars) - n + 1)}
    else:
        # 英文按词级 n-gram
        words = text.lower().split()
        return {" ".join(words[i:i+n]) for i in range(len(words) - n + 1)}

def compute_minhash(ngrams: set, num_perm: int = 128) -> MinHash:
    """计算 MinHash 签名"""
    m = MinHash(num_perm=num_perm)
    for ngram in ngrams:
        m.update(ngram.encode('utf-8'))
    return m

class MinHashDeduplicator:
    def __init__(self, threshold: float = 0.8, num_perm: int = 128):
        self.lsh = MinHashLSH(threshold=threshold, num_perm=num_perm)
        self.count = 0
    
    def is_duplicate(self, text: str, doc_id: str, 
                     is_chinese: bool = False) -> bool:
        ngrams = get_ngrams(text, n=3 if is_chinese else 5, 
                           is_chinese=is_chinese)
        if len(ngrams) < 5:
            return False  # 文本太短，跳过
        
        minhash = compute_minhash(ngrams)
        
        # 查询是否有近似重复
        result = self.lsh.query(minhash)
        if result:
            return True
        
        # 插入
        try:
            self.lsh.insert(doc_id, minhash)
        except ValueError:
            pass  # 重复 key，忽略
        
        self.count += 1
        return False

# ========== 主流程 ==========

def dedup_pipeline(input_files: list[str], output_dir: str, 
                   language: str = "en"):
    """完整去重流程"""
    url_dedup = URLDeduplicator()
    minhash_dedup = MinHashDeduplicator(threshold=0.8)
    is_chinese = (language == "zh")
    
    stats = {"total": 0, "url_dup": 0, "minhash_dup": 0, "kept": 0}
    
    output_path = Path(output_dir) / f"deduped_{language}.jsonl"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "wb") as out:
        for filepath in tqdm(input_files, desc=f"Dedup {language}"):
            with open(filepath, "rb") as f:
                for line in f:
                    stats["total"] += 1
                    doc = orjson.loads(line)
                    
                    # URL 去重
                    if url_dedup.is_duplicate(doc["url"]):
                        stats["url_dup"] += 1
                        continue
                    
                    # MinHash 去重
                    doc_id = f"{filepath}_{stats['total']}"
                    if minhash_dedup.is_duplicate(
                        doc["text"], doc_id, is_chinese
                    ):
                        stats["minhash_dup"] += 1
                        continue
                    
                    out.write(orjson.dumps(doc) + b"\n")
                    stats["kept"] += 1
    
    print(f"\n去重统计 ({language}):")
    print(f"  总文档: {stats['total']:,}")
    print(f"  URL 重复: {stats['url_dup']:,} "
          f"({stats['url_dup']/stats['total']*100:.1f}%)")
    print(f"  MinHash 重复: {stats['minhash_dup']:,} "
          f"({stats['minhash_dup']/stats['total']*100:.1f}%)")
    print(f"  保留: {stats['kept']:,} "
          f"({stats['kept']/stats['total']*100:.1f}%)")
    
    return stats
```

## 第四步：质量过滤

```python
# step4_quality.py
"""
模型驱动的质量过滤
方案：使用 KenLM 困惑度 + 小模型分类器
"""
import kenlm
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# ========== 困惑度过滤 ==========

class PerplexityFilter:
    """使用 KenLM 计算文档困惑度"""
    
    def __init__(self, model_path: str):
        self.model = kenlm.Model(model_path)
    
    def score(self, text: str) -> float:
        """返回文档的困惑度（越低说明越像高质量文本）"""
        words = text.split()
        if len(words) == 0:
            return float('inf')
        log_prob = self.model.score(" ".join(words))
        ppl = 10 ** (-log_prob / len(words))
        return ppl
    
    def filter(self, text: str, 
               low_pct: float = 5, high_pct: float = 80) -> bool:
        """
        过滤策略：
        - 困惑度极低 → 重复/模板内容 → 丢弃
        - 困惑度极高 → 乱码/低质量 → 丢弃
        - 中等困惑度 → 正常内容 → 保留
        """
        ppl = self.score(text)
        # 这里的阈值需要根据实际数据分布校准
        return 10 <= ppl <= 1000

# ========== 分类器过滤 ==========

class QualityClassifier:
    """基于小模型的质量分类器"""
    
    def __init__(self, model_name: str = "HuggingFaceTB/fineweb-edu-classifier"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.model.eval()
        if torch.cuda.is_available():
            self.model.cuda()
    
    @torch.no_grad()
    def score_batch(self, texts: list[str]) -> list[float]:
        """批量打分"""
        inputs = self.tokenizer(
            texts, 
            truncation=True, 
            max_length=512, 
            padding=True, 
            return_tensors="pt"
        )
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        outputs = self.model(**inputs)
        scores = outputs.logits.squeeze(-1).cpu().numpy()
        return scores.tolist()

# ========== 组合过滤 ==========

def quality_filter_pipeline(
    input_path: str, 
    output_path: str,
    ppl_model_path: str = None,
    classifier_model: str = None,
    classifier_threshold: float = 2.5,
    batch_size: int = 64,
):
    """
    质量过滤主流程
    
    参数：
    - classifier_threshold: 质量分阈值，FineWeb-Edu 用 3，
      我们用 2.5 以保留更多数据
    """
    # 初始化过滤器
    ppl_filter = PerplexityFilter(ppl_model_path) if ppl_model_path else None
    classifier = QualityClassifier(classifier_model) if classifier_model else None
    
    stats = {"total": 0, "ppl_reject": 0, "cls_reject": 0, "kept": 0}
    
    # 批量处理
    batch_texts = []
    batch_docs = []
    
    with open(input_path, "rb") as fin, open(output_path, "wb") as fout:
        for line in fin:
            doc = orjson.loads(line)
            text = doc["text"]
            stats["total"] += 1
            
            # PPL 过滤
            if ppl_filter and not ppl_filter.filter(text):
                stats["ppl_reject"] += 1
                continue
            
            batch_texts.append(text)
            batch_docs.append(doc)
            
            # 批量分类
            if len(batch_texts) >= batch_size:
                if classifier:
                    scores = classifier.score_batch(batch_texts)
                    for doc, score in zip(batch_docs, scores):
                        if score >= classifier_threshold:
                            doc["quality_score"] = round(score, 2)
                            fout.write(orjson.dumps(doc) + b"\n")
                            stats["kept"] += 1
                        else:
                            stats["cls_reject"] += 1
                else:
                    for doc in batch_docs:
                        fout.write(orjson.dumps(doc) + b"\n")
                        stats["kept"] += 1
                
                batch_texts.clear()
                batch_docs.clear()
        
        # 处理最后一批
        if batch_texts:
            if classifier:
                scores = classifier.score_batch(batch_texts)
                for doc, score in zip(batch_docs, scores):
                    if score >= classifier_threshold:
                        doc["quality_score"] = round(score, 2)
                        fout.write(orjson.dumps(doc) + b"\n")
                        stats["kept"] += 1
                    else:
                        stats["cls_reject"] += 1
            else:
                for doc in batch_docs:
                    fout.write(orjson.dumps(doc) + b"\n")
                    stats["kept"] += 1
    
    return stats
```

## 第五步：打包为训练格式

```python
# step5_package.py
"""
将清洗后的数据打包为可直接用于训练的格式
"""
from transformers import AutoTokenizer
from datasets import Dataset
import numpy as np

def package_to_parquet(
    input_path: str,
    output_dir: str,
    tokenizer_name: str = "meta-llama/Meta-Llama-3-8B",
    max_seq_length: int = 8192,
    rows_per_file: int = 50000,
):
    """打包为 Parquet 格式（兼容 HuggingFace datasets）"""
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)
    
    all_docs = []
    with open(input_path, "rb") as f:
        for line in f:
            doc = orjson.loads(line)
            tokens = tokenizer.encode(doc["text"])
            all_docs.append({
                "text": doc["text"],
                "token_count": len(tokens),
                "language": doc.get("language", "unknown"),
                "source": doc.get("source", "unknown"),
                "url": doc.get("url", ""),
                "quality_score": doc.get("quality_score", 0.0),
            })
    
    # 创建 dataset 并保存
    dataset = Dataset.from_list(all_docs)
    dataset.save_to_disk(output_dir)
    
    # 打印统计
    total_tokens = sum(d["token_count"] for d in all_docs)
    print(f"总文档数: {len(all_docs):,}")
    print(f"总 token 数: {total_tokens:,} ({total_tokens/1e9:.2f}B)")
    print(f"平均 tokens/文档: {total_tokens/len(all_docs):.0f}")
    
    return dataset

def package_to_memmap(
    input_path: str,
    output_path: str,
    tokenizer_name: str,
    eos_token_id: int = None,
):
    """打包为 numpy memmap（适合 Megatron-LM）"""
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)
    if eos_token_id is None:
        eos_token_id = tokenizer.eos_token_id
    
    # 第一遍：统计总 token 数
    total_tokens = 0
    with open(input_path, "rb") as f:
        for line in f:
            doc = orjson.loads(line)
            tokens = tokenizer.encode(doc["text"])
            total_tokens += len(tokens) + 1  # +1 for EOS
    
    print(f"总 tokens: {total_tokens:,}")
    
    # 第二遍：写入 memmap
    data = np.memmap(output_path, dtype=np.uint16, mode='w+', 
                     shape=(total_tokens,))
    
    offset = 0
    with open(input_path, "rb") as f:
        for line in tqdm(f, desc="Tokenizing"):
            doc = orjson.loads(line)
            tokens = tokenizer.encode(doc["text"])
            tokens.append(eos_token_id)
            
            data[offset:offset+len(tokens)] = np.array(tokens, dtype=np.uint16)
            offset += len(tokens)
    
    data.flush()
    print(f"已保存到 {output_path}")
```

## 完整运行脚本

```bash
#!/bin/bash
# run_pipeline.sh - 一键运行完整数据处理流水线

set -e

echo "=========================================="
echo "  预训练数据处理流水线 v2.0"
echo "=========================================="

# Step 1: 下载与提取
echo "[1/5] 下载并提取 Common Crawl 数据..."
python step1_download.py \
    --crawl-id CC-MAIN-2024-51 \
    --max-segments 100 \
    --output-dir data/raw \
    --workers 16

# Step 2: 语言识别与基础过滤
echo "[2/5] 语言识别与基础过滤..."
python step2_filter.py \
    --input-dir data/raw \
    --output-dir data/filtered \
    --languages zh,en

# Step 3: 去重
echo "[3/5] 去重..."
python step3_dedup.py \
    --input-dir data/filtered/zh \
    --output-dir data/deduped \
    --language zh \
    --minhash-threshold 0.8

python step3_dedup.py \
    --input-dir data/filtered/en \
    --output-dir data/deduped \
    --language en \
    --minhash-threshold 0.8

# Step 4: 质量过滤
echo "[4/5] 质量过滤..."
python step4_quality.py \
    --input data/deduped/deduped_en.jsonl \
    --output data/quality/en.jsonl \
    --classifier-threshold 2.5

python step4_quality.py \
    --input data/deduped/deduped_zh.jsonl \
    --output data/quality/zh.jsonl \
    --ppl-only  # 中文暂时只用 PPL 过滤

# Step 5: 打包
echo "[5/5] 打包为训练格式..."
python step5_package.py \
    --input data/quality/ \
    --output data/final/ \
    --tokenizer meta-llama/Meta-Llama-3-8B \
    --format parquet

echo "=========================================="
echo "  完成！最终数据集保存在 data/final/"
echo "=========================================="
```

## 质量验证 Checklist

数据集构建完成后，务必检查以下项目：

```markdown
## 质量验证清单

### 基本统计
- [ ] 总 token 数符合预期（±10%）
- [ ] 语言分布符合目标配比
- [ ] 文档长度分布合理（无异常峰值）

### 抽样检查
- [ ] 随机抽取 100 条中文文档，人工检查质量
- [ ] 随机抽取 100 条英文文档，人工检查质量
- [ ] 确认无明显的乱码、广告、垃圾内容

### 去重验证
- [ ] 用独立脚本随机抽取 10000 对文档，计算 Jaccard 相似度
- [ ] 确认高相似度（>0.8）的文档对比例 < 0.1%

### 敏感内容
- [ ] PII（个人信息）检测通过
- [ ] 无明显有害内容
- [ ] 版权风险文档已移除

### 训练可用性
- [ ] 数据格式可被训练框架正确加载
- [ ] 小规模试训练（1B tokens）loss 曲线正常
- [ ] Tokenizer 兼容性确认
```

## 常见坑与解决方案

### 坑 1: 中文编码问题

Common Crawl 中大量中文网页使用 GBK/GB2312 编码，直接用 UTF-8 解码会乱码。

```python
# 解决方案：尝试多种编码
import chardet

def safe_decode(raw_bytes: bytes) -> str:
    for encoding in ['utf-8', 'gb2312', 'gbk', 'gb18030', 'big5']:
        try:
            return raw_bytes.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            continue
    # 最后用 chardet 猜测
    detected = chardet.detect(raw_bytes)
    return raw_bytes.decode(detected['encoding'] or 'utf-8', errors='ignore')
```

### 坑 2: MinHash 内存爆炸

处理 10B+ 文档时，MinHash LSH 索引可能占用数百 GB 内存。

```python
# 解决方案：分片处理
# 将数据按 URL 域名的 hash 分成 N 个分片
# 每个分片独立去重，再做跨分片去重
SHARD_COUNT = 64

def get_shard(url: str) -> int:
    domain = urlparse(url).netloc
    return xxhash.xxh64(domain).intdigest() % SHARD_COUNT
```

### 坑 3: 质量分类器的语言偏差

FineWeb-Edu 的分类器主要在英文数据上训练，对中文效果不佳。

```python
# 解决方案：为中文单独训练分类器
# 1. 用 GPT-4/Claude 对 10K 中文文档打质量分
# 2. Fine-tune 一个中文分类器（如 bert-base-chinese）
# 3. 或者对中文数据只用 PPL + 规则过滤
```

## 后续优化方向

1. **引入合成数据**：用模型将低质量文档改写为高质量版本
2. **课程学习排序**：按质量分和领域对数据排序，训练时按课程呈现
3. **领域自适应过滤**：为不同下游任务定制不同的过滤策略
4. **持续更新**：建立月度数据更新流水线，持续纳入新的 Common Crawl 快照
