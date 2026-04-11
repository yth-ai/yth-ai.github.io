---
title: "数据去重的深水区：从 MinHash 到语义去重，当「重复」不再是字面意思"
description: "系统解读预训练数据去重技术的演进全景——从精确去重、MinHash 近似去重、后缀数组子串去重，到 SemDeDup 语义去重和 D4 多样化选择，以及去重与多轮训练之间被忽视的深层博弈"
date: 2026-04-01T07:00
series: "数据工程观察"
volume: 10
tags: ["数据去重", "deduplication", "MinHash", "SemDeDup", "D4", "后缀数组", "语义去重", "FineWeb", "DCLM", "多轮训练", "数据质量"]
---

## 本期主题：你以为去重是个已解决的问题？

在预训练数据工程的讨论中，"去重"长期被视为一个相对简单的环节——跑一遍 MinHash，设个阈值，去掉重复文档，收工。几乎所有主流数据集（C4、The Pile、RedPajama、FineWeb、DCLM-Baseline）都在管线中包含了某种形式的去重步骤，这似乎已经是一个"标准操作"。

但实际操作中，去重远比想象的复杂：

- **"重复"的定义本身就不唯一**。两个文档共享 30% 的段落算重复吗？语义高度相似但措辞不同算重复吗？一段文本在 1000 个网页中以 boilerplate 形式出现算重复吗？
- **去重的粒度选择影响巨大**。文档级、段落级、子串级、语义级——不同粒度的去重效果差异可达数个百分点。
- **去重不是越多越好**。过度去重会损害数据多样性，反而伤害模型性能。
- **去重与多轮训练存在深层交互**。当高质量数据不够用、需要重复训练时，去重策略需要被重新审视。

本期系统梳理预训练数据去重的技术栈——从经典方法到前沿探索，从工程实践到理论分析。

---

## 一、去重技术的四个层次

在深入具体工作之前，先建立一个全景框架。预训练数据去重可以按**检测粒度**分为四个层次，每层解决不同类型的"重复"：

```
去重技术演进全景图

层次 1：精确去重（Exact Deduplication）
  ┌──────────────────────────────────────────────────┐
  │  方法：URL 去重、文档哈希（MD5/SHA256）            │
  │  检测：完全相同的文档                              │
  │  代价：O(N) 时间，低内存                           │
  │  局限：改一个标点就逃逸                            │
  └──────────────────────────────────────────────────┘
            ↓  解决不了"近似重复"

层次 2：近似去重（Fuzzy/Near-Duplicate Deduplication）
  ┌──────────────────────────────────────────────────┐
  │  方法：MinHash + LSH、SimHash、Bloom Filter        │
  │  检测：n-gram 级别高度重叠的文档对                  │
  │  代价：O(N) ~ O(N log N)，较高内存                 │
  │  局限：只看字面重叠，语义相似但措辞不同的漏掉       │
  └──────────────────────────────────────────────────┘
            ↓  解决不了"子串污染"

层次 3：子串去重（Substring Deduplication）
  ┌──────────────────────────────────────────────────┐
  │  方法：后缀数组（Suffix Array）                     │
  │  检测：跨文档的重复子串（如 boilerplate、模板文本）  │
  │  代价：O(N log N) 时间，高内存                     │
  │  局限：纯字面匹配，计算开销大                      │
  └──────────────────────────────────────────────────┘
            ↓  解决不了"语义冗余"

层次 4：语义去重（Semantic Deduplication）
  ┌──────────────────────────────────────────────────┐
  │  方法：SemDeDup、D4、embedding 聚类               │
  │  检测：语义高度相似但措辞不同的文档                 │
  │  代价：需要 GPU 推理生成 embedding                 │
  │  局限：依赖 embedding 模型质量，阈值敏感           │
  └──────────────────────────────────────────────────┘
```

现实中的数据管线通常**组合使用多个层次**。FineWeb 用了精确去重 + MinHash；DCLM 在此基础上加了后缀数组和 Bloom Filter；D4 则在 MinHash 之后叠加了基于 embedding 的语义多样化。

关键洞察：**每个层次解决的"重复"类型不同，不能互相替代**。

---

## 二、经典方法的工程实践：比你想象的更有讲究

### 1. MinHash + LSH：工业标准的精妙之处

MinHash 是目前最广泛使用的近似去重算法。原理大家都知道——通过随机哈希函数估计两个文档 n-gram 集合的 Jaccard 相似度，再用 LSH 分桶减少比较次数。但工程实践中的细节决定成败。

**FineWeb 的去重发现（NeurIPS 2024）**

[FineWeb](https://arxiv.org/abs/2406.17557)（Guilherme Penedo 等 / HuggingFace / NeurIPS 2024 Datasets Track）在构建 15T token 数据集的过程中，对 MinHash 去重进行了深入的消融实验，几个关键发现值得详细展开：

**发现一：每个 Common Crawl dump 独立去重 vs. 全局去重**

FineWeb 团队最初对每个 Common Crawl 快照（dump）独立做 MinHash 去重，而非跨所有快照全局去重。这个看似"偷懒"的选择背后有工程原因——全局去重对 96 个快照的计算开销极高。

但消融实验表明：**独立去重后再跨 dump 去重，额外提升有限**。原因是不同 dump 之间的重复文档，大部分已被同一 dump 内的去重捕获（因为 Common Crawl 的 URL 重叠率很高）。

> **实践启示**：如果计算资源有限，优先在单个 dump 内做彻底的去重，而非追求跨 dump 全局去重。边际收益递减的速度很快。

**发现二：参数选择的影响**

FineWeb 使用 5-gram、112 个哈希函数、Jaccard 阈值 0.75。这些参数的选择经过了消融验证：

| 参数 | FineWeb 选择 | 备选 | 影响 |
|------|-------------|------|------|
| n-gram 大小 | 5 | 3, 7, 13 | 太小→误杀多，太大→漏检多 |
| 哈希函数数量 | 112 | 64, 128, 256 | 更多→更准但更慢 |
| Jaccard 阈值 | 0.75 | 0.5, 0.8, 0.9 | 更低→更激进去重 |

**发现三：去重对模型性能的影响是实质性的**

在控制变量实验中，MinHash 去重后训练的 1.8B 模型，在多个 benchmark 上比未去重版本高 **1-3 个百分点**。这个提升幅度在预训练阶段是显著的。

---

### 2. "[Deduplicating Training Data Makes Language Models Better](https://arxiv.org/abs/2107.06499)" (Google / ACL 2022)

**来自 Google（Katherine Lee, Daphne Ippolito, Andrew Nystrom, Chiyuan Zhang, Douglas Eck, Chris Callison-Burch, Nicholas Carlini）**

这篇奠基性工作首次系统证明了去重对语言模型训练的重要性，并开源了基于后缀数组的子串去重工具 [deduplicate-text-datasets](https://github.com/google-research/deduplicate-text-datasets)。

**核心发现**：

- C4 数据集中存在大量近似重复：一个 50 词的序列在数据集中重复出现了 **60,000 次**
- 未去重的模型更容易逐字记忆训练数据——这不仅是效率问题，更是**隐私和安全问题**
- 去重后，模型的 memorization（记忆化）行为显著减少，同时下游性能不降反升

**后缀数组方法的核心思路**：

```
后缀数组子串去重流程：

步骤 1：将整个数据集拼接为一个长字符串
  doc_1 + [SEP] + doc_2 + [SEP] + ... + doc_N

步骤 2：构建后缀数组（Suffix Array）
  对所有后缀按字典序排序
  → 相同的子串会排列在相邻位置

步骤 3：检测重复子串
  扫描排序后的后缀数组，找到长度 ≥ k 的重复子串
  （k 通常设为 50-100 个字符）

步骤 4：标记并移除
  将重复子串从文档中移除或替换
```

**工程挑战**：后缀数组的空间复杂度是 O(N)，对于万亿 token 级别的数据集，内存需求在 TB 级别。Google 的实现通过分片处理缓解了这个问题，但仍然是计算密集型的。

> **对实践的启示**：后缀数组去重和 MinHash 去重互补——MinHash 发现"这两个文档很像"，后缀数组发现"这段文本在 1000 个文档中都出现了"。在数据管线中，通常先做精确/MinHash 文档级去重，再做后缀数组子串去重。

---

### 3. "[Evaluation of Document Deduplication Algorithms for Large Text Corpora](https://link.springer.com/chapter/10.1007/978-3-031-82481-4_27)" (Fraunhofer IAIS / LOD 2024)

**来自 Fraunhofer IAIS 和 Lamarr Institute（Johannes Leveling 等）**

这篇工作对五种去重算法进行了系统的横向比较，填补了一个长期缺失的基准评估。

**评估矩阵**：

| 算法 | 精确度 | 召回率 | 内存需求 | 适用场景 |
|------|--------|--------|---------|---------|
| MinHash/LSH | **0.985** | **0.989** | 高 | 通用首选 |
| Exact Hash | 0.960 | 0.247 | 低 | 精确重复 |
| SimHash | 0.833 | 0.856 | 中 | 资源受限 |
| Bloom Filter | 0.958 | 0.970 | **最低** | 内存受限 |
| Suffix Array | 0.920 | 0.934 | **最高** | 子串级去重 |

**关键发现**：

- MinHash/LSH 在精确度和召回率上都是最优的，但内存需求较高
- **召回率的巨大差异**（0.247 到 0.989）意味着不同算法的"激进程度"完全不同——Exact Hash 非常保守（只去掉完全相同的），MinHash 则相当激进
- 在资源受限场景下，Scalable Bloom Filter 是一个被低估的选择

> **对实践的启示**：选择去重算法时，精确度和召回率的权衡比"哪个算法最好"更重要。过高的召回率意味着更多"误杀"（把不该去的也去了），过低则意味着残留大量重复。需要根据下游任务调优。

---

## 三、语义去重：当"重复"超越字面

### 4. "[SemDeDup: Data-efficient learning at web-scale through semantic deduplication](https://arxiv.org/abs/2303.09540)" (Meta FAIR / ICLR 2024)

**来自 Meta FAIR（Amro Abbas, Kushal Tirumala, Dániel Simig, Surya Ganguli, Ari Morcos）**

SemDeDup 是语义去重方向的开创性工作。它的核心观察是：**字面去重（MinHash 等）只能发现"长得像"的重复，而大量语义冗余被漏掉了**。

**什么是语义冗余？**

两条新闻报道，一条来自 CNN，一条来自 BBC，都在报道同一事件，但用完全不同的措辞。MinHash 不会把它们标记为重复（因为 n-gram 重叠率低），但从信息量角度看，它们对模型提供的是高度冗余的信号。

**SemDeDup 的方法**：

```
SemDeDup 流程：

步骤 1：生成 Embedding
  对每个文档用预训练模型（如 CLIP/BERT）生成向量表示

步骤 2：K-Means 聚类
  将所有文档 embedding 聚类为 K 个簇
  → 语义相似的文档被分到同一簇

步骤 3：簇内去重
  在每个簇内，计算文档对的余弦相似度
  相似度 > ε 的文档对，保留一个，去掉其余

步骤 4：输出去重后的数据集
  保留率可通过 ε 阈值灵活控制
```

**关键结果**：

| 设置 | 数据保留率 | 性能变化 | 训练效率 |
|------|-----------|---------|---------|
| 无去重 | 100% | 基线 | 基线 |
| SemDeDup ε=0.8 | ~70% | 持平或略升 | +30% 效率 |
| SemDeDup ε=0.6 | ~50% | 略降 | +50% 效率 |
| MinHash 去重 | ~85% | 略升 | +15% 效率 |
| SemDeDup + MinHash | ~60% | 持平 | **+40% 效率** |

最引人注目的发现：**SemDeDup 去掉 30% 的数据后，模型性能不降反升**。这说明语义冗余不仅浪费算力，还可能因为过度强化某些分布而伤害泛化。

> **对实践的启示**：
> - 语义去重和字面去重正交——先做 MinHash，再做 SemDeDup，效果叠加
> - 语义去重的阈值需要根据数据集特点调优，ε 太低会损害多样性
> - 需要 GPU 资源生成 embedding，但这是一次性成本

---

### 5. "[D4: Improving LLM Pretraining via Document De-Duplication and Diversification](https://arxiv.org/abs/2308.12284)" (Meta FAIR / NeurIPS 2023)

**来自 Meta FAIR（Kushal Tirumala, Daniel Simig, Armen Aghajanyan, Ari Morcos）**

D4 将去重和多样性选择统一为一个框架。它的核心观点是：**去重只是第一步，真正的目标是最大化数据集的信息多样性**。

**D4 的两步流程**：

```
D4 = Deduplication + Diversification

步骤 1：MinHash 去重
  标准的 MinHash + LSH 近似去重
  → 去除字面重复

步骤 2：基于 SSL Embedding 的多样化选择
  ┌──────────────────────────────────────────────────┐
  │  用预训练模型生成每个文档的 embedding              │
  │  在 embedding 空间中做 K-Means 聚类               │
  │  计算每个文档到其簇心的距离                        │
  │  优先保留离簇心远的文档（更"独特"的样本）          │
  │  → 效果：在保持覆盖面的同时最大化多样性            │
  └──────────────────────────────────────────────────┘
```

**关键结果**：在 CommonCrawl 上训练 6.7B 模型，D4 相比随机选择带来了 **20% 的训练效率提升**（即用 80% 的 token 达到相同性能）。

D4 和 SemDeDup 的关键区别在于**去重之后做什么**：
- SemDeDup：去掉语义冗余，保留剩下的
- D4：去掉语义冗余，然后**主动挑选最多样化的子集**

> **对实践的启示**：去重不应该只是"减法"（去掉坏的），还应该是"选择"（留下最好的）。D4 的框架把去重和数据选择统一了起来。这与我们在 [Vol.9](data-engineering-2026-03-31) 讨论的数据选择方法论一脉相承。

---

## 四、工具生态：从脚本到平台

去重工具在 2024-2025 年经历了从"研究脚本"到"工程平台"的转变：

| 工具 | 维护者 | 支持的算法 | 规模 | GPU 加速 |
|------|--------|-----------|------|---------|
| [text-dedup](https://github.com/ChenghaoMou/text-dedup) | Chenghao Mou | MinHash, SimHash, Suffix Array, Bloom Filter | 中等 | ❌ |
| [deduplicate-text-datasets](https://github.com/google-research/deduplicate-text-datasets) | Google Research | Suffix Array | 大 | ❌ |
| [NeMo Curator](https://github.com/NVIDIA-NeMo/Curator) | NVIDIA | MinHash, Exact, **SemDeDup** | **万亿级** | ✅ |
| [Milvus 2.6 MinHash LSH](https://milvus.io/docs/zh/minhash-lsh.md) | Zilliz | MinHash + LSH（向量数据库集成） | 万亿级 | ✅ |
| [datatrove](https://github.com/huggingface/datatrove) | HuggingFace | MinHash, Exact | 大 | ❌ |

**值得关注的趋势**：

**NeMo Curator** 是目前功能最完整的去重平台。它基于 RAPIDS 实现了 GPU 加速的 MinHash 和语义去重，支持多节点分布式处理。对于万亿 token 级别的数据集，GPU 加速可以将去重时间从"周"级压缩到"天"级。

**Milvus 2.6** 引入了 MinHash LSH 索引类型，将近似去重能力集成到向量数据库中。这意味着去重不再需要独立的批处理管线——可以在数据入库时实时去重。据 Zilliz 的基准测试，相比传统 MinHash 实现，Milvus 方案的处理速度提升 **2x**，成本降低 **3-5x**。

**text-dedup** 则走了另一条路——轻量级、模块化、配置驱动。v2 版本引入了 TOML 配置文件，支持通过配置切换不同的去重算法，适合中小规模的实验和研究。

> **选型建议**：
> - 研究/实验：text-dedup（灵活、易上手）
> - 生产级英文数据：datatrove（FineWeb 同款）
> - 万亿级多语言数据 + GPU 集群：NeMo Curator
> - 需要实时去重/已有向量数据库：Milvus 2.6

---

## 五、去重与多轮训练的深层博弈

在 Vol.9 讨论数据选择时，我们提到了一个趋势：随着高质量数据的"枯竭"，多轮训练（multi-epoch training）变得越来越常见。这与去重产生了一个有趣的张力。

### 6. "[Datasets, Documents, and Repetitions: The Practicalities of Unequal Data Quality](https://arxiv.org/abs/2503.07879)" (Apple + UW / 2025)

**来自 Apple 和 University of Washington（Alex Fang, Hadi Pouransari, Matt Jordan, Alexander Toshev, Vaishaal Shankar, Ludwig Schmidt, Tom Gunter）**

这篇工作直接挑战了"去重后单轮训练"的默认范式，提出了一个反直觉的结论：

**核心发现：激进过滤+重复训练 > 温和过滤+单轮训练**

在多个计算预算级别上，将经过激进过滤和去重的小数据集**重复训练至多 10 个 epoch**，性能优于在 **10 倍大的未过滤数据集上单轮训练**。

```
反直觉的实验结果：

场景 A：1T token 高质量数据 × 10 epoch = 10T token 训练量
场景 B：10T token 未过滤数据 × 1 epoch = 10T token 训练量

结果：场景 A > 场景 B（在多个 benchmark 上）

条件：需要调整学习率策略以适应多轮训练
```

**更深层的发现：文档不平等**

论文还发现，数据集中的文档"价值"是高度不均等的。通过显式地**调控单个文档的出现次数**（给高质量文档更多的重复，给低质量文档更少甚至不重复），可以进一步提升性能。

这意味着"去重"的最优策略不是简单的二元（去/不去），而是**对不同文档设置不同的重复次数**——某种意义上是去重的逆操作。

### 7. "[Larger Datasets Can Be Repeated More](https://arxiv.org/abs/2511.13421)" (清华大学 / NeurIPS 2025)

**来自清华大学（Tingkai Yan, Haodong Wen, Binghui Li, Kairong Luo, Wenguang Chen, Kaifeng Lyu）**

这篇理论工作从数学角度分析了多轮训练的 scaling behavior，引入了"有效复用率" $E(K, N)$ 的概念：

**核心结论**：

1. **小 K 时（K ≤ 4）**：$E(K, N) \approx K$——每多训一轮，效果约等于多加了一份新数据
2. **K 增大时**：收益递减，$E(K, N)$ 趋向一个上界，该上界与数据集大小 $N$ 正相关
3. **关键洞察：更大的数据集可以承受更多轮次的重复训练**

```
有效复用率的直觉理解：

数据集 N = 1B tokens:
  K=2: E≈2.0（几乎等于新数据）
  K=4: E≈3.5（开始衰减）
  K=10: E≈5.0（严重衰减）

数据集 N = 100B tokens:
  K=2: E≈2.0
  K=4: E≈3.9（衰减更慢）
  K=10: E≈7.5（衰减更慢）

→ 大数据集的"重复耐受度"更高
```

> **对实践的启示**：去重策略需要和训练策略联合优化。如果计划多轮训练，过于激进的去重可能不是最优的——保留更多数据（哪怕有些冗余）然后多训几轮，可能比激进去重后单轮训练更好。但这个权衡高度依赖于具体的计算预算和数据质量分布。

---

## 六、DCLM 的去重方法论：当前最全面的实践

[DataComp-LM (DCLM)](https://arxiv.org/abs/2406.11794)（Li 等 / NeurIPS 2024）作为当前最大的数据策展基准，其去重方法论值得单独拆解。

**DCLM 探索了三种去重方案的组合**：

| 方案 | 方法 | 粒度 | 效果 |
|------|------|------|------|
| MinHash | 5-gram, Jaccard 0.8 | 文档级 | 基线提升 |
| 后缀数组 | 基于 Lee et al. 2022 | 子串级 | 额外提升 |
| Bloom Filter | 精确+段落级 | 段落级 | 边际提升 |

**DCLM 的关键发现**：

1. **MinHash 是性价比最高的单一去重方法**——在绝大多数场景下，它是第一个应该部署的去重步骤
2. **后缀数组去重在 MinHash 之后仍有增量价值**——特别是对 boilerplate 文本（导航栏、免责声明等跨文档共享的模板文本）
3. **去重与内容过滤的交互**：先过滤后去重 vs. 先去重后过滤，结果不同。DCLM 推荐**先做基础过滤（去除明显低质量内容），再去重，最后做精细过滤**

**推荐的去重管线顺序**：

```
DCLM 推荐管线：

原始 Common Crawl
  → URL 去重（精确）
  → 基础启发式过滤（文档长度、语言检测等）
  → MinHash 近似去重（文档级）
  → 后缀数组子串去重（可选，视计算预算）
  → 基于模型的质量过滤（fastText 分类器等）
  → 输出
```

---

## 本期思考

> 回顾去重技术的演进，一条清晰的主线浮现：**去重正在从"工程预处理"变成"数据策展的核心组件"**。
>
> 早期，去重就是跑个脚本去掉完全相同的文档。现在，去重已经扩展为一个多层次、多粒度、需要和训练策略联合优化的决策系统。SemDeDup 证明了语义冗余的存在，D4 把去重和多样性选择统一了起来，而 Fang et al. 2025 的工作则指出，在数据稀缺的时代，"去重"甚至可能需要被部分"反转"——高质量文档值得被多看几遍。
>
> 我的判断是，未来的去重系统会向两个方向演化：
> 1. **自适应去重**：根据训练进度和模型状态动态调整去重阈值——这与 Vol.9 讨论的动态数据选择方向一脉相承
> 2. **去重即选择**：不再把去重当作独立的预处理步骤，而是将其融入数据选择的统一框架——D4 已经做了初步尝试，但距离真正的端到端优化还有距离
>
> 对于正在搭建数据管线的团队，务实的建议是：**先把 MinHash 做对**（参数调优、粒度选择、与过滤步骤的顺序），这能解决 80% 的问题。在此基础上，如果有 GPU 资源，SemDeDup 的投入产出比最高。后缀数组和 Bloom Filter 是锦上添花。

---

*下期预告：合成数据的质量保证——当训练语料由 AI 生成，如何确保质量、检测污染、避免模型坍缩*
