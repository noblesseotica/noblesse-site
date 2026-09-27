import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'
import { SITE } from '../config/site.js'
import { WhatsAppIcon } from './Icons.jsx'

const LINKS = [
  { href: '#cardapio', label: 'Cardápio' },
  { href: '#como-pedir', label: 'Como pedir' },
  { href: '#onde-estamos', label: 'Onde estamos' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled ? 'border-b border-white/5 bg-ink/80 py-3 backdrop-blur-xl' : 'py-5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-9 md:flex" aria-label="Principal">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm font-medium tracking-wide text-white/70 transition hover:text-white after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href={`https://wa.me/${SITE.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold hover:text-ink sm:inline-flex"
        >
          <WhatsAppIcon className="h-4 w-4" /> Fale conosco
        </a>
      </div>
    </header>
  )
}
