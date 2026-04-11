---
title: "CORE-Bench：计算可复现性评测"
description: "270 个论文复现任务，三级难度，评估 Agent 对计算型论文的复现能力"
date: 2024-09-01T00:00
benchName: "CORE-Bench"
org: "Anthropic & Princeton"
paper: "arXiv:2409.11363"
code: "github.com/siegelz/core-bench"
category: "Agent"
subcategory: "Science Agent"
abilities: ["论文复现", "环境配置", "代码调试", "结果验证"]
dataSize: "270 tasks (3 levels)"
construction: "从 Nature/Science 等顶刊收集"
evalMethod: "输出匹配 + 数值误差容忍"
metric: "Accuracy (%)"
topResults:
  - model: "AutoGPT + GPT-4o"
    score: "21% (Hard)"
    date: "2024-09"
tags: ["复现", "科研", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
270 个论文复现任务，三级难度——从 Nature/Science 等顶刊收集，评估 Agent 的计算可复现性。

## 构建方式与示例
给论文代码仓库，Agent 需配好环境、运行代码、得到与论文一致的结果。Hard 级别只有 21%。

## 关联基准与展望
关联：[PaperBench](/benchmarks/paperbench)、[ScienceAgentBench](/benchmarks/scienceagentbench)。不足：依赖环境稳定性。
