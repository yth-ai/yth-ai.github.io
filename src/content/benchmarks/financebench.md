---
title: "FinanceBench：金融文档分析"
description: "150 个基于真实上市公司 10-K 年报的金融分析问题，测试模型的金融推理能力"
date: 2024-02-01
benchName: "FinanceBench"
org: "Patronus AI"
paper: "arXiv:2311.11944"
category: "领域专业"
subcategory: "金融"
abilities: ["金融分析", "财报理解", "数值推理", "长文档"]
dataSize: "150 questions / 真实10-K年报"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5 + RAG"
    score: "78.2%"
  - model: "Claude Opus 4"
    score: "64.1%"
  - model: "GPT-4"
    score: "52.0%"
tags: ["金融", "财报", "领域专业"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
FinanceBench 使用真实上市公司的 10-K 年报评测模型的金融文档理解和数值推理能力。

## 构建方式与示例
基于真实年报的问答。例如："根据苹果公司 2023 年 10-K，计算其自由现金流并与上一年比较。"

## 关联基准与展望
关联：[CPA Exam](/benchmarks/cpa-exam)、[BIRD-SQL](/benchmarks/bird-sql)。不足：只覆盖美股上市公司。
