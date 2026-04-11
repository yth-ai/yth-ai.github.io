---
title: "AI2D：科学图解问答"
description: "5000+ 小学科学图解（食物链/水循环/人体等）的多选问答"
date: 2016-01-01T00:00
benchName: "AI2D"
org: "Allen AI (AI2)"
paper: "arXiv:1603.07396"
category: "多模态"
subcategory: "视觉推理"
abilities: ["科学图解", "图表理解", "空间推理"]
dataSize: "5000+ diagrams / 15000 questions"
construction: "小学科学教材"
evalMethod: "多选准确率"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "~94%"
    date: "2025-11"
  - model: "GPT-4o"
    score: "88.0%"
    date: "2024-05"
tags: ["科学", "图解", "多模态"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
AI2D 包含 5000+ 小学科学图解（食物链、水循环、人体结构等）的多选问答，是多模态模型理解科学图解的基础评测。

## 构建方式与示例
从小学科学教材收集图解，配合 15000 个问答对。例如：[食物链图] "在这个食物链中，如果蛇的数量减少，青蛙的数量会怎样变化？"

## 关键发现
Gemini 2.5 Pro ~94%，接近饱和。但在更复杂的科学图解（电路、分子结构）上仍有挑战。

## 关联基准与展望
关联：[ChartQA](/benchmarks/chartqa)、[MathVista](/benchmarks/mathvista)。不足：题目偏简单（小学水平），需要更难的科学图解评测。
