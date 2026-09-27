// ============================================================================
// CARDÁPIO DE DEMONSTRAÇÃO
// Usado APENAS quando as variáveis do Supabase não estão configuradas (ex.: ao
// rodar localmente pela primeira vez). Em produção o cardápio vem da tabela
// "menu_items" do Supabase e é editado pelo painel /admin.
// O mesmo conteúdo está em supabase/seed.sql para popular o banco.
//
// 📸 FOTOS: as URLs abaixo são placeholders do Unsplash. Troque pelas fotos
// reais do cliente pelo painel /admin (upload vai para o Supabase Storage).
// Recomendação forte: contratar um fotógrafo de alimentos profissional — é o
// que mais eleva a percepção de valor do site.
// ============================================================================

const u = (id) => `https://images.unsplash.com/photo-${id}`

export const DEMO_MENU = [
  // ---------------------------------------------------------------- SMASH
  {
    id: 'demo-1', category: 'smash', sort_order: 1, badge: 'Mais pedido',
    name: 'Smash Ouro',
    description: 'Duas bolinhas de blend Angus prensadas na chapa a 250°C até formar aquela crosta caramelizada e crocante. Queijo cheddar inglês derretendo nas bordas e o nosso molho da casa no brioche selado na manteiga.',
    ingredients: ['2x smash Angus 80g', 'Cheddar inglês', 'Cebola na chapa', 'Picles da casa', 'Molho Ouro', 'Brioche artesanal'],
    price: 38.9, image_url: u('1568901346375-23c9450c58cd'), available: true,
  },
  {
    id: 'demo-2', category: 'smash', sort_order: 2,
    name: 'Triple Smash',
    description: 'Para quem não negocia: três camadas de smash com crosta de Maillard, triplo cheddar e bacon de barriga suína defumado em lenha frutífera. Suculento do começo ao último guardanapo.',
    ingredients: ['3x smash Angus 80g', 'Triplo cheddar', 'Bacon defumado artesanal', 'Molho Ouro', 'Brioche artesanal'],
    price: 49.9, image_url: u('1606131731446-5568d87113aa'), available: true,
  },
  {
    id: 'demo-3', category: 'smash', sort_order: 3,
    name: 'Smash Clássico',
    description: 'O essencial bem feito: um smash de 100g na chapa bem quente, queijo prato derretido, alface americana crocante, tomate e maionese caseira de alho assado.',
    ingredients: ['Smash Angus 100g', 'Queijo prato', 'Alface americana', 'Tomate', 'Maionese de alho assado', 'Brioche artesanal'],
    price: 29.9, image_url: u('1586190848861-99aa4a171e90'), available: true,
  },
  {
    id: 'demo-4', category: 'smash', sort_order: 4, badge: 'Picante',
    name: 'Smash Inferno',
    description: 'Duplo smash com pepper jack, jalapeños em conserva feita aqui, cebola crispy e maionese de chipotle defumado. Ardência na medida, sem perder o sabor da carne.',
    ingredients: ['2x smash Angus 80g', 'Pepper jack', 'Jalapeño da casa', 'Cebola crispy', 'Maionese de chipotle', 'Brioche artesanal'],
    price: 41.9, image_url: u('1553979459-d2229ba7433b'), available: true,
  },

  // ------------------------------------------------------------ SIGNATURE
  {
    id: 'demo-5', category: 'signature', sort_order: 1, badge: 'Assinatura',
    name: 'Ouro Negro Trufado',
    description: 'Blend exclusivo de 180g com costela e acém Angus maturados 21 dias, grelhado no ponto que você pedir. Queijo brie derretido, cogumelos salteados na manteiga e molho de trufa negra artesanal.',
    ingredients: ['Blend maturado 21 dias 180g', 'Brie', 'Cogumelos paris e shimeji', 'Molho de trufa negra', 'Rúcula', 'Brioche preto'],
    price: 64.9, image_url: u('1550547660-d9450f859349'), available: true,
  },
  {
    id: 'demo-6', category: 'signature', sort_order: 2,
    name: 'Costela 12h',
    description: 'Costela bovina defumada por 12 horas em lenha de macieira, desfiada e prensada sobre blend de 160g. Finalizada com queijo coalho maçaricado e barbecue de rapadura feito na casa.',
    ingredients: ['Blend Angus 160g', 'Costela defumada 12h', 'Queijo coalho maçaricado', 'Barbecue de rapadura', 'Cebola roxa', 'Brioche artesanal'],
    price: 59.9, image_url: u('1594212699903-ec8a3eca50f5'), available: true,
  },
  {
    id: 'demo-7', category: 'signature', sort_order: 3,
    name: 'Gorgonzola & Mel',
    description: 'O contraste que vicia: blend de 180g, gorgonzola cremoso, cebola caramelizada lentamente no vinho do Porto, nozes tostadas e um fio de mel de laranjeira.',
    ingredients: ['Blend Angus 180g', 'Gorgonzola', 'Cebola caramelizada no Porto', 'Nozes tostadas', 'Mel de laranjeira', 'Brioche artesanal'],
    price: 57.9, image_url: u('1572802419224-296b0aeee0d9'), available: true,
  },
  {
    id: 'demo-8', category: 'signature', sort_order: 4,
    name: 'Bacon Jam Royale',
    description: 'Blend de 180g com crosta de pimenta-do-reino, geleia de bacon cozida por 4 horas com café e açúcar mascavo, cheddar maturado e ovo de gema mole.',
    ingredients: ['Blend Angus 180g', 'Geleia de bacon com café', 'Cheddar maturado', 'Ovo de gema mole', 'Brioche artesanal'],
    price: 61.9, image_url: u('1596662951482-0c4ba74a6df6'), available: true,
  },
  {
    id: 'demo-9', category: 'signature', sort_order: 5, badge: 'Veggie',
    name: 'Garden Gold',
    description: 'Burger de grão-de-bico, cogumelos e beterraba assada com casquinha dourada, queijo muçarela de búfala, tomate confit e pesto de manjericão. Vegetariano, sem abrir mão de sabor.',
    ingredients: ['Burger vegetal da casa 150g', 'Muçarela de búfala', 'Tomate confit', 'Pesto de manjericão', 'Folhas', 'Brioche artesanal'],
    price: 46.9, image_url: u('1571091718767-18b5b1457add'), available: true,
  },

  // ---------------------------------------------------------------- SIDES
  {
    id: 'demo-10', category: 'sides', sort_order: 1,
    name: 'Fritas Rústicas',
    description: 'Batatas cortadas à mão, cozidas e fritas duas vezes para ficarem crocantes por fora e cremosas por dentro. Sal de parrilla e alecrim.',
    ingredients: ['Batata asterix', 'Sal de parrilla', 'Alecrim', 'Maionese da casa'],
    price: 22.9, image_url: u('1573080496219-bb080dd4f877'), available: true,
  },
  {
    id: 'demo-11', category: 'sides', sort_order: 2, badge: 'Imperdível',
    name: 'Fritas Trufadas',
    description: 'Nossas fritas rústicas finalizadas com azeite de trufa branca, parmesão ralado na hora e salsinha fresca.',
    ingredients: ['Batata asterix', 'Azeite de trufa branca', 'Parmesão', 'Salsinha'],
    price: 32.9, image_url: u('1630384060421-cb20d0e0649d'), available: true,
  },
  {
    id: 'demo-12', category: 'sides', sort_order: 3,
    name: 'Onion Rings na Cerveja',
    description: 'Anéis de cebola empanados em massa de cerveja artesanal e panko, fritos na hora. Acompanha molho barbecue de rapadura.',
    ingredients: ['Cebola doce', 'Massa de cerveja', 'Panko', 'Barbecue de rapadura'],
    price: 26.9, image_url: u('1639024471283-03518883512d'), available: true,
  },
  {
    id: 'demo-13', category: 'sides', sort_order: 4,
    name: 'Cheddar & Bacon Fries',
    description: 'Fritas rústicas cobertas com creme de cheddar inglês e farofa de bacon defumado crocante.',
    ingredients: ['Batata asterix', 'Creme de cheddar', 'Farofa de bacon', 'Cebolinha'],
    price: 34.9, image_url: u('1585109649139-366815a0d713'), available: true,
  },

  // --------------------------------------------------------------- DRINKS
  {
    id: 'demo-14', category: 'drinks', sort_order: 1,
    name: 'Refrigerante Lata',
    description: 'Coca-Cola, Coca Zero, Guaraná Antarctica ou Sprite. Informe o sabor na observação.',
    ingredients: ['350ml'],
    price: 7.9, image_url: u('1622483767028-3f66f32aef97'), available: true,
  },
  {
    id: 'demo-15', category: 'drinks', sort_order: 2,
    name: 'Limonada Siciliana',
    description: 'Limão-siciliano espremido na hora, hortelã fresca e um toque de gengibre. Feita no pedido.',
    ingredients: ['500ml', 'Limão-siciliano', 'Hortelã', 'Gengibre'],
    price: 16.9, image_url: u('1621263764928-df1444c5e859'), available: true,
  },
  {
    id: 'demo-16', category: 'drinks', sort_order: 3,
    name: 'Milkshake Doce de Leite',
    description: 'Sorvete artesanal de creme batido com doce de leite argentino e calda de caramelo salgado. Cremoso de verdade.',
    ingredients: ['400ml', 'Sorvete de creme artesanal', 'Doce de leite argentino', 'Caramelo salgado'],
    price: 24.9, image_url: u('1572490122747-3968b75cc699'), available: true,
  },
  {
    id: 'demo-17', category: 'drinks', sort_order: 4,
    name: 'Cerveja Artesanal IPA',
    description: 'IPA de cervejaria local, amargor marcante e notas cítricas — harmoniza perfeitamente com os signature.',
    ingredients: ['473ml', 'Venda proibida para menores de 18 anos'],
    price: 22.9, image_url: u('1535958636474-b021ee887b13'), available: false,
  },

  // ------------------------------------------------------------- DESSERTS
  {
    id: 'demo-18', category: 'desserts', sort_order: 1,
    name: 'Brownie com Flor de Sal',
    description: 'Brownie de chocolate 70% cacau, casquinha crocante e centro úmido, finalizado com flor de sal e calda quente de chocolate.',
    ingredients: ['Chocolate 70%', 'Flor de sal', 'Calda de chocolate'],
    price: 21.9, image_url: u('1606313564200-e75d5e30476c'), available: true,
  },
  {
    id: 'demo-19', category: 'desserts', sort_order: 2,
    name: 'Cheesecake de Frutas Vermelhas',
    description: 'Cheesecake cremoso assado lentamente sobre base de biscoito amanteigado, com calda de frutas vermelhas feita na casa.',
    ingredients: ['Cream cheese', 'Biscoito amanteigado', 'Calda de frutas vermelhas'],
    price: 23.9, image_url: u('1533134242443-d4fd215305ad'), available: true,
  },
]
