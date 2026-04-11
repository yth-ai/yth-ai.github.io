---
title: "MATH：竞赛级数学问题"
description: "12,500 道来自 AMC/AIME 等数学竞赛的问题"
date: 2021-11-01
benchName: "MATH"
org: "UC Berkeley"
paper: "arXiv:2103.03874"
category: "推理"
subcategory: "数学推理"
abilities: ["竞赛数学", "代数", "几何", "数论"]
dataSize: "12,500 questions"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "DeepSeek R1"
    score: "97.3%"
  - model: "OpenAI o3"
    score: "96.7%"
  - model: "GPT-4o"
    score: "76.6%"
tags: ["数学", "竞赛"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
MATH 是 GSM8K 的进阶版，12500 道竞赛级数学题，7 个领域 × 5 级难度。推理模型已接近饱和（97%）。

## 构建方式与示例
从 AMC/AIME 等竞赛收集。7 领域：代数、组合、几何、中间代数、数论、预微积分、概率。

## 关联基准与展望
关联：[AIME](/benchmarks/aime)、[FrontierMath](/benchmarks/frontiermath)、[GSM8K](/benchmarks/gsm8k)。推理模型接近饱和。
