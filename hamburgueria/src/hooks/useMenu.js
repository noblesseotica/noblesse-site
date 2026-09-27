import { useEffect, useState } from 'react'
import { isSupabaseConfigured, MENU_TABLE, supabase } from '../lib/supabase.js'
import { DEMO_MENU } from '../data/demoMenu.js'

/**
 * Busca o cardápio no Supabase. Sem variáveis de ambiente configuradas,
 * cai no cardápio de demonstração (útil para visualizar o layout localmente).
 */
export function useMenu() {
  const [state, setState] = useState({ items: [], loading: true, error: null, demo: false })

  useEffect(() => {
    let cancelled = false

    if (!isSupabaseConfigured) {
      setState({ items: DEMO_MENU, loading: false, error: null, demo: true })
      return
    }

    supabase
      .from(MENU_TABLE)
      .select('id, category, name, description, ingredients, price, image_url, available, sort_order, badge')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setState({ items: [], loading: false, error, demo: false })
        else setState({ items: data ?? [], loading: false, error: null, demo: false })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
