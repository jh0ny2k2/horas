import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

export default function JoinCompany() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)

  useEffect(() => {
    loadInvitations()
  }, [user])

  const loadInvitations = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_members')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'pending')

      if (error) throw error
      setInvitations(data || [])
    } catch (err) {
      console.error('Error loading invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (invitation) => {
    try {
      setAccepting(invitation.id)

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
      navigate('/')
    } catch (err) {
      console.error('Error accepting invitation:', err)
    } finally {
      setAccepting(null)
    }
  }

  const handleReject = async (invitationId) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .update({ status: 'rejected' })
        .eq('id', invitationId)

      if (error) throw error

      setInvitations(prev => prev.filter(i => i.id !== invitationId))
    } catch (err) {
      console.error('Error rejecting invitation:', err)
    }
  }

  if (loading) return <LoadingSpinner text="Cargando invitaciones..." />

  if (invitations.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <button
          onClick={() => navigate('/')}
          className="btn-ghost flex items-center gap-1 text-sm text-slate-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <div className="text-center py-12">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-400 mb-2">No tienes invitaciones pendientes</p>
          <p className="text-sm text-slate-400">
            Cuando una empresa te invite, aparecerá aquí
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={() => navigate('/')}
        className="btn-ghost flex items-center gap-1 text-sm text-slate-400"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      <h2 className="text-lg font-semibold text-slate-700">Invitaciones pendientes</h2>

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700">Invitación de empresa</h3>
                <p className="text-sm text-slate-400">
                  Te han invitado a trabajar
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Tarifa:</span> ${Number(invitation.hourly_rate || 0).toFixed(2)}/hora
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(invitation)}
                disabled={accepting === invitation.id}
                className="flex-1 btn-primary"
              >
                {accepting === invitation.id ? 'Aceptando...' : 'Aceptar'}
              </button>
              <button
                onClick={() => handleReject(invitation.id)}
                className="flex-1 btn-secondary"
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
