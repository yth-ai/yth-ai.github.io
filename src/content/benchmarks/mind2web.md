---
title: "Mind2Web：跨网站指令跟随"
description: "2350 个跨 137 个真实网站的操作任务，评估 Web Agent 的跨域泛化能力"
date: 2023-06-01T00:00
benchName: "Mind2Web"
org: "OSU"
paper: "arXiv:2306.06070"
code: "github.com/OSU-NLP-Group/Mind2Web"
category: "Agent"
subcategory: "Web/Browser Agent"
abilities: ["跨域泛化", "网页操作", "DOM理解"]
dataSize: "2350 tasks / 137 websites"
construction: "众包标注"
evalMethod: "元素选择 + 操作准确率"
metric: "Element Accuracy (%)"
topResults:
  - model: "GPT-4"
    score: "41.6% (cross-website)"
    date: "2024-01"
tags: ["网页Agent", "跨域", "泛化"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
Mind2Web 的核心贡献是评测**跨网站泛化**——模型需要在从未见过的网站上完成操作。在 cross-website 设置下，即使 GPT-4 也只有 41.6% 的元素选择准确率。

## 构建方式
1. 覆盖 137 个真实网站，2350 个任务
2. 众包标注操作轨迹
3. 三种泛化设置：cross-task、cross-website、cross-domain

## 任务示例
**示例**："在一个之前没见过的电商网站上，搜索红色运动鞋，筛选价格 200 以内"

## 关键发现
- cross-website 设置是最大挑战：换个没见过的网站，准确率暴降
- 说明当前模型更多在"记忆"网站结构而非"理解"界面

## 关联基准
- [WebArena](/benchmarks/webarena)：固定网站深度评测
- [VisualWebArena](/benchmarks/visualwebarena)：视觉导向
- [WorkArena](/benchmarks/workarena)：企业级

## 不足与展望
- DOM 标注在现代 SPA 应用上可能不准确
- 没有测动态页面和 JavaScript 交互
