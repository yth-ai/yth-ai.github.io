---
title: "WindowsAgentArena：Windows 桌面操作"
description: "154 个 Windows 桌面应用操作任务，覆盖 Office/浏览器/系统设置等日常办公场景"
date: 2024-09-01T00:00
benchName: "WindowsAgentArena"
org: "Microsoft Research"
paper: "arXiv:2409.08264"
code: "github.com/microsoft/WindowsAgentArena"
category: "Agent"
subcategory: "Computer Use Agent"
abilities: ["Windows操作", "Office", "多窗口", "系统设置"]
dataSize: "154 tasks"
construction: "专家设计 + Azure VM 环境"
evalMethod: "状态检查"
metric: "Success Rate (%)"
topResults:
  - model: "GPT-4V + Navi"
    score: "19.5%"
    date: "2024-09"
tags: ["Windows", "桌面", "Computer Use"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
154 个 Windows 桌面任务——在 Azure VM 上用真实 Windows 环境运行。即使 GPT-4V + Navi 也只有 19.5%。

## 构建方式与示例
Office/浏览器/系统设置等。例如："在 PowerPoint 中将第三张幻灯片的标题改为 X 并应用 Y 主题。"

## 关联基准与展望
关联：[OSWorld](/benchmarks/osworld)、[OSWorld-Verified](/benchmarks/osworld-verified)。
