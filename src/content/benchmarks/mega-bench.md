---
title: "MEGA-Bench：500+ 真实多模态任务"
description: "505 个覆盖日常使用场景的多模态任务，比 MMMU 更贴近真实用户需求"
date: 2025-03-01
benchName: "MEGA-Bench"
org: "TIGER AI Lab"
paper: "arXiv:2410.10563"
category: "多模态"
subcategory: "视觉理解"
abilities: ["多模态", "真实任务", "图像理解", "视觉推理", "日常应用"]
dataSize: "505 tasks / 多种输入输出格式"
evalMethod: "标准评测"
metric: "Score (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "68.4%"
  - model: "GPT-5 Vision"
    score: "64.1%"
  - model: "Claude Opus 4"
    score: "60.8%"
tags: ["多模态", "真实世界", "500+任务"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
MEGA-Bench 是目前最大规模的多模态评测——500+ 个任务覆盖视觉识别、推理、创作等多种能力类型。

## 构建方式
1. 500+ 个多模态任务，远超 MMMU 的规模
2. 覆盖：视觉识别、空间推理、文字理解、创意生成等
3. 多维度评分

## 关联基准
- [MMMU](/benchmarks/mmmu)、[SEED-Bench](/benchmarks/seed-bench)、[MM-Vet](/benchmarks/mmvet)

## 不足与展望
- 任务类型覆盖广但每类深度不够
- 评分标准复杂，可复现性有待验证
