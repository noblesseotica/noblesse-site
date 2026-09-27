import Reveal from './Reveal.jsx'
import { DropIcon, FlameIcon, MedalIcon, WheatIcon } from './Icons.jsx'

const FEATURES = [
  { Icon: MedalIcon, title: 'Carne 100% Angus', text: 'Cortes selecionados de fornecedor certificado, moídos diariamente na casa.' },
  { Icon: WheatIcon, title: 'Brioche Artesanal', text: 'Fermentação lenta de 18h, manteiga de verdade e assado todas as manhãs.' },
  { Icon: DropIcon, title: 'Molhos Autorais', text: 'Trufa negra, chipotle defumado, barbecue de rapadura — tudo feito aqui.' },
  { Icon: FlameIcon, title: 'Blend Exclusivo', text: 'Costela, acém e peito maturados 21 dias. Receita que só existe aqui.' },
]

export default function Features() {
  return (
    <section className="relative border-y border-white/5 bg-coal/60 py-20 sm:py-24">
      <div className="spotlight pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-7xl gap-px overflow-hidden rounded-3xl px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {FEATURES.map(({ Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 110} className="group relative px-2 py-6 sm:px-6 lg:py-2">
            <div className="mb-5 grid h-14 w-14 place-items-center rounded-full border border-gold/30 bg-gold/5 text-gold transition duration-500 group-hover:scale-110 group-hover:border-gold group-hover:shadow-[0_0_30px_-4px_rgb(245_197_24/0.5)]">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-3xl tracking-wide text-white">{title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/55">{text}</p>
            {i < FEATURES.length - 1 && (
              <span className="absolute right-0 top-1/2 hidden h-24 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />
            )}
          </Reveal>
        ))}
      </div>
    </section>
  )
}
