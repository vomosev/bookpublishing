'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { apiRequest } from '../lib/api';

const AuthContext = createContext(undefined);

function getErrorStatus(error) {
  const status = Number(error?.status ?? error?.statusCode);
  return Number.isInteger(status) ? status : null;
}

function isApiReachable(error) {
  const status = getErrorStatus(error);
  return status !== null && status < 500;
}

function getUserFromResponse(data) {
  if (data && typeof data === 'object' && 'user' in data) {
    return data.user;
  }

  if (data && typeof data === 'object' && ('id' in data || 'email' in data)) {
    return data;
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);

  const mountedRef = useRef(false);
  const operationRef = useRef(0);

  const refreshUser = useCallback(async () => {
    const operationId = ++operationRef.current;

    if (mountedRef.current) {
      setLoading(true);
    }

    try {
      const data = await apiRequest('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });
      const currentUser = getUserFromResponse(data);

      if (mountedRef.current && operationRef.current === operationId) {
        setUser(currentUser);
        setApiAvailable(true);
      }

      return currentUser;
    } catch (error) {
      if (mountedRef.current && operationRef.current === operationId) {
        setUser(null);
        setApiAvailable(isApiReachable(error));
      }

      return null;
    } finally {
      if (mountedRef.current && operationRef.current === operationId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refreshUser();

    return () => {
      mountedRef.current = false;
      operationRef.current += 1;
    };
  }, [refreshUser]);

  const login = useCallback(async (credentials, password) => {
    const payload =
      credentials && typeof credentials === 'object'
        ? {
            email: credentials.email,
            password: credentials.password,
          }
        : {
            email: credentials,
            password,
          };

    const operationId = ++operationRef.current;

    if (mountedRef.current) {
      setLoading(true);
    }

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const authenticatedUser = getUserFromResponse(data);

      if (!authenticatedUser) {
        throw new Error('The authentication service returned an invalid response.');
      }

      if (mountedRef.current && operationRef.current === operationId) {
        setUser(authenticatedUser);
        setApiAvailable(true);
      }

      return authenticatedUser;
    } catch (error) {
      if (mountedRef.current && operationRef.current === operationId) {
        setApiAvailable(isApiReachable(error));
      }

      throw error;
    } finally {
      if (mountedRef.current && operationRef.current === operationId) {
        setLoading(false);
      }
    }
  }, []);

  const signup = useCallback(async (details, email, password) => {
    const payload =
      details && typeof details === 'object'
        ? {
            displayName: details.displayName ?? details.name,
            email: details.email,
            password: details.password,
          }
        : {
            displayName: details,
            email,
            password,
          };

    const operationId = ++operationRef.current;

    if (mountedRef.current) {
      setLoading(true);
    }

    try {
      const data = await apiRequest('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const authenticatedUser = getUserFromResponse(data);

      if (!authenticatedUser) {
        throw new Error('The registration service returned an invalid response.');
      }

      if (mountedRef.current && operationRef.current === operationId) {
        setUser(authenticatedUser);
        setApiAvailable(true);
      }

      return authenticatedUser;
    } catch (error) {
      if (mountedRef.current && operationRef.current === operationId) {
        setApiAvailable(isApiReachable(error));
      }

      throw error;
    } finally {
      if (mountedRef.current && operationRef.current === operationId) {
        setLoading(false);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    const operationId = ++operationRef.current;

    if (mountedRef.current) {
      setLoading(true);
    }

    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (mountedRef.current && operationRef.current === operationId) {
        setApiAvailable(true);
      }

      return true;
    } catch (error) {
      if (mountedRef.current && operationRef.current === operationId) {
        setApiAvailable(isApiReachable(error));
      }

      return false;
    } finally {
      if (mountedRef.current && operationRef.current === operationId) {
        setUser(null);
        setLoading(false);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      apiAvailable,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, loading, apiAvailable, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}