-- Etapa 3.1: Mi despensa. Alimentos (con marca, de la etiqueta, o genéricos) con
-- macros por 100 g y su porción, y platos habituales (combinación de alimentos
-- con gramos). Un plato puede ser el "menú tipo" de una comida.
create table public.despensa_alimentos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  marca text,
  tipo text not null default 'generico' check (tipo in ('marca', 'generico')),
  categoria text not null default 'mixto' check (categoria in ('proteina', 'carbo', 'grasa', 'mixto', 'libre')),
  carbo_100 numeric(6,2) not null check (carbo_100 between 0 and 100),
  proteina_100 numeric(6,2) not null check (proteina_100 between 0 and 100),
  grasa_100 numeric(6,2) not null check (grasa_100 between 0 and 100),
  porcion_g numeric(7,1) not null check (porcion_g > 0),
  porcion_nombre text not null,
  unidad_g numeric(7,1) check (unidad_g > 0),
  unidad_nombre text,
  origen text not null default 'manual' check (origen in ('etiqueta', 'manual', 'registro', 'chat', 'tabla')),
  creado_en timestamptz not null default now()
);
create index despensa_alimentos_user on public.despensa_alimentos (user_id);

create table public.despensa_platos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  alimentos jsonb not null default '[]'::jsonb,
  menu_tipo text check (menu_tipo in ('desayuno', 'media_manana', 'almuerzo', 'media_tarde', 'cena')),
  creado_en timestamptz not null default now()
);
create index despensa_platos_user on public.despensa_platos (user_id);
create unique index despensa_platos_menu_tipo on public.despensa_platos (user_id, menu_tipo) where menu_tipo is not null;

alter table public.despensa_alimentos enable row level security;
alter table public.despensa_platos enable row level security;
create policy "alimentos propios" on public.despensa_alimentos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "platos propios" on public.despensa_platos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.despensa_alimentos, public.despensa_platos to authenticated;
revoke all on public.despensa_alimentos, public.despensa_platos from anon;
