import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getSession,
  getUsers,
  saveUsers,
  setSession,
} from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      setUser(session);
      setLoading(false);
    })();
  }, []);

  const register = useCallback(async ({ name, email, password, vinHash }) => {
    const users = await getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error('E-mail já cadastrado.');
    }

    const newUser = {
      id: Date.now().toString(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      vinHash: vinHash?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await saveUsers(users);
    await setSession(newUser);
    setUser(newUser);
    return newUser;
  }, []);

  const login = useCallback(async (email, password) => {
    const users = await getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const found = users.find(
      (u) => u.email === normalizedEmail && u.password === password
    );

    if (!found) {
      throw new Error('E-mail ou senha incorretos.');
    }

    await setSession(found);
    setUser(found);
    return found;
  }, []);

  const logout = useCallback(async () => {
    await setSession(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx < 0) throw new Error('Usuário não encontrado.');

    const updated = { ...users[idx], ...patch };
    users[idx] = updated;
    await saveUsers(users);
    await setSession(updated);
    setUser(updated);
    return updated;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
