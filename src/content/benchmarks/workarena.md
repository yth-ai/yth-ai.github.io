---
title: "WorkArena：企业级 ServiceNow 工作流"
description: "33000+ 个基于 ServiceNow 企业平台的工作流自动化任务，比 WebArena 更贴近企业场景"
date: 2024-03-01T00:00
benchName: "WorkArena"
org: "ServiceNow Research"
paper: "arXiv:2403.07718"
code: "github.com/ServiceNow/WorkArena"
category: "Agent"
subcategory: "Web/Browser Agent"
abilities: ["企业工作流", "表单操作", "流程自动化"]
dataSize: "33000+ tasks"
construction: "ServiceNow 平台自动生成"
evalMethod: "状态验证"
metric: "Success Rate (%)"
topResults:
  - model: "GPT-4V"
    score: "~42%"
    date: "2024-03"
tags: ["企业", "工作流", "ServiceNow", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
33000+ 个基于 ServiceNow 企业平台的工作流任务——最大规模的企业级 Web Agent 评测。

## 构建方式与示例
IT 运维/HR/客服工单。例如："在 ServiceNow 中创建一个 P2 级别的 IT 工单，分配给网络团队。"

## 关联基准与展望
关联：[WebArena](/benchmarks/webarena)、[Mind2Web](/benchmarks/mind2web)。不足：绑定 ServiceNow。
