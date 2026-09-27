import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES } from '../config/site.js'
import { useMenu } from '../hooks/useMenu.js'
import { useCart } from '../context/CartContext.jsx'
import ProductCard from './ProductCard.jsx'
import Reveal from './Reveal.jsx'

function Skeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-white/5 bg-coal">
      <div className="aspect-[4/3] bg-white/5" />
      <div className="space-y-3 p-6">
        <div className="h-7 w-2/3 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-4/5 rounded bg-white/5" />
      </div>
    </div>
  )
}

export default function Menu() {
  const { items, loading, error, demo } = useMenu()
  const { syncWithMenu } = useCart()
  const [active, setActive] = useState(CATEGORIES[0].id)
  const tabsRef = useRef(null)

  // Mantém o carrinho salvo coerente com o cardápio atual (preço, esgotados, excluídos)
  useEffect(() => {
    if (!loading && !error && items.length) syncWithMenu(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, items])

  const grouped = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        ...c,
        items: items
          .filter((i) => i.category === c.id)
          // disponíveis primeiro, esgotados no fim da categoria
          .sort((a, b) => Number(b.available) - Number(a.available) || a.sort_order - b.sort_order),
      })).filter((c) => c.items.length > 0),
    [items],
  )

  // Scroll-spy: destaca a categoria visível na barra de abas
  useEffect(() => {
    const sections = grouped.map((c) => document.getElementById(`cat-${c.id}`)).filter(Boolean)
    if (!sections.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id.replace('cat-', ''))
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [grouped])

  // Centraliza a aba ativa na barra (mobile) — rola só a barra, nunca a página
  useEffect(() => {
    const tab = document.getElementById(`tab-${active}`)
    const bar = tabsRef.current
    if (!tab || !bar) return
    bar.scrollTo({ left: tab.offsetLeft - bar.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  return (
    <section id="cardapio" className="relative py-24 sm:py-32">
      <div className="spotlight pointer-events-none absolute inset-x-0 top-0 h-[40rem]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mb-12 max-w-2xl">
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="gold-rule" /> O cardápio
          </p>
          <h2 className="section-title">
            Feito na chapa, <span className="font-serif text-[0.7em] italic text-gold">pensado no detalhe</span>
          </h2>
          <p className="mt-5 text-white/60">
            Escolha seus itens, ajuste as observações no carrinho e envie o pedido pelo WhatsApp em segundos.
          </p>
        </Reveal>

        {demo && (
          <p className="mb-8 rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold/90">
            Modo demonstração: configure <code className="font-mono">VITE_SUPABASE_URL</code> e{' '}
            <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> para carregar o cardápio do Supabase.
          </p>
        )}

        {/* abas de categorias fixas no topo ao rolar */}
        <nav
          aria-label="Categorias do cardápio"
          className="sticky top-[62px] z-30 -mx-5 mb-12 border-y border-white/5 bg-ink/85 px-5 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-full sm:border sm:px-2 sm:py-2"
        >
          <ul ref={tabsRef} className="no-scrollbar relative flex gap-2 overflow-x-auto">
            {(grouped.length ? grouped : CATEGORIES).map((c) => (
              <li key={c.id} className="shrink-0">
                <a
                  id={`tab-${c.id}`}
                  href={`#cat-${c.id}`}
                  className={`block rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    active === c.id ? 'bg-gold text-ink' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center text-red-200">
            Não foi possível carregar o cardápio agora. Atualize a página ou chame a gente no WhatsApp.
          </p>
        )}

        {!loading &&
          grouped.map((cat) => (
            <div key={cat.id} id={`cat-${cat.id}`} className="mb-20 scroll-mt-40 last:mb-0">
              <Reveal className="mb-8 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="font-serif text-sm italic text-gold/80">{cat.kicker}</p>
                  <h3 className="font-display text-4xl tracking-wide sm:text-5xl">{cat.label}</h3>
                </div>
                <span className="font-display text-5xl text-white/10 sm:text-7xl">
                  {String(cat.items.length).padStart(2, '0')}
                </span>
              </Reveal>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cat.items.map((item, i) => {
                  const featured = cat.id === 'signature' && i === 0 && item.available
                  return (
                    <Reveal
                      key={item.id}
                      delay={(i % 3) * 90}
                      className={featured ? 'sm:col-span-2 lg:col-span-3' : ''}
                    >
                      <ProductCard item={item} featured={featured} />
                    </Reveal>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
    </section>
  )
}
