import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/AdminDashboard'
import ParticipantDashboard from './pages/ParticipantDashboard'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import TeamsPage from './pages/TeamsPage'
import NotificationsPage from './pages/NotificationsPage'
import AdminEventsPage from './pages/AdminEventsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Participant */}
          <Route path="/dashboard" element={<ProtectedRoute><ParticipantDashboard /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute adminOnly><AdminEventsPage /></ProtectedRoute>} />
          <Route path="/admin/events/:id" element={<ProtectedRoute adminOnly><EventDetailPage adminMode /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AnalyticsPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
