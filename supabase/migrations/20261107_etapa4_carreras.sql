-- Etapa 4: carreras que Francisco carga en la app (TrainingPeaks solo comparte
-- 2 semanas). Si la carrera aparece en el calendario de TP, se une por tp_uid.
create table public.carreras (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  fecha date not null,
  deporte text not null default 'trail' check (deporte in ('trail', 'ciclismo', 'aventura')),
  distancia_km numeric(5,1) check (distancia_km between 1 and 1000),
  desnivel_m integer check (desnivel_m between 0 and 30000),
  horas_min numeric(4,1) not null check (horas_min between 0.5 and 72),
  horas_max numeric(4,1) not null check (horas_max between 0.5 and 72),
  prioridad text not null default 'A' check (prioridad in ('A', 'B')),
  tp_uid text,
  creado_en timestamptz not null default now(),
  check (horas_min <= horas_max)
);
create index carreras_user_fecha on public.carreras (user_id, fecha);

alter table public.carreras enable row level security;
create policy "carreras propias" on public.carreras for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.carreras to authenticated;
revoke all on public.carreras from anon;
