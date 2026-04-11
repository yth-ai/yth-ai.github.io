---
title: "MMStar：精选多模态评测"
description: "1500 道精心筛选的视觉依赖多模态题目，消除了数据泄露和纯文本捷径"
date: 2024-03-01T00:00
benchName: "MMStar"
org: "NTU & 多校"
paper: "arXiv:2403.20330"
category: "多模态"
subcategory: "视觉理解"
abilities: ["视觉理解", "推理", "数学", "科学"]
dataSize: "1500 questions / 6 维度"
construction: "人工精选 + 视觉依赖验证"
evalMethod: "多选准确率"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "~75%"
    date: "2025-11"
tags: ["多模态", "视觉", "高质量"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
1500 道精心筛选的视觉依赖多模态题——每题都验证了"必须看图才能答对"，排除纯文字捷径。

## 构建方式与示例
从多个基准中精选 + 视觉依赖验证。排除了"不看图也能答对"的题目。

## 关联基准与展望
关联：[MMMU](/benchmarks/mmmu)、[MM-Vet](/benchmarks/mmvet)。
