import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pk_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.status) {
            setUser(res.data.data);
          }
        } catch (err) {
          console.error('Session expired or invalid', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.status) {
      const { token: receivedToken, user: receivedUser } = res.data.data;
      localStorage.setItem('pk_token', receivedToken);
      localStorage.setItem('pk_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return res.data;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('pk_token');
      localStorage.removeItem('pk_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
