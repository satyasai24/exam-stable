
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, UserRole } from '../types';
import { getAuthFromLocalStorage, setAuthInLocalStorage } from '../utils/localStorage';
import { login as authLogin, logout as authLogout } from '../utils/auth';

interface AuthContextProps {
  authState: AuthState;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => getAuthFromLocalStorage());

  useEffect(() => {
    // When the authState changes, update localStorage
    setAuthInLocalStorage(authState);
  }, [authState]);

  const login = async (email: string, password: string) => {
    const result = await authLogin(email, password);
    
    if (result.success && result.role) {
      const updatedAuthState = getAuthFromLocalStorage(); // Get the fresh state after login
      setAuthState(updatedAuthState);
    }
    
    return result;
  };

  const logout = () => {
    authLogout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null
    });
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
