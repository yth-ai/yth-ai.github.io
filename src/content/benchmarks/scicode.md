---
title: "SciCode：科学计算代码生成"
description: "338 道来自 16 个科学领域的数值计算问题，最强模型 ~8%"
date: 2024-07-01
benchName: "SciCode"
org: "Yale & Mila"
paper: "arXiv:2407.13168"
category: "代码生成"
subcategory: "领域特化"
abilities: ["科学计算", "数值方法", "物理模拟"]
dataSize: "338 subproblems"
evalMethod: "标准评测"
metric: "pass@k (%)"
topResults:
  - model: "o1-preview"
    score: "7.6%"
  - model: "Claude 3.5"
    score: "4.6%"
tags: ["科学计算", "数值方法"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
揭示了 LLM 在科学计算上几乎无能为力——最强推理模型也只有 ~8%。覆盖 16 个学科的真实科研代码。

## 构建方式与示例
338 个子问题。例如："用有限差分法求解二维热传导方程，边界条件为..."

## 关联基准与展望
关联：[KernelBench](/benchmarks/kernelbench)、[DS-1000](/benchmarks/ds1000)。不足：需要领域知识+数值方法双重专长。
