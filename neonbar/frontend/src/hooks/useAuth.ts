import { useState, useEffect, useCallback } from 'react';
import type { Usuario } from '../types';
import { authService } from '../services/api';

const TOKEN_KEY = 'barize_token';
const USER_KEY = 'barize_usuario';

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authService
        .me()
        .then((res) => {
          setUsuario(res.data);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUsuario(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (username: string, senha: string) => {
    const res = await authService.login(username, senha);
    const { access_token, usuario: user } = res.data;
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setToken(access_token);
    setUsuario(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  return { usuario, token, loading, login, logout, isAuthenticated: !!token };
}
