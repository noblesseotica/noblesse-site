const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatPrice = (value) => brl.format(Number(value) || 0)

// Foto usada quando o item não tem imagem ou a URL falha
export const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#2a2410"/><stop offset="1" stop-color="#0d0d0d"/></radialGradient></defs><rect width="400" height="300" fill="url(#g)"/><g fill="#F5C518" opacity=".55"><path d="M140 150c0-33 27-58 60-58s60 25 60 58z"/><rect x="132" y="160" width="136" height="12" rx="6" opacity=".6"/><path d="M140 182h120c0 14-10 24-24 24h-72c-14 0-24-10-24-24z"/></g></svg>`,
  )

/** Adiciona parâmetros de redimensionamento em URLs do Unsplash (economiza banda no celular). */
export function sizedImage(url, width = 800) {
  if (!url) return FALLBACK_IMAGE
  if (url.includes('images.unsplash.com')) {
    const u = new URL(url)
    u.searchParams.set('w', String(width))
    u.searchParams.set('q', '75')
    u.searchParams.set('auto', 'format')
    u.searchParams.set('fit', 'crop')
    return u.toString()
  }
  return url
}
