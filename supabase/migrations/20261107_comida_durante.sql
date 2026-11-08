-- Comida durante el entreno (geles, bebida, barras) como momento propio.
alter table public.comidas drop constraint comidas_comida_check;
alter table public.comidas add constraint comidas_comida_check
  check (comida in ('pre_entreno', 'durante', 'desayuno', 'media_manana', 'almuerzo', 'media_tarde', 'cena', 'extra'));
