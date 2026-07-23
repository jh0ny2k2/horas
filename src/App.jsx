import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/ui/Header'
import BottomNavBar from './components/ui/BottomNavBar'
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
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-5 pb-28">
        <Outlet />
      </main>
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
