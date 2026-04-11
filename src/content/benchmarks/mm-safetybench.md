---
title: "MM-SafetyBench：多模态安全评测"
description: "通过图文结合的方式测试多模态模型的安全性，发现文字排版攻击让 ASR 从 5% 飙到 77%"
date: 2024-10-01
benchName: "MM-SafetyBench"
org: "多校联合"
paper: "ECCV 2024"
category: "对齐与安全"
subcategory: "安全"
abilities: ["多模态安全", "越狱", "图像攻击", "排版攻击"]
dataSize: "5,040 samples / 13 categories"
evalMethod: "标准评测"
metric: "Attack Success Rate (%)"
topResults:
  - model: "GPT-4V"
    score: "12.3% ASR"
  - model: "LLaVA"
    score: "77.0% ASR (typo attack)"
tags: ["多模态", "安全", "越狱", "图像攻击"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
评测多模态模型的安全性——通过在图像中嵌入有害信息来测试模型是否会被视觉 prompt injection 攻击。

## 构建方式与示例
图像+文字组合的攻击场景。例如：一张看似无害的图片中隐藏了有害指令。

## 关联基准与展望
关联：[HarmBench](/benchmarks/harmbench)、[XSTest](/benchmarks/xstest)。不足：攻击手法在快速演进。
