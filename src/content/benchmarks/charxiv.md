---
title: "CharXiv：科学图表理解"
description: "2,323 张来自 arXiv 论文的真实科学图表 + 问答，测试模型理解学术图表的能力"
date: 2024-06-01
benchName: "CharXiv"
org: "Princeton & Apple"
paper: "arXiv:2406.18521"
category: "多模态"
subcategory: "视觉推理"
abilities: ["科学图表", "论文图表", "数据可视化", "学术理解"]
dataSize: "2,323 charts / 10,000 QA pairs"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "71.2%"
  - model: "GPT-5 Vision"
    score: "66.8%"
  - model: "GPT-4V"
    score: "47.1%"
tags: ["多模态", "图表", "科学", "arXiv"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
CharXiv 专门评测模型理解 arXiv 论文图表的能力——从散点图到混淆矩阵到训练曲线，是科研场景多模态理解的关键能力。

## 构建方式与示例
从 arXiv 论文中收集图表 + 问题。例如：[训练损失曲线] "模型在第几个 epoch 开始过拟合？"

## 关联基准与展望
关联：[ChartQA](/benchmarks/chartqa)、[MathVista](/benchmarks/mathvista)。不足：只覆盖 arXiv 风格图表。
