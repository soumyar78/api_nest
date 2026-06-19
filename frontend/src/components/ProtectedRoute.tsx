import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isGuest, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-sm text-muted-foreground">Loading session...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
