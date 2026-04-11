---
title: "MCP-Bench：MCP 工具使用综合评测"
description: "Accenture 发布的 MCP 工具使用评测，涵盖跨工具协作、精确参数控制、规划与推理的多步真实任务"
date: 2025-08-28T00:00
benchName: "MCP-Bench"
org: "Accenture"
paper: "arXiv:2508.20453"
code: "github.com/Accenture/mcp-bench"
category: "Agent"
subcategory: "Tool Use Agent"
abilities: ["MCP协议", "跨工具协作", "参数控制", "多步规划"]
dataSize: "多类别真实任务"
construction: "真实 MCP 服务器交互"
evalMethod: "任务完成 + 步骤正确性"
metric: "Score (%)"
topResults:
  - model: "Claude Opus 4"
    score: "~85%"
    date: "2025-09"
  - model: "GPT-4o"
    score: "~72%"
    date: "2025-09"
tags: ["MCP", "工具使用", "Agent", "跨工具"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
MCP-Bench 是 Accenture 发布的 MCP 工具使用评测，与 Anthropic 的 MCP-Atlas 互补：MCP-Atlas 侧重单工具调用，MCP-Bench 侧重跨工具协作和复杂多步任务。

## 构建方式
1. 设计多类别真实 MCP 服务器交互任务
2. 重点测跨工具协作（一个任务需要调用多个 MCP 服务器）
3. 评测精确参数控制和多步规划

## 任务示例
**跨工具**："用 GitHub MCP 读取 Issue 列表，用 Slack MCP 发送通知，用 Calendar MCP 创建会议"

## 关键发现
- Claude Opus 4 约 85%，GPT-4o 约 72%
- 跨工具协作比单工具调用难 20%+

## 关联基准
- [MCP-Atlas](/benchmarks/mcp-atlas)：Anthropic 的 MCP 评测
- [BFCL](/benchmarks/bfcl)：通用函数调用
- [ToolBench](/benchmarks/toolbench)：REST API 工具使用

## 不足与展望
- MCP 标准仍在演进，评测可能需要频繁更新
