---
title: "TableBench：表格问答综合评测"
description: "18 个子任务覆盖表格理解的完整能力链：事实验证、数值推理、数据分析、可视化等"
date: 2024-08-01T00:00
benchName: "TableBench"
org: "多校"
paper: "arXiv:2408.09174"
code: "github.com/TableBench/TableBench"
category: "数据"
subcategory: "表格理解"
abilities: ["表格QA", "事实验证", "数值推理", "数据分析"]
dataSize: "3000+ questions / 18 subtasks"
construction: "工业场景 + 专家设计"
evalMethod: "精确匹配 / LLM Judge"
metric: "综合得分"
topResults:
  - model: "GPT-4o"
    score: "~62%"
    date: "2024-08"
tags: ["表格", "QA", "数据分析"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
18 个子任务覆盖表格理解完整能力链：事实查找→数值推理→数据分析→可视化。从工业场景设计。

## 构建方式与示例
3000+ 问题。例如："根据销售表，计算 Q3 各区域的同比增长率，找出增长最快的区域。"

## 关联基准与展望
关联：[BIRD](/benchmarks/bird-sql)、[WikiTableQuestions](/benchmarks/wikitablequestions)。
