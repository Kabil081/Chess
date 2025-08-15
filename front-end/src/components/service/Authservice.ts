import axios from 'axios';
export interface UserData {
  username: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  userData?: UserData;
}

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await axios.post('https://chess-fmjo4w97c-231001081-8983s-projects.vercel.app/api/auth/login', { username, password });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error. Please try again.' };
  }
};

export const register = async (username: string, password: string, email?: string): Promise<AuthResponse> => {
  try {
    const response = await axios.post('https://chess-fmjo4w97c-231001081-8983s-projects.vercel.app/api/auth/register', { username, password, email });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error. Please try again.' };
  }
};
export const isLoggedIn = (): boolean => {
  return localStorage.getItem('chessUser') !== null;
};
export const getCurrentUser = (): UserData | null => {
  const userData = localStorage.getItem('chessUser');
  if (userData) {
    return JSON.parse(userData);
  }
  return null;
};
export const logout = (): void => {
  localStorage.removeItem('chessUser');
  window.location.href = '/login';
};
