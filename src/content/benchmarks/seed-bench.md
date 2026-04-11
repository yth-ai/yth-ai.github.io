---
title: "SEED-Bench：多模态理解生成"
description: "19,242 道跨 12 个维度的多模态多选题，同时评估理解和生成能力"
date: 2024-03-01
benchName: "SEED-Bench"
org: "Tencent AI Lab"
paper: "arXiv:2307.16125"
category: "多模态"
subcategory: "视觉理解"
abilities: ["多模态理解", "图像生成", "视觉推理", "空间理解"]
dataSize: "19,242 questions / 12 dimensions"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "78.6%"
  - model: "GPT-5 Vision"
    score: "75.3%"
  - model: "Claude Opus 4 Vision"
    score: "72.1%"
tags: ["多模态", "图像", "理解", "生成"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
SEED-Bench 覆盖 12 个维度的多模态理解（空间/时序/动作/属性等），是全面性最好的多模态基准之一。

## 构建方式与示例
19000 道多选题，覆盖图像+视频。例如：[视频片段] "视频中的人做了什么动作？"

## 关联基准与展望
关联：[MMMU](/benchmarks/mmmu)、[Video-MME](/benchmarks/videomme)。
