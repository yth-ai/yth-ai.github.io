---
title: "AlpacaEval 2.0：自动化指令跟随评测"
description: "805 个指令，Length-Controlled 与 Arena 相关性 0.98"
date: 2024-04-01
benchName: "AlpacaEval 2.0 (LC)"
org: "Stanford"
paper: "arXiv:2404.04475"
category: "对齐与安全"
subcategory: "自动评分"
abilities: ["指令跟随", "对话质量"]
dataSize: "805 instructions"
evalMethod: "标准评测"
metric: "LC Win Rate (%)"
topResults:
  - model: "GPT-5"
    score: "72.1%"
  - model: "Claude Opus 4"
    score: "68.5%"
tags: ["指令跟随", "自动评分"]
status: "active"
importance: 3
---
## 为什么重要
AlpacaEval 2.0 的核心创新是 Length-Controlled Win Rate——消除长回复偏见后与 Chatbot Arena 相关性达 0.98。

## 构建方式与示例
805 个指令，GPT-4 Turbo 自动评分。比较模型回复与基线模型，计算 LC Win Rate。

## 关键发现
LC 版本解决了"长回复=好回复"的 LLM Judge 偏见，排名更可信。

## 关联基准与展望
关联：[Arena-Hard](/benchmarks/arena-hard)、[Chatbot Arena](/benchmarks/chatbot-arena)。不足：仍依赖 LLM Judge，对非英语表现不佳。
