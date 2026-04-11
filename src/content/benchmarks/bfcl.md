---
title: "BFCL：函数调用能力排行榜"
description: "评估 LLM 调用函数/API 的能力，工具使用评测标准"
date: 2024-02-01
benchName: "BFCL"
org: "UC Berkeley"
paper: "arXiv:2402.15671"
category: "Agent"
subcategory: "Tool Use Agent"
abilities: ["函数调用", "API使用"]
dataSize: "2,000+ QA pairs"
evalMethod: "标准评测"
metric: "Overall Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "93.4%"
  - model: "Claude Opus 4"
    score: "91.2%"
tags: ["工具使用", "函数调用", "Agent"]
status: "active"
importance: 4
saturation: "接近饱和"
---
## 为什么重要
BFCL（Berkeley Function Calling Leaderboard）是评估模型"工具使用"能力的核心基准。在 Agent 时代，模型需要准确理解 API 文档、提取参数、处理多函数编排。BFCL 是各家模型发布时必报的 Agent 能力指标。

## 构建方式
1. 收集真实 API 文档（Python/Java/JavaScript/REST）
2. 设计函数调用场景：简单调用、多函数串联、嵌套调用、并行调用
3. 评测方式：AST 结构匹配（参数名和值是否正确）+ 真实执行验证
4. v3 新增多轮对话中的函数调用和状态管理

## 任务示例
**简单调用**："查询北京明天的天气" → `get_weather(city="北京", date="tomorrow")`
**多函数串联**："帮我买一张从北京到上海的最便宜机票" → `search_flights(...)` → `sort_by_price(...)` → `book_flight(...)`
**错误恢复**：API 返回 rate limit error → 模型需要等待重试或切换备用 API

## 关键发现
- GPT-5 达 93.4%，说明函数调用是最接近"解决"的 Agent 能力之一
- 简单调用已接近饱和，复杂编排（v3 的多轮对话）仍有差距
- 小模型经过专门微调后可以接近大模型（如 Gorilla 系列）

## 关联基准
- [ToolBench](/benchmarks/toolbench)：更大规模的 API 集合（16000+ 工具）
- [MCP-Atlas](/benchmarks/mcp-atlas)：MCP 协议下的工具使用
- [TAU-bench](/benchmarks/tau-bench)：真实客服场景的工具使用
- [MCPAgentBench](/benchmarks/mcpagentbench)：MCP 工具使用评测

## 不足与展望
- 主要测"调用是否正确"，较少测"该不该调用"（何时应该拒绝工具使用）
- API 文档是给定的，没有测模型自主发现和理解新工具的能力
- 真实世界的 API 调用还涉及认证、限流、版本兼容——这些没覆盖
