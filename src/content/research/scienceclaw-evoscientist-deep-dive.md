---
title: "ScienceClaw × EvoScientist 深度研读：AI 科研智能体的两条路线"
description: "一个走 Skill 即 Markdown 的极简工程路线，一个走多智能体 + 持久记忆的自进化学术路线。当 AI 真正成为科研伙伴，哪种范式更有生命力？"
date: 2026-03-28
category: 论文精读
tags: ["AI 科研智能体", "多智能体系统", "自进化", "Skill 架构", "持久记忆", "EvoScientist"]
paperTitle: "EvoScientist: Towards Multi-Agent Evolving AI Scientists for End-to-End Scientific Discovery"
authors: "Yougang Lyu, Xi Zhang, Xinhao Yi, et al. (Huawei)"
arxiv: "2603.08127"
htmlVersion: "/research-html/scienceclaw-evoscientist-deep-dive.html"
draft: false
---

## 研读动机

ScienceClaw 和 EvoScientist 是 2026 年 3 月几乎同时出现的两个 AI 科研智能体系统，但它们走出了截然不同的路线：

- **ScienceClaw**（开源版，Zaoqu-Liu）：`OpenClaw engine + SCIENCE.md + 266 Skills (Markdown) = 0 行自定义代码`
- **EvoScientist**（华为，arXiv 2603.08127，KDD 2026）：`6 智能体 + 2 持久记忆模块 + 进化管理器 = 自我进化的 AI 科学家`

一个赌"LLM 足够强就不需要写代码"，一个赌"经验蒸馏和角色分工才是可持续的"。这两条路线代表了 AI 科研智能体设计的两个极端哲学，值得深度对比。

---

## ScienceClaw：Skill 即 Markdown 的极简主义

### 核心设计

ScienceClaw 的设计哲学可以用一句话概括：**用 Markdown 教会模型做科研**。它不依赖 TypeScript、Python 后端、MCP 协议或插件系统——所有领域知识都编码为 Markdown Skills，由底层 OpenClaw 引擎按需加载。

架构四层：
1. **用户层**：Terminal UI / Web Dashboard / Telegram / WeChat / Slack 等多平台
2. **网关层**：OpenClaw Gateway（路由、会话管理、工具调用）
3. **代理层**：`SCIENCE.md`（身份与研究纪律，~600 行）+ 266 个按需加载的 Skills
4. **工具层**：仅两个 — `web_search`（Brave）和 `bash`（Python/R/Julia + curl）

### 266 个 Skill 解剖

| 领域 | 数量 | 代表性 Skill |
|------|------|------------|
| 可视化 | 35+ | matplotlib, seaborn, plotly, networkx |
| 生物信息学 | 30+ | scanpy, anndata, pydeseq2, biopython |
| 数据库 | 20+ | UniProt, PDB, STRING, Reactome |
| 药物发现 | 20+ | ChEMBL, RDKit, ZINC, AlphaFold |
| 科学写作 | 15+ | 文献搜索, 同行评审, LaTeX 模板 |
| 基因组学 | 15+ | Ensembl, GWAS, ClinVar, GEO |
| 机器学习 | 10+ | scikit-learn, SHAP, aeon |

每个 Skill 是一个 Markdown 文件，包含 API 模式、代码模板和验证步骤。这种设计的激进之处在于——**完全不写代码**。

### Research Recipes

6 个预构建工作流，从一句自然语言自动匹配并执行完整分析：

`用户输入 → 文献搜索 → TCGA 表达 → 生存分析 → 免疫浸润 → 通路富集 → 结构化报告`

包括：gene-landscape（基因全景）、target-validation（靶点成药性）、literature-review（文献综述）、diff-expression（差异表达）、clinical-query（临床查询）、person-research（研究者调研）。

### ⚠️ 注意：ScienceClaw 名下有多个项目

| 维度 | 开源版 (Zaoqu-Liu) | 紫东太初版 |
|------|-------------------|-----------|
| 架构 | OpenClaw + Markdown | LangChain DeepAgents + AIO Sandbox |
| Skill 数量 | 266 | 1900+ |
| 开源 | MIT | 商用平台 |
| 领域 | 生物医学为主 | 八大学科 |

本文架构分析基于开源版，因其代码和文档完整可审查。

---

## EvoScientist：持久记忆 + 自我进化

### 核心问题

现有 AI 科学家系统是「静态」的——每次从零开始，不会从历史交互中学习。导致：
1. 忽略有前景的研究方向
2. 重复失败的实验
3. 追求不可行的想法

### 三智能体 + 双记忆架构

**三个智能体：**
- **Research Agent (RA)**：科学想法生成，利用构思记忆检索历史可行/失败方向
- **Engineer Agent (EA)**：实验实现与执行，利用实验记忆检索可重用策略
- **Evolution Manager Agent (EMA)**：将交互历史蒸馏为可重用知识，更新记忆库

**两个持久记忆：**

| 记忆模块 | 存储内容 | 检索方式 | 作用 |
|---------|---------|---------|------|
| 构思记忆 M_I | 可行方向 + 失败方向 | 嵌入余弦相似度 Top-k | 提升想法质量 |
| 实验记忆 M_E | 数据处理策略 + 最佳代码实现 | 基于提案检索 | 提升代码执行率 |

### 三种进化机制

1. **想法方向进化 (IDE)**：生成想法后，EMA 从高排名想法中总结有效方向 → 更新 M_I
   - 消融：去除后新颖性下降 66.67%，可行性下降 50.00%

2. **想法验证进化 (IVE)**：执行失败时，EMA 分析失败原因 → 更新 M_I 负面记忆
   - 消融：去除后可行性暴跌 63.33% — **「知道什么不能做」比「知道什么能做」更重要**

3. **实验策略进化 (ESE)**：实验完成后，EMA 提取可重用策略 → 更新 M_E
   - 效果：代码执行成功率从 34.39% 提升到 44.56%

### 实验结果

**ICAIS 2025 AI Scientist Track：**
- 6 篇论文全部接收（会议整体接收率 31.71%）
- 1 篇获最佳论文奖、1 篇获 AI 评审赞赏奖

**基准排名（2026年3月）：**
- AstaBench Data Analysis #1
- AstaBench Code & Execution #1
- DeepResearch Bench II #1

---

## 深度对比

| 维度 | ScienceClaw 🦞 | EvoScientist 🧬 |
|------|----------------|-----------------|
| 设计哲学 | Skill 即 Markdown，零代码 | 多智能体 + 持久记忆 |
| 知识表示 | 266 个 Markdown 文件 | 向量化记忆库 |
| 学习能力 | ❌ 静态 | ✅ 自进化 |
| 工具接口 | 仅 2 个 | LangGraph + MCP + EvoSkills |
| 可验证性 | 无学术论文 | KDD 2026 + ICAIS 6/6 + 多个 #1 |
| 领域偏重 | 生物医学 | 通用 ML/AI 研究 |
| 可复现性 | 高（Markdown + 任何 LLM） | 中等（依赖向量库） |
| 扩展成本 | 极低（写一个 .md） | 中等 |
| 上限高度 | 受限于 LLM 单次推理 | 理论上可持续提升 |

**各维度判定：**
- 🏗️ 架构简洁性 → ScienceClaw（0 行自定义代码）
- 🧪 学术严谨性 → EvoScientist（KDD + 消融实验 + 真实会议验证）
- 📈 成长潜力 → EvoScientist（越用越好）
- 🔧 易用性 → ScienceClaw（写 Markdown 就能新增能力）

---

## 核心技术洞察

### 1. 「Skill 即 Markdown」可能是过渡态

零代码方案在当前 LLM 能力下对标准分析任务可行，但 Markdown Prompt 无法编码超出上下文窗口的复杂状态转换。ScienceClaw 只支持 6 个预构建 Recipe 而非任意组合——**它的天花板就是 LLM 单次规划能力的天花板**。

### 2. 「失败记忆」比「成功记忆」更有价值

消融实验的关键发现：去除 IVE 对可行性的伤害 (-63.33%) 大于去除 IDE (-50.00%)。**"知道什么不能做"比"知道什么能做"更重要**。这与人类科研经验高度一致——优秀研究者高效不是因为想法多，而是能快速排除不可行方向。

### 3. 两条路线可能最终融合

一个自然的融合方向：
- **Skill 作为知识的初始编码**（快速冷启动）
- **持久记忆作为知识的运行时增长**（越用越好）
- **进化管理器负责将记忆蒸馏回 Skill**（闭环，Skill 本身也进化）

形成「Skill → Memory → Skill」循环。

### 4. 代码执行成功率是真正的瓶颈

EvoScientist 诚实报告：创新方法的代码执行成功率只有 **21.57%**。将近 80% 的创新实现会失败。这不是单一系统的问题，而是整个 AI 科研领域的根本瓶颈。

### 5. 「Human-on-the-Loop」vs「Full Automation」

EvoScientist 的 6 篇论文全部被接收证明 Human-on-the-Loop 范式在特定条件下可行。但这也引出科研伦理问题：当 AI 自主产出被顶会接收的论文，"作者"意味着什么？

---

## 对数据工作的启示

1. **Skill 设计即数据管道设计**：把 ETL 最佳实践写成 Skill，而不只是写在内部文档里
2. **失败日志是训练信号**：CI/CD 失败、数据质量告警是训练下一代数据系统的核心资产
3. **从"做完就算"到"做完就学"**：管道执行应产生可复用的元数据——哪些 join 最慢，哪些检查最频繁报错
4. **Skill 是训练数据蓝图**：每个 Skill 定义了"输入→工具调用→输出"的范式，可用于合成 Agent 训练数据

---

## 结论

ScienceClaw 的「Skill 即 Markdown」和 EvoScientist 的「多智能体自进化」不是非此即彼的选择——它们解决的是**不同时间尺度上的不同问题**：

- **Skill** 解决冷启动（"如何让 AI 立刻能做事"）
- **记忆** 解决长期增长（"如何让 AI 越用越好"）
- **进化** 解决知识更新（"如何让旧知识不过时"）

终局必然是三者的融合。科研 AI 的终极形态不是"替代科学家"，而是"让每个科学家都有一个会成长的研究搭档"。

ScienceClaw 证明了入门门槛可以低到零，EvoScientist 证明了成长上限可以高到顶会最佳论文。现在的问题是——谁来把这两个极端连接起来？