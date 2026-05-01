import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export const AuthContext = createContext(null);

// sessionStorage is tab-specific — each tab maintains its own login session
const STORAGE_KEY = 'ticketrush_token';
const storage = sessionStorage;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(storage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  
  // Auth Modal State
  const [authModalMode, setAuthModalMode] = useState(null); // 'login' | 'register' | null

  const openAuthModal = (mode = 'login') => setAuthModalMode(mode);
  const closeAuthModal = () => setAuthModalMode(null);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch {
      storage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    storage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const data = await api.register(formData);
    storage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.logout(); // [FIX 1.1] Blacklist token server-side
    } catch {
      // Proceed with local logout even if server call fails
    } finally {
      storage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (newUser) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, login, register, logout, updateUser,
      authModalMode, openAuthModal, closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>


  );
}
