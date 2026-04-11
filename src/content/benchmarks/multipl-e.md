---
title: "MultiPL-E：多语言代码生成"
description: "将 HumanEval/MBPP 翻译到 18 种编程语言，评估跨语言代码生成能力"
date: 2023-08-01
benchName: "MultiPL-E"
org: "Northeastern University"
paper: "arXiv:2208.08227"
category: "代码生成"
subcategory: "函数级"
abilities: ["多语言代码", "Python", "Rust", "C++", "Java", "Go", "TypeScript"]
dataSize: "~3,000 problems / 18 languages"
evalMethod: "标准评测"
metric: "pass@1 (%)"
topResults:
  - model: "GPT-5"
    score: "82.4% avg"
  - model: "Claude Opus 4"
    score: "79.1% avg"
tags: ["代码生成", "多语言", "跨语言"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
将 HumanEval 和 MBPP 翻译为 22 种编程语言，测试模型的多语言代码生成能力。

## 构建方式与示例
22 种语言：Python/Java/JS/TS/C++/Rust/Go/Ruby/Perl 等。同一题目在不同语言上评测。

## 关联基准与展望
关联：[HumanEval](/benchmarks/humaneval)、[Aider Polyglot](/benchmarks/aider-polyglot)。不足：翻译可能引入 bug。
