// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import GitHubService from "../services/github";

// Vytvoření kontextu
const AuthContext = createContext();

/**
 * Poskytovatel autentizačního kontextu
 * @param {Object} props - Props komponenty
 * @returns {JSX.Element} Provider komponenta
 */
export function AuthProvider({ children }) {
  // State pro token, uživatele, stav načítání a chyby
  const [token, setToken] = useState(localStorage.getItem("github_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Efekt pro načtení uživatele při změně tokenu
  useEffect(() => {
    async function initializeAuth() {
      if (token) {
        try {
          setLoading(true);
          // Inicializace GitHub služby s tokenem
          GitHubService.init(token);
          
          // Ověření platnosti tokenu získáním dat uživatele
          const userData = await GitHubService.getUser();
          setUser(userData);
          
          // Uložení tokenu do localStorage
          localStorage.setItem("github_token", token);
          setError(null);
        } catch (err) {
          console.error("Chyba autentizace:", err);
          setError("Neplatný token nebo chyba při autentizaci");
          logout(); // Odhlášení při neplatném tokenu
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    initializeAuth();
  }, [token]);

  /**
   * Přihlášení uživatele
   * @param {string} newToken - GitHub Personal Access Token
   */
  const login = (newToken) => {
    setLoading(true);
    setToken(newToken);
  };

  /**
   * Odhlášení uživatele
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("github_token");
  };

  // Kontext obsahující vše potřebné pro autentizaci
  const contextValue = {
    isAuthenticated: !!user,
    user,
    token,
    login,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook pro přístup k autentizačnímu kontextu
 * @returns {Object} Autentizační kontext
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth musí být použit uvnitř AuthProvider");
  }
  
  return context;
}