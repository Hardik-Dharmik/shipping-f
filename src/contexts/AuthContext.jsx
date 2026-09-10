import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { isKycRequiredForUser } from '../utils/userAccess.js';
import { canAccessPage, landingPage } from '../utils/pageAccess.js';
import { api, setForbiddenHandler } from '../services/api.js';
const AuthContext = createContext();
export function AuthProvider({ children }) {
 const [user,setUser] = useState(null), [token,setToken] = useState(null);
 const [loading,setLoading] = useState(true), [authError,setAuthError] = useState('');
 const pending = useRef(null);
 const logout = useCallback(() => {
  localStorage.removeItem('token'); localStorage.removeItem('user');
  setUser(null); setToken(null); setAuthError('');
 }, []);
 const refreshPermissions = useCallback(() => {
  if (pending.current) return pending.current;
  const currentToken = localStorage.getItem('token');
  if (!currentToken) { logout(); setLoading(false); return Promise.resolve(); }
  pending.current = (async () => {
   try {
    const response = await api.getMe();
    if (localStorage.getItem('token') !== currentToken) return;
    if (!response.user?.role) throw new Error('Invalid session response');
    setUser(response.user); setToken(currentToken); setAuthError('');
    localStorage.setItem('user', JSON.stringify(response.user));
   } catch {
    if (localStorage.getItem('token') !== currentToken) return;
    setUser(null); setAuthError('Unable to verify access. Please retry or sign out.');
   } finally { setLoading(false); pending.current = null; }
  })();
  return pending.current;
 }, [logout]);
 useEffect(() => {
  refreshPermissions(); setForbiddenHandler(refreshPermissions);
  const refresh = () => refreshPermissions();
  window.addEventListener('focus', refresh); window.addEventListener('storage', refresh);
  const interval = setInterval(refresh, 60000);
  return () => { setForbiddenHandler(null); window.removeEventListener('focus',refresh); window.removeEventListener('storage',refresh); clearInterval(interval); };
 }, [refreshPermissions]);
 const login = (userData,authToken) => {
  localStorage.setItem('token',authToken); localStorage.setItem('user',JSON.stringify(userData));
  setUser(userData); setToken(authToken); setAuthError('');
 };
 return <AuthContext.Provider value={{user,token,login,logout,loading,authError,refreshPermissions,
  isAuthenticated: !!token, isAdmin: user?.role === 'admin', isEmployee: user?.role === 'employee',
  requiresKyc: isKycRequiredForUser(user), canAccess: key => canAccessPage(user,key), landingPath: landingPage(user),
  accessKey: JSON.stringify([user?.id,user?.role,[...(user?.page_permissions || [])].sort()]),
 }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
 const context = useContext(AuthContext);
 if (!context) throw new Error('useAuth must be used within AuthProvider');
 return context;
}
