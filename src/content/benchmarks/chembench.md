---
title: "ChemBench：化学领域推理评测"
description: "覆盖有机化学、无机化学、物理化学等多个子领域的化学推理评测"
date: 2024-05-01T00:00
benchName: "ChemBench"
org: "EPFL"
paper: "arXiv:2404.01475"
code: "github.com/lamalab-org/chem-bench"
category: "领域专业"
subcategory: "科学"
abilities: ["化学推理", "分子识别", "反应预测", "安全知识"]
dataSize: "7000+ questions"
construction: "教材 + 考试 + 专家设计"
evalMethod: "多选 + 开放式"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-4"
    score: "~60%"
    date: "2024-05"
tags: ["化学", "科学", "推理"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
7000+ 道覆盖有机/无机/物化等子领域的化学推理题，发现 GPT-4 在安全相关问题上表现尤差。

## 构建方式与示例
教材+考试+专家设计。例如："预测以下反应的主产物：苯 + Br₂ → ？（FeBr₃ 催化）"

## 关联基准与展望
关联：[SciBench](/benchmarks/scibench)、[SciEval](/benchmarks/scieval)。不足：主要是知识题，缺乏实验设计类评测。
