---
title: "Terminal-Bench：终端操作评测"
description: "评估 Agent 在真实终端环境中执行复杂系统管理和开发任务的能力"
date: 2025-02-01
benchName: "Terminal-Bench"
org: "多个研究团队"
category: "Agent"
subcategory: "Tool Use Agent"
abilities: ["终端操作", "Shell", "系统管理", "DevOps", "文件处理"]
dataSize: "200+ tasks"
evalMethod: "标准评测"
metric: "Success Rate (%)"
topResults:
  - model: "Claude Opus 4"
    score: "45.2%"
  - model: "GPT-5"
    score: "41.8%"
tags: ["Agent", "终端", "Shell", "系统管理"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
OpenAI 官方发布的 MCP 工具使用评测，与 Anthropic 的 MCP-Atlas 形成双标准。

## 构建方式与示例
MCP 工具调用场景，评测理解工具文档 + 正确调用的能力。

## 关联基准与展望
关联：[MCP-Atlas](/benchmarks/mcp-atlas)、[MCP-Bench](/benchmarks/mcp-bench)、[BFCL](/benchmarks/bfcl)。
