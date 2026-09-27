-- =============================================================================
-- OURO NEGRO BURGER HOUSE — ESTRUTURA DO BANCO (Supabase / Postgres)
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run.
-- Depois rode o seed.sql para popular o cardápio de demonstração.
-- É seguro rodar de novo (idempotente).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabela do cardápio
-- ---------------------------------------------------------------------------
create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  category     text not null
               check (category in ('smash', 'signature', 'sides', 'drinks', 'desserts')),
  name         text not null check (char_length(name) between 1 and 120),
  description  text not null default '',
  ingredients  text[] not null default '{}',
  price        numeric(10, 2) not null check (price >= 0),
  image_url    text,
  available    boolean not null default true,
  -- extras opcionais usados pelo site
  sort_order   integer not null default 0,        -- ordem dentro da categoria
  badge        text,                              -- selo no card: "Mais pedido", "Veggie"...
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists menu_items_category_idx
  on public.menu_items (category, sort_order);

-- Atualiza updated_at automaticamente
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists menu_items_touch on public.menu_items;
create trigger menu_items_touch
  before update on public.menu_items
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Quem é administrador
--    Só usuários listados aqui podem alterar o cardápio. Isso impede que
--    qualquer pessoa que crie uma conta no seu projeto edite os itens.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

drop policy if exists "admin lê a própria linha" on public.admin_users;
create policy "admin lê a própria linha" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Segurança do cardápio (Row Level Security)
--    - Qualquer visitante pode LER (o site público precisa mostrar o cardápio)
--    - Só administradores podem criar / editar / excluir
-- ---------------------------------------------------------------------------
alter table public.menu_items enable row level security;

drop policy if exists "cardápio é público" on public.menu_items;
create policy "cardápio é público" on public.menu_items
  for select using (true);

drop policy if exists "admin insere" on public.menu_items;
create policy "admin insere" on public.menu_items
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin edita" on public.menu_items;
create policy "admin edita" on public.menu_items
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin exclui" on public.menu_items;
create policy "admin exclui" on public.menu_items
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Storage: bucket público para as fotos dos itens
--    Leitura pública (URL direta na <img>), escrita só para administradores.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images', 'menu-images', true, 5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos: leitura pública" on storage.objects;
create policy "fotos: leitura pública" on storage.objects
  for select using (bucket_id = 'menu-images');

drop policy if exists "fotos: admin envia" on storage.objects;
create policy "fotos: admin envia" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "fotos: admin atualiza" on storage.objects;
create policy "fotos: admin atualiza" on storage.objects
  for update to authenticated using (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "fotos: admin exclui" on storage.objects;
create policy "fotos: admin exclui" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-images' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Tornar um usuário administrador
--    Primeiro crie o usuário em Authentication > Users > Add user
--    (marque "Auto Confirm User"). Depois rode, trocando o e-mail:
--
--    insert into public.admin_users (user_id)
--    select id from auth.users where email = 'dono@hamburgueria.com.br'
--    on conflict do nothing;
-- ---------------------------------------------------------------------------
