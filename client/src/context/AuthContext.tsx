import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  onboarded: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (fullName: string, email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const savedUser = localStorage.getItem('gp_user');
    const savedToken = localStorage.getItem('gp_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('gp_user');
        localStorage.removeItem('gp_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password = 'password123'): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('gp_user', JSON.stringify(data.user));
        localStorage.setItem('gp_token', data.token);
        return true;
      }
    } catch (err) {
      console.warn('Backend offline, using fallback auth:', err);
      // Fallback local auth
      const mockUser: User = {
        id: 'user_demo',
        name: email.split('@')[0].toUpperCase() || 'Commander Alex',
        email: email,
        role: 'City Operations',
        onboarded: true
      };
      setUser(mockUser);
      setToken('mock_token');
      localStorage.setItem('gp_user', JSON.stringify(mockUser));
      localStorage.setItem('gp_token', 'mock_token');
      return true;
    }
    return false;
  };

  const signup = async (fullName: string, email: string, password: string, role: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('gp_user', JSON.stringify(data.user));
        localStorage.setItem('gp_token', data.token);
        return true;
      }
    } catch (err) {
      console.warn('Backend offline, using fallback signup:', err);
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name: fullName,
        email: email,
        role: role,
        onboarded: false
      };
      setUser(mockUser);
      setToken('mock_token');
      localStorage.setItem('gp_user', JSON.stringify(mockUser));
      localStorage.setItem('gp_token', 'mock_token');
      return true;
    }
    return false;
  };

  const completeOnboarding = () => {
    if (user) {
      const updated = { ...user, onboarded: true };
      setUser(updated);
      localStorage.setItem('gp_user', JSON.stringify(updated));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('gp_user');
    localStorage.removeItem('gp_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, completeOnboarding, isLoading }}>
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
