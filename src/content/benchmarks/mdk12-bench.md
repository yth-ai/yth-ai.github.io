---
title: "MDK12-Bench"
description: "基于 K-12 考试的多学科多模态推理基准，14 万实例覆盖 6 学科和 6827 个知识点"
date: 2025-04-08T12:00
benchName: "MDK12-Bench"
version: ""
org: "多机构合作"
paper: "2504.05782"
code: "https://github.com/LanceZPF/MDK12"
venue: ""
website: ""
category: "多模态"
abilities: ["多学科推理", "多模态理解", "K-12 教育评估"]
dataSize: "140K 实例，6 学科，6827 个知识点注释"
construction: "真实 K-12 考试题目 + 动态评估框架抗数据污染"
evalMethod: "动态评估（问题形式/类型/图像风格引导变化）"
metric: "准确率"
topResults:
  - model: "当前最先进 MLLM"
    score: "存在显著局限"
    date: "2025-04"
tags: ["多模态推理", "K-12", "教育", "多学科", "动态评估"]
status: "active"
importance: 3
saturation: "未饱和"
---

MDK12-Bench 是一个大规模多学科多模态推理基准，通过真实 K-12（小学到高中）考试题目评估多模态大语言模型（MLLM）的推理能力。与数据量小、领域窄的现有基准不同，MDK12-Bench 包含 14 万个推理实例，横跨数学、物理、化学、生物、地理和信息科学 6 个学科，配有 6827 个实例级知识点注释、详细答案解释和难度标签。

创新的动态评估框架通过对"问题形式"、"问题类型"和"图像风格"进行引导变化来缓解数据污染问题。广泛实验揭示了当前最先进 MLLM 在多模态推理方面的显著局限，为下一代模型的开发提供了有价值的洞察。开源于 GitHub。
