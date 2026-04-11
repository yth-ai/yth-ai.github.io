# 附录

---

## 附录 A：主要开源预训练数据集一览表

### A.1 英文通用语料

| 数据集 | 规模 | 许可 | 发布时间 | 特点 | 链接 |
|--------|------|------|---------|------|------|
| **FineWeb** | 15T tokens | ODC-BY | 2024.05 | HuggingFace 出品，源自 96 个 CC 快照，多级过滤 | [HuggingFace](https://huggingface.co/datasets/HuggingFaceFW/fineweb) |
| **FineWeb-Edu** | 1.3T tokens | ODC-BY | 2024.05 | FineWeb 的教育价值子集，分类器过滤 | [HuggingFace](https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu) |
| **FineWeb-2** | 15T tokens | ODC-BY | 2025.02 | 多语言版 FineWeb，覆盖 1000+ 语言 | [HuggingFace](https://huggingface.co/datasets/HuggingFaceFW/fineweb-2) |
| **DCLM-Baseline** | 3.8T tokens | CC-BY-4.0 | 2024.06 | DataComp-LM 竞赛基线，模型过滤 | [GitHub](https://github.com/mlfoundations/dclm) |
| **RedPajama-V2** | 30T tokens | Apache-2.0 | 2023.10 | Together AI 出品，含质量信号 | [HuggingFace](https://huggingface.co/datasets/togethercomputer/RedPajama-Data-V2) |
| **Dolma** | 3T tokens | AI2 ImpACT | 2024.01 | Allen AI OLMo 训练数据，完全可复现 | [HuggingFace](https://huggingface.co/datasets/allenai/dolma) |
| **Dolma v1.7** | 4.3T tokens | AI2 ImpACT | 2024.10 | OLMo 2 训练数据，含 DCLM 过滤 | [HuggingFace](https://huggingface.co/datasets/allenai/dolma) |
| **The Pile** | 825 GB | MIT | 2020.12 | EleutherAI 经典数据集，22 个子集 | [GitHub](https://github.com/EleutherAI/the-pile) |
| **C4** | 305 GB | ODC-BY | 2019.10 | Google T5 训练数据，历史意义 | [TensorFlow](https://www.tensorflow.org/datasets/catalog/c4) |
| **RefinedWeb** | 5T tokens | ODC-BY | 2023.06 | Falcon 训练数据，CC 精细清洗 | [HuggingFace](https://huggingface.co/datasets/tiiuae/falcon-refinedweb) |
| **SlimPajama** | 627B tokens | Apache-2.0 | 2023.06 | RedPajama 去重精简版 | [HuggingFace](https://huggingface.co/datasets/cerebras/SlimPajama-627B) |
| **CulturaX** | 6.3T tokens | CC-BY-4.0 | 2023.09 | 多语言清洗数据，167 语言 | [HuggingFace](https://huggingface.co/datasets/uonlp/CulturaX) |

### A.2 中文语料

| 数据集 | 规模 | 许可 | 特点 |
|--------|------|------|------|
| **WanJuan 1.0** | 600B tokens | Apache-2.0 | 智源出品，中英双语 |
| **ChineseWebText 2.0** | 6TB | 研究用 | CC 中文子集，质量评分 |
| **SkyPile** | 150B tokens | Apache-2.0 | 天工 MiniMax 中文数据 |
| **MNBVC** | 数 TB | 多种 | 社区众包中文语料，覆盖广泛 |
| **WuDaoCorpus** | 200GB | 研究用 | 智源悟道中文语料 |
| **CLUECorpus2020** | 100GB | Apache-2.0 | CLUE 中文语言理解评估语料 |

### A.3 代码数据

| 数据集 | 规模 | 许可 | 特点 |
|--------|------|------|------|
| **The Stack v2** | 67.5 TB | 混合 | HuggingFace + SWH，619 语言 |
| **StarCoder Data** | 35B tokens | 混合 | StarCoder 系列训练数据 |
| **CodeParrot** | 180 GB | Apache-2.0 | GitHub Python 代码 |
| **MBPP / HumanEval** | 题库 | MIT | 代码评测基准（非训练用） |

### A.4 数学数据

| 数据集 | 规模 | 许可 | 特点 |
|--------|------|------|------|
| **OpenWebMath** | 14.7B tokens | ODC-BY | CC 中的数学内容，LaTeX 解析 |
| **Proof-Pile-2** | 55B tokens | 混合 | 数学证明语料 |
| **MathPile** | 9.5B tokens | CC-BY-SA | 数学综合语料 |
| **AutoMathText** | 200 GB | Apache-2.0 | 自动标注的数学文本 |

### A.5 学术论文

| 数据集 | 规模 | 许可 | 特点 |
|--------|------|------|------|
| **S2ORC** | 81M 篇 | ODC-BY | Semantic Scholar 论文全文 |
| **PeS2o** | 40M 篇 | ODC-BY | S2ORC 精选子集，Dolma 使用 |
| **arXiv bulk** | ~2.5M 篇 | CC 混合 | arXiv 论文 LaTeX 源码 |
| **PubMed** | 36M 篇 | 公共领域 | 生物医学文献 |

---

## 附录 B：主要 SFT 与偏好数据集一览表

### B.1 SFT 指令数据

| 数据集 | 规模 | 许可 | 特点 |
|--------|------|------|------|
| **OpenAssistant Conversations (OASST)** | 161K 条 | Apache-2.0 | 人工标注多轮对话，35 语言 |
| **ShareGPT** | ~90K 条 | 非商用 | 用户分享的 GPT 对话 |
| **Alpaca** | 52K 条 | CC-BY-NC | 斯坦福，Self-Instruct 合成 |
| **WizardLM-Evol** | 250K 条 | 非商用 | Evol-Instruct 进化方法 |
| **UltraChat** | 1.5M 条 | MIT | 大规模多轮对话合成 |
| **SlimOrca** | 518K 条 | MIT | 去噪后的 OpenOrca 子集 |
| **LIMA** | 1K 条 | CC-BY-NC | 精选高质量样本 |
| **Magpie** | 1M+ 条 | Apache-2.0 | 从 Llama 3 自然生成 |
| **Tulu Mix** | 混合 | Apache-2.0 | Allen AI Tulu 系列训练数据 |
| **Open-Hermes-2.5** | 1M 条 | Apache-2.0 | 多源混合 SFT 数据 |

### B.2 偏好/对齐数据

| 数据集 | 规模 | 格式 | 特点 |
|--------|------|------|------|
| **UltraFeedback** | 64K 条 | DPO pairs | GPT-4 评判生成的偏好数据 |
| **HH-RLHF** | 170K 条 | Chosen/Rejected | Anthropic 人工标注偏好 |
| **OpenAssistant-2** | 91K 条 | Ranking | 人工排序偏好 |
| **Nectar** | 182K 条 | Ranking (1-7) | 多模型多维度排序 |
| **Argilla DPO Mix** | 混合 | DPO | 多数据集混合 DPO 格式 |
| **PRM800K** | 800K 步 | Step-level | OpenAI 过程奖励数据 |
| **Math-Shepherd** | - | Step-level | 自动步骤级标注 |

### B.3 安全/红队数据

| 数据集 | 规模 | 用途 |
|--------|------|------|
| **SafeRLHF** | 30K 条 | 安全偏好标注 |
| **CValues** | 145K 条 | 中文安全与价值观 |
| **BeaverTails** | 330K 条 | 安全分类标注 |
| **HarmBench** | 评测集 | 安全评测基准 |

---

## 附录 C：数据处理工具速查表

### C.1 数据处理框架

| 工具 | 开发者 | 语言 | 特点 | 适用场景 |
|------|--------|------|------|---------|
| **datatrove** | HuggingFace | Python | FineWeb 同款，模块化管线 | 中大规模通用处理 |
| **NeMo-Curator** | NVIDIA | Python | GPU 加速，企业级 | 大规模高性能处理 |
| **dolma** | Allen AI | Rust+Python | OLMo 同款，高性能 | 大规模去重和过滤 |
| **RedPajama toolkit** | Together AI | Python | RedPajama 同款 | 中等规模处理 |
| **text-dedup** | ChenghaoMou | Python | 专注去重 | 去重任务 |
| **CCNet** | Meta | Python | CC 数据处理 | Common Crawl 处理 |

### C.2 文本提取

| 工具 | 语言 | 速度 | 质量 | 推荐场景 |
|------|------|------|------|---------|
| **trafilatura** | Python | 中 | 高 | 通用网页提取（首选） |
| **Resiliparse** | C++/Python | 快 | 中高 | 大规模处理 |
| **jusText** | Python | 中 | 中 | 段落级提取 |
| **readability** | JS/Python | 中 | 中高 | 文章类页面 |
| **beautifulsoup** | Python | 慢 | 可控 | 自定义提取规则 |

### C.3 语言识别

| 工具 | 模型 | 语言数 | 速度 | 推荐 |
|------|------|--------|------|------|
| **fastText lid** | lid.176.bin | 176 | 极快 | 首选 |
| **CLD3** | Neural | 107 | 快 | 备选 |
| **lingua** | 统计+规则 | 75 | 中 | 短文本 |
| **langdetect** | 统计 | 55 | 快 | 轻量场景 |

### C.4 质量评估

| 工具/方法 | 类型 | 速度 | 用途 |
|----------|------|------|------|
| **KenLM** | PPL 过滤 | 极快 | 困惑度过滤 |
| **fastText 分类器** | 二分类 | 极快 | 质量二分类 |
| **FineWeb-Edu 分类器** | 回归 | 中 | 教育价值评分 |
| **DCLM 过滤器** | LLM 打分 | 慢 | 高质量过滤 |
| **GPT-4/Claude 评分** | LLM-as-Judge | 很慢 | 精细评估（采样） |

### C.5 去重工具

| 工具 | 方法 | 规模适用 | 特点 |
|------|------|---------|------|
| **datasketch** | MinHash+LSH | TB 级 | Python 库，灵活 |
| **datatrove dedup** | MinHash | PB 级 | 分布式，与 datatrove 集成 |
| **text-dedup** | MinHash/SimHash/Suffix | TB 级 | 多方法集成 |
| **dolma dedup** | Bloom filter + MinHash | PB 级 | Rust 实现，高性能 |
| **Google deduplicate-text** | Suffix array | TB 级 | 子串级精确去重 |

### C.6 数据版本管理

| 工具 | 类型 | 特点 | 适用 |
|------|------|------|------|
| **DVC** | Git 扩展 | 类 Git 操作，简单 | 中小规模 |
| **lakeFS** | Git-like 对象存储 | S3 兼容，分支/合并 | 大规模 |
| **Delta Lake** | 表格式版本 | 事务性，时间旅行 | 结构化数据 |
| **Hugging Face Hub** | 托管平台 | 社区生态，易分享 | 开源数据集 |
| **Manifest 文件** | 自定义 | 灵活，无依赖 | 任何场景 |

---

## 附录 D：数据质量评估 Checklist

### D.1 预训练数据 Checklist

```
□ 数据来源
  □ 数据来源是否明确记录？
  □ 是否有适当的使用许可？
  □ 是否遵守了 robots.txt 和 ToS？
  □ 是否有数据溯源机制？

□ 文本提取
  □ 提取器的选择是否经过对比测试？
  □ 是否验证了提取质量（抽样检查）？
  □ 非 HTML 格式（PDF、Word）是否正确处理？
  □ 表格和列表是否合理保留？

□ 语言识别
  □ 语言识别模型是否适合目标语言？
  □ 置信度阈值是否经过调优？
  □ 混合语言文本的处理策略是否合理？

□ 清洗与过滤
  □ 过滤规则是否有文档记录？
  □ 每条规则的过滤量是否统计？
  □ 是否检查了过滤规则的误杀率？
  □ 是否经过"过度过滤"测试？

□ 去重
  □ 精确去重是否完成？
  □ 模糊去重的阈值是否合理？
  □ 去重的粒度（文档/段落/行）是否合适？
  □ 是否做了跨数据源去重？

□ 质量评估
  □ 是否使用了质量分类器？
  □ 质量阈值的选择是否有消融实验支持？
  □ 是否人工抽样检查了过滤后的数据？
  □ 质量评分的分布是否合理？

□ PII 与安全
  □ PII 检测覆盖了哪些类型？
  □ PII 处理方式（替换/删除/掩码）是否合理？
  □ 敏感内容过滤是否到位？
  □ 是否有安全审计日志？

□ 数据配比
  □ 各域数据的配比是否有实验依据？
  □ 是否做了配比消融实验？
  □ 语言配比是否符合目标？

□ 评估与验证
  □ 是否做了 Benchmark 污染检测？
  □ 是否有小模型代理验证？
  □ 数据统计 dashboard 是否建立？

□ 版本管理
  □ 数据是否有版本号？
  □ 版本间的差异是否有记录？
  □ 数据是否可以回溯到任意版本？
```

### D.2 SFT 数据 Checklist

```
□ 数据构造
  □ 种子数据是否经过精心设计和审核？
  □ 合成方法是否有质量保证机制？
  □ 是否使用了拒绝采样或类似方法？
  □ 数据是否覆盖了所有目标能力？

□ 质量控制
  □ 每条样本是否检查了格式正确性？
  □ 代码样本是否可执行/可编译？
  □ 数学样本的答案是否经过验证？
  □ 事实性内容是否准确？
  □ 是否做了重复检测？

□ 多样性
  □ 任务类型分布是否合理？
  □ 难度分布是否覆盖了各级别？
  □ 长度分布是否避免了偏向？
  □ 是否使用 embedding 做了多样性分析？

□ 一致性
  □ 回复风格是否统一？
  □ 多轮对话的上下文是否一致？
  □ 安全策略是否一致？

□ 安全
  □ 是否包含安全拒答样本？
  □ 有害内容是否被过滤？
  □ 是否做了红队测试？
```

### D.3 RL/偏好数据 Checklist

```
□ 偏好数据
  □ Chosen 和 Rejected 的质量差异是否真实？
  □ Margin 分布是否合理？
  □ 是否消除了长度偏好和格式偏好？
  □ LLM-as-Judge 的偏差是否校正？

□ 可验证奖励数据
  □ 数学题答案是否经过符号计算验证？
  □ 代码题测试用例是否充分？
  □ 难度分布是否在最佳学习区（20-50% solve rate）？
  □ 是否做了 Benchmark 去污染？

□ 安全对齐
  □ 安全相关的偏好标注是否准确？
  □ 边界案例（helpful vs harmless 冲突）是否有清晰的处理策略？
  □ 是否考虑了 Reward Hacking 的风险？
```

---

## 附录 E：各章代码索引与运行环境

### E.1 运行环境

```
# 推荐环境
Python >= 3.10
PyTorch >= 2.1 (如需 GPU 加速)

# 核心依赖
pip install \
    trafilatura \      # 文本提取 (第 3 章)
    fasttext \         # 语言识别与分类 (第 3, 5 章)
    datasketch \       # MinHash 去重 (第 4, 21 章)
    transformers \     # 模型推理 (第 5, 7, 13 章)
    datasets \         # 数据加载 (通用)
    numpy pandas \     # 数据分析 (通用)
    scikit-learn \     # 聚类和分析 (第 13 章)
    sympy \            # 数学验证 (第 9, 16 章)
    kenlm \            # 困惑度过滤 (第 5 章)
    
# 可选依赖
pip install \
    datatrove \        # 数据处理框架 (第 20 章)
    nemo-curator \     # NVIDIA 数据处理 (第 20 章)
    dvc \              # 数据版本管理 (第 20 章)
```

### E.2 代码索引

| 章节 | 代码标题 | 功能 |
|------|---------|------|
| **第 3 章** | 文本提取对比 | trafilatura/resiliparse/jusText 效果对比 |
| **第 3 章** | 语言识别管线 | fastText lid + 置信度过滤 |
| **第 3 章** | 启发式过滤器 | 多维度规则过滤框架 |
| **第 3 章** | PII 检测器 | 中英文 PII 正则检测 |
| **第 3 章** | 敏感内容过滤 | 多级安全过滤管线 |
| **第 4 章** | MinHash 去重 | 完整的 MinHash+LSH 去重实现 |
| **第 4 章** | Bloom Filter | 精确去重的 Bloom Filter 方案 |
| **第 4 章** | 去污染检测 | N-gram 重叠检测 Benchmark 污染 |
| **第 5 章** | 质量分类器 | fastText 质量二分类训练 |
| **第 5 章** | PPL 过滤 | KenLM 困惑度过滤管线 |
| **第 5 章** | 多维度评分 | 综合质量评分框架 |
| **第 6 章** | 配比优化 | 数据配比实验设计和可视化 |
| **第 6 章** | DoReMi 简化版 | 参考模型引导配比优化 |
| **第 6 章** | 课程学习调度 | 基于能力评估的数据排课 |
| **第 7 章** | 代理验证 | 400M 小模型快速验证数据质量 |
| **第 7 章** | 数据 Dashboard | 数据统计和可视化监控 |
| **第 7 章** | 污染检测器 | 13-gram 重叠 Benchmark 检测 |
| **第 9 章** | 长上下文构造 | 渐进式长文档数据管线 |
| **第 9 章** | 代码质量分层 | 四级代码质量评分系统 |
| **第 9 章** | 数学数据处理 | LaTeX 处理 + 难度评估 |
| **第 9 章** | 领域配比 | 中训练数据配比框架 |
| **第 10 章** | 回放策略 | 遗忘防控的数据回放方案 |
| **第 10 章** | 权重平均 | 模型平均 + Alpha 搜索 |
| **第 10 章** | 遗忘监控 | ForgettingMetrics 实时监控 |
| **第 12 章** | 种子数据框架 | SFT 种子数据设计模板 |
| **第 12 章** | Evol-Instruct | 指令进化合成方法 |
| **第 12 章** | 拒绝采样 | Best-of-N 采样实现 |
| **第 13 章** | 质量检查管线 | SFT 样本多维度质量检查 |
| **第 13 章** | IFD 计算 | Instruction-Following Difficulty |
| **第 13 章** | 多样性分析 | Embedding 聚类 + 覆盖度分析 |
| **第 14 章** | LLM-as-Judge | 偏好数据自动评分（含消偏） |
| **第 15 章** | PRM 构造 | Monte Carlo 步骤级标注 |
| **第 16 章** | GRPO 数据流 | 简化版 GRPO 算法数据处理 |
| **第 16 章** | 动态难度 | 基于 solve rate 的难度调整 |
| **第 19 章** | PII 检测器 | PIIDetector 类完整实现 |
| **第 19 章** | 偏见检测 | 数据集偏见分析工具 |
| **第 20 章** | 分布式去重 | MinHash 分布式方案 |
| **第 21 章** | 完整管线 | 端到端预训练数据处理管线 |
| **第 21 章** | Token 预算 | 各阶段 token 预算估算 |
| **第 21 章** | 配比实验 | 代理实验框架和配比方案 |
| **第 21 章** | SFT 工厂 | SFT 数据合成与过滤管线 |
| **第 21 章** | 偏好构造 | DPO 偏好数据构造管线 |

### E.3 数据处理性能参考

以下是各处理阶段在典型硬件上的性能参考值：

| 处理阶段 | 硬件 | 吞吐量 | 内存需求 |
|----------|------|--------|---------|
| HTML 提取 (trafilatura) | 8 核 CPU | ~1,000 页/秒 | 4 GB |
| 语言识别 (fastText) | 8 核 CPU | ~50,000 文档/秒 | 2 GB |
| 启发式过滤 | 8 核 CPU | ~30,000 文档/秒 | 2 GB |
| MinHash 计算 (128 perm) | 8 核 CPU | ~5,000 文档/秒 | 依数据量 |
| MinHash LSH 查询 | 8 核 CPU | ~2,000 查询/秒 | 依索引量 |
| 质量分类器 (fastText) | 8 核 CPU | ~20,000 文档/秒 | 2 GB |
| 质量分类器 (BERT-based) | 1 × A100 | ~3,000 文档/秒 | 8 GB |
| LLM 评分 (7B) | 1 × A100 | ~100 文档/秒 | 40 GB |
| PII 检测 (正则) | 8 核 CPU | ~30,000 文档/秒 | 1 GB |

**估算提示**：处理 1TB 原始文本（约 5 亿个文档）的完整管线，使用 32 核 CPU 服务器约需 3-5 天。加入 GPU 质量分类器约需额外 1-2 天（取决于 GPU 数量）。

### E.4 推荐阅读

**核心论文**：
1. Penedo et al. "The FineWeb Datasets: Decanting the Web for the Finest Text Data at Scale" (2024)
2. Li et al. "DataComp-LM: In Search of the Next Generation of Training Sets for Language Models" (2024)
3. Soldaini et al. "Dolma: an Open Corpus of Three Trillion Tokens" (2024)
4. Longpre et al. "A Pretrainer's Guide to Training Data" (2023)
5. Zhou et al. "LIMA: Less Is More for Alignment" (2023)
6. Shumailov et al. "AI models collapse when trained on recursively generated data" (Nature, 2024)
7. Liu et al. "Best Practices and Lessons Learned on Synthetic Data for Language Models" (2024)
8. Ye et al. "Data Mixing Laws: Optimizing Data Mixtures by Predicting Language Modeling Performance" (2024)
9. DeepSeek Team. "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning" (2025)
10. Wang et al. "Towards Next-Generation LLM Training: From the Data Perspective" (arXiv 2603.14712, 2026)

**技术博客**：
1. HuggingFace FineWeb Blog: https://huggingface.co/spaces/HuggingFaceFW/blogpost-fineweb-v1
2. Allen AI Dolma Blog: https://blog.allenai.org/dolma-3-trillion-tokens-open-llm-corpus
3. Microsoft SynthLLM: https://www.microsoft.com/en-us/research/articles/synthllm/
4. Together AI RedPajama: https://www.together.ai/blog/redpajama-data-v2

**书籍**（按推荐顺序）：
1. 本书 :)
2. Jurafsky & Martin, "Speech and Language Processing" (3rd ed., draft)
3. Lilian Weng's Blog 系列 (lilianweng.github.io) — 严格来说是博客，但质量堪比书籍
