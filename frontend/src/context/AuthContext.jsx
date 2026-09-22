import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      // 1. Try checking if user is standard customer
      const res = await api.get('/auth/me');
      if (res.data && res.data.success) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 2. If customer fails, check if logged in as admin
      try {
        const adminRes = await api.get('/admin/me');
        if (adminRes.data && adminRes.data.success) {
          setUser(adminRes.data.user);
        } else {
          setUser(null);
        }
      } catch (adminErr) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      if (user?.role === 'admin') {
        await api.post('/admin/logout');
      } else {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
