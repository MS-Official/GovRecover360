import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CurrentUserResponse, User, Permission, Role } from '../types';
import api from '../services/api';
import { getAsgardeoLogoutUrl, getAuthMode } from '../services/oidc';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginAsRole: (role: string) => Promise<void>;
  completeAsgardeoLogin: (accessToken: string, idToken?: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (perm: Permission) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, User> = {
  admin: {
    id: '1',
    email: 'admin@gov.lk',
    full_name: 'Admin User',
    role: 'admin',
    permissions: ['users:read', 'users:write', 'users:delete', 'disasters:read', 'disasters:write', 'disasters:delete', 'households:read', 'households:write', 'households:verify', 'applications:read', 'applications:write', 'applications:approve', 'payments:read', 'payments:write', 'payments:approve', 'inventory:read', 'inventory:write', 'warehouse:read', 'warehouse:write', 'dispatch:read', 'dispatch:write', 'zones:read', 'zones:write', 'reports:read', 'reports:write', 'audit:read', 'ngo:read', 'ngo:write'],
    district: 'colombo',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  field_officer: {
    id: '2',
    email: 'field@gov.lk',
    full_name: 'Kamal Perera',
    role: 'field_officer',
    permissions: ['households:read', 'households:write', 'disasters:read'],
    district: 'galle',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  verifier: {
    id: '3',
    email: 'verify@gov.lk',
    full_name: 'Nimali Silva',
    role: 'verifier',
    permissions: ['households:read', 'households:verify', 'applications:read'],
    district: 'colombo',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  program_manager: {
    id: '4',
    email: 'manager@gov.lk',
    full_name: 'Saman Jayasuriya',
    role: 'program_manager',
    permissions: ['applications:read', 'applications:write', 'applications:approve', 'households:read', 'ngo:read', 'ngo:write', 'reports:read'],
    district: 'colombo',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  finance_officer: {
    id: '5',
    email: 'finance@gov.lk',
    full_name: 'Dilani Fernando',
    role: 'finance_officer',
    permissions: ['payments:read', 'payments:write', 'payments:approve'],
    district: 'colombo',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  warehouse_officer: {
    id: '6',
    email: 'warehouse@gov.lk',
    full_name: 'Priya Rathnayake',
    role: 'warehouse_officer',
    permissions: ['inventory:read', 'inventory:write', 'warehouse:read', 'warehouse:write', 'dispatch:read', 'dispatch:write'],
    district: 'colombo',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  gis_officer: {
    id: '7',
    email: 'gis@gov.lk',
    full_name: 'Rohan Wickramasinghe',
    role: 'gis_officer',
    permissions: ['zones:read', 'zones:write', 'disasters:read'],
    district: 'colombo',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  ngo_partner: {
    id: '8',
    email: 'ngo@relief.org',
    full_name: 'Sarah Foundation',
    role: 'ngo_partner',
    permissions: ['ngo:read', 'ngo:write', 'dispatch:read', 'households:read'],
    organization: 'Sarah Foundation',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  auditor: {
    id: '9',
    email: 'auditor@gov.lk',
    full_name: 'Sunil Bandara',
    role: 'auditor',
    permissions: ['reports:read', 'audit:read', 'users:read'],
    district: 'colombo',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  citizen: {
    id: '10',
    email: 'citizen@example.com',
    full_name: 'Rajesh Kumar',
    role: 'citizen',
    permissions: ['households:read', 'applications:read', 'applications:write'],
    district: 'kandy',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
};

const BACKEND_ROLE_MAP: Record<string, Role> = {
  ROLE_ADMIN: 'admin',
  ROLE_DISASTER_MANAGER: 'program_manager',
  ROLE_FIELD_OFFICER: 'field_officer',
  ROLE_VERIFIER: 'verifier',
  ROLE_PROGRAM_MANAGER: 'program_manager',
  ROLE_FINANCE_OFFICER: 'finance_officer',
  ROLE_WAREHOUSE_OFFICER: 'warehouse_officer',
  ROLE_GIS_OFFICER: 'gis_officer',
  ROLE_NGO_PARTNER: 'ngo_partner',
  ROLE_AUDITOR: 'auditor',
  ROLE_CITIZEN: 'citizen',
};

function mapCurrentUser(data: CurrentUserResponse): User {
  const backendRole = data.roles?.[0] || 'ROLE_CITIZEN';
  return {
    id: data.id,
    email: data.email,
    full_name: data.name,
    role: BACKEND_ROLE_MAP[backendRole] || 'citizen',
    permissions: data.permissions as Permission[],
    district: data.claims?.district || undefined,
    organization: data.claims?.organization || undefined,
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

function mapBackendUser(data: any): User {
  return {
    ...data,
    full_name: data.full_name || data.name || data.email,
    role: BACKEND_ROLE_MAP[data.role] || data.role,
    permissions: data.permissions || [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, access_token } = response.data;
    const token = access_token;
    const mappedUser = mapBackendUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(mappedUser));
    setUser(mappedUser);
  }, []);

  const loginAsRole = useCallback(async (role: string) => {
    const userData = DEMO_USERS[role];
    if (!userData) throw new Error('Invalid role');
    const token = `demo-token-${role}-${Date.now()}`;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const completeAsgardeoLogin = useCallback(async (accessToken: string, idToken?: string) => {
    localStorage.setItem('token', accessToken);
    if (idToken) localStorage.setItem('id_token', idToken);
    const response = await api.get<CurrentUserResponse>('/me');
    const userData = mapCurrentUser(response.data);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    const idToken = localStorage.getItem('id_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('id_token');
    setUser(null);
    if (getAuthMode() === 'asgardeo') {
      window.location.href = getAsgardeoLogoutUrl(idToken);
    }
  }, []);

  const hasPermission = useCallback(
    (perm: Permission) => {
      return user?.permissions?.includes(perm) ?? false;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginAsRole,
        completeAsgardeoLogin,
        logout,
        isAuthenticated: !!user,
        hasPermission,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
