import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import Header from './Header'
import BottomNavBar from './BottomNavBar'

export default function Layout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <LoadingSpinner text="Cargando..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-5 pb-28">
        <Outlet />
      </main>
      <BottomNavBar />
    </div>
  )
}
