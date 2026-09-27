import { useRef, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { FALLBACK_IMAGE, formatPrice, sizedImage } from '../lib/format.js'
import { CheckIcon, PlusIcon } from './Icons.jsx'

export default function ProductCard({ item, featured = false }) {
  const { add } = useCart()
  const cardRef = useRef(null)
  const [added, setAdded] = useState(false)
  const soldOut = !item.available

  // Inclinação 3D leve seguindo o mouse (só em dispositivos com hover real)
  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || !cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    cardRef.current.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-6px)`
    cardRef.current.style.setProperty('--glow-x', `${(x + 0.5) * 100}%`)
    cardRef.current.style.setProperty('--glow-y', `${(y + 0.5) * 100}%`)
  }
  const onLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = ''
  }

  const handleAdd = () => {
    if (soldOut) return
    add(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 1300)
  }

  return (
    <article
      ref={cardRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`group relative flex h-full overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-smoke to-coal
        transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform
        hover:border-gold/40 hover:shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9),0_0_50px_-12px_rgb(245_197_24/0.45)]
        ${featured ? 'flex-col lg:flex-row' : 'flex-col'} ${soldOut ? 'opacity-60' : ''}`}
    >
      {/* brilho dourado que segue o cursor */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(400px circle at var(--glow-x,50%) var(--glow-y,0%), rgb(245 197 24 / 0.08), transparent 45%)' }}
      />

      <div className={`relative overflow-hidden ${featured ? 'aspect-[4/3] lg:aspect-auto lg:w-[55%]' : 'aspect-[4/3]'}`}>
        <img
          src={sizedImage(item.image_url, featured ? 1100 : 700)}
          alt={item.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE
          }}
          className={`h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110 ${soldOut ? 'grayscale' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-coal via-transparent to-transparent" />
        {item.badge && !soldOut && (
          <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-ink shadow-lg">
            {item.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-ink/80 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-white backdrop-blur">
            Esgotado
          </span>
        )}
      </div>

      <div className={`relative z-20 flex flex-1 flex-col p-5 sm:p-6 ${featured ? 'lg:justify-center lg:p-10' : ''}`}>
        <h3 className={`font-display tracking-wide text-white ${featured ? 'text-4xl lg:text-5xl' : 'text-[2rem] leading-none'}`}>
          {item.name}
        </h3>
        <p className={`mt-3 leading-relaxed text-white/60 ${featured ? 'text-base' : 'text-sm'}`}>{item.description}</p>

        {item.ingredients?.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Ingredientes">
            {item.ingredients.map((ing) => (
              <li key={ing} className="rounded-full border border-white/10 px-2.5 py-1 text-[0.7rem] text-white/55">
                {ing}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <p className="leading-none">
            <span className="block text-[0.65rem] uppercase tracking-[0.25em] text-white/40">Preço</span>
            <span className="font-display text-4xl tracking-wide text-gold">{formatPrice(item.price)}</span>
          </p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            aria-label={soldOut ? `${item.name} esgotado` : `Adicionar ${item.name} ao carrinho`}
            className={`btn-gold min-w-[9.5rem] px-5 py-3 text-sm ${added ? '!bg-white' : ''}`}
          >
            {soldOut ? (
              'Esgotado'
            ) : added ? (
              <>
                <CheckIcon className="h-4 w-4" /> Adicionado
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4" /> Adicionar
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
