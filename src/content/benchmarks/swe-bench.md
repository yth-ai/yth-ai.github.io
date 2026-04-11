---
title: "SWE-bench：LLM 解决真实 GitHub Issue 的能力"
description: "从 12 个流行 Python 仓库中提取的 2,294 个真实 GitHub issue + PR，评估模型自动修复代码的能力"
date: 2024-10-01
benchName: "SWE-bench"
version: "Verified (300 subset)"
org: "Princeton NLP"
paper: "arXiv:2310.06770"
code: "github.com/princeton-nlp/SWE-bench"
venue: "ICLR 2024"
website: "https://www.swebench.com"
category: "代码生成"
subcategory: "仓库级"
abilities: ["代码修复", "仓库理解", "Issue 解决", "测试生成"]
dataSize: "2,294 instances (Verified: 300)"
construction: "从真实 GitHub 仓库自动提取"
evalMethod: "执行测试用例"
metric: "% Resolved"
topResults:
  - model: "Claude Mythos Preview"
    score: "93.9%"
    date: "2026-04"
  - model: "GPT-5.3 Codex"
    score: "85.0%"
    date: "2026-04"
  - model: "Claude Opus 4.5"
    score: "80.9%"
    date: "2026-04"
  - model: "Claude Opus 4.6"
    score: "80.8%"
    date: "2026-04"
  - model: "GPT-5.2"
    score: "80.0%"
    date: "2026-04"
tags: ["软件工程", "代码修复", "Agent", "GitHub", "Python"]
status: "active"
importance: 5
saturation: "未饱和"
---
## 为什么重要

SWE-bench 是衡量 LLM 解决**真实软件工程问题**的黄金标准。不是合成的编程题，而是从 Django、Flask、scikit-learn 等知名项目中抽取的真实 bug report + 对应的 pull request。模型需要理解整个仓库上下文，定位问题代码，生成修复补丁，并通过原有测试用例。

## 构建方式

1. 从 12 个流行 Python 仓库（Django、Flask、scikit-learn、sympy 等）的 GitHub 历史中收集 issue + 对应的 PR
2. 每个实例包含：issue 描述、仓库快照（checkout 到 bug 存在时的 commit）、对应 PR 的 patch、验证用的测试用例
3. 模型需要在仓库快照的基础上生成 patch，然后通过自动化测试验证
4. **Verified 子集**（300 题）：由 OpenAI 工程师逐一审核，排除了歧义和噪声

## 任务示例

**示例 1**（Django）：
> Issue: "QuerySet.union() 在使用 annotate() 后结果不正确"
> 模型需要：定位 `django/db/models/sql/query.py` 中的 union 逻辑 → 理解 SQL 生成的上下文 → 修改 annotation 处理逻辑 → 通过 15 个回归测试

**示例 2**（scikit-learn）：
> Issue: "KMeans 在 sparse matrix 输入时内存泄漏"
> 模型需要：阅读整个 KMeans 实现 → 找到 sparse matrix 特殊路径中的内存分配问题 → 修复 → 通过性能回归测试

## 关键发现

- 仓库级代码理解是核心瓶颈：模型需要理解跨文件依赖、API 约定、测试框架
- Agent 框架（SWE-agent、OpenHands）比纯 LLM 生成高 2-3 倍
- o3 + Codex 达到 69.1%，证明推理+代码能力的结合是关键
