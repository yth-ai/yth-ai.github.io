---
title: "告别单评分时代：数据 Curation 的方法论变革"
description: "ICLR 2026 集中展示数据策划新范式：在线重加权、代理模型可靠性、多维标注，以及重写优于过滤的数据增强路线"
date: 2026-03-27
series: "数据论文速递"
volume: 6
tags: ["数据策划", "在线重加权", "代理模型", "多属性标注", "数据重写", "ICLR 2026", "合成数据"]
---

## 今日精选

> 本期共推荐 4 篇论文，聚焦数据 Curation 方法论的系统性变革——从"怎么选数据"到"怎么评价数据质量"再到"怎么改数据"，覆盖了数据工程全链路的关键环节。特别值得注意的是，ICLR 2026 有多篇论文集中挑战了当前数据筛选的主流范式。

---

### 1. Rethinking Data Curation in LLM Training: Online Reweighting Offers Better Generalization than Offline Methods
**作者**：Wanru Zhao, Yihong Chen, Wentao Ma, Yuzhi Tang 等 | **机构**：University of Cambridge, Meta
**链接**：[ICLR 2026](https://www.iclr.cc/virtual/2026/poster/10009246)

**核心发现**：

这篇 ICLR 2026 论文对主流的离线数据筛选范式提出了根本性质疑。当前的数据选择（data selection）和数据混合（data mixing）方法都在训练前完成——先筛选或配比数据，再开始训练。作者指出这种"解耦"模式有三个致命弱点：(1) 一旦模型或下游任务变更，整个数据管道必须重新运行；(2) 硬过滤和重采样不可避免地损失数据多样性；(3) 额外的工程开销难以维持。

论文提出 **ADAPT**（Adaptive Data reweighting for Pretraining and FineTuning）框架，将数据策划重构为在线重加权问题。核心思路是：不删除任何数据，而是在训练过程中根据当前模型状态动态调整每个样本的学习率权重，通过基于相似性的质量信号指导权重分配。实验在预训练和指令调优场景下均展现出优于离线方法的泛化能力，且计算开销极小。

**对数据工作的启示**：
> 这篇论文对做数据筛选的团队是一个重要提醒：精心设计的离线数据过滤管道可能比不上一个简单的在线重加权机制。实际操作中，建议在现有的离线筛选流程之外，增加一个在线自适应调权层作为"保险"——让模型在训练过程中自己决定哪些数据该多学、哪些该少学。这比反复迭代离线数据配方要高效得多。

---

### 2. Can Small Training Runs Reliably Guide Data Curation? Rethinking Proxy-Model Practice
**作者**：Jiachen T. Wang, Tong Wu, Kaifeng Lyu, James Zou, Dawn Song, Ruoxi Jia, Prateek Mittal | **机构**：Princeton, Stanford, UC Berkeley, Virginia Tech
**链接**：[arXiv](https://arxiv.org/abs/2512.24503) · [ICLR 2026](https://www.iclr.cc/virtual/2026/poster/10011765)

**核心发现**：

几乎所有做数据工程的团队都在用"小模型快速跑一轮"的方式来评估不同数据配方的好坏——训练一个 1B 或 3B 的代理模型，看哪个数据集跑出来效果好，再拿去训大模型。但这个看似合理的做法靠谱吗？

这篇论文给出了令人警醒的答案：**不一定**。研究发现，使用固定超参数训练代理模型来比较数据集时，仅仅微调学习率等超参数，数据集的性能排名就可能完全逆转。根本原因在于，每个数据集有其自身的最优训练配置，而标准的代理模型实验用同一套超参数评估所有数据集，本质上是不公平的。

论文提出了一个简洁有效的修复方案：**使用足够小的学习率训练代理模型**。理论和实验（23 种数据配方）均证实，低学习率下的代理模型排名与大规模模型经过充分调优后的排名具有强相关性。

**对数据工作的启示**：
> 如果你的团队在用小模型做 A/B 测试来比较数据集，请立即检查实验协议：(1) 是否用了固定的超参数来比较所有数据集？如果是，你的结论可能不可靠。(2) 简单的修复方案是将代理模型训练的学习率降低到常规值的 1/3 ~ 1/5，这样得出的排名更具转移性。这个发现的实操意义非常大——它可能直接改变你团队评估数据的 SOP。

---

### 3. propella-1: Multi-Property Document Annotation for LLM Data Curation at Scale
**作者**：Maximilian Idahl, Benedikt Droste, Björn Plüster, Jan Philipp Harries | **机构**：Ellamind, Leibniz University Hannover
**链接**：[arXiv](https://arxiv.org/abs/2602.12414) · [HuggingFace](https://hf.co/collections/ellamind/propella-1)

**核心发现**：

自 FineWeb-Edu 以来，LLM 预训练数据的质量评估几乎被"单一评分"范式主导——用一个小分类器给每个文档打一个分数，高于阈值的留下，低于的丢弃。这篇论文系统性地挑战了这个范式，指出单一评分混淆了多个质量维度、阻碍灵活筛选、且完全缺乏可解释性。

propella-1 是一系列小型多语言模型（0.6B/1.7B/4B），能为文档生成结构化 JSON 标注，覆盖 18 个属性、6 大维度：核心内容、分类、质量与价值、受众与目的、安全合规、地理相关性。4B 版本的标注一致性甚至超过了通用大模型。

更重要的是，团队发布了 **propella-annotations** 数据集——对 FineWeb-2、FinePDFs、HPLT 3.0、Nemotron-CC 等主流语料库的超过 **30 亿份文档标注**。基于这些多维标注的分析揭示，这些语料库在质量、推理深度和内容构成上存在显著差异——这些差异是单评分方法完全无法捕捉的。

**对数据工作的启示**：
> 这是一个可以立即落地的工具。建议：(1) 下载 propella-1 的 0.6B 模型，在你的数据管道中增加一个多维标注环节，成本极低但信息量远超单评分；(2) 利用多维标注设计"组合筛选策略"——比如"高推理深度 + 中等教育价值 + 英语/中文"，而不是粗暴的一刀切；(3) 30 亿条现成标注可以直接用来分析你正在使用的语料库的分布特征，发现潜在的质量盲区。

---

### 4. Rewriting Pre-Training Data Boosts LLM Performance in Math and Code
**作者**：Kazuki Fujii, Yukito Tajima, Sakae Mizuki 等 17 人 | **机构**：National Institute of Informatics (Japan), 东京工业大学 等
**链接**：[arXiv](https://arxiv.org/abs/2505.02881) · [PDF](https://arxiv.org/pdf/2505.02881)

**核心发现**：

传统数据处理的思路是"过滤掉低质量的"，但这篇论文提出了一个颠覆性的替代方案："与其丢弃，不如重写"。作者发布了两个开放许可的重写数据集：

- **SwallowCode**（161 亿 tokens）：基于 The-Stack-v2 的 Python 代码，经过四阶段流水线处理——语法验证、pylint 风格过滤、两阶段 LLM 重写（强制风格一致性 + 转换为自包含的高效示例）。
- **SwallowMath**（23 亿 tokens）：基于 Finemath-4+ 增强，删除样板文本、恢复上下文、重新格式化为分步解释。

在 500 亿 token 预算下对 Llama-3.1-8B 持续预训练，SwallowCode 在 HumanEval 上的 pass@1 提升 +17.0，SwallowMath 在 GSM8K 上准确率提升 +12.4。消融实验确认重写阶段贡献最大。关键是：论文开源了全部数据集、提示词、检查点和流水线代码。

**对数据工作的启示**：
> "重写优于过滤"是一个值得认真考虑的范式转变。实际操作建议：(1) 对于代码数据，可以直接复用 SwallowCode 的四阶段管道作为你的基线；(2) 对于被你现有管道过滤掉的"低质量"数据，不要直接丢弃——用 LLM 做一轮重写后重新评估，很可能会发现它们变成了有价值的训练材料；(3) 数据预算有限时，"重写 + 保留"比"过滤 + 丢弃"在 token 利用效率上可能更优。

---

## 今日快览

| 论文 | 机构 | 亮点 |
|------|------|------|
| [Scaling Laws of Synthetic Data for Language Models](https://arxiv.org/abs/2503.19551) | Microsoft Research | SynthLLM 框架证明合成数据遵循可预测的修正 scaling law，8B 模型在 1T tokens 达到饱和 |
| [Curating High Quality Pretraining Data via Compression Ratios (COMPEL)](https://openreview.net/forum?id=KFafeqE5fe) | Stanford | 用语言模型的压缩率作为轻量级数据质量信号，无需训练额外分类器即可筛选高质量文本 |
| [A Deep Dive into Scaling RL for Code Generation with Synthetic Data and Curricula](https://arxiv.org/abs/2603.24202) | Meta FAIR | 多轮合成数据生成管线 + 课程学习，发现数据多样性和结构比单纯数据量更重要 |

---

## 编者按

> 今天推荐的四篇论文共同指向一个清晰的趋势：**数据 Curation 正在从"粗放型"走向"精细化"**。ADAPT 说"别急着删数据，让模型自己选"；代理模型论文说"你以为公平的实验其实不公平"；propella-1 说"一个分数不够，你需要 18 个维度"；SwallowCode 说"别扔低质量数据，改写一下就是好数据"。
>
> 对数据工程从业者来说，最值得关注的方法论转变是：**从"过滤型"思维转向"转化型"思维**。过去我们的默认操作是设阈值、过滤、丢弃；现在越来越多的证据表明，重写、多维评估、在线动态调整才是更高效的路径。这不只是技术选择的问题——它可能会根本性地改变数据团队的工作方式和资源分配。
