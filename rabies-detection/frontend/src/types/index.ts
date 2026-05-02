// TypeScript types for the Rabies Prediction API

export type RiskLevel = 'Low' | 'Medium' | 'High';
export type BinaryFlag = 0 | 1;
export type Gender = 'male' | 'female';
export type AnimalType = 'dog' | 'cat' | 'monkey' | 'bat' | 'wild_animal' | 'none';
export type BiteSeverity = 'Mild' | 'Moderate' | 'Severe' | 'None';
export type WoundLocation = 'Limb' | 'Trunk' | 'Head/Neck' | 'None';

export interface PredictRequest {
  patient_name: string;
  age: number;
  gender: Gender;
  animal_bite: BinaryFlag;
  animal_type: AnimalType;
  bite_severity: BiteSeverity;
  wound_location: WoundLocation;
  days_since_bite: number;
  vaccination_status: BinaryFlag;
  wound_washed: BinaryFlag;
  pep_started: BinaryFlag;
  fever: BinaryFlag;
  tingling_at_wound: BinaryFlag;
  hydrophobia: BinaryFlag;
  confusion: BinaryFlag;
  muscle_spasms: BinaryFlag;
  paralysis: BinaryFlag;
}

export interface FeatureWeight {
  feature: string;
  weight: number;
}

export interface PredictResponse {
  id: number;
  patient_name: string;
  risk_level: RiskLevel;
  final_probability: number;
  symptom_boost: number;
  top_features: FeatureWeight[];
  recommendations: string[];
  created_at: string;
}

export interface PredictionHistoryItem {
  id: number;
  patient_name: string;
  risk_level: RiskLevel;
  probability: number;
  created_at: string;
}

export interface ModelInfo {
  model_name?: string;
  problem_type?: string;
  training_rows?: number;
  train_size?: number;
  test_size?: number;
  accuracy: number;
  auroc: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  confusion_matrix: number[][];
  feature_importances: FeatureWeight[];
  trained_at_utc?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface ApiErrorResponse {
  detail?: string | { message?: string } | Array<{ msg?: string }>;
  message?: string;
}