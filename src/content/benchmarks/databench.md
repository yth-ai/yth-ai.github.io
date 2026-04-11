---
title: "DataBench：数据分析推理"
description: "评估 LLM 在真实数据集上回答数据分析问题的能力（不写 SQL，直接推理）"
date: 2024-05-01
benchName: "DataBench"
org: "多校联合"
paper: "arXiv:2405.04346"
category: "数据"
subcategory: "数据分析"
abilities: ["数据分析", "表格推理", "统计推理", "数据理解"]
dataSize: "3,233 questions / 100 datasets"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "74.8%"
  - model: "Claude Opus 4"
    score: "69.3%"
  - model: "GPT-4o"
    score: "58.2%"
tags: ["数据分析", "表格", "统计"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
DataBench 评测模型对真实数据集的理解能力——不是写代码，而是理解数据特征、分布和质量。

## 构建方式与示例
真实数据集 + 理解类问题。例如："这个数据集有多少缺失值？哪一列的缺失率最高？"

## 关联基准与展望
关联：[DSBench](/benchmarks/dsbench)、[BIRD](/benchmarks/bird-sql)。不足：偏描述性分析，缺乏建模评测。
