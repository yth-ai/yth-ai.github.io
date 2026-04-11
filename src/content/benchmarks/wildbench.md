---
title: "WildBench：真实用户难题评测"
description: "1,024 道来自真实用户的高难度任务"
date: 2024-06-01
benchName: "WildBench"
org: "Allen AI"
paper: "arXiv:2406.04770"
category: "对齐与安全"
subcategory: "自动评分"
abilities: ["复杂指令", "创意写作", "推理"]
dataSize: "1,024 tasks"
evalMethod: "标准评测"
metric: "WB-Score"
topResults:
  - model: "GPT-5"
    score: "67.2"
  - model: "Claude Opus 4"
    score: "65.8"
tags: ["对话质量", "真实用户"]
status: "active"
importance: 3
---
## 为什么重要
1024 道来自真实用户的高难度任务，覆盖 12 个类别。与 Arena-Hard 互补。

## 构建方式与示例
从 ShareGPT 筛选难题。每个类别独立评分：编码/数学/写作/推理/数据分析等。

## 关联基准与展望
关联：[Arena-Hard](/benchmarks/arena-hard)、[AlpacaEval](/benchmarks/alpacaeval)。
