-- Etapa 6: informe semanal (lo arma Claude una vez por semana; se puede regenerar).
create table public.informes_semanales (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  semana date not null, -- lunes de la semana
  contenido jsonb not null,
  creado_en timestamptz not null default now(),
  unique (user_id, semana)
);
alter table public.informes_semanales enable row level security;
create policy "informes propios" on public.informes_semanales for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.informes_semanales to authenticated;
revoke all on public.informes_semanales from anon;
