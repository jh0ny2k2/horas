import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import PaymentDetailModal from './PaymentDetailModal'

export default function Payments() {
  const { user, profile, company } = useAuth()
  const isOwner = profile?.role === 'company_owner'
  const isEmployee = profile?.role === 'employee'
  const canManage = !isEmployee
  const [payments, setPayments] = useState([])
  const [workers, setWorkers] = useState([])
  const [selectedWorker, setSelectedWorker] = useState('')
  const [showWorkerSelect, setShowWorkerSelect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [viewingPayment, setViewingPayment] = useState(null)
  const [editingPayment, setEditingPayment] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (!user) return
    loadPayments()
  }, [user, company])

  useEffect(() => {
    if (isOwner && company) {
      loadWorkers()
    }
  }, [isOwner, company])

  const loadWorkers = async () => {
    try {
      const { data: members } = await supabase
        .from('company_members')
        .select('user_id')
        .eq('company_id', company.id)
        .eq('status', 'accepted')

      const ids = (members || []).map(m => m.user_id).filter(Boolean)

      if (!ids.length) {
        setWorkers([])
        setSelectedWorker('')
        return
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', ids)

      const workerList = (profilesData || []).map(p => ({
        id: p.id,
        full_name: p.full_name || 'Trabajador',
      }))

      setWorkers(workerList)
      setSelectedWorker(prev => (workerList.some(w => w.id === prev) ? prev : (workerList[0]?.id || '')))
    } catch {
      setWorkers([])
      setSelectedWorker('')
    }
  }

  const loadPayments = async () => {
    try {
      setLoading(true)
      let query = supabase.from('payments').select('*')
      query = isOwner && company
        ? query.eq('company_id', company.id)
        : query.eq('user_id', user.id)
      const { data, error } = await query.order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    if (isOwner && !selectedWorker) return

    try {
      setSaving(true)

      const payload = {
        user_id: isOwner ? selectedWorker : user.id,
        company_id: profile?.company_id || null,
        amount: Number(amount),
        description: description || null,
        payment_date: paymentDate,
      }

      if (editingPayment) {
        const { error } = await supabase
          .from('payments')
          .update(payload)
          .eq('id', editingPayment.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('payments')
          .insert(payload)

        if (error) throw error
      }

      setAmount('')
      setDescription('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setShowForm(false)
      setEditingPayment(null)
      await loadPayments()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (payment) => {
    setViewingPayment(null)
    setEditingPayment(payment)
    setAmount(String(payment.amount))
    setDescription(payment.description || '')
    setPaymentDate(payment.payment_date)
    if (isOwner) setSelectedWorker(payment.user_id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingPayment(null)
    setAmount('')
    setDescription('')
    setPaymentDate(new Date().toISOString().split('T')[0])
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', deleteConfirm.id)

      if (error) throw error
      setDeleteConfirm(null)
      await loadPayments()
    } catch (err) {
      console.error('Error:', err)
      setDeleteConfirm(null)
    }
  }

  const now = new Date()
  const filteredPayments = payments.filter(p => {
    if (filter === 'month') {
      const pDate = new Date(p.payment_date)
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear()
    }
    if (filter === 'year') {
      const pDate = new Date(p.payment_date)
      return pDate.getFullYear() === now.getFullYear()
    }
    return true
  })

  const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  const monthTotal = payments
    .filter(p => {
      const d = new Date(p.payment_date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const yearTotal = payments
    .filter(p => new Date(p.payment_date).getFullYear() === now.getFullYear())
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const workerNames = Object.fromEntries(workers.map(w => [w.id, w.full_name]))
  const selectedWorkerInfo = workers.find(w => w.id === selectedWorker) || null

  if (loading) return <LoadingSpinner text={isOwner ? 'Cargando pagos...' : 'Cargando cobros...'} />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{isOwner ? 'Pagos' : 'Cobros'}</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {isOwner ? 'Gestiona los pagos a tus trabajadores' : 'Gestiona tus pagos recibidos'}
          </p>
        </div>
        <button
          onClick={() => showForm ? handleCancelForm() : setShowForm(true)}
          className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
            showForm
              ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm ? 'Cancelar' : 'Añadir'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'month', label: 'Este mes' },
          { key: 'year', label: 'Este año' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`chip ${filter === f.key ? 'chip-active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-xl shadow-emerald-600/25 animate-fade-in">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{isOwner ? 'Pagado' : 'Cobrado'}</p>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white whitespace-nowrap">
              {filteredPayments.length} {filteredPayments.length === 1 ? (isOwner ? 'pago' : 'cobro') : (isOwner ? 'pagos' : 'cobros')}
            </span>
          </div>
          <p className="text-4xl font-extrabold text-white mt-2 tabular-nums">
            €{totalAmount.toFixed(2)}
          </p>
          <p className="text-[11px] text-white/60 mt-1">
            {filter === 'month' ? (isOwner ? 'Pagado este mes' : 'Cobrado este mes')
              : filter === 'year' ? (isOwner ? 'Pagado este año' : 'Cobrado este año')
              : (isOwner ? 'Total pagado' : 'Total cobrado')}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-white/15">
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Este mes</p>
              <p className="text-white font-bold tabular-nums">€{monthTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Este año</p>
              <p className="text-white font-bold tabular-nums">€{yearTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add payment form */}
      {showForm && (
        <div className="card animate-slide-up border-emerald-200/40 dark:border-emerald-500/20">
          <form onSubmit={handleAdd} className="space-y-4">
            {isOwner && (
              <div>
                <label className="label">Trabajador</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowWorkerSelect(!showWorkerSelect)}
                    disabled={workers.length === 0}
                    className="input-field flex items-center justify-between gap-2 text-left disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      {selectedWorkerInfo ? (
                        <>
                          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">{selectedWorkerInfo.full_name[0].toUpperCase()}</span>
                          </span>
                          <span className="truncate text-slate-800 dark:text-slate-100 font-medium">
                            {selectedWorkerInfo.full_name}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          {workers.length === 0 ? 'Sin trabajadores disponibles' : 'Selecciona un trabajador'}
                        </span>
                      )}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${showWorkerSelect ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showWorkerSelect && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowWorkerSelect(false)} />
                      <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-premium-lg overflow-hidden animate-scale-in">
                        <div className="max-h-56 overflow-y-auto p-1.5">
                          {workers.map((w) => (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => { setSelectedWorker(w.id); setShowWorkerSelect(false) }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                selectedWorker === w.id
                                  ? 'bg-brand-50 dark:bg-brand-500/15'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white">{w.full_name[0].toUpperCase()}</span>
                              </span>
                              <span className={`flex-1 truncate text-sm ${selectedWorker === w.id ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                {w.full_name}
                              </span>
                              {selectedWorker === w.id && (
                                <svg className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {workers.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    No hay trabajadores aceptados en tu empresa. Añade empleados primero.
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="label">Importe (€)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                placeholder="0.00"
                required
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {[50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`chip !px-3 !py-1.5 text-xs ${Number(amount) === val ? 'chip-active' : ''}`}
                  >
                    {val} €
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Concepto</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                placeholder="Ej: Pago quincenal, extras..."
              />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="input-field"
              />
            </div>
            <button type="submit" disabled={saving || !amount || (isOwner && !selectedWorker)} className="btn-primary w-full">
              {saving ? 'Guardando...' : editingPayment ? 'Guardar cambios' : (isOwner ? 'Registrar pago' : 'Registrar cobro')}
            </button>
          </form>
        </div>
      )}

      {/* Payments list */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title={isOwner ? 'No hay pagos registrados' : 'No hay cobros registrados'}
          description={isOwner
            ? 'Registra el primer pago a un trabajador para llevar el seguimiento.'
            : 'Registra tu primer cobro para llevar un seguimiento.'}
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                onClick={() => setViewingPayment(payment)}
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {payment.description || (isOwner ? 'Pago a trabajador' : 'Cobro registrado')}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {isOwner && workerNames[payment.user_id] && (
                      <span className="text-slate-500 dark:text-slate-400">para {workerNames[payment.user_id]} · </span>
                    )}
                    {formatPaymentDate(payment.payment_date)}
                  </p>
                </div>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums flex-shrink-0">
                  +€{Number(payment.amount).toFixed(2)}
                </p>
                <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail modal */}
      <PaymentDetailModal
        payment={viewingPayment}
        workerName={workerNames[viewingPayment?.user_id]}
        isOwner={isOwner}
        onClose={() => setViewingPayment(null)}
        onEdit={canManage ? handleEdit : null}
        onDelete={canManage ? (p) => { setViewingPayment(null); setDeleteConfirm(p) } : null}
      />

      {/* Delete confirmation modal */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-premium-lg animate-scale-in border border-slate-200/60 dark:border-slate-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Eliminar {isOwner ? 'pago' : 'cobro'}</h3>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  ¿Eliminar {isOwner ? 'el pago' : 'el cobro'} del <strong className="text-slate-700 dark:text-slate-200">{deleteConfirm.payment_date}</strong>?
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="btn-primary flex-1 !bg-gradient-to-r !from-rose-500 !to-red-500 !shadow-rose-500/25"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function formatPaymentDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'

  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
