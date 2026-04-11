---
title: "BBH：超越模仿游戏的挑战任务"
description: "BIG-Bench Hard 从 204 个 BIG-Bench 任务中筛选出 23 个 LLM 表现差于人类的难题"
date: 2023-10-01
benchName: "BBH (BIG-Bench Hard)"
org: "Google"
paper: "arXiv:2210.09261"
category: "推理"
subcategory: "逻辑推理"
abilities: ["逻辑推理", "因果推理", "算法推理", "自然语言理解"]
dataSize: "23 tasks / 6,511 examples"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "95.1%"
  - model: "Claude Opus 4"
    score: "92.8%"
  - model: "GPT-4o"
    score: "83.6%"
tags: ["推理", "BIG-Bench", "CoT"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
BBH（BIG-Bench Hard）从 200+ 个 BIG-Bench 任务中筛选出 23 个 LLM 做不好的难任务。被 HF Open LLM Leaderboard v2 采用。

## 构建方式与示例
23 个任务类型：逻辑推演、日期理解、因果推理等。例如："如果 A 比 B 高，B 比 C 高，C 比 D 矮。谁最高？"

## 关联基准与展望
关联：[MMLU-Pro](/benchmarks/mmlu-pro)、[DROP](/benchmarks/drop)。部分任务区分度在下降。
