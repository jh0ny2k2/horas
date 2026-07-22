import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatHours } from '../../lib/calculations'
import LoadingSpinner from '../ui/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

export default function EmployeeList() {
  const { company } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteRate, setInviteRate] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [newRate, setNewRate] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => { loadMembers() }, [company])

  const loadMembers = async () => {
    if (!company) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', company.id)
        .order('invited_at', { ascending: false })
      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvite = async (e) => {
    e.preventDefault()
    setInviteLoading(true)

    try {
      const { data, error } = await supabase
        .from('company_members')
        .insert({
          company_id: company.id,
          email: inviteName.trim().toLowerCase() || 'empleado',
          hourly_rate: Number(inviteRate) || company.default_rate || 0,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      setInviteSuccess(data)
      setInviteName('')
      setInviteRate('')
      await loadMembers()

      setTimeout(() => setInviteSuccess(null), 10000)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setInviteLoading(false)
    }
  }

  const getInviteUrl = (token) => {
    return `${window.location.origin}/join/${token}`
  }

  const handleCopyLink = (member) => {
    const url = getInviteUrl(member.invitation_token)
    navigator.clipboard.writeText(url)
    setCopiedId(member.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleShareLink = (member) => {
    const url = getInviteUrl(member.invitation_token)
    if (navigator.share) {
      navigator.share({
        title: `Únete a ${company?.name}`,
        text: `Te han invitado a registrar tus horas en ${company?.name}. Haz clic para unirte:`,
        url,
      })
    } else {
      handleCopyLink(member)
    }
  }

  const handleUpdateRate = async (memberId) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .update({ hourly_rate: Number(newRate) })
        .eq('id', memberId)
      if (error) throw error
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, hourly_rate: Number(newRate) } : m))
      setEditingMember(null)
      setNewRate('')
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleDeleteMember = async (memberId) => {
    if (!confirm('¿Eliminar esta invitación?')) return
    try {
      const { error } = await supabase.from('company_members').delete().eq('id', memberId)
      if (error) throw error
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  const statusLabels = { pending: 'Pendiente', accepted: 'Activo', rejected: 'Rechazado' }

  if (loading) return <LoadingSpinner text="Cargando empleados..." />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-1 text-sm text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver
        </button>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold/80 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Crear enlace
        </button>
      </div>

      <h2 className="text-lg font-semibold text-slate-700">Empleados</h2>

      {showCreate && (
        <div className="card animate-slide-up">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Crear enlace de invitación</h3>
          <form onSubmit={handleCreateInvite} className="space-y-3">
            <div>
              <label className="label">Nombre (opcional)</label>
              <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} className="input-field" placeholder="Ej: Carlos García" />
            </div>
            <div>
              <label className="label">Tarifa por hora ($)</label>
              <input type="number" min="0" step="0.01" value={inviteRate} onChange={e => setInviteRate(e.target.value)} className="input-field" placeholder={`Default: ${company?.default_rate || 0}`} />
            </div>
            <button type="submit" disabled={inviteLoading} className="btn-primary">
              {inviteLoading ? 'Creando...' : 'Crear enlace'}
            </button>
          </form>
        </div>
      )}

      {inviteSuccess && (
        <div className="card border-green-200 bg-green-50 animate-slide-up">
          <p className="text-sm font-medium text-green-700 mb-2">Enlace creado. Compártelo con el empleado:</p>
          <div className="flex items-center gap-2 bg-white rounded-xl p-2">
            <input readOnly value={getInviteUrl(inviteSuccess.invitation_token)} className="flex-1 text-xs text-slate-500 bg-transparent outline-none truncate" />
            <button onClick={() => { navigator.clipboard.writeText(getInviteUrl(inviteSuccess.invitation_token)); setCopiedId('new'); setTimeout(() => setCopiedId(null), 2000) }}
              className="px-3 py-1.5 bg-gold text-white text-xs font-medium rounded-lg hover:bg-gold/90 transition-colors flex-shrink-0">
              {copiedId === 'new' ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-slate-400 mb-2">No hay empleados aún</p>
          <p className="text-sm text-slate-400">Crea un enlace y compártelo con tu empleado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => (
            <div key={member.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gold">{(member.email || '?')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{member.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[member.status]}`}>{statusLabels[member.status]}</span>
                      <span className="text-xs text-slate-400">{new Date(member.invited_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {member.status === 'pending' && (
                <div className="bg-slate-50 rounded-xl p-2.5 mb-3">
                  <p className="text-xs text-slate-400 mb-1.5">Enlace de invitación:</p>
                  <div className="flex items-center gap-2">
                    <input readOnly value={getInviteUrl(member.invitation_token)} className="flex-1 text-[11px] text-slate-500 bg-white border border-slate-200 rounded-lg px-2 py-1.5 truncate" />
                    <button onClick={() => handleCopyLink(member)} className="px-2.5 py-1.5 bg-gold text-white text-xs font-medium rounded-lg hover:bg-gold/90 transition-colors flex-shrink-0">
                      {copiedId === member.id ? 'Copiado' : 'Copiar'}
                    </button>
                    <button onClick={() => handleShareLink(member)} className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  {editingMember === member.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" step="0.01" value={newRate} onChange={e => setNewRate(e.target.value)} className="w-24 bg-white/80 border border-slate-200 rounded-xl px-3 py-1.5 text-sm" autoFocus />
                      <button onClick={() => handleUpdateRate(member.id)} className="text-sm text-green-600 hover:text-green-700 font-medium">OK</button>
                      <button onClick={() => { setEditingMember(null); setNewRate('') }} className="text-sm text-slate-400">X</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingMember(member.id); setNewRate(member.hourly_rate || '') }} className="text-sm text-slate-600 hover:text-gold transition-colors">
                      ${Number(member.hourly_rate || 0).toFixed(2)}/hora
                    </button>
                  )}
                </div>
                <button onClick={() => handleDeleteMember(member.id)} className="text-slate-400 hover:text-red-400 transition-colors p-1" title="Eliminar">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
