import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'

export default function Payments() {
  const { user, profile } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadPayments()
  }, [user])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false })

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

    try {
      setSaving(true)
      const { error } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          company_id: profile?.company_id || null,
          amount: Number(amount),
          description: description || null,
          payment_date: paymentDate,
        })

      if (error) throw error

      setAmount('')
      setDescription('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setShowForm(false)
      await loadPayments()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSaving(false)
    }
  }

  const filteredPayments = payments.filter(p => {
    if (filter === 'month') {
      const now = new Date()
      const pDate = new Date(p.payment_date)
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear()
    }
    if (filter === 'year') {
      const now = new Date()
      const pDate = new Date(p.payment_date)
      return pDate.getFullYear() === now.getFullYear()
    }
    return true
  })

  const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  if (loading) return <LoadingSpinner text="Cargando cobros..." />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-700">Cobros</h2>
          <p className="text-sm text-slate-400 mt-1">Gestiona tus pagos recibidos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gold text-white p-2 rounded-xl shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
        </button>
      </div>

      {/* Add payment form */}
      {showForm && (
        <div className="card animate-slide-up">
          <form onSubmit={handleAdd} className="space-y-3">
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
            <button type="submit" disabled={saving || !amount} className="btn-primary w-full">
              {saving ? 'Guardando...' : 'Registrar cobro'}
            </button>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'month', label: 'Este mes' },
          { key: 'year', label: 'Este año' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.key
                ? 'bg-gold text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary card */}
      <div className="card bg-gradient-to-r from-gold/5 to-brand-50 border-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-gold mt-1 tabular-nums">€{totalAmount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Registros</p>
            <p className="text-2xl font-bold text-slate-700 mt-1 tabular-nums">{filteredPayments.length}</p>
          </div>
        </div>
      </div>

      {/* Payments list */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="No hay cobros registrados"
          description="Registra tu primer cobro para llevar un seguimiento."
        />
      ) : (
        <div className="space-y-2">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {payment.description || 'Cobro registrado'}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(payment.payment_date + 'T12:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <p className="text-lg font-bold text-green-600 tabular-nums">
                +€{Number(payment.amount).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
