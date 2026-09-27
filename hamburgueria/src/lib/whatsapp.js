import { SITE } from '../config/site.js'
import { formatPrice } from './format.js'

export const PAYMENT_LABELS = { pix: 'Pix', card: 'Cartão (maquininha)', cash: 'Dinheiro' }

/** Monta o texto do pedido (com a formatação *negrito* / _itálico_ do WhatsApp). */
export function buildOrderMessage({ lines, total, customer }) {
  const out = []
  out.push(`*NOVO PEDIDO — ${SITE.name.toUpperCase()} ${SITE.tagline.toUpperCase()}*`)
  out.push('')
  out.push(`*Cliente:* ${customer.name.trim()}`)
  out.push(`*Telefone:* ${customer.phone.trim()}`)
  out.push('')
  out.push('*ITENS DO PEDIDO*')
  lines.forEach((l) => {
    out.push(`• ${l.qty}x ${l.name} — ${formatPrice(l.qty * l.price)}`)
    if (l.qty > 1) out.push(`   _(${formatPrice(l.price)} cada)_`)
    if (l.note?.trim()) out.push(`   ↳ Obs: ${l.note.trim()}`)
  })
  out.push('')
  out.push(`*TOTAL: ${formatPrice(total)}*`)
  out.push('')

  if (customer.mode === 'delivery') {
    const a = customer.address
    out.push('*Entrega:* 🛵 Delivery')
    out.push(`*Endereço:* ${a.street.trim()}, ${a.number.trim()}${a.complement?.trim() ? ` — ${a.complement.trim()}` : ''}`)
    out.push(`*Bairro:* ${a.district.trim()}`)
    if (a.reference?.trim()) out.push(`*Referência:* ${a.reference.trim()}`)
    out.push('_Taxa de entrega a confirmar pelo atendente._')
  } else {
    out.push('*Entrega:* 🏪 Retirada no balcão')
    out.push(`_${SITE.address.street} — ${SITE.address.district}_`)
  }
  out.push('')

  let payment = `*Pagamento:* ${PAYMENT_LABELS[customer.payment]}`
  if (customer.payment === 'cash' && customer.change?.trim()) payment += ` — troco para ${customer.change.trim()}`
  out.push(payment)

  return out.join('\n')
}

export function buildWhatsAppUrl(message) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`
}
