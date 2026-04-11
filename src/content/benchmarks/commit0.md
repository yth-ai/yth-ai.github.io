---
title: "Commit0：从零构建仓库"
description: "给一个空仓库 + 规格说明，让 Agent 从零构建出完整的代码仓库并通过测试"
date: 2024-12-01
benchName: "Commit0"
org: "多校联合"
paper: "arXiv:2412.01679"
category: "代码生成"
subcategory: "仓库级"
abilities: ["仓库构建", "从零开始", "测试驱动", "项目架构"]
dataSize: "54 repos"
evalMethod: "标准评测"
metric: "Test Pass Rate (%)"
topResults:
  - model: "Claude 3.5 + Aider"
    score: "25.4%"
  - model: "GPT-4o + Aider"
    score: "18.2%"
tags: ["仓库级", "从零构建", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
Commit0 评测模型从空白仓库实现完整 Python 库的能力——不是修 bug，是从零构建。

## 构建方式与示例
给模型一个库的 API 规范和测试用例，要求实现整个库。例如："实现一个兼容 scikit-learn API 的简单决策树库。"

## 关联基准与展望
关联：[SWE-bench](/benchmarks/swe-bench)、[NL2Repo](/benchmarks/nl2repo)。不足：任务数量有限。
