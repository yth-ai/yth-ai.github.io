---
title: "BigLaw Bench：复杂法律推理"
description: "来自顶级律所的复杂法律推理任务，包括合同分析、判例法推理、合规审查等"
date: 2025-05-01T00:00
benchName: "BigLaw Bench"
org: "Anthropic & Scale AI"
category: "领域专业"
subcategory: "法律"
abilities: ["合同分析", "判例推理", "法律文书", "合规审查"]
dataSize: "数百道题"
construction: "律师设计"
evalMethod: "专家评分"
metric: "Score (%)"
topResults:
  - model: "Claude Opus 4"
    score: "~82%"
    date: "2025-12"
  - model: "GPT-5"
    score: "~78%"
    date: "2026-01"
tags: ["法律", "合同", "推理"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
来自顶级律所的复杂法律推理任务，Claude 4 报告的核心评测之一。不是法律知识选择题，而是真实合同分析和判例推理。

## 构建方式与示例
律师设计的真实场景。例如："分析这份股权投资协议中的反稀释条款，判断在 C 轮融资场景下投资人的保护权是否触发。"

## 关联基准与展望
关联：[LegalBench](/benchmarks/legalbench)、[GPQA](/benchmarks/gpqa)。不足：英美法系为主，大陆法系覆盖不足。
