import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
  }

  return (
    <div className="spotlight grid min-h-screen place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-white/10 bg-coal p-8 shadow-2xl">
        <p className="eyebrow">Painel administrativo</p>
        <h1 className="mt-2 font-display text-5xl tracking-wide">Entrar</h1>
        <p className="mt-2 text-sm text-white/50">Acesso restrito à equipe da hamburgueria.</p>

        <label className="mt-8 block">
          <span className="label">E-mail</span>
          <input className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mt-4 block">
          <span className="label">Senha</span>
          <input className="field" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

        <button type="submit" disabled={loading} className="btn-gold mt-8 w-full py-3.5">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
        <a href="/" className="mt-6 block text-center text-sm text-white/40 hover:text-white">
          ← Voltar ao site
        </a>
      </form>
    </div>
  )
}
