---
title: "ChartQA：图表问答"
description: "9600 个基于真实图表（柱状图/折线图/饼图等）的问答对，需要视觉理解+数值推理"
date: 2022-03-01T00:00
benchName: "ChartQA"
org: "Adobe & Georgia Tech"
paper: "arXiv:2203.10244"
category: "多模态"
subcategory: "图表理解"
abilities: ["图表理解", "数值推理", "视觉-语言"]
dataSize: "9600 QA pairs"
construction: "真实图表 + 众包标注"
evalMethod: "精确匹配 (5% 容差)"
metric: "Relaxed Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "~88%"
    date: "2025-11"
  - model: "GPT-4o"
    score: "81.6%"
    date: "2024-05"
tags: ["图表", "数值推理", "多模态"]
status: "active"
importance: 4
saturation: "接近饱和"
---
## 为什么重要
ChartQA 是图表理解的标准基准——模型需要从柱状图/折线图中读取数据、比较趋势、做简单计算。是各家多模态模型必报的评测之一。

## 构建方式
1. 从真实来源收集 9600 个图表-问题-答案三元组
2. 分两个子集：augmented（模板自动生成问题）和 human（人工提问）
3. 图表类型：柱状图、折线图、饼图、散点图等
4. 评分允许 5% 的数值容差（Relaxed Accuracy）

## 任务示例
**简单**：[柱状图] "2023年哪个月销量最高？"
**计算**：[折线图] "2022年和2023年的增长率差异是多少百分点？"
**推理**：[多系列图] "蓝色线和红色线首次交叉是在哪个时间点？"

## 关键发现
- Gemini 2.5 Pro ~88%，接近饱和
- human 子集比 augmented 子集难 15-20%
- 模型在"读数"上准确但在"比较/计算"上出错

## 关联基准
- [MathVista](/benchmarks/mathvista)：更难的视觉数学
- [AI2D](/benchmarks/ai2d)：科学图解理解
- [DocVQA](/benchmarks/docvqa)：文档理解

## 不足与展望
- 图表质量较高，没测低分辨率/模糊图表
- 主要是英文图表
- 接近饱和——需要更难的图表推理评测
