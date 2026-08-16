-- Correção: o Intensivão tem apenas 3 sábados presenciais (12/09, 19/09,
-- 26/09), não 4. A 4ª data (03/10) e as estruturas de turma/e-mail
-- associadas a ela foram cadastradas por engano na migração anterior.

update public.eventos
set descricao = '3 sábados presenciais de imersão em Manaus, focados na TRI de Medicina.'
where slug = 'intensivao-enem-medicina-2026';

alter table public.eventos drop column if exists data_sabado_4;

-- Revert evento_checkins.dia_numero back to (1, 2, 3), whatever the
-- auto-generated constraint name currently is.
do $$
declare
  v_constraint_name text;
begin
  select conname into v_constraint_name
  from pg_constraint
  where conrelid = 'public.evento_checkins'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%dia_numero%';

  if v_constraint_name is not null then
    execute format('alter table public.evento_checkins drop constraint %I', v_constraint_name);
  end if;
end $$;

alter table public.evento_checkins
  add constraint evento_checkins_dia_numero_check check (dia_numero in (1, 2, 3));

-- Revert evento_email_log.tipo_email back to the 3-sábado set (drop
-- 'devolutiva_dia3', 'pos_evento' now fires after sábado 3 again).
do $$
declare
  v_constraint_name text;
begin
  select conname into v_constraint_name
  from pg_constraint
  where conrelid = 'public.evento_email_log'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%tipo_email%';

  if v_constraint_name is not null then
    execute format('alter table public.evento_email_log drop constraint %I', v_constraint_name);
  end if;
end $$;

alter table public.evento_email_log
  add constraint evento_email_log_tipo_email_check check (tipo_email in (
    'ticket_confirmacao', 'guia_preparacao', 'mensagem_professor', 'mapa_tri',
    'checklist_evento', 'devolutiva_dia1', 'devolutiva_dia2', 'pos_evento'
  ));
