---
title: "SWE-Rebench：去污染持续更新的软件工程评测"
description: "基于滚动时间窗口、自动去污染的软件工程 Agent 评测基准，由 Nebius 构建"
date: 2026-03-20T09:00
benchName: "SWE-Rebench"
version: "v2"
org: "Nebius / SWE-rebench Team"
paper: "arXiv:2602.23866"
code: "https://github.com/SWE-rebench/"
venue: ""
website: "https://swe-rebench.com/"
category: "代码生成"
abilities: ["软件工程", "Bug 修复", "代码补丁生成", "多仓库理解", "Agent 编程"]
dataSize: "57 问题 / 46 仓库（滚动窗口）"
construction: "自动从 GitHub PR 抽取 + 时间窗口去污染"
evalMethod: "测试用例通过率 + 多次运行 (Pass@1, Pass@5)"
metric: "Resolved Rate (%)"
topResults:
  - model: "Claude Opus 4.6"
    score: "65.3%"
    date: "2026-03"
  - model: "GPT-5.2 Medium"
    score: "64.4%"
    date: "2026-03"
  - model: "GLM-5"
    score: "62.8%"
    date: "2026-03"
  - model: "GPT-5.4 Medium"
    score: "62.8%"
    date: "2026-03"
  - model: "Gemini 3.1 Pro Preview"
    score: "62.3%"
    date: "2026-03"
tags: ["软件工程", "去污染", "持续更新", "Agent", "GitHub"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要

SWE-Rebench 解决了 SWE-bench 家族最大的痛点——**数据污染**。通过滚动时间窗口机制，它只使用模型训练截止日期之后发布的 GitHub PR 任务，并自动标记潜在污染。v2 版本进一步扩展为多语言支持。这使得它成为目前最可信的 AI 编码 Agent 实力衡量标准之一。

## 核心设计

- **滚动时间窗口**：任务的起止日期可调，保证评测数据新于模型训练数据
- **污染检测**：模型发布日期早于任务日期时自动红色高亮标记
- **多次评估**：每个模型运行多次，报告 Pass@1 和 Pass@5
- **成本追踪**：报告每题 token 消耗和美元成本
- **128K 上下文限制**：移除了步数硬限制，仅保留上下文窗口约束

## 关键发现

- **Claude Opus 4.6 最稳定**：65.3% 解决率，34/57 任务 5/5 全对
- **性价比差异巨大**：Step-3.5-Flash 每题仅 $0.14，而 Claude Opus 需 $1.12
- **开源模型竞争力强**：GLM-5 (62.8%) 和 DeepSeek-V3.2 (60.9%) 进入 Top 6
- Token 效率差异显著：GPT-5.4 仅需 0.77M tokens/题，Qwen3-Coder-Next 需 8.12M

## 与 SWE-bench 系列的区别

| 维度 | SWE-bench Verified | SWE-Rebench |
|------|-------------------|-------------|
| 数据污染 | 静态数据集，可被记忆 | 滚动窗口自动去污染 |
| 更新频率 | 不更新 | 持续更新 |
| 语言 | 仅 Python | v2 多语言 |

## 关联基准

- [SWE-bench](/benchmarks/swe-bench)：原始版本
- [SWE-bench Pro](/benchmarks/swe-bench-pro)：Scale AI 加难版
- [LiveCodeBench](/benchmarks/livecodebench)：持续更新的编程评测
