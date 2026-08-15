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
2. VercelのProduction環境変数に、`.env.example` にある6項目を設定します。`SUPABASE_SERVICE_ROLE_KEY` とLINEのトークンはブラウザに公開しないでください。
3. Supabase Dashboardで `foods` テーブルのDatabase Webhookを作成します。対象イベントは `INSERT`、`UPDATE`、`DELETE`、送信先は `https://stock-list-lemon.vercel.app/api/supabase/stock-updated`、ヘッダーは `x-stock-webhook-secret: <SUPABASE_WEBHOOK_SECRET>` にします。

定期通知はVercel Cronで毎日23:00 UTC（日本時間の翌日8:00）に実行されます。
