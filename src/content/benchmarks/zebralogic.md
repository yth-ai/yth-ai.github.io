---
title: "ZebraLogic：逻辑谜题推理"
description: "来自经典 Zebra Puzzle 的逻辑推理问题，测试约束满足和排除法推理能力"
date: 2024-11-01
benchName: "ZebraLogic"
org: "多个研究团队"
paper: "arXiv:2407.01790"
category: "推理"
subcategory: "逻辑推理"
abilities: ["逻辑推理", "约束满足", "排除法", "推理链"]
dataSize: "1,000 puzzles / 多种难度"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "o3"
    score: "86.2%"
  - model: "Claude Opus 4"
    score: "62.4%"
  - model: "GPT-4o"
    score: "38.1%"
tags: ["逻辑", "推理", "谜题"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
ZebraLogic 基于 Einstein's Zebra Puzzle 的逻辑推理题——需要在多个约束条件下做排除法推理。

## 构建方式与示例
例如："5 个人住不同颜色的房子、喝不同饮料、养不同宠物。已知：英国人住红房子、瑞典人养狗..."→推理谁养鱼？

## 关联基准与展望
关联：[BBH](/benchmarks/bbh)、[SimpleBench](/benchmarks/simplebench)。不足：题目模式较单一。
