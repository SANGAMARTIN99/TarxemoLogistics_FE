import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'OPERATIONS_MANAGER' | 'FINANCE_OFFICER' | 'DRIVER' | 'CUSTOMER' | 'VIEWER';
export type Language = 'en' | 'sw' | 'fr';
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string;
  avatar?: string;
}

interface AppState {
  // Auth
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Theme & Language
  theme: Theme;
  language: Language;
  
  // UI
  isSidebarOpen: boolean;
  notifications: number;
  
  // Tenant
  tenantTheme: Record<string, string> | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setSidebarOpen: (open: boolean) => void;
  setTenantTheme: (theme: Record<string, string>) => void;
  setNotifications: (count: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      theme: 'dark',
      language: 'en',
      isSidebarOpen: true,
      notifications: 0,
      tenantTheme: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        document.documentElement.classList.toggle('dark', next === 'dark');
      },
      setLanguage: (language) => set({ language }),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      setTenantTheme: (tenantTheme) => set({ tenantTheme }),
      setNotifications: (notifications) => set({ notifications }),
    }),
    {
      name: 'tarxemo-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
