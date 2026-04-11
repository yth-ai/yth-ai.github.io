---
title: "TextVQA：包含文字的图像问答"
description: "需要阅读图像中文字信息才能回答的视觉问答，评测 OCR + VQA 联合能力"
date: 2019-08-01T00:00
benchName: "TextVQA"
org: "Facebook AI"
paper: "arXiv:1811.11903"
venue: "CVPR 2019"
category: "多模态"
subcategory: "文档理解"
abilities: ["文字图像", "OCR+VQA", "场景文字"]
dataSize: "45336 questions / 28408 images"
construction: "OpenImages + 众包"
evalMethod: "VQA Accuracy"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-4o"
    score: "~78%"
    date: "2024-05"
  - model: "Gemini 2.5 Pro"
    score: "~82%"
    date: "2025-11"
tags: ["文字图像", "OCR", "VQA"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
评测"需要读图中文字才能回答问题"的能力——读路牌、产品标签、菜单等。多模态 OCR 能力经典评测。

## 构建方式与示例
45336 个问答对。例如：[店铺招牌照片] "这家店叫什么名字？"

## 关联基准与展望
关联：[OCRBench](/benchmarks/ocrbench)、[DocVQA](/benchmarks/docvqa)。接近饱和。
