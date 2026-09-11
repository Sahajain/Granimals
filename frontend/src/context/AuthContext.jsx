/**
 * context/AuthContext.jsx — Global authentication state.
 *
 * React Concepts:
 * - createContext()  → creates a "global store" for a piece of state
 * - useContext()     → lets any component READ from that global store
 * - Provider         → wraps the app, makes the context available to all children
 *
 * What we store:
 * - user        → the logged-in user object (or null)
 * - token       → the JWT token string (or null)
 * - isLoading   → true while we check if a saved token is valid
 * - login()     → call this when user submits login form
 * - logout()    → call this when user clicks logout
 *
 * Persistence:
 * We save the token to localStorage. So if you refresh the page,
 * you're still logged in (token is re-read on startup).
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

// 1. Create the context (like creating an empty box)
const AuthContext = createContext(null);

// 2. Create the Provider component (like filling the box and sharing it)
export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until we verify saved token

  // ── On App Start: Check for Saved Token ───────────────────────────
  // useEffect with [] runs ONCE when the component mounts (app starts)
  // We check localStorage for a saved token and validate it with the backend
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('access_token');
      const savedUser  = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          // Verify token is still valid by calling /api/auth/me
          // The axios interceptor automatically adds Authorization: Bearer savedToken
          setToken(savedToken);
          const response = await api.get('/api/auth/me');
          setUser(response.data);
        } catch {
          // Token is expired or invalid → clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }

      setIsLoading(false); // Done checking
    };

    initAuth();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    // The login endpoint expects FORM data (not JSON) — this is OAuth2 standard
    const formData = new URLSearchParams();
    formData.append('username', email);  // OAuth2 uses 'username' field
    formData.append('password', password);

    const response = await api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = response.data;

    // Get user info with the new token
    const meResponse = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // Save to state AND localStorage (so it persists on refresh)
    setToken(access_token);
    setUser(meResponse.data);
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(meResponse.data));
  }, []);

  // ── Logout ────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    // Navigation happens in the component that calls logout
  }, []);

  // 3. Provide the context value to all children
  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Custom hook — components call useAuth() instead of useContext(AuthContext)
// This is cleaner and catches the "used outside provider" mistake
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
