---
title: "Aider Polyglot：多语言代码编辑评测"
description: "评估 LLM 作为代码编辑助手在多种编程语言中修改现有代码的能力"
date: 2024-06-01
benchName: "Aider Polyglot"
org: "Aider"
category: "代码生成"
subcategory: "研发效率"
abilities: ["代码编辑", "多语言", "重构", "Bug修复", "Python", "JS", "Java", "C++"]
dataSize: "225+ exercises / 10 languages"
evalMethod: "标准评测"
metric: "Pass Rate (%)"
topResults:
  - model: "Claude Opus 4"
    score: "82.7%"
  - model: "GPT-5"
    score: "78.4%"
  - model: "DeepSeek R1"
    score: "71.2%"
tags: ["代码编辑", "多语言", "重构", "Aider"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
Aider Polyglot 评测编程助手在多语言环境下的代码编辑能力——覆盖 Python/JS/TS/Java/C#/Go 等，DeepSeek R1 报告中的核心编码评测。

## 构建方式与示例
使用 Aider 框架在多语言项目上测试代码编辑成功率。例如："在这个 TypeScript 项目中重构 UserService 类，将同步方法改为 async/await。"

## 关键发现
多语言覆盖揭示了模型的语言偏好——大部分模型在 Python 上最强，Go/Rust 上最弱。

## 关联基准与展望
关联：[Copilot Arena](/benchmarks/copilot-arena)、[SWE-bench](/benchmarks/swe-bench)。不足：绑定 Aider 框架。
