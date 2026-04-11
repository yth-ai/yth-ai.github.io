---
title: "Fiction.liveBench：长篇小说理解"
description: "要求模型回答关于 Fiction.live 上长篇连载故事的问题，考察对事件、角色和时间顺序的记忆"
date: 2025-06-01T00:00
benchName: "Fiction.liveBench"
org: "LM Council"
category: "长文本"
subcategory: "推理"
abilities: ["长篇小说理解", "角色追踪", "情节推理", "时间顺序"]
dataSize: "动态（连载小说）"
construction: "从连载小说自动生成"
evalMethod: "精确匹配"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "~72%"
    date: "2025-11"
tags: ["长文本", "小说", "角色追踪"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
用不断更新的网络小说测试长文本理解——内容持续连载，不存在数据污染。需要追踪角色关系和事件因果。

## 构建方式与示例
从 Fiction.live 收集连载小说 + 自动生成问题。例如："在第 15 章和第 23 章之间，角色 A 对角色 B 的态度发生了什么变化？"

## 关联基准与展望
关联：[LongBench](/benchmarks/longbench)、[InfiniteBench](/benchmarks/infinitebench)。不足：小说质量参差不齐。
