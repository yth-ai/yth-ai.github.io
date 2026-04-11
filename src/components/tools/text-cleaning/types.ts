// ============================================================
// LLM 预训练数据工坊 — 类型定义
// ============================================================

export interface StepConfig {
  [key: string]: number | boolean | string | string[];
}

export interface StepResult {
  text: string;
  removed: number;
  details: string[];
}

export interface PipelineStep {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  configurable?: boolean;
  config?: StepConfig;
  configSchema?: ConfigField[];
  process: (text: string, config?: StepConfig) => StepResult;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'select';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface PipelineResult {
  step: PipelineStep;
  input: string;
  output: string;
  removed: number;
  details: string[];
  retentionRate: number;
}

export interface PipelinePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  steps: string[];
  configs?: Record<string, StepConfig>;
}

export interface SampleData {
  id: string;
  name: string;
  description: string;
  icon: string;
  text: string;
}

export type TabId = 'workbench' | 'presets' | 'insights';
