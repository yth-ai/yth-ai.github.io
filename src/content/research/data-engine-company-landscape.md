---
title: "Data Engine 全景：AI 训练数据公司深度调研"
description: "系统梳理 15 家国外主要 AI 训练数据公司的 Data Engine 定位、核心产品、技术差异和商业模式。覆盖人工标注、合成数据、开源工具、Agent 专项四条路线，并给出 Agent 数据团队的实操启示。"
date: 2026-03-31T15:00
category: 综合调研
tags: ["Data Engine", "Scale AI", "数据标注", "合成数据", "RLHF", "Agent数据", "行业分析"]
draft: false
---

## 前言：Data Engine 是什么定位

「Data Engine」是数据公司用来描述**数据生产工业化基础设施**的定位词。核心含义：不是某一批数据，而是让数据持续生产、持续改善模型的系统能力。

类比：Game Engine 不是某款游戏，而是让游戏能被高效制造的底层系统。Data Engine 同理——它让「模型部署 → 发现问题 → 生产数据 → 改善模型」这个飞轮能自动转。

本文覆盖 15 家公司，分四条路线：

| 路线 | 代表公司 | 核心特点 |
|------|---------|---------|
| **人工标注+平台** | Scale AI, Appen, Surge AI, Invisible Technologies, Toloka | 依赖人类专家/众包，质量高 |
| **SaaS 工具型** | Labelbox, Snorkel AI, SuperAnnotate, Humanloop | 平台工具，客户自建数据团队 |
| **合成数据为主** | Gretel.ai, Mostly AI | AI 生成数据，隐私合规 |
| **开源/模型公司** | Argilla, Hugging Face, Cohere | 开源工具或模型公司自建数据能力 |

---

## 横向对比总表

| 公司 | 路线 | 官网 | RLHF/偏好数据 | Agent/代码数据 | 合成数据 | 开源 | 定价区间 | 核心差异点 |
|------|------|------|:---:|:---:|:---:|:---:|------|---------|
| **Scale AI** | 人工+平台 | [scale.com](https://scale.com/data-engine) | ✅ 强 | ✅ 强 | 部分 | ❌ | $$$$ | 规模最大，专家网络最成熟，头部模型公司标配 |
| **Surge AI** | 专家标注 | [surgehq.ai](https://surgehq.ai) | ✅ 极强 | ✅ 中 | ❌ | ❌ | $$$$$ | 标注员质量业界最高，RLHF 细粒度 |
| **Invisible Tech** | 人工+AI | [invisibletech.ai](https://invisibletech.ai) | ✅ 强 | ✅ 强 | ❌ | ❌ | $$$$ | 人+AI 混合运营，Agent 工作流数据 |
| **Toloka** | 众包平台 | [toloka.ai](https://toloka.ai) | ✅ 中 | ⚠️ 弱 | ❌ | 部分 | $$ | 全球众包，学术友好，API 灵活 |
| **Appen** | 众包网络 | [appen.com](https://appen.com) | ⚠️ 弱 | ⚠️ 弱 | ❌ | ❌ | $$ | 多语言覆盖无敌（300+语言） |
| **Labelbox** | SaaS 工具 | [labelbox.com](https://labelbox.com) | ✅ 中 | ⚠️ 弱 | ❌ | ❌ | $$$ | 数据工厂全链路，企业级权限管理 |
| **Snorkel AI** | 程序化标注 | [snorkel.ai](https://snorkel.ai) | ✅ 中 | ⚠️ 弱 | 部分 | 部分 | $$$ | 弱监督标注函数，Data-Centric AI |
| **SuperAnnotate** | SaaS 工具 | [superannotate.com](https://superannotate.com) | ✅ 中 | ⚠️ 弱 | ❌ | ❌ | $$$ | 多模态标注最强，GenAI 评估 |
| **Humanloop** | LLM 开发 | [humanloop.com](https://humanloop.com) | ✅ 强 | ✅ 中 | ❌ | ❌ | $$ | Prompt 管理+评估+RLHF 一体化 |
| **Gretel.ai** | 合成数据 | [gretel.ai](https://gretel.ai) | ⚠️ 间接 | ✅ 中 | ✅ 核心 | 部分 | $$ | 隐私合规合成数据，表格/代码强 |
| **Mostly AI** | 合成数据 | [mostly.ai](https://mostly.ai) | ❌ | ❌ | ✅ 核心 | 部分 | $$ | 结构化/表格合成数据，欧洲隐私合规 |
| **Argilla** | 开源工具 | [argilla.io](https://argilla.io) | ✅ 强 | ✅ 中 | ✅ distilabel | ✅ | 免费 | HF 生态深度整合，合成数据管线 |
| **Hugging Face** | 开源生态 | [huggingface.co](https://huggingface.co) | ✅ 强 | ✅ 中 | ✅ | ✅ | 免费/$ | 数据集托管+工具+社区三位一体 |
| **Cohere** | 模型公司 | [cohere.com](https://cohere.com) | ✅ 强 | ✅ 中 | 部分 | 部分 | $$$ | 模型+数据自建，Aya 多语言数据集 |

> 定价说明：$ = 免费或极低 / $$ = 中低 / $$$ = 中高 / $$$$ = 高 / $$$$$ = 极高

---

## 第一梯队：人工标注 + 平台

### 1. Scale AI — 行业标杆

**成立**：2016 · 估值 $140 亿（2024）· [scale.com/data-engine](https://scale.com/data-engine)

**核心产品**：
- **Scale Data Engine**：旗舰产品。24 万+ 标注人员网络，涵盖领域专家（医疗/法律/代码/数学）
- **Scale RLHF**：专为 LLM post-training 设计——偏好标注、指令跟随评估、有害内容审核
- **Scale Generative AI**：SFT 数据生成、DPO 对比数据、红队测试
- **Scale Eval**：自动+人工混合模型评估
- **Scale Donovan**：政府/国防 AI 应用平台

**技术特性**：
- AI-assisted labeling：AI 生成候选 → 人做裁判/修正（不再纯人工）
- Active Learning：优先标注模型最不确定的样本
- 专家三档制：普通众包 / 领域专家 / PhD 级专家
- 数据飞轮：`模型上线 → 监控 hard cases → 定向标注 → 模型更新 → 继续监控`

**客户**：OpenAI（GPT RLHF）、Meta（LLaMA）、Microsoft、美国国防部、丰田

✅ 规模最大，与头部模型公司深度绑定，专家网络最成熟
❌ 成本极高（SFT 数据可达 $50+/条），中小团队难以使用

---

### 2. Surge AI — RLHF 质量之王

**成立**：2020 · Edwin Chen（前 Twitter 数据科学家）· [surgehq.ai](https://surgehq.ai)

**核心产品**：
- 严格筛选高质量标注员（$15-25/h，远高于众包的 $2-5/h）
- RLHF 专项：模型对比界面、偏好收集、评分 rubric 管理
- 深度审核标注员：学历、专业背景、英语写作测试
- 要求标注员理解任务目标，而非机械执行

**与 Scale 的差异**：Scale 大而全，Surge 小而精。Surge 的 RLHF 偏好数据在细节质量上被认为优于 Scale，但产能低。

✅ 标注员质量业界最高，RLHF 偏好数据和复杂推理评估极强
❌ 规模小，无法承接超大体量项目

---

### 3. Invisible Technologies — 人+AI 混合运营

**成立**：2015 · [invisibletech.ai](https://invisibletech.ai)

**核心产品**：
- **人+AI 混合模式**：不单纯众包，也不单纯自动化——将复杂任务拆解为人和 AI 各自擅长的子步骤
- 支持：多轮对话标注、Agent 工作流数据构建、代码审查
- 训练数据涵盖：SFT / RLHF / 工具调用 / 多步推理轨迹
- 全球运营团队 2000+，兼具标注员和流程工程师

**差异化**：最接近「Agent 数据工厂」的定位。不只标注静态数据，还能构建多步骤工作流执行轨迹——这正是 Agent 训练最需要的。

✅ Agent/工作流数据构建能力强，人+AI 拆解复杂任务
❌ 知名度不如 Scale，客户案例公开较少

---

### 4. Toloka — 学术友好的全球众包

**成立**：2014 · 前身 Yandex 内部标注平台 · [toloka.ai](https://toloka.ai)

**核心产品**：
- 全球众包标注平台，数十万标注员
- API-first 设计：研究者可编程控制任务分发和质量检测
- 支持：文本/图像/视频/音频标注，偏好排序
- **Toloka for LLM**（2024 新增）：RLHF 偏好数据、SFT 评估

**差异化**：学术界使用最多的商业标注平台。API 灵活，定价透明，小批量实验友好。

✅ API 灵活，学术友好，按任务量计费无门槛
❌ 标注员专业度不如 Scale/Surge，复杂推理任务质量较差

---

### 5. Appen — 老牌众包，多语言之王

**成立**：1996 · 澳大利亚上市（ASX: APX）· [appen.com](https://appen.com)

**核心产品**：
- 全球 100 万+ 标注员，180+ 国家，300+ 语言
- 多语言/方言数据收集是真正差异化：斯瓦希里语、尼泊尔语、粤语、闽南语等稀缺语言
- 质量控制：测试题、标注者分级、欺诈检测

**现状**：2021-2024 营收大幅下滑（从 4 亿降至 ~1 亿澳元），受 AI 自动标注冲击。大客户自建标注团队后缩减外包。

✅ 多语言覆盖无人匹敌，低资源语言数据首选
❌ 技术平台老化，难以服务 LLM post-training 的高难度需求

---

## 第二梯队：SaaS 工具型

### 6. Labelbox — 数据工厂 SaaS

**成立**：2018 · 融资 $1.9 亿 · [labelbox.com](https://labelbox.com)

**核心产品**：
- **Labelbox Platform**：多模态标注工具（图像/视频/文本/音频/DICOM 医疗影像/地理空间）
- **Model-Assisted Labeling**：现有模型预标注 → 人工修正，Active Learning 集成
- **RLHF Workflows**（2023+）：偏好排序、对话质量评估、DPO 对比对构建
- **Labelbox Catalog**：数据集版本管理、血缘追踪，对接 HF / AWS / GCP

**理念**：不只是标注工具，而是整个数据生产线管理系统。客户自带标注团队或外包，Labelbox 提供工厂基础设施。

✅ 工具功能最全面，企业级权限管理成熟，混合标注模式灵活
❌ 自身不提供标注服务，需客户自建或外包团队

---

### 7. Snorkel AI — 程序化标注创新者

**成立**：2019 · 斯坦福 AI Lab（Alex Ratner）孵化 · 融资 $2.35 亿（2025 Series D $1 亿）· [snorkel.ai](https://snorkel.ai)

**学术根基**：源自 2016 年斯坦福 Snorkel 开源项目（VLDB 2018），商业产品 Snorkel Flow 为闭源 SaaS。客户包括 Google、Apple、Intel、多家银行和政府机构。

**核心产品**：

**① Snorkel Flow — 程序化标注（Programmatic Labeling）**

这是 Snorkel 最独特的技术。传统方式雇人逐条标注，Snorkel 让领域专家编写「标注函数」批量自动标注：

```python
# 标注函数 1：关键词规则
def lf_keyword_positive(text):
    if any(w in text for w in ["excellent", "amazing", "love"]):
        return "POSITIVE"
    return ABSTAIN  # 不确定就不标

# 标注函数 2：调用外部模型
def lf_sentiment_model(text):
    score = pretrained_sentiment(text)
    if score > 0.9: return "POSITIVE"
    elif score < 0.1: return "NEGATIVE"
    return ABSTAIN

# 标注函数 3：正则规则
def lf_regex_complaint(text):
    if re.search(r"refund|return|broken", text):
        return "NEGATIVE"
    return ABSTAIN
```

每个函数单独看都不完美（覆盖率低、有噪声），但 Snorkel 的 **Label Model** 会学习每个函数的准确率和相关性，综合投票产出最终标签 + 置信度。一个专家写 20-50 个标注函数 ≈ 人工标注数万条数据的信息量。

**② Snorkel Evaluate — 程序化评估**

同样的标注函数理念，用于评估模型输出：

- **切片分析（Slice-based evaluation）**：不只看整体准确率，而是按任务类型/难度/工具类型等维度自动拆分，找出系统性弱点（如「数据库查询类任务准确率 62%，文件操作类 91%」）
- **LLM-as-Judge 集成**：用强模型自动打分，Snorkel 管理评估 prompt 和结果聚合
- **RAG 评估**：检索质量（召回率/相关性）+ 生成质量（忠实度/完整度）联合评估
- **一致性分析**：自动发现评估规则之间的矛盾

**③ Expert Data-as-a-Service（2025+）**：医疗/法律/金融领域专家标注服务。

**使用方式**：SaaS 云端或 VPC 私有部署（金融/政府客户），网页界面 + Python SDK。

**定价**：不公开，企业合同起步约 $10 万+/年。开源版 snorkel（GitHub）可免费用但功能有限。

✅ 程序化标注独特，切片评估能精准定位弱点，学术底蕴强，企业客户成熟
❌ 学习曲线陡峭（需工程师写函数），对创意/主观 RLHF 任务效果有限，价格高

---

### 8. SuperAnnotate — 多模态标注最强

**成立**：2018 · 融资 $3700 万 · [superannotate.com](https://superannotate.com)

**核心产品**：
- 多模态标注平台：图像分割/3D 点云/视频/文本/音频
- **GenAI 数据管线**（2024+）：LLM 评估、RLHF 偏好数据、对话质量标注
- ML Pipeline 集成：与 AWS / GCP / Azure / Databricks 对接
- 工作流引擎：多级审核 + 自动化质检

✅ 计算机视觉标注工具极强（像素级分割领先），GenAI 功能快速迭代
❌ LLM/Agent 数据方面起步较晚，不如 Scale/Surge 深度

---

### 9. Humanloop — LLM 应用的 DevOps 层

**成立**：2020 · 伦敦 · YC 孵化 · 融资约 $3000 万 · Raza Habib（前 DeepMind）创立 · [humanloop.com](https://humanloop.com)

**本质**：不是标注平台，而是嵌入 LLM 应用开发流程的中间件——管 Prompt、管评估、管线上反馈闭环。类似 LaunchDarkly 之于功能开关，Humanloop 之于 LLM 管理。

**核心产品**：

**① Prompt 管理**
- 所有 prompt 托管在 Humanloop，版本控制（类 Git，每次改动自动记录 diff）
- A/B 测试：两个 prompt 版本同时上线，自动分流对比效果
- 协作：产品经理在网页界面改 prompt，不用碰代码，改完直接生效

**② 评估系统（Evaluation）**
- 离线评估：准备测试用例，跑不同 prompt/模型版本，自动对比输出质量
- LLM-as-Judge：配置评估 prompt（如「这个回答是否准确？1-5 分」），让 GPT-4 自动打分
- 人工评估：把输出推给内部审核员在网页界面打分
- 评估结果自动汇入仪表盘，按模型版本/prompt 版本/时间段切分

**③ 线上监控 + 反馈收集**
- SDK 嵌入应用（Python/JS/API），每次 LLM 调用自动记录输入、输出、延迟、token 数
- 用户反馈收集：👍👎 / 评分 / 文字纠正 → 直接关联对应的 LLM 调用记录
- 回归检测：模型更新后自动比较新旧版本指标，防止回退

**④ Fine-tuning 数据管线**
- 线上好案例（用户👍）→ 自动整理成 SFT 训练格式
- 线上坏案例（用户纠正）→ 可作为 DPO 的 rejected 样本
- 完成「线上反馈 → 训练数据 → 模型改进 → 再上线」的闭环

**SDK 示例**：
```python
from humanloop import Humanloop
hl = Humanloop(api_key="xxx")

# 调用时自动记录
response = hl.chat(
    project="my-agent",
    model="gpt-4",
    messages=[{"role": "user", "content": "帮我查明天天气"}]
)

# 收集用户反馈
hl.feedback(log_id=response.id, type="rating", value="good")
```

**定价**：免费版 1000 条日志/月 → Pro $99/月起 → Enterprise 定制。

✅ LLM 应用开发+数据收集+评估一体化，接入成本低，实时反馈飞轮
❌ 不提供标注员网络，不适合大规模离线标注，依赖应用已有用户流量

---

## 第三梯队：合成数据

### 10. Gretel.ai — 合成数据领头羊

**成立**：2019 · 融资 $1.2 亿 · [gretel.ai](https://gretel.ai)

**核心产品**：
- **Gretel Navigator**：自然语言驱动合成数据集生成（表格/文本/代码/时序）
- **Gretel Synthetics**：多模型库（DGAN/LSTM/GPT-based/Tabular Transformers），内置差分隐私
- **Gretel Evaluate**：真实感（Fidelity）+ 隐私（Privacy）+ 实用性（Utility）三维评分
- NVIDIA NeMo 集成：可直接为 LLM 训练生成合成数据

**差异化**：隐私优先设计。满足 GDPR/HIPAA，特别适合医疗/金融等合规场景。代码数据合成能力在 2025 年后显著增强。

✅ 隐私合规合成数据最完整，表格/代码数据合成领先
❌ 生成文本数据质量不如真实人工标注，复杂推理类效果差

---

### 11. Mostly AI — 欧洲隐私合规

**成立**：2017 · 维也纳 · [mostly.ai](https://mostly.ai)

**核心产品**：
- 结构化/表格数据合成：支持关系型数据库多表联合合成
- 差分隐私保障 + 自动质量评估
- 免费版支持 10 万行数据，企业版不限量

**差异化**：欧洲公司，对 GDPR 合规的理解和实现最成熟。专注表格/结构化数据，不做文本/代码。

✅ 结构化数据合成成熟，GDPR 合规最强
❌ 不支持文本/代码合成，与 Agent 数据关系较远

---

## 第四梯队：开源 / 模型公司自建

### 12. Argilla — 开源标注 + 合成数据管线

**成立**：2021 · 2024 年被 Hugging Face 收购 · [argilla.io](https://argilla.io)

**核心产品**：
- **Argilla 开源平台**：文本标注、RLHF 偏好排序、HHH 评分、数据集管理
- **distilabel**：Python 库，构建大规模合成数据管线。支持 Self-Instruct / Evol-Instruct / UltraFeedback / Magpie 等主流方法，对接任意 LLM
- HF Hub 深度集成：标注数据直接推送到 Hub

**代表性数据集**（用 Argilla+distilabel 构建）：
- UltraFeedback（64K GPT-4 偏好对，被 Mistral/Zephyr 广泛使用）
- Magpie-Pro-1M（100 万条指令数据）
- SmolLM 训练数据

✅ 完全开源免费，distilabel 是最易用的合成数据管线工具
❌ 企业级功能弱，无专业标注员网络

---

### 13. Hugging Face — 数据集+工具+社区

[huggingface.co](https://huggingface.co)

- 收购 Argilla 后具备完整数据标注能力
- **FineWeb / FineWeb-Edu**：基于 Common Crawl 的高质量预训练数据过滤管线
- **Magpie**：LLM 自回归生成指令数据框架，无需种子任务
- HF Hub 上托管最多公开 AI 训练数据集，是事实上的数据集基础设施

---

### 14. Cohere — 模型公司自建数据

[cohere.com](https://cohere.com)

- 内部专业标注团队（Code/RLHF 方向）
- **Cohere Aya**：覆盖 101 种语言的指令跟随数据集（2024 发布），众包+研究员联合构建
- Command 系列模型的 RLHF 数据主要自建
- 代表趋势：**模型公司自建 Data Engine，减少对第三方依赖**

---

## 行业五大趋势

**趋势一：AI 辅助标注替代纯人工标注**
标注员的工作从「打标签」变成「裁判/修正 AI 输出」。成本下降，但对标注员要求更高——需要判断 AI 输出的好坏。Scale AI 称这为「RLHF 飞轮」。

**趋势二：合成数据侵蚀低端人工标注**
Alpaca / Evol-Instruct / Magpie 等方案让基础 SFT 数据成本趋近于零。人工标注的价值集中于：高难度推理、细粒度偏好、领域专业知识。「合成生成 + 专家验证」的混合模式正成为主流。

**趋势三：数据公司向「评估」延伸**
Scale Eval、Snorkel Evaluate、Labelbox 评估功能——都在往「数据 + 评估」一体化走。训练数据和评估数据由同一供应商提供更高效，且评估数据的价值密度更高。

**趋势四：模型公司自建 Data Engine**
OpenAI / Anthropic / Meta / Google 都在自建数据团队。但高难度、高专业性数据（医疗/法律/代码 review）仍大量外包。Scale 的应对：押注政府/国防合同。

**趋势五：开源数据工具崛起**
Argilla / distilabel 让中小团队以极低成本构建数据管线。HF Hub 大幅降低进入门槛。数据生产的长尾被开源填充，头部专业数据价值进一步凸显。

---

## Agent 数据团队的启示

以下假设你的团队以 **Agent 训练数据**为核心方向（代码 Agent、工具调用 Agent、多步推理 Agent 等），给出实操建议。

### 一、Agent 数据的特殊性

Agent 数据与传统 SFT/RLHF 数据有本质差异：

| 维度 | 传统 LLM 数据 | Agent 数据 |
|------|-------------|-----------|
| 结构 | 单轮/多轮对话 | 多步骤执行轨迹（thought → action → observation → ...） |
| 标注对象 | 回答质量 | 决策质量 + 执行正确性 + 恢复能力 |
| 评估方式 | 人工偏好排序 | 端到端执行成功率 + 中间步骤质量 |
| 数据来源 | 人写/AI 生成 | 真实环境交互日志 + 模拟环境执行 |
| 关键挑战 | 多样性、偏好对齐 | 工具调用准确性、错误恢复、长程规划 |

### 二、推荐的技术路线组合

**不建议**只依赖一家公司。推荐按数据类型分层组合：

```
┌─────────────────────────────────────────────────┐
│ 第 1 层：合成数据批量生产（低成本、高规模）          │
│ • Argilla distilabel 构建合成指令+工具调用数据     │
│ • Gretel.ai 生成代码执行轨迹合成数据               │
│ • 自建 sandbox 环境录制 Agent 交互轨迹             │
├─────────────────────────────────────────────────┤
│ 第 2 层：专家标注高质量种子数据（高成本、高质量）     │
│ • Scale AI / Surge AI 标注复杂推理+工具选择偏好    │
│ • Invisible Tech 构建多步工作流执行轨迹数据         │
├─────────────────────────────────────────────────┤
│ 第 3 层：线上反馈飞轮（持续改进）                    │
│ • Humanloop 收集用户实时反馈                       │
│ • 自建监控：记录 Agent 失败 case → 定向补数据       │
└─────────────────────────────────────────────────┘
```

### 三、具体行动建议

**1. 先建内部 Data Engine，再按需外采**

不要一上来就找外包。Agent 数据的质量极度依赖对业务场景的理解，外部标注员很难把握。

- 用 Argilla + distilabel 搭建内部合成数据管线
- 用 Snorkel 的程序化标注思路：编写规则批量标注 Agent 执行日志
- 在 sandbox 环境中批量运行 Agent，自动记录轨迹数据

**2. 外采聚焦「人类难以合成」的数据**

合成数据能解决规模问题，但以下数据只能靠人：
- **偏好判断**：两个 Agent 策略哪个更好？需要专家打分 → Scale/Surge
- **错误恢复数据**：Agent 犯错后如何修正？需要人类演示正确恢复路径 → Invisible Tech
- **红队对抗**：刻意制造陷阱输入，测试 Agent 鲁棒性 → Scale 红队服务

**3. 评估先行，数据生产跟上**

Agent 数据最大的坑是「产了一堆数据但不知道好不好」。

- 先建评估体系（端到端成功率 + 步骤质量 + 工具调用准确率）
- 用 Humanloop / Snorkel Evaluate 做持续评估
- 评估结果反向驱动数据需求：哪类任务成功率低 → 补对应数据

**4. 关注工具调用数据的特殊构建方法**

Agent 的核心能力是工具调用。这类数据构建推荐：

- **API 文档 → 合成调用数据**：用 distilabel 基于真实 API 文档批量生成（function_name, args, expected_result）三元组
- **执行轨迹回放**：在 sandbox 中运行 Agent，记录完整的 tool_call chain，人工标注关键决策点的质量
- **失败案例挖掘**：从线上 Agent 日志中提取失败的 tool_call，标注正确的调用方式

**5. 预算分配参考**

| 数据类型 | 占比 | 来源 | 单条成本估算 |
|---------|------|------|------------|
| 合成指令+工具调用 | 60% | 自建 distilabel | ~$0.01-0.05 |
| 执行轨迹（sandbox） | 15% | 自建 | ~$0.1-0.5 |
| 专家偏好标注 | 15% | Scale/Surge 外采 | ~$5-50 |
| 红队+错误恢复 | 10% | Invisible/Scale | ~$10-100 |

### 四、工具选型决策树

```
你需要什么数据？
├── 大规模合成指令/工具调用数据
│   → Argilla distilabel + Gretel.ai（代码场景）
├── 高质量 RLHF 偏好数据
│   ├── 预算充足 → Scale AI RLHF
│   └── 预算有限 → Surge AI（更精但量小）
├── Agent 多步执行轨迹
│   ├── 真实环境 → Invisible Technologies
│   └── 模拟环境 → 自建 sandbox + 录制
├── 线上用户反馈 → Humanloop
├── 代码数据合成 → Gretel.ai + 自建
├── 多语言覆盖 → Appen（低资源语言）
└── 模型评估 → Snorkel Evaluate / Scale Eval
```

---

## 结语

Data Engine 赛道正在从「标注外包」向「数据生产基础设施」升级。对于 Agent 数据团队，最关键的认知是：**Agent 数据不是标注出来的，是在环境中执行出来的**。传统标注公司（Scale/Appen）的价值在于偏好判断和质量把关，而数据的主体来源应该是合成生成 + 环境交互录制。

建议的优先级：先搭内部 Data Engine（Argilla + sandbox + 评估体系），再按需精准外采高价值数据（专家偏好 + 红队 + 错误恢复）。不要把预算浪费在可以合成的基础数据上。
