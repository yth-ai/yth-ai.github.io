---
title: "OSWorld：桌面操作系统 Agent"
description: "在真实 Ubuntu/Windows/macOS 环境中评估 Agent 完成桌面操作任务的能力"
date: 2024-04-01
benchName: "OSWorld"
org: "CMU & THU"
paper: "arXiv:2404.07972"
category: "Agent"
subcategory: "Computer Use Agent"
abilities: ["桌面操作", "GUI交互", "文件管理", "应用操作"]
dataSize: "369 tasks / 3 OS"
evalMethod: "标准评测"
metric: "Success Rate (%)"
topResults:
  - model: "Claude 3.5 + Screenshot"
    score: "12.2%"
  - model: "GPT-4V"
    score: "7.8%"
tags: ["Agent", "桌面", "GUI", "操作系统"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
OSWorld 是跨平台桌面操作的标准评测——模型需要在真实的 Windows/macOS/Linux 环境中通过截图理解界面、执行操作完成任务。这是 Computer Use Agent 的核心基准。

## 构建方式
1. 369 个桌面任务，覆盖 Windows/macOS/Linux 三个平台
2. 每个任务在真实的虚拟机中执行（不是模拟器）
3. 模型输入：桌面截图 + 任务描述；输出：鼠标点击坐标/键盘输入
4. 自动化状态检查判定任务是否完成

## 任务示例
**示例 1**："打开 Excel，将 A 列数据按升序排列，然后保存"
**示例 2**："在 Chrome 中打开书签管理器，将所有书签导出为 HTML 文件"
**示例 3**："跨应用操作：从邮件中复制附件中的表格数据，粘贴到 Excel 中"

## 关键发现
- 最强模型（Claude Computer Use）约 40-45%——远低于人类
- 跨应用操作是最大瓶颈（需要窗口切换和状态追踪）
- 截图分辨率处理是技术难点：高分辨率截图中的小按钮难以定位

## 关联基准
- [WindowsAgentArena](/benchmarks/windowsagentarena)：专注 Windows 平台
- [OSWorld-Verified](/benchmarks/osworld-verified)：人工验证子集
- [ScreenSpot](/benchmarks/screenspot)：GUI 元素定位基础能力
- [AndroidWorld](/benchmarks/androidworld)：移动端的对应评测

## 不足与展望
- 虚拟机性能有限，不能完全模拟真实桌面体验
- 任务时长偏短，缺乏长期桌面工作的评测
- Mac 和 Linux 的任务数量少于 Windows
