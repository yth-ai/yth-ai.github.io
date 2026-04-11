---
title: "中训练实验管理规范"
description: "中训练（Mid-Training / Continual Pre-Training）实验的标准化流程，涵盖实验设计、超参选择、监控和评估。"
date: 2026-03-17
category: "技术文档"
tags: ["中训练", "实验管理", "持续预训练", "最佳实践"]
---

## 术语定义

| 术语 | 英文 | 定义 |
|------|------|------|
| 中训练 | Mid-Training | 在预训练基座模型上，使用特定领域/能力数据继续预训练 |
| CPT | Continual Pre-Training | 与中训练含义相同，业界通用术语 |
| 基座模型 | Base Model | 作为中训练起点的预训练模型 |
| 灾难性遗忘 | Catastrophic Forgetting | 新知识学习导致旧知识丢失的现象 |
| 回放数据 | Replay Data | 混入的通用数据，用于缓解遗忘 |

## 实验设计规范

### 实验命名约定

```
{基座模型}-cpt-{数据描述}-{数据量}-{日期}

示例:
llama3-8b-cpt-zhmath-50b-20260318
qwen2.5-72b-cpt-code-100b-20260315
deepseek-v3-cpt-medical-20b-20260310
```

### 实验计划模板

每个中训练实验开始前，必须填写以下实验计划：

```yaml
experiment:
  name: "llama3-8b-cpt-zhmath-50b"
  owner: "yutinghao"
  date: "2026-03-18"
  status: "planned"  # planned → running → completed → analyzed
  
  # 1. 目标
  objective: |
    在 LLaMA-3-8B 基础上注入中文数学推理能力，
    目标在 GSM8K-zh 上提升 15+ 个百分点，
    同时在通用 benchmark 上降幅 < 3%。
  
  # 2. 基座模型
  base_model:
    name: "meta-llama/Meta-Llama-3-8B"
    checkpoint: "hf-main"
    base_benchmark:  # 中训练前的基线分数
      mmlu: 66.6
      gsm8k: 56.8
      humaneval: 33.5
      ceval: 52.1
      gsm8k_zh: 38.2
  
  # 3. 训练数据
  data:
    sources:
      - name: "zh_math_textbooks"
        tokens: 20B
        ratio: 0.40
        description: "中文数学教材+教辅"
      - name: "zh_math_problems"
        tokens: 10B
        ratio: 0.20
        description: "数学题库+解答"
      - name: "general_replay"
        tokens: 15B
        ratio: 0.30
        description: "通用中英文回放数据"
      - name: "code_math"
        tokens: 5B
        ratio: 0.10
        description: "数学相关代码(Python/LaTeX)"
    total_tokens: 50B
    
  # 4. 超参数
  hyperparameters:
    # 学习率
    peak_lr: 2.0e-5         # 通常为预训练 lr 的 1/10 ~ 1/5
    min_lr: 2.0e-6           # 最低学习率
    warmup_ratio: 0.05       # warmup 占比
    lr_scheduler: "cosine"
    
    # batch size
    global_batch_size: 4M    # tokens
    micro_batch_size: 8      # per GPU
    gradient_accumulation: 16
    
    # 序列长度
    max_seq_length: 8192
    
    # 其他
    weight_decay: 0.1
    adam_beta1: 0.9
    adam_beta2: 0.95
    max_grad_norm: 1.0
    
  # 5. 资源
  resources:
    gpus: "8×A100-80G"
    estimated_time: "72 hours"
    estimated_cost: "$2,160"  # 按 $3.5/GPU-hour
    
  # 6. 评估计划
  evaluation:
    frequency: "every 5B tokens"
    benchmarks:
      target:   # 目标提升
        - gsm8k_zh
        - math
      monitor:  # 监控不退化
        - mmlu
        - ceval
        - humaneval
        - gsm8k
    early_stop:
      metric: "gsm8k_zh"
      patience: 3  # 连续 3 次评估无提升则停止
```

## 超参数选择指南

### 学习率

中训练最关键的超参数。选择原则：

| 场景 | 推荐 Peak LR | 理由 |
|------|-------------|------|
| 小规模注入 (<10B tokens) | 预训练 LR × 0.05~0.1 | 避免扰动过大 |
| 中等规模 (10-100B tokens) | 预训练 LR × 0.1~0.2 | 平衡学习与保持 |
| 大规模训练 (>100B tokens) | 预训练 LR × 0.2~0.5 | 需要充分吸收新知识 |
| 领域差异大 | 偏小 | 过大容易遗忘 |
| 领域差异小 | 偏大 | 可以更激进 |

**学习率调度的关键决策**：

```
方案 A: 从 0 warmup 到 peak，再 cosine decay
  → 适合长时间中训练（>50B tokens）
  → 优点：标准流程，稳定
  
方案 B: 从基座模型最终 LR 继续，直接 cosine decay
  → 适合短时间中训练（<10B tokens）
  → 优点：更平滑的过渡
  
方案 C: 从高 LR 快速 warmup，cosine decay 到极低值
  → 适合需要大幅改变模型行为的场景
  → 风险：遗忘最严重
```

### 回放数据配比

回放数据（Replay Data）是缓解灾难性遗忘的核心机制。经验法则：

```python
# 回放比例计算
def compute_replay_ratio(
    domain_distance: float,  # 0-1, 新数据与通用数据的领域距离
    training_tokens: float,  # 总训练 token 数 (B)
    base_model_size: float,  # 基座模型参数量 (B)
) -> float:
    """
    经验公式，仅供参考
    """
    base_ratio = 0.3  # 基础回放比例
    
    # 领域距离越大，需要更多回放
    distance_factor = 1 + domain_distance * 0.5
    
    # 训练越久，需要更多回放
    duration_factor = 1 + min(training_tokens / 50, 1.0) * 0.3
    
    # 模型越小，越容易遗忘
    size_factor = 1 + max(0, (1 - base_model_size / 70)) * 0.2
    
    ratio = base_ratio * distance_factor * duration_factor * size_factor
    return min(ratio, 0.6)  # 回放比例上限 60%
```

实际项目中的经验值：

| 中训练目标 | 推荐回放比例 | 说明 |
|-----------|-------------|------|
| 语言注入（如中文） | 30-40% | 需要保持英文能力 |
| 代码增强 | 20-30% | 代码与通用能力正相关 |
| 领域知识（如医疗） | 40-50% | 领域差异大，遗忘风险高 |
| 数学推理增强 | 25-35% | 推理能力有一定迁移性 |

## 训练过程监控

### 必监控指标

```yaml
monitoring:
  # 每 100 steps 记录
  step_level:
    - training_loss
    - learning_rate
    - gradient_norm
    - tokens_per_second
    
  # 每 1000 steps 记录
  periodic:
    - loss_by_data_source     # 分数据源的 loss
    - perplexity_on_held_out  # held-out 集困惑度
    
  # 每 5B tokens 评估
  evaluation:
    - all_benchmarks
    - generation_quality_samples  # 人工检查生成质量
```

### Loss 异常检测

```python
class LossMonitor:
    def __init__(self, window_size: int = 100):
        self.history = deque(maxlen=window_size)
        
    def check(self, loss: float, step: int) -> list[str]:
        alerts = []
        self.history.append(loss)
        
        if len(self.history) < 10:
            return alerts
            
        mean_loss = np.mean(self.history)
        std_loss = np.std(self.history)
        
        # Loss 突然飙升
        if loss > mean_loss + 3 * std_loss:
            alerts.append(f"CRITICAL: Loss spike at step {step}: "
                         f"{loss:.4f} (mean: {mean_loss:.4f})")
        
        # Loss 持续上升（最近 50 步的趋势）
        if len(self.history) >= 50:
            recent = list(self.history)[-50:]
            slope = np.polyfit(range(50), recent, 1)[0]
            if slope > 0.001:
                alerts.append(f"WARNING: Loss trending up at step {step}, "
                             f"slope: {slope:.6f}")
        
        # Loss 停滞（标准差极低）
        if std_loss < 0.0001 and len(self.history) == self.history.maxlen:
            alerts.append(f"INFO: Loss plateau detected at step {step}")
            
        return alerts
```

### 遗忘检测

定期在通用 benchmark 上评估，并设置遗忘阈值：

```python
FORGETTING_THRESHOLDS = {
    "mmlu":      {"max_drop": 3.0, "alert_drop": 2.0},   # 绝对分数下降
    "ceval":     {"max_drop": 3.0, "alert_drop": 2.0},
    "humaneval": {"max_drop": 5.0, "alert_drop": 3.0},
    "gsm8k":     {"max_drop": 3.0, "alert_drop": 2.0},
}

def check_forgetting(current_scores: dict, base_scores: dict) -> list[str]:
    alerts = []
    for benchmark, thresholds in FORGETTING_THRESHOLDS.items():
        drop = base_scores[benchmark] - current_scores[benchmark]
        if drop > thresholds["max_drop"]:
            alerts.append(
                f"CRITICAL: {benchmark} dropped {drop:.1f}% "
                f"(threshold: {thresholds['max_drop']}%)")
        elif drop > thresholds["alert_drop"]:
            alerts.append(
                f"WARNING: {benchmark} dropped {drop:.1f}%")
    return alerts
```

## 评估与分析

### 评估维度矩阵

```
                    目标能力提升    通用能力保持    生成质量
                   ┌────────────┬────────────┬──────────┐
  定量评估         │ 目标bench  │ 通用bench  │ PPL/BLEU │
                   │ (GSM8K-zh) │ (MMLU等)   │          │
                   ├────────────┼────────────┼──────────┤
  定性评估         │ 案例分析   │ 对比生成   │ 人工评分 │
                   │            │            │          │
                   ├────────────┼────────────┼──────────┤
  Ablation         │ 数据配比   │ LR 影响    │ 回放效果 │
                   │ 消融实验   │ 消融实验   │ 消融实验 │
                   └────────────┴────────────┴──────────┘
```

### 实验报告模板

每个实验完成后需提交以下报告：

```markdown
# 实验报告: {实验名称}

## 基本信息
- 实验 ID: {id}
- 基座模型: {model}
- 训练数据: {data_summary}
- 训练时长: {hours}h
- 资源消耗: {gpus} × {hours}h = {gpu_hours} GPU·hours

## 结果摘要

### 目标指标
| Benchmark | 基座分数 | 中训练后 | 变化 | 达标? |
|-----------|---------|---------|------|-------|
| ... | ... | ... | ... | ✅/❌ |

### 通用指标
| Benchmark | 基座分数 | 中训练后 | 变化 | 在阈值内? |
|-----------|---------|---------|------|-----------|
| ... | ... | ... | ... | ✅/⚠️/❌ |

## 训练曲线
- [Loss 曲线截图]
- [LR 调度曲线]
- [关键 benchmark 随训练进度的变化]

## 关键发现
1. ...
2. ...

## 下一步
- [ ] ...
- [ ] ...
```

## 常见问题与对策

### Q1: Loss 在训练初期出现大幅波动

**可能原因**：
- 学习率过大
- 数据分布与基座模型训练数据差异过大
- batch size 不够大

**对策**：
1. 降低 peak LR 到原来的 50%
2. 增加 warmup 步数（从 5% 到 10%）
3. 检查数据中是否存在质量异常样本

### Q2: 通用能力严重退化

**可能原因**：
- 回放数据比例不足
- 学习率过大
- 训练数据领域过于狭窄

**对策**：
1. 增加回放数据比例（+10-20%）
2. 降低学习率
3. 增加回放数据的多样性（不只用维基百科）

### Q3: 目标能力提升不明显

**可能原因**：
- 训练数据质量不够高
- 训练 token 数不足
- 基座模型已经具备较强的该能力

**对策**：
1. 审查训练数据质量，增加高质量数据比例
2. 延长训练时间
3. 对比分析基座模型的错误模式，针对性准备数据

### Q4: 不同 checkpoint 表现差异大

**可能原因**：
- 训练过程不稳定
- 评估有随机性

**对策**：
1. 对每个 checkpoint 多次评估取平均
2. 观察最近 3 个 checkpoint 的趋势而非单点
3. 保存更密的 checkpoint（如每 1B tokens）

## 参考配置库

### 配置 A: 小规模语言注入 (7-13B, <20B tokens)

```yaml
peak_lr: 1e-5
warmup_ratio: 0.10
lr_scheduler: cosine
replay_ratio: 0.35
max_seq_length: 4096
global_batch_size: 2M
```

### 配置 B: 中规模领域增强 (7-70B, 20-100B tokens)

```yaml
peak_lr: 2e-5
warmup_ratio: 0.05
lr_scheduler: cosine
replay_ratio: 0.30
max_seq_length: 8192
global_batch_size: 4M
```

### 配置 C: 大规模能力注入 (70B+, >100B tokens)

```yaml
peak_lr: 5e-6
warmup_ratio: 0.03
lr_scheduler: cosine_with_restarts
replay_ratio: 0.40
max_seq_length: 8192
global_batch_size: 8M
```
