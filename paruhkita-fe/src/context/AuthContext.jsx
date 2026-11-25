import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('pk_token') || null);
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
    const { status, data, message } = res.data;
    if (!status || !data?.token || !data?.user) {
      throw new Error(message || 'Respons login dari server tidak valid.');
    }

    const { token: receivedToken, user: receivedUser } = data;
    sessionStorage.setItem('pk_token', receivedToken);
    sessionStorage.setItem('pk_user', JSON.stringify(receivedUser));
    sessionStorage.removeItem('pk_dismissed_notifications');
    setToken(receivedToken);
    setUser(receivedUser);
    return res.data;
  };

  const logout = async () => {
    const currentToken = token;
    sessionStorage.removeItem('pk_token');
    sessionStorage.removeItem('pk_user');
    setToken(null);
    setUser(null);

    try {
      if (currentToken) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      }
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
