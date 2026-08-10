import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import Header from './Header'
import BottomNavBar from './BottomNavBar'
import NavRail from './NavRail'

export default function Layout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory dark:bg-slate-950">
        <LoadingSpinner text="Cargando..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <div className="min-h-screen bg-ivory dark:bg-slate-950">
      <Header />
      <div className="mx-auto w-full max-w-6xl md:flex md:gap-6 md:px-6 lg:px-10">
        <aside className="hidden md:block md:w-[88px] lg:w-[104px] flex-shrink-0 self-start sticky top-24">
          <NavRail />
        </aside>
        <main className="w-full min-w-0 max-w-lg md:max-w-none mx-auto md:mx-0 px-4 md:px-0 py-5 pb-32 md:pb-12">
          <Outlet />
        </main>
      </div>
      <BottomNavBar />
    </div>
  )
}
