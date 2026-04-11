---
title: "MMLU / MMLU-Pro：大模型知识与推理综合基准"
description: "最广泛使用的 LLM 综合能力基准，覆盖 57 个学科领域的多选题，MMLU-Pro 引入 10 选项和思维链提升区分度"
date: 2024-06-01
benchName: "MMLU / MMLU-Pro"
version: "MMLU-Pro"
org: "UC Berkeley / TIGER Lab"
paper: "arXiv:2009.03300 / arXiv:2406.01574"
code: "github.com/TIGER-AI-Lab/MMLU-Pro"
venue: "NeurIPS 2021 / 2024"
website: "https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro"
category: "综合"
subcategory: "知识"
abilities: ["知识储备", "推理能力", "学科理解", "多选推理"]
dataSize: "MMLU: 15,908 题 / MMLU-Pro: 12,032 题"
construction: "MMLU: 考试真题收集 / Pro: 专家筛选+增强"
evalMethod: "多选准确率"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "92.7% (MMLU-Pro)"
    date: "2026-01"
  - model: "Claude Opus 4"
    score: "91.3% (MMLU-Pro)"
    date: "2025-12"
  - model: "Gemini 2.5 Pro"
    score: "90.8% (MMLU-Pro)"
    date: "2025-11"
  - model: "GPT-4o"
    score: "87.2% (MMLU)"
    date: "2024-05"
tags: ["综合评测", "知识", "多学科", "多选题", "通用能力"]
status: "active"
importance: 4
saturation: "已饱和"
---
## 为什么重要

MMLU（Massive Multitask Language Understanding）是 LLM 评测的"通用货币"——几乎所有模型发布都会报 MMLU 分数。57 个学科覆盖 STEM、人文、社科等，是衡量模型"知识广度"的基准线。

## 构建方式

1. 从真实的考试和教材中收集 57 个学科的 4 选项多选题
2. 每个学科有 dev/val/test 三个分割
3. 学科涵盖：抽象代数、机器学习、美国历史、临床医学、国际法等
4. 总计约 16,000 道题

## 任务示例

**示例 1**（大学化学）：
> "下列哪种分子具有最高的偶极矩？ A) CO₂  B) SO₂  C) CCl₄  D) SF₆"

**示例 2**（道德学）：
> "根据康德的道德理论，以下哪种行为在道德上是不可接受的？..."

**示例 3**（机器学习）：
> "关于 VC 维，以下哪个陈述是正确的？..."

## 当前状态

**基本饱和**。顶尖模型已达 90%+（GPT-5 约 92%）。但 MMLU 仍有价值：
- 作为基线能力验证（模型至少不应在 MMLU 上退步）
- 按学科细分可发现特定领域的弱点
- **升级版** MMLU-Pro（10 选项 + 更难题目）已接替为主要评测
