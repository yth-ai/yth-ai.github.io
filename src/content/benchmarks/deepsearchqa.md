---
title: "DeepSearchQA：多步信息检索问答"
description: "2972 个需要多步搜索、子问题分解和多源整合的复杂事实问答"
date: 2025-06-01T00:00
benchName: "DeepSearchQA"
org: "Google DeepMind"
paper: "DeepSearchQA benchmark paper"
category: "Agent"
subcategory: "Search/Research Agent"
abilities: ["多步搜索", "子问题分解", "多源综合", "事实验证"]
dataSize: "2972 questions"
construction: "自动生成 + 专家验证"
evalMethod: "精确答案匹配 + 引用准确性"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini Deep Research"
    score: "~65%"
    date: "2025-06"
tags: ["搜索", "多跳推理", "Deep Research"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
Google DeepMind 发布的搜索 Agent 评测。与 BrowseComp 互补：BrowseComp 侧重"找到冷门信息的持久搜索"，DeepSearchQA 侧重"多步推理链条的正确性"。

## 构建方式
1. 2972 个需要多步搜索才能回答的问题
2. 每个问题需要分解为多个子问题
3. 自动生成 + 专家验证

## 任务示例
**示例**："A 公司在 2023 年收购了 B 公司，B 公司的 CEO 在收购前就职于哪家公司？"（需要：搜索收购信息 → 找到 B 的 CEO → 搜索其履历）

## 关键发现
- Gemini Deep Research 约 65%
- 多步搜索中，每增加一步推理，准确率下降约 10%
- 子问题分解的质量直接决定最终准确率

## 关联基准
- [BrowseComp](/benchmarks/browsecomp)：持久搜索
- [FRAMES](/benchmarks/frames)：多跳事实推理
- [GAIA](/benchmarks/gaia)：通用多步任务

## 不足与展望
- 主要测事实类问题，不测开放性研究
- 依赖网络搜索——离线场景无法评测
