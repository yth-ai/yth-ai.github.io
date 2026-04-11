---
title: "WinoGrande：常识代词消歧"
description: "44,000 道需要常识推理来解决代词指代歧义的二选一题"
date: 2020-02-01
benchName: "WinoGrande"
org: "Allen AI"
paper: "arXiv:1907.10641"
category: "推理"
subcategory: "常识推理"
abilities: ["常识推理", "代词消歧", "语言理解"]
dataSize: "44,000 problems"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "96.8%"
  - model: "GPT-4o"
    score: "93.7%"
tags: ["常识推理", "已饱和"]
status: "active"
importance: 1
saturation: "已饱和"
---
## 为什么重要
WinoGrande 是大规模版 Winograd Schema，44000 道代词消解题。测常识推理。**已饱和**。

## 构建方式与示例
例如："The trophy doesn't fit in the suitcase because it is too [big/small]." → 指什么？

## 关联基准与展望
关联：[HellaSwag](/benchmarks/hellaswag)、[ARC-Challenge](/benchmarks/arc-challenge)。已饱和。
