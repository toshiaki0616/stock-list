create extension if not exists pgcrypto;

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  barcode text null,
  location text not null default '冷蔵庫',
  status text not null default 'ある',
  egg_count integer null,
  registered_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint foods_status_check check (status in ('ある', '少ない', '無い')),
  constraint foods_location_check check (location in ('冷蔵庫', '冷凍庫', 'チューブ', 'イケアの棚', 'IHの棚')),
  constraint foods_egg_count_check check (egg_count is null or egg_count between 0 and 10)
);

create unique index if not exists foods_barcode_unique_idx
  on public.foods (barcode)
  where barcode is not null and length(trim(barcode)) > 0;

create index if not exists foods_status_updated_at_idx
  on public.foods (status, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists foods_set_updated_at on public.foods;

create trigger foods_set_updated_at
before update on public.foods
for each row
execute function public.set_updated_at();

alter table public.foods enable row level security;

drop policy if exists "foods_select_anon" on public.foods;
create policy "foods_select_anon"
on public.foods
for select
to anon
using (true);

drop policy if exists "foods_insert_anon" on public.foods;
create policy "foods_insert_anon"
on public.foods
for insert
to anon
with check (true);

drop policy if exists "foods_update_anon" on public.foods;
create policy "foods_update_anon"
on public.foods
for update
to anon
using (true)
with check (true);

drop policy if exists "foods_delete_anon" on public.foods;
create policy "foods_delete_anon"
on public.foods
for delete
to anon
using (true);
