import { createClient } from '@supabase/supabase-js'

// As chaves vêm de variáveis de ambiente (Netlify > Site configuration > Environment variables).
// Nunca coloque a URL/chave diretamente no código.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

export const MENU_TABLE = 'menu_items'
export const IMAGES_BUCKET = 'menu-images'
