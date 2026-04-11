---
title: "FeatureBench"
description: "评估 AI 编码智能体在端到端、功能导向的复杂软件开发中的表现，ICLR 2026"
date: 2026-01-26T12:00
benchName: "FeatureBench"
version: ""
org: "多机构合作"
paper: ""
code: ""
venue: "ICLR 2026"
website: ""
category: "代码生成"
abilities: ["功能级开发", "跨 PR 任务", "测试驱动评估", "依赖图追踪"]
dataSize: "200 个任务，24 个开源仓库，3825 个可执行环境"
construction: "测试驱动方法，沿依赖图追踪单元测试自动派生任务"
evalMethod: "可执行评估协议（单元测试验证）"
metric: "解决率 (Resolved Rate)"
topResults:
  - model: "Claude 4.5 Opus"
    score: "11.0%"
    date: "2026-01"
  - model: "Claude 4.5 Opus (SWE-bench)"
    score: "74.4%"
    date: "2026-01"
tags: ["功能开发", "Agent", "测试驱动", "ICLR 2026", "端到端"]
status: "active"
importance: 4
saturation: "未饱和"
---

FeatureBench 是 ICLR 2026 发表的编码 Agent 基准，专注于评估端到端、功能导向的复杂软件开发能力。与 SWE-bench 等关注 bug 修复的基准不同，FeatureBench 要求智能体完成跨越多个提交和 PR 的功能级编码任务。

基准从 24 个开源仓库中构建了 200 个挑战性任务和 3825 个可执行环境，采用测试驱动方法沿依赖图追踪单元测试来自动派生任务，最小化人工干预。结果极具冲击力：Claude 4.5 Opus 在 SWE-bench 上的解决率为 74.4%，但在 FeatureBench 上仅为 11.0%——暴露了当前编码智能体在从 bug 修复扩展到功能开发时的巨大能力差距。内置的自动化任务收集工具包支持基准随时间更新以对抗数据泄露。
