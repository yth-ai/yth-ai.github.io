---
title: "Chatbot Arena：众包人类偏好评测"
description: "百万级投票计算 Elo 评分，最接近真实用户体验的评测"
date: 2023-05-01
benchName: "Chatbot Arena"
org: "LMSYS (UC Berkeley)"
paper: "arXiv:2403.04132"
category: "对齐与安全"
subcategory: "人类偏好"
abilities: ["对话质量", "人类偏好"]
dataSize: "2M+ votes"
evalMethod: "标准评测"
metric: "Elo Rating"
topResults:
  - model: "GPT-5"
    score: "1380"
  - model: "Gemini 2.5 Pro"
    score: "1368"
  - model: "Claude Opus 4"
    score: "1361"
tags: ["人类偏好", "Elo", "众包"]
status: "active"
importance: 5
---
## 为什么重要

Chatbot Arena 是目前最被业界认可的"模型综合能力"排名。原因：真实用户评判、匿名对比、百万级样本、Elo 系统。

## 构建方式

1. 用户在 [arena.ai](https://arena.ai) 提交一个 prompt
2. 系统随机选择两个匿名模型生成回复
3. 用户对比两个回复并投票选更好的（或平手）
4. 基于投票数据计算 Bradley-Terry 模型的 Elo 评分
5. 累计超过 **200 万次投票**

## 任务示例

Arena 的"题目"就是真实用户的各种需求，例如：
- "帮我写一封辞职邮件，语气要委婉但坚定"
- "解释量子退火算法，用简单的比喻"
- "写一个 Python 脚本批量重命名文件"
- "分析这段代码的 bug（附代码）"

## 细分维度

Arena 现在支持按维度筛选排名：
| 维度 | 说明 |
|------|------|
| Hard Prompts | 高难度指令 |
| Coding | 编程任务 |
| Math | 数学推理 |
| Creative Writing | 创意写作 |
| Long Context | 长文本 |
| Vision | 多模态 |
| Style Control | 风格控制（去除长度偏见） |

## 局限性

- 用户群体偏技术人群，可能不代表普通用户
- 短对话为主，难以评估长期交互质量
- 存在"长度偏见"——Style Control 维度试图消除这个问题
