---
title: "Tokenizer 的复兴：BPE 之后，分词技术如何重塑数据效率的边界"
description: "从字节级模型 BLT/EvaByte 的崛起、到「压缩≠性能」的认知颠覆、再到多语言分词公平性和词表适配新范式——系统解读 Tokenizer 作为数据工程「第零步」的技术演进与实践指南"
date: 2026-03-29
series: "数据工程观察"
volume: 8
tags: ["tokenizer", "BPE", "byte-level", "BLT", "EvaByte", "数据效率", "多语言", "词表适配", "分词", "预训练"]
---

## 本期主题：大模型的「第零步」，正在被重新发明

在大模型数据工程的讨论中，我们花了大量时间研究数据过滤、数据配比、合成数据、数据去重——但几乎所有这些工作，都默认了一个前提：**文本已经被 Tokenizer 切分成了 token 序列**。

这个"第零步"长期被忽视。2020 年以来，几乎所有主流 LLM 都在使用同一种分词算法——**Byte-Pair Encoding (BPE)**，只是在词表大小和预分词规则上略有差异。GPT-4 用 BPE，LLaMA 用 BPE，Qwen 用 BPE，Mistral 用 BPE……分词器似乎已经是一个"已解决的问题"。

但 2024-2025 年，一系列研究正在颠覆这个假设：

- **Meta 的 Byte Latent Transformer (BLT)** 证明，完全不需要固定词表的字节级模型，首次在 8B 规模上匹配了传统分词模型的性能
- **EvaByte** 用仅 1/5 的训练数据量，在字节级别做到了比肩甚至超越同规模 token-based 模型的效果
- **EMNLP 2024** 的研究证明，「更少的 token = 更好的性能」这一广泛信念**并不成立**——分词不仅仅是压缩
- **NAACL 2024** 的大规模实验显示，错误的 Tokenizer 选择会导致训练成本暴增 **68%**
- **ACL 2025** 的多项工作为 Tokenizer 适配和多语言公平性提出了新范式

Tokenizer 不再是"设置好就忘记"的基础设施。它正在成为数据工程中一个关键的优化变量——影响着训练效率、推理成本、多语言公平性，甚至模型的能力边界。

本期深度拆解。

---

## 一、字节级模型的崛起：不需要 Tokenizer 的 LLM

### 1. "[Byte Latent Transformer: Patches Scale Better Than Tokens](https://arxiv.org/abs/2412.09871)" (Meta FAIR / ACL 2025 / ICML 2025)

**来自 Meta FAIR（Artidoro Pagnoni, Ram Pasunuru, Pedro Rodriguez 等 14 人）**

BLT 是 Tokenizer 革命中最具里程碑意义的工作——它首次证明，**在 8B 参数、4T 字节规模上，字节级模型可以匹配 Llama 3 等基于分词的模型**。

**核心思想：用动态"补丁"替代固定 token**

```
传统 BPE 模型：
  原始文本 → Tokenizer（固定词表）→ Token 序列 → Transformer
  
  问题：
  ┌──────────────────────────────────────────────┐
  │  ① 词表固定：无法适应新领域/语言              │
  │  ② 粒度固定：简单内容和复杂内容使用相同计算量  │
  │  ③ 信息损失：tokenization 边界可能切断语义单元 │
  │  ④ 多语言不公：中文一个字 ≈ 3-4 个 token      │
  └──────────────────────────────────────────────┘

BLT 的解法：
  原始文本 → 字节序列 → 动态补丁分组 → Transformer
  
  ┌──────────────────────────────────────────────┐
  │  三模块架构：                                  │
  │                                              │
  │  Local Encoder（轻量级）                      │
  │    字节 → 补丁表示                            │
  │    通过 hash n-gram 嵌入 + cross-attention    │
  │                                              │
  │  Global Transformer（重量级）                  │
  │    在补丁表示上做自注意力                      │
  │    这里集中了主要计算                          │
  │                                              │
  │  Local Decoder（轻量级）                      │
  │    补丁表示 → 字节预测                        │
  └──────────────────────────────────────────────┘
```

**关键创新：基于熵的动态分割**

BLT 不使用固定大小的块，而是根据下一个字节的**信息熵**来决定在哪里切分补丁：

- **高熵位置**（不可预测的字节）→ 生成小补丁 → 分配更多计算
- **低熵位置**（可预测的字节）→ 生成大补丁 → 节省计算

这意味着模型会**自动在困难内容上投入更多资源，在简单内容上快速跳过**——这是固定词表 Tokenizer 做不到的。

**Scaling 实验的核心结果**：

| 比较维度 | BLT (8B) | Llama 3 (8B, BPE) |
|---------|----------|-------------------|
| 训练数据 | 4T 字节 | 15T tokens (~4T 字节等价) |
| 标准 Benchmark | **匹配** | 基线 |
| 鲁棒性（噪声/拼写错误） | **显著更好** | 标准 |
| 多语言（FLORES-101） | **+2 分** | 基线 |
| 固定推理预算下的缩放性 | **更好** | 标准 |

**对实践的启示**：

> BLT 的意义不在于"现在就该抛弃 BPE"——8B 规模的实验还不足以定论，且工程生态尚不成熟。但它传递了一个重要信号：
> 1. **固定词表不是必需的**。字节级模型的性能天花板已经被打破
> 2. **动态计算分配**是巨大的效率红利。传统 Tokenizer 在"the"和"pneumonoultramicroscopicsilicovolcanoconiosis"上花费相同的计算量——这是一种浪费
> 3. **多语言天然公平**。字节级模型没有"中文 3-4 个 token vs 英文 1 个 token"的不公问题

---

### 2. "[EvaByte: Efficient Byte-level Language Models at Scale](https://hkunlp.github.io/blog/2025/evabyte/)" (香港大学 + SambaNova, 2025)

**来自 HKU NLP Group（Lin Zheng, Xueliang Zhao 等）**

如果说 BLT 证明了"字节级模型可以匹配 token-based 模型"，EvaByte 则证明了一个更激进的命题：**字节级模型可以用更少的数据做到更好**。

**架构亮点**：

```
EvaByte 的两大技术支柱：

┌─ 多字节预测（Multi-byte Prediction）──────────┐
│                                              │
│  8 个预测头同时预测未来 8 个字节               │
│  → 训练时：多头损失平均，几乎无额外开销        │
│  → 推理时：自推测解码（类 Medusa 树形注意力）  │
│  → 单步解码多个字节，大幅加速                  │
│                                              │
│  词表大小：仅 320（256 字节 + 64 特殊标记）    │
│  对比 Llama 3 词表：128,000                   │
│  嵌入层参数缩减：400×                         │
└──────────────────────────────────────────────┘

┌─ EVA 高效注意力（Efficient Attention）─────────┐
│                                              │
│  字节序列比 token 序列长 ~3.8×                │
│  标准注意力的 O(n²) 复杂度不可承受             │
│                                              │
│  EVA = 改进的线性化注意力                      │
│  · 将 KV 对分割为连续块                       │
│  · 每块独立线性化                             │
│  · 聚合输出                                   │
│  → 近线性复杂度 + 硬件友好                     │
└──────────────────────────────────────────────┘
```

**令人震惊的数据效率**：

| 对比 | EvaByte (6.5B) | OLMo-1.7-7B | OLMo-2-7B |
|------|---------------|-------------|-----------|
| 训练数据 | **1.5T 字节 (≈0.4T tokens)** | 2T tokens | 4T tokens |
| 数据用量 | 1× | **5×** | **10×** |
| 代码任务（HumanEval/MBPP） | **显著领先** | 标准 | 标准 |
| 总体性能 | 匹配或超越 | 基线 | 基线 |

EvaByte 用 **1/5 的数据量**，达到了同规模 token-based 模型的性能。在代码任务上甚至显著领先。

**解码速度对比**（H800 GPU，生成 512 字节/token）：

```
传统字节级 Transformer：████░░░░░░ 1× 速度
EvaByte：              ████████████████████ 5-10× 速度
Token-based LM：       ████████████ 标准速度
EvaByte（某些场景）：   ██████████████████████████ 最高 2× 于 Token-based
```

**消除 Tokenizer 怪癖的实例**：

```python
# 代码补全任务：在不同位置截断 prompt
# Token-based 模型（如 Qwen2.5-7B）：

prompt_1 = "def fibonacci("  # tokenizer 切分为 ["def", " fib", "onacci", "("]
prompt_2 = "def fibonacci( "  # tokenizer 切分为 ["def", " fibonacci", "(", " "]
# → 两种切分产生完全不同的后续生成！

# EvaByte：
# 无论在哪里截断，字节序列没有歧义
# → 生成始终一致且正确
```

**对实践的启示**：

> EvaByte 对数据工程的启示比 BLT 更直接：
> 1. **字节级模型的数据效率优势是真实的**。如果 0.4T tokens 就能达到 2-4T tokens 的效果，这对数据获取成本意味着什么？
> 2. **多模态天然兼容**。EvaByte 直接将 JPEG 字节流和文本字节流交错处理——不需要为图像设计专门的 tokenizer
> 3. **推理时的 Tokenizer 边界问题被根除**。这对代码生成、格式化输出、JSON 结构等场景意义重大

---

## 二、认知颠覆：分词不仅仅是压缩

### "[Tokenization Is More Than Compression](https://arxiv.org/abs/2402.18376)" (EMNLP 2024)

**来自 Kensho Technologies / MIT（Craig W. Schmidt, Varshini Reddy 等）**

长久以来，BPE 被理解为一种**压缩算法**——它通过合并高频字节对来减少序列长度。由此自然推导出一个假设：**token 越少（压缩率越高） → 模型性能越好**。

这篇论文用一个精心设计的实验，彻底推翻了这个假设。

**PathPiece：理论上的最优压缩 Tokenizer**

作者设计了 PathPiece——一种将文本切分为**给定词表下最少 token 数量**的分词器。如果"更少 token = 更好性能"成立，PathPiece 应该显著优于标准 BPE。

**实验规模**：64 个模型，从 350M 到 2.4B 参数。

**核心结论**：

```
假设：token 越少 → 性能越好

PathPiece vs BPE：
┌──────────────────────────────────────────────┐
│  压缩率：PathPiece >> BPE（token 数量更少）   │
│  下游性能：PathPiece ≈ BPE（没有显著提升）     │
│                                              │
│  结论：❌ 假设不成立                           │
│                                              │
│  BPE 的有效性不是来自"压缩"，而是来自：       │
│  ① 预分词步骤（pre-tokenization）的设计       │
│  ② 词表构建过程中的频率驱动组合              │
│  ③ 这些步骤隐含地编码了语言结构信息            │
└──────────────────────────────────────────────┘
```

**三阶段分析**：

| 阶段 | 内容 | 对性能的影响 |
|------|------|-------------|
| 预分词 | 如何在 BPE 之前切分文本（正则表达式规则） | **显著** |
| 词表构建 | 用什么算法决定词表中包含哪些 token | **中等**（BPE 初始化有益） |
| 实际分割 | 如何将文本切成 token 序列 | **较小**（PathPiece 的极致压缩无额外收益） |

**对实践的启示**：

> 这篇论文的核心信息是：**不要只关注词表大小和压缩率**。
> 1. **预分词正则表达式比词表大小更重要**。GPT-4 的 `cl100k_base` 和 Llama 的 SentencePiece 之间的差异，更多来自预分词规则而非词表大小
> 2. **压缩率是个误导指标**。一个 fertility 更低的 Tokenizer 不一定更好
> 3. **BPE 的"魔法"在于它是一个好的语言结构发现器**——通过频率驱动的合并过程，BPE 隐式地学习了词素边界、常见搭配等语言结构

---

## 三、被低估的成本：Tokenizer 对多语言的隐性税

### "[Tokenizer Choice For LLM Training: Negligible or Crucial?](https://aclanthology.org/2024.findings-naacl.247/)" (NAACL 2024 Findings)

**来自 LAION / Jülich 超算中心等（Mehdi Ali, Michael Fromm 等 21 人）**

这是迄今为止**规模最大的 Tokenizer 选择影响力研究**——训练了 24 个 2.6B 参数的 LLM，系统比较不同 Tokenizer 配置的影响。

**最触目惊心的数字**：

```
使用英语中心 Tokenizer 训练多语言模型的代价：

性能：显著下降（across 多个欧洲语言 benchmark）
成本：训练开销增加高达 68%

原因分析：
┌──────────────────────────────────────────────┐
│  英语中心 Tokenizer 对非英语文本的 fertility  │
│  （每个单词需要的 token 数）显著更高            │
│                                              │
│  示例（概念性对比）：                          │
│  English: "machine learning" → 2 tokens       │
│  Deutsch: "maschinelles Lernen" → 4-5 tokens  │
│  中文:     "机器学习" → 5-8 tokens （极端情况） │
│                                              │
│  后果：                                       │
│  · 相同语义的文本需要更多 token → 序列更长     │
│  · 序列更长 → 训练步数更多 → 成本更高          │
│  · 有效上下文窗口被浪费在冗余 token 上          │
│  · 非英语语言的"性价比"被系统性压低            │
└──────────────────────────────────────────────┘
```

**多语种词表的代价**：覆盖五种最常用的欧洲语言，词表大小需要增加 **3 倍**。这还不包括中文、日文、阿拉伯文等结构差异更大的语言。

**传统指标的失效**：论文发现，fertility（生育率）和 parity（奇偶性）**不总是能预测下游性能**。一个 fertility 低的 Tokenizer，在实际任务中可能表现更差。

---

### "[Beyond Fertility: Analyzing STRR as a Metric for Multilingual Tokenization Evaluation](https://arxiv.org/abs/2510.09947)" (NeurIPS 2025)

**来自多伦多大学 / 沙特国王大学等（Mir Tafseer Nayeem 等）**

正是因为 fertility 的局限性，这篇论文提出了一个新的评估指标——**STRR (Sub-tokenization to Token Reconstruction Ratio)**。

**Fertility vs STRR**：

```
Fertility（传统指标）：
  定义：每个单词被切成多少个 token
  关注：压缩效率
  问题：只看"切了多少刀"，不管"能不能拼回去"
  
STRR（新指标）：
  定义：子词序列能否正确重构回原始单词
  关注：信息保留程度
  优势：
  ┌──────────────────────────────────────────────┐
  │  · 与下游任务性能的相关性更高                   │
  │  · 能诊断多语言分词的公平性问题                 │
  │  · 对低资源语言和代码混合场景更有区分度          │
  │  · 一个 Fertility 很低但 STRR 也低的 Tokenizer │
  │    意味着：压缩了，但丢失了关键信息              │
  └──────────────────────────────────────────────┘
```

---

### "[The Art of Breaking Words: Rethinking Multilingual Tokenizer Design](https://arxiv.org/abs/2508.06533)" (2025)

**来自印度理工等（Thakur, Nagpal 等）**

这篇论文对多语言 Tokenizer 设计进行了系统性研究，关键发现：

- **128K 词表**是多语言场景下效率和性能的最佳平衡点
- 预分词规则对印度语系（天城文、孟加拉文等）的影响远大于对拉丁语系
- 通过优化训练语料的语言配比，Token-to-word 比率平均改善超过 **40%**

**对实践的启示**：

> 多语言 Tokenizer 的影响远超多数人的认知：
> 1. **Tokenizer 选择是多语言模型的隐性成本中心**。68% 的成本增加意味着，光靠优化 Tokenizer 就能省下大量算力预算
> 2. **不要用 fertility 做唯一指标**。STRR 或其他信息保留指标应该被纳入 Tokenizer 评估流程
> 3. **128K 词表可能是多语言的新标准**。Llama 3 从 32K 扩展到 128K 不是偶然——这背后有系统性的多语言效率考量

---

## 四、Tokenizer 适配：不换模型，只换分词器

### "[Getting the most out of your tokenizer for pre-training and domain adaptation](https://arxiv.org/abs/2402.01035)" (ACL 2024)

**来自 Meta FAIR（Gautier Dagan, Gabriel Synnaeve, Baptiste Rozière）**

这是一篇被严重低估的实用性论文。它系统研究了 Tokenizer 设计中三个被忽视的变量，发现它们对模型性能的影响**远超预期**。

**三个关键发现**：

```
发现 1：预分词正则表达式的影响出乎意料地大
┌──────────────────────────────────────────────┐
│  针对代码任务：                                │
│  · 允许 token 跨越换行符和制表符              │
│  · vs 在换行符处强制切分                      │
│  → 生成质量和推理速度差异显著                  │
│                                              │
│  原因：正则表达式决定了 token 的"形状"        │
│  同样的词表，不同的预分词 → 完全不同的效果      │
└──────────────────────────────────────────────┘

发现 2：领域特定 Tokenizer 的收益窗口
┌──────────────────────────────────────────────┐
│  训练数据 > 50B tokens 时：                   │
│  · 用领域特定数据重新训练 Tokenizer 值得       │
│  · 代码任务：Tokenizer 切换带来生成速度和       │
│    上下文长度的大幅提升                        │
│                                              │
│  训练数据 < 50B tokens 时：                   │
│  · 沿用预训练 Tokenizer 是安全的               │
└──────────────────────────────────────────────┘

发现 3：词表大小的非线性影响
┌──────────────────────────────────────────────┐
│  更大词表 → 推理更快（每步处理更多文本）      │
│  更大词表 → 嵌入层更大（显存开销增加）         │
│  更大词表 → 稀有 token 训练不充分（长尾问题）  │
│                                              │
│  → 需要根据场景权衡，不是越大越好              │
└──────────────────────────────────────────────┘
```

---

### "[Teaching Old Tokenizers New Words](https://arxiv.org/abs/2512.03989)" (EACL 2026 Findings)

**来自塔尔图大学（Taido Purason, Pavel Chizhov 等）**

这篇论文解决了一个非常实用的问题：**如何在不重新预训练模型的情况下，高效地适配 Tokenizer？**

**两个核心方法**：

```
方法 1：持续 BPE 训练（词表扩展）

传统做法：
  在新领域数据上训练新 Tokenizer → 取不重叠的 token → 追加到旧词表
  问题：产生大量"不可达 token"（永远不会被合并操作触发）

本文方法：
  在旧 Tokenizer 基础上继续 BPE 训练
  → 新学习的合并规则与旧规则完全兼容
  → 零不可达 token
  → 压缩效率提升 9.6%
  → 词汇利用率提升 4%-14%
  → 训练时间减少 26%（因为序列变短了）

方法 2：叶子节点修剪（词表缩减）

传统做法：
  按频率排序，删掉最不常用的 token
  问题：可能删掉中间的"脚手架 token"，破坏合并路径

本文方法：
  只删叶子节点（不参与任何合并操作的 token）
  → 结构感知的修剪，保持 BPE 合并图完整
  → 可移除高达 62.5% 的词表而不显著损失性能
```

**自分词测试 (STT)** ——一个简洁而实用的诊断工具：

```python
# 检测不可达 token 的方法
def self_tokenization_test(tokenizer, token_string):
    """如果 tokenizer 对 token 的字符串形式进行分词，
    结果不是该 token 本身，则该 token 不可达"""
    result = tokenizer.encode(token_string)
    return len(result) == 1  # True = 可达, False = 不可达
```

---

### "[TokAlign: Efficient Vocabulary Adaptation via Token Alignment](https://aclanthology.org/2025.acl-long.207/)" (ACL 2025)

**来自中科院自动化所（Chong Li, Jiajun Zhang, Chengqing Zong）**

TokAlign 解决的是一个更激进的问题：**直接替换整个词表**，而不是渐进式扩展。

**核心思路**：

1. 从 token **共现**的角度，学习旧词表到新词表的一对一映射
2. 根据映射重排模型参数（包括 Embeddings）
3. 仅需 **5,000 步**微调即可恢复原始性能
4. 统一词表后，可做 token 级蒸馏——比句子级蒸馏性能提升 **+4.4%**，仅需 **235M tokens** 的成本

**对实践的启示**：

> Tokenizer 适配已经从"可选优化"变成了"必要工程"：
> 1. **持续预训练必须考虑 Tokenizer**。如果你的持续预训练数据超过 50B tokens，投资重新训练/适配 Tokenizer 的 ROI 是正的——26% 的训练时间节省远超适配成本
> 2. **词表修剪是被忽视的效率杠杆**。62.5% 的词表可以安全删除，这意味着嵌入层参数可以大幅缩减，对边缘部署极有价值
> 3. **STT 应该成为标准质量检查**。在任何 Tokenizer 修改后，运行自分词测试来检测不可达 token

---

## Tokenizer 技术演进全景

```
2016 ──────── BPE 成为标准 (Sennrich et al.)
  │
  │  稳定期：几乎所有主流 LLM 使用 BPE 变体
  │  · GPT-2/3/4: Byte-level BPE
  │  · LLaMA: SentencePiece BPE
  │  · 差异主要在词表大小（32K → 128K）
  │
2024 ──────── 认知颠覆期
  │  ├─ "Tokenization Is More Than Compression" (EMNLP 2024)
  │  │   → 压缩≠性能，预分词更重要
  │  ├─ "Tokenizer Choice: Negligible or Crucial?" (NAACL 2024)
  │  │   → 错误的 Tokenizer 让训练成本 +68%
  │  └─ SpaceByte (NeurIPS 2024)
  │      → 在空格处插入大块，字节级逼近 token 级
  │
2025 ──────── 字节级模型突破期
  │  ├─ Byte Latent Transformer (Meta, ACL/ICML 2025)
  │  │   → 8B 规模首次匹配 token-based 模型
  │  ├─ EvaByte (HKU + SambaNova, 2025)
  │  │   → 1/5 数据量达到同等性能，解码速度超 token-based
  │  ├─ TokAlign (ACL 2025)
  │  │   → 5000 步完成词表替换
  │  └─ "The Art of Breaking Words" (2025)
  │      → 128K 词表是多语言最优解
  │
2026 ──────── 工程落地期
     ├─ Teaching Old Tokenizers New Words (EACL 2026)
     │   → 持续 BPE 训练 + 叶子修剪的实用方案
     ├─ Beyond Fertility: STRR (NeurIPS 2025)
     │   → 新评估指标取代 fertility
     └─ 趋势：Tokenizer 从"一次性配置"变为"持续优化"
```

---

## Tokenizer 设计决策树

对于正在构建或优化大模型训练管线的数据工程师，以下是一个实用的决策框架：

```
                     你的场景是什么？
                          │
            ┌─────────────┼─────────────┐
            ↓             ↓             ↓
       从零预训练    持续预训练/适配   边缘部署/压缩
            │             │             │
            ↓             ↓             ↓
    ┌───────────────┐  数据量 > 50B?  ┌───────────┐
    │ 词表大小选择   │   │    │       │ 叶子修剪   │
    │               │   是    否      │ 减 50-60% │
    │ 单语：32-64K  │   │    │       │ 词表大小   │
    │ 多语：128K    │   ↓    ↓       └───────────┘
    │ 代码重：64K+  │ 重新训练  沿用
    └───────────────┘ Tokenizer 原 Tokenizer
            │         (持续BPE)  (安全的)
            ↓
    ┌───────────────┐
    │ 预分词规则     │
    │               │
    │ 代码：允许跨   │
    │ 换行/制表      │
    │               │
    │ 多语言：不要   │
    │ 假设空格分词   │
    └───────────────┘
            │
            ↓
    ┌───────────────┐
    │ 质量检查       │
    │               │
    │ □ STT 测试    │
    │ □ STRR 指标   │
    │ □ 消融实验    │
    │ □ 多语言      │
    │   fertility   │
    │   对比        │
    └───────────────┘
```

---

## 本期思考

> **Tokenizer 正在从大模型训练的"基础设施"升级为"核心决策变量"。** 当 BLT 证明字节级模型可以匹配 Llama 3、当 EvaByte 用 1/5 数据达到同等水平、当研究表明错误的 Tokenizer 让成本暴增 68%——忽视分词设计的代价已经不可接受。
>
> **三个正在发生的范式转移**：
>
> **第一，从固定词表到动态分割。** BLT 的基于熵的动态补丁和 EvaByte 的多字节预测，指向了同一个方向：**计算资源应该按信息密度分配，而非按固定词表均匀分配**。这与 [Vol.7](/column/data-engineering-2026-03-28) 中 BeyondWeb 强调的"每 token 信息密度"遥相呼应——无论是数据侧还是模型侧，"密度"都在成为核心优化目标。
>
> **第二，从压缩至上到结构感知。** "Tokenization Is More Than Compression" 和 STRR 指标共同揭示了一个真相：**好的分词不是产生最少的 token，而是保留最多的语言结构信息**。预分词规则——这个长期被忽视的超参数——可能比词表大小更重要。这对多语言场景尤其关键：中文、日文等语言需要完全不同于英语的预分词策略。
>
> **第三，从一次性配置到持续适配。** 过去，Tokenizer 在训练开始前确定后就不再改变。但 Teaching Old Tokenizers New Words、TokAlign 等工作表明，**Tokenizer 应该随着数据和任务的演进而适配**——持续 BPE 训练、词表替换、叶子修剪，这些技术让 Tokenizer 优化成为了一个低成本、高回报的工程实践。
>
> **对数据工程团队的建议**：
> 1. **立即做的事**：运行 STT 测试检查你现有 Tokenizer 的不可达 token 数量；计算目标语言的 fertility 和 STRR；如果多语言 fertility 差异超过 2×，认真考虑换 Tokenizer
> 2. **短期计划**：如果持续预训练数据量 > 50B tokens，投资领域特定 Tokenizer 适配（持续 BPE 训练），期望 20-30% 的训练效率提升
> 3. **中期关注**：跟踪 BLT 和 EvaByte 生态的成熟度。当字节级模型的工程支持（推理框架、量化、硬件优化）就位时，**它们可能重新定义"预训练数据"的概念**——不再需要 tokenize，直接喂原始字节

---

*下期预告：数据选择的新范式——从 DSIR 到 MATES，如何用元学习和强化学习自动化训练数据的动态选择*
