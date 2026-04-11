---
title: "InfiAgent-DABench：端到端数据分析"
description: "360 个端到端数据分析任务（给数据集+问题→写代码→出结果），覆盖统计/可视化/建模"
date: 2024-01-01T00:00
benchName: "InfiAgent-DABench"
org: "多校"
paper: "arXiv:2401.05507"
category: "Agent"
subcategory: "Data Science Agent"
abilities: ["数据分析", "代码生成", "统计推断", "可视化"]
dataSize: "360 tasks"
construction: "专家设计"
evalMethod: "执行结果匹配"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-4 + Code Interpreter"
    score: "~55%"
    date: "2024-01"
tags: ["数据分析", "端到端", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
360 个端到端数据分析任务——给数据集+自然语言问题，Agent 自主写代码、执行、输出答案。

## 构建方式与示例
例如："给定这个 CSV 销售数据，计算每个城市的月均销售额并排序。"

## 关联基准与展望
关联：[DSBench](/benchmarks/dsbench)、[DataBench](/benchmarks/databench)。不足：数据集规模有限。
