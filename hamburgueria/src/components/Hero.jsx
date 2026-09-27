import { useEffect, useRef } from 'react'
import { SITE } from '../config/site.js'
import { ArrowDownIcon } from './Icons.jsx'

// 📸 FOTO/VÍDEO DA HERO — troque pela foto real do cliente (ideal: burger em fundo escuro, com fumaça/vapor).
// Para usar VÍDEO: coloque o arquivo em /public/hero.mp4 e troque o <img> abaixo por:
//   <video autoPlay muted loop playsInline poster={HERO_IMAGE} className="...mesmas classes...">
//     <source src="/hero.mp4" type="video/mp4" />
//   </video>
// Mantenha o vídeo leve (< 4 MB, 1080p, 8–12s em loop) para não prejudicar o carregamento no celular.
const HERO_IMAGE = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1920&q=80&auto=format&fit=crop'

export default function Hero() {
  const mediaRef = useRef(null)
  const contentRef = useRef(null)

  // Parallax discreto: a imagem desce mais devagar que o scroll e o texto some suavemente
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight)
        if (mediaRef.current) mediaRef.current.style.transform = `translate3d(0, ${y * 0.3}px, 0) scale(1.08)`
        if (contentRef.current) {
          contentRef.current.style.transform = `translate3d(0, ${y * 0.12}px, 0)`
          contentRef.current.style.opacity = String(1 - y / (window.innerHeight * 0.85))
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section id="top" className="relative flex min-h-[100svh] items-end overflow-hidden pb-16 sm:items-center sm:pb-0">
      {/* mídia de fundo */}
      <div ref={mediaRef} className="absolute inset-0 will-change-transform" style={{ transform: 'scale(1.08)' }}>
        <img
          src={HERO_IMAGE}
          alt=""
          fetchPriority="high"
          className="h-full w-full object-cover object-[65%_center] opacity-70"
        />
      </div>

      {/* camadas de luz e sombra: vinheta, spotlight dourado e "fumaça" animada */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[42rem] w-[42rem] rounded-full bg-gold/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-[40rem] animate-drift rounded-full bg-white/10 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-60 w-96 animate-drift-slow rounded-full bg-amber/10 blur-[80px]" />

      <div ref={contentRef} className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-28 sm:px-8">
        <p className="eyebrow mb-6 flex items-center gap-3">
          <span className="gold-rule" /> {SITE.name} {SITE.tagline}
        </p>
        <h1 className="font-display text-[4.3rem] leading-[0.86] tracking-wide sm:text-8xl lg:text-[9.5rem]">
          Fogo alto.
          <br />
          <span className="text-gold-gradient">Carne nobre.</span>
          <br />
          <span className="font-serif text-[0.62em] font-semibold italic tracking-normal text-white/90">sem atalhos.</span>
        </h1>
        <p className="mt-7 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
          Blend Angus exclusivo moído todo dia, brioche assado na casa e molhos autorais. Monte seu pedido aqui e
          finalize direto no WhatsApp.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a href="#cardapio" className="btn-gold px-8 py-4 text-base">
            Ver Cardápio <ArrowDownIcon className="h-4 w-4" />
          </a>
          <a href="#como-pedir" className="btn-ghost py-4">
            Como pedir
          </a>
        </div>
        <dl className="mt-12 hidden max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6 sm:grid">
          {[
            ['Delivery', 'e retirada'],
            ['100%', 'Angus'],
            ['Pedido', 'via WhatsApp'],
          ].map(([a, b]) => (
            <div key={a}>
              <dt className="font-display text-3xl tracking-wide text-gold">{a}</dt>
              <dd className="text-xs uppercase tracking-[0.2em] text-white/50">{b}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
