import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setCompany(null)
      return
    }

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setProfile(profileData)

      if (profileData?.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .single()

        setCompany(companyData)
      } else {
        setCompany(null)
      }
    } catch {
      setProfile(null)
      setCompany(null)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const u = session?.user ?? null
      if (u && !u.email_confirmed_at) {
        supabase.auth.signOut()
        setUser(null)
        setLoading(false)
      } else {
        setUser(u)
        if (u) {
          loadProfile(u.id).finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      const u = session?.user ?? null
      if (u && !u.email_confirmed_at) {
        supabase.auth.signOut()
        setUser(null)
      } else {
        setUser(u)
        if (u) {
          loadProfile(u.id)
        } else {
          setProfile(null)
          setCompany(null)
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      throw new Error('Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.')
    }

    return data
  }

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
    setCompany(null)
  }

  const createProfile = async (role, companyName = null, hourlyRate = 0) => {
    if (!user) throw new Error('No hay usuario autenticado')

    const profileData = {
      id: user.id,
      role,
      hourly_rate: hourlyRate,
      full_name: user.email?.split('@')[0] || '',
    }

    if (role === 'company_owner' && companyName) {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({ owner_id: user.id, name: companyName, default_rate: hourlyRate })
        .select()
        .single()

      if (companyError) throw companyError
      profileData.company_id = newCompany.id
      setCompany(newCompany)
    }

    const { error } = await supabase
      .from('profiles')
      .insert(profileData)

    if (error) throw error

    setProfile({ ...profileData, role })
    return profileData
  }

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No hay usuario autenticado')

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error

    setProfile(prev => ({ ...prev, ...updates }))

    if (updates.hourly_rate !== undefined && company) {
      setCompany(prev => ({ ...prev, default_rate: updates.hourly_rate }))
    }
  }

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id)
    }
  }, [user, loadProfile])

  return (
    <AuthContext.Provider value={{
      user, session, loading, profile, company,
      signUp, signIn, signInWithGoogle, signOut,
      createProfile, updateProfile, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
