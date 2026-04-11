---
title: "Omni-MATH：奥林匹克级数学推理"
description: "4,428 道竞赛级数学题覆盖 33 个子领域，最强模型正确率仅 ~60%"
date: 2025-01-01
benchName: "Omni-MATH"
org: "PKU"
paper: "arXiv:2410.07985"
category: "推理"
subcategory: "数学推理"
abilities: ["奥林匹克数学", "竞赛", "代数", "几何", "数论", "组合"]
dataSize: "4,428 problems / 33 subdomains"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "o3"
    score: "60.2%"
  - model: "DeepSeek R1"
    score: "52.4%"
  - model: "GPT-4o"
    score: "26.8%"
tags: ["数学", "奥林匹克", "竞赛"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
Omni-MATH 覆盖 33 个数学子领域（从初等数论到代数几何），是目前覆盖面最广的奥赛级数学评测。

## 构建方式
1. 从全球数学奥赛中收集 4428 道题
2. 覆盖 33 个子领域，10 个难度等级
3. 需要严格证明

## 关联基准
- [AIME](/benchmarks/aime)、[FrontierMath](/benchmarks/frontiermath)、[OlympiadBench](/benchmarks/olympiadbench)

## 不足与展望
- 自动评分对证明题不够准确
