# AGENTS.md

このRepositoryは、家庭内食品在庫を管理し、Supabase・Vercel・LINE Messaging APIを使って在庫不足や変更を通知するWebアプリを管理します。

## 開発フロー

Issue → Branch → Codex実装 → Pull Request → GitHub Actions → Review → Merge → Close

masterへ直接コミットしないでください。

## 変更方針

- `index.html` の在庫UIと、`api/` の通知処理を分けて考える。
- LINE通知、Cron、Supabase Webhookの変更は重複通知・通知漏れ・Secret不一致時の挙動を確認する。
- SQL変更は適用順、既存データへの影響、ロールバック方法をPRへ記載する。
- Supabase Service Role KeyやLINE Tokenをブラウザ側へ出さない。
- Webhook / CronのSecretをログへ出力しない。
- 本番URLや環境変数名を変える場合はREADME・Vercel・Supabase側の設定影響を確認する。

## 品質ゲート

PR前に最低限以下を確認します。

1. `api/**/*.js` のJavaScript構文チェック
2. `manifest.json` / `vercel.json` のJSON構文チェック
3. `.env` 等の実SecretファイルがGit管理されていないこと
4. SQL変更時は適用・ロールバック手順をPRへ記録
5. LINE / Cron / Webhookの実環境E2Eが未実施なら、その理由をPRへ記載

## Security

以下をコミットしないこと。

- `.env` と本番Secret値
- `SUPABASE_SERVICE_ROLE_KEY`
- LINE Channel Access Token / Channel Secret
- 実ユーザーID
- Cron / Webhook Secret
- 実在庫データのバックアップ

`.env.example` には変数名だけを残します。

## Issue分類

- feature: 新機能
- bug: 不具合
- improvement: 品質・性能・運用改善
- documentation: README・設定手順

1 Issue = 1目的を基本とします。

Related: #1 #2
