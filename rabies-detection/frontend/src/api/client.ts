import axios from 'axios';
import type { PredictRequest, PredictResponse, PredictionHistoryItem, ModelInfo } from '../types';

const BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const predictRisk = async (data: PredictRequest): Promise<PredictResponse> => {
  const res = await api.post<PredictResponse>('/api/predict', data);
  return res.data;
};

export const getHistory = async (): Promise<PredictionHistoryItem[]> => {
  const res = await api.get<PredictionHistoryItem[]>('/api/history');
  return res.data;
};

export const getPrediction = async (id: number): Promise<PredictResponse> => {
  const res = await api.get<PredictResponse>(`/api/predictions/${id}`);
  return res.data;
};

export const getModelInfo = async (): Promise<ModelInfo> => {
  const res = await api.get<ModelInfo>('/api/model-info');
  return res.data;
};

export const checkHealth = async (): Promise<{ status: string; version: string }> => {
  const res = await api.get('/health');
  return res.data;
};

export default api;
