import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_HOST && import.meta.env.VITE_BACKEND_PORT
  ? `http://${import.meta.env.VITE_BACKEND_HOST}:${import.meta.env.VITE_BACKEND_PORT}`
  : 'http://localhost:3001';

// Token storage key
const TOKEN_KEY = 'chess_auth_token';
const USER_KEY = 'chess_user';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearAuth();
    }
    return Promise.reject(error);
  }
);

// Token management
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// User management
export interface User {
  id: string;
  email: string;
}

export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

export const clearAuth = (): void => {
  clearToken();
  clearUser();
};

// Auth API functions
export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}
// ... existing code ...
export const authApi = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/api/auth/signup', data);
      if (response.data.success && response.data.token && response.data.user) {
        setToken(response.data.token);
        setUser(response.data.user);
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  signIn: async (data: SignInData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/api/auth/signin', data);
      if (response.data.success && response.data.token && response.data.user) {
        setToken(response.data.token);
        setUser(response.data.user);
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  signOut: (): void => {
    clearAuth();
  },

  isAuthenticated: (): boolean => {
    return !!getToken() && !!getUser();
  },

  // ✅ Changed from /api/oauth to /api/auth
  signInWithGoogle: (): void => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  },
};

export default api;

