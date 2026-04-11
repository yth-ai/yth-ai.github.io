---
title: "PinchBench：OpenClaw 编码模型选型基准"
description: "专为 OpenClaw Agent 设计的 LLM 基准测试平台，对 50+ 模型进行 600+ 次标准化测试，从成功率/速度/成本/价值四维评估"
date: 2026-02-28T00:00
benchName: "PinchBench"
org: "Kilo AI"
code: "github.com/pinchbench/skill"
website: "https://pinchbench.com"
category: "Agent"
subcategory: "Coding Agent"
abilities: ["编码Agent", "任务规划", "代码生成", "邮件处理", "会议调度"]
dataSize: "600+ standardized tests / 50+ models"
construction: "真实任务（非合成）"
evalMethod: "成功率 + 速度 + 成本 + 价值综合"
metric: "Success Rate (%)"
topResults:
  - model: "Claude Opus 4"
    score: "#1 综合"
    date: "2026-03"
  - model: "Gemini 2.5 Pro"
    score: "#2 综合"
    date: "2026-03"
tags: ["Agent", "OpenClaw", "编码", "模型选型", "2026"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
OpenClaw 的四维选型基准——成功率/速度/成本/价值。直接面向开发者的"用哪个模型最划算"问题。

## 构建方式与示例
600+ 标准化测试，50+ 模型。真实任务：调度会议、写代码、处理邮件。

## 关联基准与展望
关联：[Claw-Eval](/benchmarks/claweval)、[SWE-bench](/benchmarks/swe-bench)。不足：绑定 OpenClaw 框架。
