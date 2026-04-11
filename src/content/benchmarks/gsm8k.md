---
title: "GSM8K：小学数学应用题"
description: "8,500 道需要 2-8 步计算的小学数学应用题，已接近饱和"
date: 2021-11-01
benchName: "GSM8K"
org: "OpenAI"
paper: "arXiv:2110.14168"
category: "推理"
subcategory: "数学推理"
abilities: ["数学推理", "多步计算"]
dataSize: "8,500 questions"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "DeepSeek R1"
    score: "97.3%"
  - model: "GPT-4o"
    score: "95.8%"
tags: ["数学", "已饱和"]
status: "active"
importance: 2
saturation: "已饱和"
---
## 为什么重要
GSM8K 曾是数学推理核心基准，CoT prompting 最初在此展示效果。**现已饱和**（97%+），仅做基线验证。

## 构建方式与示例
8500 道小学数学应用题，每题 2-8 步。例如："Tom 有 5 个苹果，给了 Mary 2 个，又买了 3 个，现在有几个？"

## 关联基准与展望
关联：[MATH](/benchmarks/math-benchmark)、[AIME](/benchmarks/aime)。已饱和，更难替代：MATH/AIME/FrontierMath。
