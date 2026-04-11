---
title: "MBPP：基础 Python 编程题"
description: "974 道入门级 Python 编程任务，与 HumanEval 互补的代码生成基准"
date: 2021-08-01
benchName: "MBPP"
org: "Google"
paper: "arXiv:2108.07732"
category: "代码生成"
subcategory: "函数级"
abilities: ["Python编程", "基础算法", "字符串处理", "列表操作"]
dataSize: "974 problems (sanitized: 427)"
evalMethod: "标准评测"
metric: "pass@1 (%)"
topResults:
  - model: "GPT-5"
    score: "91.8%"
  - model: "Claude Opus 4"
    score: "89.3%"
  - model: "DeepSeek V3"
    score: "84.1%"
tags: ["代码生成", "Python", "基础编程", "已饱和"]
status: "active"
importance: 2
saturation: "已饱和"
---
## 为什么重要
MBPP（Mostly Basic Python Problems）是 HumanEval 的补充——974 道基础 Python 编程题。

## 构建方式与示例
众包设计 974 道 Python 题，每题有 3 个自动化测试。例如："写一个函数判断一个数是否为阿姆斯特朗数。"

## 关联基准与展望
关联：[HumanEval](/benchmarks/humaneval)、[EvalPlus](/benchmarks/evalplus)。MBPP+ 增强了测试用例。
