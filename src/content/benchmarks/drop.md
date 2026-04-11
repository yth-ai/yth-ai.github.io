---
title: "DROP：离散推理阅读理解"
description: "需要在段落中做数值推理（计数、排序、算术）的阅读理解基准"
date: 2019-06-01
benchName: "DROP"
org: "Allen AI"
paper: "arXiv:1903.00161"
category: "推理"
subcategory: "综合推理"
abilities: ["数值推理", "阅读理解", "计数", "排序", "算术"]
dataSize: "96,567 questions"
evalMethod: "标准评测"
metric: "F1 Score"
topResults:
  - model: "GPT-5"
    score: "93.2"
  - model: "Claude Opus 4"
    score: "91.5"
  - model: "GPT-4"
    score: "88.4"
tags: ["阅读理解", "数值推理"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
DROP 要求模型在阅读段落后做离散推理（计数、排序、算术），是阅读理解+推理的经典基准。

## 构建方式与示例
96,000 个问答对。例如：阅读一段关于比赛结果的段落后，"哪支队伍赢了更多场？赢了几场？"

## 关联基准与展望
关联：[BBH](/benchmarks/bbh)、[MuSR](/benchmarks/musr)。不足：段落偏短，不测长文本推理。
