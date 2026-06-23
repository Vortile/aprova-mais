-- Add data_semana column to relatorios_pedagogicos
ALTER TABLE public.relatorios_pedagogicos
  ADD COLUMN IF NOT EXISTS data_semana date;

CREATE INDEX IF NOT EXISTS relatorios_pedagogicos_aluno_id_data_semana_idx
  ON public.relatorios_pedagogicos (aluno_id, data_semana);
