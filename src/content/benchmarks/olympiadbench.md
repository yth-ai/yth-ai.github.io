---
title: "OlympiadBench：奥赛级双语多模态科学"
description: "8,476 道来自物理/化学/数学奥赛的双语多模态题目"
date: 2024-06-01
benchName: "OlympiadBench"
org: "THU & Peking"
paper: "arXiv:2402.14008"
category: "推理"
subcategory: "数学推理"
abilities: ["奥赛", "物理", "化学", "数学", "多模态", "双语"]
dataSize: "8,476 problems"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "o3"
    score: "48.6%"
  - model: "GPT-4V"
    score: "17.1%"
tags: ["奥赛", "科学", "多模态", "双语"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
覆盖物理和数学奥赛题目，是科学竞赛级推理的综合评测。需要严格推理和计算。

## 构建方式与示例
物理和数学奥赛真题。例如物理："一个带电粒子在非均匀磁场中的运动轨迹..."

## 关联基准与展望
关联：[AIME](/benchmarks/aime)、[CNMO](/benchmarks/cnmo)、[Omni-MATH](/benchmarks/omni-math)。
