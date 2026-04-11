---
title: "NATURAL-PLAN：现实规划能力"
description: "评估 LLM 处理日常规划任务（行程安排、会议调度、日历管理等）的能力"
date: 2024-06-01
benchName: "NATURAL-PLAN"
org: "Google DeepMind"
paper: "arXiv:2406.04520"
category: "推理"
subcategory: "规划推理"
abilities: ["规划", "日程安排", "约束满足", "多步推理"]
dataSize: "3 task types / 多种约束"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "62.4%"
  - model: "Claude Opus 4"
    score: "58.1%"
  - model: "GPT-4o"
    score: "44.8%"
tags: ["规划", "日常", "约束"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
NATURAL-PLAN 评测 LLM 在日程安排/旅行规划/会议调度等日常规划任务上的能力。

## 构建方式与示例
例如："安排一天的行程：10点开会(1h)、12点午饭(1h)、下午3点前到机场(需1h车程)——最优安排？"

## 关联基准与展望
关联：[GAIA](/benchmarks/gaia)、[AppWorld](/benchmarks/appworld)。不足：约束条件偏简单。
