-- Etapa 4: plan del coach desde el calendario iCal de TrainingPeaks.

-- Cada entreno planificado guarda el identificador del evento del calendario,
-- para actualizarlo si el coach lo cambia y borrarlo si lo quita.
alter table public.entrenos add column tp_uid text;
create unique index entrenos_user_tp_uid on public.entrenos (user_id, tp_uid);

-- Lectura programada (hora de Ecuador = UTC-5): 05:45, 13:00 y 19:15.
create or replace function public.lanzar_sync_tp()
returns bigint language sql security definer set search_path = public as $$
  select net.http_post(
    url := 'https://vufjxebehmfgtafwnwac.supabase.co/functions/v1/tp-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-sync-token', (select valor from public.app_config where clave = 'sync_token')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$$;
revoke all on function public.lanzar_sync_tp() from public, anon, authenticated;

select cron.schedule('tp-0545', '45 10 * * *', $$select public.lanzar_sync_tp()$$);
select cron.schedule('tp-1300', '0 18 * * *', $$select public.lanzar_sync_tp()$$);
select cron.schedule('tp-1915', '15 0 * * *', $$select public.lanzar_sync_tp()$$);
