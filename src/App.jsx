import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { registerForPushNotifications } from './lib/notifications'
import Header from './components/ui/Header'
import BottomNavBar from './components/ui/BottomNavBar'
import NavRail from './components/ui/NavRail'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import RoleSelection from './components/onboarding/RoleSelection'
import Dashboard from './components/dashboard/Dashboard'
import CompanyDashboard from './components/company/CompanyDashboard'
import EmployeeList from './components/company/EmployeeList'
import EmployeeDetail from './components/company/EmployeeDetail'
import JoinCompany from './components/company/JoinCompany'
import JoinByLink from './components/company/JoinByLink'
import WorkShiftForm from './components/shifts/WorkShiftForm'
import History from './components/history/History'
import Statistics from './components/stats/Statistics'
import Payments from './components/payments/Payments'
import Settings from './components/settings/Settings'
import LoadingSpinner from './components/ui/LoadingSpinner'

function AuthLayout() {
  return (
    <Routes>
      <Route path="login" element={<LoginForm />} />
      <Route path="register" element={<RegisterForm />} />
    </Routes>
  )
}

function ProtectedLayout() {
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (user) {
      registerForPushNotifications(user.id)
    }
  }, [user])

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

  if (!profile) {
    return <RoleSelection />
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

function MainDashboard() {
  const { profile } = useAuth()

  if (profile?.role === 'company_owner') {
    return <CompanyDashboard />
  }

  return <Dashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth/*" element={<AuthLayout />} />
          <Route path="/join/:token" element={<JoinByLink />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<MainDashboard />} />
            <Route path="/register" element={<WorkShiftForm />} />
            <Route path="/history" element={<History />} />
            <Route path="/stats" element={<Statistics />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/company/employees" element={<EmployeeList />} />
            <Route path="/company/employee/:employeeId" element={<EmployeeDetail />} />
            <Route path="/company/join" element={<JoinCompany />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
