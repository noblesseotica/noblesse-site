import { Link } from 'react-router-dom'
import { SITE } from '../config/site.js'
import Logo from './Logo.jsx'
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './Icons.jsx'

export default function Footer() {
  const socials = [
    { href: SITE.social.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: SITE.social.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: SITE.social.tiktok, label: 'TikTok', Icon: TikTokIcon },
    { href: `https://wa.me/${SITE.whatsapp}`, label: 'WhatsApp', Icon: WhatsAppIcon },
  ].filter((s) => s.href)

  return (
    <footer className="relative border-t border-white/5 bg-coal pb-28 pt-16 sm:pb-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
            Hamburgueria artesanal premium. Delivery e retirada com pedido direto pelo WhatsApp.
          </p>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-4">Endereço</p>
          <p className="text-white/70">{SITE.address.street}</p>
          <p className="text-white/45">
            {SITE.address.district} · {SITE.address.city}
          </p>
          <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-gold hover:underline">
            <WhatsAppIcon className="h-4 w-4" /> {SITE.phoneDisplay}
          </a>
        </div>
        <div>
          <p className="eyebrow mb-4">Siga a gente</p>
          <ul className="flex gap-3">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white/70 transition hover:-translate-y-1 hover:border-gold hover:text-gold"
                >
                  <Icon className="h-5 w-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-white/5 px-5 pt-6 text-xs text-white/30 sm:flex-row sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {SITE.name} {SITE.tagline}. Todos os direitos reservados.
        </p>
        <Link to="/admin" className="hover:text-white/60">
          Área restrita
        </Link>
      </div>
    </footer>
  )
}
