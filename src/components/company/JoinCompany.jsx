import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import { useNavigate } from 'react-router-dom'

export default function JoinCompany() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)
  const [companyNames, setCompanyNames] = useState({})

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

      const names = {}
      for (const inv of data || []) {
        const { data: companyData } = await supabase
          .from('companies').select('name').eq('id', inv.company_id).single()
        names[inv.company_id] = companyData?.name || 'una empresa'
      }
      setCompanyNames(names)
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
      setAccepting(null)
    }
  }

  const handleReject = async (invitationId) => {
    try {
      setAccepting(invitationId)
      const { error } = await supabase
        .from('company_members')
        .update({ status: 'rejected', user_id: null })
        .eq('id', invitationId)

      if (error) throw error
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    } catch (err) {
      console.error('Error rejecting invitation:', err)
    } finally {
      setAccepting(null)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Buscando invitaciones..." />
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-1 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Invitaciones</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Únete a la empresa de tu empleador</p>
      </div>

      {invitations.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          title="Sin invitaciones"
          description="Cuando una empresa te invite, aparecerá aquí."
        />
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="card hover:shadow-premium-lg transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                    {companyNames[invitation.company_id] || 'una empresa'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Te han invitado a trabajar
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                    €{Number(invitation.hourly_rate || 0).toFixed(2)}/hora
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleAccept(invitation)}
                  disabled={accepting === invitation.id}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {accepting === invitation.id ? 'Aceptando...' : 'Aceptar'}
                </button>
                <button
                  onClick={() => handleReject(invitation.id)}
                  disabled={accepting === invitation.id}
                  className="flex-1 btn-secondary"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
