---
title: "MathVista：视觉数学推理"
description: "6,141 道需要理解图表/几何的数学题"
date: 2024-01-01
benchName: "MathVista"
org: "Microsoft & UCLA"
paper: "arXiv:2310.02255"
category: "多模态"
subcategory: "视觉推理"
abilities: ["视觉数学", "图表理解", "几何推理"]
dataSize: "6,141 questions"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "74.6%"
  - model: "GPT-4V"
    score: "49.9%"
tags: ["多模态", "数学", "视觉"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
6141 道需要理解图表/几何/函数图像的数学题。模型需要从图中提取数据、做推理和计算。

## 构建方式与示例
从 31 个数据集整合。例如：[柱状图] "2022 年和 2023 年的增长率之差是多少？"

## 关联基准与展望
关联：[ChartQA](/benchmarks/chartqa)、[MathVerse](/benchmarks/mathverse)、[MMMU](/benchmarks/mmmu)。
