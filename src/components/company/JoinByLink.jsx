import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingSpinner from '../ui/LoadingSpinner'

function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 mb-9">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">Workora</span>
    </div>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-ivory dark:bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-brand-400/15 dark:bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-28 w-80 h-80 rounded-full bg-accent-400/15 dark:bg-accent-500/10 blur-3xl pointer-events-none" />
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-10 relative">
        <Logo />
        {children}
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center text-brand-600 dark:text-brand-400">
          {icon}
        </span>
        <span className="text-sm text-slate-400 dark:text-slate-500">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  )
}

export default function JoinByLink() {
  const { token } = useParams()
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState(null)
  const [company, setCompany] = useState(null)
  const [ownerName, setOwnerName] = useState('')
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
      setError('')

      let inv = null
      let companyName = ''
      let ownerName = ''

      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_invitation_by_token', { p_token: token })

      if (!rpcError && rpcData && rpcData.length > 0) {
        inv = rpcData[0]
        companyName = inv.company_name || ''
        ownerName = inv.owner_name || inv.owner_email || ''
      } else {
        const { data: memberData, error: memberError } = await supabase
          .from('company_members')
          .select('*')
          .eq('invitation_token', token)
          .single()

        if (memberError || !memberData) {
          setNotFound(true)
          return
        }

        inv = memberData

        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', inv.company_id)
          .single()

        companyName = companyData?.name || ''
      }

      if (inv.status === 'accepted') {
        setError('Esta invitación ya fue aceptada')
        return
      }

      if (inv.status === 'rejected') {
        setError('Esta invitación fue rechazada')
        return
      }

      setInvitation(inv)
      setCompany(companyName ? { name: companyName } : null)
      setOwnerName(ownerName)
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

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      const profileFields = {
        company_id: invitation.company_id,
        role: 'employee',
        hourly_rate: invitation.hourly_rate,
      }

      if (!existingProfile) {
        profileFields.full_name = user.email?.split('@')[0] || ''
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...profileFields }, { onConflict: 'id' })

      if (profileError) throw profileError

      await refreshProfile()
      setSuccess(true)
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 1200)
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
      <Shell>
        <div className="card-premium animate-scale-in text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 mx-auto mb-5 flex items-center justify-center shadow-xl shadow-rose-500/30 ring-4 ring-rose-500/10">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Invitación no válida</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            Este enlace no existe o ya no está disponible.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary mt-7">
            Ir al inicio
          </button>
        </div>
      </Shell>
    )
  }

  if (success) {
    return (
      <Shell>
        <div className="card-premium animate-scale-in text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto mb-5 flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-500/10">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">
            ¡Te uniste a {company?.name || 'la empresa'}!
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            Ya puedes registrar tus horas de trabajo.
          </p>
          <div className="flex items-center justify-center gap-2 mt-7 text-sm text-slate-400 dark:text-slate-500">
            <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            Redirigiendo...
          </div>
        </div>
      </Shell>
    )
  }

  const companyInitial = (company?.name || '?')[0].toUpperCase()
  const hourlyRate = Number(invitation?.hourly_rate || 0).toFixed(2)

  return (
    <Shell>
      <div className="card-premium animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-[1.6rem] bg-gradient-to-br from-brand-500 to-accent-600 mx-auto mb-5 flex items-center justify-center shadow-xl shadow-brand-600/30 ring-4 ring-brand-500/10">
            <span className="text-3xl font-extrabold text-white">{companyInitial}</span>
          </div>
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-brand-600 dark:text-brand-400">
            Invitación de trabajo
          </p>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5">
            {company?.name}
          </h1>
          {ownerName && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Te invita <span className="font-semibold text-slate-700 dark:text-slate-200">{ownerName}</span>
            </p>
          )}
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 mb-5" />

        <div className="space-y-4 mb-6">
          <DetailRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Tarifa horaria"
            value={`€${hourlyRate}/hora`}
          />
          <DetailRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            label="Empresa"
            value={company?.name}
          />
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl px-5 py-4 mb-5">
            <p className="text-sm text-rose-600 dark:text-rose-400 text-center">{error}</p>
          </div>
        )}

        {!error && !user && (
          <div className="space-y-3">
            <button onClick={() => navigate(`/auth/login?join=${token}`)} className="btn-primary">
              Iniciar sesión y aceptar
            </button>
            <button onClick={() => navigate(`/auth/register?join=${token}`)} className="btn-secondary">
              Crear cuenta
            </button>
          </div>
        )}

        {!error && user && (
          <button onClick={handleAccept} disabled={joining} className="btn-primary">
            {joining ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uniéndote...
              </span>
            ) : 'Unirme a la empresa'}
          </button>
        )}
      </div>
    </Shell>
  )
}
