---
title: "SciBench：大学理工科考试"
description: "来自大学物理/化学/数学教材的真实考试题，评估模型解决大学级科学问题的能力"
date: 2024-01-01T00:00
benchName: "SciBench"
org: "UCLA & 多校"
paper: "arXiv:2307.10635"
code: "github.com/mandyyyyii/scibench"
category: "推理"
subcategory: "科学推理"
abilities: ["大学物理", "大学化学", "微积分", "线性代数"]
dataSize: "695 个开放题"
construction: "大学教材考试题"
evalMethod: "精确答案匹配"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-4 + CoT"
    score: "~35%"
    date: "2024-01"
tags: ["科学推理", "大学", "物理", "化学"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
来自 MIT/Stanford 等名校教材的大学理工科考试题。GPT-4 + CoT 也只有 ~35%。

## 构建方式与示例
695 个开放题，覆盖大学物理/化学/微积分/线性代数。

## 关联基准与展望
关联：[GPQA](/benchmarks/gpqa)、[SciEval](/benchmarks/scieval)。不足：部分题目需要专业计算工具。
