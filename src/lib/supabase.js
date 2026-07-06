import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, o configúralas en Netlify > Site settings > Environment variables.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
