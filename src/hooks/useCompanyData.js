import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export default function useCompanyData(company) {
  const [employees, setEmployees] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!company) return
    setLoading(true)
    try {
      const { data: members } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'accepted')

      const employeeUserIds = (members || []).map(m => m.user_id).filter(Boolean)

      let employeeShifts = []
      if (employeeUserIds.length > 0) {
        const { data: shiftsData } = await supabase
          .from('work_shifts')
          .select('*')
          .in('user_id', employeeUserIds)
          .order('work_date', { ascending: false })
          .order('start_time', { ascending: false })

        employeeShifts = shiftsData || []
      }

      setEmployees(members || [])
      setShifts(employeeShifts)
    } catch (err) {
      console.error('Error loading company data:', err)
    } finally {
      setLoading(false)
    }
  }, [company])

  useEffect(() => {
    load()
  }, [load])

  return { employees, shifts, loading, reload: load }
}
