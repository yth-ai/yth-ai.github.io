---
title: "GPQA：博士级科学问答"
description: "448 道由领域博士专家编写的高难度科学多选题，非专家准确率仅 34%，是衡量模型深度科学推理的标杆"
date: 2024-02-20
benchName: "GPQA"
version: "Diamond (198题子集)"
org: "NYU & Cohere"
paper: "arXiv:2311.12022"
code: "github.com/idavidrein/gpqa"
venue: "ICML 2024"
category: "推理"
subcategory: "科学推理"
abilities: ["科学推理", "物理", "化学", "生物", "领域专业知识"]
dataSize: "448 questions (Diamond: 198)"
construction: "领域博士专家编写"
evalMethod: "多选准确率"
metric: "Accuracy (%)"
topResults:
  - model: "OpenAI o3"
    score: "87.7%"
    date: "2025-12"
  - model: "Gemini 2.5 Pro"
    score: "84.0%"
    date: "2025-11"
  - model: "Claude Opus 4"
    score: "82.1%"
    date: "2025-12"
  - model: "GPT-4o"
    score: "53.6%"
    date: "2024-05"
tags: ["科学", "博士级", "推理", "物理", "化学"]
status: "active"
importance: 5
saturation: "接近饱和"
---
## 为什么重要

GPQA（Graduate-Level Google-Proof Questions and Answers）是目前最难的科学推理基准之一。题目由各领域博士编写，非专业人士即使可以上网搜索也只能答对 34%。这意味着题目真正考察的是深度领域知识和推理，不是检索能力。

## 构建方式

1. 由 PhD 级别的领域专家（物理、化学、生物）编写多选题
2. 每道题同时由同领域专家和非同领域专家（但有科学背景）尝试回答
3. 只保留"同领域专家能答对、非专家即使上网搜也答不对"的题目
4. **Diamond 子集**（198 题）：经过最严格的多轮验证

## 任务示例

**示例 1**（物理）：
> "考虑一个质量为 m 的粒子在一维谐振子势中运动，如果在 t=0 时刻测量位置并得到 x₀，那么在时间 t 后再次测量位置，得到 x₀ 的概率振幅是什么？"
> 需要量子力学传播子的知识和计算能力

**示例 2**（化学）：
> "在以下反应机理中，哪个步骤是速控步骤？给出四种可能的机理路径。"
> 需要有机化学反应动力学的深层理解

## 关键发现

- 推理模型在 GPQA 上提升最大：o3 (87.7%) vs GPT-4o (53.6%)——差距 34 个百分点
- Diamond 子集是最常用的评测子集（198 题），被 HF Open LLM Leaderboard v2 采用
- 专家 vs 非专家差距（81% vs 34%）说明这些题目确实需要深度领域知识
