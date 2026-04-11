---
title: "AIDABench"
description: "端到端评估 AI 在复杂数据分析任务上表现的基准，覆盖问答、数据可视化和文件生成三大能力"
date: 2026-03-27T12:00
benchName: "AIDABench"
version: "v2"
org: "多机构合作（含 Dahua Lin 团队）"
paper: "2603.15636"
code: ""
venue: ""
website: ""
category: "数据"
abilities: ["数据分析", "问答", "数据可视化", "文件生成", "异构数据处理"]
dataSize: "600+ 任务"
construction: "人工构建，涵盖电子表格/数据库/财务报告/运营记录等异构数据类型"
evalMethod: "端到端自动评估"
metric: "Pass-at-1"
topResults:
  - model: "最佳模型"
    score: "59.43% Pass-at-1"
    date: "2026-03"
  - model: "Claude Sonnet 4.5"
    score: "评估中"
    date: "2026-03"
  - model: "Gemini 3 Pro Preview"
    score: "评估中"
    date: "2026-03"
tags: ["数据分析", "端到端", "可视化", "文件生成", "异构数据"]
status: "active"
importance: 3
saturation: "未饱和"
---

AIDABench 是一个全面评估 AI 在复杂数据分析任务上端到端表现的基准。与侧重单一能力或简化场景的现有评测不同，AIDABench 涵盖三个核心维度：问答、数据可视化和文件生成，任务涉及电子表格、数据库、财务报告、运营记录等异构数据类型，反映了跨行业、跨岗位的真实分析需求。

基准包含超过 600 个多样化任务，每个任务极具挑战性——即使人类专家在 AI 辅助下也需要 1-2 小时完成。评估了 11 个最先进的模型（含 Claude Sonnet 4.5、Gemini 3 Pro Preview 等），最佳模型仅达到 59.43% 的 Pass-at-1 分数，表明当前 AI 在复杂现实数据分析中仍有显著提升空间。详细的失败模式分析为未来研究指明了方向。
