---
title: "WikiTableQuestions：维基百科表格问答"
description: "22,033 个基于真实维基百科表格的复杂问答，需要多步操作（筛选/排序/计算/比较）"
date: 2015-08-01T00:00
benchName: "WikiTableQuestions"
org: "Stanford"
paper: "arXiv:1508.00305"
venue: "ACL 2015"
category: "数据"
subcategory: "表格理解"
abilities: ["表格QA", "多步推理", "筛选", "计算"]
dataSize: "22033 questions / 2108 tables"
construction: "众包标注维基百科表格"
evalMethod: "精确匹配"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-4 + CoT"
    score: "~75%"
    date: "2024-01"
tags: ["表格", "QA", "维基百科"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
22033 个基于维基百科表格的复杂问答——需要多步操作（筛选/排序/计算/比较）。

## 构建方式与示例
例如：[国家人口表] "人口超过 1 亿的国家中，GDP 最低的是哪个？"（需要筛选→排序→取值）

## 关联基准与展望
关联：[TabFact](/benchmarks/tabfact)、[BIRD](/benchmarks/bird-sql)。接近饱和。
