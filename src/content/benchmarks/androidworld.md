---
title: "AndroidWorld：真实 Android 设备任务"
description: "116 个在真实 Android 设备上执行的 App 操作任务，支持程序化验证结果"
date: 2024-05-01T00:00
benchName: "AndroidWorld"
org: "Google DeepMind"
paper: "arXiv:2405.14573"
code: "github.com/google-research/android_world"
category: "Agent"
subcategory: "Mobile Agent"
abilities: ["App操作", "手势交互", "跨App", "系统操作"]
dataSize: "116 tasks (可扩展)"
construction: "专家设计 + 程序化验证"
evalMethod: "程序化状态验证"
metric: "Task Success (%)"
topResults:
  - model: "GPT-4V + ReAct"
    score: "~33%"
    date: "2024-05"
  - model: "Human"
    score: "~80%"
    date: "2024-05"
tags: ["移动端", "Android", "Agent", "真机"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
AndroidWorld 是 Mobile Agent 的核心评测——在真实 Android 设备上执行 App 操作任务，不是截图模拟器。人类 ~80%，最强 Agent ~33%，是当前差距最大的 Agent 评测之一。

## 构建方式
1. Google DeepMind 开发，116 个真实 Android 设备任务
2. 在真实 Android 模拟器中运行（Pixel 设备 + 真实 App）
3. 模型通过 Accessibility API 或截图获取界面信息
4. 每个任务的成功判定都是**程序化验证**（不是人工评判）

## 任务示例
**简单**："在设置中开启深色模式"
**中等**："打开日历 App，在下周三创建一个 10:00 的会议"
**复杂**："从相册中选择最近拍的照片，通过微信发给联系人 XX"（跨 App）

## 关键发现
- 人类 ~80% vs 最强 Agent ~33%——差距巨大
- 跨 App 操作（需要从一个 App 切换到另一个）是最大瓶颈
- Accessibility API 输入比纯截图好 ~10%

## 关联基准
- [Mobile-Bench](/benchmarks/mobilebench)：更多维度（单 App/多 App/系统）
- [OSWorld](/benchmarks/osworld)：桌面端的对应评测
- [ScreenSpot](/benchmarks/screenspot)：GUI 元素定位基础能力

## 不足与展望
- 目前只支持 Android，iOS 评测缺失
- 没有测手势操作（滑动、缩放）
- 中文 App 覆盖不足——大部分任务基于英文 App
