-- Déficit en días de descanso elegido por Francisco (kcal). Null = 450 (valor por defecto del motor).
alter table public.perfil add column if not exists deficit_descanso integer check (deficit_descanso between 0 and 750);
