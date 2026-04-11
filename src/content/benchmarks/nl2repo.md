---
title: "NL2Repo-Bench：自然语言到完整仓库"
description: "评估 LLM 从自然语言描述生成完整代码仓库（多文件项目）的能力"
date: 2025-02-01
benchName: "NL2Repo-Bench"
org: "多校联合"
paper: "arXiv:2502.13382"
category: "代码生成"
subcategory: "仓库级"
abilities: ["仓库级生成", "多文件", "项目架构", "端到端"]
dataSize: "24 projects / 多种语言"
evalMethod: "标准评测"
metric: "Recall@file / Test Pass Rate"
topResults:
  - model: "GPT-5"
    score: "42.8% file recall"
  - model: "Claude Opus 4"
    score: "38.2% file recall"
tags: ["仓库级", "代码生成", "端到端"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
NL2Repo 评测从自然语言描述生成完整代码仓库的能力——最接近"从零构建项目"的评测。

## 构建方式与示例
给一段需求描述，生成包含多个文件的完整仓库。例如："构建一个 FastAPI 后端 + SQLite 的 Todo 应用。"

## 关联基准与展望
关联：[Commit0](/benchmarks/commit0)、[SWE-bench](/benchmarks/swe-bench)。不足：需求描述偏理想化。
