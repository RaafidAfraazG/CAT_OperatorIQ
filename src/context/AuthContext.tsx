import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (code: string) => boolean;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// MVP Demo access code hardcoded per requirements
export const VALID_ACCESS_CODE = '123456';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // CRITICAL REQUIREMENT: Strictly in-memory React state.
  // Refreshing the page resets this to false, requiring re-authentication.
  // Do NOT store in localStorage, sessionStorage, or databases.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = (code: string): boolean => {
    const cleanCode = code.trim();
    if (cleanCode === VALID_ACCESS_CODE) {
      setIsAuthenticated(true);
      setError(null);
      return true;
    } else {
      setError('Invalid access code. Please check credentials and retry.');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
