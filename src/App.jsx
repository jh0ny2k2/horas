import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/ui/Layout'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import Dashboard from './components/dashboard/Dashboard'
import WorkShiftForm from './components/shifts/WorkShiftForm'
import History from './components/history/History'
import Statistics from './components/stats/Statistics'

function AuthLayout() {
  return (
    <Routes>
      <Route path="login" element={<LoginForm />} />
      <Route path="register" element={<RegisterForm />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth/*" element={<AuthLayout />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<WorkShiftForm />} />
            <Route path="/history" element={<History />} />
            <Route path="/stats" element={<Statistics />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
