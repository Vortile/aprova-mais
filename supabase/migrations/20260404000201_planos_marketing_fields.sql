-- Add marketing display fields to planos
alter table public.planos
  add column if not exists badge text,
  add column if not exists features text[] not null default '{}',
  add column if not exists is_featured boolean not null default false,
  add column if not exists sort_order integer not null default 0;

-- Allow public (anon) to read active plans for the marketing website
drop policy if exists "Public can read active planos" on public.planos;
create policy "Public can read active planos"
  on public.planos for select
  to anon
  using (active = true);
