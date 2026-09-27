import { IMAGES_BUCKET, MENU_TABLE, supabase } from './supabase.js'

export async function fetchAllItems() {
  const { data, error } = await supabase
    .from(MENU_TABLE)
    .select('*')
    .order('category')
    .order('sort_order')
    .order('name')
  if (error) throw error
  return data
}

export async function saveItem(item) {
  const payload = {
    category: item.category,
    name: item.name.trim(),
    description: item.description.trim(),
    ingredients: item.ingredients,
    price: Number(item.price),
    image_url: item.image_url || null,
    available: item.available,
    sort_order: Number(item.sort_order) || 0,
    badge: item.badge?.trim() || null,
  }
  const query = item.id
    ? supabase.from(MENU_TABLE).update(payload).eq('id', item.id)
    : supabase.from(MENU_TABLE).insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function setAvailability(id, available) {
  const { error } = await supabase.from(MENU_TABLE).update({ available }).eq('id', id)
  if (error) throw error
}

export async function deleteItem(item) {
  const { error } = await supabase.from(MENU_TABLE).delete().eq('id', item.id)
  if (error) throw error
  await removeImage(item.image_url)
}

/** Reduz a foto no navegador (máx. 1600px, WebP) antes de enviar: upload mais rápido e site mais leve. */
async function compressImage(file, maxSize = 1600, quality = 0.82) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

/** Envia a foto ao Supabase Storage e devolve a URL pública. */
export async function uploadImage(file) {
  const body = await compressImage(file)
  const ext = body.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `items/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, body, {
    cacheControl: '31536000',
    contentType: body.type || file.type,
    upsert: false,
  })
  if (error) throw error
  return supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Remove do Storage uma foto antiga (só se ela estiver no nosso bucket). */
export async function removeImage(url) {
  const marker = `/storage/v1/object/public/${IMAGES_BUCKET}/`
  if (!url || !url.includes(marker)) return
  const path = decodeURIComponent(url.split(marker)[1])
  await supabase.storage.from(IMAGES_BUCKET).remove([path])
}
