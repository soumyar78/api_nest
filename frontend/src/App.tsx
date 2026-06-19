import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const { login, logout, setLoading, isLoading } = useAuthStore()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          login(data.access_token, data.user)
        } else {
          logout()
        }
      } catch (err) {
        logout()
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [login, logout, setLoading])

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F9FBF9] relative overflow-hidden">
        {/* Subtle background radial glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-100/60 via-emerald-50/30 to-transparent blur-3xl loading-bg-pulse" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 loading-fade-in">
          {/* Logo with animated ring */}
          <div className="relative flex items-center justify-center">
            {/* Outer spinning gradient ring */}
            <div className="absolute w-[88px] h-[88px] rounded-full loading-ring-spin">
              <svg className="w-full h-full" viewBox="0 0 88 88">
                <defs>
                  <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#059669" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <circle cx="44" cy="44" r="40" fill="none" stroke="url(#ring-grad)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            {/* Static subtle track ring */}
            <div className="absolute w-[88px] h-[88px] rounded-full border border-emerald-200/40" />
            {/* Logo */}
            <img src="/logo.svg" alt="ApiNest" className="w-14 h-14 rounded-2xl shadow-lg shadow-emerald-500/10 loading-logo-pulse" />
          </div>

          {/* Brand text */}
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-zinc-800">
              Api<span className="text-emerald-600">Nest</span>
            </h1>
            {/* Animated shimmer bar */}
            <div className="w-36 h-1 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent loading-shimmer" />
            </div>
          </div>

          {/* Pulsing dots */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 loading-dot-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 loading-dot-2" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 loading-dot-3" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
