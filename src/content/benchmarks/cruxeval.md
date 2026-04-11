---
title: "CRUXEval：代码推理理解"
description: "800 道 Python 函数的输入/输出推理题，测试模型是否真正理解代码而非模式匹配"
date: 2024-01-01
benchName: "CRUXEval"
org: "Meta (FAIR)"
paper: "arXiv:2401.03065"
category: "代码生成"
subcategory: "代码理解"
abilities: ["代码理解", "执行推理", "输入预测", "输出预测"]
dataSize: "800 tasks"
evalMethod: "标准评测"
metric: "pass@1 (%)"
topResults:
  - model: "o3"
    score: "89.2%"
  - model: "Claude Opus 4"
    score: "82.4%"
  - model: "GPT-4o"
    score: "74.8%"
tags: ["代码理解", "推理", "Python"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
CRUXEval 测的不是"写代码"而是"理解代码"——给一段代码和输入，预测输出。或者给输出，推断输入。

## 构建方式与示例
800 道 Python 代码理解题。例如："函数 f(x) = x[::-1] + x[0]，输入 'abc'，输出是什么？" → "cbaa"

## 关联基准与展望
关联：[HumanEval](/benchmarks/humaneval)、[EvalPlus](/benchmarks/evalplus)。不足：代码片段偏短偏简单。
