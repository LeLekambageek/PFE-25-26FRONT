import { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "../api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Chargement initial uniquement s'il y a un token à vérifier
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("api_token")));

  useEffect(() => {
    if (!localStorage.getItem("api_token")) return;

    apiClient
      .get("/me")
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem("api_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/login", { email, password });
      localStorage.setItem("api_token", data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiClient.post("/logout");
    localStorage.removeItem("api_token");
    setUser(null);
  }, []);

  // Recharge l'utilisateur (ex. après changement de mot de passe : must_change_password repasse à false)
  const refreshUser = useCallback(async () => {
    const { data } = await apiClient.get("/me");
    setUser(data);
    return data;
  }, []);

  const hasRole = useCallback(
    (role) => user?.roles?.some((r) => r.name === role) ?? false,
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook exporté avec le Provider par convention (import unique depuis AuthContext)
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}