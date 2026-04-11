---
title: "WebVoyager：端到端真实网页浏览"
description: "643 个基于真实网站的端到端浏览任务，Agent 在真实浏览器中操作"
date: 2024-01-01T00:00
benchName: "WebVoyager"
org: "Zhejiang U & Tencent"
paper: "arXiv:2401.13919"
code: "github.com/MinorJerry/WebVoyager"
category: "Agent"
subcategory: "Web/Browser Agent"
abilities: ["网页浏览", "端到端操作", "多步导航"]
dataSize: "643 tasks / 15 websites"
construction: "真实网站 + 人工设计"
evalMethod: "任务完成 + GPT-4V 自动评判"
metric: "Task Success (%)"
topResults:
  - model: "GPT-4V"
    score: "55.7%"
    date: "2024-01"
tags: ["网页浏览", "端到端", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
让 Agent 在真实浏览器中操作 15 个网站完成 643 个任务。GPT-4V 达 55.7%。

## 构建方式与示例
真实浏览器操作。例如："在 Booking.com 搜索下周末东京的酒店，筛选评分 8 分以上。"

## 关联基准与展望
关联：[WebArena](/benchmarks/webarena)、[VisualWebArena](/benchmarks/visualwebarena)。
