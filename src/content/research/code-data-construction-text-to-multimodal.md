---
title: "代码数据构建全景：从纯文本到原生多模态"
description: "系统梳理大模型代码训练数据的构建方法论，覆盖纯文本预训练数据、指令合成数据、多模态代码数据三条路线，并展望原生多模态模型的代码数据构建范式"
date: 2026-04-01T19:10
category: 综合调研
tags: ["代码数据", "数据构建", "多模态", "原生多模态", "预训练", "合成数据", "代码大模型"]
draft: false
---

# 代码数据构建全景：从纯文本到原生多模态

> **覆盖范围**：纯文本代码预训练 · 指令合成 · 多模态代码数据 · 原生多模态展望  
> **核心论文**：22 篇关键工作  
> **时间跨度**：2023.12 — 2026.03  
> **Maxwell 研究 | 2026.04.01**

---

## 目录

**第一部分：纯文本代码数据构建**
1. [预训练数据：从 GitHub 到万亿 Token](#一预训练数据从-github-到万亿-token)
2. [数据质量工程：过滤、去重与重写](#二数据质量工程过滤去重与重写)
3. [指令数据合成：从 Self-Instruct 到执行验证](#三指令数据合成从-self-instruct-到执行验证)
4. [数据配比：代码在通用模型中的角色](#四数据配比代码在通用模型中的角色)

**第二部分：多模态代码数据构建**
5. [任务分类：14 个子方向](#五任务分类14-个子方向)
6. [UI 截图到代码：最成熟的管线](#六ui-截图到代码最成熟的管线)
7. [图表到代码：科学可视化的数据闭环](#七图表到代码科学可视化的数据闭环)
8. [SVG 代码生成：矢量图形的结构化表示](#八svg-代码生成矢量图形的结构化表示)
9. [流程图/UML 到代码：逻辑推理的视觉入口](#九流程图uml-到代码逻辑推理的视觉入口)
10. [统一多模态代码生成：VisCodex 与 VinciCoder](#十统一多模态代码生成viscoder-与-vincicoder)

**第三部分：原生多模态模型的代码数据范式**
11. [现有原生多模态模型怎么处理代码](#十一现有原生多模态模型怎么处理代码)
12. [代码数据在原生多模态中的独特价值](#十二代码数据在原生多模态中的独特价值)
13. [原生多模态代码数据构建路线图](#十三原生多模态代码数据构建路线图)
14. [总结与判断](#十四总结与判断)

---

## 一、预训练数据：从 GitHub 到万亿 Token

代码预训练数据的构建已经从"爬 GitHub 去重"演化为一套成熟的数据工程体系。梳理主要数据集的演进：

| 数据集 | 时间 | 规模 | 来源 | 关键创新 |
|--------|------|------|------|---------|
| **The Stack v1** | 2022 | 3TB / 358 种语言 | GitHub（许可过滤） | 首个大规模开源代码数据集，opt-out 机制 |
| **The Stack v2** | 2024 | 67.5TB / 600+ 种语言 | Software Heritage 档案 | 放宽许可约束，语言级过滤器 |
| **StarCoder2** | 2024 | 4T+ tokens | The Stack v2 | 600+ 语言覆盖，3B/7B/15B 三档 |
| **DeepSeek-Coder** | 2024 | 2T tokens / 87 种语言 | GitHub（仓库级组织） | **依赖排序 + FIM**，仓库级而非文件级 |
| **OpenCoder** | 2024 | — | The Stack v2 清洗 | fastText 三轮召回，教育质量评分 |

DeepSeek-Coder 的方法论值得单独展开——它不把代码当成独立文件的集合，而是按仓库组织，用依赖解析器（import 分析）对文件排序，让模型在预训练时就能看到"先定义、后使用"的自然依赖链。这一简单的数据工程决策，比增加模型参数更有效地提升了跨文件代码理解能力。

**Fill-in-the-Middle (FIM)** 是代码预训练的另一个关键数据组织策略。标准的从左到右预训练无法覆盖"给定前后文、补中间"这一编程中的高频场景。FIM 通过对训练样本随机切分为 prefix/middle/suffix 三段并重排，以几乎零成本为模型引入了代码补全能力。StarCoder 和 DeepSeek-Coder 都采用了 FIM。

---

## 二、数据质量工程：过滤、去重与重写

原始 GitHub 代码的质量分布极其不均。高质量代码可能不到总量的 10%，但对模型能力的贡献远超其比例。

### 过滤维度

当前代码数据清洗通常覆盖以下维度：

1. **基础清洗**：移除自动生成代码（如 protobuf 生成、IDE 配置）、最小化/混淆代码、二进制文件
2. **语法验证**：解析 AST，排除语法错误的代码
3. **风格评分**：Pylint / ESLint 等 linter 评分过滤低质量代码
4. **教育质量分类**：用分类器（通常是 fastText）评估代码的"可学习性"，类似 FineWeb-Edu 对文本做的事
5. **去重**：MinHash + LSH 近似去重是标准做法（BigCode 项目的标准管线）

### 数据重写：Transform-and-Retain

SwallowCode (Fujii et al., 2025) 提出了一个有趣的新范式——不丢弃低质量数据，而是用 LLM 重写它们：

1. 语法验证（AST 解析）
2. Pylint 风格过滤
3. **LLM 重写阶段一**：强制风格一致性
4. **LLM 重写阶段二**：将代码片段转换为独立的、算法高效的示例

效果显著：基于 The Stack v2 生成 161 亿 token 的 SwallowCode，在 HumanEval 上 pass@1 提升 +17.0（对比 Stack-Edu 基线），其中 LLM 重写阶段贡献最大。

这个结果暗示：**代码预训练数据的上限可能不是量，而是质量转化效率**。当原始数据已经足够多（万亿级），用 LLM 把中等质量数据"翻译"成高质量版本，比继续扩大爬取范围更有价值。

---

## 三、指令数据合成：从 Self-Instruct 到执行验证

代码指令数据的合成方法经历了三代演化：

### 第一代：Prompt 驱动

- **Code Alpaca**：Self-Instruct 方法，21 个种子任务 + ChatGPT 生成 2 万条指令。覆盖面窄，多样性受限于种子
- **Code Evol-Instruct (WizardCoder)**：以 Code Alpaca 为种子，通过启发式规则不断增加任务复杂度。质量提升但仍然是在有限空间内"进化"

### 第二代：开源代码驱动

- **Magicoder / OSS-Instruct** (Wei et al., 2023)：**核心突破**——用真实开源代码片段作为种子，让 LLM 基于这些片段构造指令。这打破了 Self-Instruct 的多样性瓶颈，因为 GitHub 上的代码片段覆盖了几乎所有编程场景。75K 合成样本就让 7B 模型在 HumanEval+ 上超越 ChatGPT

### 第三代：执行验证闭环

- **KodCode** (Xu et al., 2025, ACL 2025 Best Paper @ DataWorld)：统一了零样本生成、人工题目、代码片段、技术文档四类种子源，关键创新是**自验证机制**——每道题都生成解答和测试用例，通过 pytest 在 Docker 沙箱中执行验证。不通过的样本直接淘汰。覆盖 12 个子集（算法到特定包知识），难度从基础练习到竞赛
- **AutoCoder** (Lei et al., 2024)：多轮对话数据集通过 Agent 交互 + 外部执行验证构建

### 第三代的核心逻辑

**代码数据有一个自然语言数据没有的巨大优势：可执行验证**。好的代码数据构建管线应该把这个优势用到极致——不是用 LLM 判断质量（这会引入 LLM 自身的偏差），而是让代码实际运行，用测试结果作为硬质量信号。

---

## 四、数据配比：代码在通用模型中的角色

代码数据在通用大模型训练中的比例是一个关键但经常被低估的超参数。

**Data Mixing Laws** (Ye et al., 2024，复旦 MOSS 团队) 建立了数据配比的可预测理论：不同领域数据的混合比例对下游性能有量化的、可预测的影响。核心发现是——代码数据即使对非代码任务也有显著正向影响：

- Chameleon 团队明确指出：预训练中包含代码数据"显著提升了纯文本推理任务（常识推理、阅读理解）的性能"
- Phi 系列模型通过高比例的"教科书质量"代码数据，证明了代码对通用推理的迁移效果

推测原因：代码的结构化特性（严格的逻辑依赖、因果关系、精确引用）对模型的推理能力有正迁移。这意味着代码数据不只是服务于代码任务——它是通用推理能力的"训练增强剂"。

---

## 五、任务分类：14 个子方向

多模态代码生成已经发展为一个庞大的研究领域。根据 Awesome-Multimodal-LLM-for-Code 仓库的整理，当前至少包含 14 个子方向：

| 方向 | 输入 | 输出 | 代表工作 | 数据构建难度 |
|------|------|------|---------|------------|
| **Web/Mobile UI → Code** | 截图/设计稿 | HTML/CSS/React | Design2Code, WebSight, Web2Code | ⭐⭐ |
| **科学图表 → Code** | 图表图像 | matplotlib/seaborn 代码 | ChartCoder, Plot2Code, VisCoder | ⭐⭐⭐ |
| **SVG 生成** | 图像/文本 | SVG 代码 | StarVector, OmniSVG | ⭐⭐ |
| **流程图/UML → Code** | 图表图像 | 编程语言代码 | Code-Vision, StarFlow | ⭐⭐⭐⭐ |
| **幻灯片生成** | 论文/文本 | PPT 代码 | SlideCoder, SlideGen | ⭐⭐⭐ |
| **程序修复** | 截图+代码 | 修复补丁 | SWE-bench Multimodal, SVRepair | ⭐⭐⭐⭐ |
| **CAD 生成** | 文本/图像 | CAD 代码 | CAD-Coder, CME-CAD | ⭐⭐⭐⭐ |
| **海报生成** | 文本/图像 | HTML/代码 | PosterGen, P2P | ⭐⭐⭐ |
| **3D 点云** | 点云数据 | 网格代码 | MeshCoder, Real2Code | ⭐⭐⭐⭐⭐ |
| **游戏 UI** | 文本描述 | 游戏界面代码 | GameUIAgent, V-GameGym | ⭐⭐⭐⭐ |
| **多模态文档** | 文本+图表 | 交错内容 | BigDocs, Multimodal DeepResearcher | ⭐⭐⭐ |
| **数学视觉编程** | 数学图像 | 代码 | MMCode, MathCoder-VL | ⭐⭐⭐⭐ |
| **代码用于图像理解** | 图像 | SVG/代码表示 | VCode, Thinking with Programming Vision | ⭐⭐⭐ |
| **通用多模态代码** | 混合输入 | 多种代码 | VisCodex, VinciCoder, JanusCoder | ⭐⭐⭐⭐ |

一个清晰的趋势：这些子方向正在从各自独立走向统一框架。

---

## 六、UI 截图到代码：最成熟的管线

这是多模态代码数据构建中最成熟的方向，有三条并行的数据构建路线。

### 路线一：合成渲染

**WebSight** (Laurençon et al., 2024, HuggingFace)：
- 用 GPT-3.5/4 生成多样化的 HTML 代码
- 渲染为截图，形成 <截图, HTML> 对
- **v0.1**：82.3 万对；**v0.2**：200 万对，引入真实图像 + Tailwind CSS
- 优势：数据完全可控，无版权问题，可无限扩展
- 劣势：合成网页与真实网页存在分布差距

### 路线二：真实网页采集 + 精炼

**Web2Code** (Yun et al., 2024, NeurIPS)：
- **新建数据 (DWCG)**：GPT-3.5 生成高质量 HTML 对
- **精炼数据 (DWCGR)**：对 WebSight、Pix2Code 等已有数据集做格式转换
- **理解数据 (DWU/DWUR)**：GPT-4 生成网页理解问答对
- 关键发现：使用代码增强的 LLM 主干（如 CrystalChat-7B）生成的网页质量优于 Vicuna

### 路线三：分治策略

**DCGen** (Wen et al., 2025, ACM)：
- 将复杂网页分解为组件，逐个生成再组装
- 人类评估证明：显著加速开发且还原度更高
- 对应数据构建策略：不是一张截图对应一整段代码，而是组件级的 <截图片段, 代码片段> 对

### Design2Code 基准

Design2Code (Si et al., 2024, NAACL 2025) 建立了评估标准：484 个真实网页，高级视觉评分（GPT-4V）+ 低级元素匹配双维评估。GPT-4o 截至评测仍是最强模型，但开源方案（如 DCGen）正在缩小差距。

---

## 七、图表到代码：科学可视化的数据闭环

图表到代码的独特之处在于：**输出代码是可执行的，执行结果（渲染图像）可以与输入图表直接比较**。这天然形成了一个数据质量验证闭环。

### ChartCoder / Chart2Code-160K

清华 THUNLP (ACL 2025 Main)：
- 基于 Multi-modal-Self-instruct 框架
- 构建 16 万 <图表, 代码> 对
- 提出 **Snippet-of-Thought** 方法：先分析图表结构，再逐步生成代码

### VisCoder / VisCode-200K

TIGER-AI-Lab (EMNLP 2025)：
- **四阶段管线**：
  1. 基于库过滤（matplotlib、seaborn 等）
  2. 代码块提取（从完整文件中提取独立绘图代码）
  3. **运行时验证**（Jupyter 环境执行，只保留成功生成图像的样本）
  4. 指令生成（GPT-4o 基于代码+图像合成 5 组件结构化指令）
- 数据来源：Stack-EDU + CoSyn-400K → 170 万初始样本 → 过滤+验证 → 15.5 万验证通过 + 4.5 万多轮修正对话
- **关键设计**：注入模拟数据替换缺失输入，确保代码独立可运行

### ChartMaster

(Tan et al., 2025)：
- 首次引入**图表相似度强化学习 (CSRL)**——渲染生成代码的输出图表，与目标图表计算相似度作为 RL 奖励
- 使用真实图表数据，不局限于合成

这三个工作共同指向一个范式：**"生成-执行-渲染-比较"闭环**。代码的可执行性使得视觉反馈可以直接作为数据质量信号和训练奖励，这是图表-代码方向的核心优势。

---

## 八、SVG 代码生成：矢量图形的结构化表示

SVG 是一种特殊的代码——它同时是可执行的标记语言和精确的视觉描述。

### StarVector

(Rodriguez et al., 2023→2025, CVPR 2025)：
- 创建 **SVG-Stack**：200 万 SVG 样本的大规模数据集
- 多模态架构：视觉编码器 + 代码 LLM
- 直接在 SVG 代码空间工作（而非曲线拟合），能使用 SVG 的全部原语（椭圆、多边形、文本等）
- 建立 **SVG-Bench**：跨 10 个数据集、3 个任务的基准

### OmniSVG

(NeurIPS 2025)：
- 首个端到端多模态 SVG 生成器家族
- 基于预训练 VLM，支持从简单图标到复杂动漫角色
- 关键：统一了文本到 SVG 和图像到 SVG 两个方向

SVG 数据构建的独特价值在于：SVG 代码本身就是图像的精确结构化表示。在原生多模态模型中，SVG 可能是连接"视觉理解"和"代码生成"的天然桥梁。

---

## 九、流程图/UML 到代码：逻辑推理的视觉入口

### Code-Vision 基准

(Wang et al., 2025)：
- 输入流程图，要求生成正确程序
- 三个子集：基础编程 (HumanEval-V)、算法、数学
- **关键发现**：GPT-4o 在困难问题上 pass@1 达 79.3%，最好的开源模型仅 15%
- 差距原因（推测）：开源模型缺乏"视觉逻辑结构 → 代码逻辑"的对齐训练数据

### UML → Code

(Al-Alimi et al., 2025)：
- 用多模态 LLM 从 UML 图像生成代码
- 实验证明：领域适配（domain-adapted）的 MM-LLM 显著优于通用模型
- 数据构建瓶颈：高质量 UML 图 + 对应代码的配对数据极其稀缺

流程图和 UML 方向的核心困难：这类数据需要精确的逻辑对应关系，合成难度远高于 UI 截图。目前没有规模化的合成管线，是多模态代码数据的一个明显空白。

---

## 十、统一多模态代码生成：VisCodex 与 VinciCoder

前面的子方向各自为战，但 2025 年下半年开始出现**统一框架**的尝试。

### VisCodex

(Jiang et al., 2025, ICLR 2026 投稿)：
- **核心方法**：任务向量模型合并——将编码 LLM 的权重"算术合并"到视觉语言模型中
- **MCD 数据集 (598K)**：
  - 高质量 HTML 代码
  - 图表图像-代码对
  - 图像增强的 StackOverflow QA
  - 算法问题
- **评估**：提出 InfiBench-V 基准，开源 SOTA，接近 GPT-4o
- 优势：无需从头训练，模型合并成本极低

### VinciCoder

(Zhao et al., 2025)：
- **两阶段框架**：
  1. **大规模 SFT**：160 万图像-代码对（图表、网页、SVG、科学绘图、化学分子等）
  2. **视觉强化学习 (ViRL)**：粗到细的视觉相似度奖励，跨局部图像块和全局图像
- 关键创新：ViRL 用渲染比较替代人工标注，实现了多模态代码数据的自动质量反馈
- 开源 SOTA

VinciCoder 的 ViRL 思路与图表方向的 CSRL 异曲同工：**利用代码的可执行性，将"生成-渲染-视觉比较"闭环作为训练信号**。这可能是多模态代码数据构建的终极范式。

---

## 十一、现有原生多模态模型怎么处理代码

考察三个代表性的原生多模态模型如何处理代码数据：

### Chameleon (Meta FAIR, 2024)

- **架构**：早期融合，所有模态统一为离散 token
- **代码数据**：复用 CodeLLaMa 预训练数据，作为"纯文本"类别的一部分（2.9T tokens 包含代码）
- **交错数据**：4000 亿 tokens 的交错文本-图像数据（来自公开网页）
- **关键发现**：代码数据显著提升了纯文本推理任务的性能
- **局限**：代码仅作为文本处理，没有视觉-代码的交叉数据

### Emu3 (BAAI, 2025, Nature)

- **架构**：纯 next-token prediction，统一文本、图像、视频
- 代码能力未被专门优化，主要继承自文本预训练

### BAGEL (ByteDance Seed, 2025)

- **架构**：原生解码器-only，万亿级 token 预训练
- 训练数据包含文本、图像、视频、网页数据的交错混合
- 展现出"涌现能力"：自由形式图像操作、未来帧预测
- 代码能力的具体数据构成未公开

**共同点**：现有原生多模态模型对代码的处理极其初级——代码基本被当作纯文本模态的子集，没有专门构建视觉-代码的交叉训练数据。这是一个巨大的空白。

---

## 十二、代码数据在原生多模态中的独特价值

代码在原生多模态模型中的价值不仅仅是"让模型会写代码"。从更深的层面看，代码是多个模态之间的**通用中间表示**：

### 代码是视觉的精确描述语言

- SVG 代码精确描述矢量图形
- HTML/CSS 精确描述网页布局
- matplotlib 代码精确描述数据可视化
- LaTeX 代码精确描述数学公式的视觉呈现

这意味着：**代码可以作为视觉理解到视觉生成之间的"语义锚点"**。模型不需要直接从像素到像素地学习变换，而是可以通过代码这一中间表示来建立精确的视觉对应。

### 代码提供可验证的推理链

- 代码的执行结果是确定性的
- "生成代码 → 执行 → 比较输出"闭环可以自动生成训练信号
- 这解决了多模态对齐中人工标注成本高的核心痛点

### 代码是结构化推理的载体

- Chameleon 已经证明代码数据提升通用推理
- 在多模态场景下，代码的结构化特性更加宝贵——它强制模型建立精确的逻辑依赖，而不是依赖统计关联

---

## 十三、原生多模态代码数据构建路线图

基于以上分析，我对原生多模态模型的代码数据构建提出以下路线图。

### 第一层：基础代码语料（继承现有能力）

直接复用成熟的纯文本代码数据管线，不需要重新发明：

- **预训练**：The Stack v2 + 仓库级组织（DeepSeek-Coder 范式）+ SwallowCode 级别的 LLM 重写
- **指令数据**：OSS-Instruct + KodCode 执行验证闭环
- **配比**：参考 Data Mixing Laws 理论，代码占比 15-25%（推测值，需实验确认）

### 第二层：视觉-代码对齐数据（填补空白）

这是当前最缺乏的数据类型——让模型学会在视觉和代码之间建立精确映射：

**数据类型一：渲染对 (Code → Visual)**
- 代码 + 渲染结果配对
- 来源：执行已有的代码数据集，收集渲染输出
- 规模估算：从 VisCode-200K、Chart2Code-160K、WebSight-2M、SVG-Stack-2M 等已有数据出发，约 500 万对可直接获得
- **关键**：这些数据的标注成本几乎为零——代码本身就是标注

**数据类型二：视觉到代码 (Visual → Code)**
- 截图/图表/图形 → 生成代码
- 来源：Design2Code、VisCoder、ChartCoder 等管线
- 需要扩展到更多视觉类型（CAD、3D、游戏 UI 等）

**数据类型三：交错视觉-代码文档 (Interleaved)**
- 代码与渲染结果交错出现的文档
- 来源：Jupyter Notebook 是天然的交错视觉-代码数据源——代码块和输出图表自然交替
- **构建建议**：爬取 GitHub 上的 .ipynb 文件，提取 <代码块, 输出图像> 的交错序列
- 补充来源：技术博客（代码+截图）、StackOverflow 图文问答、编程教程

**数据类型四：视觉修改指令 (Visual Edit)**
- 给定当前渲染结果 + 修改指令 → 新代码
- 来源：可从已有代码数据合成——对代码做随机修改，收集修改前后的渲染结果
- 这类数据教会模型"看到视觉差异，理解代码级原因"

### 第三层：执行环境闭环数据（长期目标）

将代码的可执行性深度集成到多模态训练中：

**"渲染即奖励"范式**
- VinciCoder 的 ViRL 和 ChartMaster 的 CSRL 已经验证了这个方向
- 在原生多模态模型中，可以将其推广为通用的训练范式：
  - 模型生成代码 → 执行并渲染 → 视觉模型评估渲染结果与目标的相似度 → 作为 RL 奖励
  - **优势**：完全自动化，不需要人工标注
  - **挑战**：需要高效的代码执行环境和渲染管线

**"修改-重新渲染"循环**
- 模型生成代码 → 渲染 → 识别视觉问题 → 生成修改 → 重新渲染 → 验证
- 这实际上是一个多模态的 self-play 过程
- 数据可以从这个循环中持续生成（类似 SWE-smith 在纯文本代码中做的事）

### 第四层：代码作为跨模态推理桥梁（前沿探索）

更激进的想法：将代码作为多模态推理的"思维链"：

- **视觉推理通过代码**：看到一张数据图表 → 生成 Python 代码分析数据 → 执行代码获得答案（而不是直接从图像"猜"答案）
- **Thinking with Programming Vision** (2025) 已经在探索这个方向——用 SVG 代码作为视觉的符号化表示来辅助推理
- 训练数据：需要构建 <视觉问题, 代码推理链, 答案> 三元组

---

## 十四、总结与判断

### 核心判断

1. **纯文本代码数据已经成熟**。The Stack v2 + 仓库级组织 + LLM 重写 + 执行验证，这套管线的方法论和工具链都已经标准化。接下来的增量空间在质量转化（重写）而非量的扩展

2. **多模态代码数据正在从碎片走向统一**。14 个子方向各自为战的局面正在被 VisCodex、VinciCoder 这样的统一框架打破。关键催化剂是"渲染即奖励"——代码的可执行性天然提供了跨子方向通用的质量信号

3. **原生多模态模型的代码数据是一个巨大的空白**。Chameleon、Emu3、BAGEL 等模型对代码的处理停留在"文本子集"级别，没有视觉-代码的交叉训练数据。这可能是原生多模态模型能力的一个关键瓶颈

4. **代码是原生多模态模型的"秘密武器"**。不只是为了写代码——代码作为视觉的精确描述语言、可验证的推理链、结构化推理的载体，在多模态训练中的价值远超其表面用途

### 对构建者的具体建议

| 优先级 | 方向 | 预计规模 | 构建成本 | 预期收益 |
|--------|------|---------|---------|---------|
| **P0** | Jupyter Notebook 交错视觉-代码数据 | 千万级 | 低（爬取+渲染） | 高（唯一的原生交错数据） |
| **P0** | 已有代码数据集的渲染结果收集 | 百万级 | 极低（自动执行） | 高（零标注成本的视觉-代码对） |
| **P1** | UI/图表/SVG 统一管线 | 百万级 | 中（多管线整合） | 高（覆盖多视觉类型） |
| **P1** | 代码修改-重新渲染的循环数据 | 百万级 | 中（需执行环境） | 高（教模型做视觉 debug） |
| **P2** | 流程图/UML → 代码配对数据 | 十万级 | 高（合成困难） | 中（覆盖逻辑推理视觉） |
| **P2** | 代码作为推理链的三元组数据 | 十万级 | 高（需推理验证） | 中高（前沿方向，不确定性大） |

### 一句话

**代码在原生多模态模型中的角色，不是一个"模态"，而是所有模态之间的"翻译层"。当前的空白越大，填补它的回报就越高。**

---

## 参考文献

1. Lozhkov et al. "StarCoder 2 and The Stack v2: The Next Generation." 2024
2. Guo et al. "DeepSeek-Coder: When the Large Language Model Meets Programming." 2024
3. Fujii et al. "Rewriting Pre-Training Data Boosts LLM Performance in Math and Code." 2025
4. Wei et al. "Magicoder: Empowering Code Generation with OSS-Instruct." ICML 2024
5. Xu et al. "KodCode: A Synthetic Dataset Generation Framework." ACL 2025
6. Ye et al. "Data Mixing Laws: Optimizing Data Mixtures by Predicting Language Modeling Performance." 2024
7. Chameleon Team. "Chameleon: Mixed-Modal Early-Fusion Foundation Models." 2024
8. Si et al. "Design2Code: How Far Are We From Automating Front-End Engineering?" NAACL 2025
9. Laurençon et al. "WebSight: Unlocking the Conversion of Web Screenshots into HTML Code." 2024
10. Yun et al. "Web2Code: A Large-scale Webpage-to-Code Dataset." NeurIPS 2024
11. Li et al. "ChartCoder: Advancing Multimodal Large Language Model for Chart-to-Code Generation." ACL 2025
12. Ni et al. "VisCoder: Fine-Tuning LLMs for Executable Python Visualization Code Generation." EMNLP 2025
13. Tan et al. "ChartMaster: Advancing Chart-to-Code Generation with Real-World Charts." 2025
14. Rodriguez et al. "StarVector: Generating Scalable Vector Graphics Code from Images and Text." CVPR 2025
15. OmniSVG Team. "OmniSVG: A Unified Scalable Vector Graphics Generation Model." NeurIPS 2025
16. Wang et al. "Code-Vision: Evaluating Multimodal LLMs Logic Understanding and Code Generation." 2025
17. Al-Alimi et al. "UML Code Generation from Diagram Images Using Multimodal LLMs." 2025
18. Jiang et al. "VisCodex: Unified Multimodal Code Generation via Merging Vision and Coding Models." 2025
19. Zhao et al. "VinciCoder: Unifying Multimodal Code Generation via Coarse-to-fine Visual Reinforcement Learning." 2025
20. Deng et al. "BAGEL: Emerging Properties in Unified Multimodal Pretraining." 2025
21. Sun et al. "Emu3: Multimodal Learning with Next-Token Prediction." Nature 2026
22. Wen et al. "DCGen: Divide-and-Conquer UI Code Generation from Screenshots." ACM 2025
