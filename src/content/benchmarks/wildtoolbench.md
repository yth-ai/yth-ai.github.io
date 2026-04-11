---
title: "WildToolBench：真实工具调用需求"
description: "17000+ 个从真实用户交互中收集的工具调用需求，比 BFCL 更贴近 in-the-wild 场景"
date: 2024-10-01T00:00
benchName: "WildToolBench"
org: "多校"
paper: "arXiv:2410.20138"
category: "Agent"
subcategory: "Tool Use Agent"
abilities: ["工具调用", "真实需求", "错误恢复", "多工具"]
dataSize: "17000+ queries"
construction: "真实用户交互收集"
evalMethod: "工具调用准确性 + 任务完成"
metric: "Pass Rate (%)"
topResults:
  - model: "GPT-4o"
    score: "~65%"
    date: "2024-10"
tags: ["工具使用", "真实需求", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
17000+ 个从真实用户交互中收集的工具调用需求，比 BFCL 的合成数据更难——因为真实用户表达模糊、需求复杂。

## 构建方式与示例
真实用户查询。例如："帮我查一下北京明天适不适合跑步"（模糊需求 → 需要调用天气+空气质量 API）

## 关联基准与展望
关联：[BFCL](/benchmarks/bfcl)、[ToolBench](/benchmarks/toolbench)。
