-- Etapa 3: registro de comidas (foto o texto + IA, o repetir una anterior).
-- Cada registro guarda los alimentos con gramos, medida casera y macros, y
-- los totales para sumar rápido. La foto no se guarda: solo lo que se leyó.
create table public.comidas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  comida text not null check (comida in ('desayuno', 'media_manana', 'almuerzo', 'media_tarde', 'cena')),
  origen text not null check (origen in ('foto', 'texto', 'repetida')),
  descripcion text,
  alimentos jsonb not null default '[]'::jsonb,
  carbo_g numeric(6,1) not null default 0 check (carbo_g >= 0),
  proteina_g numeric(6,1) not null default 0 check (proteina_g >= 0),
  grasa_g numeric(6,1) not null default 0 check (grasa_g >= 0),
  kcal integer not null default 0 check (kcal between 0 and 10000),
  creado_en timestamptz not null default now()
);
create index comidas_user_fecha on public.comidas (user_id, fecha);

alter table public.comidas enable row level security;
create policy "comidas propias" on public.comidas for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.comidas to authenticated;
revoke all on public.comidas from anon;
