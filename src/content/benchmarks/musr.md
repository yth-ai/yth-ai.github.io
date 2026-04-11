---
title: "MuSR：多步软推理"
description: "1,000 道需要多步骤、跨段落推理的复杂任务，包含谋杀推理和组合优化"
date: 2024-06-01
benchName: "MuSR"
org: "CMU"
paper: "arXiv:2310.16049"
category: "推理"
subcategory: "综合推理"
abilities: ["多步推理", "谋杀推理", "时间推理", "空间推理"]
dataSize: "1,000 problems"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "o3"
    score: "72.4%"
  - model: "Claude Opus 4"
    score: "58.1%"
  - model: "GPT-4o"
    score: "45.2%"
tags: ["多步推理", "软推理"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
MuSR（Multistep Soft Reasoning）测试 1000+ tokens 文本上的多步推理。被 HF Open LLM Leaderboard v2 采用。

## 构建方式与示例
在长文本（1000+ tokens）上做多步推理。例如：读一段复杂的犯罪小说，推理"谁是凶手？"

## 关联基准与展望
关联：[BBH](/benchmarks/bbh)、[DROP](/benchmarks/drop)。
