import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';
import { getInitialSpyrixTheme } from '../themeConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  const refreshSession = useCallback(async () => {
    // Purge browser-only session artifacts from older builds.
    localStorage.removeItem('spyrix_demo_mode');
    localStorage.removeItem('spyrix_demo_data');
    const token = localStorage.getItem('spyrix_token');
    if (!token) {
      setSession(null);
      setChecking(false);
      return;
    }
    try {
      const result = await apiRequest('/auth/me');
      setSession(current => ({ ...result, ...(current?.welcomeAt ? { welcomeAt: current.welcomeAt } : {}) }));
    } catch {
      // Preserve the token during network/database outages. apiRequest clears it on 401.
      setSession(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (session?.business?.invoiceDesign && Object.keys(session.business.invoiceDesign).length) {
      localStorage.setItem('spyrix_invoice_design', JSON.stringify(session.business.invoiceDesign));
      if (session.business.invoiceDesign.templateId) localStorage.setItem('spyrix_invoice_template', session.business.invoiceDesign.templateId);
    }
  }, [session?.business?.id, session?.business?.invoiceDesign]);

  useEffect(() => {
    refreshSession();
    const onUnauthorized = () => setSession(null);
    window.addEventListener('spyrix:unauthorized', onUnauthorized);
    return () => window.removeEventListener('spyrix:unauthorized', onUnauthorized);
  }, [refreshSession]);

  const login = async (email, password, { deferSession = false } = {}) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('spyrix_token', result.token);
    if (!deferSession) setSession({ ...result, welcomeAt: Date.now() });
    return result;
  };

  const register = async (payload, { deferSession = false } = {}) => {
    const theme = getInitialSpyrixTheme(localStorage.getItem('spyrix_theme'));
    const result = await apiRequest('/auth/register', {
      method: 'POST', body: JSON.stringify({ ...payload, theme }),
    });
    localStorage.setItem('spyrix_token', result.token);
    if (!deferSession) setSession({ ...result, welcomeAt: Date.now() });
    return result;
  };

  const googleLogin = async (credential, { deferSession = false } = {}) => {
    const result = await apiRequest('/auth/google', {
      method: 'POST', body: JSON.stringify({ credential }),
    });
    localStorage.setItem('spyrix_token', result.token);
    if (!deferSession) setSession({ ...result, welcomeAt: Date.now() });
    return result;
  };

  const activateSession = result => {
    if (result) setSession({ ...result, welcomeAt: Date.now() });
  };

  const logout = () => {
    localStorage.removeItem('spyrix_token');
    setSession(null);
  };

  const value = useMemo(() => ({ session, user: session?.user, business: session?.business, checking, login, register, googleLogin, activateSession, logout, refreshSession }), [session, checking, refreshSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
