-- Etapa 2: datos de potencia del rodillo (aditivo).
-- La intensidad del rodillo se mide por potencia, no por pulso.
alter table public.entrenos
  add column if not exists potencia_norm integer,
  add column if not exists factor_intensidad numeric(4,3),
  add column if not exists tss numeric(6,1),
  add column if not exists zonas_potencia_seg integer[];
