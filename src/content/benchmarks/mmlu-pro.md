---
title: "MMLU-Pro：大规模多任务理解升级版"
description: "12,032 道 10 选项高难度题，比 MMLU 更难、更抗噪、更需要推理，各家技术报告必报基准"
date: 2024-06-01T00:00
benchName: "MMLU-Pro"
org: "多校"
paper: "arXiv:2406.01574"
code: "github.com/TIGER-AI-Lab/MMLU-Pro"
website: "https://huggingface.co/datasets/TIGER-Lab/MMLU-Pro"
category: "综合"
subcategory: "知识"
abilities: ["知识理解", "推理", "多学科", "抗噪"]
dataSize: "12,032 questions / 14 学科"
construction: "从 MMLU 筛选 + 专家新增 + 扩展到 10 选项"
evalMethod: "多选准确率"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "~80%"
    date: "2026-01"
  - model: "Claude Opus 4"
    score: "~78%"
    date: "2025-12"
  - model: "DeepSeek R1"
    score: "~75%"
    date: "2025-01"
  - model: "GPT-4o"
    score: "72.6%"
    date: "2024-05"
tags: ["知识", "多学科", "推理", "10选项"]
status: "active"
importance: 5
saturation: "未饱和"
---
## 为什么重要

MMLU-Pro 是 MMLU 的重大升级——各家模型技术报告（GPT-5、Claude 4、Gemini 2.5、DeepSeek R1、Qwen 2.5）全部在报。被 HuggingFace Open LLM Leaderboard v2 采用为 6 个核心基准之一。

## 构建方式

1. 从 MMLU 中筛选出高质量题目（移除噪声和歧义）
2. 由学科专家新增更有挑战性的题目
3. 将选项从 4 个**扩展到 10 个**——随机猜对概率从 25% 降到 10%
4. 14 个学科，12,032 道题

## 任务示例

**示例 1**（物理）：
> "一个电子在匀强磁场中做圆周运动..."（10 个选项，需要精确计算）

**示例 2**（法律）：
> "甲在合同到期前单方终止..."（10 个选项，需要判例法推理）

## 关键发现

- **CoT 提升 20%+**：在 MMLU 上 CoT 几乎无提升，但在 MMLU-Pro 上提升巨大——说明 Pro 真正考察推理
- **区分度远好于 MMLU**：MMLU 上模型差距 <5%，MMLU-Pro 上差距 >20%
- 被认为是目前"知识+推理"综合评测的最佳基准
