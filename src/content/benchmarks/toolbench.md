---
title: "ToolBench：大规模工具使用"
description: "评估 LLM 使用 16,000+ 真实 REST API 解决复杂任务的能力"
date: 2023-07-01
benchName: "ToolBench"
org: "THU & Tencent"
paper: "arXiv:2307.16789"
category: "Agent"
subcategory: "Tool Use Agent"
abilities: ["API调用", "工具使用", "多步规划", "REST API"]
dataSize: "16,464 APIs / 126,486 instances"
evalMethod: "标准评测"
metric: "Pass Rate (%)"
topResults:
  - model: "GPT-5"
    score: "74.2%"
  - model: "Claude Opus 4"
    score: "68.7%"
  - model: "ToolLlama 7B"
    score: "48.6%"
tags: ["工具使用", "API", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
ToolBench 包含 16464 个真实 REST API 工具，是 BFCL 的大规模补充。测试模型在海量工具中选择和使用正确工具的能力。

## 构建方式与示例
16464 个工具 + 多工具串联任务。例如："先用天气 API 查明天天气，再用地图 API 查附近的咖啡馆。"

## 关联基准与展望
关联：[BFCL](/benchmarks/bfcl)、[MCP-Bench](/benchmarks/mcp-bench)。不足：部分 API 已失效。
