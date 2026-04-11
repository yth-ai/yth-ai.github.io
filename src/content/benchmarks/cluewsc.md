---
title: "CLUEWSC：中文共指消解"
description: "中文版 Winograd Schema Challenge，通过代词消解评测中文语言理解和常识推理能力"
date: 2020-01-01T00:00
benchName: "CLUEWSC"
org: "CLUEbenchmark"
paper: "arXiv:2004.05986"
code: "github.com/CLUEbenchmark/CLUE"
website: "https://www.cluebenchmarks.com"
category: "综合"
subcategory: "中文"
abilities: ["共指消解", "中文理解", "常识推理"]
dataSize: "1838 samples"
construction: "人工翻译改编 + 原创"
evalMethod: "准确率"
metric: "Accuracy (%)"
topResults:
  - model: "DeepSeek R1"
    score: "92.8%"
    date: "2025-01"
  - model: "GPT-4"
    score: "~85%"
    date: "2024-01"
tags: ["中文", "共指消解", "常识"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
中文版 Winograd Schema Challenge，通过代词消解评测中文语言理解。DeepSeek R1 报告用。

## 构建方式与示例
1838 个代词消解样本。例如："小明把书借给了小红，她很高兴。" → "她"指谁？

## 关联基准与展望
关联：[C-Eval](/benchmarks/ceval)、[WinoGrande](/benchmarks/winogrande)。接近饱和（92%+）。
