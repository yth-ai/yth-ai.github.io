---
title: "MT-Bench：多轮对话基准"
description: "80 个多轮问题涵盖 8 个领域，由 GPT-4 自动评分，是早期对话评测的经典"
date: 2023-06-01
benchName: "MT-Bench"
org: "LMSYS (UC Berkeley)"
paper: "arXiv:2306.05685"
category: "对齐与安全"
subcategory: "自动评分"
abilities: ["多轮对话", "写作", "推理", "数学", "角色扮演"]
dataSize: "80 questions / 8 categories"
evalMethod: "标准评测"
metric: "Score (1-10)"
topResults:
  - model: "GPT-5"
    score: "9.6"
  - model: "Claude Opus 4"
    score: "9.4"
  - model: "GPT-4o"
    score: "9.0"
tags: ["多轮对话", "LLM Judge", "对话质量"]
status: "active"
importance: 2
saturation: "已饱和"
---
## 为什么重要
MT-Bench 是早期的 80 题多轮对话基准。Arena-Hard 是其精神继承者，区分度更好。

## 构建方式与示例
80 题 × 2 轮。例如第一轮："写一个排序算法"→第二轮："改成并行版本"。

## 关联基准与展望
关联：[Arena-Hard](/benchmarks/arena-hard)、[Chatbot Arena](/benchmarks/chatbot-arena)。区分度已不足。
