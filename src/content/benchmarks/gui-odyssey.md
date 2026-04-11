---
title: "GUI-Odyssey：跨 App 长序列 GUI 操作"
description: "跨应用的长序列 GUI 操作任务，评估 Agent 在复杂多步场景中的持续操作能力"
date: 2024-06-01T00:00
benchName: "GUI-Odyssey"
org: "Shanghai AI Lab"
paper: "arXiv:2406.08451"
category: "Agent"
subcategory: "GUI Agent"
abilities: ["跨App操作", "长序列", "状态跟踪"]
dataSize: "7735 episodes"
construction: "多App录制标注"
evalMethod: "任务完成率"
metric: "Success Rate (%)"
topResults:
  - model: "GPT-4V"
    score: "~15%"
    date: "2024-06"
tags: ["GUI", "跨应用", "长序列", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
评估跨 App 长序列 GUI 操作——Agent 需要在多个应用间切换完成复杂任务。最强模型仅 ~15%。

## 构建方式与示例
7735 episodes。例如："从微信复制一个地址 → 打开地图导航 → 分享导航链接回微信"

## 关联基准与展望
关联：[ScreenSpot](/benchmarks/screenspot)、[AndroidWorld](/benchmarks/androidworld)。不足：数据采集成本极高。
