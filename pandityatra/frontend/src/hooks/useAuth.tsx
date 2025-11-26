import React, { useState, useEffect, createContext, useContext } from 'react';
import * as api from '@/lib/api';

type AuthContextValue = {
  token: string | null;
  user: any | null;
  loading: boolean;
  role: string | null;
  requestOtp: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, otp: string) => Promise<any>;
  passwordLogin: (phone: string, password: string) => Promise<any>;
  register: (payload: api.RegisterPayload) => Promise<any>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      api.fetchProfile(token)
        .then((u) => {
          setUser(u);
          if (u.role) {
            setRole(u.role);
            localStorage.setItem('role', u.role);
          }
        })
        .catch(() => {
          setUser(null);
          setRole(null);
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const requestOtp = async (phone: string) => {
    return api.requestLoginOtp({ phone_number: phone });
  };

  const verifyOtp = async (phone: string, otp: string) => {
    const resp = await api.verifyOtpAndGetToken({ phone_number: phone, otp_code: otp });
    // assume resp contains a token field (adjust if backend uses different shape)
    const t = (resp && (resp.access || resp.token)) || resp;
    if (typeof t === 'string') {
      localStorage.setItem('token', t);
      setToken(t);
    } else if (resp && (resp as any).access) {
      localStorage.setItem('token', (resp as any).access);
      setToken((resp as any).access);
    }
    // Store role if provided
    if (resp && (resp as any).role) {
      localStorage.setItem('role', (resp as any).role);
      setRole((resp as any).role);
    }
    return resp;
  };

  const passwordLogin = async (phone: string, password: string) => {
    const resp = await api.passwordLogin({ phone_number: phone, password });
    const t = (resp && (resp.access || resp.token)) || resp;
    if (typeof t === 'string') {
      localStorage.setItem('token', t);
      setToken(t);
    } else if (resp && (resp as any).access) {
      localStorage.setItem('token', (resp as any).access);
      setToken((resp as any).access);
    }
    // Store role if provided
    if (resp && (resp as any).role) {
      localStorage.setItem('role', (resp as any).role);
      setRole((resp as any).role);
    }
    return resp;
  };

  const register = async (payload: api.RegisterPayload) => {
    return api.registerUser(payload);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, role, requestOtp, verifyOtp, passwordLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default useAuth;
