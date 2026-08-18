-- Atualiza o Intensivao para o formato confirmado pelo professor:
-- 4 sabados, 2h por encontro, 1h de Fisica + 1h de Matematica.

alter table public.eventos
  add column if not exists data_sabado_4 date;

update public.eventos
set descricao = '4 sabados presenciais de imersao em Manaus, com 1h de Fisica e 1h de Matematica em cada encontro.',
    data_sabado_1 = '2026-09-12',
    data_sabado_2 = '2026-09-19',
    data_sabado_3 = '2026-09-26',
    data_sabado_4 = '2026-10-03',
    horario_geral = '08:00 as 12:00',
    sala_turma_1 = 'Sala HY'
where slug = 'intensivao-enem-medicina-2026';

alter table public.evento_checkins
  drop constraint if exists evento_checkins_dia_numero_check;

alter table public.evento_checkins
  add constraint evento_checkins_dia_numero_check check (dia_numero in (1, 2, 3, 4));

alter table public.evento_email_log
  drop constraint if exists evento_email_log_tipo_email_check;

alter table public.evento_email_log
  add constraint evento_email_log_tipo_email_check check (tipo_email in (
    'ticket_confirmacao', 'guia_preparacao', 'mensagem_professor', 'mapa_tri',
    'checklist_evento', 'devolutiva_dia1', 'devolutiva_dia2', 'devolutiva_dia3', 'pos_evento'
  ));
