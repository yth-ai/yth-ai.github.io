---
title: "EvoClaw"
description: "评估 AI 智能体在连续软件进化中的表现，揭示从孤立任务到持续维护的性能悬崖"
date: 2026-03-17T12:00
benchName: "EvoClaw"
version: ""
org: "USC/UCR/UCSD 等多校合作"
paper: "2603.13428"
code: "https://github.com/EvoClaw-Bench/EvoClaw"
venue: ""
website: ""
category: "代码生成"
abilities: ["连续软件进化", "长期维护", "错误累积控制", "技术债务处理", "里程碑级任务"]
dataSize: "98 个人工验证里程碑"
construction: "DeepCommit 代理从提交日志重建里程碑 DAG"
evalMethod: "4 个代理框架 × 12 个前沿模型，孤立 vs 连续两种设置"
metric: "系统完整性/错误累积/任务成功率"
topResults:
  - model: "最佳模型（孤立设置）"
    score: ">80%"
    date: "2026-03"
  - model: "最佳模型（连续设置）"
    score: "38%"
    date: "2026-03"
tags: ["软件进化", "Agent", "连续任务", "技术债务", "长期维护"]
status: "active"
importance: 4
saturation: "未饱和"
---

EvoClaw 是一个全新范式的编码 Agent 基准：评估 AI 在连续软件进化（而非一次性编码任务）中的表现。通过 DeepCommit 代理从真实提交日志中重建可验证的"里程碑 DAG"，EvoClaw 构建了 98 个人工验证的里程碑级任务，要求智能体处理时间依赖性和技术债务。

关键发现令人警醒：12 个前沿模型在孤立任务中表现优异（>80%），但在连续设置下性能急剧下降至最高仅 38%——超过 50% 的跌幅。这说明当前 AI 在长期维护中维持系统完整性和限制错误累积方面存在深层能力缺陷。EvoClaw 填补了编码评测从"单次修补"到"持续演进"的重要空白，对理解 AI 智能体在实际工程中的可靠性具有重大意义。
