-- Relatório Pedagógico Semanal (Form 1)
-- Filled by professors to report weekly activity per student

create table public.relatorios_pedagogicos (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.profiles(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  disciplinas text[] not null default '{}',
  carga_horaria text not null default '',
  status_conteudo text not null check (
    status_conteudo in (
      'Em dia com o cronograma do colégio',
      'Atrasado (precisa de atenção ou aulas extras)',
      'Conteúdo visto (Semana de Revisão/Exercícios)',
      'Outro'
    )
  ),
  created_at timestamptz not null default now()
);

alter table public.relatorios_pedagogicos enable row level security;

create index relatorios_pedagogicos_professor_id_idx on public.relatorios_pedagogicos(professor_id);
create index relatorios_pedagogicos_aluno_id_idx on public.relatorios_pedagogicos(aluno_id);

-- Professors can manage their own reports; admins can manage all
create policy "Professores manage own relatorios"
  on public.relatorios_pedagogicos for all
  using (professor_id = auth.uid() or public.is_admin())
  with check (professor_id = auth.uid() or public.is_admin());

-- Registro de Lista de Atividade (Form 2)
-- Professors log exercise list results per student

create table public.registros_lista (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.profiles(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  disciplina text not null,
  data_aula date not null,
  conteudo_ministrado text not null default '',
  quantidade_acertos integer not null check (quantidade_acertos >= 0),
  total_questoes integer not null check (total_questoes > 0),
  created_at timestamptz not null default now(),
  check (quantidade_acertos <= total_questoes)
);

alter table public.registros_lista enable row level security;

create index registros_lista_professor_id_idx on public.registros_lista(professor_id);
create index registros_lista_aluno_id_idx on public.registros_lista(aluno_id);

-- Professors can manage their own records; admins can manage all
create policy "Professores manage own registros_lista"
  on public.registros_lista for all
  using (professor_id = auth.uid() or public.is_admin())
  with check (professor_id = auth.uid() or public.is_admin());
