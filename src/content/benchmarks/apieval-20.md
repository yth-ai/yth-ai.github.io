---
title: "APIEval-20"
description: "首个评估 AI 智能体在黑盒环境下发现 API 逻辑漏洞能力的开放基准"
date: 2026-04-02T12:00
benchName: "APIEval-20"
version: ""
org: "KushoAI"
paper: ""
code: ""
venue: ""
website: ""
category: "代码生成"
abilities: ["API 测试", "黑盒漏洞发现", "逻辑推理", "跨字段依赖分析"]
dataSize: "20 个场景，每个含 3-8 个漏洞"
construction: "人工设计，涵盖支付/身份验证/电商/用户管理"
evalMethod: "实时参考实现上的自动化二元评估"
metric: "Bug 检测 (70%) + 测试覆盖率 (20%) + 效率 (10%)"
topResults:
  - model: "评测进行中"
    score: "首周 100+ 下载"
    date: "2026-04"
tags: ["API测试", "黑盒", "漏洞发现", "智能体", "开源"]
status: "active"
importance: 2
saturation: "未饱和"
---

APIEval-20 由 AI 测试平台 KushoAI 发布，是首个专门评估 AI 智能体在黑盒环境下发现 API 逻辑漏洞能力的开放基准。在 AI 测试工具市场充斥夸大宣传的背景下，该基准提供了一个具体、可复现的衡量标准。

智能体仅被提供 API 的请求模式和样本负载（无源代码、无文档），必须像 QA 工程师一样在有限信息下识别逻辑漏洞。20 个场景覆盖支付、身份验证、电商和用户管理领域，漏洞按推理深度分级（简单=结构性突变、中等=字段语义理解、复杂=跨字段逻辑依赖）。评分强调精确度（Bug 检测 70%）并惩罚暴力测试。已在 HuggingFace 开源，包含实时参考实现和自动化评估脚本。
