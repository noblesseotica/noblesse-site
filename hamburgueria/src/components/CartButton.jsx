import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../lib/format.js'
import { BagIcon } from './Icons.jsx'

export default function CartButton() {
  const { count, total, bump, open } = useCart()

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Abrir carrinho (${count} ${count === 1 ? 'item' : 'itens'})`}
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 flex items-center gap-3 rounded-full bg-gold py-2 pl-2 pr-2 text-ink shadow-[0_15px_40px_-10px_rgb(245_197_24/0.8)] transition hover:bg-amber active:scale-95 sm:bottom-8 sm:right-8"
    >
      {/* key muda a cada item adicionado → reinicia a animação de "pulso" */}
      <span key={bump} className={`relative grid h-12 w-12 place-items-center rounded-full bg-ink text-gold ${bump ? 'animate-cart-pulse' : ''}`}>
        <BagIcon className="h-6 w-6" />
        <span
          className={`absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border-2 border-gold bg-white px-1 text-xs font-bold text-ink transition ${
            count ? 'scale-100' : 'scale-0'
          }`}
        >
          {count}
        </span>
      </span>
      {count > 0 && (
        <span className="pr-3 text-left leading-tight">
          <span className="block text-[0.65rem] font-semibold uppercase tracking-wider opacity-70">Ver pedido</span>
          <span className="block font-display text-xl tracking-wide">{formatPrice(total)}</span>
        </span>
      )}
    </button>
  )
}
