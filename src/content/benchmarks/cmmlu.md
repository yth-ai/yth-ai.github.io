---
title: "CMMLU：中文多任务理解"
description: "11,528 道涵盖 67 个中文学科的题目，补充 C-Eval 覆盖更多中国特色领域"
date: 2024-01-01
benchName: "CMMLU"
org: "MBZUAI & 社区"
paper: "arXiv:2306.09212"
category: "综合"
subcategory: "中文"
abilities: ["中文理解", "中文知识", "中国特色学科"]
dataSize: "11,528 questions / 67 subjects"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "88.4%"
  - model: "Qwen2.5-72B"
    score: "86.3%"
  - model: "DeepSeek V3"
    score: "84.1%"
tags: ["中文", "综合", "多学科"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
CMMLU 是 MMLU 的中文版，67 个学科覆盖中国教育体系和文化知识。与 C-Eval 互补。

## 构建方式与示例
从中国各级考试收集，67 个学科。例如中国古代文学："'两个黄鹂鸣翠柳'的下一句是？"

## 关联基准与展望
关联：[C-Eval](/benchmarks/ceval)、[MMLU](/benchmarks/mmlu)、[MMMLU](/benchmarks/mmmlu)。不足：部分题目过时。
