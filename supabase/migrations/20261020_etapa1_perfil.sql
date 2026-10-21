-- Etapa 1: perfil, pesos y entrenos manuales.
-- Cada tabla tiene seguridad por fila (RLS): un usuario solo ve y cambia sus propias filas.

create table public.perfil (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null default 'Francisco',
  fecha_nacimiento date not null,
  estatura_cm numeric(5,1) not null check (estatura_cm between 120 and 230),
  grasa_pct numeric(4,1) check (grasa_pct between 3 and 60),
  objetivo_min_kg numeric(5,1) not null,
  objetivo_max_kg numeric(5,1) not null,
  ritmo text not null default 'moderado' check (ritmo in ('moderado', 'recomponer', 'mantener')),
  ciudad text not null default 'Quito',
  altitud_m integer not null default 2800,
  no_incluir text[] not null default '{}',
  horarios_comida jsonb not null default
    '{"desayuno":"06:45","media_manana":"10:00","almuerzo":"13:00","media_tarde":"16:00","cena":"19:00"}',
  entreno_semana time not null default '05:00',
  entreno_finde time not null default '06:30',
  dias_pesaje smallint[] not null default '{1,3,5}',
  factor_actividad numeric(3,2) not null default 1.35 check (factor_actividad between 1.1 and 1.9),
  pausa boolean not null default false,
  pausa_desde date,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (objetivo_min_kg <= objetivo_max_kg)
);

create table public.pesos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  kg numeric(5,2) not null check (kg between 30 and 250),
  origen text not null default 'manual' check (origen in ('manual', 'garmin')),
  creado_en timestamptz not null default now(),
  unique (user_id, fecha, origen)
);
create index pesos_user_fecha on public.pesos (user_id, fecha desc);

create table public.entrenos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  hora time,
  estado text not null check (estado in ('planificado', 'hecho')),
  deporte text not null check (deporte in ('rodillo', 'ruta_mtb', 'trail_correr', 'fuerza', 'descanso')),
  duracion_min integer not null default 0 check (duracion_min between 0 and 900),
  intensidad text not null default 'suave' check (intensidad in ('suave', 'moderado', 'fuerte')),
  kcal integer check (kcal between 0 and 10000),
  origen text not null default 'manual' check (origen in ('manual', 'intervals', 'trainingpeaks')),
  nota text,
  creado_en timestamptz not null default now()
);
create index entrenos_user_fecha on public.entrenos (user_id, fecha);

alter table public.perfil enable row level security;
alter table public.pesos enable row level security;
alter table public.entrenos enable row level security;

create policy "perfil propio" on public.perfil for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "pesos propios" on public.pesos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "entrenos propios" on public.entrenos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.perfil, public.pesos, public.entrenos to authenticated;
revoke all on public.perfil, public.pesos, public.entrenos from anon;
