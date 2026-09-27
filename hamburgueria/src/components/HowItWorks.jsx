import Reveal from './Reveal.jsx'

const STEPS = [
  {
    n: '01',
    title: 'Monte seu pedido',
    text: 'Escolha os burgers, acompanhamentos e bebidas. Ajuste quantidades e escreva observações como “sem cebola”.',
    art: (
      <svg viewBox="0 0 120 120" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M24 58c0-19 16-33 36-33s36 14 36 33H24Z" />
        <path d="M40 40h.01M58 34h.01M74 42h.01" strokeWidth="4" strokeLinecap="round" />
        <path d="M20 66h80" strokeDasharray="6 5" />
        <path d="M22 74h76c0 10-8 18-18 18H40c-10 0-18-8-18-18Z" />
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Confirme o endereço',
    text: 'Informe seu nome, telefone e escolha delivery ou retirada. Selecione a forma de pagamento.',
    art: (
      <svg viewBox="0 0 120 120" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M60 100S30 72 30 50a30 30 0 0 1 60 0c0 22-30 50-30 50Z" />
        <circle cx="60" cy="50" r="11" />
        <path d="M20 104h80" strokeDasharray="6 5" />
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Envie pelo WhatsApp',
    text: 'Seu pedido chega pronto e formatado na nossa conversa. É só tocar em enviar — a gente confirma na hora.',
    art: (
      <svg viewBox="0 0 120 120" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M60 18a42 42 0 0 0-36 63.6L18 102l21-5.6A42 42 0 1 0 60 18Z" />
        <path d="m44 60 11 11 22-22" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function HowItWorks() {
  return (
    <section id="como-pedir" className="relative overflow-hidden border-y border-white/5 bg-coal py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="eyebrow mb-4">Simples assim</p>
          <h2 className="section-title">Como funciona o pedido</h2>
        </Reveal>

        <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          {/* linha tracejada ligando os passos */}
          <span className="absolute left-[16%] right-[16%] top-16 hidden border-t border-dashed border-gold/30 md:block" />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 150} className="relative text-center">
              <div className="relative mx-auto mb-8 grid h-32 w-32 place-items-center rounded-full border border-gold/30 bg-ink p-7 text-gold shadow-[0_0_60px_-15px_rgb(245_197_24/0.5)]">
                {s.art}
                <span className="absolute -right-1 -top-1 grid h-10 w-10 place-items-center rounded-full bg-gold font-display text-xl text-ink">
                  {s.n}
                </span>
              </div>
              <h3 className="font-display text-3xl tracking-wide">{s.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/55">{s.text}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-16 text-center">
          <a href="#cardapio" className="btn-gold px-8 py-4">
            Começar meu pedido
          </a>
        </Reveal>
      </div>
    </section>
  )
}
