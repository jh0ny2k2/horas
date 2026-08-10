import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingSpinner from '../ui/LoadingSpinner'
import AuthShell from '../auth/AuthShell'

export default function JoinByLink() {
  const { token } = useParams()
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadInvitation()
  }, [token])

  useEffect(() => {
    if (user && invitation && !success) {
      handleAccept()
    }
  }, [user, invitation])

  const loadInvitation = async () => {
    if (!token) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_members')
        .select('*')
        .eq('invitation_token', token)
        .single()

      if (error || !data) {
        setNotFound(true)
        return
      }

      if (data.status === 'accepted') {
        setError('Esta invitación ya fue aceptada')
        return
      }

      if (data.status === 'rejected') {
        setError('Esta invitación fue rechazada')
        return
      }

      setInvitation(data)

      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', data.company_id)
        .single()

      setCompany(companyData)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invitation) return

    try {
      setJoining(true)
      setError('')

      const { error: updateError } = await supabase
        .from('company_members')
        .update({ status: 'accepted', user_id: user.id })
        .eq('id', invitation.id)

      if (updateError) throw updateError

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_id: invitation.company_id,
          role: 'employee',
          hourly_rate: invitation.hourly_rate,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      await refreshProfile()
      setSuccess(true)
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 1000)
    } catch (err) {
      setError(err.message || 'Error al unirse')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory dark:bg-slate-950 flex items-center justify-center">
        <LoadingSpinner text="Comprobando invitación..." />
      </div>
    )
  }

  if (notFound) {
    return (
      <AuthShell
        title="Invitación no válida"
        subtitle="Este enlace no existe o ya no está disponible."
        iconClassName="from-rose-500 to-red-600 shadow-rose-500/30 ring-rose-500/10"
        icon={
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
      >
        <button onClick={() => navigate('/')} className="btn-primary">
          Ir al inicio
        </button>
      </AuthShell>
    )
  }

  if (success) {
    return (
      <AuthShell
        title="¡Te uniste!"
        subtitle={`Ahora eres empleado de ${company?.name || 'la empresa'}`}
        iconClassName="from-emerald-500 to-teal-600 shadow-emerald-500/30 ring-emerald-500/10"
        icon={
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        }
      >
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center">
          Redirigiendo al inicio...
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Invitación"
      subtitle={`Te han invitado a unirte a ${company?.name || 'una empresa'}`}
      iconClassName="from-brand-500 to-accent-500 shadow-brand-500/30 ring-brand-500/10"
      icon={
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      }
    >
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl px-5 py-4 mb-4">
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        </div>
      )}

      {!error && invitation && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400 dark:text-slate-500">Tarifa horaria</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">€{Number(invitation.hourly_rate || 0).toFixed(2)}/hora</span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400 dark:text-slate-500">Invitado por</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{invitation.email}</span>
            </div>
          </div>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Inicia sesión o crea una cuenta para unirte
              </p>
              <button onClick={() => navigate(`/auth/login?join=${token}`)} className="btn-primary">
                Iniciar sesión
              </button>
              <button onClick={() => navigate(`/auth/register?join=${token}`)} className="btn-secondary">
                Crear cuenta
              </button>
            </div>
          ) : (
            <button onClick={handleAccept} disabled={joining} className="btn-primary">
              {joining ? 'Uniéndote...' : 'Unirme a la empresa'}
            </button>
          )}
        </div>
      )}
    </AuthShell>
  )
}
