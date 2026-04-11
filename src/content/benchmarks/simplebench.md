---
title: "SimpleBench：常识推理陷阱题"
description: "专门设计的常识推理'陷阱'题——需要直觉而非知识，模型容易被表面模式误导"
date: 2024-10-01T00:00
benchName: "SimpleBench"
org: "独立研究者"
website: "https://simple-bench.com"
category: "推理"
subcategory: "常识推理"
abilities: ["常识推理", "因果推理", "空间推理", "社会常识"]
dataSize: "~200 questions"
construction: "人工设计陷阱题"
evalMethod: "多选准确率"
metric: "Accuracy (%)"
topResults:
  - model: "o3"
    score: "~55%"
    date: "2025-12"
  - model: "GPT-4o"
    score: "~42%"
    date: "2024-10"
tags: ["常识", "陷阱", "直觉推理"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
专门设计的常识推理陷阱题——模型容易被表面模式误导。o3 也只有 ~55%。

## 构建方式与示例
~200 个陷阱题。例如："一个人把杯子放在桌子上，桌子翻了，杯子在哪？"——模型倾向答"桌子上"（错误）。

## 关联基准与展望
关联：[ARC-AGI](/benchmarks/arc-agi)、[HellaSwag](/benchmarks/hellaswag)。不足：样本量偏少。
