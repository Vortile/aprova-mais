-- Create aluno_contatos table
CREATE TABLE public.aluno_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text NOT NULL,
  papel text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.aluno_contatos ENABLE ROW LEVEL SECURITY;

-- Create index on aluno_id for faster lookups
CREATE INDEX aluno_contatos_aluno_id_idx ON public.aluno_contatos(aluno_id);

-- Define policies
CREATE POLICY "Admins manage aluno_contatos"
  ON public.aluno_contatos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Professores can read relevant aluno_contatos"
  ON public.aluno_contatos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alunos
      WHERE id = aluno_contatos.aluno_id
        AND (professor_id = auth.uid() OR public.is_admin())
    )
  );
