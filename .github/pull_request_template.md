## 変更概要

<!-- 何を、なぜ変更したか -->

## 関連Issue

Closes #

## 影響範囲

- [ ] 在庫UI / index.html
- [ ] Supabase
- [ ] LINE Webhook / 通知
- [ ] Vercel Cron
- [ ] SQL
- [ ] 環境変数 / Secret

## 検証

- [ ] GitHub Actions成功
- [ ] 在庫登録・更新・削除の基本動作
- [ ] LINE通知確認
- [ ] Cron確認
- [ ] Supabase Webhook確認
- [ ] 実環境E2Eを未実施の場合、理由を下記に記載

### 手動確認 / 未実施理由


## SQL変更時

### 適用手順

<!-- SQL変更がなければ「なし」 -->

### ロールバック手順

<!-- SQL変更がなければ「なし」 -->

## Security

- [ ] `.env` / 本番Secretを含まない
- [ ] Service Role KeyやLINE Tokenをブラウザへ公開しない
- [ ] Secret値をログへ出力しない
- [ ] 実ユーザーID・実在庫バックアップを含まない
