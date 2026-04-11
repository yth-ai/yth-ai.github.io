---
title: "CrossCodeEval：跨文件代码补全"
description: "评估 LLM 在需要跨文件上下文信息的代码补全场景中的能力"
date: 2024-03-01T00:00
benchName: "CrossCodeEval"
org: "Meta & AWS"
paper: "arXiv:2310.11248"
website: "https://crosscodeeval.github.io"
category: "代码生成"
subcategory: "代码理解"
abilities: ["跨文件依赖", "类型推断", "API使用"]
dataSize: "9928 个样本 / 4 种语言"
construction: "从 GitHub 仓库自动提取"
evalMethod: "精确匹配 + Edit Similarity"
metric: "EM (%)"
topResults:
  - model: "CodeLlama-34B + RAG"
    score: "~35%"
    date: "2024-03"
tags: ["跨文件", "代码补全", "多语言"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
评测需要跨文件上下文（import 依赖、类型信息）的代码补全。覆盖 Python/Java/TS/C# 四种语言。

## 构建方式与示例
从 GitHub 仓库自动提取必须用跨文件信息才能补全的样本。

## 关联基准与展望
关联：[RepoBench](/benchmarks/repobench)、[BigCodeBench](/benchmarks/bigcodebench)。不足：只测补全不测修改。
