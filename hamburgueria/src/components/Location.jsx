import { SITE } from '../config/site.js'
import Reveal from './Reveal.jsx'
import { ClockIcon, PinIcon, WhatsAppIcon } from './Icons.jsx'

export default function Location() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(SITE.mapQuery)}&output=embed`
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SITE.mapQuery)}`

  return (
    <section id="onde-estamos" className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="gold-rule" /> Onde estamos
          </p>
          <h2 className="section-title">
            Venha buscar <span className="font-serif text-[0.7em] italic text-gold">ou receba em casa</span>
          </h2>

          <div className="mt-10 space-y-8">
            <div className="flex gap-4">
              <PinIcon className="mt-1 h-6 w-6 shrink-0 text-gold" />
              <div>
                <p className="font-medium text-white">{SITE.address.street}</p>
                <p className="text-white/55">
                  {SITE.address.district} · {SITE.address.city}
                </p>
                <p className="text-white/40">CEP {SITE.address.zip}</p>
                <a href={directions} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-gold underline-offset-4 hover:underline">
                  Traçar rota →
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <ClockIcon className="mt-1 h-6 w-6 shrink-0 text-gold" />
              <dl className="w-full max-w-sm">
                {SITE.hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-4 border-b border-white/5 py-2 text-sm last:border-0">
                    <dt className="text-white/60">{h.days}</dt>
                    <dd className={h.time === 'Fechado' ? 'text-white/35' : 'font-medium text-white'}>{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <WhatsAppIcon className="h-4 w-4 text-gold" /> {SITE.phoneDisplay}
            </a>
          </div>
        </Reveal>

        <Reveal delay={150} className="relative min-h-[22rem] overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_80px_-30px_rgb(0_0_0)]">
          <iframe
            title={`Mapa — ${SITE.name}`}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0 [filter:grayscale(1)_invert(0.92)_contrast(0.9)_sepia(0.25)]"
          />
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-gold/20" />
        </Reveal>
      </div>
    </section>
  )
}
