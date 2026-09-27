import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import AdminLogin from '../components/admin/AdminLogin.jsx'
import AdminDashboard from '../components/admin/AdminDashboard.jsx'

function Centered({ children }) {
  return <div className="spotlight grid min-h-screen place-items-center px-6 text-center">{children}</div>
}

export default function Admin() {
  const [session, setSession] = useState(undefined) // undefined = verificando
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    document.title = 'Painel — Cardápio'
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Confere se o usuário logado está na tabela admin_users
  useEffect(() => {
    if (!session) return setIsAdmin(null)
    supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => setIsAdmin(!error && Boolean(data)))
  }, [session])

  if (!isSupabaseConfigured) {
    return (
      <Centered>
        <div className="max-w-md">
          <h1 className="font-display text-4xl tracking-wide">Supabase não configurado</h1>
          <p className="mt-3 text-white/60">
            Defina <code className="text-gold">VITE_SUPABASE_URL</code> e <code className="text-gold">VITE_SUPABASE_ANON_KEY</code> nas
            variáveis de ambiente do Netlify (ou no arquivo <code>.env.local</code>) e publique novamente.
          </p>
        </div>
      </Centered>
    )
  }

  if (session === undefined || (session && isAdmin === null)) return <Centered><p className="text-white/40">Carregando…</p></Centered>
  if (!session) return <AdminLogin />

  if (!isAdmin) {
    return (
      <Centered>
        <div className="max-w-md">
          <h1 className="font-display text-4xl tracking-wide">Sem permissão</h1>
          <p className="mt-3 text-white/60">
            A conta <strong className="text-white">{session.user.email}</strong> não está cadastrada como administradora.
            Peça ao responsável técnico para adicioná-la na tabela <code className="text-gold">admin_users</code>.
          </p>
          <button type="button" onClick={() => supabase.auth.signOut()} className="btn-ghost mt-6">
            Sair
          </button>
        </div>
      </Centered>
    )
  }

  return <AdminDashboard user={session.user} />
}
