---
title: "数据工程的基础设施与工具链"
description: "处理框架、大规模工程、版本控制与自动化管线"
date: 2026-03-21
updatedDate: 2026-03-22
bookSlug: "data-engineering"
chapter: 20
part: "第五部分：横切主题"
partOrder: 5
tags: [基础设施,datatrove,数据管线]
---

> *"好的数据工程不仅在于'做什么'，还在于'用什么做'——基础设施决定了你能做到的上限。"*
>
> *你可以有最好的数据清洗算法，但如果无法在合理的时间和成本内处理 10PB 的数据，一切都是空谈。这一章是"工具篇"——从框架选择到分布式实现，从版本管理到自动化管线，帮你搭建一个生产级的数据工程基础设施。*

---

## 20.1 数据处理框架

### 主流框架对比

| 框架 | 开发方 | 核心特点 | 适用规模 | 语言 | 许可 |
|------|-------|---------|---------|------|------|
| **datatrove** | HuggingFace | FineWeb 的实际框架，模块化、可扩展 | PB 级 | Python | Apache 2.0 |
| **NeMo-Curator** | NVIDIA | GPU 加速，企业级特性 | PB 级 | Python | Apache 2.0 |
| **dolma** | AI2 | OLMo 数据管线，研究导向 | PB 级 | Rust + Python | Apache 2.0 |
| **RedPajama-Data** | Together AI | 完整参考实现，易读 | TB 级 | Python | Apache 2.0 |
| **cc_net** | Meta | CCNet 管线，专注 CC 处理 | PB 级 | Python | MIT |
| **自建方案** | - | 完全可控，深度定制 | 取决于工程投入 | - | - |

### 框架选择决策树

```
你的数据量有多大？
├── < 100GB → 简单 Python 脚本就够了（pandas/datasets）
├── 100GB - 1TB → datatrove 单机模式 / RedPajama
├── 1TB - 100TB → datatrove 分布式 / dolma
│   ├── 有 GPU 集群 → 考虑 NeMo-Curator（去重和过滤加速 5-10x）
│   └── 只有 CPU → datatrove + Spark/Dask
└── > 100TB → 自建 + datatrove/dolma 混合
    └── 必须考虑：存储架构、网络带宽、容错机制

你的团队情况？
├── 熟悉 HuggingFace 生态 → datatrove
├── 有 NVIDIA 合作 → NeMo-Curator
├── 重视可复现性 → dolma（AI2 文档最完善）
└── 需要快速原型 → RedPajama
```

### datatrove 实战

datatrove 是当前社区最活跃的数据处理框架，FineWeb 2 万亿 token 数据集就是用它构建的。

```python
"""
datatrove 实战：构建完整的预训练数据处理管线
从 Common Crawl WARC 到干净的训练数据
"""

# pip install datatrove[all]

from datatrove.pipeline.readers import WarcReader
from datatrove.pipeline.filters import (
    URLFilter,
    LanguageFilter,
    GopherQualityFilter,
    GopherRepetitionFilter,
    C4QualityFilter,
)
from datatrove.pipeline.dedup import (
    MinhashDedupSignature,
    MinhashDedupBuckets,
    MinhashDedupCluster,
    MinhashDedupFilter,
)
from datatrove.pipeline.writers import JsonlWriter
from datatrove.executor import LocalPipelineExecutor

# ====== 阶段 1：文本提取 + 基础过滤 ======
stage1_executor = LocalPipelineExecutor(
    pipeline=[
        # 从 WARC 文件读取（使用 trafilatura 提取文本）
        WarcReader(
            data_folder="s3://commoncrawl/crawl-data/CC-MAIN-2024-18/segments/",
            glob_pattern="*/warc/*",
        ),
        # URL 过滤（去除成人网站、广告网站等）
        URLFilter(
            exclusion_writer=JsonlWriter("output/stage1/excluded_urls/"),
        ),
        # 语言识别过滤（只保留中文和英文）
        LanguageFilter(
            languages=["zh", "en"],
            language_threshold=0.65,  # 置信度阈值
        ),
        # Gopher 质量过滤（Google DeepMind 的规则集）
        GopherQualityFilter(
            min_doc_words=50,           # 最少 50 词
            max_doc_words=100000,       # 最多 10 万词
            min_avg_word_length=3,      # 平均词长 ≥ 3 字符
            max_avg_word_length=10,     # 平均词长 ≤ 10 字符
            min_stop_words_ratio=0.06,  # 停用词比例下限
        ),
        # Gopher 重复检测（行级 / 段落级去重）
        GopherRepetitionFilter(
            dup_line_frac=0.3,       # 重复行比例上限
            dup_para_frac=0.3,       # 重复段落比例上限
            dup_line_char_frac=0.2,  # 重复行字符比例上限
            top_n_grams=(2, 3, 4),   # 检测 top n-gram 重复
            top_n_grams_frac=(0.2, 0.18, 0.16),
        ),
        # 写入中间结果
        JsonlWriter("output/stage1/clean/"),
    ],
    tasks=128,  # 并行任务数
    workers=32, # 工作进程数
)

# ====== 阶段 2：MinHash 模糊去重 ======
# 分 4 步执行（datatrove 的设计）

# Step 2a: 计算 MinHash 签名
stage2a = LocalPipelineExecutor(
    pipeline=[
        MinhashDedupSignature(
            input_folder="output/stage1/clean/",
            output_folder="output/stage2/signatures/",
            n_sentences=5,       # 每个 shingle 包含 5 个句子
            num_hashes=128,      # MinHash 签名维度
        ),
    ],
    tasks=128,
)

# Step 2b: LSH 分桶
stage2b = LocalPipelineExecutor(
    pipeline=[
        MinhashDedupBuckets(
            input_folder="output/stage2/signatures/",
            output_folder="output/stage2/buckets/",
            num_hashes=128,
            num_buckets=14,      # 14 个 band
            hashes_per_bucket=9, # 每个 band 9 个 hash → 相似度阈值约 0.75
        ),
    ],
    tasks=128,
)

# Step 2c: 聚类
stage2c = LocalPipelineExecutor(
    pipeline=[
        MinhashDedupCluster(
            input_folder="output/stage2/buckets/",
            output_folder="output/stage2/clusters/",
        ),
    ],
    tasks=1,  # 聚类必须单进程（全局状态）
)

# Step 2d: 过滤重复
stage2d = LocalPipelineExecutor(
    pipeline=[
        MinhashDedupFilter(
            input_folder="output/stage1/clean/",
            duplicates_folder="output/stage2/clusters/",
            output_folder="output/stage2/deduped/",
        ),
    ],
    tasks=128,
)

# 按顺序执行
for stage in [stage1_executor, stage2a, stage2b, stage2c, stage2d]:
    stage.run()
```

### NeMo-Curator：GPU 加速处理

当你有大量 GPU 资源时，NeMo-Curator 可以显著加速计算密集型步骤：

```python
"""
NeMo-Curator：GPU 加速的去重和质量过滤
需要 NVIDIA GPU + RAPIDS 环境
"""

# pip install nemo-curator[cuda12x]

import nemo_curator as nc
from nemo_curator.datasets import DocumentDataset
from nemo_curator.modules import (
    ExactDuplicates,
    FuzzyDuplicates,
    FuzzyDuplicatesConfig,
)
from nemo_curator.filters import WordCountFilter, RepeatedParagraphsFilter
from nemo_curator.utils.distributed_utils import get_client

# 初始化 Dask-CUDA 集群（自动检测 GPU）
client = get_client(cluster_type="gpu")

# 读取数据（支持 jsonl / parquet）
dataset = DocumentDataset.read_json(
    input_path="output/stage1/clean/",
    add_filename=True,
)

# GPU 加速精确去重（基于 hash）
exact_dedup = ExactDuplicates(
    hash_method="sha256",
    id_field="doc_id",
    text_field="text",
)
dataset = exact_dedup(dataset)

# GPU 加速模糊去重（比 CPU 快 5-10 倍）
fuzzy_config = FuzzyDuplicatesConfig(
    num_hashes=128,
    num_buckets=14,
    hashes_per_bucket=9,
    jaccard_threshold=0.75,
)
fuzzy_dedup = FuzzyDuplicates(config=fuzzy_config)
dataset = fuzzy_dedup(dataset)

# 保存结果
dataset.to_json("output/deduped_gpu/")

print(f"处理完成: {len(dataset)} 文档")
```

> **🔬 显微镜案例：FineWeb 的基础设施规模**
>
> HuggingFace 构建 FineWeb（15T token）的基础设施规模：
>
> | 指标 | 数值 |
> |------|------|
> | 原始 CC 数据量 | ~100TB（96 个 CC 快照） |
> | 中间文件总量 | ~300TB |
> | 最终输出 | ~30TB（15T token） |
> | CPU 核心 | 2000+ 核，分布式集群 |
> | 处理时间 | ~3 周（含调试和重试） |
> | MinHash 签名大小 | ~2TB |
> | 总存储消耗 | ~500TB（包括备份和版本） |
> | 估算云成本 | $150K-300K |
>
> 关键工程挑战：
> - **分布式 Union-Find**：去重的聚类步骤需要全局状态，是整个管线的瓶颈
> - **容错**：3 周的任务中，节点故障率约 5%，需要 checkpoint + 重试机制
> - **数据一致性**：96 个 CC 快照之间存在 URL 重叠，跨快照去重增加了复杂度
> - **质量过滤器调参**：FineWeb-Edu 的教育价值分类器经过了 >20 轮调参才达到最优
>
> **教训**：数据处理的 80% 时间花在调试和重试上，而不是"正式运行"。一个好的基础设施必须有完善的日志、checkpoint 和重试机制。

---

## 20.2 大规模数据处理的工程挑战

### PB 级数据处理的资源估算

```
处理 10PB 的预训练数据需要考虑：

存储规划：
  ├── 原始数据         ~10PB
  ├── 文本提取输出      ~3PB（HTML → 纯文本，压缩后）
  ├── 去重中间文件      ~5PB（MinHash 签名 + 桶 + 聚类）
  ├── 质量过滤中间文件   ~2PB
  ├── 最终输出          ~2PB（清洗后的训练数据）
  └── 备份 + 版本       ~5PB
  → 总计需要 ~25-30PB 可用存储

计算资源：
  ├── 文本提取          ~1000 CPU·天（IO 密集）
  ├── 语言识别          ~200 CPU·天（fasttext 推理）
  ├── 质量过滤（规则）   ~100 CPU·天
  ├── 质量过滤（模型）   ~50 GPU·天（如 FineWeb-Edu 分类器）
  ├── MinHash 签名      ~500 CPU·天 + 2TB 内存
  ├── LSH 分桶          ~100 CPU·天
  ├── 聚类（Union-Find） ~50 CPU·天 + 4TB 内存（瓶颈！）
  └── 最终过滤和输出     ~100 CPU·天
  → 总计 ~2000 CPU·天 + 50 GPU·天

成本估算（AWS 参考价）：
  ├── 存储 (S3)：30PB × $0.023/GB/月 ≈ $690K/月
  ├── 计算 (EC2)：
  │   ├── CPU: 2000 天 × ~$2/小时 × 24h ≈ $96K
  │   └── GPU: 50 天 × ~$30/小时 × 24h ≈ $36K
  ├── 网络传输：~$20K
  └── → 一次完整管线运行 ≈ $150K-250K（不含存储月费）

使用 1000 核 CPU 集群的并行化：
  → 2000 CPU·天 / 1000 核 ≈ 2 天计算时间
  → 加上 IO 和调度开销 ≈ 3-5 天端到端
```

### 分布式去重的核心实现

去重是数据管线中计算量最大且工程最复杂的步骤：

```python
"""
分布式 MinHash 去重的核心组件
生产环境中通常用 datatrove/dolma 的实现，
这里展示关键算法以便理解原理
"""
import hashlib
import struct
from typing import Optional

class DistributedMinHashDedup:
    """分布式 MinHash + LSH 去重"""
    
    def __init__(
        self,
        num_hashes: int = 128,
        num_bands: int = 14,
        rows_per_band: int = 9,
        ngram_size: int = 5,
        seed: int = 42,
    ):
        """
        参数选择指南：
        - num_hashes: 越大越精确，但计算和存储成本更高
        - num_bands × rows_per_band = num_hashes
        - 相似度阈值 ≈ (1/num_bands)^(1/rows_per_band)
        - 14 bands × 9 rows → 阈值 ≈ 0.75
        - 20 bands × 5 rows → 阈值 ≈ 0.55（更激进的去重）
        """
        assert num_bands * rows_per_band <= num_hashes
        self.num_hashes = num_hashes
        self.num_bands = num_bands
        self.rows_per_band = rows_per_band
        self.ngram_size = ngram_size
        self.seed = seed
        
        # 生成随机哈希参数（a*x + b mod p）
        import random
        rng = random.Random(seed)
        self.hash_params = [
            (rng.randint(1, 2**31 - 1), rng.randint(0, 2**31 - 1))
            for _ in range(num_hashes)
        ]
    
    def compute_signature(self, text: str) -> list[int]:
        """
        Step 1: 计算文档的 MinHash 签名
        - 提取 word-level n-grams（对中文需要先分词）
        - 对每个 n-gram 计算哈希
        - 对每个哈希函数取最小值
        """
        # 提取 shingles（n-grams）
        words = text.split()
        shingles = set()
        for i in range(len(words) - self.ngram_size + 1):
            shingle = " ".join(words[i:i + self.ngram_size])
            shingle_hash = struct.unpack(
                '<I', hashlib.md5(shingle.encode()).digest()[:4]
            )[0]
            shingles.add(shingle_hash)
        
        if not shingles:
            return [0] * self.num_hashes
        
        # 计算 MinHash 签名
        LARGE_PRIME = 2**31 - 1
        signature = []
        for a, b in self.hash_params:
            min_hash = min((a * s + b) % LARGE_PRIME for s in shingles)
            signature.append(min_hash)
        
        return signature
    
    def get_lsh_buckets(self, signature: list[int]) -> list[str]:
        """
        Step 2: LSH 分桶
        将签名分成 num_bands 个 band，
        每个 band 哈希到一个桶中
        """
        buckets = []
        for band_idx in range(self.num_bands):
            start = band_idx * self.rows_per_band
            end = start + self.rows_per_band
            band = tuple(signature[start:end])
            bucket_key = f"band_{band_idx}_{hashlib.md5(str(band).encode()).hexdigest()}"
            buckets.append(bucket_key)
        return buckets


class DistributedUnionFind:
    """
    分布式 Union-Find（并查集）
    用于将候选重复对合并成连通分量
    
    在生产环境中，这一步通常是瓶颈，
    因为需要全局状态（不能简单并行化）
    
    解决方案：
    1. 分批处理 + 迭代收敛
    2. 使用 Redis/Memcached 作为分布式存储
    3. 使用图数据库（如 Neo4j）处理大规模连通分量
    """
    
    def __init__(self):
        self.parent = {}
        self.rank = {}
    
    def find(self, x: str) -> str:
        """查找根节点（带路径压缩）"""
        if x not in self.parent:
            self.parent[x] = x
            self.rank[x] = 0
            return x
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]
    
    def union(self, x: str, y: str):
        """合并两个集合（按秩合并）"""
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
    
    def get_clusters(self) -> dict[str, list[str]]:
        """获取所有连通分量"""
        from collections import defaultdict
        clusters = defaultdict(list)
        for node in self.parent:
            root = self.find(node)
            clusters[root].append(node)
        return dict(clusters)
```

---

## 20.3 数据管理与版本控制

### 为什么数据版本管理至关重要

```
没有版本管理的后果（真实案例）：

场景：团队花了 2 个月训练了一个模型，效果很好。
     3 个月后想在新硬件上复现，发现……

  ❌ "这个模型的训练数据是哪个版本的？"
     → 没人记得。数据目录被覆盖过多次。

  ❌ "质量过滤用的是什么参数？"
     → 当时的脚本被修改了，原始参数没有记录。

  ❌ "去重的阈值是 0.7 还是 0.8？"
     → 不确定，两个版本的脚本都在。

  ❌ 结果：花了 3 周重新处理数据，但新模型的效果和原来差了 2 个点。
     原因无法排查，因为没有完整的数据血缘。
```

### 工具选择与实践

```
按规模选择版本管理工具：

小规模（< 1TB）：DVC（Data Version Control）
  ├── 与 Git 无缝集成
  ├── 文件级版本管理
  ├── 支持 S3/GCS/Azure 远程存储
  └── 最简单的起步方案

中规模（1-100TB）：lakeFS
  ├── Git-like 分支模型（branch/commit/merge）
  ├── 直接操作 S3/GCS 对象存储
  ├── 零拷贝分支（只记录差异）
  ├── 支持 ACID 事务
  └── 可以在"数据分支"上做实验而不影响主干

大规模（> 100TB）：Delta Lake / Apache Iceberg
  ├── 与 Spark 生态深度集成
  ├── PB 级数据的高效版本管理
  ├── 支持 Time Travel（回溯到任意历史版本）
  ├── Schema Evolution（字段变更不破坏兼容性）
  └── 已被 Databricks/Netflix/Apple 大规模使用

最小可行方案：Manifest 文件
  ├── 如果上面的工具都太重
  ├── 至少为每个数据版本维护一个 manifest.json
  ├── 记录：文件列表、sha256、处理参数、生成时间
  └── 这是版本管理的"地板"，不能再低了
```

```python
"""
最小可行数据版本管理：Manifest 文件
当你没有条件用 DVC/lakeFS 时，至少做到这一步
"""
import json
import hashlib
import os
from datetime import datetime

def create_data_manifest(
    data_dir: str,
    pipeline_config: dict,
    description: str = "",
) -> dict:
    """
    创建数据版本清单
    
    Args:
        data_dir: 数据目录
        pipeline_config: 处理管线的完整配置
        description: 人类可读的版本描述
    """
    manifest = {
        "version": datetime.now().strftime("%Y%m%d_%H%M%S"),
        "description": description,
        "created_at": datetime.now().isoformat(),
        "data_dir": data_dir,
        "pipeline_config": pipeline_config,
        "files": [],
        "stats": {"total_files": 0, "total_bytes": 0},
    }
    
    for root, dirs, files in os.walk(data_dir):
        for f in sorted(files):
            filepath = os.path.join(root, f)
            file_size = os.path.getsize(filepath)
            
            # 对大文件只计算前 1MB 的 hash（节省时间）
            with open(filepath, 'rb') as fh:
                chunk = fh.read(1024 * 1024)
                file_hash = hashlib.sha256(chunk).hexdigest()
            
            manifest["files"].append({
                "path": os.path.relpath(filepath, data_dir),
                "size_bytes": file_size,
                "sha256_1mb": file_hash,
            })
            manifest["stats"]["total_files"] += 1
            manifest["stats"]["total_bytes"] += file_size
    
    manifest["stats"]["total_size_human"] = _human_readable_size(
        manifest["stats"]["total_bytes"]
    )
    
    # 保存 manifest
    manifest_path = os.path.join(data_dir, f"manifest_{manifest['version']}.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    return manifest

def _human_readable_size(size_bytes: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB', 'TB', 'PB']:
        if abs(size_bytes) < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} EB"

# 使用示例
manifest = create_data_manifest(
    data_dir="/data/pretrain_v3/",
    pipeline_config={
        "source": "CC-MAIN-2024-18 to CC-MAIN-2024-30",
        "extractor": "trafilatura 1.8",
        "language_filter": {"langs": ["zh", "en"], "threshold": 0.65},
        "quality_filter": "gopher + fineweb-edu (threshold=3)",
        "dedup": "minhash-128-14-9 (jaccard=0.75)",
        "total_tokens_before_dedup": "5.2T",
        "total_tokens_after_dedup": "3.1T",
    },
    description="预训练数据 v3：2024年CC数据，新增 FineWeb-Edu 过滤",
)
```

### 数据血缘追踪

```
数据血缘（Data Lineage）的完整设计：

每条数据的血缘记录应包含：

{
  "doc_id": "cc_2024_18_seg5_doc_3847291",
  "lineage": [
    {
      "stage": "extraction",
      "timestamp": "2025-01-15T10:32:00Z",
      "tool": "trafilatura 1.8.0",
      "input": "warc://CC-MAIN-2024-18/segments/5/warc/00042.warc.gz#offset=38472",
      "params": {"include_comments": false, "include_tables": true},
      "output_size": 4523,
    },
    {
      "stage": "language_filter",
      "timestamp": "2025-01-15T11:05:00Z",
      "tool": "fasttext lid.176.bin",
      "result": {"lang": "zh", "score": 0.94},
      "decision": "keep",
    },
    {
      "stage": "quality_filter",
      "timestamp": "2025-01-15T12:30:00Z",
      "tool": "gopher_quality_v2",
      "scores": {"word_count": 1234, "avg_word_len": 4.2, "stop_ratio": 0.12},
      "decision": "keep",
    },
    {
      "stage": "dedup",
      "timestamp": "2025-01-16T08:00:00Z",
      "tool": "minhash_dedup",
      "params": {"threshold": 0.75, "num_hashes": 128},
      "cluster_id": "cluster_89247",
      "cluster_size": 3,
      "decision": "keep (representative)",
    },
  ]
}

→ 有了血缘记录，任何异常都可以追溯到根源
```

---

## 20.4 自动化数据管线（CI/CD for Data）

### 管线编排

```python
"""
数据管线编排：使用 DAG（有向无环图）管理阶段依赖
轻量级方案，不依赖 Airflow 等重框架
"""
import subprocess
import time
import json
from pathlib import Path
from dataclasses import dataclass, field

@dataclass
class PipelineStage:
    name: str
    command: str
    depends_on: list[str] = field(default_factory=list)
    timeout_hours: float = 24.0
    retries: int = 3
    checkpoint_dir: str = ""

class DataPipelineOrchestrator:
    """轻量级数据管线编排器"""
    
    def __init__(self, stages: list[PipelineStage], output_dir: str):
        self.stages = {s.name: s for s in stages}
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.status = {}  # name → "pending" | "running" | "success" | "failed"
    
    def run(self):
        """按依赖顺序执行所有阶段"""
        for name in self._topological_sort():
            stage = self.stages[name]
            
            # 检查是否已有 checkpoint
            if self._has_checkpoint(name):
                print(f"[SKIP] {name}: checkpoint exists")
                self.status[name] = "success"
                continue
            
            # 检查依赖是否都成功
            for dep in stage.depends_on:
                if self.status.get(dep) != "success":
                    print(f"[SKIP] {name}: dependency {dep} not ready")
                    self.status[name] = "skipped"
                    continue
            
            # 执行
            print(f"[START] {name}")
            self.status[name] = "running"
            success = self._execute_with_retry(stage)
            self.status[name] = "success" if success else "failed"
            
            if not success:
                print(f"[FAIL] {name}: all retries exhausted")
                break
        
        self._save_report()
    
    def _execute_with_retry(self, stage: PipelineStage) -> bool:
        for attempt in range(stage.retries):
            try:
                start = time.time()
                result = subprocess.run(
                    stage.command, shell=True,
                    timeout=stage.timeout_hours * 3600,
                    capture_output=True, text=True,
                )
                elapsed = time.time() - start
                
                if result.returncode == 0:
                    print(f"  [{stage.name}] success in {elapsed/60:.1f} min")
                    self._save_checkpoint(stage.name, elapsed)
                    return True
                else:
                    print(f"  [{stage.name}] attempt {attempt+1} failed: {result.stderr[:200]}")
            except subprocess.TimeoutExpired:
                print(f"  [{stage.name}] attempt {attempt+1} timeout")
        return False
    
    def _topological_sort(self) -> list[str]:
        """拓扑排序"""
        visited = set()
        order = []
        def visit(name):
            if name in visited: return
            visited.add(name)
            for dep in self.stages[name].depends_on:
                visit(dep)
            order.append(name)
        for name in self.stages:
            visit(name)
        return order
    
    def _has_checkpoint(self, name: str) -> bool:
        return (self.output_dir / f"{name}.checkpoint").exists()
    
    def _save_checkpoint(self, name: str, elapsed: float):
        ckpt = {"stage": name, "elapsed_sec": elapsed, "timestamp": time.time()}
        (self.output_dir / f"{name}.checkpoint").write_text(json.dumps(ckpt))
    
    def _save_report(self):
        report = {"stages": self.status, "timestamp": time.time()}
        (self.output_dir / "pipeline_report.json").write_text(
            json.dumps(report, indent=2)
        )
        print(f"\n管线报告已保存: {self.output_dir / 'pipeline_report.json'}")

# 使用示例
stages = [
    PipelineStage("extract", "python extract.py --input /data/warc/ --output /data/text/"),
    PipelineStage("lang_filter", "python filter_lang.py", depends_on=["extract"]),
    PipelineStage("quality_filter", "python filter_quality.py", depends_on=["lang_filter"]),
    PipelineStage("dedup_sign", "python dedup_minhash.py --stage sign", depends_on=["quality_filter"]),
    PipelineStage("dedup_bucket", "python dedup_minhash.py --stage bucket", depends_on=["dedup_sign"]),
    PipelineStage("dedup_cluster", "python dedup_minhash.py --stage cluster", depends_on=["dedup_bucket"]),
    PipelineStage("dedup_filter", "python dedup_minhash.py --stage filter", depends_on=["dedup_cluster"]),
    PipelineStage("stats", "python compute_stats.py", depends_on=["dedup_filter"]),
]
orchestrator = DataPipelineOrchestrator(stages, "/data/pipeline_state/")
# orchestrator.run()
```

### 质量门控（Quality Gates）

```
每个阶段之间设置质量门控，自动检测异常：

文本提取后：
  ├── 检查：平均文档长度是否在合理范围（500-5000 词）
  ├── 检查：空文档比例 < 5%
  └── 检查：非 UTF-8 文档比例 < 0.1%

语言过滤后：
  ├── 检查：目标语言比例是否符合预期（如中英混合 60:40）
  ├── 检查：被过滤掉的比例是否异常（正常 30-50%）
  └── 检查：低置信度样本的语言分布

去重后：
  ├── 检查：去重率是否在预期范围（正常 20-40%）
  ├── 检查：最大连通分量大小是否异常（> 10000 说明阈值太松）
  └── 检查：去重前后的主题分布是否一致

质量过滤后：
  ├── 检查：过滤率是否在预期范围
  ├── 检查：各质量分数的分布是否合理
  └── 检查：过滤后数据的随机样本人工审核（50 条）
```

---

## 20.5 监控与告警

### 数据管线仪表盘

一个生产级数据管线需要实时监控：

```
关键监控指标：

处理进度：
  ├── 已处理 / 总任务数
  ├── 当前处理速度（文档/秒、GB/小时）
  ├── 预计完成时间
  └── 各阶段的进度条

数据质量：
  ├── 各阶段的通过率趋势图
  ├── 异常文档的实时采样展示
  ├── 语言分布饼图
  └── 文档长度分布直方图

资源使用：
  ├── CPU / GPU 利用率
  ├── 内存使用（特别关注去重阶段）
  ├── 磁盘 IO
  └── 网络带宽（如果涉及远程存储）

告警规则：
  ├── 🔴 任何阶段失败 → 立即通知
  ├── 🟡 处理速度下降 > 50% → 调查原因
  ├── 🟡 某阶段过滤率异常偏高/偏低 → 检查过滤器
  └── 🟢 每日自动生成处理报告
```

---

## 动手环节：搭建一个迷你数据处理管线

**目标**：用 datatrove 风格的模块化设计，搭建一个处理小批量文本数据的管线。

```python
"""
动手练习：迷你数据处理管线
处理 100 个模拟网页文本，体验完整的管线流程
"""
import json
import re
import hashlib
from collections import Counter

# ====== 模拟数据 ======
raw_documents = [
    {"id": f"doc_{i:04d}", "url": f"https://example.com/page{i}", 
     "text": f"这是第 {i} 篇文档的内容。" * (i % 20 + 5)}
    for i in range(100)
]
# 故意加入一些"脏数据"
raw_documents[10]["text"] = ""  # 空文档
raw_documents[20]["text"] = raw_documents[21]["text"]  # 完全重复
raw_documents[30]["text"] = "buy now! click here! 💰💰💰" * 50  # 垃圾内容
raw_documents[40]["text"] = "a" * 3  # 过短

# ====== 管线 Step 1：基础过滤 ======
def basic_filter(docs: list[dict], min_length: int = 50) -> tuple[list, dict]:
    """基础质量过滤"""
    passed, stats = [], {"total": len(docs), "filtered": {}}
    for doc in docs:
        text = doc["text"]
        if len(text) < min_length:
            stats["filtered"].setdefault("too_short", 0)
            stats["filtered"]["too_short"] += 1
            continue
        if len(set(text)) / max(len(text), 1) < 0.05:
            stats["filtered"].setdefault("low_entropy", 0)
            stats["filtered"]["low_entropy"] += 1
            continue
        passed.append(doc)
    stats["passed"] = len(passed)
    return passed, stats

# ====== 管线 Step 2：精确去重 ======
def exact_dedup(docs: list[dict]) -> tuple[list, dict]:
    """基于 SHA256 的精确去重"""
    seen_hashes = set()
    deduped, stats = [], {"total": len(docs), "duplicates": 0}
    for doc in docs:
        text_hash = hashlib.sha256(doc["text"].encode()).hexdigest()
        if text_hash in seen_hashes:
            stats["duplicates"] += 1
            continue
        seen_hashes.add(text_hash)
        deduped.append(doc)
    stats["passed"] = len(deduped)
    return deduped, stats

# ====== 管线 Step 3：统计报告 ======
def generate_report(docs: list[dict], stage_stats: list[dict]) -> dict:
    """生成处理报告"""
    lengths = [len(d["text"]) for d in docs]
    return {
        "final_count": len(docs),
        "avg_length": round(sum(lengths) / max(len(lengths), 1), 1),
        "total_chars": sum(lengths),
        "pipeline_stages": stage_stats,
    }

# ====== 运行管线 ======
print("=" * 50)
print("迷你数据处理管线")
print("=" * 50)

all_stats = []

# Step 1
filtered, s1 = basic_filter(raw_documents)
all_stats.append({"stage": "basic_filter", **s1})
print(f"\n[Step 1] 基础过滤: {s1['total']} → {s1['passed']} (过滤 {s1['filtered']})")

# Step 2
deduped, s2 = exact_dedup(filtered)
all_stats.append({"stage": "exact_dedup", **s2})
print(f"[Step 2] 精确去重: {s2['total']} → {s2['passed']} (重复 {s2['duplicates']})")

# 报告
report = generate_report(deduped, all_stats)
print(f"\n[Report] 最终: {report['final_count']} 文档, "
      f"平均长度 {report['avg_length']} 字符, "
      f"总计 {report['total_chars']} 字符")
```

**练习扩展**：
1. 添加 MinHash 模糊去重步骤
2. 添加语言识别过滤（使用 langdetect 或 fasttext）
3. 为每个阶段添加质量门控（如果过滤率异常则报警）
4. 生成数据血缘记录（记录每条文档经过了哪些处理）

---

## 本章要点回顾

> 1. **datatrove 和 NeMo-Curator 是当前最主流的开源框架**——前者适合 CPU 集群，后者利用 GPU 加速
> 2. **PB 级数据处理的成本不可忽视**：存储是大头（~$700K/月/30PB），一次完整管线运行约 $150-250K
> 3. **分布式去重是工程最难的环节**——Union-Find 需要全局状态，是并行化的瓶颈
> 4. **数据版本管理不是奢侈品**——至少用 manifest 文件记录每个版本的文件列表和处理参数
> 5. **数据血缘追踪**：每条数据的完整处理历史应该可查询，否则无法复现和调试
> 6. **CI/CD for Data**：数据管线应该像代码一样有自动化测试、质量门控和告警机制
> 7. **80% 的时间花在调试和重试**——checkpoint、日志和重试机制是生产级管线的必备

