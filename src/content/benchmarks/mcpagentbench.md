---
title: "MCPAgentBench：MCP 工具使用评测"
description: "评估 LLM Agent 通过 MCP 协议使用外部工具完成真实任务的能力"
date: 2026-01-01
benchName: "MCPAgentBench"
org: "多个研究团队"
paper: "arXiv:2512.24565"
category: "Agent"
subcategory: "Tool Use Agent"
abilities: ["MCP", "工具使用", "协议", "Agent", "API编排"]
dataSize: "多种任务类型"
evalMethod: "标准评测"
metric: "Task Success Rate (%)"
topResults:
  - model: "GPT-5"
    score: "65.4%"
  - model: "Claude Opus 4"
    score: "61.2%"
tags: ["MCP", "Agent", "工具使用"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
MCPAgentBench 基于真实 MCP 定义评估 Agent 的工具使用能力。与 MCP-Atlas 和 MCP-Bench 形成 MCP 生态的三角评测。

## 构建方式
1. 基于真实世界 MCP 工具定义构建数据集
2. 涵盖文件操作、数据库查询、API 调用等场景

## 任务示例
**示例**："使用 MCP 工具读取数据库中的用户数据，根据条件筛选后写入新表"

## 关联基准
- [MCP-Atlas](/benchmarks/mcp-atlas)、[MCP-Bench](/benchmarks/mcp-bench)、[BFCL](/benchmarks/bfcl)

## 不足与展望
- MCP 生态快速变化，benchmark 需要持续跟进
