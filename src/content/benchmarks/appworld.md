---
title: "AppWorld：模拟 App 生态系统 Agent"
description: "在 457 个模拟 App（邮件/日历/音乐等）中评估 Agent 完成复杂跨应用任务的能力"
date: 2024-07-01
benchName: "AppWorld"
org: "多校联合"
paper: "arXiv:2407.18901"
category: "Agent"
subcategory: "Coding Agent"
abilities: ["跨应用", "App操作", "多步规划", "API编排"]
dataSize: "750 tasks / 457 apps / 9 categories"
evalMethod: "标准评测"
metric: "Task Success Rate (%)"
topResults:
  - model: "GPT-5 + ReAct"
    score: "38.6%"
  - model: "GPT-4o + ReAct"
    score: "18.2%"
tags: ["Agent", "App", "跨应用", "模拟环境"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
AppWorld 模拟 9 个日常 App（邮件/日历/地图/音乐等）的交互环境，评估 Agent 完成日常数字生活任务的能力。

## 构建方式与示例
750+ 个任务，在模拟 App 环境中执行。例如："检查日历中明天的会议，给所有参与者发邮件提醒。"

## 关联基准与展望
关联：[AgentBench](/benchmarks/agentbench)、[GAIA](/benchmarks/gaia)。不足：模拟 App 与真实 App 有差距。
