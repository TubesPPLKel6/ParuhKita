import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

const AUTH_ME_TIMEOUT_MS = 15000;

function readStoredToken() {
  return sessionStorage.getItem('pk_token') || null;
}

function readStoredUser() {
  const raw = sessionStorage.getItem('pk_user');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const initialToken = readStoredToken();
  const initialUser = readStoredUser();

  // Gunakan data user yang tersimpan agar reload pada route terproteksi tidak
  // tertahan selamanya di layar "Memuat data..." ketika /auth/me lambat.
  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(Boolean(initialToken) && !initialUser);

  const logout = useCallback(async () => {
    const currentToken = sessionStorage.getItem('pk_token') || token;

    sessionStorage.removeItem('pk_token');
    sessionStorage.removeItem('pk_user');
    setToken(null);
    setUser(null);
    setLoading(false);

    try {
      if (currentToken) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), AUTH_ME_TIMEOUT_MS);

    api.get('/auth/me', { signal: controller.signal })
      .then((res) => {
        if (!active) return;

        if (res.data?.status && res.data?.data) {
          setUser(res.data.data);
          sessionStorage.setItem('pk_user', JSON.stringify(res.data.data));
        }
      })
      .catch((err) => {
        if (!active) return;

        // Hanya sesi yang benar-benar ditolak server yang dihapus. Gangguan
        // jaringan sesaat tidak boleh mengeluarkan user dari sesi.
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          logout();
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [token, logout]);

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
    setLoading(false);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
