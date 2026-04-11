---
title: "MathVerse：视觉数学推理（图表依赖）"
description: "评估模型是否真的在看图推理，而非仅依赖文本信息忽略视觉"
date: 2024-06-01
benchName: "MathVerse"
org: "多校联合"
paper: "arXiv:2403.14624"
category: "多模态"
subcategory: "视觉推理"
abilities: ["视觉数学", "图表依赖", "多模态推理", "几何"]
dataSize: "2,612 problems / 6 versions"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "62.4%"
  - model: "GPT-4V"
    score: "42.1%"
tags: ["多模态", "数学", "视觉"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
MathVerse 专门测视觉数学推理中的"视觉依赖程度"——通过移除/保留图中文字信息来区分模型是真的看图还是靠文字猜。

## 构建方式与示例
2612 道视觉数学题，6 个信息级别（从纯图到纯文字）。

## 关联基准与展望
关联：[MathVista](/benchmarks/mathvista)、[MMMU](/benchmarks/mmmu)。
