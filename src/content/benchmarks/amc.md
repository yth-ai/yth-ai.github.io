---
title: "AMC 10/12：美国数学竞赛"
description: "美国高中数学竞赛的标准化测试题，AIME 的前置选拔赛，是数学推理的基础门槛"
date: 2024-01-01T00:00
benchName: "AMC 10/12"
org: "MAA"
website: "https://artofproblemsolving.com/wiki/index.php/AMC_10"
category: "推理"
subcategory: "数学推理"
abilities: ["高中数学", "代数", "几何", "组合"]
dataSize: "历年真题 (每年 25x4 = 100 题)"
construction: "竞赛真题"
evalMethod: "精确答案匹配"
metric: "Accuracy (%)"
topResults:
  - model: "o3"
    score: "~95%"
    date: "2025-12"
  - model: "DeepSeek R1"
    score: "~90%"
    date: "2025-01"
tags: ["数学", "竞赛", "高中"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
AMC 是 AIME 的前置选拔赛。推理模型已接近饱和（95%+），主要用作数学推理的基础门槛验证。

## 构建方式与示例
每年 25 道多选题，覆盖代数/几何/组合。例如："三角形 ABC 中，AB=5, BC=7, CA=8，求内切圆半径。"

## 关联基准与展望
关联：[AIME](/benchmarks/aime)、[MATH](/benchmarks/math-benchmark)。接近饱和，区分度不足。
