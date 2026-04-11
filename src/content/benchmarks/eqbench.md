---
title: "EQ-Bench：情商评测"
description: "通过 45 个多轮角色扮演场景评估模型的情商——共情、社交导航、情绪推理"
date: 2024-01-01
benchName: "EQ-Bench"
org: "Independent"
category: "推理"
subcategory: "综合推理"
abilities: ["情商", "共情", "社交推理", "情绪理解", "角色扮演"]
dataSize: "45 scenarios / 18 criteria"
evalMethod: "标准评测"
metric: "ELO Score"
topResults:
  - model: "Claude Opus 4"
    score: "1285"
  - model: "GPT-5"
    score: "1272"
  - model: "Gemini 2.5 Pro"
    score: "1248"
tags: ["情商", "共情", "社交"]
status: "active"
importance: 2
---
## 为什么重要
EQ-Bench 评测模型的情商——理解情感变化、社会动态和微妙的人际关系。与纯知识评测互补。

## 构建方式与示例
171 道情感理解题。例如：给一段对话，判断"A 说这句话时的情感是什么？"

## 关联基准与展望
关联：[WildBench](/benchmarks/wildbench)、[MT-Bench](/benchmarks/mt-bench)。不足：样本量偏少。
