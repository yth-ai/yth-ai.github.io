---
title: "Video-MME：视频多模态评测"
description: "900 个视频理解问题，覆盖 30 秒到 1 小时不同时长，测试视频+字幕+音频的综合理解"
date: 2024-05-01
benchName: "Video-MME"
org: "多校联合"
paper: "arXiv:2405.21075"
category: "多模态"
subcategory: "视频理解"
abilities: ["视频理解", "时序推理", "长视频", "字幕理解", "多模态"]
dataSize: "900 questions / 256 videos"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "77.8%"
  - model: "GPT-5 Vision"
    score: "68.3%"
  - model: "GPT-4o"
    score: "59.9%"
tags: ["多模态", "视频", "时序推理"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
Video-MME 是首个全面的视频理解评测——覆盖从 10 秒到 1 小时的视频，评估模型在不同时长视频上的理解能力。

## 构建方式
1. 900 个视频 + 2700 个问答对
2. 视频时长从 10 秒到 60 分钟
3. 6 个领域：知识、电影、体育、生活、科技、艺术

## 任务示例
**短视频**："这段 10 秒视频中的人在做什么？"
**长视频**："这段 30 分钟的教程讲了哪些关键步骤？"

## 关联基准
- [MMMU](/benchmarks/mmmu)：静态图像理解
- [SEED-Bench](/benchmarks/seed-bench)：多模态综合

## 不足与展望
- 长视频理解的评测标准仍不成熟
- 音频信息未充分利用
