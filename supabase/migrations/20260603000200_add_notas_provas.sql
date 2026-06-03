-- Add engajamento score to registros_lista (optional, 0-100)
ALTER TABLE public.registros_lista
  ADD COLUMN IF NOT EXISTS engajamento integer
  CHECK (engajamento IS NULL OR (engajamento >= 0 AND engajamento <= 100));

-- Create notas_provas table for official school exam grades
CREATE TABLE IF NOT EXISTS public.notas_provas (
  id            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  professor_id  uuid                     NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aluno_id      uuid                     NOT NULL REFERENCES public.alunos(id)   ON DELETE CASCADE,
  disciplina    text                     NOT NULL,
  data_prova    date                     NOT NULL,
  descricao     text                     NOT NULL DEFAULT '',
  nota          numeric(5,2)             NOT NULL,
  nota_maxima   numeric(5,2)             NOT NULL DEFAULT 10,
  created_at    timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT notas_provas_pkey PRIMARY KEY (id),
  CONSTRAINT notas_provas_nota_check CHECK (nota >= 0 AND nota <= nota_maxima),
  CONSTRAINT notas_provas_nota_maxima_check CHECK (nota_maxima > 0)
);

CREATE INDEX IF NOT EXISTS notas_provas_aluno_id_idx     ON public.notas_provas (aluno_id);
CREATE INDEX IF NOT EXISTS notas_provas_professor_id_idx ON public.notas_provas (professor_id);

-- RLS: mirror the same policy pattern as registros_lista
ALTER TABLE public.notas_provas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role bypass" ON public.notas_provas
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
