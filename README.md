# stock-count

家庭内食品在庫管理アプリの静的配信用フォルダです。

## Vercel 配置

1. このリポジトリを Vercel に連携
2. Framework Preset は `Other`
3. Build Command は空欄
4. Output Directory も空欄
5. Deploy

## ファイル

- `index.html`: アプリ本体
- `supabase_setup.sql`: Supabase 初期設定 SQL

## LINE通知

毎朝8:00（日本時間）に「少ない」「無い」の商品をまとめて通知し、在庫データを更新した時にも通知できます。

1. LINE公式アカウントとMessaging APIチャネルを作成し、通知先ユーザーを友だち追加します。
2. VercelのProduction環境変数に、`.env.example` にある7項目を設定します。`SUPABASE_SERVICE_ROLE_KEY` とLINEのトークンはブラウザに公開しないでください。
3. Supabase Dashboardで `foods` テーブルのDatabase Webhookを作成します。対象イベントは `INSERT`、`UPDATE`、`DELETE`、送信先は `https://stock-list-lemon.vercel.app/api/supabase/stock-updated`、ヘッダーは `x-stock-webhook-secret: <SUPABASE_WEBHOOK_SECRET>` にします。
4. LINE Developers ConsoleでWebhook URLを `https://stock-list-lemon.vercel.app/api/line/webhook` に設定します。公式アカウントへ携帯のLINEからメッセージを1通送ると、Vercelログに通知先ユーザーIDが記録されます。この値を `LINE_TO_USER_ID` に設定します。

定期通知はVercel Cronで毎日23:00 UTC（日本時間の翌日8:00）に実行されます。
## LINE通知の再設定

- 毎朝8時（日本時間）に、状態が「少ない」または「無い」の商品をまとめてLINEへ送ります。
- 商品の登録・更新・削除は10分間ためてから、LINEへ1通にまとめて通知します。
- 家族にも送る場合は、`LINE_TO_USER_IDS` にLINEユーザーIDをカンマ区切りで設定します。`LINE_TO_USER_ID` は1人だけの従来設定として引き続き使えます。
- Vercelには `.env.example` にある環境変数をProduction環境へ設定します。値はGitHubに保存しません。
- Supabaseでは `supabase_setup.sql` を実行後、`pg_net` を有効化し、Vaultに `stock_webhook_secret` を作成してから `supabase_stock_notification_setup.sql` を実行します。このVault値はVercelの `SUPABASE_WEBHOOK_SECRET` と一致させます。
- 10分まとめ通知は、`supabase_stock_change_batch_setup.sql` を実行後、Vaultに `stock_cron_secret`（Vercelの `CRON_SECRET` と同じ値）を作成し、`pg_cron` を有効化して `supabase_stock_change_batch_cron.sql` を実行します。
