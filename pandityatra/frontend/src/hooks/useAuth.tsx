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
  verifyOtp: (identifier: string, otp: string) => Promise<any>;
  loginWithOtp: (identifier: string, otp_code: string) => Promise<any>;
  verifyResetOtp: (phone: string, otp: string) => Promise<any>;
  passwordLogin: (identifier: string, password: string) => Promise<any>;
  adminLogin: (identifier: string, password: string) => Promise<any>;
  verifyAdminTOTP: (token: string, preAuthId: string) => Promise<any>;
  setupAdminTOTP: (preAuthId: string) => Promise<any>;
  confirmAdminTOTP: (token: string, preAuthId: string) => Promise<any>;
  verifyGlobalTOTP: (token: string, preAuthId: string) => Promise<any>;
  get2FAStatus: () => Promise<any>;
  setup2FA: () => Promise<any>;
  confirm2FA: (token: string) => Promise<any>;
  disable2FA: (token: string) => Promise<any>;
  googleLogin: (token: string, role?: string) => Promise<any>;
  register: (payload: any) => Promise<any>;
  resetPassword: (identifier: string, otp: string, newPw: string) => Promise<any>;
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
    let isSubscribed = true;
    if (token) {
      setLoading(true);
      api.fetchProfile()
        .then((u) => {
          if (!isSubscribed) return;
          setUser(u);
          if (u.role) {
            setRole(u.role);
            localStorage.setItem('role', u.role);
          }
        })
        .catch((err) => {
          if (!isSubscribed) return;
          // 🚨 IMPROVEMENT: Don't clear token immediately if it might be a temporary sync issue
          console.error("Profile fetch failed:", err);
          if (err.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('role');
            setToken(null);
            setUser(null);
            setRole(null);
          }
        })
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });
    } else {
      setLoading(false);
    }
    return () => { isSubscribed = false; };
  }, [token]);

  // Sync React state when Axios interceptor refreshes the token behind the scenes
  useEffect(() => {
    const handleTokenRefresh = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setToken(customEvent.detail);
      }
    };
    window.addEventListener('token_refreshed', handleTokenRefresh);
    return () => window.removeEventListener('token_refreshed', handleTokenRefresh);
  }, []);

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
    
    if (resp.requires_2fa) return resp;

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
    
    if (resp.requires_2fa) return resp;

    handleLoginSuccess(resp);
    return resp;
  };

  const adminLogin = async (identifier: string, password: string) => {
    const resp = await api.adminLogin({ identifier, password });
    // If it doesn't require 2FA (though it should for admin), handle success
    if (!resp.requires_2fa && !resp.requires_setup && resp.access) {
      handleLoginSuccess(resp);
    }
    return resp;
  };

  const verifyAdminTOTP = async (token: string, preAuthId: string) => {
    const resp = await api.verifyAdminTOTP({ token, pre_auth_id: preAuthId });
    handleLoginSuccess(resp);
    return resp;
  };

  const setupAdminTOTP = async (preAuthId: string) => {
    return api.setupAdminTOTP(preAuthId);
  };

  const confirmAdminTOTP = async (token: string, preAuthId: string) => {
    const resp = await api.confirmAdminTOTP({ token, pre_auth_id: preAuthId });
    handleLoginSuccess(resp);
    return resp;
  };

  const verifyGlobalTOTP = async (token: string, preAuthId: string) => {
    const resp = await api.verifyGlobalTOTP({ token, pre_auth_id: preAuthId });
    handleLoginSuccess(resp);
    return resp;
  };

  const get2FAStatus = () => api.get2FAStatus();
  const setup2FA = () => api.setup2FA();
  const confirm2FA = (token: string) => api.confirm2FA({ token });
  const disable2FA = (token: string) => api.disable2FA({ token });


  const googleLogin = async (idToken: string, role?: string) => {
    const resp = await api.googleLogin(idToken, role);
    handleLoginSuccess(resp);
    return resp;
  };

  const handleLoginSuccess = (resp: any) => {
    const t = (resp && (resp.access || resp.token)) || resp;
    const r = resp && (resp as any).role;
    const ref = resp && (resp as any).refresh;

    // 🚨 BATCH UPDATES: Store in localStorage FIRST
    if (typeof t === 'string') {
        localStorage.setItem('token', t);
    } else if (resp && (resp as any).access) {
        localStorage.setItem('token', (resp as any).access);
    }
    
    if (ref) localStorage.setItem('refresh', ref);
    if (r) localStorage.setItem('role', r);

    // Then update state to trigger re-render with CONSISTENT data
    if (typeof t === 'string') setToken(t);
    else if (resp && (resp as any).access) setToken(resp.access);
    
    if (r) setRole(r);
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
      adminLogin,
      verifyAdminTOTP,
      setupAdminTOTP,
      confirmAdminTOTP,
      verifyGlobalTOTP,
      get2FAStatus,
      setup2FA,
      confirm2FA,
      disable2FA,
      googleLogin,
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
  return ctx;
};

export default useAuth;
