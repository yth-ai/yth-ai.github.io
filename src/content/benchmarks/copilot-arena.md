---
title: "Copilot Arena：编程助手人类偏好"
description: "在 VS Code 中匿名对比两个代码补全模型，由开发者投票，编程版 Chatbot Arena"
date: 2025-02-01
benchName: "Copilot Arena"
org: "UC Berkeley"
category: "代码生成"
subcategory: "研发效率"
abilities: ["代码补全", "IDE集成", "人类偏好", "开发体验"]
dataSize: "持续众包"
evalMethod: "标准评测"
metric: "Elo Rating"
topResults:
  - model: "Claude 3.5 Sonnet"
    score: "1268"
  - model: "GPT-4o"
    score: "1248"
  - model: "DeepSeek V3"
    score: "1235"
tags: ["代码补全", "IDE", "人类偏好", "Elo"]
status: "active"
importance: 4
---
## 为什么重要
Copilot Arena 是 Chatbot Arena 在编程助手场景的对标——在真实 IDE 中让用户对比两个模型的代码补全/建议，通过投票产生 Elo 排名。是最接近"真实编程助手体验"的评测。

## 构建方式
1. 用户在 VSCode 插件中正常编码
2. 每次代码补全请求同时发给两个匿名模型
3. 用户选择更好的补全结果（或选"一样好"）
4. 基于投票计算 Elo 评分

## 任务示例
真实的代码补全场景，如：
- 用户正在写 React 组件 → 两个模型各自补全
- 用户写了一半的函数 → 模型补全剩余逻辑
- 用户写了注释 → 模型生成对应代码

## 关键发现
- 在真实编码场景中，模型排名与 HumanEval 等基准差异较大
- 代码补全的"速度"也很重要——用户对延迟高度敏感
- 上下文利用能力（理解当前文件和项目结构）是关键区分点

## 关联基准
- [Chatbot Arena](/benchmarks/chatbot-arena)：通用对话的类似设计
- [WebDev Arena](/benchmarks/webdev-arena)：网站开发的类似设计
- [Aider Polyglot](/benchmarks/aider-polyglot)：编程助手的自动化评测

## 不足与展望
- 投票量还不够大，部分模型排名不够稳定
- 偏向代码补全，不测完整的编程助手能力（如解释代码、调试）
- 用户群体偏 VSCode 用户，可能不代表所有开发者
