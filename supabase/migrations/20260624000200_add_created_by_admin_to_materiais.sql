-- Add created_by_admin_id to public.materiais to track if an admin uploaded the material on behalf of a teacher.
alter table public.materiais
  add column if not exists created_by_admin_id uuid references public.profiles(id) on delete set null;

-- Add index on created_by_admin_id for query optimization
create index if not exists materiais_created_by_admin_id_idx on public.materiais(created_by_admin_id);
