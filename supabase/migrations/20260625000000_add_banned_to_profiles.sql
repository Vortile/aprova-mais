-- Add banned column to profiles table to track Clerk's banned status
alter table public.profiles
  add column if not exists banned boolean not null default false;
