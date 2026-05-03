-- ============================================================
-- Three-role model: admin | professor | aluno
-- Replaces the previous two-role model (admin | aluno)
-- Role is stored in Clerk privateMetadata.role
-- ============================================================

-- 1. Expand the role check constraint to include new values first
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'professor', 'aluno'));

-- 2. Rename existing roles for any old data: student → aluno (safety net)
update public.profiles set role = 'aluno' where role = 'student';
-- Rename teacher → professor (safety net)
update public.profiles set role = 'professor' where role = 'teacher';

-- 3. Update default
alter table public.profiles
  alter column role set default 'aluno';

-- 4. Add professor_id to alunos (which professor is responsible for this student)
alter table public.alunos
  add column if not exists professor_id uuid references public.profiles(id) on delete set null;

create index if not exists alunos_professor_id_idx on public.alunos(professor_id);

-- 5. Recreate helpers with all three roles (use CREATE OR REPLACE to avoid dependency errors)
drop function if exists public.is_teacher();
drop function if exists public.is_teacher_of_aluno(uuid);

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_professor()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'professor')
  );
$$;

create or replace function public.is_professor_of_aluno(p_aluno_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.alunos
    where id = p_aluno_id
      and (professor_id = auth.uid() or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ))
  );
$$;

-- 6. Update RLS policies

-- profiles: professores can read all profiles (to see their students)
drop policy if exists "Teachers can read all profiles" on public.profiles;
drop policy if exists "Professores can read all profiles" on public.profiles;

create policy "Professores can read all profiles"
  on public.profiles for select
  using (public.is_professor());

-- alunos: professores can manage their own alunos; admins manage all
drop policy if exists "Admins manage alunos" on public.alunos;
drop policy if exists "Teachers manage own alunos" on public.alunos;
drop policy if exists "Professores manage own alunos" on public.alunos;

create policy "Admins manage alunos"
  on public.alunos for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Professores manage own alunos"
  on public.alunos for all
  using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

-- materiais: professores can manage materiais (admins already covered)
drop policy if exists "Admins manage materiais" on public.materiais;
drop policy if exists "Teachers manage materiais" on public.materiais;
drop policy if exists "Professores manage materiais" on public.materiais;

create policy "Professores manage materiais"
  on public.materiais for all
  using (public.is_professor())
  with check (public.is_professor());

-- tarefas: professores can manage tarefas
drop policy if exists "Admins manage tarefas" on public.tarefas;
drop policy if exists "Teachers manage tarefas" on public.tarefas;
drop policy if exists "Professores manage tarefas" on public.tarefas;

create policy "Professores manage tarefas"
  on public.tarefas for all
  using (public.is_professor())
  with check (public.is_professor());

-- tarefa_alunos: professores manage their alunos' entries
drop policy if exists "Admins manage tarefa_alunos" on public.tarefa_alunos;
drop policy if exists "Teachers manage tarefa_alunos" on public.tarefa_alunos;
drop policy if exists "Professores manage tarefa_alunos" on public.tarefa_alunos;

create policy "Professores manage tarefa_alunos"
  on public.tarefa_alunos for all
  using (
    public.is_professor_of_aluno(aluno_id)
  )
  with check (
    public.is_professor_of_aluno(aluno_id)
  );

-- financeiro: only admins
-- (existing policy kept as-is)
