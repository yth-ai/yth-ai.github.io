---
title: "SecBench：网络安全大模型评测"
description: "腾讯联合清华等机构发布的首个网络安全领域大模型评测平台，多维度全面评估"
date: 2024-01-01T00:00
benchName: "SecBench"
org: "腾讯朱雀实验室 & 清华"
paper: "arXiv:2412.20787"
website: "https://secbench.org"
code: "github.com/secbench-git/SecBench"
category: "领域专业"
subcategory: "网络安全"
abilities: ["漏洞分析", "恶意代码检测", "安全知识", "渗透测试"]
dataSize: "大规模多维度（MCQ + 简答）"
construction: "专家标注 + 真实安全场景"
evalMethod: "多维度自动评分"
metric: "综合得分"
topResults:
  - model: "GPT-4o"
    score: "~72%"
    date: "2024-12"
tags: ["网络安全", "漏洞", "渗透测试"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
腾讯联合清华发布的首个网络安全大模型评测。覆盖漏洞分析、恶意代码检测、渗透测试等核心安全能力。

## 构建方式与示例
多维度安全场景。例如："分析这段代码中的 SQL 注入漏洞并给出修复方案。"

## 关联基准与展望
关联：[HarmBench](/benchmarks/harmbench)。不足：安全领域快速演进，评测需持续更新。
