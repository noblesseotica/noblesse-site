# Ouro Negro Burger House — cardápio digital + pedidos via WhatsApp

Site de hamburgueria premium: cardápio digital (vindo do Supabase), carrinho persistente,
finalização do pedido pelo WhatsApp e painel administrativo em `/admin`.

**Stack:** React + Vite + Tailwind CSS v4 · Supabase (Postgres, Storage, Auth) · Netlify

> O nome "Ouro Negro", endereço, horários e redes sociais são fictícios — edite tudo em
> `src/config/site.js`.

---

## 1. Rodar localmente

```bash
cd hamburgueria
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase
npm run dev                  # http://localhost:5173
```

Sem o `.env.local`, o site abre em **modo demonstração** (usa `src/data/demoMenu.js`) —
útil para ver o layout antes de configurar o banco. O `/admin` exige o Supabase.

## 2. Configurar o Supabase (≈10 minutos)

1. Crie um projeto em <https://supabase.com> (região São Paulo, de preferência).
2. **SQL Editor → New query**: cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   Isso cria:
   - tabela `menu_items` (id, category, name, description, ingredients[], price, image_url, available, sort_order, badge);
   - tabela `admin_users` + função `is_admin()`;
   - políticas RLS: leitura pública do cardápio, escrita só para administradores;
   - bucket público `menu-images` no Storage (máx. 5 MB, só imagens) com escrita só para administradores.
3. **SQL Editor → New query**: cole [`supabase/seed.sql`](supabase/seed.sql) e rode (cardápio de exemplo, 19 itens).
4. **Authentication → Users → Add user → Create new user**: e-mail e senha do dono, marque *Auto Confirm User*.
5. Transforme esse usuário em administrador (SQL Editor):
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'dono@hamburgueria.com.br'
   on conflict do nothing;
   ```
6. **Recomendado:** *Authentication → Sign In / Providers → desative "Allow new users to sign up"*.
   (Mesmo sem isso, contas novas não conseguem editar nada — só quem está em `admin_users`.)
7. **Project Settings → API**: copie a *Project URL* e a chave *anon public*.

## 3. Deploy no Netlify

1. *Add new site → Import an existing project* → escolha este repositório.
2. Como o projeto está na pasta `hamburgueria/`, em **Base directory** coloque `hamburgueria`.
   Build command e publish directory já vêm do `netlify.toml` (`npm run build` / `dist`).
3. **Site configuration → Environment variables**, adicione:

   | Variável | Valor |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Project URL do Supabase |
   | `VITE_SUPABASE_ANON_KEY` | chave *anon public* |
   | `VITE_WHATSAPP_NUMBER` | número que recebe os pedidos, só dígitos com DDI+DDD (ex.: `5511987654321`) |

4. *Deploys → Trigger deploy*. Variáveis `VITE_*` entram no build, então **qualquer mudança
   nelas exige um novo deploy**.

O `netlify.toml` já tem o redirect de SPA (`/* → /index.html 200`), então `/admin` funciona ao recarregar.

> A chave *anon* é pública por natureza (vai para o navegador). Quem protege os dados são as
> políticas RLS do `schema.sql`. **Nunca** use a chave `service_role` no frontend.

## 4. Usando o painel `/admin`

- Entre com o e-mail/senha criados no passo 2.4 (há um link discreto "Área restrita" no rodapé).
- **Adicionar novo item**: nome, categoria, preço, descrição, ingredientes (digite e aperte Enter),
  selo opcional ("Mais pedido", "Veggie"…), ordem de exibição e foto.
- **Foto**: toque/arraste. Ela é reduzida no próprio navegador (máx. 1600px, WebP) e enviada ao
  Supabase Storage; a URL pública é salva no item. Ao trocar ou excluir, a foto antiga é apagada.
- **Disponível/Esgotado**: toque no selo verde/vermelho da lista. Itens esgotados aparecem no site
  em cinza com botão desabilitado, e saem automaticamente de carrinhos já montados.

## 5. Como funciona o pedido

1. Cliente adiciona itens → carrinho (drawer lateral) com quantidade, observação por item e remover.
   O carrinho fica salvo no `localStorage`.
2. "Finalizar Pedido" → nome, telefone, delivery/retirada, endereço (rua, número, bairro,
   complemento, referência) e pagamento (Pix/Cartão/Dinheiro com troco — informativo).
3. O site monta a mensagem formatada e abre `https://wa.me/<número>?text=<encodeURIComponent(msg)>`:
   app no celular, WhatsApp Web no computador. Sem API paga.

Exemplo de mensagem gerada:

```
*NOVO PEDIDO — OURO NEGRO BURGER HOUSE*

*Cliente:* Maria Souza
*Telefone:* (11) 98765-4321

*ITENS DO PEDIDO*
• 2x Smash Ouro — R$ 77,80
   _(R$ 38,90 cada)_
   ↳ Obs: sem cebola
• 1x Ouro Negro Trufado — R$ 64,90

*TOTAL: R$ 142,70*

*Entrega:* 🛵 Delivery
*Endereço:* Rua das Flores, 42
*Bairro:* Pinheiros
_Taxa de entrega a confirmar pelo atendente._

*Pagamento:* Dinheiro — troco para R$ 150
```

## 6. Fotos 📸

As fotos atuais são **placeholders do Unsplash** (licença gratuita). Onde trocar:

- **Itens do cardápio** → pelo painel `/admin` (upload direto para o Storage).
- **Hero** → constante `HERO_IMAGE` em `src/components/Hero.jsx` (há instruções para usar vídeo).
- **Demo local** → `src/data/demoMenu.js`.

**Recomendação forte ao cliente:** contratar um fotógrafo de alimentos profissional. Foto
própria, com a mesma luz e fundo escuro em todos os itens, é o que mais eleva a percepção de
valor do site — mais do que qualquer animação.

## Estrutura

```
hamburgueria/
├── netlify.toml            # build + redirect SPA
├── .env.example            # variáveis de ambiente
├── supabase/
│   ├── schema.sql          # tabelas, RLS, bucket, políticas
│   └── seed.sql            # cardápio de exemplo
└── src/
    ├── config/site.js      # nome, endereço, horários, redes, categorias
    ├── context/CartContext.jsx   # carrinho + localStorage
    ├── hooks/useMenu.js    # leitura do cardápio (Supabase)
    ├── lib/                # supabase, whatsapp (mensagem), adminApi (CRUD + upload)
    ├── components/         # Hero, Features, Menu, ProductCard, HowItWorks, Location, Footer,
    │                       # CartButton, CartDrawer, Checkout, admin/*
    └── pages/              # Home, Admin (carregado sob demanda)
```

## Performance

- Imagens com `loading="lazy"` e redimensionadas por tamanho de card (parâmetros do Unsplash;
  fotos do admin já são comprimidas no upload).
- Painel admin em chunk separado (o cliente não baixa esse código).
- React e Supabase em chunks próprios, com cache de 1 ano (`netlify.toml`).
- Animações respeitam `prefers-reduced-motion`.
