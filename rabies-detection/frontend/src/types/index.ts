// TypeScript types for the Rabies Detection API

export interface PredictRequest {
  patient_name: string;
  age: number;
  gender: string;
  animal_bite: number;
  animal_type: string;
  bite_severity: string;
  wound_location: string;
  days_since_bite: number;
  vaccination_status: number;
  wound_washed: number;
  pep_started: number;
  fever: number;
  tingling_at_wound: number;
  hydrophobia: number;
  confusion: number;
  muscle_spasms: number;
  paralysis: number;
}

export interface FeatureWeight {
  feature: string;
  weight: number;
}

export interface PredictResponse {
  id: number;
  patient_name: string;
  risk_level: 'Low' | 'Medium' | 'High';
  final_probability: number;
  symptom_boost: number;
  top_features: FeatureWeight[];
  recommendations: string[];
  created_at: string;
}

export interface PredictionHistoryItem {
  id: number;
  patient_name: string;
  risk_level: 'Low' | 'Medium' | 'High';
  probability: number;
  created_at: string;
}

export interface ModelInfo {
  accuracy: number;
  auroc: number;
  confusion_matrix: number[][];
  feature_importances: FeatureWeight[];
}
