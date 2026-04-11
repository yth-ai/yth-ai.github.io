---
title: "L-Eval：长文本能力分层评测"
description: "411 个长文本任务，覆盖封闭式（精确答案）和开放式（摘要/翻译），评估不同长度的理解能力"
date: 2023-07-01T00:00
benchName: "L-Eval"
org: "Fudan"
paper: "arXiv:2307.11088"
code: "github.com/OpenLMLab/LEval"
category: "长文本"
subcategory: "综合"
abilities: ["长文本QA", "摘要", "翻译", "多步推理"]
dataSize: "411 questions / 平均 7-60K words"
construction: "从真实长文档构建"
evalMethod: "精确匹配 + LLM Judge"
metric: "综合得分"
topResults:
  - model: "GPT-4 Turbo"
    score: "~60% 封闭题"
    date: "2024-01"
tags: ["长文本", "摘要", "QA"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
L-Eval 将长文本评测分为封闭式（有答案）和开放式（摘要/翻译），更细致评估不同类型的长文本能力。

## 构建方式与示例
411 个长文本任务，平均 7-60K words。例如封闭式："在这篇 30K 词的论文中，作者第二个实验的控制变量是什么？"

## 关联基准与展望
关联：[LongBench](/benchmarks/longbench)、[InfiniteBench](/benchmarks/infinitebench)。
