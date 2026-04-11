---
title: "HARP"
description: "基于美国数学竞赛的人工标注数学推理基准，4780 道题覆盖 1950-2024 年竞赛"
date: 2024-12-12T12:00
benchName: "HARP"
version: ""
org: "UCL"
paper: "2412.08819"
code: "https://github.com/aadityasingh/HARP"
venue: ""
website: ""
category: "推理"
abilities: ["数学推理", "竞赛数学", "短答题"]
dataSize: "4780 道短答题（1950-2024 年美国国家数学竞赛）"
construction: "人工标注（Human Annotated Reasoning Problems）"
evalMethod: "短答准确率评估"
metric: "准确率"
topResults:
  - model: "前沿模型"
    score: "高于 MATH 但仍具挑战性"
    date: "2024-12"
tags: ["数学竞赛", "数学推理", "人工标注", "AMC/AIME"]
status: "active"
importance: 3
saturation: "未饱和"
---

HARP（Human Annotated Reasoning Problems）是一个面向数学推理的高难度基准。随着 MATH 基准逐渐饱和，需要更具挑战性的评测。HARP 包含 4780 道短答题，来源于 1950 年至 2024 年的美国国家数学竞赛（包括 AMC、AIME 等），全部经过人工标注。

与 MATH 不同，HARP 的题目难度跨度更大（从入门竞赛到高难度国家赛），时间跨度覆盖 74 年，提供了更丰富的数学推理评测维度。评估多个前沿模型的结果表明，虽然模型在 HARP 上的表现优于已接近饱和的 MATH 基准，但仍远未达到人类竞赛选手的水平。开源于 GitHub。
