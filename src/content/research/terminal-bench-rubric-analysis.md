---
title: "Terminal Bench Rubric 对比分析：如何设计 RL 友好的 Agent 评测标准"
description: "深度对比 TB-QA 与 TASK_IMPLEMENTATION_RUBRIC 两套评测体系，提炼 22 条 RL 训练适用的综合评审标准"
date: 2026-03-24
category: 综合调研
tags: ["Agent 评测", "RL 训练", "Benchmark 设计", "Rubric", "Terminal Bench", "Reward Signal"]
htmlVersion: "/research-html/terminal-bench-rubric-analysis.html"
draft: false
---

## 研究背景

在 LLM Agent 的 RL 训练中，**评测标准（Rubric）的设计质量直接决定了 reward signal 的可靠性**。Terminal Bench 项目中存在两套并行的评审体系：

- **TB-QA (Auto-QA)**：面向 LLM 自动质量检查，18 条规则，偏重实现质量
- **TASK_IMPLEMENTATION_RUBRIC.toml**：面向人工评审，19 条标准，偏重任务设计哲学

本报告对两套体系进行逐条拆解、交叉对比，并从 RL 训练视角提出综合推荐方案。

---

## 概览对比

| 维度 | TB-QA (Auto-QA) | TOML (Implementation Rubric) |
|------|------------------|------------------------------|
| 定位 | LLM 自动质量检查清单 | 人工评审标准 |
| 条目数 | 18 条 | 19 条 |
| 格式 | Markdown + Prompt Template + JSON 输出 | 结构化 TOML，含 PASS/FAIL 标准 |
| 使用方式 | LLM 逐条自动打分 | 人工审查指南 |
| 关注层面 | 偏**实现质量**（文件、依赖、格式合规） | 偏**任务设计**（难度、新颖性、Agent 特性） |

---

## TB-QA 原始条目（18 条）

TB-QA 的 18 条规则聚焦于任务实现的技术合规性：

| # | 条目 | 关注点 |
|---|------|--------|
| 1 | Typos / 拼写检查 | 文件名、变量名 |
| 2 | Reproducibility / 可复现性 | 工具、数据源、API 配置 |
| 3 | Pinned Dependencies / 依赖锁定 | Python 依赖版本 |
| 4 | Structured Data Schema | 结构化输出的 schema |
| 5 | Behavior → Task Instruction Match | 测试是否只检查指令描述的行为 |
| 6 | Requirements → Validation Match | 指令需求是否被测试覆盖 |
| 7 | Validation Discriminability | 测试区分度，能否拒绝错误答案 |
| 8 | Informative Test Structure | 测试脚本结构化和注释 |
| 9 | Task Structure Completeness (P1) | Harbor 格式合规 |
| 10 | Task Realism (P1) | 任务是否像真实工程工作流 |
| 11 | Test Validation False Negative | 正确解是否会被误判 |
| 12 | Test Dependencies in Image | 测试依赖是否装入镜像 |
| 13 | Offline Completability | 离线场景可完成性 |
| 14 | File Reference Mentioned | 输出文件名是否在指令中说明 |
| 15 | Solution Hardcoded | 解答是否硬编码 |
| 16 | Tests/Solution in Image | 测试/解答是否泄露到镜像 |
| 17 | Anti Cheating | 防 Agent 作弊 |
| 18 | Instruction Autonomy Level | 指令自主性级别 |

---

## TOML 原始条目（19 条）

TOML Rubric 从更高维度定义了"什么是好的 Benchmark 任务"：

| # | 条目 | 关注点 |
|---|------|--------|
| 1 | Verifiable / 可验证性 | 验证器确定性、可靠性 |
| 2 | Well Specified / 规格清晰 | 指令完整描述验证内容 |
| 3 | Solvable / 可解性 | 必须有可行解 |
| 4 | Difficult / 足够困难 | 需要博士级专业经验 |
| 5 | Interesting / 有趣实用 | 有真实世界应用价值 |
| 6 | Outcome Verified / 结果验证 | 验证结果不验证过程 |
| 7 | Anti-Cheat Robustness | 防对抗性快捷方式 |
| 8 | Functional Verification | 通过执行验证而非字符串匹配 |
| 9 | Deterministic & Reproducible | 确定性可复现 |
| 10 | Essential Difficulty / 本质难度 | 难度来自推理而非格式 |
| 11 | Test-Instruction Alignment | 指令与测试 1:1 映射 |
| 12 | Novel / 新颖性 | 不能是可记忆的标准题 |
| 13 | Agentic / Agent 特性 | 需要多步环境交互 |
| 14 | Reviewable / 可审查性 | 非专业人士可验证 |
| 15 | Instruction Clarity | 清晰、人工编写、绝对路径 |
| 16 | Solution Quality | 解答展示真实计算过程 |
| 17 | Environment Hygiene | 镜像干净、依赖管理规范 |
| 18 | Structured Data Schema | 结构化输出有完整 schema |
| 19 | Typos | 拼写检查 |

---

## 对比分析

### 高度重叠的标准

两套体系中有 8 组标准存在明确语义对应关系：

| 主题 | TB-QA 条目 | TOML 条目 | 差异 |
|------|-----------|-----------|------|
| 拼写检查 | Typos | typos | 完全一致 |
| 结构化数据 | Structured Data Schema | structured_data_schema | TOML 增加了 N/A 选项 |
| 防作弊 | Anti Cheating | anti_cheat_robustness | TOML 列举了更多攻击向量 |
| 解答质量 | Is Solution Hardcoded? | solution_quality | 一致 |
| 环境卫生 | Tests in Image + Test Deps | environment_hygiene | TB-QA 拆为两条 |
| 可复现性 | Reproducibility + Pinned Deps | deterministic_reproducible | TB-QA 拆为两条 |
| 指令对齐 | Behavior Match + Requirements Match | well_specified + test_alignment | 拆分方式不同 |
| 自主性 | Instruction Autonomy Level | outcome_verified + instruction_clarity | TOML 拆得更细 |

### TOML 独有标准（TB-QA 缺失）

这是两套体系最关键的差异——TOML 包含 9 条面向 **任务设计哲学** 的标准：

| 标准 | RL 训练意义 |
|------|------------|
| **Verifiable** | RL 基石——reward function 不可靠 = 训练拟合噪声 |
| **Solvable** | 不可解 = reward 永远为 0，稀疏奖励导致无法收敛 |
| **Difficult** | 太简单则 pass rate ~100%，梯度消失 |
| **Interesting** | 确保能力可迁移到真实场景 |
| **Functional Verification** | 防 reward hacking——模型学会插关键词而非解决问题 |
| **Essential Difficulty** | 确保 RL 梯度指向推理能力而非格式拟合 |
| **Novel** | 防止通过记忆获得 reward |
| **Agentic** | 单步可解使 RL 退化为 SFT |
| **Reviewable** | 降低审核成本，提高数据 pipeline 可扩展性 |

### TB-QA 独有标准（TOML 缺失）

| 标准 | RL 训练意义 |
|------|------------|
| **Validation Discriminability** | 测试太松 = 假阳性泛滥 = 模型学走捷径（**关键**） |
| **Test Validation False Negative** | 对正确行为给惩罚 = 错误梯度方向（**关键**） |
| Informative Test Structure | 偏工程规范，影响较小 |
| Task Structure Completeness (P1) | 纯格式合规，可 CI/CD 自动化 |
| Task Realism (P1) | 与 TOML 的 Interesting 部分重叠 |
| File Reference Mentioned | 被 test_instruction_alignment 隐含覆盖 |
| Offline Completability | 大部分被 deterministic_reproducible 覆盖 |

### 核心差异总结

| 维度 | TB-QA | TOML |
|------|-------|------|
| 设计视角 | 自下而上：文件有没有问题 | 自上而下：什么是好的 benchmark 任务 |
| 关注层面 | 偏**实现质量** | 偏**任务设计** |
| 粒度 | 更细，可直接自动化 yes/no 检测 | 更粗，每条需理解和判断 |
| 自动化适配 | 为 LLM 自动评分设计 | 为人工评审设计 |
| 难度/新颖性 | 缺失 | difficult + novel + agentic + essential_difficulty |
| Reward 质量 | Discriminability + False Negative | verifiable + functional_verification |

---

## RL 训练适用性分析

### 核心结论：以 TOML 为骨架 + 补充 TB-QA 两条关键项

**TOML 对 RL 至关重要的优势：**

- **verifiable** — RL 的基石。奖励函数不可靠 = 训练在拟合噪声
- **novel** — 防止模型通过记忆获得奖励。RL 应训练"思考"而非"回忆"
- **agentic** — 确保训练多步交互能力。单步可解使 RL 退化为 SFT
- **essential_difficulty** — 避免训练预算浪费在学格式细节上
- **difficult** — 太简单的任务 pass rate ~100%，无学习信号
- **functional_verification** — 防 reward hacking，RL 最严重的失效模式之一

**TB-QA 中对 RL 关键但 TOML 缺失的标准：**

- **Validation Discriminability** — reward signal 区分度。测试太松 = 错误解也得分
- **Test Validation False Negative** — 假阴性控制。对正确行为给惩罚 = 错误梯度方向

---

## 综合 Rubric 推荐方案（22 条）

基于以上分析，推荐以下分级标准体系：

### Critical（7 条）——对 RL 训练有直接影响

| # | 标准 | 来源 | 核心要义 |
|---|------|------|---------|
| 1 | Verifiable | TOML | 验证器必须确定性、可靠、高效 |
| 2 | Validation Discriminability | TB-QA | 测试必须能拒绝错误答案 |
| 3 | Test False Negative Control | TB-QA | 正确解不应因测试脆弱而失败 |
| 4 | Functional Verification | TOML | 通过执行验证而非字符串匹配 |
| 5 | Novel | TOML | 不能是可记忆的标准题 |
| 6 | Agentic | TOML | 需要多步环境交互 |
| 7 | Essential Difficulty | TOML | 难度来自推理而非格式 |

### High（10 条）——影响任务/数据质量

| # | 标准 | 来源 | 核心要义 |
|---|------|------|---------|
| 8 | Difficult | TOML | 需要专业经验 |
| 9 | Solvable | TOML | 必须有可行解 |
| 10 | Anti-Cheat Robustness | 合并 | 测试抵抗对抗性快捷方式 |
| 11 | Well Specified | 合并 | 指令完整描述验证行为 |
| 12 | Test-Instruction Alignment | 合并 | 需求与测试 1:1 映射 |
| 13 | Outcome Verified | 合并 | 验证结果不验证过程 |
| 14 | Deterministic & Reproducible | 合并 | 依赖锁定、结果一致 |
| 15 | Interesting | 合并 | 有真实世界应用价值 |
| 16 | Instruction Clarity | TOML | 清晰、人工编写 |
| 17 | Solution Quality | 合并 | 解答展示真实计算过程 |

### Medium（4 条）——工程规范

| # | 标准 | 来源 |
|---|------|------|
| 18 | Environment Hygiene | 合并 |
| 19 | Structured Data Schema | 合并 |
| 20 | Reviewable | TOML |
| 21 | Typos | 合并 |

### Low（1 条）——可选

| # | 标准 | 来源 |
|---|------|------|
| 22 | Offline Completability | TB-QA |

### 降级为 CI/CD 自动检查（不纳入核心 Rubric）

- **Task Structure Completeness (P1)** — 纯 Harbor 格式合规
- **Informative Test Structure** — 代码风格规范
- **Is File Reference Not Mentioned?** — 被 Test-Instruction Alignment 覆盖
