---
title: "HarmBench：AI 安全红队评测"
description: "评估模型对 510 种有害行为的抵抗能力，覆盖直接请求和越狱攻击"
date: 2024-02-01
benchName: "HarmBench"
org: "多校联合"
paper: "arXiv:2402.04249"
category: "对齐与安全"
subcategory: "安全"
abilities: ["安全性", "越狱抵抗", "有害内容", "红队测试"]
dataSize: "510 behaviors / 多种攻击方式"
evalMethod: "标准评测"
metric: "Attack Success Rate (%)"
topResults:
  - model: "Claude Opus 4"
    score: "3.2% ASR"
  - model: "GPT-5"
    score: "4.8% ASR"
  - model: "Llama 3.1 70B"
    score: "12.4% ASR"
tags: ["安全", "越狱", "红队", "有害内容"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
HarmBench 是评测模型安全性（对有害请求的防御能力）的标准基准。覆盖 7 类有害行为。

## 构建方式与示例
400+ 有害请求，7 类：化学/生物/网络攻击/违法/版权/歧视/虚假信息。评测模型是否拒绝回答。

## 关联基准与展望
关联：[XSTest](/benchmarks/xstest)（过度拒绝检测）、[MM-SafetyBench](/benchmarks/mm-safetybench)。两者互补：HarmBench 测该拒绝的能否拒绝，XSTest 测不该拒绝的是否误拒。
