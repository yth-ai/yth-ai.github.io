---
title: "SWE-bench Pro：高难度软件工程"
description: "从 SWE-bench 中筛选的 400+ 道经企业验证的高难度问题"
date: 2025-09-01
benchName: "SWE-bench Pro"
org: "Scale AI"
category: "代码生成"
subcategory: "仓库级"
abilities: ["代码修复", "企业级", "高难度", "测试覆盖"]
dataSize: "400+ instances"
evalMethod: "标准评测"
metric: "% Resolved"
topResults:
  - model: "GPT-5.3 Codex (CLI)"
    score: "57.0%"
    date: "2026-03"
  - model: "Claude Code (Opus 4.5)"
    score: "55.4%"
    date: "2026-03"
  - model: "Claude Opus 4.5 (SEAL)"
    score: "45.9%"
    date: "2026-03"
  - model: "Claude Sonnet 4.5 (SEAL)"
    score: "43.6%"
    date: "2026-03"
  - model: "Gemini 3 Pro (SEAL)"
    score: "43.3%"
    date: "2026-03"
tags: ["SWE-bench", "企业级", "高难度"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
SWE-bench Pro 是 Scale AI 推出的更难版本——1865 个多语言任务，更好地抵抗数据污染，是 SWE-bench Verified 的升级。

## 构建方式
1. 1865 个任务（比 Verified 的 300 大 6 倍）
2. 多语言（不只是 Python）
3. 更严格的去污染处理

## 关联基准
- [SWE-bench](/benchmarks/swe-bench)：原始版
- [SWE-Lancer](/benchmarks/swe-lancer)：真实付费任务
- [Claw-Eval](/benchmarks/claweval)：OpenClaw 框架评测

## 不足与展望
- 相比 SWE-bench，任务分布可能有偏差
