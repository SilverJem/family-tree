import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Canvas from './pages/Canvas.jsx'
import ShareView from './pages/ShareView.jsx'
import { ToastContainer } from './components/ui/ToastContainer.jsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading…</div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading…</div>
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <>
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </PrivateRoute>
        }
      />
      <Route
        path="/tree/:id"
        element={
          <PrivateRoute>
            <ErrorBoundary>
              <Canvas />
            </ErrorBoundary>
          </PrivateRoute>
        }
      />
      {/* Share view is public — no auth required */}
      <Route path="/share/:token" element={<ErrorBoundary><ShareView /></ErrorBoundary>} />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ToastContainer />
    </>
  )
}
