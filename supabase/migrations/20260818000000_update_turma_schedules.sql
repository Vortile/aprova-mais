-- Update stored procedure and schedules for 2 shifts (Turma 1: 08h-10h, Turma 2: 10h-12h)

update public.eventos
set horario_geral = 'Turma 1: 08:00 às 10:00 | Turma 2: 10:00 às 12:00'
where slug = 'intensivao-enem-medicina-2026';

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
  v_horario text;
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
  v_horario := case when v_turma = 1 then '08:00 às 10:00' else '10:00 às 12:00' end;
  v_sala := case when v_turma = 1 then coalesce(v_sala_turma_1, 'Sala 1') else coalesce(v_sala_turma_2, 'Sala 2') end;

  update public.evento_inscricoes
  set status_pagamento = 'aprovado',
      forma_pagamento = p_forma_pagamento,
      gateway_payment_id = p_gateway_payment_id,
      valor_pago_centavos = p_valor_pago_centavos,
      numero_confirmacao = v_numero_confirmacao,
      turma_alocada = v_turma,
      horario_turma = v_horario,
      sala_alocada = v_sala,
      pago_em = now()
  where id = p_inscricao_id
  returning * into v_row;

  return v_row;
end;
$$;

-- Retroactively update any existing registrations to reflect the exact turma shift hours
update public.evento_inscricoes
set horario_turma = case
  when turma_alocada = 1 then '08:00 às 10:00'
  when turma_alocada = 2 then '10:00 às 12:00'
  else horario_turma
end
where turma_alocada in (1, 2);
