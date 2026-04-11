---
title: "DeepResearch Bench：研究报告质量评测"
description: "100 个博士级研究任务，用 RACE+FACT 双框架评估 Deep Research Agent 输出的报告质量"
date: 2025-06-01T00:00
benchName: "DeepResearch Bench"
org: "中科大 & 多校"
paper: "arXiv:2506.11763"
category: "Agent"
subcategory: "Search/Research Agent"
abilities: ["研究报告生成", "信息广度", "引用准确性", "指令遵循"]
dataSize: "100 research tasks"
construction: "博士生设计"
evalMethod: "RACE+FACT 双评估框架"
metric: "综合评分"
topResults:
  - model: "Gemini DR"
    score: "信息广度第一 (111引用)"
    date: "2025-06"
  - model: "OpenAI DR"
    score: "指令遵循第一"
    date: "2025-06"
tags: ["Deep Research", "报告生成", "搜索Agent"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
首个专门评测 Deep Research Agent 输出报告质量的基准。关键发现：Gemini DR 信息广度碾压（有效引用 111 vs 第二名 41），OpenAI DR 指令遵循最强。

## 构建方式
1. 100 个博士级研究任务
2. RACE 框架评估：Relevance（相关性）、Accuracy（准确性）、Completeness（完整性）、Expression（表达）
3. FACT 框架验证引用准确性
4. 多维度综合评分

## 任务示例
**示例**："综述 2023-2024 年蛋白质结构预测领域的主要进展，重点比较 AlphaFold 3 和 ESMFold 2 的方法论差异"

## 关键发现
- Gemini DR 信息广度第一（111 有效引用 vs 第二名 41）
- OpenAI DR 指令遵循最强（更贴合用户要求的格式和内容）
- 两者各有所长——没有一个产品在所有维度都最好

## 关联基准
- [BrowseComp](/benchmarks/browsecomp)：搜索能力评测
- [DeepSearchQA](/benchmarks/deepsearchqa)：多步搜索问答
- [GAIA](/benchmarks/gaia)：通用 Agent 评测

## 不足与展望
- 100 个任务偏少
- 报告质量的评估仍部分依赖人工
- 未来需要区分"搜索信息的广度"和"分析信息的深度"
