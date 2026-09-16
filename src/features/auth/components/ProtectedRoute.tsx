import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const ProtectedRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const { session, isCheckingSession } = useAuth()
  const location = useLocation()

  return isCheckingSession ? (
    <main className="route-loading" aria-live="polite">
      Verificando seu acesso...
    </main>
  ) : session ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  )
}

export default ProtectedRoute
