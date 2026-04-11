---
title: "服务部署与系统架构"
description: "从单机到万卡集群——构建高可用、低延迟的 LLM 推理服务"
date: 2026-03-21
bookSlug: "llm-complete"
chapter: 14
part: "第四部分：推理与部署"
partOrder: 4
tags: ["部署", "服务架构", "负载均衡", "GPU 集群", "成本优化"]
---

## LLM 服务的独特挑战

部署 LLM 不同于传统的 ML serving。核心差异：

| 维度 | 传统 ML 服务 | LLM 服务 |
|------|------------|---------|
| 延迟模式 | 固定延迟 | **流式输出**（首 token 延迟 + 逐 token 延迟） |
| 请求时长 | 毫秒级 | **秒到分钟级** |
| 资源占用 | KB 级 | **GB 级**（KV Cache） |
| 负载特征 | 均匀 | **长尾分布**（输出长度差异巨大） |
| GPU 利用率 | 容易达 80%+ | **不优化只有 10-30%** |

## 系统架构全景

一个生产级 LLM 推理系统通常包含以下层次：

```
┌─────────────────────────────────────────────────┐
│                    客户端层                        │
│         Web / Mobile / API Clients              │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│                  网关层 (Gateway)                  │
│   速率限制 │ 认证鉴权 │ 请求路由 │ 流量控制       │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│                调度层 (Scheduler)                  │
│   请求队列 │ 优先级管理 │ 模型路由 │ 负载均衡      │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│                推理层 (Inference Engine)           │
│   vLLM / TRT-LLM / SGLang                       │
│   Batching │ KV Cache │ 量化 │ 并行策略          │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│               硬件层 (GPU Cluster)                │
│   H100/A100 │ NVLink │ InfiniBand │ 存储        │
└─────────────────────────────────────────────────┘
```

## 关键指标

### 延迟指标

| 指标 | 定义 | 典型目标 |
|------|------|---------|
| **TTFT** (Time to First Token) | 从请求到首个 token | <500ms |
| **TPOT** (Time Per Output Token) | 相邻输出 token 间隔 | <50ms |
| **E2E Latency** | 请求到完整响应 | 取决于长度 |
| **P99 Latency** | 99 分位延迟 | <3x 中位数 |

### 吞吐量指标

| 指标 | 定义 | 说明 |
|------|------|------|
| **QPS** | 每秒处理请求数 | 整体容量 |
| **Tokens/s** | 每秒生成 token 数 | 更精确的度量 |
| **并发数** | 同时处理的请求数 | 与 KV Cache 显存相关 |

### 成本指标

$$\text{成本效率} = \frac{\text{Tokens/s}}{\text{GPU 数量} \times \text{GPU 单价}}$$

或者更直观的：**每百万 token 的美元成本**。

## 负载均衡与调度

### 请求特征

LLM 请求有极大的异质性：

```
请求 A: 输入 50 tokens, 输出 20 tokens   → 轻量
请求 B: 输入 8000 tokens, 输出 2000 tokens → 重量
请求 C: 输入 100 tokens, 输出 5000 tokens  → 生成密集
```

传统的 round-robin 或最少连接数策略不适用。更好的方法：

### Token-Aware 负载均衡

根据**预估的 token 处理量**（而非请求数）来分配：

$$\text{Load}_i = \sum_{r \in \text{active}(i)} (\text{input\_len}_r + \text{estimated\_output\_len}_r)$$

将新请求分配给 $\text{Load}$ 最小的 worker。

### 优先级队列

不同的请求可能有不同的优先级：

```
高优先级: 付费 API 用户 → 保证 SLA
中优先级: 免费 API 用户 → Best effort
低优先级: 批处理任务    → 填充空闲 GPU
```

实现方式：多级队列 + 抢占（preemption）。低优先级请求可以被中断，保存 KV Cache 到 CPU 内存，让高优先级请求先执行。[vLLM](https://github.com/vllm-project/vllm) 支持请求级别的抢占。

## 模型并行部署

### Tensor Parallelism (TP)

将单个模型的权重矩阵切分到多张 GPU：

```
TP=2 部署:
GPU 0: 权重的前半部分    GPU 1: 权重的后半部分
        ↓                        ↓
    部分计算                   部分计算
        └──── AllReduce ────────┘
                  ↓
              完整结果
```

**特点**：
- 需要高带宽互连（NVLink，~900 GB/s）
- 减少单卡显存占用
- 增加通信开销（每层两次 AllReduce）
- 适合同一节点内的 GPU

### Pipeline Parallelism (PP)

将模型的不同层放在不同 GPU 上：

```
PP=2 部署:
GPU 0: Layer 0-39    GPU 1: Layer 40-79
         │                    │
     前 40 层计算  ──→    后 40 层计算
```

**特点**：
- 节点间通信量小（只传 hidden states）
- 可用较低带宽的网络（InfiniBand，~400 Gb/s）
- 有"气泡"（pipeline bubble）问题
- 适合跨节点部署

### 混合并行

生产环境通常组合使用：

```
4 节点 × 8 GPU 部署 (70B 模型):
  - TP=4 (节点内 NVLink)
  - PP=2 (跨节点 InfiniBand)
  - 剩余 GPU 做 replicas
```

## 前缀缓存（Prefix Caching）

很多 LLM 请求共享相同的前缀：

```
系统提示 (所有请求相同):
  "你是一个有帮助的 AI 助手，请用中文回答。"

多轮对话 (前几轮相同):
  "[用户第1轮] ... [助手第1轮] ... [用户第2轮] ..."
  └──────────── 这部分已经计算过 ──────────────┘
```

**前缀缓存**（也叫 prompt caching）将共享前缀的 KV Cache 缓存起来复用：

- [SGLang 的 RadixAttention](https://arxiv.org/abs/2312.07104)：用 Radix Tree 管理前缀共享
- [vLLM 的 Automatic Prefix Caching](https://docs.vllm.ai/en/latest/automatic_prefix_caching/apc.html)：自动检测和复用
- OpenAI / Anthropic / DeepSeek 的 API 都支持 prompt caching，可节省 50-90% 的 prefill 成本

## 多模型管理

生产环境通常需要同时部署多个模型（不同大小、不同版本、不同能力）。

### 模型路由

根据请求特征自动选择最合适的模型：

```python
def route_request(request):
    if request.requires_reasoning:
        return "deepseek-r1-671b"  # 推理任务用大模型
    elif request.is_simple_qa:
        return "qwen-7b"          # 简单问答用小模型
    elif request.language == "code":
        return "deepseek-coder-33b"  # 代码任务用专用模型
    else:
        return "qwen-72b"         # 默认中等模型
```

[RouteLLM](https://arxiv.org/abs/2406.18665)（LMSYS）训练了一个轻量级路由器，根据查询复杂度自动在强模型和弱模型之间路由，在保持 95% 质量的同时减少 50%+ 的成本。

### A/B 测试与灰度发布

新模型上线流程：

```
阶段 1: 影子模式（1% 流量，只记录不返回）
阶段 2: 灰度发布（5% 流量，对比指标）
阶段 3: 逐步放量（5% → 20% → 50% → 100%）
阶段 4: 全量切换
```

关键监控指标：延迟 P50/P99、用户满意度、错误率、安全指标。

## GPU 集群运维

### 硬件故障应对

大规模 GPU 集群的故障率不可忽视：

| 故障类型 | 频率（千卡/天） | 影响 | 应对 |
|---------|---------------|------|------|
| GPU 掉卡 | ~0.1% | 单卡不可用 | 自动驱逐 + 替换 |
| NVLink 降级 | ~0.05% | 通信变慢 | 降级运行 + 维修 |
| 内存 ECC 错误 | ~0.01% | 计算错误 | 自动重启 + 替换 |
| 节点宕机 | ~0.01% | 多卡不可用 | 请求迁移 |

**应对策略**：

1. **健康检查**：每分钟探测 GPU 状态、显存、温度
2. **自动故障转移**：检测到异常后自动将请求路由到健康节点
3. **冗余部署**：N+1 或 N+2 冗余，确保单点故障不影响服务
4. **优雅降级**：GPU 不足时，优先保证高优先级请求

### 显存管理

```
70B 模型显存分配（单卡 80GB H100, TP=4）:
  模型权重:     ~35 GB (FP16, TP=4 → 每卡 ~9 GB)
  KV Cache:     ~50 GB (动态分配)
  临时缓冲区:    ~5 GB
  CUDA 开销:    ~2 GB
  可用余量:      ~14 GB (安全边际)
```

## 成本优化策略

### 1. Spot/Preemptible Instances

云厂商的抢占式实例通常比按需实例便宜 60-70%。适合：
- 批处理推理（可以被打断重试）
- 低优先级请求
- 非实时场景

### 2. 混合精度部署

```
高峰期: FP8/INT8, TP=2 → 高吞吐
低谷期: 释放 GPU → 降低成本
```

### 3. 自动扩缩容

```yaml
# 伪代码: 基于队列深度的扩缩容策略
autoscaler:
  metric: queue_depth_per_gpu
  target: 5  # 每张 GPU 排队 5 个请求
  scale_up:
    threshold: 10
    cooldown: 60s
  scale_down:
    threshold: 2
    cooldown: 300s
  min_replicas: 2
  max_replicas: 32
```

### 4. 请求优化

- **Prompt 压缩**：去除冗余的系统提示，使用更简洁的指令
- **Max tokens 限制**：设置合理的最大输出长度
- **缓存复用**：相似请求复用结果（语义缓存）
- **Early stopping**：检测到循环或无意义输出时提前终止

## 可观测性

### 关键监控面板

```
实时指标:
├── QPS（当前/峰值）
├── TTFT P50/P99
├── TPOT P50/P99
├── GPU 利用率（计算/显存）
├── KV Cache 使用率
├── 队列深度
├── 错误率
└── 每秒生成 tokens

告警规则:
├── TTFT P99 > 2s → 告警
├── GPU 利用率 < 20% 持续 10min → 缩容提醒
├── GPU 利用率 > 90% 持续 5min → 扩容告警
├── 错误率 > 1% → 紧急告警
└── KV Cache 使用率 > 90% → 容量告警
```

### 分布式追踪

每个请求的完整生命周期追踪：

```
Request → Gateway (认证, 2ms)
  → Scheduler (排队, 15ms)
  → Engine.prefill (计算, 120ms)
  → Engine.decode (生成 200 tokens, 4000ms)
  → Response streaming
Total: 4137ms, 200 tokens, ~48 tok/s
```

## 端到端部署示例

### 方案一：快速启动（单卡/多卡）

```bash
# vLLM 一键部署
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3-70b-instruct \
  --tensor-parallel-size 4 \
  --gpu-memory-utilization 0.9 \
  --max-model-len 8192 \
  --port 8000
```

### 方案二：生产环境（Kubernetes）

```yaml
# 简化的 K8s 部署配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-inference
spec:
  replicas: 4
  template:
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        resources:
          limits:
            nvidia.com/gpu: 4
        env:
        - name: MODEL
          value: "meta-llama/Llama-3-70b-instruct"
        - name: TENSOR_PARALLEL_SIZE
          value: "4"
```

## 章节小结

1. LLM 服务的核心挑战是**长尾延迟**和**资源异质性**
2. **TTFT** 和 **TPOT** 是最关键的延迟指标
3. **Token-aware 负载均衡**比传统方法更适合 LLM 场景
4. **前缀缓存**在多轮对话和共享系统提示场景下效果显著
5. **模型路由**可以在保持质量的同时大幅降低成本
6. **可观测性**是生产部署的基石——你无法优化你看不到的东西
