---
title: "BABILong：长文本推理"
description: "将经典 bAbI 推理任务扩展到 1M+ tokens 长度，专门测试长文本中的多步推理能力"
date: 2024-06-01T00:00
benchName: "BABILong"
org: "多校"
paper: "arXiv:2406.10149"
code: "github.com/booydar/babilong"
category: "长文本"
subcategory: "推理"
abilities: ["长文本推理", "多步推理", "事实追踪"]
dataSize: "20 tasks × 多长度级别"
construction: "经典 bAbI 嵌入长文本"
evalMethod: "精确匹配"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-4 (128K)"
    score: "~55% (128K)"
    date: "2024-06"
tags: ["长文本", "推理", "多步"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
BABILong 将经典 bAbI 推理任务嵌入 1M+ tokens 长文本，专测长文本**推理**而非简单检索。

## 构建方式与示例
20 种推理任务（事实追踪/计数/路径推理等）嵌入长文本。例如："John went to kitchen. Mary went to garden...（100K tokens 后）Where is John?"

## 关联基准与展望
关联：[RULER](/benchmarks/ruler)、[LongBench](/benchmarks/longbench)、[InfiniteBench](/benchmarks/infinitebench)。不足：合成场景偏简单。
