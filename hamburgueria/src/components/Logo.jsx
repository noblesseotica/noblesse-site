import { SITE } from '../config/site.js'

export default function Logo({ className = '' }) {
  return (
    <a href="#top" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label={`${SITE.name} — início`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-full border border-gold/50 transition group-hover:border-gold">
        <svg viewBox="0 0 32 32" className="h-5 w-5 text-gold" fill="currentColor" aria-hidden="true">
          <path d="M5 15c0-5 4.9-9 11-9s11 4 11 9H5Z" />
          <rect x="4" y="17" width="24" height="2.6" rx="1.3" opacity=".55" />
          <path d="M5 22h22c0 2.4-1.9 4-4.2 4H9.2C6.9 26 5 24.4 5 22Z" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-2xl tracking-[0.12em] text-white">{SITE.name}</span>
        <span className="block font-serif text-[0.65rem] italic tracking-[0.2em] text-gold/80">{SITE.tagline}</span>
      </span>
    </a>
  )
}
