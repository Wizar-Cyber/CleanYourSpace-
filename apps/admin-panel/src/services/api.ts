const API_BASE = '/api/v1';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function getAccessToken(): Promise<string | null> {
  const tokens = localStorage.getItem('auth_tokens');
  if (!tokens) return null;
  const { accessToken } = JSON.parse(tokens);
  return accessToken;
}

async function refreshTokens(): Promise<boolean> {
  const tokens = localStorage.getItem('auth_tokens');
  if (!tokens) return false;

  const { refreshToken } = JSON.parse(tokens);

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    localStorage.setItem('auth_tokens', JSON.stringify(data.tokens));
    return true;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const newToken = await getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
      });
    } else {
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const newToken = await getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } else {
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiRequest<{ user: any; tokens: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      }),
    register: (data: any) =>
      apiRequest<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true,
      }),
  },
  users: {
    list: (page = 1, limit = 20) => apiRequest<any>(`/users?page=${page}&limit=${limit}`),
    cleaners: () => apiRequest<any>('/users/cleaners'),
    stats: () => apiRequest<any>('/users/stats'),
    get: (id: string) => apiRequest<any>(`/users/${id}`),
    me: () => apiRequest<any>('/users/me'),
    create: (data: any) =>
      apiRequest<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    invite: (data: any) =>
      apiRequest<any>('/auth/register', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
    getContractorProfile: (id: string) =>
      apiRequest<any>(`/users/contractor/${id}`),
  },
  documents: {
    listByUser: (userId: string) => apiRequest<any>(`/documents/user/${userId}`),
    delete: (id: string) => apiRequest<any>(`/documents/${id}`, { method: 'DELETE' }),
    upload: (formData: FormData) => apiUpload<any>('/documents/upload', formData),
  },
  services: {
    list: (page = 1, limit = 20) => apiRequest<any>(`/services?page=${page}&limit=${limit}`),
    get: (id: string) => apiRequest<any>(`/services/${id}`),
    create: (data: any) =>
      apiRequest<any>('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest<any>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest<any>(`/services/${id}`, { method: 'DELETE' }),
    approve: (id: string) =>
      apiRequest<any>(`/services/${id}/approve`, { method: 'POST' }),
    reject: (id: string, rejectionNote: string) =>
      apiRequest<any>(`/services/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejectionNote }) }),
    findByStatus: (status: string) => apiRequest<any>(`/services/status/${status}`),
    summary: () => apiRequest<any>('/services/summary'),
    updateStatus: (id: string, status: string, reason?: string) =>
      apiRequest<any>(`/services/${id}/status`, { method: 'POST', body: JSON.stringify({ status, reason }) }),
    cancel: (id: string, reason: string) =>
      apiRequest<any>(`/services/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    reschedule: (id: string, scheduledAt: string) =>
      apiRequest<any>(`/services/${id}/reschedule`, { method: 'PUT', body: JSON.stringify({ scheduledAt }) }),
    getTypes: () => apiRequest<any>('/services/types'),
    createType: (data: any) =>
      apiRequest<any>('/services/types', { method: 'POST', body: JSON.stringify(data) }),
    history: (params?: any) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest<any>(`/services/history?${query}`);
    },
    calendar: (params: any) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest<any>(`/services/calendar?${query}`);
    },
  },
  assignments: {
    list: (params?: any) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest<any>(`/assignments?${query}`);
    },
    get: (id: string) => apiRequest<any>(`/assignments/${id}`),
    create: (data: any) =>
      apiRequest<any>('/assignments', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      apiRequest<any>(`/assignments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    summary: () => apiRequest<any>('/assignments/summary'),
  },
  checklists: {
    create: (data: any) =>
      apiRequest<any>('/checklists', { method: 'POST', body: JSON.stringify(data) }),
    list: () => apiRequest<any>('/checklists'),
    delete: (id: string) =>
      apiRequest<any>(`/checklists/${id}`, { method: 'DELETE' }),
    update: (id: string, data: any) =>
      apiRequest<any>(`/checklists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  reports: {
    list: (page = 1, limit = 20) => apiRequest<any>(`/reports?page=${page}&limit=${limit}`),
    get: (id: string) => apiRequest<any>(`/reports/${id}`),
    generate: (data: any) =>
      apiRequest<any>('/reports/generate', { method: 'POST', body: JSON.stringify(data) }),
    download: (id: string) => apiRequest<any>(`/reports/${id}/download`),
  },
  notifications: {
    list: (page = 1, limit = 50) => apiRequest<any>(`/notifications?page=${page}&limit=${limit}`),
    unreadCount: () => apiRequest<any>('/notifications/unread-count'),
    markRead: (id: string) =>
      apiRequest<any>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () =>
      apiRequest<any>('/notifications/mark-all-read', { method: 'PUT' }),
  },
  inventory: {
    listSupplies: (params?: any) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest<any>(`/inventory/supplies?${query}`);
    },
    getSupply: (id: string) => apiRequest<any>(`/inventory/supplies/${id}`),
    createSupply: (data: any) =>
      apiRequest<any>('/inventory/supplies', { method: 'POST', body: JSON.stringify(data) }),
    updateSupply: (id: string, data: any) =>
      apiRequest<any>(`/inventory/supplies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSupply: (id: string) =>
      apiRequest<any>(`/inventory/supplies/${id}`, { method: 'DELETE' }),
    getTransactions: (params?: any) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest<any>(`/inventory/transactions?${query}`);
    },
    createTransaction: (data: any) =>
      apiRequest<any>('/inventory/transactions', { method: 'POST', body: JSON.stringify(data) }),
    getLowStock: () => apiRequest<any>('/inventory/low-stock'),
    getConsumptionReport: (data: any) =>
      apiRequest<any>('/inventory/consumption-report', { method: 'POST', body: JSON.stringify(data) }),
  },
  rendimiento: {
    getAttendance: (contractorId: string, from?: string, to?: string) => {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      return apiRequest<any>(`/rendimiento/attendance/${contractorId}?${query}`);
    },
    getPunctuality: (contractorId: string, from?: string, to?: string, threshold?: number) => {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      if (threshold) query.set('threshold', String(threshold));
      return apiRequest<any>(`/rendimiento/punctuality/${contractorId}?${query}`);
    },
    getServiceTime: (contractorId: string, from?: string, to?: string) => {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      return apiRequest<any>(`/rendimiento/service-time/${contractorId}?${query}`);
    },
    getQualityScore: (contractorId: string, from?: string, to?: string) => {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      return apiRequest<any>(`/rendimiento/quality-score/${contractorId}?${query}`);
    },
    getIncidents: (contractorId: string, page = 1, limit = 20) =>
      apiRequest<any>(`/rendimiento/incidents/${contractorId}?page=${page}&limit=${limit}`),
    createEvaluation: (data: any) =>
      apiRequest<any>('/rendimiento/evaluations', { method: 'POST', body: JSON.stringify(data) }),
    getEvaluations: (contractorId?: string, page = 1, limit = 20) => {
      const query = new URLSearchParams();
      if (contractorId) query.set('contractorId', contractorId);
      query.set('page', String(page));
      query.set('limit', String(limit));
      return apiRequest<any>(`/rendimiento/evaluations?${query}`);
    },
    updateEvaluation: (id: string, data: any) =>
      apiRequest<any>(`/rendimiento/evaluations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getDashboard: (contractorId: string) =>
      apiRequest<any>(`/rendimiento/dashboard/${contractorId}`),
    getComparativeReport: (contractorIds: string[], from: string, to: string) =>
      apiRequest<any>('/rendimiento/comparative', {
        method: 'POST',
        body: JSON.stringify({ contractorIds, from, to }),
      }),
    getScoreHistory: (contractorId: string, period = 'monthly', from?: string, to?: string) => {
      const query = new URLSearchParams({ period });
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      return apiRequest<any>(`/rendimiento/scores/${contractorId}?${query}`);
    },
    computeScore: (contractorId: string, period: string) =>
      apiRequest<any>(`/rendimiento/compute-score/${contractorId}`, {
        method: 'POST',
        body: JSON.stringify({ period }),
      }),
  },
  location: {
    getByAssignment: (assignmentId: string) =>
      apiRequest<any>(`/location/assignment/${assignmentId}`),
    getAlerts: (assignmentId: string) =>
      apiRequest<any>(`/location/alerts/${assignmentId}`),
  },
};
