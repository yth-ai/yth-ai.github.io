# 第 4 章：去重——被低估的关键步骤

> *"如果你的训练数据中有 30% 的重复内容，你不是在用 15 万亿 token 训练，你是在用 10 万亿 token 训练——而且那个 '10 万亿' 还有偏差。"*

---

## 4.1 为什么去重如此重要

### 重复数据对训练的三重伤害

**第一重伤害：记忆化（Memorization）**

当一段文本在训练数据中出现多次时，模型不是在"学习"这段文本背后的知识，而是在"背诵"它。这导致模型在面对类似但不完全相同的输入时，倾向于输出记忆中的原文，而非真正理解后的回答。

Lee et al.（2022）的开创性研究《Deduplicating Training Data Makes Language Models Better》系统性地证明了这一点。他们在 C4 数据集上做了精确去重和模糊去重，发现：
- 去重后的数据集训练出的模型在多个 benchmark 上一致优于未去重版本
- 去重使模型产生的"逐字重复"（verbatim memorization）大幅减少
- **即使训练 token 总数因去重而减少，模型性能反而提升**——这是一个强有力的证据，说明重复数据的边际价值为负

**第二重伤害：泛化能力下降**

重复数据会让模型的训练 loss 看起来很好——毕竟它在"记住"的数据上 loss 可以很低。但这是虚假的繁荣。模型在训练数据分布内的表现好，并不意味着它在分布外（即真实使用场景中）也好。重复数据等效于增加了训练分布的"峰度"——让模型过度拟合到某些特定的模式上。

**第三重伤害：隐私泄露风险**

如果某个人的个人信息（比如一个特定的电话号码+姓名组合）在训练数据中出现了 50 次（比如在多个网站的缓存页面中），模型"记住"这个信息的概率远高于只出现 1 次的情况。去重可以显著降低这种隐私泄露的风险。

### 互联网数据的重复程度超乎想象

你可能以为互联网上的内容大多是独特的。实际情况是：

- **完全相同的文档**：Common Crawl 的一个快照中，约 **20-30%** 的文档是完全相同的副本（同一内容通过不同 URL 出现多次，或者被多个网站转载）
- **近似重复的文档**：另外约 **10-20%** 的文档是近似重复的——内容高度相似但有细微差异（如页眉/页脚不同、时间戳不同、评论数量不同）
- **段落级重复**：即使文档整体不重复，其中的某些段落可能在大量文档中反复出现（如法律声明、版权通知、标准化的产品描述、新闻通稿的传播）

这意味着，**如果不做去重，你的"15 万亿 token"训练集中，可能有 5 万亿 token 是重复内容。**

---

## 4.2 精确去重

精确去重是最简单也最快的去重方式：找到内容**完全相同**的文档并移除副本。

### URL 去重

**方法**：对同一 URL 只保留一份文档。

**优点**：
- 速度极快——只需要对 URL 做 hash，然后查重
- 实现简单

**局限**：
- 同一内容可以有不同的 URL（`http` vs `https`、`www.` vs 无 `www.`、URL 参数不同、短链接）
- 不同 URL 可以指向完全相同的内容（镜像站点、CDN 缓存）
- 只能作为第一步粗筛，**远不够用**

**实现建议**：
```python
from urllib.parse import urlparse, urlunsplit

def normalize_url(url: str) -> str:
    """URL 标准化，合并同一页面的不同 URL 形式"""
    parsed = urlparse(url.lower())
    # 去掉 www.
    netloc = parsed.netloc.replace('www.', '')
    # 去掉常见的无意义参数
    path = parsed.path.rstrip('/')
    # 忽略 scheme (http/https 视为同一页面)
    return urlunsplit(('', netloc, path, '', ''))
```

### 文档级精确去重（Hash-based）

**方法**：计算每个文档的 hash 值（如 SHA-256），hash 相同的文档视为重复。

**优点**：
- 100% 精确——不会产生假阳性
- 速度快——SHA-256 的计算很快
- 内存友好——可以用 Bloom Filter 来节省内存

**局限**：
- 对内容的任何微小变化（多一个空格、时间戳不同）都会产生不同的 hash
- 只能发现"完全相同"的重复，无法发现近似重复

**实现**：
```python
import hashlib
from collections import defaultdict

def compute_document_hash(text: str) -> str:
    """计算文档的 SHA-256 hash"""
    # 预处理：统一空白字符，去除首尾空白
    normalized = ' '.join(text.split())
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

# 使用 Bloom Filter 节省内存（适用于万亿 token 级别）
# pip install pybloom_live
from pybloom_live import ScalableBloomFilter

class ExactDeduplicator:
    def __init__(self):
        # 初始容量 1 亿，误报率 0.001
        self.seen = ScalableBloomFilter(
            initial_capacity=100_000_000,
            error_rate=0.001
        )
    
    def is_duplicate(self, text: str) -> bool:
        h = compute_document_hash(text)
        if h in self.seen:
            return True  # 可能误报（概率 0.001）
        self.seen.add(h)
        return False
```

**Bloom Filter 的内存优势**：
- 存储 10 亿个 hash：直接存储需要 ~32GB（每个 SHA-256 hash 32 字节），Bloom Filter 只需要 ~2GB
- 代价是有 0.1% 的误报率（把非重复标记为重复），这在去重场景中是可以接受的

### 段落/行级精确去重

有时候文档整体不重复，但其中的某些段落是高度模板化的。比如：

- 法律声明："本站内容仅供参考，不构成任何法律建议..."（出现在数十万个网站上）
- Cookie 提示："我们使用 Cookie 来提升您的体验..."
- 新闻通稿：同一段通稿被数百家媒体原封不动地发布

**方法**：对每个段落（或每 N 行）计算 hash，移除出现频率超过阈值的段落。

**注意**：这个方法要谨慎使用。如果阈值设得太低，可能会误删一些"自然重复"的内容（如常见的问候语、标准化的格式文本）。建议只对长度超过一定阈值（如 > 100 字符）的段落做这种去重。

---

## 4.3 模糊去重（Fuzzy Deduplication）

模糊去重的目标是找到内容高度相似但不完全相同的文档。这是去重中最关键也最有挑战的步骤。

### MinHash + LSH：当前的主流方案

**核心思想**：

1. **Shingling**：将每个文档转换为一个 n-gram 集合
   - 例如，"今天天气很好" 的 5-gram 集合 = {"今天天气很", "天天气很好"}
   
2. **MinHash**：用多个 hash 函数对 n-gram 集合做签名压缩
   - 每个文档被压缩为一个固定长度的签名向量（如 128 维）
   - 两个文档的 MinHash 签名的相似度是它们 Jaccard 相似度的无偏估计

3. **LSH（Locality-Sensitive Hashing）**：用 banding 技术将相似文档映射到同一个桶
   - 将签名分成 b 个 band，每个 band 有 r 个 row（b × r = 签名总长度）
   - 如果两个文档在任意一个 band 上完全匹配，就认为它们是候选相似对
   - 调整 b 和 r 可以控制相似度阈值

**参数选择指南**：

| 参数 | 推荐值 | 说明 |
|:---|:---:|:---|
| **n-gram 大小 (n)** | 5（英文）/ 3-5（中文） | 太小会导致假阳性太多，太大会导致召回率下降 |
| **签名长度 (num_perm)** | 128-256 | 越长越精确，但计算量越大 |
| **band 数 (b)** | 根据目标阈值计算 | b × r = num_perm |
| **row 数 (r)** | 根据目标阈值计算 | 目标阈值 ≈ (1/b)^(1/r) |
| **相似度阈值** | 0.7-0.8 | 高于这个阈值的文档对被认为是近似重复 |

**n-gram 大小对中文的特殊影响**：

中文没有天然的单词边界。英文的 5-gram 可能包含整个短语，但中文的 5-gram 可能只有 5 个字。这意味着：

- 中文使用较小的 n（如 3-4）更合理——否则 n-gram 太长，不同文档之间的 n-gram 重合率会很低，导致即使内容很相似也检测不到
- 但 n 太小（如 1-2）又会导致假阳性太多——任何两段中文文本都会有大量的单字或双字重合

**推荐**：中文使用 **n=3 或 n=4**，配合 num_perm=128、阈值 0.75。

### 参数调优实验

不同参数组合对去重效果的影响：

```
实验设置：100M token 中文数据样本

参数组合 A (n=5, threshold=0.8):
  - 去重率：12.3%
  - 人工审查准确率（确实是重复）：96.5%
  - 召回率估计：65%（有些相似文档没被召回）

参数组合 B (n=3, threshold=0.75):
  - 去重率：18.7%
  - 人工审查准确率：91.2%
  - 召回率估计：82%

参数组合 C (n=3, threshold=0.7):
  - 去重率：24.1%
  - 人工审查准确率：83.7%
  - 召回率估计：89%

参数组合 D (n=3, threshold=0.65):
  - 去重率：31.5%
  - 人工审查准确率：72.4%（开始出现较多误杀）
  - 召回率估计：93%
```

**分析**：
- 参数组合 B 是较好的平衡点——去重率适中，准确率高
- 如果你更关心"不遗漏重复"（高召回率），选 C
- 不建议使用 D——72% 的准确率意味着近 30% 的"去重"实际是误杀

### SimHash 方案

SimHash 是另一种模糊去重方法。与 MinHash 基于集合相似度不同，SimHash 基于**余弦相似度**。

**原理**：
1. 将文档的每个特征（n-gram）映射为一个固定长度的 hash 值
2. 对所有特征的 hash 值做加权累加
3. 最终得到一个固定长度的二进制签名
4. 两个文档的 SimHash 签名的汉明距离反映了它们的相似度

**与 MinHash 的对比**：

| 维度 | MinHash + LSH | SimHash |
|:---|:---|:---|
| 相似度度量 | Jaccard | 余弦 |
| 适用场景 | 文档长度差异大时更鲁棒 | 文档长度相近时效果更好 |
| 计算效率 | 签名计算较慢，查找快 | 签名计算快，查找也快 |
| 内存占用 | 较高（需要存储签名向量） | 较低（每个文档只需 64-128 bit） |
| 参数调优 | 较复杂（n, num_perm, b, r） | 较简单（汉明距离阈值） |

**推荐**：
- 对于大规模预训练数据去重，**MinHash + LSH 是更稳健的选择**——它对文档长度差异的鲁棒性更好
- SimHash 适合作为补充方案，特别是在需要快速近似查重的场景

### Suffix Array 方案

Suffix Array 去重是一种基于子串匹配的方法。它不是在文档级别判断重复，而是在**子串级别**查找重复的长片段。

**原理**：
1. 将所有文档拼接成一个超长字符串
2. 构建后缀数组（Suffix Array）
3. 通过后缀数组快速找到所有长度超过阈值的重复子串

**优点**：
- 能发现文档内部的局部重复（如两个文档各有 80% 不同但共享一段 500 字的引用）
- 不依赖 n-gram 大小等参数

**缺点**：
- 内存消耗巨大——需要存储整个文本语料的后缀数组
- 不适合万亿 token 级别的数据（需要 TB 级内存）
- 实现复杂度高

**适用场景**：
- 数据集较小时（< 100B token）
- 需要精细的段落级去重时
- 作为 MinHash 去重后的补充步骤

---

## 4.4 大规模去重的工程挑战

当数据规模达到万亿 token 时，去重本身变成了一个严肃的工程问题。

### 分布式 MinHash 方案

**挑战**：15T token 的数据包含约 100 亿个文档。为每个文档计算 MinHash 签名，然后在所有文档对之间做比较——这是一个 O(n²) 的问题。

**解决方案**：

```
架构设计：

1. 分片计算签名
   - 将数据分成 N 个分片（如 1000 个）
   - 每个分片在一个 worker 上独立计算 MinHash 签名
   - 输出：每个文档的签名向量

2. LSH 分桶
   - 对所有签名做 LSH banding
   - 每个 band 的结果写入一个分布式 hash 表
   - 落入同一个桶的文档是候选相似对

3. 精确比较
   - 对每个桶内的候选对，计算实际的 Jaccard 相似度
   - 超过阈值的标记为重复

4. 连通分量
   - 将所有重复对构建成图
   - 找到连通分量（如果 A≈B，B≈C，则 A、B、C 属于同一组）
   - 每组保留一个代表文档
```

**技术选型**：
- **Spark / Ray**：适合中等规模（< 1T token），生态成熟
- **自定义 MapReduce**：适合超大规模，可以精细控制内存和 I/O
- **datatrove（HuggingFace）**：FineWeb 使用的框架，对 MinHash 去重有很好的支持

### 内存管理

**问题**：100 亿个文档，每个文档的 MinHash 签名是 128 个 uint32 值，总共需要 128 × 4 × 10^10 = 5.12TB 内存。

**解决方案**：

1. **分桶处理**：不需要同时在内存中保存所有签名。按 LSH band 分桶处理，每次只加载一个 band 的数据
2. **磁盘辅助**：签名写入磁盘，按需加载
3. **压缩签名**：用 uint16 替代 uint32（精度损失很小），内存减半
4. **流式处理**：签名计算和 LSH 分桶可以流水线化

### 跨数据集去重 vs 数据集内去重

**数据集内去重**：在同一个数据集中查找重复。这是标准做法。

**跨数据集去重**：在你的预训练数据集和 benchmark 评测集之间做去重（benchmark 污染检测），或者在预训练数据和 SFT 数据之间做去重。

**跨数据集去重的重要性**：
- 如果预训练数据中包含了 benchmark 的测试题目，模型在 benchmark 上的分数就是"虚高"的
- 如果 SFT 数据中的内容在预训练中已经大量出现过，SFT 的"激活"效果会被高估

### 去重顺序的影响

**先去重后过滤，还是先过滤后去重？**

```
方案 A：先去重 → 后过滤
  优点：去重在完整数据上进行，覆盖更全面
  缺点：去重的数据量更大，计算成本更高

方案 B：先过滤 → 后去重
  优点：去重的数据量较小，更快
  缺点：某些重复文档可能在过滤阶段有一份被过滤了但另一份保留了，导致去重不完整

推荐：方案 A（先去重后过滤），或至少在粗过滤后去重（去掉明显的垃圾后再去重）
```

---

## 4.5 认知变化：从"越多越好"到"分粒度按需"

```
去重的认知演变：

2020: "去重？不太需要吧"
     GPT-3 只做了 URL 级别的去重，没有做内容级别的去重

2021: "精确去重就够了"
     一些团队开始做文档级的 hash 去重，但认为模糊去重不值得

2022: "必须做模糊去重！"
     Lee et al. (2022) 的研究提供了强有力的实证证据
     → 去重后模型在多个 benchmark 上一致提升
     → "不去重 = 浪费计算资源" 成为共识

2023: "去重越多越好"
     一度成为主流观点
     → 有团队开始做段落级甚至句子级的去重
     → 追求最大化的去重率

2024: "等等，过度去重也有害"
     FineWeb 的实验发现：
     → 去重阈值设得太低（如 0.6）会误删大量不是真正重复的内容
     → 过度去重减少了训练数据的多样性
     → 某些"看起来重复"的内容其实来自不同语境，各有价值

2025-2026: "分粒度去重，按需调节"
     当前最佳实践：
     → URL 去重（基础）
     → 文档级精确去重（必须）
     → 文档级模糊去重（推荐，阈值 0.75-0.80）
     → 段落级去重（可选，对模板化内容有效）
     → 不建议在 n-gram 层面做过细的去重
```

---

## 4.6 Benchmark 污染检测

### 什么是 Benchmark 污染

如果你的预训练数据中包含了 benchmark 评测集的题目或答案，模型在 benchmark 上的得分就不能反映其真实能力——它可能只是"背诵"了答案。

这个问题比你想象的严重。因为：
- 很多 benchmark 的题目最初来源于互联网（如 HellaSwag 的数据来自 WikiHow、ARC 的数据来自科学教材）
- Common Crawl 的爬取范围极广，完全有可能爬到这些来源
- 一些 benchmark 本身就是开源的，任何人都可以把题目发布到网页上

### 检测方法

**N-gram 重叠检测**：
```python
def check_contamination(train_text: str, test_text: str, n: int = 13) -> float:
    """检测训练文本和测试文本之间的 n-gram 重叠率"""
    train_ngrams = set()
    for i in range(len(train_text) - n + 1):
        train_ngrams.add(train_text[i:i+n])
    
    test_ngrams = []
    for i in range(len(test_text) - n + 1):
        test_ngrams.append(test_text[i:i+n])
    
    if not test_ngrams:
        return 0.0
    
    overlap = sum(1 for ng in test_ngrams if ng in train_ngrams)
    return overlap / len(test_ngrams)
```

**Llama 3 使用的方法**：Llama 3 使用 token 级别的 n-gram（n=10）来检测 benchmark 污染。如果训练数据中某个文档与 benchmark 题目的 10-gram 重叠率超过一定阈值，该文档被标记为受污染并从训练集中移除。

**编辑距离方法**：计算训练文本和测试文本之间的编辑距离，适用于检测经过轻微修改的泄露（如换了几个词但意思相同）。

**Embedding 相似度方法**：用 embedding 模型将训练文本和测试文本映射到向量空间，计算余弦相似度。适用于检测语义级别的泄露（如同一道题被改写为不同的措辞）。

### 建立去污染管线的最佳实践

```
1. 收集所有需要保护的 benchmark 数据
   - 主流评测集：MMLU, HumanEval, GSM8K, ARC, HellaSwag, ...
   - 中文评测集：C-Eval, CMMLU, ...
   - 注意同时包含 train/val/test split

2. 多层检测
   - 第一层：13-gram 精确匹配（快速、高精度）
   - 第二层：编辑距离检测（捕获轻微修改）
   - 第三层（可选）：embedding 相似度（捕获语义相似的变体）

3. 处理策略
   - 对于高度匹配（>80% overlap）：从训练集中移除
   - 对于中度匹配（50-80% overlap）：标记并在评估时特别关注
   - 对于低度匹配（<50% overlap）：通常可以保留

4. 评估时的处理
   - 在模型评估时，除了标准分数外，同时报告去污染后的分数
   - 如果两者差异显著（>2%），说明存在严重的数据泄露
```

---

## 4.7 动手环节：构建一个简单的去重管线

```python
"""
一个简化的去重管线示例
目标：对一组中文文档进行精确去重 + 模糊去重
"""

import hashlib
from datasketch import MinHash, MinHashLSH

# === 第一步：精确去重 ===

def exact_dedup(documents: list[str]) -> list[str]:
    """基于 SHA-256 的精确去重"""
    seen_hashes = set()
    unique_docs = []
    
    for doc in documents:
        normalized = ' '.join(doc.split())
        h = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
        
        if h not in seen_hashes:
            seen_hashes.add(h)
            unique_docs.append(doc)
    
    print(f"精确去重: {len(documents)} → {len(unique_docs)} "
          f"(去除 {len(documents) - len(unique_docs)} 篇)")
    return unique_docs


# === 第二步：模糊去重 ===

def create_minhash(text: str, n: int = 3, num_perm: int = 128) -> MinHash:
    """为文本创建 MinHash 签名"""
    m = MinHash(num_perm=num_perm)
    # 中文使用字符级 n-gram
    for i in range(len(text) - n + 1):
        ngram = text[i:i+n]
        m.update(ngram.encode('utf-8'))
    return m


def fuzzy_dedup(documents: list[str], threshold: float = 0.75) -> list[str]:
    """基于 MinHash + LSH 的模糊去重"""
    # 创建 LSH 索引
    lsh = MinHashLSH(threshold=threshold, num_perm=128)
    
    unique_docs = []
    
    for i, doc in enumerate(documents):
        m = create_minhash(doc)
        
        # 查询是否已有相似文档
        result = lsh.query(m)
        
        if not result:
            # 没有相似文档，保留并加入索引
            try:
                lsh.insert(f"doc_{i}", m)
                unique_docs.append(doc)
            except ValueError:
                pass  # 极少数情况下可能有 hash 冲突
        # else: 有相似文档，跳过（去重）
    
    print(f"模糊去重: {len(documents)} → {len(unique_docs)} "
          f"(去除 {len(documents) - len(unique_docs)} 篇)")
    return unique_docs


# === 组合使用 ===

def dedup_pipeline(documents: list[str]) -> list[str]:
    """完整的去重管线"""
    print(f"输入文档数: {len(documents)}")
    
    # Step 1: 精确去重
    docs = exact_dedup(documents)
    
    # Step 2: 模糊去重
    docs = fuzzy_dedup(docs, threshold=0.75)
    
    print(f"最终保留: {len(docs)} ({len(docs)/len(documents)*100:.1f}%)")
    return docs


# === 测试 ===
if __name__ == "__main__":
    test_docs = [
        "大语言模型的训练数据质量非常重要，它直接决定了模型的最终表现。",
        "大语言模型的训练数据质量非常重要，它直接决定了模型的最终表现。",  # 完全重复
        "大语言模型的训练数据质量特别重要，它直接影响了模型的最终效果。",  # 近似重复
        "今天的天气非常好，适合出去散步。",  # 不同内容
        "预训练阶段的数据配比是一个关键决策，不同的配比会导致模型表现差异巨大。",
    ]
    
    result = dedup_pipeline(test_docs)
    for i, doc in enumerate(result):
        print(f"保留 [{i}]: {doc[:50]}...")
```

---

> **本章要点回顾**
>
> 1. **重复数据的三重伤害**：记忆化（影响泛化）、虚假的训练 loss（掩盖真实学习进度）、隐私泄露风险
> 2. **互联网数据的重复程度超乎想象**——未经去重的 Common Crawl 中，20-30% 是完全重复，另有 10-20% 是近似重复
> 3. **精确去重（hash-based）是必须的**，配合 Bloom Filter 可以在有限内存中处理百亿级文档
> 4. **模糊去重（MinHash + LSH）是关键步骤**，中文推荐 n=3-4、阈值 0.75-0.80
> 5. **认知演变：从"不需要"到"越多越好"到"适度"**——过度去重会伤害数据多样性
> 6. **大规模去重是一个严肃的工程问题**——需要分布式计算、内存管理、流式处理
> 7. **Benchmark 污染检测是去重的延伸**——确保训练数据不包含评测题目，防止分数虚高
