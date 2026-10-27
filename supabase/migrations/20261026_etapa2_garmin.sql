-- Etapa 2: datos de Garmin (API personal) y sincronización programada.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Bienestar de cada día, tal como lo entrega Garmin. El semáforo de
-- recuperación se calcula en la app (lib/recuperacion.ts) con pruebas.
create table public.bienestar_diario (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  sueno_seg integer,
  sueno_profundo_seg integer,
  sueno_rem_seg integer,
  sueno_puntaje smallint,
  despertares smallint,
  hrv_noche smallint,
  hrv_semana smallint,
  hrv_estado text,
  hrv_base_bajo smallint,
  hrv_base_alto smallint,
  fc_reposo smallint,
  body_battery_max smallint,
  body_battery_min smallint,
  estres_promedio smallint,
  actualizado_en timestamptz not null default now(),
  primary key (user_id, fecha)
);

-- Entrenos de Garmin en la misma tabla de entrenos.
alter table public.entrenos drop constraint entrenos_origen_check;
alter table public.entrenos add constraint entrenos_origen_check
  check (origen in ('manual', 'garmin', 'intervals', 'trainingpeaks'));
alter table public.entrenos
  add column garmin_id bigint,
  add column tipo_garmin text,
  add column nombre text,
  add column carga numeric(6,1),
  add column fc_media smallint,
  add column zonas_seg integer[],
  add column distancia_m integer,
  add column efecto_aerobico numeric(3,1);
create unique index entrenos_garmin_id on public.entrenos (user_id, garmin_id) where garmin_id is not null;

-- Registro de cada sincronización: si funcionó, cuántos registros trajo y el error si falló.
create table public.sincronizaciones (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fuente text not null default 'garmin',
  inicio timestamptz not null default now(),
  fin timestamptz,
  ok boolean,
  dias integer,
  registros integer,
  detalle text
);
create index sincronizaciones_user_inicio on public.sincronizaciones (user_id, inicio desc);

-- Vencimiento de la llave personal de Garmin, para avisar un mes antes.
alter table public.perfil add column garmin_llave_vence date;

-- Configuración interna: solo la lee el servidor (RLS sin políticas).
create table public.app_config (clave text primary key, valor text not null);
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;
insert into public.app_config (clave, valor) values ('sync_token', encode(extensions.gen_random_bytes(24), 'hex'));

alter table public.bienestar_diario enable row level security;
alter table public.sincronizaciones enable row level security;
create policy "bienestar propio" on public.bienestar_diario for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "sincronizaciones propias (lectura)" on public.sincronizaciones for select to authenticated
  using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.bienestar_diario to authenticated;
grant select on public.sincronizaciones to authenticated;
revoke all on public.bienestar_diario, public.sincronizaciones from anon;

-- Sincronización programada (hora de Ecuador = UTC-5): 06:35, 07:30, 12:00 y 20:00.
create or replace function public.lanzar_sync_garmin(p_dias integer default 3)
returns bigint language sql security definer set search_path = public as $$
  select net.http_post(
    url := 'https://vufjxebehmfgtafwnwac.supabase.co/functions/v1/garmin-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-sync-token', (select valor from public.app_config where clave = 'sync_token')),
    body := jsonb_build_object('dias', p_dias),
    timeout_milliseconds := 60000
  );
$$;
revoke all on function public.lanzar_sync_garmin(integer) from public, anon, authenticated;

select cron.schedule('garmin-0635', '35 11 * * *', $$select public.lanzar_sync_garmin(3)$$);
select cron.schedule('garmin-0730', '30 12 * * *', $$select public.lanzar_sync_garmin(3)$$);
select cron.schedule('garmin-1200', '0 17 * * *', $$select public.lanzar_sync_garmin(3)$$);
select cron.schedule('garmin-2000', '0 1 * * *', $$select public.lanzar_sync_garmin(3)$$);
