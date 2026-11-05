-- Momentos extra en el registro de comidas: antes de entrenar y extras fuera de horario.
alter table public.comidas drop constraint if exists comidas_comida_check;
alter table public.comidas add constraint comidas_comida_check check (comida in ('pre_entreno', 'desayuno', 'media_manana', 'almuerzo', 'media_tarde', 'cena', 'extra'));
-- Umbrales de entrenamiento copiados de TrainingPeaks (FTP, umbrales de pulso y zonas).
alter table public.perfil add column if not exists umbrales jsonb;
