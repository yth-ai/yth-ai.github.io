---
title: "MMLU-Redux：MMLU 去噪修正版"
description: "对 MMLU 中的 3000 道题进行人工重新标注，修正约 6.8% 的错误标签"
date: 2024-06-01T00:00
benchName: "MMLU-Redux"
org: "Edinburgh & 多校"
paper: "arXiv:2406.04127"
category: "综合"
subcategory: "知识"
abilities: ["知识理解", "多学科"]
dataSize: "3000 questions (MMLU 子集重标)"
construction: "人工重新标注 MMLU 题目"
evalMethod: "多选准确率"
metric: "Accuracy (%)"
topResults:
  - model: "DeepSeek R1"
    score: "92.9%"
    date: "2025-01"
  - model: "GPT-4o"
    score: "88.0%"
    date: "2024-06"
tags: ["知识", "去噪", "MMLU"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
对 MMLU 中 3000 道题人工重新标注，修正约 6.8% 的错误标签。DeepSeek R1 报告使用。

## 构建方式与示例
人工逐题审核并修正错误答案。修正后部分模型排名变化，证明噪声确实影响评测。

## 关联基准与展望
关联：[MMLU](/benchmarks/mmlu)、[MMLU-Pro](/benchmarks/mmlu-pro)。
