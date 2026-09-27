import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../lib/format.js'
import { buildOrderMessage, buildWhatsAppUrl, PAYMENT_LABELS } from '../lib/whatsapp.js'
import { CheckIcon, WhatsAppIcon } from './Icons.jsx'

// Guarda os dados do cliente no aparelho para agilizar o próximo pedido
const CUSTOMER_KEY = 'ouro-negro:customer:v1'

const EMPTY = {
  name: '',
  phone: '',
  mode: 'delivery',
  address: { street: '', number: '', district: '', complement: '', reference: '' },
  payment: 'pix',
  change: '',
}

function loadCustomer() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null')
    return saved ? { ...EMPTY, ...saved, address: { ...EMPTY.address, ...saved.address }, change: '' } : EMPTY
  } catch {
    return EMPTY
  }
}

function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function validate(c) {
  const e = {}
  if (c.name.trim().length < 2) e.name = 'Informe seu nome'
  if (c.phone.replace(/\D/g, '').length < 10) e.phone = 'Telefone com DDD'
  if (c.mode === 'delivery') {
    if (!c.address.street.trim()) e.street = 'Informe a rua'
    if (!c.address.number.trim()) e.number = 'Nº'
    if (!c.address.district.trim()) e.district = 'Informe o bairro'
  }
  return e
}

function Field({ label, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  )
}

function Segmented({ value, onChange, options, name }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
            value === o.value ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-white/60 hover:border-white/25'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function Checkout({ onBack }) {
  const { lines, total, clear, close } = useCart()
  const [c, setC] = useState(loadCustomer)
  const [errors, setErrors] = useState({})
  const [sentUrl, setSentUrl] = useState(null)

  useEffect(() => {
    try {
      const { change, ...rest } = c // eslint-disable-line no-unused-vars
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(rest))
    } catch {
      /* ignora */
    }
  }, [c])

  const clearError = (key) => errors[key] && setErrors(({ [key]: _, ...rest }) => rest) // eslint-disable-line no-unused-vars
  const set = (key, value) => {
    clearError(key)
    setC((prev) => ({ ...prev, [key]: value }))
  }
  const setAddr = (key, value) => {
    clearError(key)
    setC((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }))
  }

  const submit = (e) => {
    e.preventDefault()
    const errs = validate(c)
    setErrors(errs)
    if (Object.keys(errs).length) {
      // leva o usuário até o primeiro campo com erro
      requestAnimationFrame(() => document.querySelector('[data-invalid="true"]')?.focus())
      return
    }
    const url = buildWhatsAppUrl(buildOrderMessage({ lines, total, customer: c }))
    setSentUrl(url)
    // Abre o app no celular / WhatsApp Web no computador
    const win = window.open(url, '_blank')
    if (win) win.opener = null
    else window.location.href = url // pop-up bloqueado: abre na mesma aba
  }

  if (sentUrl) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-gold text-ink shadow-[0_0_60px_-10px_rgb(245_197_24/0.8)]">
          <CheckIcon className="h-10 w-10" />
        </div>
        <p className="font-display text-4xl tracking-wide">Pedido pronto!</p>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Abrimos o WhatsApp com a mensagem do seu pedido. <strong className="text-white">Toque em enviar</strong> para
          confirmar — respondemos em instantes.
        </p>
        <a href={sentUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-8">
          <WhatsAppIcon className="h-4 w-4 text-gold" /> Abrir WhatsApp novamente
        </a>
        <button
          type="button"
          onClick={() => {
            clear()
            close()
          }}
          className="mt-4 text-sm text-white/50 underline-offset-4 hover:text-white hover:underline"
        >
          Esvaziar carrinho e voltar ao site
        </button>
      </div>
    )
  }

  const inv = (k) => ({ 'data-invalid': Boolean(errors[k]) })

  return (
    <form onSubmit={submit} noValidate className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-6">
        <button type="button" onClick={onBack} className="text-sm text-white/50 hover:text-gold">
          ← Voltar ao carrinho
        </button>

        <fieldset className="space-y-4">
          <Field label="Nome" error={errors.name}>
            <input className="field" autoComplete="name" value={c.name} onChange={(e) => set('name', e.target.value)} placeholder="Como podemos te chamar?" {...inv('name')} />
          </Field>
          <Field label="Telefone / WhatsApp" error={errors.phone}>
            <input className="field" type="tel" inputMode="tel" autoComplete="tel" value={c.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} placeholder="(11) 99999-9999" {...inv('phone')} />
          </Field>
        </fieldset>

        <fieldset>
          <legend className="label">Como quer receber?</legend>
          <Segmented
            name="Tipo de entrega"
            value={c.mode}
            onChange={(v) => set('mode', v)}
            options={[
              { value: 'delivery', label: '🛵 Delivery' },
              { value: 'pickup', label: '🏪 Retirada' },
            ]}
          />
        </fieldset>

        {c.mode === 'delivery' && (
          <fieldset className="grid grid-cols-[1fr_6rem] gap-3">
            <Field label="Rua / Avenida" error={errors.street}>
              <input className="field" autoComplete="address-line1" value={c.address.street} onChange={(e) => setAddr('street', e.target.value)} {...inv('street')} />
            </Field>
            <Field label="Número" error={errors.number}>
              <input className="field" inputMode="numeric" value={c.address.number} onChange={(e) => setAddr('number', e.target.value)} {...inv('number')} />
            </Field>
            <Field label="Bairro" error={errors.district} className="col-span-2">
              <input className="field" value={c.address.district} onChange={(e) => setAddr('district', e.target.value)} {...inv('district')} />
            </Field>
            <Field label="Complemento (opcional)" className="col-span-2">
              <input className="field" autoComplete="address-line2" value={c.address.complement} onChange={(e) => setAddr('complement', e.target.value)} placeholder="Apto, bloco, casa…" />
            </Field>
            <Field label="Ponto de referência (opcional)" className="col-span-2">
              <input className="field" value={c.address.reference} onChange={(e) => setAddr('reference', e.target.value)} placeholder="Ex.: em frente à padaria" />
            </Field>
          </fieldset>
        )}

        <fieldset className="space-y-3">
          <legend className="label">Forma de pagamento (na entrega/retirada)</legend>
          <Segmented
            name="Forma de pagamento"
            value={c.payment}
            onChange={(v) => set('payment', v)}
            options={Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label: label.replace(' (maquininha)', '') }))}
          />
          {c.payment === 'cash' && (
            <Field label="Troco para quanto? (opcional)">
              <input className="field" inputMode="decimal" value={c.change} onChange={(e) => set('change', e.target.value)} placeholder="Ex.: R$ 100" />
            </Field>
          )}
        </fieldset>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
          <p className="label">Resumo</p>
          <ul className="space-y-1.5">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 text-white/70">
                <span>
                  {l.qty}x {l.name}
                  {l.note && <em className="block text-xs not-italic text-white/40">↳ {l.note}</em>}
                </span>
                <span className="shrink-0 tabular-nums">{formatPrice(l.qty * l.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="border-t border-white/10 bg-ink/60 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        <div className="mb-4 flex items-end justify-between">
          <span className="text-sm uppercase tracking-widest text-white/50">Total</span>
          <span className="font-display text-4xl tracking-wide text-gold">{formatPrice(total)}</span>
        </div>
        <button type="submit" className="btn-gold w-full py-4 text-base">
          <WhatsAppIcon className="h-5 w-5" /> Enviar pedido pelo WhatsApp
        </button>
      </footer>
    </form>
  )
}
