import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AppShell from './components/app-shell/AppShell'
import { AuthProvider } from './features/auth/context/AuthProvider'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import AccountAccessGate from './features/access/components/AccountAccessGate'
import { YouthProvider } from './features/youth/context/YouthProvider'

const YouthDirectoryPage = lazy(
  () => import('./features/youth/routes/YouthDirectoryPage'),
)
const AuthPage = lazy(() => import('./features/auth/routes/AuthPage'))
const DashboardPage = lazy(
  () => import('./features/dashboard/routes/DashboardPage'),
)
const AccessPage = lazy(() => import('./features/access/routes/AccessPage'))
const CustomFieldsPage = lazy(
  () => import('./features/custom-fields/routes/CustomFieldsPage'),
)
const AccountPage = lazy(() => import('./features/account/routes/AccountPage'))

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <main className="route-loading" aria-live="polite">
              Preparando o diretório...
            </main>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/cadastro" element={<AuthPage mode="signup" />} />
            <Route
              path="/redefinir-senha"
              element={<AuthPage mode="reset" />}
            />
            <Route
              element={
                <ProtectedRoute>
                  <YouthProvider>
                    <AccountAccessGate>
                      <AppShell />
                    </AccountAccessGate>
                  </YouthProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/jovens" element={<YouthDirectoryPage />} />
              <Route path="/acessos" element={<AccessPage />} />
              <Route path="/campos" element={<CustomFieldsPage />} />
              <Route path="/conta" element={<AccountPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
