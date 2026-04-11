---
title: "RepoBench：仓库级代码自动补全"
description: "评估代码补全系统在仓库级别（需跨文件检索上下文）的能力"
date: 2024-01-01T00:00
benchName: "RepoBench"
org: "多校"
paper: "arXiv:2306.03091"
code: "github.com/Leolty/repobench"
venue: "ICLR 2024"
category: "代码生成"
subcategory: "仓库级"
abilities: ["跨文件补全", "上下文检索", "仓库理解"]
dataSize: "动态生成"
construction: "从 GitHub 仓库自动构建"
evalMethod: "精确匹配 / Edit Similarity"
metric: "EM / ES (%)"
topResults:
  - model: "StarCoder2-15B"
    score: "~48% EM"
    date: "2024-01"
tags: ["代码补全", "仓库级", "跨文件"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
评测仓库级代码自动补全——补全某行代码时需要从其他文件检索相关上下文。

## 构建方式与示例
三个子任务：跨文件检索 → 跨文件补全 → Pipeline 整合。

## 关联基准与展望
关联：[CrossCodeEval](/benchmarks/crosscodeeval)、[BigCodeBench](/benchmarks/bigcodebench)。
