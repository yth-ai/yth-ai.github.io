---
title: "FRAMES：多跳事实检索与推理"
description: "需要模型从多个信息源综合推理的事实性问题，测试检索增强推理能力"
date: 2024-09-01
benchName: "FRAMES"
org: "Google DeepMind"
paper: "arXiv:2409.12941"
category: "推理"
subcategory: "综合推理"
abilities: ["多跳推理", "事实检索", "RAG", "信息综合"]
dataSize: "824 questions"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5 + Search"
    score: "72.4%"
  - model: "Claude Opus 4"
    score: "58.3%"
  - model: "GPT-4o"
    score: "47.1%"
tags: ["多跳推理", "RAG", "事实性"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
FRAMES 评测多跳事实检索+推理——需要从多个文档中收集信息并综合推理。

## 构建方式与示例
824 个多跳问题。例如："获得 2020 年菲尔兹奖的数学家在哪所大学取得了博士学位？"（需要：找到获奖者 → 查其教育背景）

## 关联基准与展望
关联：[GAIA](/benchmarks/gaia)、[BrowseComp](/benchmarks/browsecomp)。不足：部分答案可能过时。
