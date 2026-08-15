-- Stock-list: queue item changes so they can be sent as one LINE message.
-- This table has RLS enabled and no public policies. Only Vercel's server-side
-- Supabase secret key can access it.

create table if not exists public.stock_notification_queue (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('登録', '更新', '削除')),
  item_name text not null,
  item_location text,
  item_status text,
  created_at timestamptz not null default timezone('utc', now()),
  delivered_at timestamptz
);

create index if not exists stock_notification_queue_pending_idx
  on public.stock_notification_queue (created_at)
  where delivered_at is null;

alter table public.stock_notification_queue enable row level security;
