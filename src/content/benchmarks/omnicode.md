---
title: "OmniCode"
description: "评估软件工程智能体在 Bug 修复、测试生成、代码审查和风格修复四类任务上的综合表现"
date: 2026-02-06T12:00
benchName: "OmniCode"
version: "v2"
org: "seal-research"
paper: "2602.02262"
code: "https://github.com/seal-research/OmniCode"
venue: ""
website: ""
category: "代码生成"
abilities: ["Bug 修复", "测试生成", "代码审查修复", "风格修复"]
dataSize: "1794 个任务（Python/Java/C++）"
construction: "手动验证 + 部分合成生成，消除定义不清问题"
evalMethod: "多代理框架评估"
metric: "任务成功率"
topResults:
  - model: "SWE-Agent (DeepSeek-V3.1)"
    score: "20.9% (Java 测试生成)"
    date: "2026-02"
tags: ["多任务", "多语言", "软件工程", "Agent", "测试生成"]
status: "active"
importance: 3
saturation: "未饱和"
---

OmniCode 是一个超越传统 Bug 修复的全面软件工程 Agent 基准。它包含四类关键任务——Bug 修复、测试生成、代码审查修复和风格修复——覆盖 Python、Java 和 C++ 三种语言，共计 1794 个经过手工验证的任务。

关键发现是现有编码 Agent（如 SWE-Agent）在 Python Bug 修复上表现尚可，但在 Java/C++ 及测试生成等非传统任务上表现不佳。例如 SWE-Agent 配合 DeepSeek-V3.1 在 Java 测试生成上最高仅 20.9%。部分任务经过合成生成并精心设计以避免数据泄露，确保评测公平性。OmniCode 推动社区关注编码智能体在软件开发全链路（而非仅 Bug 修复）上的能力。
