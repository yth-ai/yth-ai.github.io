---
title: "ScreenSpot：GUI 元素精确定位"
description: "1272 个跨平台（桌面/Web/移动端）的截图 UI 元素定位任务，是 GUI Agent 的基础能力评测"
date: 2024-01-01T00:00
benchName: "ScreenSpot"
version: "ScreenSpot-Pro"
org: "多校"
paper: "arXiv:2401.13649"
website: "https://gui-agent.github.io/grounding-leaderboard/"
category: "Agent"
subcategory: "GUI Agent"
abilities: ["UI元素定位", "截图理解", "坐标预测"]
dataSize: "1272 screenshots"
construction: "跨平台截图标注"
evalMethod: "坐标准确率"
metric: "Accuracy (%)"
topResults:
  - model: "UI-TARS-72B"
    score: "87.2%"
    date: "2025-06"
  - model: "GPT-4V + SoM"
    score: "~75%"
    date: "2024-01"
tags: ["GUI", "元素定位", "截图", "坐标"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
ScreenSpot 是 GUI Agent 的基础能力评测——给一张截图 + "点击设置按钮" 的指令，模型需要输出精确的像素坐标。这是所有 GUI/Computer Use/Mobile Agent 的前置能力。

## 构建方式
1. 1272 个跨平台（桌面/Web/移动端）的截图-指令对
2. 每个样本：截图 + 自然语言描述 → 目标 UI 元素的精确坐标
3. ScreenSpot-Pro 扩展到高分辨率专业软件（Photoshop/Excel 等）
4. 覆盖多种 UI 元素：按钮、输入框、下拉菜单、图标等

## 任务示例
**简单**：[截图：设置页面] "点击'Wi-Fi'选项" → (x=180, y=320)
**中等**：[截图：复杂表单] "点击'提交订单'按钮" → 需要在密集 UI 中定位
**困难**：[截图：代码编辑器] "点击第 47 行的断点标记" → 需要极精确的坐标

## 关键发现
- UI-TARS-72B 达 87.2%（专门针对 GUI 微调的模型）
- 通用模型 GPT-4V ~75%——专用微调提升 12%
- Pro 版在高分辨率截图上难度大增（小按钮的像素级定位）

## 关联基准
- [OSWorld](/benchmarks/osworld)：定位之后的下一步——完成整个任务
- [AndroidWorld](/benchmarks/androidworld)：移动端的类似评测
- [GUI-Odyssey](/benchmarks/gui-odyssey)：跨 App 长序列操作

## 不足与展望
- 主要测"定位"，不测"理解"（模型可能找到按钮但不理解其功能）
- 截图是静态的，不测动态界面（下拉菜单展开、tooltip 等）
- 不同设备分辨率导致的泛化问题——同一界面在手机和桌面上看起来很不同
