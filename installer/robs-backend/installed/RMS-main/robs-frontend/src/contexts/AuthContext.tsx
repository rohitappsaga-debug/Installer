import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User } from '../types';
import socketService from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verify token is still valid
          // Verify token is still valid
          try {
            const response = await authAPI.getMe();
            if (response.success) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));

              // Check if token was refreshed during verification
              const currentToken = localStorage.getItem('authToken');
              const activeToken = currentToken || storedToken;

              if (currentToken && currentToken !== storedToken) {
                setToken(currentToken);
              }

              // Verification complete, state updated. 
              // RealtimeContext will handle socket connection.
            }
          } catch (error: any) {
            console.error('Auth verification error:', error);
            // Only clear storage if explicitly unauthorized (and refresh failed)
            if (error.response?.status === 401) {
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            }
            // On other errors (e.g. 500), keep the local session active
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, role: string) => {
    try {
      setIsLoading(true);


      const response = await authAPI.login(email, password, role);

      if (response.success) {
        const { user: userData, token: authToken, refreshToken } = response.data;

        setUser(userData);
        setToken(authToken);

        localStorage.setItem('authToken', authToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Login successful. Auth state updated.
        // RealtimeContext will handle socket connection.

        return userData;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {

      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    try {
      // Call logout API (optional, best effort)
      await authAPI.logout();
    } catch (error: any) {
      console.warn('Backend logout failed:', error);
    } finally {
      // Always clear local state
      setUser(null);
      setToken(null);

      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Disconnect socket
      socketService.disconnect();
    }
  };

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(storedRefreshToken);

      if (response.success) {
        const { token: newToken, user: userData } = response.data;

        setToken(newToken);
        setUser(userData);

        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Token refreshed. Auth state updated.
        // RealtimeContext will handle socket connection.
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    refreshToken,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
