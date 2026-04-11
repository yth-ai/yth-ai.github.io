---
title: "OCRBench：多模态 OCR 能力评测"
description: "1000 道覆盖文本识别、场景文字、手写体、公式等 5 个维度的 OCR 评测"
date: 2024-01-01T00:00
benchName: "OCRBench"
version: "v2"
org: "HUST"
paper: "arXiv:2305.07895"
code: "github.com/Yuliang-Liu/MultimodalOCR"
website: "https://99franklin.github.io/ocrbench_v2/"
category: "多模态"
subcategory: "文档理解"
abilities: ["OCR", "场景文字", "手写识别", "公式识别"]
dataSize: "v1: 1000 / v2: 10000+"
construction: "多源收集 + 标注"
evalMethod: "精确匹配 / 编辑距离"
metric: "Score (0-1000)"
topResults:
  - model: "GPT-4o"
    score: "785/1000 (v1)"
    date: "2024-05"
  - model: "Gemini 2.5 Pro"
    score: "~880/1000 (v1)"
    date: "2025-11"
tags: ["OCR", "文字识别", "多模态"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
OCRBench 是多模态模型 OCR 能力的标准评测。v2 扩展到 10000+ 样本，增加了多语言、长文本 OCR、模糊文字等更难场景。

## 构建方式
1. v1：1000 道题，5 个维度（文本识别、场景文字、手写体、公式、KIE）
2. v2：10000+ 样本，增加多语言和长文本 OCR
3. 评分 0-1000 分制

## 任务示例
**场景文字**：识别街拍照片中路牌上的文字
**手写体**：识别手写笔记中的内容
**公式**：识别 LaTeX 公式图片

## 关联基准
- [DocVQA](/benchmarks/docvqa)：文档理解
- [TextVQA](/benchmarks/textvqa)：文字图像问答
- [ChartQA](/benchmarks/chartqa)：图表理解

## 不足与展望
- 中文 OCR 场景覆盖不足
- 低质量图片（模糊、倾斜）的评测还需加强
