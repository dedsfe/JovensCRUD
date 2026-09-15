import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

const YouthDirectoryPage = lazy(
  () => import('./features/youth/routes/YouthDirectoryPage'),
)

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <main className="route-loading" aria-live="polite">
            Preparando o diretório...
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/jovens" replace />} />
          <Route path="/jovens" element={<YouthDirectoryPage />} />
          <Route path="*" element={<Navigate to="/jovens" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
