-- Intensivão ENEM Medicina 2026: eventos presenciais avulsos, inscrições,
-- analytics próprio, check-in nos sábados e log da régua de e-mails.

-- ============================================================
-- Tables
-- ============================================================

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titulo text not null,
  descricao text,
  preco_centavos integer not null,
  limite_total_vagas integer not null,
  capacidade_por_turma integer not null,
  local_nome text not null,
  local_endereco text not null,
  local_contato text not null,
  horario_geral text,
  sala_turma_1 text,
  sala_turma_2 text,
  data_sabado_1 date,
  data_sabado_2 date,
  data_sabado_3 date,
  data_sabado_4 date,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.evento_inscricoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  numero_inscricao bigint generated always as identity,
  session_id text,
  nome_aluno text not null,
  email_aluno text not null,
  whatsapp_aluno text not null,
  cpf_aluno text not null,
  data_nascimento date not null,
  idade_aluno integer not null,
  serie_atual text not null check (serie_atual in ('1_ano', '2_ano', '3_ano', 'concluido')),
  nome_responsavel text,
  whatsapp_responsavel text,
  restricoes_medicas text,
  status_pagamento text not null default 'pendente' check (status_pagamento in ('pendente', 'aprovado', 'recusado', 'cancelado')),
  forma_pagamento text check (forma_pagamento in ('pix', 'credit_card')),
  gateway text not null default 'mercadopago',
  gateway_payment_id text,
  numero_confirmacao integer,
  turma_alocada integer check (turma_alocada in (1, 2)),
  horario_turma text,
  sala_alocada text,
  codigo_ingresso uuid not null default gen_random_uuid(),
  valor_pago_centavos integer not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  pago_em timestamptz
);

create table public.evento_analytics (
  id uuid primary key default gen_random_uuid(),
  evento_slug text not null,
  tipo_evento text not null check (tipo_evento in ('page_view', 'cta_click', 'form_started', 'form_submitted', 'pix_generated', 'card_started', 'payment_approved')),
  session_id text not null,
  inscricao_id uuid references public.evento_inscricoes(id) on delete set null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  created_at timestamptz not null default now()
);

create table public.evento_checkins (
  id uuid primary key default gen_random_uuid(),
  inscricao_id uuid not null references public.evento_inscricoes(id) on delete cascade,
  dia_numero integer not null check (dia_numero in (1, 2, 3, 4)),
  checkin_at timestamptz not null default now(),
  validado_por uuid references public.profiles(id),
  unique (inscricao_id, dia_numero)
);

create table public.evento_email_log (
  id uuid primary key default gen_random_uuid(),
  inscricao_id uuid not null references public.evento_inscricoes(id) on delete cascade,
  tipo_email text not null check (tipo_email in (
    'ticket_confirmacao', 'guia_preparacao', 'mensagem_professor', 'mapa_tri',
    'checklist_evento', 'devolutiva_dia1', 'devolutiva_dia2', 'devolutiva_dia3', 'pos_evento'
  )),
  enviado_em timestamptz not null default now(),
  unique (inscricao_id, tipo_email)
);

-- ============================================================
-- Indexes
-- ============================================================

create unique index evento_inscricoes_gateway_payment_id_idx
  on public.evento_inscricoes(gateway_payment_id) where gateway_payment_id is not null;
create index evento_inscricoes_evento_id_idx on public.evento_inscricoes(evento_id);
create index evento_inscricoes_status_idx on public.evento_inscricoes(status_pagamento);
create index evento_inscricoes_codigo_ingresso_idx on public.evento_inscricoes(codigo_ingresso);
create index evento_analytics_evento_slug_idx on public.evento_analytics(evento_slug);
create index evento_analytics_tipo_evento_idx on public.evento_analytics(tipo_evento);
create index evento_analytics_session_id_idx on public.evento_analytics(session_id);

-- ============================================================
-- Atomic seat allocation (turma 1: vagas 1-13, turma 2: vagas 14-26)
-- Both turmas share the same schedule (horario_geral); they are
-- distinguished by which sala (room) they are assigned to.
-- ============================================================

create or replace function public.confirmar_pagamento_evento(
  p_inscricao_id uuid,
  p_gateway_payment_id text,
  p_forma_pagamento text,
  p_valor_pago_centavos integer
)
returns public.evento_inscricoes
language plpgsql
security definer set search_path = public
as $$
declare
  v_evento_id uuid;
  v_limite integer;
  v_capacidade_turma integer;
  v_horario_geral text;
  v_sala_turma_1 text;
  v_sala_turma_2 text;
  v_aprovados integer;
  v_numero_confirmacao integer;
  v_turma integer;
  v_sala text;
  v_row public.evento_inscricoes;
begin
  select evento_id into v_evento_id
  from public.evento_inscricoes
  where id = p_inscricao_id
  for update;

  if v_evento_id is null then
    raise exception 'inscricao_nao_encontrada';
  end if;

  -- Idempotency: webhooks may retry, never double-count an already approved seat.
  select * into v_row from public.evento_inscricoes where id = p_inscricao_id;
  if v_row.status_pagamento = 'aprovado' then
    return v_row;
  end if;

  -- Lock the evento row so concurrent confirmations are serialized (no overselling).
  select limite_total_vagas, capacidade_por_turma, horario_geral, sala_turma_1, sala_turma_2
  into v_limite, v_capacidade_turma, v_horario_geral, v_sala_turma_1, v_sala_turma_2
  from public.eventos
  where id = v_evento_id
  for update;

  select count(*) into v_aprovados
  from public.evento_inscricoes
  where evento_id = v_evento_id and status_pagamento = 'aprovado';

  if v_aprovados >= v_limite then
    raise exception 'vagas_esgotadas';
  end if;

  v_numero_confirmacao := v_aprovados + 1;
  v_turma := case when v_numero_confirmacao <= v_capacidade_turma then 1 else 2 end;
  v_sala := case when v_turma = 1 then v_sala_turma_1 else v_sala_turma_2 end;

  update public.evento_inscricoes
  set status_pagamento = 'aprovado',
      forma_pagamento = p_forma_pagamento,
      gateway_payment_id = p_gateway_payment_id,
      valor_pago_centavos = p_valor_pago_centavos,
      numero_confirmacao = v_numero_confirmacao,
      turma_alocada = v_turma,
      horario_turma = v_horario_geral,
      sala_alocada = v_sala,
      pago_em = now()
  where id = p_inscricao_id
  returning * into v_row;

  return v_row;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.eventos enable row level security;
alter table public.evento_inscricoes enable row level security;
alter table public.evento_analytics enable row level security;
alter table public.evento_checkins enable row level security;
alter table public.evento_email_log enable row level security;

create policy "Admins manage eventos"
  on public.eventos for all
  using (public.is_admin());

create policy "Admins manage evento_inscricoes"
  on public.evento_inscricoes for all
  using (public.is_admin());

create policy "Admins manage evento_analytics"
  on public.evento_analytics for all
  using (public.is_admin());

create policy "Admins manage evento_checkins"
  on public.evento_checkins for all
  using (public.is_admin());

create policy "Admins manage evento_email_log"
  on public.evento_email_log for all
  using (public.is_admin());

-- ============================================================
-- Seed: Intensivão ENEM Medicina 2026
-- ============================================================

insert into public.eventos (
  slug, titulo, descricao, preco_centavos, limite_total_vagas, capacidade_por_turma,
  local_nome, local_endereco, local_contato, horario_geral, sala_turma_1, sala_turma_2,
  data_sabado_1, data_sabado_2, data_sabado_3, data_sabado_4
) values (
  'intensivao-enem-medicina-2026',
  'Intensivão ENEM 2026 — Foco Medicina',
  '4 sábados presenciais de imersão em Manaus, focados na TRI de Medicina.',
  50000,
  26,
  13,
  'Open Laranjeiras Gallery',
  'Av. Prof. Nilton Lins, 1984 – Flores, Manaus - AM, 69058-300',
  '(92) 98158-1955',
  '08:00 às 12:00',
  'Sala HY',
  null,
  '2026-09-12',
  '2026-09-19',
  '2026-09-26',
  '2026-10-03'
)
on conflict (slug) do nothing;
