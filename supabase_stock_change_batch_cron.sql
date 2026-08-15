-- Prerequisites:
--   1. Enable pg_cron and pg_net in Supabase Extensions.
--   2. In Supabase Vault, create a secret named "stock_cron_secret".
--      Its value must match Vercel's CRON_SECRET.
--
-- This replaces any previous job with the same name and runs every 10 minutes.

select cron.unschedule(jobid)
from cron.job
where jobname = 'stock-change-summary-every-10-minutes';

select cron.schedule(
  'stock-change-summary-every-10-minutes',
  '*/10 * * * *',
  $cron$
    select net.http_post(
      url := 'https://stock-list-lemon.vercel.app/api/cron/stock-change-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'stock_cron_secret'
          limit 1
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 5000
    );
  $cron$
);
