---
title: "ABC-Bench"
description: "评估 AI 智能体在真实后端开发全生命周期中的表现，覆盖环境配置到容器化服务部署"
date: 2026-01-16T12:00
benchName: "ABC-Bench"
version: ""
org: "复旦大学"
paper: "2601.11077"
code: ""
venue: ""
website: ""
category: "代码生成"
abilities: ["后端开发", "环境配置", "容器化服务", "API 测试", "代码库探索"]
dataSize: "224 个任务，8 种语言，19 个框架"
construction: "从开源仓库精选"
evalMethod: "自动化端到端 API 测试管道"
metric: "端到端 API 测试通过率"
topResults:
  - model: "最先进模型"
    score: "表现不佳（具体分数见论文）"
    date: "2026-01"
tags: ["后端开发", "Agent", "容器化", "API测试", "全栈"]
status: "active"
importance: 3
saturation: "未饱和"
---

ABC-Bench（Agentic Backend Coding Benchmark）填补了编码基准在后端开发领域的空白。现有基准主要在静态上下文中评估代码逻辑，忽略了实际工程中需要严格环境配置和服务部署的全流程需求。ABC-Bench 要求 AI 智能体完成从代码库探索到实例化容器化服务，再到通过外部端到端 API 测试的完整后端开发生命周期。

基准包含 224 个真实任务，跨越 8 种编程语言和 19 个框架，均从开源仓库精选。采用可扩展的自动化评估管道，核心标准是智能体能否成功配置环境并使服务运行正确。评估结果显示，即使最先进的模型在这些整体性任务上也难以提供可靠性能，凸显了当前模型能力与实际后端工程需求之间的巨大差距。
