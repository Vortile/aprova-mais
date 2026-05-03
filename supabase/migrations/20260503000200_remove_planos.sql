-- Remove planos feature entirely
-- Students keep their individual monthly_amount on the alunos table

-- Drop RLS policies on planos
drop policy if exists "Admins manage planos" on public.planos;
drop policy if exists "Aluno reads own plan" on public.planos;
drop policy if exists "Public can read active planos" on public.planos;

-- Drop FK and index from alunos
drop index if exists public.alunos_plan_id_idx;
alter table public.alunos drop column if exists plan_id;

-- Drop the planos table
drop table if exists public.planos;
