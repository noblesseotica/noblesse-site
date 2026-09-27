// ============================================================================
// DADOS DA HAMBURGUERIA — edite aqui nome, endereço, horários e redes sociais.
// O número do WhatsApp vem da variável de ambiente VITE_WHATSAPP_NUMBER
// (configure no Netlify). O valor abaixo é só um fallback para testes.
// ============================================================================

export const SITE = {
  name: 'Ouro Negro',
  tagline: 'Burger House',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '5511999999999',
  phoneDisplay: '(11) 99999-9999',
  address: {
    street: 'Rua Augusta, 1500',
    district: 'Consolação',
    city: 'São Paulo — SP',
    zip: '01304-001',
  },
  // Texto usado no iframe do Google Maps (não precisa de chave de API)
  mapQuery: 'Rua Augusta, 1500 - Consolação, São Paulo - SP',
  hours: [
    { days: 'Segunda', time: 'Fechado' },
    { days: 'Terça a Quinta', time: '18h às 23h' },
    { days: 'Sexta e Sábado', time: '18h às 00h' },
    { days: 'Domingo', time: '18h às 23h' },
  ],
  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tiktok: 'https://tiktok.com/',
  },
}

// Categorias do cardápio (a coluna "category" no Supabase usa estes ids)
export const CATEGORIES = [
  { id: 'smash', label: 'Smash Burgers', kicker: 'Crosta na chapa' },
  { id: 'signature', label: 'Signature', kicker: 'Assinatura da casa' },
  { id: 'sides', label: 'Acompanhamentos', kicker: 'Para dividir (ou não)' },
  { id: 'drinks', label: 'Bebidas', kicker: 'Geladas' },
  { id: 'desserts', label: 'Sobremesas', kicker: 'O final perfeito' },
]
