import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import ErrorMessage from '../ui/ErrorMessage'

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
      <div className="min-h-screen bg-ivory flex flex-col px-6 py-12 animate-fade-in">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gold to-gold-light mx-auto mb-5 flex items-center justify-center shadow-lg shadow-gold/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Bienvenido</h1>
            <p className="text-slate-400 text-sm mt-2">¿Cómo vas a usar la app?</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSelectRole('individual')}
              className="card w-full text-left hover:shadow-lg hover:border-gold/30 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-700">Soy persona</h3>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Quiero registrar mis horas de trabajo
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => handleSelectRole('company_owner')}
              className="card w-full text-left hover:shadow-lg hover:border-gold/30 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                  <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-700">Soy empresa</h3>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Quiero gestionar las horas de mis empleados
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'individual-rate') {
    return (
      <div className="min-h-screen bg-ivory flex flex-col px-6 py-12 animate-fade-in">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 mx-auto mb-5 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Tu tarifa horaria</h1>
            <p className="text-slate-400 text-sm mt-2">
              ¿Cuánto cobras por hora? Puedes cambiarlo después.
            </p>
          </div>

          <div className="space-y-4">
            <ErrorMessage message={error} onDismiss={() => setError('')} />

            <div>
              <label className="label" htmlFor="rate">Tarifa por hora ($)</label>
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
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'company-name') {
    return (
      <div className="min-h-screen bg-ivory flex flex-col px-6 py-12 animate-fade-in">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-3xl bg-gold/10 mx-auto mb-5 flex items-center justify-center">
              <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Nombre de empresa</h1>
            <p className="text-slate-400 text-sm mt-2">
              ¿Cómo se llama tu empresa o negocio?
            </p>
          </div>

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
              <label className="label" htmlFor="company-rate">Tarifa default por hora ($)</label>
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
              <p className="text-xs text-slate-400 mt-1">
                Tarifa base para tus empleados (puedes cambiarla por cada uno)
              </p>
            </div>

            <button onClick={handleCreateAccount} disabled={loading} className="btn-primary">
              {loading ? 'Creando empresa...' : 'Crear empresa'}
            </button>

            <button
              onClick={() => setStep('choose')}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
