import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'

const STORAGE_KEY = 'ouro-negro:cart:v1'
const CartContext = createContext(null)

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.id && l.qty > 0) : []
  } catch {
    return []
  }
}

function reducer(lines, action) {
  switch (action.type) {
    case 'add': {
      const { item } = action
      const existing = lines.find((l) => l.id === item.id)
      if (existing) return lines.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l))
      return [
        ...lines,
        { id: item.id, name: item.name, price: Number(item.price), image_url: item.image_url, qty: 1, note: '' },
      ]
    }
    case 'qty':
      return lines
        .map((l) => (l.id === action.id ? { ...l, qty: Math.min(99, l.qty + action.delta) } : l))
        .filter((l) => l.qty > 0)
    case 'note':
      return lines.map((l) => (l.id === action.id ? { ...l, note: action.note.slice(0, 140) } : l))
    case 'remove':
      return lines.filter((l) => l.id !== action.id)
    case 'sync': {
      // Mantém preço/nome atualizados e remove itens que ficaram esgotados ou foram excluídos
      const byId = new Map(action.menu.map((m) => [m.id, m]))
      return lines
        .filter((l) => byId.get(l.id)?.available)
        .map((l) => {
          const m = byId.get(l.id)
          return { ...l, name: m.name, price: Number(m.price), image_url: m.image_url }
        })
    }
    case 'clear':
      return []
    default:
      return lines
  }
}

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, loadCart)
  const [isOpen, setOpen] = useState(false)
  const [bump, setBump] = useState(0) // muda a cada "adicionar" → dispara a animação do ícone

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* modo privado / armazenamento cheio: o carrinho continua funcionando em memória */
    }
  }, [lines])

  const add = useCallback((item) => {
    dispatch({ type: 'add', item })
    setBump((b) => b + 1)
  }, [])

  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])

  const value = useMemo(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0)
    const total = lines.reduce((sum, l) => sum + l.qty * l.price, 0)
    return {
      lines,
      count,
      total,
      bump,
      isOpen,
      open,
      close,
      add,
      increment: (id) => dispatch({ type: 'qty', id, delta: 1 }),
      decrement: (id) => dispatch({ type: 'qty', id, delta: -1 }),
      setNote: (id, note) => dispatch({ type: 'note', id, note }),
      remove: (id) => dispatch({ type: 'remove', id }),
      syncWithMenu: (menu) => dispatch({ type: 'sync', menu }),
      clear: () => dispatch({ type: 'clear' }),
    }
  }, [lines, bump, isOpen, add, open, close])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>')
  return ctx
}
