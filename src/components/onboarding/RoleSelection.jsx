import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import ErrorMessage from '../ui/ErrorMessage'
import AuthShell from '../auth/AuthShell'

export default function RoleSelection() {
  const [step, setStep] = useState('choose')
  const [role, setRole] = useState(null)
  const [companyName, setCompanyName] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { createProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const handleSelectRole = (selected) => {
    setRole(selected)
    if (selected === 'individual') {
      setStep('individual-rate')
    } else {
      setStep('company-name')
    }
  }

  const handleCreateAccount = async () => {
    setError('')
    setLoading(true)

    try {
      if (role === 'individual') {
        await createProfile('individual', null, Number(hourlyRate) || 0)
      } else {
        if (!companyName.trim()) {
          setError('Debes ingresar el nombre de la empresa')
          setLoading(false)
          return
        }
        await createProfile('company_owner', companyName.trim(), Number(hourlyRate) || 0)
      }

      await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error al crear el perfil')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'choose') {
    return (
      <AuthShell
        title="Bienvenido"
        subtitle="¿Cómo vas a usar la app?"
        icon={
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      >
        <div className="space-y-3">
          <button
            onClick={() => handleSelectRole('individual')}
            className="card w-full text-left hover:shadow-premium-lg hover:border-brand-300 dark:hover:border-brand-500/40 hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 dark:group-hover:bg-sky-500/25 transition-colors">
                <svg className="w-6 h-6 text-sky-500 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Soy persona</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                  Quiero registrar mis horas de trabajo
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => handleSelectRole('company_owner')}
            className="card w-full text-left hover:shadow-premium-lg hover:border-brand-300 dark:hover:border-brand-500/40 hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 dark:group-hover:bg-brand-500/25 transition-colors">
                <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Soy empresa</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                  Quiero gestionar las horas de mis empleados
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </AuthShell>
    )
  }

  if (step === 'individual-rate') {
    return (
      <AuthShell
        title="Tu tarifa horaria"
        subtitle="¿Cuánto cobras por hora? Puedes cambiarlo después."
        iconClassName="from-sky-500 to-blue-600 shadow-sky-500/30 ring-sky-500/10"
        icon={
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <div className="space-y-4">
          <ErrorMessage message={error} onDismiss={() => setError('')} />

          <div>
            <label className="label" htmlFor="rate">Tarifa por hora (€)</label>
            <input
              id="rate"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="input-field text-center text-2xl font-bold"
              placeholder="0.00"
            />
          </div>

          <button onClick={handleCreateAccount} disabled={loading} className="btn-primary">
            {loading ? 'Creando perfil...' : 'Continuar'}
          </button>

          <button
            onClick={() => setStep('choose')}
            className="w-full text-center text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Volver
          </button>
        </div>
      </AuthShell>
    )
  }

  if (step === 'company-name') {
    return (
      <AuthShell
        title="Nombre de empresa"
        subtitle="¿Cómo se llama tu empresa o negocio?"
        icon={
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      >
        <div className="space-y-4">
          <ErrorMessage message={error} onDismiss={() => setError('')} />

          <div>
            <label className="label" htmlFor="company-name">Nombre</label>
            <input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input-field"
              placeholder="Ej: Constructora ABC"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="company-rate">Tarifa default por hora (€)</label>
            <input
              id="company-rate"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="input-field"
              placeholder="0.00"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Tarifa base para tus empleados (puedes cambiarla por cada uno)
            </p>
          </div>

          <button onClick={handleCreateAccount} disabled={loading} className="btn-primary">
            {loading ? 'Creando empresa...' : 'Crear empresa'}
          </button>

          <button
            onClick={() => setStep('choose')}
            className="w-full text-center text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Volver
          </button>
        </div>
      </AuthShell>
    )
  }

  return null
}
