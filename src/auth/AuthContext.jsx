import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  loginRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
} from "@/auth/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const resetAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const bootstrapAuth = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await refreshRequest();
      setUser(data.user);
      setAccessToken(data.accessToken);
    } catch {
      resetAuth();
    } finally {
      setLoading(false);
    }
  }, [resetAuth]);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  const login = useCallback(async (email, password) => {
    setError("");
    const data = await loginRequest({ email, password });
    setUser(data.user);
    setAccessToken(data.accessToken);
    return data;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    setError("");
    const data = await registerRequest({ name, email, password, role });
    // Don't set user/accessToken — user must verify email first
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      resetAuth();
    }
  }, [resetAuth]);

  const authFetch = useCallback(
    async (url, options = {}) => {
      let token = accessToken;

      if (!token) {
        const refreshed = await refreshRequest();
        token = refreshed.accessToken;
        setUser(refreshed.user);
        setAccessToken(refreshed.accessToken);
      }

      const execute = async (tokenValue) => {
        const headers = new Headers(options.headers || {});
        headers.set("Authorization", `Bearer ${tokenValue}`);

        return fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      };

      let response = await execute(token);

      if (response.status === 401) {
        try {
          const refreshed = await refreshRequest();
          setUser(refreshed.user);
          setAccessToken(refreshed.accessToken);
          response = await execute(refreshed.accessToken);
        } catch {
          await logout();
          throw new Error("Session expired. Please log in again.");
        }
      }

      return response;
    },
    [accessToken, logout]
  );

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      error,
      isAuthenticated: Boolean(user && accessToken),
      isAdmin: user?.role === "admin",
      setError,
      login,
      register,
      logout,
      authFetch,
    }),
    [user, accessToken, loading, error, login, register, logout, authFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
