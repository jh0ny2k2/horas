import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import ErrorMessage from '../ui/ErrorMessage'

export default function Settings() {
  const { user, profile, company, updateProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.full_name || '')
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

  const handleSaveName = async () => {
    setError('')
    setLoading(true)

    try {
      if (!fullName.trim()) {
        setError('El nombre no puede estar vacío')
        setLoading(false)
        return
      }
      await updateProfile({ full_name: fullName.trim() })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

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

  const roleLabel = profile?.role === 'individual'
    ? 'Persona'
    : profile?.role === 'company_owner'
      ? 'Empresa'
      : 'Empleado'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <button
          onClick={() => navigate('/')}
          className="btn-ghost flex items-center gap-1 text-sm mb-3 -ml-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ajustes</h2>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm p-3 rounded-xl animate-fade-in">
          Guardado correctamente
        </div>
      )}

      {/* Nombre de usuario */}
      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
          Perfil
        </h3>
        <div className="card">
          <label className="label" htmlFor="full_name">Nombre</label>
          <input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field"
            placeholder="Tu nombre"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Es el nombre que verán los demás usuarios
          </p>
          <button
            onClick={handleSaveName}
            disabled={loading}
            className="btn-primary mt-4"
          >
            {loading ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </div>
      </section>

      {/* Tarifa horaria */}
      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
          Tarifa horaria
        </h3>
        <div className="card">
          <label className="label" htmlFor="hourly_rate">Tu tarifa</label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-400 dark:text-slate-500">€</span>
            <input
              id="hourly_rate"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="input-field flex-1"
              placeholder="0.00"
            />
            <span className="text-sm text-slate-400 dark:text-slate-500 flex-shrink-0">/hora</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Se usa para calcular tus ganancias
          </p>
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="btn-primary mt-4"
          >
            {loading ? 'Guardando...' : 'Guardar tarifa'}
          </button>
        </div>
      </section>

      {/* Empresa */}
      {profile?.role === 'company_owner' && company && (
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
            Empresa
          </h3>
          <div className="card">
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="company_name">Nombre de la empresa</label>
                <input
                  id="company_name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field"
                  placeholder="Nombre de tu empresa"
                />
              </div>

              <div>
                <label className="label" htmlFor="default_rate">Tarifa default para empleados (€/h)</label>
                <input
                  id="default_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  className="input-field"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
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
        </section>
      )}

      {/* Cuenta */}
      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
          Cuenta
        </h3>
        <div className="card">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600 dark:text-slate-300">Correo</span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate ml-3">{user?.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600 dark:text-slate-300">Rol actual</span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{roleLabel}</span>
            </div>
          </div>

          {profile?.role !== 'employee' && !profile?.role_changed && (
            <button
              onClick={handleConfirmRoleChange}
              className="w-full flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-left"
            >
              <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                Cambiar a {profile?.role === 'individual' ? 'Empresa' : 'Persona'}
              </span>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {showRoleChange && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {pendingRole === null ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">¿A qué rol quieres cambiar?</p>
                  <button
                    onClick={() => setPendingRole('individual')}
                    className="card w-full text-left hover:border-brand-300 dark:hover:border-brand-500/40 transition-all !py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/15 flex items-center justify-center">
                        <svg className="w-5 h-5 text-sky-500 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-700 dark:text-slate-200">Soy persona</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Registrar mis horas de trabajo</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPendingRole('company_owner')}
                    className="card w-full text-left hover:border-brand-300 dark:hover:border-brand-500/40 transition-all !py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center">
                        <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-700 dark:text-slate-200">Soy empresa</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Gestionar horas de mis empleados</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowRoleChange(false); setPendingRole(null) }}
                    className="w-full text-center text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : pendingRole === 'company_owner' && !company ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Crea tu empresa</p>
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
                    className="w-full text-center text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Volver
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
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
                    className="w-full text-center text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Volver
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {showConfirmModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full animate-scale-in border border-slate-200/60 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-2">
              Cambiar rol
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
              Esta accion solo se podra realizar <span className="font-semibold">1 vez</span>.
              Una vez cambiado, no podras volver a cambiar tu rol.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 btn-ghost text-slate-600 dark:text-slate-300"
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
        </div>,
        document.body
      )}
    </div>
  )
}
