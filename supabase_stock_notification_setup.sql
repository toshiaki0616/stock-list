-- Stock-list: notify LINE whenever a food row is added, updated, or deleted.
--
-- Prerequisites:
--   1. Enable the pg_net extension in Supabase.
--   2. In Supabase Vault, create a secret named "stock_webhook_secret".
--      Its value must match Vercel's SUPABASE_WEBHOOK_SECRET.
--
-- Do not place the actual secret value in this file.

create extension if not exists pg_net with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.notify_stock_update()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  webhook_secret text;
  payload jsonb;
begin
  select decrypted_secret
    into webhook_secret
  from vault.decrypted_secrets
  where name = 'stock_webhook_secret'
  limit 1;

  if webhook_secret is null then
    raise exception 'stock_webhook_secret is missing';
  end if;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', case when TG_OP = 'DELETE' then null else to_jsonb(NEW) end,
    'old_record', case when TG_OP = 'INSERT' then null else to_jsonb(OLD) end
  );

  perform net.http_post(
    url := 'https://stock-list-lemon.vercel.app/api/supabase/stock-updated',
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-stock-webhook-secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  );

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

revoke all on function private.notify_stock_update() from public;

drop trigger if exists stock_update_line_notify on public.foods;

create trigger stock_update_line_notify
after insert or update or delete
on public.foods
for each row
execute function private.notify_stock_update();
