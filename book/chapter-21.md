# 第 21 章：端到端案例——从零构建一个 7B 模型的数据

> "纸上得来终觉浅，绝知此事要躬行。" 前面 20 章讲了大量的方法论和技术细节，这一章我们把它们全部串起来——从需求定义到最终评估，完整走一遍一个 7B 模型的数据工程全流程。

---

## 21.1 需求分析与数据策略制定

### 21.1.1 项目背景

假设你是一家中型 AI 公司的数据负责人，团队决定从零训练一个 **7B 参数的中英双语通用模型**，目标是在通用能力上达到接近 Qwen2.5-7B / Llama3.1-8B 的水平，并在代码和数学能力上有额外增强。

**关键约束条件：**

| 维度 | 约束 |
|------|------|
| 模型规模 | 7B 参数（Transformer decoder-only） |
| 算力预算 | 256 × H100 × 30 天 |
| 目标语言 | 中文 + 英文（比例约 3:7） |
| 重点能力 | 通用对话、代码生成、数学推理 |
| 合规要求 | 中国数据安全法、GDPR（如需出海） |
| 时间线 | 数据准备 8 周，训练 4 周，后训练 2 周 |

### 21.1.2 Token 预算估算

根据 Chinchilla Scaling Laws 的修正版本（考虑 over-training），7B 模型的训练预算可以这样估算：

```python
"""
7B 模型的数据预算估算
"""

def estimate_token_budget(
    params_b: float = 7.0,      # 参数量（十亿）
    chinchilla_ratio: float = 20,  # Chinchilla 最优比例
    overtrain_factor: float = 3.0, # over-training 倍率
) -> dict:
    """估算各阶段的 token 预算"""
    
    # Chinchilla 最优：每参数 20 个 token
    chinchilla_optimal = params_b * chinchilla_ratio * 1e9  # 140B tokens
    
    # 实践中通常 over-train 2-5 倍
    # Llama 3.1 8B 用了 15T（~1875x），这里取保守 3x
    pretrain_tokens = chinchilla_optimal * overtrain_factor  # 420B tokens
    
    # 中训练：预训练 token 数的 5-15%
    midtrain_tokens = pretrain_tokens * 0.10  # 42B tokens
    
    # SFT：通常 1M-10M 条，平均 2K tokens/条
    sft_samples = 2_000_000
    sft_tokens = sft_samples * 2000  # 4B tokens
    
    # RL：通常 100K-1M 条
    rl_samples = 500_000
    rl_tokens = rl_samples * 4000  # 2B tokens（含推理过程）
    
    return {
        "pretrain_tokens": f"{pretrain_tokens/1e9:.0f}B",
        "midtrain_tokens": f"{midtrain_tokens/1e9:.0f}B",
        "sft_samples": f"{sft_samples/1e6:.0f}M ({sft_tokens/1e9:.0f}B tokens)",
        "rl_samples": f"{rl_samples/1e6:.1f}M ({rl_tokens/1e9:.0f}B tokens)",
        "total_tokens": f"{(pretrain_tokens + midtrain_tokens + sft_tokens + rl_tokens)/1e9:.0f}B",
    }

budget = estimate_token_budget()
for k, v in budget.items():
    print(f"{k}: {v}")

# 输出：
# pretrain_tokens: 420B
# midtrain_tokens: 42B
# sft_samples: 2M (4B tokens)
# rl_samples: 0.5M (2B tokens)
# total_tokens: 468B
```

**关键决策点**：420B 的预训练 token 需要大约 **2.5-3TB** 的高质量去重后文本数据。考虑到原始数据到可用数据的转化率通常在 5-15%，你需要准备至少 **20-50TB 的原始数据**。

### 21.1.3 数据策略总览

基于目标和约束，制定四阶段数据策略：

```python
"""
数据策略总览——四阶段规划
"""

DATA_STRATEGY = {
    "stage_1_pretrain": {
        "目标": "通用知识 + 语言能力",
        "token_budget": "420B",
        "数据配比": {
            "英文网页（高质量过滤后）": 0.45,
            "中文网页（高质量过滤后）": 0.20,
            "代码（GitHub, 多语言）": 0.15,
            "学术论文（arXiv, S2ORC）": 0.05,
            "书籍": 0.05,
            "百科（Wikipedia, 百度百科）": 0.03,
            "数学（LaTeX, 教材, 合成）": 0.04,
            "多语言（日韩法德西等）": 0.03,
        },
        "周期": "6 周准备 + 3-4 周训练",
    },
    "stage_2_midtrain": {
        "目标": "长上下文 + 代码数学增强",
        "token_budget": "42B",
        "数据配比": {
            "长文档（>8K tokens）": 0.25,
            "高质量代码（star>10, 有文档）": 0.30,
            "数学数据（教材+合成）": 0.15,
            "通用回放数据": 0.30,
        },
        "周期": "2 周准备 + 1 周训练",
    },
    "stage_3_sft": {
        "目标": "指令遵循 + 对话能力",
        "samples": "2M",
        "数据配比": {
            "通用对话": 0.25,
            "代码生成/调试": 0.20,
            "数学推理": 0.15,
            "创作/翻译": 0.10,
            "知识问答": 0.10,
            "工具调用": 0.05,
            "多轮对话": 0.10,
            "安全拒答": 0.05,
        },
        "周期": "3 周准备 + 3 天训练",
    },
    "stage_4_rl": {
        "目标": "偏好对齐 + 推理增强",
        "samples": "500K",
        "数据构成": {
            "偏好数据（DPO 格式）": "200K pairs",
            "代码 RL（可验证奖励）": "150K problems",
            "数学 RL（可验证奖励）": "100K problems",
            "通用 RLHF": "50K pairs",
        },
        "周期": "2 周准备 + 1 周训练",
    },
}
```

> **💡 反直觉发现**：很多团队在数据准备上花的时间远超训练本身。对于一个 7B 模型，典型的时间分配是：数据准备 60-70%，训练 20-25%，评估迭代 10-15%。数据工作是真正的瓶颈。

---

## 21.2 预训练数据构建

### 21.2.1 原始数据采集

第一步是获取足够量的原始数据。我们的策略是以开源数据为主，辅以自行爬取的中文数据。

**数据源规划表：**

| 数据源 | 语言 | 预估原始量 | 预估清洗后可用量 | 获取方式 |
|--------|------|-----------|----------------|---------|
| Common Crawl (2023-2025 快照) | 多语言 | ~100TB | 英文: ~3TB, 中文: ~800GB | 直接下载 WARC |
| FineWeb / FineWeb-2 | 英文/多语言 | 15T tokens | 按需采样 | HuggingFace |
| The Stack v2 / StarCoder Data | 代码 | 67TB | ~400GB 精选 | HuggingFace |
| RedPajama v2 | 英文 | 30T tokens | 按需采样 | HuggingFace |
| Wikipedia (全语言) | 多语言 | ~100GB | ~80GB | Dump 下载 |
| arXiv 全文 | 英文 | ~300GB | ~200GB | S3 bulk 下载 |
| 中文网页（自行爬取） | 中文 | ~5TB | ~300GB | 自建爬虫 |
| 中文书籍（公版） | 中文 | ~50GB | ~40GB | 古腾堡/维基文库 |

**实际决策**：对于资源有限的团队，一个务实的做法是——不从 Common Crawl 原始 WARC 开始处理，而是基于已有的高质量开源数据集（如 FineWeb、DCLM）进行二次筛选和混合。这可以节省大量的清洗工作。

```python
"""
数据源管理配置
"""
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class DataSource:
    name: str
    language: str
    raw_size_gb: float
    estimated_yield: float  # 可用数据占比
    priority: int           # 1=最高
    license: str
    notes: str = ""

# 数据源注册表
SOURCES = [
    DataSource("fineweb-edu-2", "en", 5000, 0.40, 1, "ODC-BY",
               "FineWeb 教育价值过滤版，英文主力"),
    DataSource("dclm-baseline", "en", 3000, 0.50, 2, "CC-BY-4.0",
               "DCLM 过滤后的高质量英文网页"),
    DataSource("cc-zh-2024", "zh", 2000, 0.08, 1, "Custom",
               "Common Crawl 中文子集，需自行清洗"),
    DataSource("wanjuan-cc", "zh", 800, 0.30, 2, "Apache-2.0",
               "智源 WanJuan 中文语料"),
    DataSource("starcoder-data-v3", "code", 3000, 0.15, 1, "Apache-2.0",
               "多语言代码，按质量分层"),
    DataSource("arxiv-fulltext", "en", 300, 0.70, 3, "CC-BY",
               "学术论文，LaTeX 转纯文本"),
    DataSource("wiki-all", "multi", 100, 0.80, 2, "CC-BY-SA",
               "全语言 Wikipedia"),
    DataSource("math-corpus", "en/zh", 200, 0.60, 2, "Mixed",
               "数学教材、StackExchange 数学、合成数学"),
]

def plan_data_budget(target_tokens_b: float = 420):
    """按配比规划各数据源的采样量"""
    # 假设平均 1GB ≈ 250M tokens（清洗后的文本）
    TOKENS_PER_GB = 0.25  # 十亿 tokens/GB
    
    target_gb = target_tokens_b / TOKENS_PER_GB  # 1680 GB
    
    # 按配比分配
    allocation = {
        "en_web": (0.45, ["fineweb-edu-2", "dclm-baseline"]),
        "zh_web": (0.20, ["cc-zh-2024", "wanjuan-cc"]),
        "code":   (0.15, ["starcoder-data-v3"]),
        "academic": (0.05, ["arxiv-fulltext"]),
        "wiki":   (0.03, ["wiki-all"]),
        "math":   (0.04, ["math-corpus"]),
    }
    
    plan = {}
    for domain, (ratio, sources) in allocation.items():
        domain_gb = target_gb * ratio
        plan[domain] = {
            "target_gb": round(domain_gb, 1),
            "target_tokens_b": round(domain_gb * TOKENS_PER_GB, 1),
            "sources": sources,
        }
    return plan
```

### 21.2.2 数据处理管线

预训练数据处理管线是整个项目中工作量最大的部分。我们分五个阶段实现：

```python
"""
完整的预训练数据处理管线
"""
import hashlib
import re
from collections import Counter
from typing import List, Dict, Tuple, Optional

class PretrainPipeline:
    """五阶段预训练数据处理管线"""
    
    def __init__(self, config: dict):
        self.config = config
        self.stats = {
            "stage_input": Counter(),
            "stage_output": Counter(),
            "filter_reasons": Counter(),
        }
    
    # ========== 阶段 1：文本提取 ==========
    def stage1_extract(self, raw_html: str, url: str) -> Optional[str]:
        """从 HTML 提取纯文本"""
        # 实际项目中使用 trafilatura 或 resiliparse
        # 这里展示核心逻辑
        import trafilatura
        
        text = trafilatura.extract(
            raw_html,
            include_tables=True,
            include_links=False,
            include_images=False,
            favor_recall=False,  # 精确优先
            min_extracted_size=200,
        )
        
        if text is None:
            self.stats["filter_reasons"]["extract_failed"] += 1
            return None
        
        # 后处理：规范化空白字符
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        
        return text.strip()
    
    # ========== 阶段 2：语言识别与基础过滤 ==========
    def stage2_langfilter(self, text: str, target_lang: str = "zh") -> Optional[str]:
        """语言识别 + 基础启发式过滤"""
        # 长度过滤
        if len(text) < 200:
            self.stats["filter_reasons"]["too_short"] += 1
            return None
        
        # 语言识别（使用 fasttext lid 模型）
        # lang, confidence = fasttext_model.predict(text.replace('\n', ' ')[:500])
        # if lang != target_lang or confidence < 0.65:
        #     return None
        
        # 启发式过滤
        lines = text.split('\n')
        
        # 短行比例（<10 字的行）
        short_line_ratio = sum(1 for l in lines if len(l.strip()) < 10) / max(len(lines), 1)
        if short_line_ratio > 0.7:
            self.stats["filter_reasons"]["too_many_short_lines"] += 1
            return None
        
        # 特殊字符比例
        special_chars = sum(1 for c in text if not c.isalnum() and c not in ' \n\t。，、；：？！""''（）—…')
        if special_chars / max(len(text), 1) > 0.3:
            self.stats["filter_reasons"]["too_many_special_chars"] += 1
            return None
        
        # 重复行检测
        unique_lines = set(l.strip() for l in lines if len(l.strip()) > 20)
        if len(unique_lines) < len(lines) * 0.5:
            self.stats["filter_reasons"]["too_many_duplicate_lines"] += 1
            return None
        
        return text
    
    # ========== 阶段 3：质量过滤 ==========
    def stage3_quality_filter(self, text: str) -> Tuple[Optional[str], float]:
        """质量评分与过滤"""
        score = 0.0
        total_weight = 0.0
        
        # 维度 1：段落结构（权重 0.2）
        paragraphs = [p for p in text.split('\n\n') if len(p.strip()) > 50]
        para_score = min(len(paragraphs) / 3, 1.0)  # 至少 3 个实质段落
        score += para_score * 0.2
        total_weight += 0.2
        
        # 维度 2：词汇丰富度（权重 0.2）
        words = text.split()
        if len(words) > 50:
            unique_ratio = len(set(words)) / len(words)
            vocab_score = min(unique_ratio / 0.6, 1.0)  # 60% 唯一词为满分
            score += vocab_score * 0.2
            total_weight += 0.2
        
        # 维度 3：信息密度——通过标点和句子长度估算（权重 0.2）
        sentences = re.split(r'[。！？.!?]+', text)
        avg_sent_len = sum(len(s) for s in sentences) / max(len(sentences), 1)
        density_score = 1.0 if 20 < avg_sent_len < 200 else 0.5
        score += density_score * 0.2
        total_weight += 0.2
        
        # 维度 4：无广告/导航噪声（权重 0.2）
        ad_patterns = ['点击这里', '立即购买', 'subscribe', 'click here', 
                       'cookie', '免费试用', '©', '版权所有']
        ad_count = sum(1 for p in ad_patterns if p.lower() in text.lower())
        ad_score = max(0, 1.0 - ad_count * 0.2)
        score += ad_score * 0.2
        total_weight += 0.2
        
        # 维度 5：教育价值（简化版，实际用 classifier）（权重 0.2）
        edu_signals = ['因此', '研究表明', '例如', 'therefore', 'research', 
                       'however', '综上', '实验结果', '算法', '公式']
        edu_count = sum(1 for s in edu_signals if s.lower() in text.lower())
        edu_score = min(edu_count / 3, 1.0)
        score += edu_score * 0.2
        total_weight += 0.2
        
        # 归一化
        final_score = score / total_weight if total_weight > 0 else 0
        
        # 阈值过滤
        if final_score < self.config.get("quality_threshold", 0.4):
            self.stats["filter_reasons"]["low_quality"] += 1
            return None, final_score
        
        return text, final_score
    
    # ========== 阶段 4：去重 ==========
    def stage4_dedup(self, texts: List[str]) -> List[str]:
        """两级去重：精确 + 模糊"""
        # 精确去重（SHA-256）
        seen_hashes = set()
        exact_deduped = []
        
        for text in texts:
            h = hashlib.sha256(text.encode()).hexdigest()
            if h not in seen_hashes:
                seen_hashes.add(h)
                exact_deduped.append(text)
            else:
                self.stats["filter_reasons"]["exact_duplicate"] += 1
        
        # 模糊去重（MinHash + LSH）
        # 实际使用 datasketch 库或 datatrove 内置
        # 这里展示接口
        from datasketch import MinHash, MinHashLSH
        
        lsh = MinHashLSH(threshold=0.8, num_perm=128)
        final_texts = []
        
        for i, text in enumerate(exact_deduped):
            m = MinHash(num_perm=128)
            # 中文用 2-gram, 英文用 5-gram
            ngrams = self._get_ngrams(text, n=5)
            for ng in ngrams:
                m.update(ng.encode('utf-8'))
            
            # 查询是否有近似重复
            result = lsh.query(m)
            if len(result) == 0:
                lsh.insert(f"doc_{i}", m)
                final_texts.append(text)
            else:
                self.stats["filter_reasons"]["fuzzy_duplicate"] += 1
        
        return final_texts
    
    def _get_ngrams(self, text: str, n: int = 5) -> List[str]:
        """提取 n-gram"""
        words = text.split()
        return [' '.join(words[i:i+n]) for i in range(len(words) - n + 1)]
    
    # ========== 阶段 5：PII 脱敏与安全过滤 ==========
    def stage5_safety(self, text: str) -> Optional[str]:
        """PII 脱敏 + 敏感内容过滤"""
        # PII 替换
        # 手机号（中国大陆）
        text = re.sub(r'1[3-9]\d{9}', '<PHONE>', text)
        # 邮箱
        text = re.sub(r'[\w.+-]+@[\w-]+\.[\w.]+', '<EMAIL>', text)
        # 身份证号
        text = re.sub(r'\d{17}[\dXx]', '<ID_CARD>', text)
        # IP 地址
        text = re.sub(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', '<IP>', text)
        
        # 敏感内容检测（实际用分类器）
        # if nsfw_classifier.predict(text) > 0.8:
        #     self.stats["filter_reasons"]["nsfw"] += 1
        #     return None
        
        return text
    
    # ========== 完整管线 ==========
    def process_document(self, raw_html: str, url: str, lang: str = "zh") -> Optional[Dict]:
        """处理单个文档的完整管线"""
        self.stats["stage_input"]["total"] += 1
        
        # Stage 1: 提取
        text = self.stage1_extract(raw_html, url)
        if text is None:
            return None
        
        # Stage 2: 语言+基础过滤
        text = self.stage2_langfilter(text, lang)
        if text is None:
            return None
        
        # Stage 3: 质量过滤
        text, quality_score = self.stage3_quality_filter(text)
        if text is None:
            return None
        
        # Stage 5: 安全过滤（去重在批量阶段做）
        text = self.stage5_safety(text)
        if text is None:
            return None
        
        self.stats["stage_output"]["passed"] += 1
        
        return {
            "text": text,
            "url": url,
            "lang": lang,
            "quality_score": quality_score,
            "token_count": len(text) // 2,  # 粗略估计
        }
```

### 21.2.3 数据配比实验

数据配比是预训练阶段最关键的超参数之一。我们使用小模型代理实验来确定最终配比：

```python
"""
数据配比代理实验框架
使用 400M 参数小模型在 10B tokens 上快速验证配比效果
"""

# 候选配比方案
MIXING_EXPERIMENTS = {
    "baseline": {
        "en_web": 0.50, "zh_web": 0.20, "code": 0.12,
        "academic": 0.05, "wiki": 0.03, "math": 0.03,
        "books": 0.04, "multilingual": 0.03,
    },
    "code_heavy": {
        "en_web": 0.40, "zh_web": 0.18, "code": 0.22,
        "academic": 0.05, "wiki": 0.03, "math": 0.04,
        "books": 0.04, "multilingual": 0.04,
    },
    "math_heavy": {
        "en_web": 0.42, "zh_web": 0.18, "code": 0.15,
        "academic": 0.05, "wiki": 0.03, "math": 0.08,
        "books": 0.05, "multilingual": 0.04,
    },
    "balanced_plus": {
        "en_web": 0.45, "zh_web": 0.20, "code": 0.15,
        "academic": 0.05, "wiki": 0.03, "math": 0.04,
        "books": 0.05, "multilingual": 0.03,
    },
}

# 代理实验结果（400M 模型, 10B tokens）
PROXY_RESULTS = """
| 方案 | MMLU(5-shot) | GSM8K | HumanEval | C-Eval | 平均 |
|------|-------------|-------|-----------|--------|------|
| baseline | 32.1 | 18.5 | 15.2 | 34.8 | 25.2 |
| code_heavy | 30.8 | 19.2 | 22.1 | 33.5 | 26.4 |
| math_heavy | 31.5 | 24.7 | 16.8 | 34.2 | 26.8 |
| balanced_plus | 32.8 | 21.3 | 18.9 | 35.1 | 27.0 |
"""

# 决策：选择 balanced_plus 作为最终配比
# 原因：综合分数最高，且没有单项短板
# 代码和数学能力在中训练阶段再做针对性增强

FINAL_PRETRAIN_MIX = {
    "en_web": 0.45,
    "zh_web": 0.20,
    "code": 0.15,
    "academic": 0.05,
    "wiki": 0.03,
    "math": 0.04,
    "books": 0.05,
    "multilingual": 0.03,
}
```

> **🔬 显微镜案例：代码配比的决定**
> 
> 在代理实验中，`code_heavy` 方案在 HumanEval 上提升了 45%（15.2→22.1），但 MMLU 下降了 1.3 分。这是经典的能力跷跷板效应。最终选择 `balanced_plus` 的 15% 代码配比，因为：
> 1. 中训练阶段会再追加高质量代码数据
> 2. 预训练阶段的代码主要目标是建立代码理解的基础能力
> 3. 15% 代码已经能提供显著的推理能力溢出效应

### 21.2.4 数据质量评估与迭代

预训练数据不是处理一遍就结束的。我们建立了一个迭代评估机制：

```python
"""
预训练数据质量评估 Dashboard
"""

class DataQualityDashboard:
    """数据质量实时监控"""
    
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.metrics = {}
    
    def run_quality_audit(self, sample_size: int = 10000) -> dict:
        """对数据集执行质量审计"""
        report = {
            "total_documents": 0,
            "total_tokens_b": 0,
            "language_distribution": Counter(),
            "quality_score_distribution": {
                "excellent (>0.8)": 0,
                "good (0.6-0.8)": 0,
                "acceptable (0.4-0.6)": 0,
                "poor (<0.4)": 0,
            },
            "length_stats": {
                "min": float('inf'),
                "max": 0,
                "mean": 0,
                "median": 0,
                "p10": 0,
                "p90": 0,
            },
            "issues_found": [],
        }
        
        # 抽样检查
        # ... 实际实现省略
        
        return report
    
    def check_benchmark_contamination(
        self, 
        training_data_sample: List[str],
        benchmark_name: str = "mmlu",
        ngram_size: int = 13,
    ) -> dict:
        """Benchmark 污染检测"""
        # 加载 benchmark 题目
        # benchmark_items = load_benchmark(benchmark_name)
        
        contaminated = []
        # for item in benchmark_items:
        #     item_ngrams = set(get_ngrams(item, ngram_size))
        #     for doc in training_data_sample:
        #         doc_ngrams = set(get_ngrams(doc, ngram_size))
        #         overlap = len(item_ngrams & doc_ngrams) / max(len(item_ngrams), 1)
        #         if overlap > 0.5:
        #             contaminated.append({"benchmark_item": item[:100], "overlap": overlap})
        
        return {
            "benchmark": benchmark_name,
            "total_items_checked": 0,  # len(benchmark_items),
            "contaminated_items": len(contaminated),
            "contamination_rate": 0,  # len(contaminated) / len(benchmark_items),
            "action": "REMOVE contaminated documents" if contaminated else "CLEAN",
        }
    
    def generate_iteration_report(self, version: str) -> str:
        """生成数据版本迭代报告"""
        report = f"""
# 预训练数据质量报告 - {version}

## 概览
- 总文档数: {self.metrics.get('total_docs', 'N/A')}
- 总 Token 数: {self.metrics.get('total_tokens', 'N/A')}
- 平均质量分: {self.metrics.get('avg_quality', 'N/A')}

## 本版本变更
{self.metrics.get('changes', '无')}

## 已知问题
{self.metrics.get('known_issues', '无')}

## 下版本计划
{self.metrics.get('next_plan', '无')}
"""
        return report
```

**数据迭代实录**（节选）：

| 版本 | 变更 | 影响 |
|------|------|------|
| v0.1 | 初始管线，基础规则过滤 | Baseline |
| v0.2 | 加入教育价值分类器，过滤阈值 0.3 | MMLU +1.8 |
| v0.3 | 中文数据加入繁简转换统一 | C-Eval +0.9 |
| v0.4 | 发现并移除 MMLU 污染数据 3.2K 条 | MMLU -0.3（真实水平）|
| v0.5 | 代码数据加入 lint 过滤，去除语法错误代码 | HumanEval +2.1 |
| v1.0 | 最终版本，全量去重完成 | 最终 baseline |

---

## 21.3 中训练数据构建

预训练完成后，我们进入中训练阶段。目标是：
1. **长上下文**：从 4K 扩展到 32K
2. **代码增强**：提升代码生成和理解能力
3. **数学增强**：提升数学推理能力

### 21.3.1 长上下文数据

```python
"""
长上下文数据构造管线
目标：支持 32K 上下文窗口
"""

class LongContextDataBuilder:
    """渐进式长上下文数据构造"""
    
    # 三阶段渐进方案
    PHASES = [
        {"name": "phase1", "max_len": 8192,  "ratio": 0.4, "tokens_b": 8},
        {"name": "phase2", "max_len": 16384, "ratio": 0.35, "tokens_b": 7},
        {"name": "phase3", "max_len": 32768, "ratio": 0.25, "tokens_b": 5},
    ]
    
    # 长文档来源及优先级
    LONG_DOC_SOURCES = {
        "books": {
            "min_length": 10000,
            "description": "公版书籍，自然长文本",
            "priority": 1,
        },
        "academic_papers": {
            "min_length": 5000,
            "description": "学术论文全文，结构化长文本",
            "priority": 1,
        },
        "legal_documents": {
            "min_length": 8000,
            "description": "法律文书，精确性要求高",
            "priority": 2,
        },
        "code_repos": {
            "min_length": 10000,
            "description": "完整代码仓库，跨文件依赖",
            "priority": 1,
        },
        "long_conversations": {
            "min_length": 5000,
            "description": "多轮长对话数据",
            "priority": 2,
        },
        "concatenated_wiki": {
            "min_length": 8000,
            "description": "同主题 Wikipedia 文章拼接",
            "priority": 3,
        },
    }
    
    def build_phase_data(self, phase_idx: int, docs: list) -> list:
        """构建某一阶段的长上下文数据"""
        phase = self.PHASES[phase_idx]
        max_len = phase["max_len"]
        
        selected = []
        for doc in docs:
            tokens = len(doc.split())  # 简化的 token 计数
            if tokens <= max_len:
                selected.append(doc)
            else:
                # 对超长文档进行智能切分
                chunks = self._smart_split(doc, max_len)
                selected.extend(chunks)
        
        # 长度分布验证
        lengths = [len(d.split()) for d in selected]
        print(f"Phase {phase_idx+1} ({phase['name']}):")
        print(f"  文档数: {len(selected)}")
        print(f"  平均长度: {sum(lengths)/len(lengths):.0f} tokens")
        print(f"  目标 tokens: {phase['tokens_b']}B")
        
        return selected
    
    def _smart_split(self, doc: str, max_len: int) -> list:
        """智能切分：在段落/章节边界处切分，保持语义完整"""
        paragraphs = doc.split('\n\n')
        chunks = []
        current_chunk = []
        current_len = 0
        
        for para in paragraphs:
            para_len = len(para.split())
            if current_len + para_len > max_len and current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                # 保留最后一段作为上下文重叠
                current_chunk = [current_chunk[-1]] if current_chunk else []
                current_len = len(current_chunk[0].split()) if current_chunk else 0
            
            current_chunk.append(para)
            current_len += para_len
        
        if current_chunk:
            chunks.append('\n\n'.join(current_chunk))
        
        return chunks
```

### 21.3.2 代码增强数据

```python
"""
代码增强数据构造
目标：从 The Stack v2 中精选高质量代码 + Repo 级上下文
"""

class CodeDataBuilder:
    """代码数据四级质量分层"""
    
    QUALITY_TIERS = {
        "tier1_premium": {
            "criteria": "star > 100 AND has_readme AND has_tests AND lint_pass",
            "ratio": 0.30,
            "description": "顶级仓库代码",
        },
        "tier2_good": {
            "criteria": "star > 10 AND has_docstring_ratio > 0.3",
            "ratio": 0.35,
            "description": "优质代码，有文档",
        },
        "tier3_acceptable": {
            "criteria": "lint_pass AND file_size > 100",
            "ratio": 0.25,
            "description": "可用代码，通过基本检查",
        },
        "tier4_supplementary": {
            "criteria": "basic_syntax_valid",
            "ratio": 0.10,
            "description": "补充量的普通代码",
        },
    }
    
    # 编程语言配比
    LANG_MIX = {
        "python": 0.35,
        "javascript/typescript": 0.20,
        "java": 0.10,
        "c/c++": 0.10,
        "go": 0.05,
        "rust": 0.05,
        "shell": 0.03,
        "sql": 0.03,
        "other": 0.09,
    }
    
    def score_code_file(self, code: str, metadata: dict) -> float:
        """代码文件质量评分"""
        score = 0.0
        
        # 1. 有文档字符串 (+0.2)
        if '"""' in code or "'''" in code or '/**' in code:
            score += 0.2
        
        # 2. 函数/类定义比例合理 (+0.2)
        lines = code.split('\n')
        def_lines = sum(1 for l in lines if l.strip().startswith(('def ', 'class ', 'function ', 'public ', 'private ')))
        if 0.05 < def_lines / max(len(lines), 1) < 0.3:
            score += 0.2
        
        # 3. 注释比例适中 (+0.15)
        comment_lines = sum(1 for l in lines if l.strip().startswith(('#', '//', '/*', '*')))
        comment_ratio = comment_lines / max(len(lines), 1)
        if 0.05 < comment_ratio < 0.4:
            score += 0.15
        
        # 4. 仓库星级 (+0.25)
        stars = metadata.get("stars", 0)
        if stars > 100:
            score += 0.25
        elif stars > 10:
            score += 0.15
        elif stars > 1:
            score += 0.05
        
        # 5. 文件不是自动生成的 (+0.2)
        autogen_patterns = ['generated by', 'auto-generated', 'do not edit', 
                           'generated from', 'THIS FILE IS AUTOMATICALLY']
        if not any(p.lower() in code.lower()[:500] for p in autogen_patterns):
            score += 0.2
        
        return min(score, 1.0)
    
    def build_repo_context(self, repo_files: list) -> str:
        """构建 Repo 级上下文序列"""
        # 按依赖关系排序文件
        sorted_files = self._topological_sort(repo_files)
        
        context_parts = []
        for f in sorted_files:
            context_parts.append(f"# File: {f['path']}\n{f['content']}")
        
        return "\n\n---\n\n".join(context_parts)
    
    def _topological_sort(self, files: list) -> list:
        """按 import 依赖进行拓扑排序"""
        # 简化实现：README → 配置文件 → 工具类 → 核心逻辑 → 测试
        priority = {
            'readme': 0, 'setup': 1, 'config': 2, 'util': 3,
            'model': 4, 'main': 5, 'test': 6,
        }
        
        def get_priority(f):
            name = f['path'].lower()
            for key, val in priority.items():
                if key in name:
                    return val
            return 4
        
        return sorted(files, key=get_priority)
```

### 21.3.3 数学增强数据

```python
"""
数学增强数据构造
"""

class MathDataBuilder:
    """数学数据四级难度梯度"""
    
    DIFFICULTY_LEVELS = {
        "level1_basic": {
            "description": "小学到初中数学",
            "examples": ["计算 234 × 56", "解方程 2x + 3 = 15"],
            "ratio": 0.20,
            "source": ["GSM8K-like synthetic", "教材题"],
        },
        "level2_intermediate": {
            "description": "高中数学",
            "examples": ["求导 f(x)=x³+2x²-5x+1", "概率组合问题"],
            "ratio": 0.35,
            "source": ["MATH dataset", "高考真题", "合成变体"],
        },
        "level3_advanced": {
            "description": "大学数学",
            "examples": ["多元微积分", "线性代数证明", "概率论推导"],
            "ratio": 0.30,
            "source": ["arXiv 数学论文", "大学教材", "合成高级题"],
        },
        "level4_competition": {
            "description": "竞赛/研究级别",
            "examples": ["IMO 风格题目", "组合数论"],
            "ratio": 0.15,
            "source": ["AMC/AIME/IMO", "合成竞赛题"],
        },
    }
    
    def process_latex_content(self, raw_text: str) -> str:
        """处理 LaTeX 数学内容"""
        import re
        
        # 标准化 LaTeX 环境
        text = raw_text
        
        # \begin{equation} → $$ ... $$
        text = re.sub(
            r'\\begin\{equation\*?\}(.*?)\\end\{equation\*?\}',
            r'$$\1$$',
            text,
            flags=re.DOTALL
        )
        
        # 清理常见的 LaTeX 噪声
        text = re.sub(r'\\label\{[^}]*\}', '', text)
        text = re.sub(r'\\ref\{[^}]*\}', '[ref]', text)
        
        # 确保行间公式有换行
        text = re.sub(r'(?<!\n)\$\$', '\n$$', text)
        text = re.sub(r'\$\$(?!\n)', '$$\n', text)
        
        return text
    
    def generate_synthetic_math(
        self,
        template_type: str,
        difficulty: int,
        count: int = 100,
    ) -> list:
        """生成合成数学题（框架示例）"""
        # 实际项目中使用 GPT-4/Claude 等强模型生成
        # 这里展示生成配置
        
        generation_config = {
            "model": "gpt-4-turbo",
            "temperature": 0.7,
            "system_prompt": f"""You are a math problem generator. 
            Create {template_type} problems at difficulty level {difficulty}/4.
            Each problem must include:
            1. Clear problem statement
            2. Step-by-step solution
            3. Final answer in \\boxed{{}}
            
            Ensure variety in:
            - Number choices (avoid trivial values)
            - Problem context  
            - Solution approaches
            """,
            "post_processing": [
                "verify_answer_correctness",  # 用 sympy 验证答案
                "check_step_validity",         # 检查每步推导
                "dedup_against_benchmarks",    # 与评测集去重
            ],
        }
        
        return generation_config
```

### 21.3.4 中训练配比与遗忘防控

```python
"""
中训练数据最终配比和遗忘监控方案
"""

MIDTRAIN_FINAL_MIX = {
    # 新增能力数据（70%）
    "long_context_data": {
        "ratio": 0.25,
        "description": "渐进式长文档，4K→8K→16K→32K",
    },
    "code_enhanced": {
        "ratio": 0.30,
        "description": "高质量代码 + Repo 级上下文",
    },
    "math_enhanced": {
        "ratio": 0.15,
        "description": "数学数据四级梯度",
    },
    
    # 回放数据（30%）—— 防止灾难性遗忘
    "replay_en_web": {
        "ratio": 0.12,
        "description": "英文通用网页回放",
    },
    "replay_zh_web": {
        "ratio": 0.08,
        "description": "中文通用网页回放",
    },
    "replay_wiki": {
        "ratio": 0.05,
        "description": "百科知识回放",
    },
    "replay_diverse": {
        "ratio": 0.05,
        "description": "学术/书籍/对话混合回放",
    },
}

# 遗忘监控方案
FORGETTING_MONITORS = {
    "checkpoints": "每 1B tokens 保存一次",
    "eval_frequency": "每 2B tokens 评估一次",
    "eval_benchmarks": [
        "MMLU (5-shot) — 通用知识",
        "C-Eval (5-shot) — 中文知识",
        "HumanEval — 代码能力（应上升）",
        "GSM8K — 数学能力（应上升）",
        "HellaSwag — 常识推理（不应下降）",
        "ARC-Challenge — 科学推理（不应下降）",
    ],
    "alert_threshold": {
        "任意 benchmark 下降超过 2%": "WARNING",
        "任意 benchmark 下降超过 5%": "CRITICAL — 暂停训练",
        "通用能力平均下降超过 3%": "CRITICAL — 回退到上个 checkpoint",
    },
}
```

---

## 21.4 SFT 数据构建

### 21.4.1 种子数据设计

SFT 的第一步是设计高质量的种子数据。种子数据不需要多——100-500 条精心设计的样本足矣——但它定义了模型的"人格"和回复风格。

```python
"""
SFT 种子数据设计框架
"""

# 种子数据分类和模板
SEED_DATA_SCHEMA = {
    "identity_samples": {
        "count": 20,
        "purpose": "定义模型身份和基本行为",
        "example": {
            "instruction": "你是谁？",
            "response": "我是 [模型名]，一个由 [公司] 开发的 AI 助手。我可以帮你回答问题、编写代码、进行分析等。有什么我可以帮到你的吗？",
        },
    },
    "format_samples": {
        "count": 50,
        "purpose": "教会模型输出格式（markdown/代码块/列表等）",
        "types": [
            "使用 markdown 表格回答对比类问题",
            "使用有序列表回答步骤类问题",
            "使用代码块回答编程问题",
            "使用分点论述回答分析类问题",
        ],
    },
    "safety_samples": {
        "count": 80,
        "purpose": "安全拒答和边界行为",
        "types": [
            "有害请求的礼貌拒绝",
            "隐私敏感问题的处理",
            "不确定信息的诚实回应",
            "价值观冲突场景的平衡回答",
        ],
    },
    "capability_seeds": {
        "count": 100,
        "purpose": "各核心能力的标杆样本",
        "types": [
            "代码生成：从简单函数到完整模块",
            "数学推理：清晰的逐步推导",
            "创意写作：有文采有结构",
            "知识问答：准确且有深度",
            "翻译：信达雅",
        ],
    },
    "multi_turn_seeds": {
        "count": 50,
        "purpose": "多轮对话的质量标杆",
        "requirements": [
            "上下文记忆一致",
            "自然的追问和澄清",
            "话题切换的流畅处理",
        ],
    },
}

def create_seed_quality_checklist() -> dict:
    """种子数据质量检查清单"""
    return {
        "必须满足": [
            "指令意图明确，无歧义",
            "回复完整、准确、有用",
            "格式规范（markdown 正确，代码可运行）",
            "语言流畅自然，无机器味",
            "不含任何事实性错误",
        ],
        "应当满足": [
            "回复长度适中（不过短也不冗余）",
            "有结构感（分段、标题、列表）",
            "体现专业性和深度",
            "包含必要的注意事项或边界条件",
        ],
        "加分项": [
            "有具体例子或类比",
            "提供进一步学习的方向",
            "预判用户的后续问题",
        ],
    }
```

### 21.4.2 大规模合成与过滤

种子数据之后，通过合成扩展到 200 万条：

```python
"""
SFT 数据合成与过滤管线
"""

class SFTDataFactory:
    """SFT 数据工厂：合成 + 过滤 + 配比"""
    
    def __init__(self, strong_model: str = "gpt-4-turbo"):
        self.strong_model = strong_model
        self.quality_stats = Counter()
    
    # ========== 合成方法 1：Evol-Instruct ==========
    def evolve_instruction(self, seed_instruction: str, evolution_type: str) -> str:
        """指令进化（WizardLM 方法）"""
        evolution_prompts = {
            "deepen": f"""将以下指令变得更深入、更具体、需要更多专业知识来回答。
原始指令: {seed_instruction}
进化后的指令:""",

            "broaden": f"""将以下指令扩展到更广泛的场景，增加约束条件。
原始指令: {seed_instruction}
进化后的指令:""",

            "concretize": f"""将以下指令变得更具体，添加具体的数字、场景、约束。
原始指令: {seed_instruction}
进化后的指令:""",

            "complicate": f"""增加以下指令的复杂度，加入多步骤要求或条件分支。
原始指令: {seed_instruction}
进化后的指令:""",
        }
        
        prompt = evolution_prompts.get(evolution_type, evolution_prompts["deepen"])
        # response = call_llm(self.strong_model, prompt)
        # return response
        return prompt  # 框架示例
    
    # ========== 合成方法 2：拒绝采样 ==========
    def rejection_sampling(
        self,
        instruction: str,
        n_samples: int = 8,
        temperature: float = 0.8,
    ) -> dict:
        """拒绝采样：生成多个 → 评分 → 选最优"""
        # 生成 n 个候选回复
        candidates = []
        for i in range(n_samples):
            # response = call_llm(self.strong_model, instruction, temperature=temperature)
            # candidates.append(response)
            pass
        
        # 多维度评分
        scored = []
        for resp in candidates:
            score = self._score_response(instruction, resp)
            scored.append({"response": resp, "score": score})
        
        # 选择最高分
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[0] if scored else None
    
    def _score_response(self, instruction: str, response: str) -> float:
        """回复质量评分"""
        score = 0.0
        
        # 1. 长度合理性 (0-0.2)
        resp_len = len(response)
        if 200 < resp_len < 3000:
            score += 0.2
        elif resp_len >= 100:
            score += 0.1
        
        # 2. 格式质量 (0-0.2)
        has_structure = any(marker in response for marker in 
                          ['##', '- ', '1.', '```', '|'])
        if has_structure:
            score += 0.2
        
        # 3. 指令相关性 (0-0.3) — 简化版
        instruction_keywords = set(instruction.lower().split())
        response_keywords = set(response.lower().split())
        overlap = len(instruction_keywords & response_keywords)
        relevance = min(overlap / max(len(instruction_keywords), 1), 1.0)
        score += relevance * 0.3
        
        # 4. 无重复/无幻觉信号 (0-0.3)
        # 检查是否有重复段落
        paragraphs = response.split('\n\n')
        unique_paras = set(p.strip() for p in paragraphs if len(p.strip()) > 50)
        if len(unique_paras) >= len(paragraphs) * 0.9:
            score += 0.15
        
        # 检查是否有明显的不确定性承认（积极信号）
        uncertainty_phrases = ['不确定', '可能', 'I\'m not sure', '需要更多信息']
        # 在适当的地方承认不确定性是好的
        
        score += 0.15  # 基础分
        
        return min(score, 1.0)
    
    # ========== 过滤管线 ==========
    def filter_pipeline(self, sample: dict) -> bool:
        """SFT 数据多级过滤"""
        instruction = sample.get("instruction", "")
        response = sample.get("response", "")
        
        # Level 1: 基础检查
        if len(instruction) < 10 or len(response) < 50:
            self.quality_stats["too_short"] += 1
            return False
        
        # Level 2: 格式检查
        if response.count('```') % 2 != 0:  # 未闭合的代码块
            self.quality_stats["broken_format"] += 1
            return False
        
        # Level 3: 重复检测
        lines = response.split('\n')
        if len(lines) > 5:
            unique_lines = set(l.strip() for l in lines if len(l.strip()) > 20)
            if len(unique_lines) < len(lines) * 0.6:
                self.quality_stats["repetitive"] += 1
                return False
        
        # Level 4: IFD 评分（需要模型推理）
        # ifd_score = compute_ifd(instruction, response, reference_model)
        # if ifd_score > threshold:  # IFD 高说明模型本来就会
        #     self.quality_stats["too_easy"] += 1
        #     return False
        
        self.quality_stats["passed"] += 1
        return True
```

### 21.4.3 SFT 数据最终配比

```python
"""
SFT 数据最终配比方案
总量：2M 条
"""

SFT_FINAL_MIX = {
    "通用对话": {
        "ratio": 0.25,
        "samples": 500_000,
        "来源": "种子进化 + 合成",
        "特点": "单轮为主，覆盖日常问答、解释、建议",
    },
    "代码生成与调试": {
        "ratio": 0.20,
        "samples": 400_000,
        "来源": "代码任务合成 + 拒绝采样",
        "特点": "Python/JS/Java/C++ 多语言，含调试场景",
        "难度分布": "简单40% / 中等40% / 困难20%",
    },
    "数学推理": {
        "ratio": 0.15,
        "samples": 300_000,
        "来源": "数学题合成 + 步骤验证",
        "特点": "要求完整推导过程，答案可验证",
    },
    "创作与翻译": {
        "ratio": 0.10,
        "samples": 200_000,
        "来源": "多样化 prompt + 高质量回复",
        "特点": "文风多样，含中英互译",
    },
    "知识问答": {
        "ratio": 0.10,
        "samples": 200_000,
        "来源": "Wikipedia/百科 + QA 格式转化",
        "特点": "覆盖科学/历史/地理/文化等",
    },
    "多轮对话": {
        "ratio": 0.10,
        "samples": 200_000,
        "来源": "合成多轮 + 人工审核",
        "特点": "平均 4-6 轮，含追问、澄清、话题切换",
    },
    "工具调用": {
        "ratio": 0.05,
        "samples": 100_000,
        "来源": "工具 API 合成",
        "特点": "函数调用、参数提取、结果解释",
    },
    "安全拒答": {
        "ratio": 0.05,
        "samples": 100_000,
        "来源": "红队测试 + 安全回复生成",
        "特点": "有害请求拒绝 + 边界场景处理",
    },
}

# 长度分布要求
SFT_LENGTH_DISTRIBUTION = {
    "短回复 (<200 tokens)":   0.15,
    "中短回复 (200-500)":     0.30,
    "中等回复 (500-1000)":    0.30,
    "中长回复 (1000-2000)":   0.18,
    "长回复 (>2000 tokens)":  0.07,
}
```

---

## 21.5 RL 数据构建

### 21.5.1 偏好数据构造（DPO）

```python
"""
DPO 偏好数据构造管线
目标：200K pairs
"""

class PreferenceDataBuilder:
    """偏好数据构造"""
    
    def build_preference_pair(
        self,
        prompt: str,
        n_responses: int = 4,
    ) -> dict:
        """构造一个偏好对"""
        
        # 步骤 1：为同一个 prompt 生成多个回复
        responses = []
        for i in range(n_responses):
            # 不同温度生成多样化回复
            temp = 0.5 + i * 0.2  # 0.5, 0.7, 0.9, 1.1
            # response = call_llm(model, prompt, temperature=temp)
            # responses.append(response)
        
        # 步骤 2：使用 LLM-as-Judge 评分
        scores = []
        for resp in responses:
            score = self._judge_response(prompt, resp)
            scores.append(score)
        
        # 步骤 3：选择最高和最低作为 chosen/rejected
        # 要求 margin > 0.5（差距要足够大）
        sorted_pairs = sorted(zip(responses, scores), key=lambda x: x[1], reverse=True)
        
        chosen = sorted_pairs[0]
        rejected = sorted_pairs[-1]
        
        margin = chosen[1] - rejected[1]
        if margin < 0.5:
            return None  # margin 太小，弃用
        
        return {
            "prompt": prompt,
            "chosen": chosen[0],
            "rejected": rejected[0],
            "chosen_score": chosen[1],
            "rejected_score": rejected[1],
            "margin": margin,
        }
    
    def _judge_response(self, prompt: str, response: str) -> float:
        """LLM-as-Judge 评分（含位置消偏）"""
        
        judge_prompt = f"""请对以下 AI 助手的回复进行评分（1-10 分）。

评分标准：
1. 准确性：信息是否正确
2. 有用性：是否真正回答了问题
3. 清晰性：表达是否清楚易懂
4. 完整性：是否全面覆盖了要点
5. 安全性：是否有任何有害内容

用户问题: {prompt}

AI 回复: {response}

请给出 1-10 的综合评分，只输出数字："""
        
        # score_str = call_llm("gpt-4-turbo", judge_prompt, temperature=0)
        # return float(score_str) / 10.0
        return 0.0  # 框架示例

# Margin 分布要求
PREFERENCE_MARGIN_DISTRIBUTION = {
    "easy (margin > 3.0)":    "30% — 明显好/差的对比",
    "medium (1.5 < m < 3.0)": "50% — 模型需要学习的主体",
    "hard (0.5 < m < 1.5)":   "20% — 微妙的质量差异",
}
```

### 21.5.2 推理增强 RL 数据

```python
"""
推理增强 RL 数据构造
使用可验证奖励进行 GRPO 训练
"""

class ReasoningRLDataBuilder:
    """推理 RL 数据构造"""
    
    def build_math_rl_data(self, target_count: int = 100_000) -> dict:
        """数学 RL 数据"""
        
        difficulty_tiers = {
            "tier1_warmup": {
                "ratio": 0.20,
                "solve_rate_target": "60-80%",
                "source": "GSM8K 变体",
                "description": "热身阶段，建立基本推理模式",
            },
            "tier2_learning": {
                "ratio": 0.40,
                "solve_rate_target": "30-50%",
                "source": "MATH level 3-4",
                "description": "主要学习区，最大信息增益",
            },
            "tier3_challenge": {
                "ratio": 0.30,
                "solve_rate_target": "15-30%",
                "source": "MATH level 5 + 合成难题",
                "description": "挑战区，推动能力边界",
            },
            "tier4_frontier": {
                "ratio": 0.10,
                "solve_rate_target": "5-15%",
                "source": "竞赛题 + 极难合成题",
                "description": "前沿区，少量但有价值",
            },
        }
        
        return {
            "total": target_count,
            "tiers": difficulty_tiers,
            "reward_type": "verifiable — 答案匹配",
            "format": "每题含标准答案，用于自动奖励计算",
        }
    
    def build_code_rl_data(self, target_count: int = 150_000) -> dict:
        """代码 RL 数据"""
        
        return {
            "total": target_count,
            "difficulty_distribution": {
                "function_level": {
                    "ratio": 0.40,
                    "description": "单函数实现，有测试用例",
                    "avg_test_cases": 10,
                },
                "file_level": {
                    "ratio": 0.35,
                    "description": "多函数/类实现，模块级测试",
                    "avg_test_cases": 15,
                },
                "project_level": {
                    "ratio": 0.25,
                    "description": "多文件项目，集成测试",
                    "avg_test_cases": 20,
                },
            },
            "reward_type": "verifiable — 测试用例通过率",
            "languages": {
                "python": 0.50,
                "javascript": 0.20,
                "java": 0.15,
                "c++": 0.15,
            },
        }
    
    def dynamic_difficulty_adjustment(
        self,
        current_solve_rates: dict,
        target_solve_rate: float = 0.35,
    ) -> dict:
        """动态难度调整"""
        adjustments = {}
        for tier, rate in current_solve_rates.items():
            if rate > target_solve_rate + 0.15:
                adjustments[tier] = "↑ 提升难度或减少此级别比例"
            elif rate < target_solve_rate - 0.15:
                adjustments[tier] = "↓ 降低难度或增加此级别比例"
            else:
                adjustments[tier] = "✓ 在最佳学习区"
        
        return adjustments
```

### 21.5.3 最终评估

```python
"""
全流程评估方案
"""

FINAL_EVALUATION = {
    "通用能力": {
        "MMLU (5-shot)": {"target": "> 62", "baseline": "Qwen2.5-7B: 63.2"},
        "C-Eval (5-shot)": {"target": "> 72", "baseline": "Qwen2.5-7B: 74.1"},
        "HellaSwag (10-shot)": {"target": "> 77", "baseline": "Llama3.1-8B: 78.5"},
        "ARC-Challenge (25-shot)": {"target": "> 55", "baseline": "Qwen2.5-7B: 56.3"},
    },
    "代码能力": {
        "HumanEval": {"target": "> 65", "note": "代码增强重点"},
        "MBPP": {"target": "> 60"},
    },
    "数学能力": {
        "GSM8K": {"target": "> 75", "note": "数学增强重点"},
        "MATH": {"target": "> 40"},
    },
    "对话能力": {
        "MT-Bench": {"target": "> 7.5", "note": "多轮对话"},
        "AlpacaEval 2.0": {"target": "> 20% LC win rate"},
    },
    "安全性": {
        "TruthfulQA": {"target": "> 50"},
        "内部红队测试": {"target": "有害回复率 < 3%"},
    },
}

# 评估时间表
EVAL_SCHEDULE = """
| 阶段 | 评估频率 | 评估集 | 决策 |
|------|---------|--------|------|
| 预训练 | 每 20B tokens | MMLU, C-Eval, HellaSwag | 监控收敛，检查数据质量 |
| 中训练 | 每 2B tokens | 全量 benchmark | 遗忘监控，决定是否调整配比 |
| SFT | 每 epoch | MT-Bench + 人工抽检 | 调整数据配比或停止训练 |
| RL | 每 5K steps | MT-Bench + 安全测试 | 监控 reward hacking |
| 最终 | 一次性全量 | 全部 benchmark + 人工盲测 | 决定是否发布 |
"""
```

---

## 21.6 全流程时间线与成本估算

```python
"""
7B 模型全流程数据工程时间线与成本
"""

PROJECT_TIMELINE = {
    "第 1-2 周": {
        "任务": "需求分析 + 数据源调研 + 管线原型",
        "人力": "数据工程师 ×2, 研究员 ×1",
        "关键输出": "数据策略文档、处理管线 v0.1",
    },
    "第 3-6 周": {
        "任务": "预训练数据全量处理 + 迭代",
        "人力": "数据工程师 ×3, GPU 集群用于质量模型推理",
        "关键输出": "420B tokens 预训练数据 v1.0",
        "计算资源": "32×A100 用于质量分类器推理",
    },
    "第 7-8 周": {
        "任务": "中训练数据准备 + 预训练启动",
        "人力": "数据工程师 ×2（中训练数据）, 训练工程师 ×2（启动预训练）",
        "关键输出": "42B tokens 中训练数据",
    },
    "第 9-12 周": {
        "任务": "预训练进行中 + SFT/RL 数据并行准备",
        "人力": "数据工程师 ×2（SFT数据）, 标注团队 ×5（种子数据）",
        "关键输出": "2M SFT 数据 + 500K RL 数据",
        "计算资源": "256×H100 预训练 + 16×A100 数据合成",
    },
    "第 13 周": {
        "任务": "中训练",
        "关键输出": "中训练完成的 checkpoint",
    },
    "第 14 周": {
        "任务": "SFT + RL",
        "关键输出": "最终模型",
    },
    "第 15 周": {
        "任务": "全量评估 + 问题修复",
        "关键输出": "评估报告，决定是否发布",
    },
}

COST_ESTIMATE = {
    "计算成本": {
        "预训练 (256×H100×30天)": "~$800K",
        "中训练 (256×H100×5天)": "~$130K",
        "SFT+RL (64×H100×5天)": "~$35K",
        "数据处理 (32×A100×30天)": "~$65K",
        "评估 (8×A100×10天)": "~$5K",
        "小计": "~$1.03M",
    },
    "数据成本": {
        "存储 (50TB×3个月)": "~$5K",
        "数据下载带宽": "~$2K",
        "标注人力 (种子数据+质量审核)": "~$30K",
        "合成数据 API 调用": "~$15K",
        "小计": "~$52K",
    },
    "人力成本 (15周)": {
        "数据工程师 ×3": "~$45K",
        "训练工程师 ×2": "~$30K",
        "研究员 ×1": "~$15K",
        "小计": "~$90K",
    },
    "总计": "~$1.17M",
}
```

---

## 本章要点回顾

| 要点 | 说明 |
|------|------|
| **数据准备是主要工作** | 数据工程占项目总时间的 60-70%，远超训练本身 |
| **小模型代理很重要** | 用 400M 模型做配比实验可以节省大量算力 |
| **四阶段数据量递减** | 420B → 42B → 4B → 2B tokens，但单条价值递增 |
| **遗忘防控从数据开始** | 中训练阶段 30% 的回放数据是防止遗忘的第一道防线 |
| **SFT 重质量不重数量** | 100 条精心设计的种子数据比 10 万条随机数据更重要 |
| **RL 需要可验证奖励** | 数学和代码的可验证奖励大幅降低了人工偏好标注的需求 |
| **迭代是常态** | 预训练数据经历了 5 个版本迭代才达到最终质量 |
| **成本结构** | 算力占 88%，数据处理占 5%，人力占 7% |

> **💡 最重要的一课**：没有完美的数据，只有足够好的数据和持续改进的流程。与其追求一次性做到完美，不如建立一个快速迭代的数据工程体系。好的数据工程不是一个项目，而是一种能力。
