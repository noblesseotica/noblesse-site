import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORIES } from '../../config/site.js'
import { deleteItem, fetchAllItems, setAvailability } from '../../lib/adminApi.js'
import { supabase } from '../../lib/supabase.js'
import { FALLBACK_IMAGE, formatPrice } from '../../lib/format.js'
import { EditIcon, PlusIcon, TrashIcon } from '../Icons.jsx'
import Logo from '../Logo.jsx'
import ItemForm from './ItemForm.jsx'

const catLabel = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-medium shadow-2xl ${toast.error ? 'bg-red-500 text-white' : 'bg-gold text-ink'}`}>
      {toast.text}
    </div>
  )
}

export default function AdminDashboard({ user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [toast, setToast] = useState(null)

  const notify = useCallback((text, error = false) => {
    setToast({ text, error })
    setTimeout(() => setToast(null), 2800)
  }, [])

  const load = useCallback(async () => {
    try {
      setItems(await fetchAllItems())
    } catch (err) {
      notify(err.message, true)
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => (filter === 'all' || i.category === filter) && (!q || i.name.toLowerCase().includes(q)))
  }, [items, filter, search])

  const toggle = async (item) => {
    const next = !item.available
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, available: next } : i))) // otimista
    try {
      await setAvailability(item.id, next)
      notify(next ? `${item.name} disponível` : `${item.name} marcado como esgotado`)
    } catch (err) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, available: !next } : i)))
      notify(err.message, true)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Excluir "${item.name}" do cardápio? Essa ação não pode ser desfeita.`)) return
    try {
      await deleteItem(item)
      setItems((list) => list.filter((i) => i.id !== item.id))
      notify('Item excluído')
    } catch (err) {
      notify(err.message, true)
    }
  }

  const onSaved = (saved) => {
    setItems((list) => {
      const exists = list.some((i) => i.id === saved.id)
      return exists ? list.map((i) => (i.id === saved.id ? saved : i)) : [...list, saved]
    })
    notify(editing === 'new' ? 'Item criado!' : 'Alterações salvas!')
    setEditing(null)
  }

  const stats = {
    total: items.length,
    available: items.filter((i) => i.available).length,
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-white/40 sm:inline">{user.email}</span>
            <a href="/" target="_blank" rel="noreferrer" className="hidden text-white/60 hover:text-gold sm:inline">
              Ver site ↗
            </a>
            <button type="button" onClick={() => supabase.auth.signOut()} className="rounded-full border border-white/10 px-4 py-2 text-white/70 hover:border-gold hover:text-gold">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Painel</p>
            <h1 className="font-display text-5xl tracking-wide">Cardápio</h1>
            <p className="text-sm text-white/45">
              {stats.total} itens · {stats.available} disponíveis · {stats.total - stats.available} esgotados
            </p>
          </div>
          <button type="button" onClick={() => setEditing('new')} className="btn-gold">
            <PlusIcon className="h-4 w-4" /> Adicionar novo item
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input className="field sm:max-w-xs" placeholder="Buscar pelo nome…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {[{ id: 'all', label: 'Todos' }, ...CATEGORIES].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${filter === c.id ? 'bg-gold text-ink' : 'border border-white/10 text-white/60 hover:text-white'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="py-20 text-center text-white/40">Carregando cardápio…</p>
        ) : visible.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/10 py-20 text-center text-white/40">
            Nenhum item encontrado.
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-coal">
            {visible.map((item) => (
              <li key={item.id} className={`flex items-center gap-4 p-4 transition hover:bg-white/[0.02] ${item.available ? '' : 'opacity-60'}`}>
                <img
                  src={item.image_url || FALLBACK_IMAGE}
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                  alt=""
                  loading="lazy"
                  className={`h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20 ${item.available ? '' : 'grayscale'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-white/40">
                    {catLabel[item.category]} · <span className="text-gold">{formatPrice(item.price)}</span>
                  </p>
                  {/* toggle rápido disponível / esgotado */}
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      item.available ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' : 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
                    }`}
                    aria-label={`Marcar ${item.name} como ${item.available ? 'esgotado' : 'disponível'}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${item.available ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {item.available ? 'Disponível' : 'Esgotado'}
                    <span className="font-normal opacity-60">· tocar para mudar</span>
                  </button>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setEditing(item)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 hover:border-gold hover:text-gold" aria-label={`Editar ${item.name}`}>
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(item)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 hover:border-red-400 hover:text-red-300" aria-label={`Excluir ${item.name}`}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {editing && <ItemForm item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
      <Toast toast={toast} />
    </div>
  )
}
