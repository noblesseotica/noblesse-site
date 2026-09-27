import { useEffect, useRef, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { FALLBACK_IMAGE, formatPrice, sizedImage } from '../lib/format.js'
import { BagIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from './Icons.jsx'
import Checkout from './Checkout.jsx'

function CartLine({ line }) {
  const { increment, decrement, setNote, remove } = useCart()
  const [showNote, setShowNote] = useState(Boolean(line.note))

  return (
    <li className="flex gap-4 border-b border-white/5 py-5">
      <img
        src={sizedImage(line.image_url, 200)}
        onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
        alt=""
        loading="lazy"
        className="h-20 w-20 shrink-0 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-2xl leading-none tracking-wide">{line.name}</p>
          <button
            type="button"
            onClick={() => remove(line.id)}
            className="-mr-1 -mt-1 flex items-center gap-1 rounded-full px-2 py-1 text-xs text-white/40 transition hover:bg-red-500/10 hover:text-red-300"
            aria-label={`Remover ${line.name}`}
          >
            <TrashIcon className="h-3.5 w-3.5" /> Remover
          </button>
        </div>
        <p className="mt-1 text-xs text-white/40">{formatPrice(line.price)} cada</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center rounded-full border border-white/10">
            <button type="button" onClick={() => decrement(line.id)} className="grid h-9 w-9 place-items-center text-white/70 hover:text-gold" aria-label="Diminuir quantidade">
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
              {line.qty}
            </span>
            <button type="button" onClick={() => increment(line.id)} className="grid h-9 w-9 place-items-center text-white/70 hover:text-gold" aria-label="Aumentar quantidade">
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="font-display text-2xl tracking-wide text-gold">{formatPrice(line.qty * line.price)}</p>
        </div>

        {showNote ? (
          <input
            type="text"
            value={line.note}
            onChange={(e) => setNote(line.id, e.target.value)}
            placeholder='Observação: ex. "sem cebola", "ponto mal passado"'
            maxLength={140}
            autoFocus={!line.note}
            className="field mt-3 py-2 text-sm"
          />
        ) : (
          <button type="button" onClick={() => setShowNote(true)} className="mt-3 text-xs font-medium text-gold/80 hover:text-gold">
            + Adicionar observação
          </button>
        )}
      </div>
    </li>
  )
}

export default function CartDrawer() {
  const { isOpen, close, lines, total, count } = useCart()
  const [view, setView] = useState('cart') // 'cart' | 'checkout'
  const panelRef = useRef(null)

  // trava o scroll da página, fecha no ESC e volta para a view do carrinho ao reabrir
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  useEffect(() => {
    if (!isOpen) setTimeout(() => setView('cart'), 400)
  }, [isOpen])

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`} inert={!isOpen}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-coal shadow-2xl outline-none transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="spotlight pointer-events-none absolute inset-x-0 top-0 h-60" />
        <header className="relative flex items-center justify-between border-b border-white/5 px-6 py-5">
          <div>
            <p className="eyebrow">{view === 'cart' ? 'Seu pedido' : 'Finalizar pedido'}</p>
            <h2 className="font-display text-3xl tracking-wide">
              {view === 'cart' ? `${count} ${count === 1 ? 'item' : 'itens'}` : 'Seus dados'}
            </h2>
          </div>
          <button type="button" onClick={close} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white/70 transition hover:rotate-90 hover:border-gold hover:text-gold" aria-label="Fechar carrinho">
            <CloseIcon />
          </button>
        </header>

        {view === 'checkout' ? (
          <Checkout onBack={() => setView('cart')} />
        ) : lines.length === 0 ? (
          <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="mb-6 grid h-24 w-24 place-items-center rounded-full border border-dashed border-gold/40 text-gold/70">
              <BagIcon className="h-10 w-10" />
            </div>
            <p className="font-display text-3xl tracking-wide">Carrinho vazio</p>
            <p className="mt-2 text-sm text-white/50">Que tal começar por um Smash Ouro?</p>
            <a href="#cardapio" onClick={close} className="btn-gold mt-8">
              Ver cardápio
            </a>
          </div>
        ) : (
          <>
            <ul className="relative flex-1 overflow-y-auto overscroll-contain px-6">
              {lines.map((l) => (
                <CartLine key={l.id} line={l} />
              ))}
            </ul>
            <footer className="relative border-t border-white/10 bg-ink/60 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
              <div className="mb-4 flex items-end justify-between">
                <span className="text-sm uppercase tracking-widest text-white/50">Total</span>
                <span className="font-display text-4xl tracking-wide text-gold">{formatPrice(total)}</span>
              </div>
              <button type="button" onClick={() => setView('checkout')} className="btn-gold w-full py-4 text-base">
                Finalizar Pedido
              </button>
              <p className="mt-3 text-center text-xs text-white/35">Taxa de entrega informada pelo atendente no WhatsApp.</p>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
