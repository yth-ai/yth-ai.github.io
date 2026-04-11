---
title: "Arena-Hard-Auto：自动化 Arena 近似"
description: "从 Arena 筛选 500 道难题，与人类排名相关性 89.1%"
date: 2024-04-01
benchName: "Arena-Hard-Auto"
org: "LMSYS"
paper: "arXiv:2406.11939"
category: "对齐与安全"
subcategory: "自动评分"
abilities: ["复杂指令", "推理"]
dataSize: "500 prompts"
evalMethod: "标准评测"
metric: "Win Rate (%)"
topResults:
  - model: "GPT-5"
    score: "92.3%"
  - model: "Claude Opus 4"
    score: "88.7%"
tags: ["对话质量", "自动评分"]
status: "active"
importance: 4
---
## 为什么重要
Arena-Hard 是 Chatbot Arena 的"自动化近似"——从真实 Arena 对话中筛选 500 道高区分度难题，用 LLM 自动评分。与真实 Arena 排名的相关性达 89.1%，远超 MT-Bench (22.6%)。

## 构建方式
1. 从 Chatbot Arena 的真实用户对话中筛选"高区分度"题目
2. 筛选标准：不同模型在该题目上的得票差距大
3. 500 道题，以 GPT-4-0314 为基线
4. 用 GPT-4 Turbo 作为 Judge 评分（pairwise comparison）

## 任务示例
从 Arena 真实对话中筛选的难题，例如：
**编码**："实现一个支持并发读写的 LRU 缓存，用 Go 语言"
**推理**："分析这个商业案例中三方利益冲突的最优解"
**创意**："写一首关于量子纠缠的十四行诗，每行必须包含一个科学术语"

## 关键发现
- 与真实 Arena Elo 相关性 89.1%——远超 MT-Bench 的 22.6%
- 运行成本低（$25/次 vs Arena 需要数千次人类投票）
- 关键限制：依赖 GPT-4 作为 Judge，可能偏好 GPT 风格的回答

## 关联基准
- [Chatbot Arena](/benchmarks/chatbot-arena)：Arena-Hard 试图近似的目标
- [WildBench](/benchmarks/wildbench)：类似定位，数据来源不同
- [AlpacaEval](/benchmarks/alpacaeval)：另一种自动化指令跟随评测
- [MT-Bench](/benchmarks/mt-bench)：Arena-Hard 的前辈

## 不足与展望
- 依赖 GPT-4 Judge 引入了偏见（偏好类似 GPT 风格的回复）
- 500 题可能不够稳定（个别题目可能被"做对"但非真正理解）
- 基线固定（GPT-4-0314），随着模型进步需要更新基线
