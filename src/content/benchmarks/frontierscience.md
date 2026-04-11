---
title: "FrontierScience：博士级科研推理"
description: "OpenAI 发布的博士级科学推理基准，Olympiad（竞赛）+ Research（开放科研）双赛道"
date: 2026-01-01T00:00
benchName: "FrontierScience"
org: "OpenAI"
paper: "arXiv:2601.21165"
category: "Agent"
subcategory: "Science Agent"
abilities: ["博士级推理", "数学", "物理", "化学", "生物", "CS"]
dataSize: "Olympiad 100 + Research 60"
construction: "领域专家设计"
evalMethod: "精确答案 + 专家评分"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5.2"
    score: "Olympiad 77%, Research 25%"
    date: "2026-01"
  - model: "o3"
    score: "Olympiad 68%"
    date: "2025-12"
tags: ["科研推理", "博士级", "OpenAI"]
status: "active"
importance: 5
saturation: "未饱和"
---
## 为什么重要

FrontierScience 是 OpenAI 发布的博士级科研推理基准，分两个赛道：Olympiad（竞赛式解题，77%）和 Research（开放科研推理，仅 25%）。两个赛道之间 52% 的巨大差距揭示了当前 AI 的核心弱点：结构化解题远强于开放科研推理。

## 构建方式

1. **Olympiad 赛道**（100 题）：由各学科博士出的竞赛级科学题（物理、化学、生物、CS、数学），有明确答案
2. **Research 赛道**（60 题）：开放式科研子任务——给一个研究背景，要求完成数据分析/假设验证/实验设计等
3. 所有题目禁用联网（测纯推理能力）

## 任务示例

**Olympiad 示例**（物理）：
> "一个超导环中的磁通量量子化条件下，计算临界电流与外加磁场的关系..."

**Research 示例**（生物）：
> "给定一组基因表达数据，判断哪些基因可能参与了信号通路 X，并给出你的推理过程"

## 关键发现

- **Olympiad 77% vs Research 25%**：结构化解题远强于开放科研
- 这个差距是 Science Agent 研发的核心方向——如何让 AI 做"开放式科学推理"
- GPT-5.2 在两个赛道都是最强，说明模型规模对科研推理仍有帮助
