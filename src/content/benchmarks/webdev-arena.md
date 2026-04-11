---
title: "WebDev Arena：网站开发竞技场"
description: "两个模型根据相同提示构建网站，通过用户投票比较外观和功能，评测前端开发能力"
date: 2025-01-01T00:00
benchName: "WebDev Arena"
org: "LMSYS"
website: "https://web.lmarena.ai"
category: "代码生成"
subcategory: "全栈应用"
abilities: ["网站开发", "前端设计", "HTML/CSS/JS"]
dataSize: "动态（用户投票）"
construction: "众包对比投票"
evalMethod: "Elo 评分（用户投票）"
metric: "Elo Rating"
topResults:
  - model: "Claude Sonnet 4"
    score: "Elo #1"
    date: "2025-12"
  - model: "Gemini 2.5 Pro"
    score: "Elo #2"
    date: "2025-12"
tags: ["网站开发", "前端", "Arena", "人类偏好"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
WebDev Arena 是 Chatbot Arena 的前端开发版——给两个模型相同的需求描述，它们各自生成网站，用户投票选更好的。是目前最直接的"LLM 做前端"能力评测。

## 构建方式
1. 用户在 web.lmarena.ai 提交网站需求
2. 两个匿名模型各自生成完整网站（HTML/CSS/JS）
3. 用户对比外观和功能并投票
4. Elo 评分系统

## 任务示例
**示例**："做一个深色主题的个人博客首页，要有文章列表和侧边栏"

## 关键发现
- Claude Sonnet 4 排名第一——在前端设计上有明显优势
- 模型的"审美能力"成为关键区分因素

## 关联基准
- [Chatbot Arena](/benchmarks/chatbot-arena)：通用对话
- [Copilot Arena](/benchmarks/copilot-arena)：代码补全
- [WebApp1K](/benchmarks/webapp1k)：全栈应用

## 不足与展望
- 主要测静态页面，不测交互逻辑和后端
- 审美偏好因人而异，排名可能不稳定
