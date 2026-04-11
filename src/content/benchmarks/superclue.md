---
title: "SuperCLUE：中文综合能力评测"
description: "中文通用大模型综合性测评，包括开放问题、客观题和 Agent 能力三大板块"
date: 2024-01-01
benchName: "SuperCLUE"
org: "CLUE组委会"
paper: "arXiv:2307.15020"
category: "综合"
subcategory: "中文"
abilities: ["中文", "综合评测", "开放问题", "Agent", "安全"]
dataSize: "多任务 / 多维度"
evalMethod: "标准评测"
metric: "Score (%)"
topResults:
  - model: "GPT-5"
    score: "88.6"
  - model: "Qwen2.5-72B"
    score: "85.3"
  - model: "DeepSeek V3"
    score: "83.1"
tags: ["中文", "综合", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
SuperCLUE 是多维度中文 LLM 评测，覆盖 70+ 能力点。与 C-Eval 互补（C-Eval 偏知识，SuperCLUE 偏能力）。

## 构建方式与示例
70+ 能力点评测：安全、推理、对话、写作、工具使用等。

## 关联基准与展望
关联：[C-Eval](/benchmarks/ceval)、[CMMLU](/benchmarks/cmmlu)。
