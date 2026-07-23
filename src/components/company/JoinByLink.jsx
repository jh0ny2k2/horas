import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function JoinByLink() {
  const { token } = useParams()
  const { user, profile, refreshProfile } = useAuth()
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
    } catch (err) {
      console.error('Error:', err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!user || !invitation) return

    try {
      setJoining(true)
      setError('')

      const { error: updateError } = await supabase
        .from('company_members')
        .update({ status: 'accepted', user_id: user.id, email: user.email })
        .eq('id', invitation.id)

      if (updateError) throw updateError

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          company_id: invitation.company_id,
          role: 'employee',
          hourly_rate: invitation.hourly_rate,
          full_name: user.email?.split('@')[0] || '',
        }, { onConflict: 'id' })

      if (profileError) throw profileError

      await refreshProfile()
      setSuccess(true)

      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setError(err.message || 'Error al unirse a la empresa')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-6">
        <LoadingSpinner text="Verificando invitación..." />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col px-6 py-12 animate-fade-in">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-50 mx-auto mb-5 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Invitación no encontrada</h2>
          <p className="text-sm text-slate-400 mb-6">Este enlace no es válido o ya expiró.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Ir al inicio</button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col px-6 py-12 animate-fade-in">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full text-center">
          <div className="w-16 h-16 rounded-3xl bg-green-50 mx-auto mb-5 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">¡Te uniste!</h2>
          <p className="text-sm text-slate-400 mb-6">
            Ahora eres empleado de <strong className="text-slate-600">{company?.name}</strong>
          </p>
          <p className="text-xs text-slate-400">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col px-6 py-12 animate-fade-in">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gold to-gold-light mx-auto mb-5 flex items-center justify-center shadow-lg shadow-gold/20">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Invitación</h1>
        <p className="text-slate-400 text-sm mb-1">
          Te han invitado a unirte a
        </p>
        <p className="text-lg font-semibold text-gold mb-6">{company?.name || 'una empresa'}</p>

        {invitation && (
          <div className="bg-white/80 rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Tarifa horaria</span>
              <span className="text-sm font-semibold text-slate-700">€{Number(invitation.hourly_rate || 0).toFixed(2)}/hora</span>
            </div>
            <div className="border-t border-slate-100 my-1"></div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Invitado por</span>
              <span className="text-sm font-medium text-slate-700">{invitation.email}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>
        )}

        {!user ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Inicia sesión o crea una cuenta para unirte</p>
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
    </div>
  )
}
