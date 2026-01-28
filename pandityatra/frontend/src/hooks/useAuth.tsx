import React, { useState, useEffect, createContext, useContext } from 'react';
import * as api from '@/lib/api';
import {
  requestForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword as resetPasswordApi
} from '../pages/auth/helper';

type AuthContextValue = {
  token: string | null;
  user: any | null;
  loading: boolean;
  role: string | null;
  requestOtp: (identifier: string) => Promise<any>;
  requestResetOtp: (phone: string) => Promise<any>;
  verifyOtp: (identifier: string, otp: string) => Promise<any>; // Kept for backward compat, acts as login
  loginWithOtp: (phone: string, otp: string) => Promise<any>;
  verifyResetOtp: (phone: string, otp: string) => Promise<any>;
  passwordLogin: (phone: string, password: string) => Promise<any>;
  register: (payload: api.RegisterPayload) => Promise<any>;
  resetPassword: (phone: string, otp: string, newPw: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
      api.fetchProfile()
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
        .catch(() => {
          setUser(null);
          setRole(null);
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const u = await api.fetchProfile();
      setUser(u);
      if (u.role) setRole(u.role);
    } catch (error) {
      console.error("Failed to refresh user", error);
    }
  };

  const requestOtp = async (identifier: string) => {
    const isEmail = identifier.includes('@');
    return api.requestLoginOtp(
      isEmail ? { email: identifier } : { phone_number: identifier }
    );
  };

  const requestResetOtp = async (inputIdentifier: string) => {
    const identifier = inputIdentifier.trim();
    const isEmail = identifier.includes('@');
    return requestForgotPasswordOTP(
      isEmail ? { email: identifier } : { phone_number: identifier }
    );
  };

  const verifyOtp = async (identifier: string, otp: string) => {
    // Determine if identifier is email
    const isEmail = identifier.includes('@');
    const payload = isEmail
      ? { email: identifier, otp_code: otp }
      : { phone_number: identifier, otp_code: otp };

    const resp = await api.verifyOtpAndGetToken(payload);
    handleLoginSuccess(resp);
    return resp;
  };

  const loginWithOtp = async (phone: string, otp: string) => {
    return verifyOtp(phone, otp);
  };

  const verifyResetOtp = async (identifier: string, otp: string) => {
    const isEmail = identifier.includes('@');
    const payload = isEmail
      ? { email: identifier, otp_code: otp }
      : { phone_number: identifier, otp_code: otp };
    return verifyForgotPasswordOTP(payload);
  };

  const passwordLogin = async (identifier: string, password: string) => {
    const trimmed = identifier.trim();
    let payload: any;

    if (trimmed.includes('@')) {
      // Email login
      payload = { email: trimmed, password };
    } else if (/^\d+$/.test(trimmed)) {
      // Phone login (all digits)
      payload = { phone_number: trimmed, password };
    } else {
      // Username login (contains letters)
      payload = { username: trimmed, password };
    }

    const resp = await api.passwordLogin(payload);
    handleLoginSuccess(resp);
    return resp;
  };

  const handleLoginSuccess = (resp: any) => {
    const t = (resp && (resp.access || resp.token)) || resp;
    if (typeof t === 'string') {
      localStorage.setItem('token', t);
      setToken(t);
    } else if (resp && (resp as any).access) {
      localStorage.setItem('token', (resp as any).access);
      setToken((resp as any).access);
    }

    // 🚨 FIX: Store refresh token for auto-logout issue
    if (resp && (resp as any).refresh) {
      localStorage.setItem('refresh', (resp as any).refresh);
    }

    if (resp && (resp as any).role) {
      localStorage.setItem('role', (resp as any).role);
      setRole((resp as any).role);
    }
  };

  const register = async (payload: api.RegisterPayload) => {
    return api.registerUser(payload);
  };

  const resetPassword = async (identifier: string, otp: string, newPw: string) => {
    const isEmail = identifier.trim().includes('@');
    return resetPasswordApi(
      isEmail
        ? { email: identifier.trim(), otp_code: otp, new_password: newPw }
        : { phone_number: identifier.trim(), otp_code: otp, new_password: newPw }
    );
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh'); // 🚨 Clean up refresh token
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      token, user, loading, role,
      requestOtp, // requestLoginOtp
      requestResetOtp,
      verifyOtp, // verifyLoginOtp
      loginWithOtp,
      verifyResetOtp,
      passwordLogin,
      register,
      resetPassword,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return Object.assign(ctx, {
    // Add any extra helpers if needed, or just exposure
    requestResetOtp: async (phone: string) => requestForgotPasswordOTP({ phone_number: phone })
  });
};

export default useAuth;
