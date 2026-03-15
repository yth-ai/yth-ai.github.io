# Maxwell YU · Personal Academic Homepage

> 预训练数据研发算法研究员 — 专注大语言模型预训练数据全链路研发

🌐 **Live Site**: [https://yth-ai.github.io](https://yth-ai.github.io) &nbsp;|&nbsp; 🇨🇳 [中文版](https://yth-ai.github.io/index.html) &nbsp;|&nbsp; 🇺🇸 [English](https://yth-ai.github.io/en.html)

---

## About

一个深色主题的个人学术主页，展示我在 LLM 预训练数据工程方向的研究工作与内容创作。纯 HTML/CSS/JS 构建，零依赖，无需构建工具，直接部署 GitHub Pages。

### ⚠️ 内容声明

站点中的**书籍**（《数据珠玑》《涌现》《和 AI 说话的秘密》《拆开 AI 的大脑》）与**综述报告**等内容，均为本人结合大语言模型辅助生成并整理而成，**仅供学习参考**，不代表最终学术成果。如引用请注意甄别，欢迎交流探讨。

---

## Features

- **纯静态站点** — 零依赖，无需构建，直接部署 GitHub Pages
- **深色主题** — 专业级暗色 UI，舒适阅读体验
- **双语支持** — 中文 (`index.html`) 与英文 (`en.html`) 独立页面
- **响应式设计** — 适配桌面与移动端
- **全文搜索** — 内置搜索，快速定位报告、综述、论文
- **内容丰富** — 涵盖书籍创作、综述报告、研究报告、开源项目、学术成果

---

## Content Overview

### 📚 书籍创作

| 书名 | 主题 | 章节 |
|------|------|------|
| **数据珠玑** | LLM 训练数据全景 | 12 章 |
| **涌现** | 大模型技术演进编年史 (2017–2025) | 24 章 |
| **和 AI 说话的秘密** | Prompt Engineering 指南 | 9 章 |
| **拆开 AI 的大脑** | LLM 技术原理科普 | 10 章 |

### 🔬 综述报告

- LLM Benchmark 综述 2025–2026（70+ benchmarks，8 大方向）
- LLM 数据合成综述 2025–2026
- 文档解析技术综述 2025–2026
- LLM 知识改写综述 2025–2026
- SimpleQA 失效深度分析
- Agent Mid-training / Data Optimization 综述

### 📝 研究报告

- 大语言模型预训练数据研发
- Mid-Training / Long-context / Agentic Coding 技术报告
- Terminal Agent & Terminal-Bench 研究
- SAE 可解释性与数据筛选

### 🚀 开源项目

- **混元 A13B** — 腾讯混元开源大模型，MoE 架构

### 🎓 学术成果

- 发表于 ACL、EMNLP、NeurIPS 等顶级会议
- 研究方向：Pre-training Data, Instruction Tuning, Math Reasoning, Code LLM

---

## Project Structure

```
├── index.html                          # 中文主页
├── en.html                             # English version
├── avatar.jpg                          # 头像
├── 数据珠玑/                             # 《数据珠玑》12 章
├── 涌现/                                # 《涌现》24 章
├── llm_book/                           # 其他书籍页面
├── llm_benchmark_survey.html           # Benchmark 综述
├── llm_data_synthesis_survey.html      # 数据合成综述
├── document_parsing_survey.html        # 文档解析综述
├── knowledge_rewriting_survey.html     # 知识改写综述
├── pretraining_rewriting_survey.html   # 预训练知识合成改写
├── simpleqa_failure_analysis.html      # SimpleQA 失效分析
├── factual_knowledge_synthesis_slides.html  # 事实知识合成对比
├── agent_midtraining_survey.html       # Agent 中训练综述
├── agent_data_optimization_survey.html # Agent 数据优化
├── 预训练数据研发_研究报告.html           # 预训练数据研发报告
├── pretrain_data_survey.html           # 预训练数据研究综述
├── midtrain_research_report.html       # Mid-Training 报告
├── long_context_data_research_report.html  # 长文本数据报告
├── agentic_coding_research_report.html # Agentic Coding 报告
├── Terminal_Agent_技术报告.html          # Terminal Agent 报告
├── terminal_bench_training_data.html   # Terminal-Bench 数据
├── llm_development_history.html        # 大模型发展全景
├── llm_rubric_report.html              # Rubric 评估综述
├── sae_data_selection_report.html      # SAE 数据筛选
└── README.md
```

---

## Local Preview

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deployment

本仓库通过 GitHub Pages 自动部署，推送到 `main` 分支后即可访问：

```
https://yth-ai.github.io
```

---

## Tech Stack

HTML5 / CSS3 (Variables, Flexbox, Grid) / Vanilla JS — No frameworks, no build tools, no dependencies.

---

## License

MIT

---

<p align="center">
  <em>"好数据是判断出来的，不是过滤出来的。"</em>
</p>
