---
title: "MMMLU：多语言综合理解"
description: "MMLU 的多语言版本，覆盖 14 种语言，评估非英语环境下的知识和推理能力"
date: 2024-10-01
benchName: "MMMLU (Multilingual MMLU)"
org: "OpenAI & 社区"
category: "综合"
subcategory: "多语言"
abilities: ["多语言", "知识理解", "跨语言泛化"]
dataSize: "~15,000 questions / 14 languages"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "87.3%"
  - model: "Gemini 2.5 Pro"
    score: "85.8%"
  - model: "Claude Opus 4"
    score: "84.2%"
tags: ["多语言", "MMLU", "综合"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
MMMLU（Multilingual MMLU）将 MMLU 翻译为 14 种语言，测试模型的多语言知识理解能力。

## 构建方式与示例
14 种语言版本。例如同一道题的中文/日语/阿拉伯语版本，测试跨语言一致性。

## 关联基准与展望
关联：[MMLU](/benchmarks/mmlu)、[C-Eval](/benchmarks/ceval)。不足：翻译质量参差不齐。
