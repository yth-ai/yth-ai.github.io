export interface AIModel {
  id: string;
  name: string;
  provider: string;
  color: string;
  energyPerMToken: number; // kWh per 1M tokens (inference)
  isMoE?: boolean; // Mixture of Experts architecture
  activeParams?: string; // e.g. "37B active / 671B total"
  uncertaintyRange: number; // ±percentage, e.g. 0.4 means ±40%
  capabilityScore: number; // 0-100, simplified MMLU/Arena ELO composite
  pricePerMToken: number; // USD per 1M output tokens
  notes: string;
}

export interface PresetScenario {
  label: string;
  description: string;
  tokens: number;
  icon: string;
}

export interface EquivalentItem {
  label: string;
  icon: string;
  perGramCO2: number; // how many gCO2 = 1 unit
  unit: string;
}

export interface RegionInfo {
  label: string;
  gCO2perKWh: number;
  color: string;
}

export interface TaskType {
  id: string;
  label: string;
  description: string;
  tokensEquivalent: number; // equivalent tokens for energy calculation
  icon: string;
}

export interface DayActivity {
  id: string;
  taskTypeId: string;
  modelId: string;
  quantity: number; // times or minutes depending on task type
  label: string;
}

export interface CalcResult {
  energyKWh: number;
  co2Grams: number;
  waterML: number;
  yearlyGlobalCO2: number;
  yearlyGlobalKWh: number;
}
