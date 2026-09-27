import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../../config/site.js'
import { removeImage, saveItem, uploadImage } from '../../lib/adminApi.js'
import { FALLBACK_IMAGE } from '../../lib/format.js'
import { CloseIcon, ImageIcon } from '../Icons.jsx'

const BLANK = {
  name: '',
  category: CATEGORIES[0].id,
  description: '',
  ingredients: [],
  price: '',
  image_url: '',
  available: true,
  badge: '',
  sort_order: 0,
}

export default function ItemForm({ item, onClose, onSaved }) {
  const [form, setForm] = useState(() => (item ? { ...BLANK, ...item, badge: item.badge ?? '' } : BLANK))
  const [ingredientDraft, setIngredientDraft] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(item?.image_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, saving])

  useEffect(() => () => preview?.startsWith('blob:') && URL.revokeObjectURL(preview), [preview])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const addIngredients = (text) => {
    const parts = text.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
    if (!parts.length) return
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, ...parts.filter((p) => !f.ingredients.includes(p))] }))
    setIngredientDraft('')
  }

  const pickFile = (f) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return setError('Escolha um arquivo de imagem (JPG, PNG ou WebP).')
    if (f.size > 15 * 1024 * 1024) return setError('Imagem muito grande (máx. 15 MB).')
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Dê um nome ao item.')
    const price = Number(String(form.price).replace(',', '.'))
    if (!(price >= 0) || form.price === '') return setError('Informe um preço válido.')

    // ingrediente digitado e não confirmado com Enter também entra
    const ingredients = ingredientDraft.trim() ? [...form.ingredients, ingredientDraft.trim()] : form.ingredients

    setSaving(true)
    setError('')
    try {
      let image_url = form.image_url
      if (file) image_url = await uploadImage(file)
      const saved = await saveItem({ ...form, ingredients, price, image_url })
      // foto antiga substituída: apaga do Storage para não acumular lixo
      if (file && item?.image_url && item.image_url !== image_url) removeImage(item.image_url).catch(() => {})
      onSaved(saved)
    } catch (err) {
      setError(err.message || 'Não foi possível salvar. Tente de novo.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-6">
      <form
        onSubmit={submit}
        className="flex max-h-[94svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-coal shadow-2xl sm:rounded-3xl"
      >
        <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="font-display text-3xl tracking-wide">{item ? 'Editar item' : 'Novo item'}</h2>
          <button type="button" onClick={onClose} disabled={saving} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 hover:border-gold hover:text-gold" aria-label="Fechar">
            <CloseIcon />
          </button>
        </header>

        <div className="grid flex-1 gap-5 overflow-y-auto px-6 py-6 sm:grid-cols-[13rem_1fr]">
          {/* Foto */}
          <div>
            <span className="label">Foto</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                pickFile(e.dataTransfer.files?.[0])
              }}
              className="group relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/[0.03] text-white/40 transition hover:border-gold hover:text-gold"
            >
              {preview ? (
                <>
                  <img src={preview} onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-xs text-white opacity-0 transition group-hover:opacity-100">
                    Trocar foto
                  </span>
                </>
              ) : (
                <span className="flex flex-col items-center gap-2 p-4 text-center text-xs">
                  <ImageIcon className="h-8 w-8" />
                  Toque para enviar
                  <br />
                  ou arraste a foto aqui
                </span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
            <p className="mt-2 text-[0.7rem] leading-snug text-white/35">Dica: fotos na horizontal (4:3), fundo escuro e boa luz.</p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="label">Nome *</span>
              <input className="field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Smash Ouro" required />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label">Categoria *</span>
                <select className="field" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id} className="bg-coal">
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Preço (R$) *</span>
                <input className="field" inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="38,90" required />
              </label>
            </div>

            <label className="block">
              <span className="label">Descrição</span>
              <textarea className="field min-h-24 resize-y" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Conte como é preparado, o que tem de especial…" />
            </label>

            <div>
              <span className="label">Ingredientes</span>
              <div className="field flex flex-wrap gap-1.5 py-2">
                {form.ingredients.map((ing) => (
                  <span key={ing} className="flex items-center gap-1 rounded-full bg-gold/15 py-1 pl-3 pr-1 text-xs text-gold">
                    {ing}
                    <button type="button" onClick={() => set('ingredients', form.ingredients.filter((i) => i !== ing))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-gold hover:text-ink" aria-label={`Remover ${ing}`}>
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={ingredientDraft}
                  onChange={(e) => setIngredientDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addIngredients(ingredientDraft)
                    } else if (e.key === 'Backspace' && !ingredientDraft && form.ingredients.length) {
                      set('ingredients', form.ingredients.slice(0, -1))
                    }
                  }}
                  onBlur={() => addIngredients(ingredientDraft)}
                  placeholder={form.ingredients.length ? '' : 'Digite e aperte Enter'}
                  className="min-w-32 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label">Selo (opcional)</span>
                <input className="field" value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="Mais pedido" maxLength={20} />
              </label>
              <label className="block">
                <span className="label">Ordem</span>
                <input className="field" type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
              </label>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 px-4 py-3">
              <span>
                <span className="block text-sm font-medium">Disponível para pedido</span>
                <span className="text-xs text-white/40">Desligue quando acabar o estoque</span>
              </span>
              <input type="checkbox" className="peer sr-only" checked={form.available} onChange={(e) => set('available', e.target.checked)} />
              <span className="relative h-7 w-12 rounded-full bg-white/15 transition peer-checked:bg-gold after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
            </label>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-white/5 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:items-center sm:justify-end">
          {error && <p className="text-sm text-red-300 sm:mr-auto">{error}</p>}
          <button type="button" onClick={onClose} disabled={saving} className="btn-ghost py-3">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-gold py-3">
            {saving ? (file ? 'Enviando foto…' : 'Salvando…') : 'Salvar item'}
          </button>
        </footer>
      </form>
    </div>
  )
}
