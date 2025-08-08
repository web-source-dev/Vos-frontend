import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { loginUser, registerUser, verifyUser, logoutUser } from './api';
import type { User, AuthResponse } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; token?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; token?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isEstimator: boolean;
  isInspector: boolean;
  isCustomer: boolean;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  location?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to set token with verification
const setTokenWithVerification = async (token: string): Promise<boolean> => {
  console.log('Setting and verifying token...');
  
  // Set the token
  Cookies.set('token', token, { 
    expires: 7,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  // Verify the token was set
  const storedToken = Cookies.get('token');
  if (!storedToken) {
    console.error('Failed to set token in cookies');
    return false;
  }

  return true;
};

// Helper function to get token
const getToken = () => {
  const token = Cookies.get('token');
  console.log('Getting token:', token ? 'Token exists' : 'No token');
  return token;
};

// Helper function to remove token
const removeToken = () => {
  console.log('Removing token');
  Cookies.remove('token', { path: '/' });
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const verifyToken = useCallback(async (token: string) => {
    try {
      console.log('Verifying token...', token);
      const response = await verifyUser();
      
      if (response.success && response.data) {
        console.log('Token verified, setting user');
        setUser(response.data);
        return true;
      } else {
        console.log('Token verification failed');
        removeToken();
        router.push('/login');
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      removeToken();
      router.push('/login');
      return false;
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      console.log('Initial auth check:', token ? 'Token found' : 'No token');
    if (token) {
        await verifyToken(token);
    } else {
      setLoading(false);
    }
    };

    initAuth();
  }, [verifyToken]);



  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login...');
      const response: AuthResponse = await loginUser(email, password);

      if (response.success && response.token && response.user) {
        console.log('Login successful, setting and verifying token');
        const tokenSet = await setTokenWithVerification(response.token);
        
        if (!tokenSet) {
          throw new Error('Failed to set token');
        }

        // Double check token is set before setting user
        const verifiedToken = getToken();
        if (!verifiedToken) {
          throw new Error('Token verification failed');
        }

        setUser(response.user);
        return { success: true, token: response.token };
      } else {
        console.log('Login failed:', response.error);
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false };
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      console.log('Attempting signup...');
      const response: AuthResponse = await registerUser(userData);

      if (response.success && response.token && response.user) {
        console.log('Signup successful, setting and verifying token');
        const tokenSet = await setTokenWithVerification(response.token);
        
        if (!tokenSet) {
          throw new Error('Failed to set token');
        }

        // Double check token is set before setting user
        const verifiedToken = getToken();
        if (!verifiedToken) {
          throw new Error('Token verification failed');
        }

        setUser(response.user);
        return { success: true, token: response.token };
      } else {
        console.log('Signup failed:', response.error);
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false };
    }
  };

  const logout = async () => {
    console.log('Logging out...');
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
    removeToken();
    setUser(null);
    router.push('/login');
    }
  };

  // Role-based helper functions
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';
  const isEstimator = user?.role === 'estimator';
  const isInspector = user?.role === 'inspector';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isAdmin,
        isAgent,
        isEstimator,
        isInspector,
        isCustomer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 