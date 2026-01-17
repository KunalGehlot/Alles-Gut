import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { UserProfile, AuthRequestCodeRequest, AuthVerifyRequest } from '@alles-gut/shared';
import { api } from '@/services/api';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  requestCode: (data: AuthRequestCodeRequest) => Promise<void>;
  verify: (data: AuthVerifyRequest) => Promise<{ isNewUser: boolean }>;
  updateProfile: (displayName: string, checkInIntervalHours: number) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider(): AuthContextValue {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const init = async () => {
      await api.init();

      if (api.isAuthenticated()) {
        try {
          const user = await api.getProfile();
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch {
          // Token might be expired, try refresh
          const refreshed = await api.refreshToken();
          if (refreshed) {
            const user = await api.getProfile();
            setState({
              user,
              isLoading: false,
              isAuthenticated: true,
            });
          } else {
            setState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        }
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    init();
  }, []);

  const requestCode = useCallback(async (data: AuthRequestCodeRequest) => {
    await api.requestCode(data);
  }, []);

  const verify = useCallback(async (data: AuthVerifyRequest) => {
    const response = await api.verify(data);
    setState({
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
    });
    return { isNewUser: response.isNewUser };
  }, []);

  const updateProfile = useCallback(async (displayName: string, checkInIntervalHours: number) => {
    const user = await api.updateProfile({ displayName, checkInIntervalHours });
    setState(prev => ({
      ...prev,
      user,
    }));
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await api.getProfile();
    setState(prev => ({
      ...prev,
      user,
    }));
  }, []);

  return {
    ...state,
    requestCode,
    verify,
    updateProfile,
    logout,
    refreshUser,
  };
}

export { AuthContext };
