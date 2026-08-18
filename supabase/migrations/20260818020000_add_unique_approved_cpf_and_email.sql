-- Clean up duplicate approved test registrations keeping only the latest one per (evento_id, cpf_aluno)
update public.evento_inscricoes
set status_pagamento = 'cancelado'
where id in (
  select id
  from (
    select id,
           row_number() over (
             partition by evento_id, cpf_aluno
             order by created_at desc
           ) as rn
    from public.evento_inscricoes
    where status_pagamento = 'aprovado'
  ) t
  where t.rn > 1
);

-- Clean up duplicate approved test registrations keeping only the latest one per (evento_id, email_aluno)
update public.evento_inscricoes
set status_pagamento = 'cancelado'
where id in (
  select id
  from (
    select id,
           row_number() over (
             partition by evento_id, email_aluno
             order by created_at desc
           ) as rn
    from public.evento_inscricoes
    where status_pagamento = 'aprovado'
  ) t
  where t.rn > 1
);

-- Enforce unique CPF and unique email per event for approved registrations
create unique index if not exists evento_inscricoes_approved_cpf_idx
  on public.evento_inscricoes (evento_id, cpf_aluno)
  where (status_pagamento = 'aprovado');

create unique index if not exists evento_inscricoes_approved_email_idx
  on public.evento_inscricoes (evento_id, email_aluno)
  where (status_pagamento = 'aprovado');

