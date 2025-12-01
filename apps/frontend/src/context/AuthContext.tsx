import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { generateRandomString, generateCodeChallenge } from '../utils/pkce';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

interface AuthContextType {
  user: any;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Axios interceptor to attach token
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        // Prevent infinite loop: if the failed request was already a refresh attempt, don't retry
        if (originalRequest?.url?.includes('/auth/refresh-token')) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const res = await api.post('/auth/refresh-token');
            const newAccessToken = res.data.access_token;
            setAccessToken(newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            setUser(null);
            setAccessToken(null);
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken]);

  // Initial check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to refresh token immediately to see if we have a session
        const res = await api.post('/auth/refresh-token');
        setAccessToken(res.data.access_token);
        // Fetch profile
        const profileRes = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${res.data.access_token}` }
        });
        setUser(profileRes.data);
      } catch (e) {
        // Not logged in
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, pass: string) => {
    // 1. Generate PKCE
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // 2. Login to get Auth Code
    const loginRes = await api.post('/auth/login', {
      username,
      password: pass,
      code_challenge: codeChallenge,
    });
    const code = loginRes.data.code;

    // 3. Exchange Code for Tokens
    const tokenRes = await api.post('/auth/token', {
      code,
      code_verifier: codeVerifier,
    });

    setAccessToken(tokenRes.data.access_token);

    // 4. Get Profile
    const profileRes = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    });
    setUser(profileRes.data);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
