import axios, { AxiosError, type AxiosInstance } from 'axios';
import type {
  PredictRequest,
  PredictResponse,
  PredictionHistoryItem,
  ModelInfo,
} from '../types';

type HealthResponse = {
  status: string;
  version: string;
};

type ApiErrorResponse = {
  detail?: string | { message?: string } | Array<{ msg?: string }>;
  message?: string;
};

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://127.0.0.1:8000';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const extractErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong. Please try again.';
  }

  const axiosError = error as AxiosError<ApiErrorResponse>;

  if (axiosError.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }

  if (!axiosError.response) {
    return 'Unable to connect to server. Please check if backend is running.';
  }

  const { status, data } = axiosError.response;

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }

  if (
    Array.isArray(data?.detail) &&
    data.detail.length > 0 &&
    typeof data.detail[0]?.msg === 'string'
  ) {
    return data.detail[0].msg as string;
  }

  if (
    typeof data?.detail === 'object' &&
    data?.detail &&
    !Array.isArray(data.detail) &&
    typeof (data.detail as any).message === 'string'
  ) {
    return (data.detail as any).message;
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 404:
      return 'Requested resource was not found.';
    case 422:
      return 'Submitted data is invalid. Please review the form fields.';
    case 500:
      return 'Server error occurred. Please try again later.';
    default:
      return `Request failed with status ${status}.`;
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(extractErrorMessage(error)))
);

const ensureValidId = (id: number): void => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid prediction ID.');
  }
};

export const predictRisk = async (
  data: PredictRequest
): Promise<PredictResponse> => {
  const response = await api.post<PredictResponse>('/api/predict', data);
  return response.data;
};

export const getHistory = async (): Promise<PredictionHistoryItem[]> => {
  const response = await api.get<PredictionHistoryItem[]>('/api/history');
  return Array.isArray(response.data) ? response.data : [];
};

export const getPrediction = async (id: number): Promise<PredictResponse> => {
  ensureValidId(id);
  const response = await api.get<PredictResponse>(`/api/predictions/${id}`);
  return response.data;
};

export const getModelInfo = async (): Promise<ModelInfo> => {
  const response = await api.get<ModelInfo>('/api/model-info');
  return response.data;
};

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>('/health');
  return response.data;
};

export { extractErrorMessage };
export default api;