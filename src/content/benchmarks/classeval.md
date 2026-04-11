---
title: "ClassEval：类级别代码生成"
description: "100 个 Python 类生成任务，填补函数级和仓库级之间的评测空白"
date: 2024-01-01T00:00
benchName: "ClassEval"
org: "FudanNLP"
paper: "arXiv:2308.01861"
code: "github.com/FudanSELab/ClassEval"
category: "代码生成"
subcategory: "函数级"
abilities: ["类实现", "方法间依赖", "OOP"]
dataSize: "100 classes / 412 methods"
construction: "人工编写"
evalMethod: "单元测试通过"
metric: "class-level pass@1 (%)"
topResults:
  - model: "GPT-4"
    score: "~50%"
    date: "2024-01"
tags: ["代码生成", "类级别", "OOP"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
在 HumanEval（函数级）和 SWE-bench（仓库级）之间，评测生成完整 Python 类的能力。方法间依赖越多，成功率越低。

## 构建方式与示例
100 个 Python 类 / 412 个方法。例如："实现一个 BinarySearchTree 类，包含 insert/search/delete/traverse 方法。"

## 关联基准与展望
关联：[HumanEval](/benchmarks/humaneval)、[BigCodeBench](/benchmarks/bigcodebench)。不足：只有 Python，类设计偏简单。
