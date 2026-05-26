import { db } from './db';

const API_BASE = '/api/v1';

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
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = await getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (response.status === 401) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        const newToken = await getAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
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
  } catch (error) {
    if (!navigator.onLine) {
      throw new Error('OFFLINE');
    }
    throw error;
  }
}

export async function apiRequestWithOffline<T>(
  endpoint: string,
  options: RequestInit & { offlineKey?: string; offlineData?: T } = {},
): Promise<T> {
  try {
    return await apiRequest<T>(endpoint, options);
  } catch (error) {
    if (error instanceof Error && error.message === 'OFFLINE' && options.offlineData) {
      return options.offlineData;
    }
    throw error;
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiRequest<{ user: any; tokens: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      apiRequest<any>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    me: () => apiRequest<any>('/users/me'),
  },
  users: {
    update: (id: string, data: any) =>
      apiRequest<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getContractorProfile: (id: string) =>
      apiRequest<any>(`/users/contractor/${id}`),
  },
  documents: {
    listByUser: (userId: string) => apiRequest<any>(`/documents/user/${userId}`),
  },
  assignments: {
    my: () => apiRequest<any>('/assignments/my'),
    today: async () => {
      try {
        return await apiRequest<any>('/assignments/today');
      } catch (error) {
        if (error instanceof Error && error.message === 'OFFLINE') {
          const offline = await db.assignments
            .filter((a) => a.scheduledDate === new Date().toISOString().split('T')[0])
            .toArray();
          return { data: offline };
        }
        throw error;
      }
    },
    get: async (id: string) => {
      try {
        return await apiRequest<any>(`/assignments/${id}`);
      } catch (error) {
        if (error instanceof Error && error.message === 'OFFLINE') {
          const offline = await db.assignments.get(id);
          return { data: offline };
        }
        throw error;
      }
    },
    start: (id: string, lat?: number, lng?: number) =>
      apiRequest<any>(`/assignments/${id}/start`, {
        method: 'POST',
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      }),
    complete: (id: string) =>
      apiRequest<any>(`/assignments/${id}/complete`, { method: 'POST' }),
    updateStatus: (id: string, status: string) =>
      apiRequest<any>(`/assignments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    startTimer: (id: string) =>
      apiRequest<any>(`/assignments/${id}/timer/start`, { method: 'POST' }),
    stopTimer: (id: string) =>
      apiRequest<any>(`/assignments/${id}/timer/stop`, { method: 'POST' }),
    requestVerification: (id: string, checklistIncomplete?: boolean) =>
      apiRequest<any>(`/assignments/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ checklistIncomplete }),
      }),
  },
  checklist: {
    get: (assignmentId: string) =>
      apiRequest<any>(`/checklist/assignment/${assignmentId}`),
    updateItem: (id: string, data: { status: string; notes?: string }) =>
      apiRequest<any>(`/checklist/item/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  photos: {
    getUploadUrl: (filename: string, contentType: string) =>
      apiRequest<{ url: string; key: string }>('/photos/upload-url', {
        method: 'GET',
        body: JSON.stringify({ filename, contentType }),
      }),
    getByAssignment: (assignmentId: string) =>
      apiRequest<any>(`/photos/assignment/${assignmentId}`),
    create: (data: any) =>
      apiRequest<any>('/photos', { method: 'POST', body: JSON.stringify(data) }),
  },
  location: {
    log: (data: any) =>
      apiRequest<any>('/location/log', { method: 'POST', body: JSON.stringify(data) }),
    validate: (data: any) =>
      apiRequest<any>('/location/validate', { method: 'POST', body: JSON.stringify(data) }),
    current: () => apiRequest<any>('/location/current'),
  },
  sync: {
    enqueue: (items: any[]) =>
      apiRequest<any>('/sync/enqueue', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    status: () => apiRequest<any>('/sync/status'),
  },
  rendimiento: {
    getMyDashboard: () => apiRequest<any>('/rendimiento/my-dashboard'),
    getMyAttendance: (from?: string, to?: string) => {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      return apiRequest<any>(`/rendimiento/attendance/me?${query}`);
    },
  },
  push: {
    getVapidKey: () => apiRequest<{ publicKey: string }>('/notifications/vapid-public-key'),
    register: (data: any) =>
      apiRequest<any>('/notifications/push/register', { method: 'POST', body: JSON.stringify(data) }),
    unregister: (endpoint: string) =>
      apiRequest<any>('/notifications/push/unregister', { method: 'POST', body: JSON.stringify({ endpoint }) }),
  },
  onTheWay: {
    notify: (assignmentId: string, etaMinutes?: number) =>
      apiRequest<any>('/notifications/on-the-way', {
        method: 'POST',
        body: JSON.stringify({ assignmentId, etaMinutes }),
      }),
  },
  notifications: {
    list: (page = 1, limit = 50) => apiRequest<any>(`/notifications?page=${page}&limit=${limit}`),
    unreadCount: () => apiRequest<any>('/notifications/unread-count'),
    markRead: (id: string) =>
      apiRequest<any>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () =>
      apiRequest<any>('/notifications/mark-all-read', { method: 'PUT' }),
  },
};
