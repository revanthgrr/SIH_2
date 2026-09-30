import axios from 'axios';
import type { User, Project, DocumentItem, PipelineJob, TransformationResult } from '../types';

export const API_BASE = 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('parivartan_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    apiClient.post<{ access_token: string; token_type: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<{ access_token: string; token_type: string; user: User }>('/auth/login', data),
  getMe: () => apiClient.get<User>('/auth/me'),
};

// Projects API
export const projectsApi = {
  getAll: () => apiClient.get<Project[]>('/projects'),
  getById: (id: number) => apiClient.get<Project>(`/projects/${id}`),
  create: (data: { name: string; description?: string }) => apiClient.post<Project>('/projects', data),
  update: (id: number, data: { name?: string; description?: string }) => apiClient.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => apiClient.delete(`/projects/${id}`),
};

// Documents API
export const documentsApi = {
  getByProject: (projectId: number) => apiClient.get<DocumentItem[]>(`/documents/project/${projectId}`),
  getById: (id: number) => apiClient.get<DocumentItem>(`/documents/${id}`),
  uploadFile: (projectId: number, file: File) => {
    const formData = new FormData();
    formData.append('project_id', projectId.toString());
    formData.append('file', file);
    return apiClient.post<DocumentItem>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  ingestUrl: (data: { project_id: number; url: string; custom_title?: string }) =>
    apiClient.post<DocumentItem>('/documents/url', data),
  ingestText: (data: { project_id: number; title: string; content: string }) =>
    apiClient.post<DocumentItem>('/documents/text', data),
  delete: (id: number) => apiClient.delete(`/documents/${id}`),
};

// Pipeline API
export const pipelineApi = {
  run: (
    documentId: number,
    options?: { focus_topic?: string; target_audience?: string; output_tone?: string }
  ) => apiClient.post<PipelineJob>(`/pipeline/${documentId}/run`, {
    document_id: documentId,
    ...(options || {})
  }),
  getStatus: (documentId: number) => apiClient.get<PipelineJob>(`/pipeline/${documentId}/status`),
  getResults: (documentId: number) => apiClient.get<TransformationResult>(`/pipeline/${documentId}/results`),
};

// Export URLs
export const getExportUrl = (documentId: number, format: 'markdown' | 'html' | 'json' | 'docx') => {
  return `${API_BASE}/export/${documentId}/${format}`;
};
