---
title: "MM-Vet：视觉-语言能力综合评测"
description: "开放式视觉问答，评估 6 种核心视觉-语言能力的整合水平"
date: 2024-01-01T00:00
benchName: "MM-Vet"
version: "v2"
org: "NTU"
paper: "arXiv:2308.02490"
code: "github.com/yuweihao/MM-Vet"
category: "多模态"
subcategory: "视觉推理"
abilities: ["视觉识别", "OCR", "空间推理", "知识", "数学", "语言生成"]
dataSize: "200+ 开放式问题"
construction: "人工设计"
evalMethod: "GPT-4 自动评分"
metric: "Score (%)"
topResults:
  - model: "GPT-5 Vision"
    score: "~78%"
    date: "2026-01"
tags: ["多模态", "视觉问答", "综合"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
MM-Vet 评估 6 种核心视觉-语言能力（识别/OCR/空间/知识/数学/生成）的自由组合。

## 构建方式与示例
200+ 开放式问题，需要同时运用多种能力。例如：[菜单图片] "这家餐厅最贵的菜是什么？用 2 个人的预算计算总价。"（需要 OCR + 数学）

## 关联基准与展望
关联：[MMMU](/benchmarks/mmmu)、[MMStar](/benchmarks/mmstar)。
