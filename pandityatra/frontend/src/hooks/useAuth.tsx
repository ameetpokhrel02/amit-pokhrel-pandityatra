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
  requestOtp: (phone: string) => Promise<any>;
  requestResetOtp: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, otp: string) => Promise<any>; // Kept for backward compat, acts as login
  loginWithOtp: (phone: string, otp: string) => Promise<any>;
  verifyResetOtp: (phone: string, otp: string) => Promise<any>;
  passwordLogin: (phone: string, password: string) => Promise<any>;
  register: (payload: api.RegisterPayload) => Promise<any>;
  resetPassword: (phone: string, otp: string, newPw: string) => Promise<any>;
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
    // Check if this is for login or forgot password?
    // Current usage in Login.tsx implies login OTP.
    return api.requestLoginOtp({ phone_number: phone });
  };

  const requestResetOtp = async (phone: string) => {
    return requestForgotPasswordOTP({ phone_number: phone });
  };

  const verifyOtp = async (phone: string, otp: string) => {
    // Original verifyOtp implementation (Login)
    const resp = await api.verifyOtpAndGetToken({ phone_number: phone, otp_code: otp });
    handleLoginSuccess(resp);
    return resp;
  };

  const loginWithOtp = async (phone: string, otp: string) => {
    return verifyOtp(phone, otp);
  };

  const verifyResetOtp = async (phone: string, otp: string) => {
    return verifyForgotPasswordOTP({ phone_number: phone, otp_code: otp });
  };

  const passwordLogin = async (phone: string, password: string) => {
    const resp = await api.passwordLogin({ phone_number: phone, password });
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
    if (resp && (resp as any).role) {
      localStorage.setItem('role', (resp as any).role);
      setRole((resp as any).role);
    }
  };

  const register = async (payload: api.RegisterPayload) => {
    return api.registerUser(payload);
  };

  const resetPassword = async (phone: string, otp: string, newPw: string) => {
    return resetPasswordApi({
      phone_number: phone,
      otp_code: otp,
      new_password: newPw
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
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
      logout
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
