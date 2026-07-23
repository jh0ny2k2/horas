import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import ErrorMessage from '../ui/ErrorMessage'

export default function Settings() {
  const { profile, company, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [hourlyRate, setHourlyRate] = useState(profile?.hourly_rate || 0)
  const [companyName, setCompanyName] = useState(company?.name || '')
  const [defaultRate, setDefaultRate] = useState(company?.default_rate || 0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSaveProfile = async () => {
    setError('')
    setLoading(true)

    try {
      await updateProfile({ hourly_rate: Number(hourlyRate) })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompany = async () => {
    setError('')
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          name: companyName.trim(),
          default_rate: Number(defaultRate),
        })
        .eq('id', company.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="btn-ghost flex items-center gap-1 text-sm text-slate-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
      </div>

      <h2 className="text-lg font-semibold text-slate-700">Configuración</h2>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {success && (
        <div className="bg-green-50 text-green-600 text-sm p-3 rounded-xl">
          Guardado correctamente
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Tu tarifa horaria</h3>
        <p className="text-xs text-slate-400 mb-3">
          Se usa para calcular tus ganancias
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="input-field"
              placeholder="0.00"
            />
          </div>
          <span className="text-sm text-slate-400">€/hora</span>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={loading}
          className="btn-primary mt-3"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {profile?.role === 'company_owner' && company && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Empresa</h3>

          <div className="space-y-3">
            <div>
              <label className="label">Nombre de la empresa</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-field"
                placeholder="Nombre de tu empresa"
              />
            </div>

            <div>
              <label className="label">Tarifa default para empleados</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="input-field"
                placeholder="0.00"
              />
              <p className="text-xs text-slate-400 mt-1">
                Se aplica a nuevos empleados (puedes cambiarla por cada uno)
              </p>
            </div>

            <button
              onClick={handleSaveCompany}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Guardando...' : 'Guardar empresa'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Tu cuenta</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600">Correo</span>
            <span className="text-sm text-slate-400">{profile?.id ? '***' : ''}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600">Rol</span>
            <span className="text-sm text-slate-400">
              {profile?.role === 'individual' ? 'Persona' :
               profile?.role === 'company_owner' ? 'Empresa' : 'Empleado'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
