---
title: "Mobile-Bench：多维度移动端评测"
description: "覆盖单 App / 多 App / 系统操作三个维度的移动端 Agent 评测"
date: 2024-07-01T00:00
benchName: "Mobile-Bench"
org: "Tsinghua"
paper: "arXiv:2407.00993"
category: "Agent"
subcategory: "Mobile Agent"
abilities: ["单App操作", "跨App", "系统设置", "手势"]
dataSize: "832 tasks"
construction: "专家设计"
evalMethod: "多粒度评分"
metric: "Checkpoint Score (%)"
topResults:
  - model: "GPT-4V"
    score: "~30%"
    date: "2024-07"
tags: ["移动端", "Android", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
覆盖单 App/多 App/系统操作三个维度的移动端评测。难度随维度增加陡增。

## 构建方式与示例
832 个任务。例如单 App："在设置中开启深色模式"；跨 App："从邮件复制地址 → 打开地图导航"。

## 关联基准与展望
关联：[AndroidWorld](/benchmarks/androidworld)、[ScreenSpot](/benchmarks/screenspot)。不足：Android only。
