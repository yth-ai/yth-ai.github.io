---
title: "BEAM"
description: "评估 LLM 长期记忆能力的基准，100 个对话 × 高达 10M tokens，揭示 1M 上下文窗口的不足"
date: 2026-04-02T12:00
benchName: "BEAM"
version: ""
org: "ICLR 2026"
paper: ""
code: ""
venue: "ICLR 2026"
website: ""
category: "长文本"
abilities: ["长期记忆", "事实追踪", "信息更新", "矛盾解决", "时序理解", "多跳推理", "偏好跟随"]
dataSize: "100 个对话，2000 个探测问题，高达 10M tokens"
construction: "结构化流程生成对话和探测问题"
evalMethod: "Nugget 评分法（原子化信息单元独立评估）"
metric: "Nugget 准确率 (1.0/0.5/0.0)"
topResults:
  - model: "GPT-4.1-nano (长上下文)"
    score: "基线，被 LIGHT 系统提升 40-50%"
    date: "2026-04"
  - model: "结构化记忆 LIGHT（1M tokens）"
    score: "相比长上下文提升约 75%"
    date: "2026-04"
tags: ["长期记忆", "长上下文", "状态追踪", "对话", "ICLR 2026"]
status: "active"
importance: 3
saturation: "未饱和"
---

BEAM（Benchmark for Evaluating Long-Term Memory in LLMs）来自 ICLR 2026 论文"Beyond a Million Tokens"，专门评估 LLM 在超长对话中的长期记忆能力。基准包含 100 个对话、2000 个探测问题，上下文长度高达 1000 万 tokens——远超当前大多数模型的处理范围。

BEAM 测试 10 种长期记忆能力：事实/实体追踪、信息更新、矛盾解决、时序理解、指令与偏好区分、跨轮多跳推理等。评估采用 Nugget 评分法，将答案分解为原子信息单元独立评估。关键发现：即使拥有 1M token 上下文窗口，标准 LLM 在更新信息、解决矛盾和长距离推理方面仍严重不足；结构化记忆系统（LIGHT）在各长度上均显著优于 RAG 和长上下文基线，在 1M tokens 时提升约 75%。
