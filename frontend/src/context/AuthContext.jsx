import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch (_error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setUser(data.user);
    return data;
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const logoutAll = async () => {
    await api.post('/auth/logout-all');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        logoutAll,
        refreshSession,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
