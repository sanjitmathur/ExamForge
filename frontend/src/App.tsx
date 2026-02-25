import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import UserAuthPage from './pages/UserAuthPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminUserDetailPage from './pages/AdminUserDetailPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import QuestionsPage from './pages/QuestionsPage'
import GeneratePage from './pages/GeneratePage'
import ViewPaperPage from './pages/ViewPaperPage'
import SettingsPage from './pages/SettingsPage'
import { useAuth } from './context/AuthContext'
import './App.css'

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  return <>{children}</>
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  if (user?.role === 'admin') return <Navigate to="/admin" replace />

  return <ProtectedRoute>{children}</ProtectedRoute>
}

function App() {
  const { user } = useAuth()

  const catchAll = user?.role === 'admin' ? '/admin' : '/'

  return (
    <div className="app-layout">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/admin" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : <AdminLoginPage />} />
        <Route path="/login/user" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : <UserAuthPage />} />

        {/* Admin-only routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/users/:id" element={<AdminRoute><AdminUserDetailPage /></AdminRoute>} />

        {/* Settings (both admin and user) */}
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* User-only routes (admin gets redirected to /admin) */}
        <Route path="/" element={<UserRoute><DashboardPage /></UserRoute>} />
        <Route path="/upload" element={<UserRoute><UploadPage /></UserRoute>} />
        <Route path="/questions" element={<UserRoute><QuestionsPage /></UserRoute>} />
        <Route path="/generate" element={<UserRoute><GeneratePage /></UserRoute>} />
        <Route path="/paper/:id" element={<UserRoute><ViewPaperPage /></UserRoute>} />

        <Route path="*" element={<Navigate to={catchAll} replace />} />
      </Routes>
    </div>
  )
}

export default App
