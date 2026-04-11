import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ============================================================
// 「百模大战・一镜到底」—— 100 个大模型的全景点阵图谱
// ============================================================

interface ModelData {
  id: string;
  name: string;
  company: string;
  country: string;
  params: number; // billion
  released: string; // YYYY-MM
  openSource: boolean;
  category: string;
  scores: { mmlu: number; humaneval: number; math: number; reasoning: number; chinese: number };
  parentId?: string; // 技术传承
  highlight?: string;
  color?: string;
}

// 100 个大模型完整数据
const MODELS: ModelData[] = [
  // ===== OpenAI =====
  { id: 'gpt3', name: 'GPT-3', company: 'OpenAI', country: 'US', params: 175, released: '2020-06', openSource: false, category: '基座模型', scores: { mmlu: 43, humaneval: 0, math: 15, reasoning: 30, chinese: 20 }, highlight: '开启大模型时代' },
  { id: 'codex', name: 'Codex', company: 'OpenAI', country: 'US', params: 12, released: '2021-08', openSource: false, category: '代码模型', scores: { mmlu: 35, humaneval: 72, math: 20, reasoning: 35, chinese: 10 }, parentId: 'gpt3', highlight: 'GitHub Copilot 基座' },
  { id: 'instructgpt', name: 'InstructGPT', company: 'OpenAI', country: 'US', params: 175, released: '2022-01', openSource: false, category: '对齐模型', scores: { mmlu: 52, humaneval: 30, math: 25, reasoning: 40, chinese: 25 }, parentId: 'gpt3', highlight: 'RLHF 首次大规模应用' },
  { id: 'chatgpt', name: 'ChatGPT', company: 'OpenAI', country: 'US', params: 175, released: '2022-11', openSource: false, category: '对话模型', scores: { mmlu: 60, humaneval: 48, math: 35, reasoning: 50, chinese: 35 }, parentId: 'instructgpt', highlight: '2 个月破亿用户' },
  { id: 'gpt4', name: 'GPT-4', company: 'OpenAI', country: 'US', params: 1800, released: '2023-03', openSource: false, category: '基座模型', scores: { mmlu: 86, humaneval: 67, math: 52, reasoning: 78, chinese: 65 }, parentId: 'chatgpt', highlight: '多模态 + MoE' },
  { id: 'gpt4turbo', name: 'GPT-4 Turbo', company: 'OpenAI', country: 'US', params: 1800, released: '2023-11', openSource: false, category: '基座模型', scores: { mmlu: 87, humaneval: 72, math: 58, reasoning: 80, chinese: 70 }, parentId: 'gpt4' },
  { id: 'gpt4o', name: 'GPT-4o', company: 'OpenAI', country: 'US', params: 200, released: '2024-05', openSource: false, category: '多模态', scores: { mmlu: 88, humaneval: 90, math: 76, reasoning: 83, chinese: 75 }, parentId: 'gpt4turbo', highlight: 'Omni: 文本+语音+视觉' },
  { id: 'gpt4omini', name: 'GPT-4o mini', company: 'OpenAI', country: 'US', params: 8, released: '2024-07', openSource: false, category: '轻量模型', scores: { mmlu: 82, humaneval: 87, math: 70, reasoning: 75, chinese: 68 }, parentId: 'gpt4o', highlight: '性价比之王' },
  { id: 'o1preview', name: 'o1-preview', company: 'OpenAI', country: 'US', params: 300, released: '2024-09', openSource: false, category: '推理模型', scores: { mmlu: 92, humaneval: 93, math: 94, reasoning: 95, chinese: 72 }, parentId: 'gpt4o', highlight: 'Chain-of-Thought 推理' },
  { id: 'o1', name: 'o1', company: 'OpenAI', country: 'US', params: 300, released: '2024-12', openSource: false, category: '推理模型', scores: { mmlu: 93, humaneval: 95, math: 96, reasoning: 97, chinese: 75 }, parentId: 'o1preview' },
  { id: 'o3', name: 'o3', company: 'OpenAI', country: 'US', params: 400, released: '2025-04', openSource: false, category: '推理模型', scores: { mmlu: 95, humaneval: 97, math: 97, reasoning: 98, chinese: 78 }, parentId: 'o1', highlight: 'ARC-AGI 突破' },
  { id: 'gpt5', name: 'GPT-5', company: 'OpenAI', country: 'US', params: 2000, released: '2025-08', openSource: false, category: '基座模型', scores: { mmlu: 96, humaneval: 96, math: 95, reasoning: 96, chinese: 82 }, parentId: 'gpt4o', highlight: '原生多模态' },
  // ===== Google DeepMind =====
  { id: 'palm', name: 'PaLM', company: 'Google', country: 'US', params: 540, released: '2022-04', openSource: false, category: '基座模型', scores: { mmlu: 69, humaneval: 36, math: 34, reasoning: 55, chinese: 30 }, highlight: '540B 稠密模型' },
  { id: 'palm2', name: 'PaLM 2', company: 'Google', country: 'US', params: 340, released: '2023-05', openSource: false, category: '基座模型', scores: { mmlu: 81, humaneval: 60, math: 48, reasoning: 70, chinese: 55 }, parentId: 'palm' },
  { id: 'gemini1', name: 'Gemini 1.0', company: 'Google', country: 'US', params: 1500, released: '2023-12', openSource: false, category: '多模态', scores: { mmlu: 83, humaneval: 62, math: 53, reasoning: 72, chinese: 60 }, parentId: 'palm2', highlight: '原生多模态架构' },
  { id: 'gemini15pro', name: 'Gemini 1.5 Pro', company: 'Google', country: 'US', params: 1500, released: '2024-02', openSource: false, category: '多模态', scores: { mmlu: 86, humaneval: 72, math: 68, reasoning: 80, chinese: 65 }, parentId: 'gemini1', highlight: '100 万 Token 上下文' },
  { id: 'gemini2flash', name: 'Gemini 2.0 Flash', company: 'Google', country: 'US', params: 70, released: '2024-12', openSource: false, category: '轻量模型', scores: { mmlu: 85, humaneval: 80, math: 72, reasoning: 78, chinese: 68 }, parentId: 'gemini15pro' },
  { id: 'gemini25pro', name: 'Gemini 2.5 Pro', company: 'Google', country: 'US', params: 1500, released: '2025-03', openSource: false, category: '推理模型', scores: { mmlu: 94, humaneval: 95, math: 93, reasoning: 96, chinese: 80 }, parentId: 'gemini2flash', highlight: '思考+行动一体' },
  { id: 'gemma', name: 'Gemma 2B', company: 'Google', country: 'US', params: 2, released: '2024-02', openSource: true, category: '轻量模型', scores: { mmlu: 52, humaneval: 22, math: 18, reasoning: 35, chinese: 20 }, parentId: 'gemini1' },
  { id: 'gemma2', name: 'Gemma 2 27B', company: 'Google', country: 'US', params: 27, released: '2024-06', openSource: true, category: '基座模型', scores: { mmlu: 75, humaneval: 55, math: 50, reasoning: 65, chinese: 45 }, parentId: 'gemma' },
  // ===== Anthropic =====
  { id: 'claude1', name: 'Claude 1', company: 'Anthropic', country: 'US', params: 130, released: '2023-03', openSource: false, category: '对话模型', scores: { mmlu: 74, humaneval: 45, math: 35, reasoning: 60, chinese: 35 }, highlight: 'Constitutional AI' },
  { id: 'claude2', name: 'Claude 2', company: 'Anthropic', country: 'US', params: 175, released: '2023-07', openSource: false, category: '对话模型', scores: { mmlu: 78, humaneval: 56, math: 42, reasoning: 68, chinese: 45 }, parentId: 'claude1', highlight: '100K 上下文' },
  { id: 'claude3opus', name: 'Claude 3 Opus', company: 'Anthropic', country: 'US', params: 500, released: '2024-03', openSource: false, category: '基座模型', scores: { mmlu: 86, humaneval: 84, math: 60, reasoning: 82, chinese: 68 }, parentId: 'claude2', highlight: '首次超越 GPT-4' },
  { id: 'claude35sonnet', name: 'Claude 3.5 Sonnet', company: 'Anthropic', country: 'US', params: 175, released: '2024-06', openSource: false, category: '基座模型', scores: { mmlu: 89, humaneval: 92, math: 78, reasoning: 87, chinese: 75 }, parentId: 'claude3opus', highlight: '编程能力碾压' },
  { id: 'claude37sonnet', name: 'Claude 3.7 Sonnet', company: 'Anthropic', country: 'US', params: 200, released: '2025-02', openSource: false, category: '推理模型', scores: { mmlu: 91, humaneval: 94, math: 85, reasoning: 92, chinese: 78 }, parentId: 'claude35sonnet', highlight: '混合推理模式' },
  { id: 'claude4opus', name: 'Claude Opus 4', company: 'Anthropic', country: 'US', params: 600, released: '2025-06', openSource: false, category: '推理模型', scores: { mmlu: 95, humaneval: 97, math: 93, reasoning: 97, chinese: 82 }, parentId: 'claude37sonnet', highlight: '长时自主 Agent' },
  // ===== Meta =====
  { id: 'llama1', name: 'LLaMA', company: 'Meta', country: 'US', params: 65, released: '2023-02', openSource: true, category: '基座模型', scores: { mmlu: 63, humaneval: 24, math: 18, reasoning: 42, chinese: 15 }, highlight: '开源运动开端' },
  { id: 'llama2', name: 'Llama 2', company: 'Meta', country: 'US', params: 70, released: '2023-07', openSource: true, category: '基座模型', scores: { mmlu: 68, humaneval: 30, math: 22, reasoning: 48, chinese: 22 }, parentId: 'llama1', highlight: '真正开放许可证' },
  { id: 'codellama', name: 'Code Llama', company: 'Meta', country: 'US', params: 34, released: '2023-08', openSource: true, category: '代码模型', scores: { mmlu: 48, humaneval: 53, math: 28, reasoning: 40, chinese: 12 }, parentId: 'llama2' },
  { id: 'llama3', name: 'Llama 3 70B', company: 'Meta', country: 'US', params: 70, released: '2024-04', openSource: true, category: '基座模型', scores: { mmlu: 82, humaneval: 81, math: 50, reasoning: 72, chinese: 48 }, parentId: 'llama2', highlight: '15T Token 训练' },
  { id: 'llama31', name: 'Llama 3.1 405B', company: 'Meta', country: 'US', params: 405, released: '2024-07', openSource: true, category: '基座模型', scores: { mmlu: 87, humaneval: 89, math: 73, reasoning: 82, chinese: 60 }, parentId: 'llama3', highlight: '最大开源模型' },
  { id: 'llama32', name: 'Llama 3.2 Vision', company: 'Meta', country: 'US', params: 90, released: '2024-09', openSource: true, category: '多模态', scores: { mmlu: 84, humaneval: 82, math: 65, reasoning: 75, chinese: 52 }, parentId: 'llama31', highlight: '开源多模态' },
  { id: 'llama4', name: 'Llama 4 Maverick', company: 'Meta', country: 'US', params: 400, released: '2025-04', openSource: true, category: '基座模型', scores: { mmlu: 90, humaneval: 92, math: 82, reasoning: 88, chinese: 70 }, parentId: 'llama32', highlight: 'MoE 架构' },
  // ===== DeepSeek =====
  { id: 'deepseekv1', name: 'DeepSeek V1', company: 'DeepSeek', country: 'CN', params: 67, released: '2024-01', openSource: true, category: '基座模型', scores: { mmlu: 72, humaneval: 73, math: 45, reasoning: 58, chinese: 72 }, highlight: '国产之光' },
  { id: 'deepseekcode', name: 'DeepSeek-Coder V2', company: 'DeepSeek', country: 'CN', params: 236, released: '2024-06', openSource: true, category: '代码模型', scores: { mmlu: 78, humaneval: 90, math: 68, reasoning: 72, chinese: 75 }, parentId: 'deepseekv1', highlight: 'MoE 代码专家' },
  { id: 'deepseekv2', name: 'DeepSeek V2', company: 'DeepSeek', country: 'CN', params: 236, released: '2024-05', openSource: true, category: '基座模型', scores: { mmlu: 78, humaneval: 81, math: 60, reasoning: 70, chinese: 78 }, parentId: 'deepseekv1', highlight: 'MLA + DeepSeekMoE' },
  { id: 'deepseekv25', name: 'DeepSeek V2.5', company: 'DeepSeek', country: 'CN', params: 236, released: '2024-09', openSource: true, category: '基座模型', scores: { mmlu: 80, humaneval: 89, math: 68, reasoning: 75, chinese: 82 }, parentId: 'deepseekv2' },
  { id: 'deepseekv3', name: 'DeepSeek V3', company: 'DeepSeek', country: 'CN', params: 671, released: '2024-12', openSource: true, category: '基座模型', scores: { mmlu: 88, humaneval: 93, math: 82, reasoning: 85, chinese: 90 }, parentId: 'deepseekv25', highlight: 'FP8 训练 + 2048 GPU' },
  { id: 'deepseekr1', name: 'DeepSeek R1', company: 'DeepSeek', country: 'CN', params: 671, released: '2025-01', openSource: true, category: '推理模型', scores: { mmlu: 90, humaneval: 97, math: 97, reasoning: 97, chinese: 88 }, parentId: 'deepseekv3', highlight: 'GRPO 纯 RL 推理' },
  // ===== Alibaba / Qwen =====
  { id: 'qwen1', name: 'Qwen', company: 'Alibaba', country: 'CN', params: 72, released: '2023-08', openSource: true, category: '基座模型', scores: { mmlu: 65, humaneval: 52, math: 38, reasoning: 48, chinese: 75 } },
  { id: 'qwen15', name: 'Qwen 1.5', company: 'Alibaba', country: 'CN', params: 72, released: '2024-02', openSource: true, category: '基座模型', scores: { mmlu: 73, humaneval: 62, math: 48, reasoning: 58, chinese: 80 }, parentId: 'qwen1' },
  { id: 'qwen2', name: 'Qwen 2', company: 'Alibaba', country: 'CN', params: 72, released: '2024-06', openSource: true, category: '基座模型', scores: { mmlu: 83, humaneval: 80, math: 62, reasoning: 72, chinese: 85 }, parentId: 'qwen15' },
  { id: 'qwen25', name: 'Qwen 2.5 72B', company: 'Alibaba', country: 'CN', params: 72, released: '2024-09', openSource: true, category: '基座模型', scores: { mmlu: 86, humaneval: 88, math: 75, reasoning: 80, chinese: 90 }, parentId: 'qwen2', highlight: '中文最强开源' },
  { id: 'qwen25coder', name: 'Qwen 2.5-Coder', company: 'Alibaba', country: 'CN', params: 32, released: '2024-11', openSource: true, category: '代码模型', scores: { mmlu: 72, humaneval: 92, math: 68, reasoning: 70, chinese: 80 }, parentId: 'qwen25' },
  { id: 'qwen3', name: 'Qwen 3', company: 'Alibaba', country: 'CN', params: 235, released: '2025-04', openSource: true, category: '基座模型', scores: { mmlu: 92, humaneval: 95, math: 90, reasoning: 92, chinese: 95 }, parentId: 'qwen25', highlight: 'MoE + 思考模式' },
  { id: 'qwenvl', name: 'Qwen-VL', company: 'Alibaba', country: 'CN', params: 72, released: '2024-08', openSource: true, category: '多模态', scores: { mmlu: 78, humaneval: 55, math: 42, reasoning: 62, chinese: 82 }, parentId: 'qwen2' },
  // ===== Mistral =====
  { id: 'mistral7b', name: 'Mistral 7B', company: 'Mistral', country: 'EU', params: 7, released: '2023-09', openSource: true, category: '轻量模型', scores: { mmlu: 60, humaneval: 30, math: 22, reasoning: 42, chinese: 15 }, highlight: '小模型革命' },
  { id: 'mixtral', name: 'Mixtral 8x7B', company: 'Mistral', country: 'EU', params: 46, released: '2023-12', openSource: true, category: '基座模型', scores: { mmlu: 70, humaneval: 45, math: 38, reasoning: 55, chinese: 25 }, parentId: 'mistral7b', highlight: '开源 MoE 验证' },
  { id: 'mistralmedium', name: 'Mistral Medium', company: 'Mistral', country: 'EU', params: 70, released: '2024-02', openSource: false, category: '基座模型', scores: { mmlu: 75, humaneval: 50, math: 42, reasoning: 60, chinese: 30 }, parentId: 'mixtral' },
  { id: 'mistrallarge', name: 'Mistral Large 2', company: 'Mistral', country: 'EU', params: 123, released: '2024-07', openSource: false, category: '基座模型', scores: { mmlu: 84, humaneval: 78, math: 68, reasoning: 78, chinese: 50 }, parentId: 'mistralmedium' },
  { id: 'mistralsmall3', name: 'Mistral Small 3', company: 'Mistral', country: 'EU', params: 24, released: '2025-01', openSource: true, category: '轻量模型', scores: { mmlu: 78, humaneval: 72, math: 55, reasoning: 68, chinese: 40 }, parentId: 'mistrallarge' },
  // ===== xAI =====
  { id: 'grok1', name: 'Grok-1', company: 'xAI', country: 'US', params: 314, released: '2023-11', openSource: true, category: '基座模型', scores: { mmlu: 73, humaneval: 63, math: 40, reasoning: 58, chinese: 20 }, highlight: 'Elon Musk 的 AI' },
  { id: 'grok2', name: 'Grok-2', company: 'xAI', country: 'US', params: 600, released: '2024-08', openSource: false, category: '基座模型', scores: { mmlu: 87, humaneval: 82, math: 68, reasoning: 80, chinese: 45 }, parentId: 'grok1' },
  { id: 'grok3', name: 'Grok-3', company: 'xAI', country: 'US', params: 1000, released: '2025-02', openSource: false, category: '推理模型', scores: { mmlu: 93, humaneval: 90, math: 88, reasoning: 94, chinese: 55 }, parentId: 'grok2', highlight: '10 万 H100 训练' },
  // ===== Cohere =====
  { id: 'command', name: 'Command', company: 'Cohere', country: 'US', params: 52, released: '2023-04', openSource: false, category: '对话模型', scores: { mmlu: 58, humaneval: 25, math: 18, reasoning: 42, chinese: 15 } },
  { id: 'commandr', name: 'Command R+', company: 'Cohere', country: 'US', params: 104, released: '2024-04', openSource: true, category: '基座模型', scores: { mmlu: 75, humaneval: 55, math: 40, reasoning: 60, chinese: 30 }, parentId: 'command', highlight: 'RAG 优化' },
  { id: 'commandrplus2', name: 'Command A', company: 'Cohere', country: 'US', params: 111, released: '2025-03', openSource: true, category: '基座模型', scores: { mmlu: 82, humaneval: 72, math: 60, reasoning: 72, chinese: 42 }, parentId: 'commandr' },
  // ===== 百度 =====
  { id: 'ernie35', name: 'ERNIE 3.5', company: 'Baidu', country: 'CN', params: 260, released: '2023-03', openSource: false, category: '基座模型', scores: { mmlu: 68, humaneval: 42, math: 35, reasoning: 52, chinese: 78 }, highlight: '文心一言' },
  { id: 'ernie4', name: 'ERNIE 4.0', company: 'Baidu', country: 'CN', params: 400, released: '2023-10', openSource: false, category: '基座模型', scores: { mmlu: 76, humaneval: 55, math: 45, reasoning: 62, chinese: 82 }, parentId: 'ernie35' },
  { id: 'ernie45', name: 'ERNIE 4.5', company: 'Baidu', country: 'CN', params: 500, released: '2025-06', openSource: true, category: '基座模型', scores: { mmlu: 85, humaneval: 80, math: 72, reasoning: 78, chinese: 88 }, parentId: 'ernie4', highlight: '原生多模态 MoE' },
  // ===== 智谱 =====
  { id: 'glm130b', name: 'GLM-130B', company: 'Zhipu', country: 'CN', params: 130, released: '2022-08', openSource: true, category: '基座模型', scores: { mmlu: 55, humaneval: 25, math: 20, reasoning: 38, chinese: 60 }, highlight: '中英双语' },
  { id: 'chatglm3', name: 'ChatGLM3', company: 'Zhipu', country: 'CN', params: 6, released: '2023-10', openSource: true, category: '对话模型', scores: { mmlu: 60, humaneval: 52, math: 35, reasoning: 48, chinese: 72 }, parentId: 'glm130b' },
  { id: 'glm4', name: 'GLM-4', company: 'Zhipu', country: 'CN', params: 100, released: '2024-01', openSource: false, category: '基座模型', scores: { mmlu: 78, humaneval: 72, math: 55, reasoning: 68, chinese: 82 }, parentId: 'chatglm3' },
  { id: 'glm4plus', name: 'GLM-4-Plus', company: 'Zhipu', country: 'CN', params: 200, released: '2024-08', openSource: false, category: '基座模型', scores: { mmlu: 83, humaneval: 82, math: 68, reasoning: 78, chinese: 88 }, parentId: 'glm4' },
  // ===== 01.AI =====
  { id: 'yi34b', name: 'Yi-34B', company: '01.AI', country: 'CN', params: 34, released: '2023-11', openSource: true, category: '基座模型', scores: { mmlu: 74, humaneval: 42, math: 32, reasoning: 55, chinese: 78 }, highlight: '李开复的大模型' },
  { id: 'yilarge', name: 'Yi-Large', company: '01.AI', country: 'CN', params: 200, released: '2024-05', openSource: false, category: '基座模型', scores: { mmlu: 82, humaneval: 68, math: 55, reasoning: 72, chinese: 85 }, parentId: 'yi34b' },
  { id: 'yilightning', name: 'Yi-Lightning', company: '01.AI', country: 'CN', params: 100, released: '2024-10', openSource: false, category: '基座模型', scores: { mmlu: 85, humaneval: 78, math: 65, reasoning: 78, chinese: 88 }, parentId: 'yilarge' },
  // ===== 月之暗面 =====
  { id: 'moonshot', name: 'Moonshot v1', company: 'Kimi', country: 'CN', params: 100, released: '2024-03', openSource: false, category: '对话模型', scores: { mmlu: 72, humaneval: 55, math: 42, reasoning: 58, chinese: 82 }, highlight: '200K 上下文' },
  { id: 'k15', name: 'Kimi k1.5', company: 'Kimi', country: 'CN', params: 200, released: '2025-01', openSource: false, category: '推理模型', scores: { mmlu: 86, humaneval: 85, math: 80, reasoning: 88, chinese: 88 }, parentId: 'moonshot', highlight: '长思维链推理' },
  // ===== MiniMax =====
  { id: 'minimax01', name: 'MiniMax-01', company: 'MiniMax', country: 'CN', params: 456, released: '2025-01', openSource: true, category: '基座模型', scores: { mmlu: 82, humaneval: 78, math: 65, reasoning: 72, chinese: 85 }, highlight: '100 万 Token Lightning Attn' },
  // ===== NVIDIA =====
  { id: 'nemotron4', name: 'Nemotron-4 340B', company: 'NVIDIA', country: 'US', params: 340, released: '2024-06', openSource: true, category: '基座模型', scores: { mmlu: 78, humaneval: 62, math: 48, reasoning: 65, chinese: 30 }, highlight: '合成数据管线' },
  { id: 'nemotron5', name: 'Nemotron-5 8B', company: 'NVIDIA', country: 'US', params: 8, released: '2025-05', openSource: true, category: '轻量模型', scores: { mmlu: 74, humaneval: 70, math: 55, reasoning: 62, chinese: 35 }, parentId: 'nemotron4' },
  // ===== 微软 =====
  { id: 'phi2', name: 'Phi-2', company: 'Microsoft', country: 'US', params: 2.7, released: '2023-12', openSource: true, category: '轻量模型', scores: { mmlu: 56, humaneval: 47, math: 35, reasoning: 48, chinese: 12 }, highlight: '教科书式数据' },
  { id: 'phi3', name: 'Phi-3', company: 'Microsoft', country: 'US', params: 14, released: '2024-04', openSource: true, category: '轻量模型', scores: { mmlu: 78, humaneval: 62, math: 52, reasoning: 68, chinese: 25 }, parentId: 'phi2' },
  { id: 'phi4', name: 'Phi-4', company: 'Microsoft', country: 'US', params: 14, released: '2024-12', openSource: true, category: '轻量模型', scores: { mmlu: 84, humaneval: 82, math: 80, reasoning: 82, chinese: 35 }, parentId: 'phi3', highlight: '合成数据驱动' },
  // ===== 01/StepFun =====
  { id: 'step2', name: 'Step-2', company: 'StepFun', country: 'CN', params: 1000, released: '2024-07', openSource: false, category: '基座模型', scores: { mmlu: 80, humaneval: 72, math: 58, reasoning: 68, chinese: 82 }, highlight: '万亿参数 MoE' },
  // ===== Amazon =====
  { id: 'nova', name: 'Nova Pro', company: 'Amazon', country: 'US', params: 100, released: '2024-12', openSource: false, category: '多模态', scores: { mmlu: 78, humaneval: 65, math: 52, reasoning: 68, chinese: 30 } },
  // ===== Apple =====
  { id: 'apple-fm', name: 'Apple FM', company: 'Apple', country: 'US', params: 3, released: '2024-06', openSource: true, category: '轻量模型', scores: { mmlu: 48, humaneval: 22, math: 15, reasoning: 30, chinese: 12 }, highlight: '端侧智能' },
  // ===== Stability =====
  { id: 'stablelm2', name: 'StableLM 2', company: 'Stability', country: 'UK', params: 12, released: '2024-01', openSource: true, category: '轻量模型', scores: { mmlu: 55, humaneval: 28, math: 18, reasoning: 38, chinese: 10 } },
  // ===== Databricks =====
  { id: 'dbrx', name: 'DBRX', company: 'Databricks', country: 'US', params: 132, released: '2024-03', openSource: true, category: '基座模型', scores: { mmlu: 73, humaneval: 55, math: 38, reasoning: 58, chinese: 15 }, highlight: 'MoE 企业级' },
  // ===== AI21 =====
  { id: 'jamba', name: 'Jamba', company: 'AI21', country: 'IL', params: 52, released: '2024-03', openSource: true, category: '基座模型', scores: { mmlu: 67, humaneval: 35, math: 25, reasoning: 50, chinese: 10 }, highlight: 'Mamba-Transformer 混合' },
  { id: 'jamba15', name: 'Jamba 1.5 Large', company: 'AI21', country: 'IL', params: 398, released: '2024-08', openSource: true, category: '基座模型', scores: { mmlu: 76, humaneval: 52, math: 42, reasoning: 62, chinese: 18 }, parentId: 'jamba' },
  // ===== Snowflake =====
  { id: 'arctic', name: 'Arctic', company: 'Snowflake', country: 'US', params: 480, released: '2024-04', openSource: true, category: '基座模型', scores: { mmlu: 67, humaneval: 42, math: 30, reasoning: 48, chinese: 10 }, highlight: 'Dense-MoE 混合' },
  // ===== 百川 =====
  { id: 'baichuan2', name: 'Baichuan 2', company: 'Baichuan', country: 'CN', params: 53, released: '2023-09', openSource: true, category: '基座模型', scores: { mmlu: 60, humaneval: 35, math: 25, reasoning: 42, chinese: 72 } },
  { id: 'baichuan4', name: 'Baichuan 4', company: 'Baichuan', country: 'CN', params: 200, released: '2024-10', openSource: false, category: '基座模型', scores: { mmlu: 80, humaneval: 72, math: 60, reasoning: 70, chinese: 85 }, parentId: 'baichuan2' },
  // ===== 腾讯 =====
  { id: 'hunyuan', name: 'Hunyuan', company: 'Tencent', country: 'CN', params: 400, released: '2023-09', openSource: false, category: '基座模型', scores: { mmlu: 65, humaneval: 42, math: 32, reasoning: 48, chinese: 75 } },
  { id: 'hunyuanlarge', name: 'Hunyuan-Large', company: 'Tencent', country: 'CN', params: 389, released: '2024-11', openSource: true, category: '基座模型', scores: { mmlu: 82, humaneval: 78, math: 68, reasoning: 75, chinese: 86 }, parentId: 'hunyuan', highlight: 'MoE 开源' },
  // ===== Inflection =====
  { id: 'inflection25', name: 'Inflection 2.5', company: 'Inflection', country: 'US', params: 100, released: '2024-03', openSource: false, category: '对话模型', scores: { mmlu: 72, humaneval: 42, math: 32, reasoning: 55, chinese: 18 } },
  // ===== 讯飞 =====
  { id: 'spark35', name: 'Spark v3.5', company: 'iFlytek', country: 'CN', params: 100, released: '2024-01', openSource: false, category: '对话模型', scores: { mmlu: 68, humaneval: 48, math: 38, reasoning: 52, chinese: 78 } },
  { id: 'spark4', name: 'Spark v4.0', company: 'iFlytek', country: 'CN', params: 200, released: '2024-06', openSource: false, category: '对话模型', scores: { mmlu: 78, humaneval: 68, math: 55, reasoning: 68, chinese: 85 }, parentId: 'spark35' },
  // ===== 字节 =====
  { id: 'doubao', name: 'Doubao Pro', company: 'ByteDance', country: 'CN', params: 200, released: '2024-05', openSource: false, category: '基座模型', scores: { mmlu: 80, humaneval: 75, math: 60, reasoning: 72, chinese: 85 }, highlight: '云雀/豆包' },
  { id: 'doubao15', name: 'Doubao 1.5 Pro', company: 'ByteDance', country: 'CN', params: 300, released: '2025-02', openSource: false, category: '推理模型', scores: { mmlu: 88, humaneval: 88, math: 82, reasoning: 88, chinese: 90 }, parentId: 'doubao' },
  // ===== Together/开源社区 =====
  { id: 'redpajama', name: 'RedPajama', company: 'Together', country: 'US', params: 3, released: '2023-04', openSource: true, category: '基座模型', scores: { mmlu: 42, humaneval: 12, math: 8, reasoning: 25, chinese: 5 }, highlight: '开源数据集' },
  { id: 'falcon', name: 'Falcon 180B', company: 'TII', country: 'AE', params: 180, released: '2023-09', openSource: true, category: '基座模型', scores: { mmlu: 70, humaneval: 32, math: 22, reasoning: 48, chinese: 8 }, highlight: '中东 AI 力量' },
  { id: 'falcon2', name: 'Falcon 2', company: 'TII', country: 'AE', params: 11, released: '2024-05', openSource: true, category: '轻量模型', scores: { mmlu: 62, humaneval: 35, math: 25, reasoning: 42, chinese: 12 }, parentId: 'falcon' },
  // ===== 通义/其他中国 =====
  { id: 'internlm2', name: 'InternLM 2.5', company: 'Shanghai AI Lab', country: 'CN', params: 20, released: '2024-07', openSource: true, category: '基座模型', scores: { mmlu: 72, humaneval: 68, math: 55, reasoning: 62, chinese: 78 } },
  { id: 'internlm3', name: 'InternLM 3', company: 'Shanghai AI Lab', country: 'CN', params: 8, released: '2025-01', openSource: true, category: '轻量模型', scores: { mmlu: 78, humaneval: 72, math: 62, reasoning: 68, chinese: 82 }, parentId: 'internlm2' },
  { id: 'deepseekmoe', name: 'DeepSeekMoE', company: 'DeepSeek', country: 'CN', params: 145, released: '2024-01', openSource: true, category: '基座模型', scores: { mmlu: 65, humaneval: 55, math: 38, reasoning: 52, chinese: 68 }, parentId: 'deepseekv1', highlight: 'Fine-Grained MoE' },
  { id: 'deepseekcoder1', name: 'DeepSeek-Coder', company: 'DeepSeek', country: 'CN', params: 33, released: '2023-11', openSource: true, category: '代码模型', scores: { mmlu: 50, humaneval: 75, math: 35, reasoning: 42, chinese: 55 }, parentId: 'deepseekv1' },
  { id: 'deepseekmath', name: 'DeepSeek-Math', company: 'DeepSeek', country: 'CN', params: 7, released: '2024-02', openSource: true, category: '数学模型', scores: { mmlu: 48, humaneval: 30, math: 82, reasoning: 68, chinese: 45 }, parentId: 'deepseekv1', highlight: 'GRPO 首秀' },
  { id: 'abab', name: 'ABAB 6.5', company: 'MiniMax', country: 'CN', params: 200, released: '2024-07', openSource: false, category: '基座模型', scores: { mmlu: 78, humaneval: 65, math: 52, reasoning: 65, chinese: 82 } },
  { id: 'sensechat5', name: 'SenseChat 5.5', company: 'SenseTime', country: 'CN', params: 300, released: '2024-08', openSource: false, category: '基座模型', scores: { mmlu: 78, humaneval: 68, math: 55, reasoning: 68, chinese: 82 } },
  { id: 'skywork', name: 'Skywork-MoE', company: 'Kunlun', country: 'CN', params: 146, released: '2024-06', openSource: true, category: '基座模型', scores: { mmlu: 68, humaneval: 52, math: 40, reasoning: 55, chinese: 75 } },
];

// 公司颜色映射
const COMPANY_COLORS: Record<string, string> = {
  'OpenAI': '#10B981', 'Google': '#3B82F6', 'Anthropic': '#D97706',
  'Meta': '#6366F1', 'DeepSeek': '#EF4444', 'Alibaba': '#F97316',
  'Mistral': '#8B5CF6', 'xAI': '#64748B', 'Cohere': '#14B8A6',
  'Baidu': '#2563EB', 'Zhipu': '#7C3AED', '01.AI': '#EC4899',
  'Kimi': '#06B6D4', 'MiniMax': '#F59E0B', 'NVIDIA': '#84CC16',
  'Microsoft': '#0EA5E9', 'StepFun': '#E11D48', 'Amazon': '#F97316',
  'Apple': '#6B7280', 'Stability': '#A855F7', 'Databricks': '#DC2626',
  'AI21': '#0D9488', 'Snowflake': '#38BDF8', 'Baichuan': '#D946EF',
  'Tencent': '#3B82F6', 'Inflection': '#F472B6', 'iFlytek': '#EF4444',
  'ByteDance': '#06B6D4', 'Together': '#F97316', 'TII': '#EAB308',
  'Shanghai AI Lab': '#8B5CF6', 'SenseTime': '#EC4899', 'Kunlun': '#14B8A6',
};

const CATEGORIES = ['全部', '基座模型', '推理模型', '多模态', '代码模型', '对话模型', '轻量模型', '数学模型', '对齐模型'];
const COUNTRIES = ['全部', 'US', 'CN', 'EU', 'UK', 'IL', 'AE'];
const COUNTRY_NAMES: Record<string, string> = { 'US': '美国', 'CN': '中国', 'EU': '欧洲', 'UK': '英国', 'IL': '以色列', 'AE': '阿联酋' };
const SORT_OPTIONS = ['发布时间', '参数量', 'MMLU', 'HumanEval', '数学', '推理', '中文'];

type ViewMode = 'constellation' | 'timeline' | 'ranking' | 'heritage';

function parseDate(d: string) { const [y, m] = d.split('-').map(Number); return new Date(y, m - 1); }

export default function BattleOfModels() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('constellation');
  const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);
  const [hoveredModel, setHoveredModel] = useState<ModelData | null>(null);
  const [filterCategory, setFilterCategory] = useState('全部');
  const [filterCountry, setFilterCountry] = useState('全部');
  const [filterOpenSource, setFilterOpenSource] = useState<'all' | 'open' | 'closed'>('all');
  const [sortBy, setSortBy] = useState('发布时间');
  const [searchQuery, setSearchQuery] = useState('');
  const [animPhase, setAnimPhase] = useState(0);
  const animRef = useRef(0);
  const nodePositions = useRef<Map<string, { x: number; y: number; r: number }>>(new Map());

  const filteredModels = useMemo(() => {
    let result = MODELS.filter(m => {
      if (filterCategory !== '全部' && m.category !== filterCategory) return false;
      if (filterCountry !== '全部' && m.country !== filterCountry) return false;
      if (filterOpenSource === 'open' && !m.openSource) return false;
      if (filterOpenSource === 'closed' && m.openSource) return false;
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    const sortFns: Record<string, (a: ModelData, b: ModelData) => number> = {
      '发布时间': (a, b) => parseDate(a.released).getTime() - parseDate(b.released).getTime(),
      '参数量': (a, b) => b.params - a.params,
      'MMLU': (a, b) => b.scores.mmlu - a.scores.mmlu,
      'HumanEval': (a, b) => b.scores.humaneval - a.scores.humaneval,
      '数学': (a, b) => b.scores.math - a.scores.math,
      '推理': (a, b) => b.scores.reasoning - a.scores.reasoning,
      '中文': (a, b) => b.scores.chinese - a.scores.chinese,
    };
    result.sort(sortFns[sortBy] || sortFns['发布时间']);
    return result;
  }, [filterCategory, filterCountry, filterOpenSource, sortBy, searchQuery]);

  // ===== 星座图 Canvas 渲染 =====
  const drawConstellation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    // 深空背景
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    // 星尘
    for (let i = 0; i < 200; i++) {
      const sx = ((i * 137.5) % W);
      const sy = ((i * 97.3 + i * i * 0.1) % H);
      const sr = 0.3 + (i % 5) * 0.2;
      const alpha = 0.2 + (Math.sin(animPhase * 0.02 + i) * 0.5 + 0.5) * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 计算节点位置 — 按公司分群
    const companies = Array.from(new Set(filteredModels.map(m => m.company)));
    const positions = new Map<string, { x: number; y: number; r: number }>();
    const padding = 60;
    const usableW = W - padding * 2;
    const usableH = H - padding * 2;

    // 公司聚类中心 — 使用力导向的简化版
    const companyPositions = new Map<string, { cx: number; cy: number }>();
    companies.forEach((c, i) => {
      const angle = (i / companies.length) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(usableW, usableH) * 0.35;
      companyPositions.set(c, {
        cx: W / 2 + Math.cos(angle) * radius,
        cy: H / 2 + Math.sin(angle) * radius,
      });
    });

    // 每个模型在公司群内的位置
    filteredModels.forEach((m, i) => {
      const cc = companyPositions.get(m.company)!;
      const sameCompany = filteredModels.filter(mm => mm.company === m.company);
      const idx = sameCompany.indexOf(m);
      const subAngle = (idx / sameCompany.length) * Math.PI * 2;
      const subRadius = 20 + sameCompany.length * 8;
      const x = cc.cx + Math.cos(subAngle) * subRadius;
      const y = cc.cy + Math.sin(subAngle) * subRadius;
      const r = Math.max(4, Math.min(22, Math.sqrt(m.params) * 0.8));
      positions.set(m.id, { x: Math.max(padding, Math.min(W - padding, x)), y: Math.max(padding, Math.min(H - padding, y)), r });
    });
    nodePositions.current = positions;

    // 绘制传承连线
    ctx.lineWidth = 0.8;
    filteredModels.forEach(m => {
      if (m.parentId) {
        const from = positions.get(m.parentId);
        const to = positions.get(m.id);
        if (from && to) {
          const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
          const color = COMPANY_COLORS[m.company] || '#666';
          grad.addColorStop(0, color + '40');
          grad.addColorStop(1, color + '80');
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      }
    });

    // 绘制节点
    filteredModels.forEach(m => {
      const pos = positions.get(m.id);
      if (!pos) return;
      const color = COMPANY_COLORS[m.company] || '#666';
      const isHovered = hoveredModel?.id === m.id;
      const isSelected = selectedModel?.id === m.id;
      const r = pos.r * (isHovered ? 1.3 : 1) * (isSelected ? 1.4 : 1);

      // 光晕
      if (m.highlight || isHovered || isSelected) {
        const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 3);
        glow.addColorStop(0, color + '40');
        glow.addColorStop(1, color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 主体
      const nodeGrad = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.3, 0, pos.x, pos.y, r);
      nodeGrad.addColorStop(0, color + 'FF');
      nodeGrad.addColorStop(1, color + 'AA');
      ctx.fillStyle = nodeGrad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();

      // 开源标记 — 白色空心环
      if (m.openSource) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 标签
      if (r > 8 || isHovered || isSelected) {
        ctx.fillStyle = isHovered || isSelected ? '#fff' : 'rgba(255,255,255,0.8)';
        ctx.font = `${isHovered || isSelected ? 'bold ' : ''}${Math.max(9, r * 0.8)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(m.name, pos.x, pos.y + r + 14);
      }
    });

    // 公司标签
    companies.forEach(c => {
      const cc = companyPositions.get(c)!;
      const companyModels = filteredModels.filter(m => m.company === c);
      if (companyModels.length === 0) return;
      ctx.fillStyle = (COMPANY_COLORS[c] || '#666') + 'AA';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(c, cc.cx, cc.cy - 35 - companyModels.length * 4);
    });

    // 统计角标
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`${filteredModels.length} 个模型  ·  ${companies.length} 家公司  ·  点击探索`, 15, H - 15);

  }, [filteredModels, hoveredModel, selectedModel, animPhase]);

  useEffect(() => {
    if (viewMode !== 'constellation') return;
    let running = true;
    const animate = () => {
      if (!running) return;
      setAnimPhase(p => p + 1);
      animRef.current = requestAnimationFrame(animate);
    };
    // 低帧率动画
    const interval = setInterval(() => {
      if (running) drawConstellation();
    }, 50);
    animate();
    return () => { running = false; cancelAnimationFrame(animRef.current); clearInterval(interval); };
  }, [viewMode, drawConstellation]);

  // Canvas 鼠标事件
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: ModelData | null = null;
    for (const m of filteredModels) {
      const pos = nodePositions.current.get(m.id);
      if (!pos) continue;
      const dx = mx - pos.x, dy = my - pos.y;
      if (dx * dx + dy * dy < (pos.r + 5) * (pos.r + 5)) {
        found = m;
        break;
      }
    }
    setHoveredModel(found);
    if (canvas) canvas.style.cursor = found ? 'pointer' : 'default';
  }, [filteredModels]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredModel) {
      setSelectedModel(prev => prev?.id === hoveredModel.id ? null : hoveredModel);
    } else {
      setSelectedModel(null);
    }
  }, [hoveredModel]);

  // ===== 排行榜视图 =====
  const renderRanking = () => {
    const scoreKey = sortBy === 'MMLU' ? 'mmlu' : sortBy === 'HumanEval' ? 'humaneval' : sortBy === '数学' ? 'math' : sortBy === '推理' ? 'reasoning' : sortBy === '中文' ? 'chinese' : 'mmlu';
    const sorted = [...filteredModels].sort((a, b) => {
      if (sortBy === '参数量') return b.params - a.params;
      return (b.scores as any)[scoreKey] - (a.scores as any)[scoreKey];
    });

    return (
      <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
        {sorted.map((m, i) => {
          const score = sortBy === '参数量' ? m.params : (m.scores as any)[scoreKey];
          const maxScore = sortBy === '参数量' ? Math.max(...sorted.map(s => s.params)) : 100;
          const pct = (score / maxScore) * 100;
          return (
            <div key={m.id} onClick={() => setSelectedModel(m)}
              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${selectedModel?.id === m.id ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}>
              <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${i < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/40'}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm truncate">{m.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: (COMPANY_COLORS[m.company] || '#666') + '30', color: COMPANY_COLORS[m.company] }}>
                    {m.company}
                  </span>
                  {m.openSource && <span className="text-xs text-emerald-400">开源</span>}
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: COMPANY_COLORS[m.company] || '#666' }} />
                </div>
              </div>
              <span className="text-sm font-mono font-bold shrink-0" style={{ color: COMPANY_COLORS[m.company] }}>
                {sortBy === '参数量' ? `${m.params >= 1000 ? (m.params / 1000).toFixed(1) + 'T' : m.params + 'B'}` : score}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // ===== 时间线视图 =====
  const renderTimeline = () => {
    const sorted = [...filteredModels].sort((a, b) => parseDate(a.released).getTime() - parseDate(b.released).getTime());
    const years = Array.from(new Set(sorted.map(m => m.released.split('-')[0]))).sort();

    return (
      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="min-w-[1600px]">
          {years.map(year => {
            const yearModels = sorted.filter(m => m.released.startsWith(year));
            return (
              <div key={year} className="mb-6">
                <div className="flex items-center gap-3 mb-3 sticky left-0">
                  <span className="text-2xl font-black text-white/80">{year}</span>
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-white/40">{yearModels.length} 个模型</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {yearModels.map(m => (
                    <button key={m.id} onClick={() => setSelectedModel(m)}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selectedModel?.id === m.id ? 'border-white/30 bg-white/10' : 'border-white/5 hover:border-white/15 hover:bg-white/5'}`}>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COMPANY_COLORS[m.company] }} />
                      <span className="text-sm text-white/80 whitespace-nowrap">{m.name}</span>
                      <span className="text-xs text-white/30">{m.params >= 1000 ? (m.params / 1000).toFixed(1) + 'T' : m.params + 'B'}</span>
                      {m.highlight && <span className="text-xs text-amber-400">★</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ===== 技术传承视图 =====
  const renderHeritage = () => {
    // 找出有传承关系的"家族树"
    const roots = filteredModels.filter(m => !m.parentId || !filteredModels.find(p => p.id === m.parentId));
    const getChildren = (id: string): ModelData[] => filteredModels.filter(m => m.parentId === id);

    const renderTree = (model: ModelData, depth: number): JSX.Element => {
      const children = getChildren(model.id);
      return (
        <div key={model.id} className="ml-4" style={{ marginLeft: depth === 0 ? 0 : 24 }}>
          <button onClick={() => setSelectedModel(model)}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg mb-1 transition-all ${selectedModel?.id === model.id ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}>
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COMPANY_COLORS[model.company] }} />
            {depth > 0 && <span className="text-white/20 text-xs">└─</span>}
            <span className="text-sm font-medium text-white/80">{model.name}</span>
            <span className="text-xs text-white/30">{model.released}</span>
            {model.highlight && <span className="text-xs text-amber-400/80 truncate max-w-[150px]">{model.highlight}</span>}
          </button>
          {children.map(c => renderTree(c, depth + 1))}
        </div>
      );
    };

    // 按公司分组
    const companiesWithRoots = Array.from(new Set(roots.map(r => r.company)));
    return (
      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
        {companiesWithRoots.map(company => {
          const companyRoots = roots.filter(r => r.company === company);
          return (
            <div key={company}>
              <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#0a0a1a] z-10 py-1">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COMPANY_COLORS[company] }} />
                <span className="text-sm font-bold" style={{ color: COMPANY_COLORS[company] }}>{company}</span>
              </div>
              {companyRoots.map(r => renderTree(r, 0))}
            </div>
          );
        })}
      </div>
    );
  };

  // ===== 模型详情面板 =====
  const renderModelDetail = () => {
    if (!selectedModel) return null;
    const m = selectedModel;
    const dims = [
      { key: 'mmlu', label: 'MMLU', icon: '📚' },
      { key: 'humaneval', label: 'HumanEval', icon: '💻' },
      { key: 'math', label: 'Math', icon: '🔢' },
      { key: 'reasoning', label: 'Reasoning', icon: '🧠' },
      { key: 'chinese', label: 'Chinese', icon: '🇨🇳' },
    ];
    const parent = m.parentId ? MODELS.find(p => p.id === m.parentId) : null;
    const children = MODELS.filter(c => c.parentId === m.id);

    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COMPANY_COLORS[m.company] }} />
              <h3 className="text-xl font-bold text-white">{m.name}</h3>
            </div>
            <p className="text-sm text-white/50 mt-1">
              {m.company} · {COUNTRY_NAMES[m.country] || m.country} · {m.released} · {m.params >= 1000 ? (m.params / 1000).toFixed(1) + 'T' : m.params + 'B'} 参数
            </p>
          </div>
          <button onClick={() => setSelectedModel(null)} className="text-white/30 hover:text-white text-lg">✕</button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${m.openSource ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {m.openSource ? '开源' : '闭源'}
          </span>
          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">{m.category}</span>
          {m.highlight && <span className="px-2 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400">★ {m.highlight}</span>}
        </div>

        {/* 能力条 */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Benchmark 得分</h4>
          {dims.map(d => (
            <div key={d.key} className="flex items-center gap-2">
              <span className="text-xs w-20 text-white/50 shrink-0">{d.icon} {d.label}</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${(m.scores as any)[d.key]}%`,
                  backgroundColor: COMPANY_COLORS[m.company],
                }} />
              </div>
              <span className="text-xs font-mono text-white/60 w-8 text-right">{(m.scores as any)[d.key]}</span>
            </div>
          ))}
        </div>

        {/* 技术传承 */}
        {(parent || children.length > 0) && (
          <div>
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">技术传承</h4>
            {parent && (
              <button onClick={() => setSelectedModel(parent)} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-1">
                <span className="text-white/30">⬆</span> 继承自: <span className="font-medium">{parent.name}</span>
              </button>
            )}
            {children.map(c => (
              <button key={c.id} onClick={() => setSelectedModel(c)} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                <span className="text-white/30">⬇</span> 衍生: <span className="font-medium">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ===== 统计面板 =====
  const stats = useMemo(() => {
    const total = filteredModels.length;
    const openSrc = filteredModels.filter(m => m.openSource).length;
    const companies = new Set(filteredModels.map(m => m.company)).size;
    const cnModels = filteredModels.filter(m => m.country === 'CN').length;
    const usModels = filteredModels.filter(m => m.country === 'US').length;
    const avgParams = Math.round(filteredModels.reduce((s, m) => s + m.params, 0) / total);
    const maxMMLU = filteredModels.reduce((max, m) => m.scores.mmlu > max.scores.mmlu ? m : max, filteredModels[0]);
    return { total, openSrc, companies, cnModels, usModels, avgParams, maxMMLU };
  }, [filteredModels]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            百模大战
          </h1>
          <p className="text-white/50 mt-2 text-lg">一镜到底 · {MODELS.length} 个大模型的全景点阵图谱</p>
        </div>

        {/* 统计卡 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: '模型总数', value: stats.total, color: 'from-blue-500 to-cyan-500' },
            { label: '开源', value: stats.openSrc, color: 'from-emerald-500 to-green-500' },
            { label: '公司', value: stats.companies, color: 'from-purple-500 to-violet-500' },
            { label: '中国', value: stats.cnModels, color: 'from-red-500 to-orange-500' },
            { label: '美国', value: stats.usModels, color: 'from-blue-500 to-indigo-500' },
            { label: '均参数量', value: stats.avgParams >= 1000 ? (stats.avgParams / 1000).toFixed(1) + 'T' : stats.avgParams + 'B', color: 'from-amber-500 to-yellow-500' },
            { label: 'MMLU 冠军', value: stats.maxMMLU?.name || '-', color: 'from-pink-500 to-rose-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className={`text-lg font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 控制栏 */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* 视图切换 */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {([
              { key: 'constellation', label: '星座图', icon: '✦' },
              { key: 'timeline', label: '时间线', icon: '⏤' },
              { key: 'ranking', label: '排行榜', icon: '▤' },
              { key: 'heritage', label: '传承树', icon: '⎇' },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === v.key ? 'bg-white/15 text-white font-medium' : 'text-white/50 hover:text-white/70'}`}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          {/* 搜索 */}
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索模型或公司..."
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 w-48" />

          {/* 分类 */}
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70 focus:outline-none">
            {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
          </select>

          {/* 国家 */}
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70 focus:outline-none">
            {COUNTRIES.map(c => <option key={c} value={c} className="bg-gray-900">{c === '全部' ? '全部地区' : COUNTRY_NAMES[c] || c}</option>)}
          </select>

          {/* 开源筛选 */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {(['all', 'open', 'closed'] as const).map(o => (
              <button key={o} onClick={() => setFilterOpenSource(o)}
                className={`px-2.5 py-1 rounded-md text-xs transition-all ${filterOpenSource === o ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
                {o === 'all' ? '全部' : o === 'open' ? '开源' : '闭源'}
              </button>
            ))}
          </div>

          {/* 排序 */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70 focus:outline-none">
            {SORT_OPTIONS.map(s => <option key={s} value={s} className="bg-gray-900">按 {s}</option>)}
          </select>
        </div>
      </div>

      {/* 主视图区 */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：主视图 */}
          <div className="lg:col-span-2">
            {viewMode === 'constellation' && (
              <div ref={containerRef} className="relative rounded-2xl overflow-hidden border border-white/10">
                <canvas ref={canvasRef} className="w-full" style={{ height: 600 }}
                  onMouseMove={handleCanvasMouseMove} onClick={handleCanvasClick} onMouseLeave={() => setHoveredModel(null)} />
                {/* 悬浮提示 */}
                {hoveredModel && !selectedModel && (
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 p-4 max-w-[250px] pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPANY_COLORS[hoveredModel.company] }} />
                      <span className="font-bold text-white">{hoveredModel.name}</span>
                    </div>
                    <div className="text-xs text-white/50 space-y-0.5">
                      <p>{hoveredModel.company} · {hoveredModel.params}B · {hoveredModel.released}</p>
                      <p>MMLU: {hoveredModel.scores.mmlu} · HumanEval: {hoveredModel.scores.humaneval}</p>
                      {hoveredModel.highlight && <p className="text-amber-400">★ {hoveredModel.highlight}</p>}
                    </div>
                  </div>
                )}
                {/* 图例 */}
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1 bg-black/60 rounded px-2 py-1">
                    <div className="w-2 h-2 rounded-full bg-white/50" />
                    <span className="text-xs text-white/40">闭源</span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/60 rounded px-2 py-1">
                    <div className="w-2 h-2 rounded-full bg-white/50 ring-1 ring-white/50 ring-offset-1 ring-offset-black" />
                    <span className="text-xs text-white/40">开源</span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/60 rounded px-2 py-1">
                    <span className="text-xs text-white/40">圆点大小 = 参数量</span>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'timeline' && (
              <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-6">
                {renderTimeline()}
              </div>
            )}

            {viewMode === 'ranking' && (
              <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white/80">
                    {sortBy === '参数量' ? '参数量排行' : `${sortBy} 得分排行`}
                  </h3>
                </div>
                {renderRanking()}
              </div>
            )}

            {viewMode === 'heritage' && (
              <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white/80 mb-4">技术传承树</h3>
                {renderHeritage()}
              </div>
            )}
          </div>

          {/* 右侧：详情面板 */}
          <div className="lg:col-span-1">
            {selectedModel ? renderModelDetail() : (
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
                <div className="text-4xl mb-4 opacity-30">✦</div>
                <p className="text-white/40 text-sm">点击任意模型查看详细信息</p>
                <div className="mt-6 space-y-3 text-left">
                  <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">关于这张图谱</h4>
                  <p className="text-xs text-white/30 leading-relaxed">
                    这张图谱收录了 {MODELS.length} 个主要大语言模型，涵盖 {new Set(MODELS.map(m => m.company)).size} 家公司/实验室。
                    数据来源为公开论文、技术博客和评测排行榜。
                  </p>
                  <div className="border-t border-white/5 pt-3 mt-3">
                    <p className="text-xs text-white/30">
                      <span className="text-amber-400">★</span> 标记表示该模型有标志性里程碑意义。
                      连线表示技术传承关系。圆环标记表示开源模型。
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-3 mt-3 space-y-1.5">
                    <p className="text-xs text-white/50 font-medium">彩蛋发现</p>
                    <p className="text-xs text-white/30">
                      🔍 试试筛选"推理模型"——2024 年底的推理革命一目了然
                    </p>
                    <p className="text-xs text-white/30">
                      🔍 切换到"传承树"视图——看 OpenAI 从 GPT-3 到 o3 的演化路径
                    </p>
                    <p className="text-xs text-white/30">
                      🔍 按"中文"排序——看谁在中文能力上真正领先
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部洞察 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl border border-red-500/10 p-5">
            <div className="text-2xl mb-2">🇨🇳 vs 🇺🇸</div>
            <h4 className="font-bold text-white/90 mb-2">中美 AI 军备竞赛</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              中国 {stats.cnModels} 个模型 vs 美国 {stats.usModels} 个模型。中国在开源模型数量上已超过美国，
              DeepSeek R1 和 Qwen 3 在多项评测上达到国际一线水平。
              但在闭源顶级模型（GPT-5/Claude 4/Gemini 2.5）上仍有差距。
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl border border-emerald-500/10 p-5">
            <div className="text-2xl mb-2">📖</div>
            <h4 className="font-bold text-white/90 mb-2">开源浪潮</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              {stats.openSrc} / {stats.total} 个模型是开源的（{Math.round(stats.openSrc / stats.total * 100)}%）。
              从 2023 年 LLaMA 泄露引发的"意外开源"，到 2025 年 DeepSeek/Qwen/Llama 主动开源，
              开源已成为获取开发者生态的核心策略。
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-2xl border border-purple-500/10 p-5">
            <div className="text-2xl mb-2">🧠</div>
            <h4 className="font-bold text-white/90 mb-2">推理模型革命</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              2024 年 9 月 o1-preview 发布后，"推理模型"成为新主线。
              DeepSeek R1 用 GRPO 证明了纯 RL 也能产生推理能力，
              到 2025 年 Gemini 2.5 Pro 实现了"思考+行动"的融合。
              推理时间计算正在取代参数规模成为新的 Scaling 维度。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-white/20">
          <p>数据截至 2026 年 3 月 · Benchmark 分数为综合估算值 · 参数量为公开信息或合理推测</p>
          <p className="mt-1">这整个页面——100 个模型的数据、4 种视图、所有交互——由一个 AI 在一次对话中生成</p>
        </div>
      </div>
    </div>
  );
}
