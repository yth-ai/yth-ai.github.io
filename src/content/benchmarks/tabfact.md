---
title: "TabFact：表格事实验证"
description: "判断一个陈述相对于给定表格是否为真，117,854 个人工标注的声明-表格对"
date: 2020-01-01T00:00
benchName: "TabFact"
org: "UCSB"
paper: "arXiv:1909.02164"
venue: "ICLR 2020"
category: "数据"
subcategory: "表格理解"
abilities: ["事实验证", "表格推理", "逻辑判断"]
dataSize: "117854 statements / 16573 tables"
construction: "众包标注"
evalMethod: "二分类（真/假）"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-4"
    score: "~90%"
    date: "2024-01"
tags: ["事实验证", "表格", "逻辑"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
判断陈述相对于表格是否为真——117,854 个声明-表格对。LLM 已接近饱和（90%），但复杂多步逻辑仍有挑战。

## 构建方式与示例
例如：[表格：各国 GDP] "美国的 GDP 是日本的 3 倍以上" → True/False

## 关联基准与展望
关联：[WikiTableQuestions](/benchmarks/wikitablequestions)、[TableBench](/benchmarks/tablebench)。接近饱和。
