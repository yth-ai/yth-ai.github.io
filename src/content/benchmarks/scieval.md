---
title: "SciEval：科学知识动态评测"
description: "包含基础知识、知识应用和科学研究三个维度的科学评测，支持动态更新防污染"
date: 2024-01-01T00:00
benchName: "SciEval"
org: "多校"
paper: "arXiv:2308.13149"
code: "github.com/OpenDFM/SciEval"
category: "领域专业"
subcategory: "科学"
abilities: ["科学知识", "实验设计", "数据分析", "论文理解"]
dataSize: "18000+ 题"
construction: "教材 + 动态生成"
evalMethod: "多选 + 判断 + 开放式"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-4"
    score: "~70%"
    date: "2024-01"
tags: ["科学", "物理", "化学", "生物"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
三层结构：基础知识→知识应用→科学研究，支持动态生成新题防污染。18000+ 题。

## 构建方式与示例
教材 + 动态生成。例如应用层："设计一个实验验证光电效应。"

## 关联基准与展望
关联：[ChemBench](/benchmarks/chembench)、[SciBench](/benchmarks/scibench)。
