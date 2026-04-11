---
title: "TAU-bench：真实工具辅助用户交互"
description: "评估 Agent 在客服场景（航空/零售）中使用工具的能力"
date: 2024-07-01
benchName: "TAU-bench"
org: "Sierra AI"
paper: "arXiv:2407.10928"
category: "Agent"
subcategory: "Tool Use Agent"
abilities: ["客服对话", "工具使用", "策略遵循"]
dataSize: "390 + 557 tasks"
evalMethod: "标准评测"
metric: "Pass Rate (%)"
topResults:
  - model: "GPT-5"
    score: "68.2%"
  - model: "Claude Opus 4"
    score: "62.7%"
tags: ["Agent", "客服", "真实场景"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
最贴近企业级 Agent 部署——模拟航空公司和零售客服场景，Agent 需要遵循公司政策、查数据库、完成操作。

## 构建方式与示例
航空 390 + 零售 557 tasks。例如："客户要求退改签，检查退款政策 → 查订单 → 计算退款金额 → 执行退款"

## 关联基准与展望
关联：[BFCL](/benchmarks/bfcl)、[AgentBench](/benchmarks/agentbench)。不足：只有两个行业场景。
