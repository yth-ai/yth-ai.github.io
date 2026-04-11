---
title: "WebApp1K：Web 应用代码生成"
description: "测试 LLM 生成完整前端 Web 应用的能力，覆盖 1,000 个真实 Web 开发任务"
date: 2024-08-01
benchName: "WebApp1K"
org: "多校联合"
paper: "arXiv:2408.00019"
category: "代码生成"
subcategory: "全栈应用"
abilities: ["Web开发", "前端", "HTML/CSS/JS", "React", "全栈"]
dataSize: "1,000 tasks"
evalMethod: "标准评测"
metric: "Pass Rate (%)"
topResults:
  - model: "Claude Opus 4"
    score: "62.8%"
  - model: "GPT-5"
    score: "58.4%"
tags: ["Web开发", "前端", "代码生成"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
1000 个 Web 应用生成任务——评测模型从需求描述到可运行网页的全栈能力。

## 构建方式与示例
例如："生成一个带有搜索功能的图书管理系统网页"→ 模型输出 HTML/CSS/JS → 测试可用性。

## 关联基准与展望
关联：[WebDev Arena](/benchmarks/webdev-arena)、[BigCodeBench](/benchmarks/bigcodebench)。
