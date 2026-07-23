import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import ErrorMessage from '../ui/ErrorMessage'

export default function Settings() {
  const { profile, company, updateProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [hourlyRate, setHourlyRate] = useState(profile?.hourly_rate || 0)
  const [companyName, setCompanyName] = useState(company?.name || '')
  const [defaultRate, setDefaultRate] = useState(company?.default_rate || 0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showRoleChange, setShowRoleChange] = useState(false)
  const [newRole, setNewRole] = useState(null)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyRate, setNewCompanyRate] = useState('')
  const [changingRole, setChangingRole] = useState(false)

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

  const handleChangeRole = async () => {
    setError('')
    setChangingRole(true)

    try {
      if (newRole === 'company_owner') {
        if (!newCompanyName.trim()) {
          setError('Debes ingresar el nombre de la empresa')
          setChangingRole(false)
          return
        }
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            owner_id: profile.id,
            name: newCompanyName.trim(),
            default_rate: Number(newCompanyRate) || 0,
          })
          .select()
          .single()

        if (companyError) throw companyError

        await updateProfile({
          role: 'company_owner',
          company_id: newCompany.id,
        })
      } else {
        await updateProfile({
          role: 'individual',
          company_id: null,
        })
      }

      await refreshProfile()
      setSuccess(true)
      setShowRoleChange(false)
      setNewRole(null)
      setNewCompanyName('')
      setNewCompanyRate('')
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err.message || 'Error al cambiar rol')
    } finally {
      setChangingRole(false)
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
            <span className="text-sm text-slate-600">Rol actual</span>
            <span className="text-sm text-slate-400">
              {profile?.role === 'individual' ? 'Persona' :
               profile?.role === 'company_owner' ? 'Empresa' : 'Empleado'}
            </span>
          </div>
        </div>

        {profile?.role !== 'employee' && (
          <button
            onClick={() => setShowRoleChange(!showRoleChange)}
            className="btn-ghost text-sm text-gold mt-3"
          >
            Cambiar a {profile?.role === 'individual' ? 'Empresa' : 'Persona'}
          </button>
        )}

        {showRoleChange && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {newRole === null ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">¿A qué rol quieres cambiar?</p>
                <button
                  onClick={() => setNewRole('individual')}
                  className="card w-full text-left hover:border-gold/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-700">Soy persona</h4>
                      <p className="text-xs text-slate-400">Registrar mis horas de trabajo</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setNewRole('company_owner')}
                  className="card w-full text-left hover:border-gold/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-700">Soy empresa</h4>
                      <p className="text-xs text-slate-400">Gestionar horas de mis empleados</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowRoleChange(false); setNewRole(null) }}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : newRole === 'company_owner' && !company ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Crea tu empresa</p>
                <div>
                  <label className="label">Nombre de la empresa</label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="input-field"
                    placeholder="Ej: Constructora ABC"
                  />
                </div>
                <div>
                  <label className="label">Tarifa default por hora (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCompanyRate}
                    onChange={(e) => setNewCompanyRate(e.target.value)}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <button
                  onClick={handleChangeRole}
                  disabled={changingRole}
                  className="btn-primary"
                >
                  {changingRole ? 'Cambiando...' : 'Crear empresa y cambiar rol'}
                </button>
                <button
                  onClick={() => { setNewRole(null); setNewCompanyName(''); setNewCompanyRate('') }}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Volver
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  {newRole === 'individual'
                    ? 'Cambiaste a persona. Tu empresa seguirá existiendo.'
                    : 'Ya tienes una empresa. Se vinculará a tu cuenta.'}
                </p>
                <button
                  onClick={handleChangeRole}
                  disabled={changingRole}
                  className="btn-primary"
                >
                  {changingRole ? 'Cambiando...' : 'Confirmar cambio'}
                </button>
                <button
                  onClick={() => setNewRole(null)}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
