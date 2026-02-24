import axios from 'axios';
import type {
  TokenResponse,
  UploadedPaper,
  ExtractedQuestion,
  QuestionStats,
  GeneratedPaper,
  GeneratedPaperListItem,
  ConversationMessage,
  GeneratePaperRequest,
  AdminStats,
  UserDetail,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const authAPI = {
  login: (data: { identifier: string; password: string }) =>
    api.post<TokenResponse>('/auth/login', data),
  register: (data: { email: string; username: string; password: string; full_name: string; school_name?: string }) =>
    api.post<TokenResponse>('/auth/register', data),
  me: () => api.get<TokenResponse['user']>('/auth/me'),
  updateProfile: (data: {
    full_name?: string;
    email?: string;
    username?: string;
    school_name?: string;
    current_password?: string;
    new_password?: string;
  }) => api.put<TokenResponse['user']>('/auth/profile', data),
};

// ── Admin ──
export const adminAPI = {
  getStats: () => api.get<AdminStats>('/admin/stats'),
  listUsers: () => api.get<TokenResponse['user'][]>('/admin/users'),
  getUserDetail: (userId: number) => api.get<UserDetail>(`/admin/user-detail/${userId}`),
  createUser: (data: { email: string; username: string; full_name: string; password: string; school_name?: string; role?: string }) =>
    api.post<TokenResponse['user']>('/admin/users', data),
  updateUser: (userId: number, data: { full_name?: string; email?: string; username?: string; school_name?: string; role?: string }) =>
    api.put<TokenResponse['user']>(`/admin/users/${userId}`, data),
  deleteUser: (userId: number) =>
    api.delete(`/admin/users/${userId}`),
  resetPassword: (userId: number, newPassword: string) =>
    api.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword }),
};

// ── Papers ──
export const papersAPI = {
  upload: (file: File, board: string, grade_level: string, subject: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('board', board);
    formData.append('grade_level', grade_level);
    formData.append('subject', subject);
    return api.post<UploadedPaper>('/papers/upload', formData);
  },
  list: () => api.get<UploadedPaper[]>('/papers'),
  get: (id: number) => api.get<UploadedPaper>(`/papers/${id}`),
  status: (id: number) =>
    api.get<{ id: number; status: string; error_message: string | null; question_count: number }>(`/papers/${id}/status`),
  delete: (id: number) => api.delete(`/papers/${id}`),
};

// ── Questions ──
export const questionsAPI = {
  list: (params?: Record<string, string>) =>
    api.get<ExtractedQuestion[]>('/questions', { params }),
  stats: () => api.get<QuestionStats>('/questions/stats'),
  topics: () => api.get<string[]>('/questions/topics'),
};

// ── Generation ──
export const generateAPI = {
  create: (data: GeneratePaperRequest) =>
    api.post<GeneratedPaper>('/generate', data),
  list: () => api.get<GeneratedPaperListItem[]>('/generate'),
  get: (id: number) => api.get<GeneratedPaper>(`/generate/${id}`),
  status: (id: number) =>
    api.get<{ id: number; status: string; error_message: string | null }>(`/generate/${id}/status`),
};

// ── Chat ──
export const chatAPI = {
  send: (paperId: number, message: string) =>
    api.post<{ paper: GeneratedPaper; messages: ConversationMessage[] }>(
      `/generate/${paperId}/chat`,
      { message }
    ),
  history: (paperId: number) =>
    api.get<ConversationMessage[]>(`/generate/${paperId}/chat`),
};

// ── Export ──
export const exportAPI = {
  paperPdf: (id: number) =>
    api.get(`/export/${id}/pdf`, { responseType: 'blob' }),
  paperWord: (id: number) =>
    api.get(`/export/${id}/word`, { responseType: 'blob' }),
  answerKeyPdf: (id: number) =>
    api.get(`/export/${id}/answer-key/pdf`, { responseType: 'blob' }),
  answerKeyWord: (id: number) =>
    api.get(`/export/${id}/answer-key/word`, { responseType: 'blob' }),
};

export default api;
