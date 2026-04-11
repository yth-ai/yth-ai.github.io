---
title: "ARC-Challenge：科学常识推理"
description: "7,787 道小学科学多选题，Challenge 子集只保留需要推理（而非检索）的难题"
date: 2018-03-01
benchName: "ARC (AI2 Reasoning Challenge)"
org: "Allen AI"
paper: "arXiv:1803.05457"
category: "推理"
subcategory: "逻辑推理"
abilities: ["科学推理", "常识", "物理", "生物", "地球科学"]
dataSize: "7,787 questions (Challenge: 2,590)"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "98.3%"
  - model: "Claude Opus 4"
    score: "97.1%"
  - model: "GPT-4o"
    score: "96.4%"
tags: ["科学", "常识", "推理"]
status: "active"
importance: 2
saturation: "已饱和"
---
## 为什么重要
ARC（AI2 Reasoning Challenge）的 Challenge 子集包含 1172 道对简单检索方法困难的科学选择题，是常识推理的经典基准。

## 构建方式与示例
从美国小学/初中科学考试中收集，筛选出"简单方法做不对"的难题。例如："为什么金属勺子放在热汤里会变热？"

## 关联基准与展望
关联：[HellaSwag](/benchmarks/hellaswag)、[WinoGrande](/benchmarks/winogrande)。已接近饱和（97%+）。
