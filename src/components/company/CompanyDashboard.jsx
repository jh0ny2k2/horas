import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatHours, getWeekRange, getMonthRange } from '../../lib/calculations'
import SummaryCard from '../dashboard/SummaryCard'
import LoadingSpinner from '../ui/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

export default function CompanyDashboard() {
  const { user, company } = useAuth()
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [employeeShifts, setEmployeeShifts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user, company])

  const loadData = async () => {
    if (!company) return

    try {
      setLoading(true)

      const { data: members } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'accepted')

      const employeeUserIds = members?.map(m => m.user_id) || []

      if (employeeUserIds.length > 0) {
        const today = new Date()
        const { start: weekStart } = getWeekRange(today)
        const { start: monthStart, end: monthEnd } = getMonthRange(today)

        const { data: shifts } = await supabase
          .from('work_shifts')
          .select('*')
          .in('user_id', employeeUserIds)
          .gte('work_date', monthStart.toISOString().split('T')[0])
          .lte('work_date', monthEnd.toISOString().split('T')[0])

        setEmployeeShifts(shifts || [])
      }

      setEmployees(members || [])
    } catch (err) {
      console.error('Error loading company data:', err)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const { start: weekStart, end: weekEnd } = getWeekRange(today)
  const { start: monthStart, end: monthEnd } = getMonthRange(today)

  const approvedShifts = employeeShifts.filter(s => s.approved)
  const totalMonthHours = approvedShifts.reduce((acc, s) => acc + Number(s.total_hours), 0)
  const totalWeekHours = approvedShifts.filter(s => {
    const d = new Date(s.work_date)
    return d >= weekStart && d <= weekEnd
  }).reduce((acc, s) => acc + Number(s.total_hours), 0)
  const todayHours = approvedShifts.filter(s => s.work_date === todayStr)
    .reduce((acc, s) => acc + Number(s.total_hours), 0)

  const totalCost = employees.reduce((acc, emp) => {
    const empHours = approvedShifts.filter(s => s.user_id === emp.user_id)
      .reduce((sum, s) => sum + Number(s.total_hours), 0)
    return acc + (empHours * Number(emp.hourly_rate || 0))
  }, 0)

  const pendingShifts = employeeShifts.filter(s => !s.approved)
  const pendingCount = pendingShifts.length

  if (loading) return <LoadingSpinner text="Cargando empresa..." />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-700">{company?.name}</h2>
          <p className="text-xs text-slate-400">{employees.length} empleado{employees.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => navigate('/company/employees')}
          className="flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold/80 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invitar
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              {pendingCount} turno{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de aprobar
            </p>
            <p className="text-xs text-yellow-600">Tus empleados registraron horas esperando tu aprobación</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 stagger">
        <SummaryCard
          label="Equipo hoy"
          value={formatHours(todayHours)}
          subtitle={`${employees.length} empleado${employees.length !== 1 ? 's' : ''}`}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="gold"
        />
        <SummaryCard
          label="Equipo semana"
          value={formatHours(totalWeekHours)}
          subtitle="horas totales"
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          color="blue"
        />
        <SummaryCard
          label="Equipo mes"
          value={formatHours(totalMonthHours)}
          subtitle="horas trabajadas"
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          color="green"
        />
        <SummaryCard
          label="Costo estimado"
          value={`€${totalCost.toFixed(2)}`}
          subtitle={formatHours(totalMonthHours)}
          icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          color="purple"
        />
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Empleados</h3>
        {employees.length === 0 ? (
          <div className="text-center py-6">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm text-slate-400 mb-3">No hay empleados aún</p>
            <button
              onClick={() => navigate('/company/employees')}
              className="btn-primary w-auto px-6"
            >
              Invitar empleado
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {employees.map((emp) => {
              const empShifts = approvedShifts.filter(s => s.user_id === emp.user_id)
              const empMonthHours = empShifts.reduce((acc, s) => acc + Number(s.total_hours), 0)
              const empCost = empMonthHours * Number(emp.hourly_rate || 0)

              return (
                <div
                  key={emp.id}
                  onClick={() => navigate(`/company/employee/${emp.user_id}`)}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gold">
                        {(emp.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {emp.email?.split('@')[0] || 'Empleado'}
                      </p>
                      <p className="text-xs text-slate-400">
                        €{Number(emp.hourly_rate || 0).toFixed(2)}/hora
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700 tabular-nums">
                        {formatHours(empMonthHours)}
                      </p>
                      <p className="text-xs text-slate-400">
                        €{empCost.toFixed(2)}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
