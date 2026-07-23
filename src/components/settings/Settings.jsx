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
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingRole, setPendingRole] = useState(null)
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

  const handleConfirmRoleChange = () => {
    setShowConfirmModal(true)
  }

  const handleAcceptRoleChange = () => {
    setShowConfirmModal(false)
    setShowRoleChange(true)
  }

  const handleChangeRole = async () => {
    setError('')
    setChangingRole(true)

    try {
      if (pendingRole === 'company_owner') {
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
          role_changed: true,
        })
      } else {
        await updateProfile({
          role: 'individual',
          company_id: null,
          role_changed: true,
        })
      }

      await refreshProfile()
      setSuccess(true)
      setShowRoleChange(false)
      setPendingRole(null)
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

        {profile?.role !== 'employee' && !profile?.role_changed && (
          <button
            onClick={handleConfirmRoleChange}
            className="btn-ghost text-sm text-gold mt-3"
          >
            Cambiar a {profile?.role === 'individual' ? 'Empresa' : 'Persona'}
          </button>
        )}

        {showRoleChange && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {pendingRole === null ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">¿A qué rol quieres cambiar?</p>
                <button
                  onClick={() => setPendingRole('individual')}
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
                  onClick={() => setPendingRole('company_owner')}
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
                  onClick={() => { setShowRoleChange(false); setPendingRole(null) }}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : pendingRole === 'company_owner' && !company ? (
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
                  onClick={() => { setPendingRole(null); setNewCompanyName(''); setNewCompanyRate('') }}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Volver
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  {pendingRole === 'individual'
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
                  onClick={() => setPendingRole(null)}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
              Cambiar rol
            </h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              Esta accion solo se podra realizar <span className="font-semibold">1 vez</span>. 
              Una vez cambiado, no podras volver a cambiar tu rol.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 btn-ghost text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleAcceptRoleChange}
                className="flex-1 btn-primary"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
