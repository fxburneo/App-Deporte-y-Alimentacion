-- Etapa 7: avisos en el iPhone (Web Push).

-- Suscripciones de cada dispositivo (el iPhone con la app instalada).
create table public.push_suscripciones (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  creado_en timestamptz not null default now()
);
alter table public.push_suscripciones enable row level security;
create policy "suscripciones propias" on public.push_suscripciones for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.push_suscripciones to authenticated;
revoke all on public.push_suscripciones from anon;

-- Qué avisos quiere recibir (maqueta 4.1).
alter table public.perfil add column avisos jsonb not null default
  '{"resumen": true, "peso": true, "plan_cambia": true, "registrar": true, "manana": true, "dormir": true, "fatiga": true}';

-- La clave pública VAPID (la privada nunca sale de app_config).
create or replace function public.vapid_publica()
returns text language sql security definer set search_path = public stable as $$
  select valor from public.app_config where clave = 'vapid_publica';
$$;
revoke all on function public.vapid_publica() from public, anon;
grant execute on function public.vapid_publica() to authenticated;

-- Envío programado (hora de Ecuador = UTC-5).
create or replace function public.lanzar_aviso(p_tipo text)
returns bigint language sql security definer set search_path = public as $$
  select net.http_post(
    url := 'https://vufjxebehmfgtafwnwac.supabase.co/functions/v1/avisos',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-sync-token', (select valor from public.app_config where clave = 'sync_token')),
    body := jsonb_build_object('tipo', p_tipo),
    timeout_milliseconds := 30000
  );
$$;
revoke all on function public.lanzar_aviso(text) from public, anon, authenticated;

select cron.schedule('aviso-peso', '0 10 * * 1,3,5', $$select public.lanzar_aviso('peso')$$);          -- 05:00 L·M·V
select cron.schedule('aviso-resumen', '40 11 * * *', $$select public.lanzar_aviso('resumen')$$);     -- 06:40
select cron.schedule('aviso-registrar', '0 20 * * *', $$select public.lanzar_aviso('registrar')$$);  -- 15:00
select cron.schedule('aviso-manana', '30 0 * * *', $$select public.lanzar_aviso('manana')$$);        -- 19:30
select cron.schedule('aviso-dormir', '0 2 * * *', $$select public.lanzar_aviso('dormir')$$);         -- 21:00
