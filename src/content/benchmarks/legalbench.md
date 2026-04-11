---
title: "LegalBench：法律推理评测"
description: "162 个由法律专业人士设计的任务，覆盖法律文本理解、规则应用和推理"
date: 2024-02-01
benchName: "LegalBench"
org: "多校法学院联合"
paper: "arXiv:2308.11462"
category: "领域专业"
subcategory: "法律"
abilities: ["法律推理", "规则应用", "合同分析", "法律文本理解"]
dataSize: "162 tasks / 20,000+ examples"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "81.3%"
  - model: "Claude Opus 4"
    score: "78.6%"
  - model: "GPT-4"
    score: "72.4%"
tags: ["法律", "专业领域", "规则推理"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
LegalBench 覆盖 162 个法律推理子任务，是法律 AI 最全面的评测。

## 构建方式与示例
162 个子任务覆盖合同解释、规则应用、修辞分析等。例如："判断这个条款是否构成竞业限制。"

## 关联基准与展望
关联：[BigLaw Bench](/benchmarks/biglawbench)、[MedQA](/benchmarks/medqa)。不足：英美法系为主。
