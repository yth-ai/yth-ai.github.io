---
title: "TheoremQA：定理应用推理"
description: "800 道需要应用大学级数学/物理/CS 定理来解决的 STEM 问题"
date: 2023-05-01
benchName: "TheoremQA"
org: "Waterloo & Google"
paper: "arXiv:2305.12524"
category: "推理"
subcategory: "科学推理"
abilities: ["定理应用", "大学STEM", "数学", "物理", "CS"]
dataSize: "800 questions / 350 theorems"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "o3"
    score: "68.4%"
  - model: "GPT-5"
    score: "62.1%"
  - model: "GPT-4"
    score: "43.0%"
tags: ["定理", "STEM", "大学级"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
测试模型运用数学定理解决问题的能力——不是背定理，是**用**定理。

## 构建方式与示例
800 道需要引用和应用定理的问题。例如："用格林公式计算以下曲线积分..."

## 关联基准与展望
关联：[MATH](/benchmarks/math-benchmark)、[SciBench](/benchmarks/scibench)。
