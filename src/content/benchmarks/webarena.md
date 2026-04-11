---
title: "WebArena / VisualWebArena：真实网页环境中的 Agent 评测"
description: "在真实网站（Reddit、GitLab、购物等）的沙箱副本中，评估 Agent 完成网页任务的能力"
date: 2024-07-01
benchName: "WebArena"
version: ""
org: "CMU"
paper: "arXiv:2307.13854"
code: "github.com/web-arena-x/webarena"
venue: "ICLR 2024"
website: "https://webarena.dev"
category: "Agent"
subcategory: "Web/Browser Agent"
abilities: ["网页导航", "表单填写", "信息检索", "多步规划", "视觉理解"]
dataSize: "812 tasks (WebArena) + 910 tasks (VisualWebArena)"
construction: "专家手工设计任务模板"
evalMethod: "功能正确性（URL/内容匹配）"
metric: "Task Success Rate (%)"
topResults:
  - model: "GPT-4o + SoM Agent"
    score: "35.8%"
    date: "2024-07"
  - model: "Claude 3.5 + BrowserUse"
    score: "42.1%"
    date: "2025-06"
  - model: "GPT-4 (text-only)"
    score: "14.4%"
    date: "2024-01"
tags: ["Agent", "网页浏览", "交互式", "GUI", "真实环境"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
WebArena 是最被广泛采用的 Web Agent 评测——在真实网站的沙箱环境中执行购物、GitHub 操作、Reddit 浏览等任务。是评测"AI 能不能帮你操作网页"的标准基准。

## 构建方式
1. 部署 4 个真实网站的本地沙箱：购物网站、GitLab、Reddit、地图
2. 812 个端到端任务，每个都有明确的成功判定条件
3. 模型可以用 DOM 或截图作为输入，输出是页面操作序列
4. 自动化验证：检查页面最终状态是否满足任务要求

## 任务示例
**购物**："搜索价格低于 $30 的无线鼠标，选择评分最高的，加入购物车"
**GitLab**："创建一个新的 issue，标题为 X，描述为 Y，分配给用户 Z"
**Reddit**："在 r/programming 发一个帖子，标题中包含 'Python'"

## 关键发现
- GPT-4V 约 15-20%，人类约 78%——差距巨大
- DOM 输入比纯截图输入好 ~10%（结构化信息更易处理）
- 多步任务（5+ 步）的完成率远低于短任务

## 关联基准
- [VisualWebArena](/benchmarks/visualwebarena)：视觉导向的扩展
- [WorkArena](/benchmarks/workarena)：企业级 ServiceNow 场景
- [Mind2Web](/benchmarks/mind2web)：跨网站泛化评测
- [BrowseComp](/benchmarks/browsecomp)：搜索信息而非操作界面

## 不足与展望
- 沙箱网站与真实网站有差距（简化了认证、验证码等）
- 没有测试动态页面（AJAX 加载、SPA 路由）
- 安全风险：Agent 操作网页可能导致误操作——WebArena 未评测安全性
