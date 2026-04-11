---
title: "DocVQA：文档视觉问答"
description: "50,000 个基于真实文档图像的问答题，需要模型理解表格/表单/发票等文档布局"
date: 2021-05-01
benchName: "DocVQA"
org: "CVC Barcelona"
paper: "arXiv:2007.00398"
category: "多模态"
subcategory: "文档理解"
abilities: ["文档理解", "OCR", "表格理解", "表单理解", "版面分析"]
dataSize: "50,000 QA pairs / 12,767 images"
evalMethod: "标准评测"
metric: "ANLS (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "95.2%"
  - model: "GPT-5 Vision"
    score: "93.8%"
  - model: "Claude Opus 4 Vision"
    score: "91.4%"
tags: ["文档", "OCR", "表格", "多模态"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
DocVQA 评测模型理解扫描文档（发票、合同、表单等）的能力。是文档 AI 领域的标准基准。

## 构建方式与示例
12,767 个文档图像 + 50,000 个问答对。例如：[发票扫描件] "这张发票的总金额是多少？"

## 关联基准与展望
关联：[OCRBench](/benchmarks/ocrbench)、[TextVQA](/benchmarks/textvqa)。不足：主要是英文文档。
