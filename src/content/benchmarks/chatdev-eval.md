---
title: "ChatDev Eval：多 Agent 软件开发"
description: "评估多个 Agent 角色协作完成软件开发任务（从需求到可运行代码）的能力"
date: 2023-07-01T00:00
benchName: "ChatDev Eval"
org: "Tsinghua & OpenBMB"
paper: "arXiv:2307.07924"
code: "github.com/OpenBMB/ChatDev"
category: "Agent"
subcategory: "Multi-Agent"
abilities: ["多角色协作", "软件开发", "代码审查", "测试"]
dataSize: "70 个软件需求"
construction: "人工设计需求描述"
evalMethod: "代码可执行性 + 人工评估"
metric: "Executability Rate (%)"
topResults:
  - model: "ChatDev (GPT-4)"
    score: "~86% 可执行率"
    date: "2023-07"
tags: ["Multi-Agent", "软件开发", "协作"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
评估多 Agent 角色协作（CEO/CTO/程序员/测试员）完成软件开发的能力。

## 构建方式与示例
70 个软件需求，多 Agent 角色分工完成。例如："开发一个贪吃蛇游戏"→ CEO 审需求 → CTO 定架构 → 程序员写代码 → 测试员验证。

## 关联基准与展望
关联：[AgentBench](/benchmarks/agentbench)、[DevBench](/benchmarks/devbench)。不足：没有统一的多 Agent 评测标准。
