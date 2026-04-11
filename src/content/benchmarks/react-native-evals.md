---
title: "React Native Evals：移动端 AI 编码评测"
description: "首个系统化评测 AI 编码模型处理真实 React Native 开发任务的开源 benchmark"
date: 2026-03-19T09:00
benchName: "React Native Evals"
version: "1.0"
org: "Callstack"
paper: ""
code: "https://github.com/callstackincubator/evals"
venue: ""
website: "https://rn-evals.vercel.app/"
category: "代码生成"
abilities: ["移动端开发", "React Native", "动画实现", "异步状态管理", "导航架构"]
dataSize: "71 个评测任务 / 5 大类别"
construction: "专家设计的真实 RN 开发任务"
evalMethod: "LLM-as-Judge (基于 requirements.yaml 结构化需求)"
metric: "Average Score (%)"
topResults:
  - model: "Composer 2 (Cursor)"
    score: "96.2%"
    date: "2026-04"
  - model: "Claude Opus 4.6"
    score: "84.4%"
    date: "2026-04"
  - model: "GPT-5.4"
    score: "82.6%"
    date: "2026-04"
  - model: "GPT-5.3 Codex"
    score: "80.9%"
    date: "2026-04"
  - model: "Gemini 3.1 Pro"
    score: "78.9%"
    date: "2026-04"
tags: ["移动开发", "React Native", "编码", "框架专项", "开源"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要

React Native Evals 填补了 AI 编码评测在框架特定移动端开发领域的空白。通用编码 benchmark（如 SWE-bench、HumanEval）往往忽略了框架生态特有的挑战——动画时序、手势组合、异步状态竞态、导航栈管理等。这是首个让"哪个 AI 写 RN 代码最好"从主观争论走向可量化评估的 benchmark。

## 评测类别

### 当前 5 类（71 任务）
- **Animation（动画）**：14 任务，涉及 Reanimated、手势处理、键盘控制
- **Async State（异步状态）**：14 任务，TanStack Query、Zustand、Jotai、React 并发原语
- **Lists（列表）**：19 任务，虚拟化列表性能与行为
- **Navigation（导航）**：14 任务，Native Stack、Bottom Tabs、Drawer
- **更多类别即将推出**：react-native-apis、expo-sdk、expo-router、nitro-modules

## 评估方法

两阶段流水线：
1. **生成阶段**：模型接收任务提示和脚手架，返回修改后的代码
2. **评判阶段**：独立 LLM 根据 `requirements.yaml` 结构化需求评判

## 关键发现

- **Cursor Composer 2 独占鳌头**（96.2%），比第二名高 11.8 分，展示了 IDE 集成 Agent 在特定框架上的优势
- 开源小模型（32B 级）与闭源大模型差距悬殊（31.8% vs 96.2%）
- MIT 开源，社区可贡献新评测任务

## 关联基准

- [SWE-bench](/benchmarks/swe-bench)：通用软件工程
- [BigCodeBench](/benchmarks/bigcodebench)：多库调用编码
- [WebApp1K](/benchmarks/webapp1k)：Web 应用生成
