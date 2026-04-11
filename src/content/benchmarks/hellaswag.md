---
title: "HellaSwag：常识推理句子补全"
description: "对抗性句子补全任务，已基本饱和 (95%+)"
date: 2019-05-01
benchName: "HellaSwag"
org: "Allen AI & UW"
paper: "arXiv:1905.07830"
category: "推理"
subcategory: "常识推理"
abilities: ["常识推理", "自然语言推理"]
dataSize: "70,000 questions"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-4o"
    score: "95.3%"
  - model: "Claude 3.5"
    score: "94.8%"
tags: ["常识推理", "已饱和"]
status: "active"
importance: 1
saturation: "已饱和"
---
## 为什么重要
HellaSwag 曾是常识推理核心基准，通过对抗性过滤生成干扰选项。**已饱和**（95%+）。

## 构建方式与示例
70000 道句子补全题。例如："一个人走进厨房，打开水龙头..." → 选最合理的后续。

## 关联基准与展望
关联：[WinoGrande](/benchmarks/winogrande)、[ARC-Challenge](/benchmarks/arc-challenge)。已饱和。
