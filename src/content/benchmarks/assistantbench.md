---
title: "AssistantBench：Web 助手评测"
description: "214 个需要在真实网站上执行的助手任务，评估模型作为日常 Web 助手的实用性"
date: 2024-07-01
benchName: "AssistantBench"
org: "Hebrew Univ & Google"
paper: "arXiv:2407.15711"
category: "Agent"
subcategory: "Search/Research Agent"
abilities: ["Web助手", "信息检索", "任务执行", "实用性"]
dataSize: "214 tasks"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5 + Tools"
    score: "35.2%"
  - model: "Claude Opus 4"
    score: "28.6%"
tags: ["Agent", "Web助手", "实用"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
AssistantBench 评估 Web Agent 作为通用助手在开放网络上回答问题的能力——需要自主浏览网页、收集信息、综合回答。

## 构建方式与示例
214 个需要网络浏览的开放问题。例如："找到纽约市评分最高的 5 家意大利餐厅及其地址和价格范围。"

## 关联基准与展望
关联：[GAIA](/benchmarks/gaia)、[BrowseComp](/benchmarks/browsecomp)。不足：开放网络环境不可控。
