---
title: "AGIEval：真实考试评测"
description: "以 SAT/GRE/LSAT/高考等真实标准化考试评估模型的认知和推理能力"
date: 2023-04-01
benchName: "AGIEval"
org: "Microsoft"
paper: "arXiv:2304.06364"
category: "综合"
subcategory: "综合"
abilities: ["标准化考试", "SAT", "GRE", "LSAT", "高考"]
dataSize: "8,062 questions / 20 exams"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "89.4%"
  - model: "Claude Opus 4"
    score: "86.7%"
  - model: "GPT-4"
    score: "71.3%"
tags: ["标准化考试", "综合", "多语言"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
AGIEval 收集了中美高考、GRE、GMAT、LSAT 等 20 个标准化考试的真题，衡量模型在"通过人类选拔性考试"上的表现。

## 构建方式与示例
20 个考试数据集：中国高考（语/数/英/理综）、GRE、GMAT、LSAT、SAT、公务员考试。例如高考数学："已知函数 f(x)=x³-3x，求 f 在 [-2,2] 上的最大值。"

## 关键发现
GPT-4 已能通过大部分考试，但中国高考理综和 LSAT 逻辑推理仍有差距。考试成绩不等于真实能力。

## 关联基准与展望
关联：[MMLU](/benchmarks/mmlu)、[C-Eval](/benchmarks/ceval)。不足：考试题偏记忆型，推理深度有限。
