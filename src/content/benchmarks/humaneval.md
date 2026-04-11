---
title: "HumanEval：函数级代码生成"
description: "164 道手写 Python 编程题，代码生成评测开山之作，已饱和"
date: 2021-07-01
benchName: "HumanEval"
org: "OpenAI"
paper: "arXiv:2107.03374"
category: "代码生成"
subcategory: "函数级"
abilities: ["Python编程", "函数实现"]
dataSize: "164 problems"
evalMethod: "标准评测"
metric: "pass@1 (%)"
topResults:
  - model: "GPT-5"
    score: "95.1%"
  - model: "Claude Opus 4"
    score: "93.7%"
tags: ["代码生成", "Python", "已饱和"]
status: "active"
importance: 2
saturation: "已饱和"
---
## 为什么重要
代码生成评测的开山之作（Codex 论文配套）。164 道 Python 函数题。**已饱和**（95%+），EvalPlus 是其增强版。

## 构建方式与示例
每题给函数签名+docstring，模型生成函数体。例如：`def is_palindrome(s: str) -> bool: """判断是否为回文"""`

## 关联基准与展望
关联：[EvalPlus](/benchmarks/evalplus)、[MBPP](/benchmarks/mbpp)、[BigCodeBench](/benchmarks/bigcodebench)。已饱和。
