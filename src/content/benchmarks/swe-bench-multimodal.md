---
title: "SWE-bench Multimodal：多模态软件工程"
description: "从 JavaScript 前端仓库收集的 617 个需要理解截图才能修复的 Issue"
date: 2024-10-01
benchName: "SWE-bench M"
org: "Princeton NLP"
paper: "arXiv:2410.03859"
category: "Agent"
subcategory: "Coding Agent"
abilities: ["前端修复", "视觉理解", "CSS/JS调试", "截图对比"]
dataSize: "617 instances / 17 JS repos"
evalMethod: "标准评测"
metric: "% Resolved"
topResults:
  - model: "Claude 3.5 + SWE-agent"
    score: "12.0%"
  - model: "GPT-4o + SWE-agent"
    score: "6.6%"
tags: ["SWE-bench", "前端", "多模态", "JavaScript"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
SWE-bench 的多模态扩展——Issue 中包含截图/UI 示意图，Agent 需要同时理解视觉和代码。

## 构建方式与示例
617 个含截图的 GitHub Issue。例如：Issue 包含"按钮在手机端错位"的截图 → Agent 需要根据截图定位 CSS bug。

## 关联基准与展望
关联：[SWE-bench](/benchmarks/swe-bench)、[VisualWebArena](/benchmarks/visualwebarena)。
