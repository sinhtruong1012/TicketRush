import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  favoriteIds: [],
  toggleFavoriteId: () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {},
  authModalMode: null,
});

// sessionStorage is tab-specific — each tab maintains its own login session
const STORAGE_KEY = 'ticketrush_token';
const storage = sessionStorage;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(storage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]); // Global favorites state

  // Auth Modal State
  const [authModalMode, setAuthModalMode] = useState(null); // 'login' | 'register' | null

  const openAuthModal = (mode = 'login') => setAuthModalMode(mode);
  const closeAuthModal = () => setAuthModalMode(null);

  // Load favorites IDs after login — lightweight, chỉ lấy ID để đồng bộ icon
  const loadFavoriteIds = useCallback(async () => {
    try {
      const data = await api.getFavoriteIds();
      setFavoriteIds(data.ids || []);
    } catch {
      setFavoriteIds([]);
    }
  }, []);

  // Optimistic toggle — cập nhật UI ngay, không cần đợi server
  const toggleFavoriteId = useCallback((eventId, isFavorite) => {
    setFavoriteIds(prev =>
      isFavorite ? [...prev, eventId] : prev.filter(id => id !== eventId)
    );
  }, []);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      // Load favorites sau khi xác thực user thành công
      await loadFavoriteIds();
    } catch {
      storage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
      setFavoriteIds([]);
    } finally {
      setLoading(false);
    }
  }, [token, loadFavoriteIds]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    storage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    // Load favorites ngay sau khi đăng nhập
    try {
      const favData = await api.getFavoriteIds();
      setFavoriteIds(favData.ids || []);
    } catch {
      setFavoriteIds([]);
    }
    return data;
  };

  const register = async (formData) => {
    const data = await api.register(formData);
    storage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    setFavoriteIds([]); // User mới, chưa có favorites
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
      setFavoriteIds([]); // Clear favorites on logout
    }
  };

  const updateUser = (newUser) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout, updateUser,
      authModalMode, openAuthModal, closeAuthModal,
      favoriteIds, toggleFavoriteId,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
