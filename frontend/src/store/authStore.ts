import { create } from 'zustand'

export interface User {
  id: string
  email: string
  name: string
  confirmed_at: string | null
  created_at: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
  login: (accessToken: string, user: User) => void
  logout: () => void
  loginAsGuest: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,
  login: (accessToken, user) => set({ accessToken, user, isAuthenticated: true, isGuest: false, isLoading: false }),
  logout: () => set({ accessToken: null, user: null, isAuthenticated: false, isGuest: false, isLoading: false }),
  loginAsGuest: () => set({
    accessToken: null,
    user: {
      id: 'guest',
      email: 'guest@apinest.com',
      name: 'Guest User',
      confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    isAuthenticated: false,
    isGuest: true,
    isLoading: false
  }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
