---
title: "BrowseComp：网页浏览检索能力"
description: "1,266 道需要深度网络检索才能回答的极难问题，OpenAI Deep Research 仅 51.5%"
date: 2025-04-10
benchName: "BrowseComp"
org: "OpenAI"
paper: "arXiv:2504.12516"
category: "Agent"
subcategory: "Search/Research Agent"
abilities: ["网页浏览", "信息检索", "深度搜索", "多步检索"]
dataSize: "1,266 questions / 9 domains"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "OpenAI Deep Research"
    score: "51.5%"
  - model: "Perplexity"
    score: "28.4%"
  - model: "GPT-4o"
    score: "1.4%"
tags: ["网页浏览", "搜索", "Agent", "检索"]
status: "active"
importance: 5
saturation: "未饱和"
---
## 为什么重要

BrowseComp 是 OpenAI 发布的搜索 Agent 评测——1266 个需要"持久搜索"才能找到答案的难题。核心发现：OpenAI Deep Research 51.5% vs 其他方案 <5%，证明端到端 RL 训练的搜索 Agent 远超 prompt engineering。

## 构建方式

1. OpenAI 研究员设计了 1266 个需要深入搜索才能回答的问题
2. 每个问题都经过验证：答案确实存在于互联网上，但不是简单搜索就能找到
3. 需要多步推理、多源验证、持久搜索策略

## 任务示例

**示例 1**（冷门事实）：
> "哪位诺贝尔物理学奖得主曾在 1970 年代发表过关于烹饪的论文？"
> 需要搜索诺贝尔物理获奖者列表 → 逐个检索其发表论文 → 找到跨领域论文

**示例 2**（深度检索）：
> "2015 年在某个特定学术会议上获得最佳论文奖的作者，后来转去了哪家公司？"
> 需要找到会议记录 → 找到获奖者 → 追踪其后续职业变动

## 关键发现

- OpenAI Deep Research 51.5% vs GPT-4o + 搜索 <5%——差距极大
- 说明"给 LLM 加搜索工具"远不够，需要**端到端的搜索策略训练**
- 与 SimpleQA（单步事实）、FRAMES（多跳推理）形成互补的搜索能力评测链
