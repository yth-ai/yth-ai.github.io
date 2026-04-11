---
title: "RealWorldQA：真实世界视觉问答"
description: "来自真实照片的视觉理解问题，测试模型在日常场景中的视觉认知能力"
date: 2024-04-01
benchName: "RealWorldQA"
org: "xAI"
category: "多模态"
subcategory: "视觉理解"
abilities: ["真实世界", "视觉问答", "日常场景", "驾驶", "导航"]
dataSize: "765 questions"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "72.4%"
  - model: "GPT-5 Vision"
    score: "69.8%"
  - model: "GPT-4V"
    score: "61.4%"
tags: ["多模态", "真实世界", "视觉"]
status: "active"
importance: 2
saturation: "未饱和"
---
## 为什么重要
RealWorldQA 使用真实世界场景照片（非网络图片）评测多模态模型的实际视觉理解能力。

## 构建方式与示例
真实场景拍摄的照片 + 问题。例如：[超市货架照片] "这个货架上最便宜的洗发水品牌是什么？"

## 关联基准与展望
关联：[MMMU](/benchmarks/mmmu)、[TextVQA](/benchmarks/textvqa)。
