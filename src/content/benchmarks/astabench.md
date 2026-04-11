---
title: "AstaBench：科学研究 AI Agent 综合评测"
description: "AI2 构建的首个端到端科学研究 Agent 基准，2400+ 问题覆盖文献理解、编码执行、数据分析和科学发现全流程"
date: 2026-03-18T09:00
benchName: "AstaBench"
version: "1.0"
org: "Allen Institute for AI (AI2)"
paper: "arXiv:2510.21652"
code: "https://github.com/allenai/asta-bench"
venue: "ICLR 2026 Oral"
website: "https://allenai.org/asta/bench"
category: "Agent"
abilities: ["科学文献理解", "代码生成与执行", "数据分析", "端到端科学发现", "信息检索"]
dataSize: "2400+ 问题 / 11 个子基准 / 4 大类别"
construction: "真实科学任务 + 专家标注"
evalMethod: "自动化评测 (agent-eval 框架) + Lean 验证"
metric: "Category-level macro-average"
topResults:
  - model: "待查阅排行榜"
    score: "综合分数待更新"
    date: "2026-03"
tags: ["科学", "Agent", "文献理解", "科学发现", "ICLR"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要

AstaBench 是首个全面评测 AI Agent 进行科学研究能力的基准套件。由 AI2（Allen Institute for AI）构建，作为 Asta 项目（Accelerating Science with Trustworthy AI Agents）的核心评测工具，在 ICLR 2026 以 Oral 论文发表。它覆盖了科学研究的完整流程——从文献检索到实验执行再到发现报告，填补了此前科学 Agent 评测的系统性空白。

## 四大评估类别

### 文献理解 (Literature Understanding)
- **PaperFindingBench**：根据描述定位论文集合
- **LitQA2-FullText-Search**：论文检索与排序
- **ScholarQA-CS2**：CS 文献综述长篇回答
- **LitQA2-FullText**：需阅读全文的多选题
- **ArXivDigesTables-Clean**：文献综述表格生成

### 编码与执行 (Coding and Execution)
- **SUPER-Expert**：从零复现低资源研究仓库
- **Core-Bench-Hard**：仅提供 README 的计算可复现性测试
- **DS-1000**：Stack Overflow Python 数据科学代码生成

### 数据分析 (Data Analysis)
- **DiscoveryBench**：多步骤数据驱动发现

### 端到端发现 (End-to-End Discovery)
- **E2E-Bench / E2E-Bench-Hard**：完整科学研究流程（任务→实验→分析→报告）

## 关键发现

- 评测了 57 个 Agent（22 类），揭示综合性科学 AI 助手仍是未解难题
- 配备生产级可复现搜索工具，确保评测的严格性和可控性
- 时间不变的成本报告和可追溯日志设计

## 关联基准

- [ScienceAgentBench](/benchmarks/scienceagentbench)：科学数据驱动发现
- [PaperBench](/benchmarks/paperbench)：论文复现
- [GAIA](/benchmarks/gaia)：通用 AI 助手
