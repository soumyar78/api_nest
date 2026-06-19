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
      <div className="flex h-screen w-screen items-center justify-center bg-white text-zinc-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-sm font-medium text-zinc-500">Loading ApiNest...</span>
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
