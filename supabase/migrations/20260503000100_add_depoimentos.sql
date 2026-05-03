-- Create depoimentos table for marketing testimonials (max 3 rows enforced in app layer)
create table public.depoimentos (
  id          uuid primary key default gen_random_uuid(),
  quote       text not null,
  author      text not null,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- RLS
alter table public.depoimentos enable row level security;

-- Admins can do everything
create policy "Admins can manage depoimentos"
  on public.depoimentos for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.clerk_user_id = (select (auth.jwt() ->> 'sub'))
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.clerk_user_id = (select (auth.jwt() ->> 'sub'))
        and profiles.role = 'admin'
    )
  );

-- Public (anon) can read active depoimentos for the marketing website
create policy "Public can read active depoimentos"
  on public.depoimentos for select
  to anon
  using (active = true);
