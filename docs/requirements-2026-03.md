# Samurai Card Hub 追加要件 (2026-03)

## ブランチ戦略
- US+EU共通 → `master`で実装 → `eu`にマージ
- EU専用 → `eu`ブランチで直接実装
- **前提**: `eu`が`master`より3コミット遅れ → 先にマージ

## 要件一覧

### Phase 1: マージ + バグ修正（即着手）

#### 0. eu ← master マージ
- `eu`ブランチに`master`の最新3コミットをマージ
- コンフリクト解決後、動作確認

#### E. Confirm Order + productTypeバグ修正 [master → eu]
- **問題1**: `checkout/actions.ts`の`calculateShipping()`で、カートアイテムに`productType`が含まれない場合`shipping: 0`(FREE)になる
- **修正**: カートアイテムマッピングに`productType`を必ず含める
- **問題2**: Server Actionキャッシュ不整合（コンテナ再起動後にConfirm Orderが失敗）
- **修正**: エラーハンドリング改善 + ユーザーへのリトライ誘導UI

#### G. 4ヶ国削除 [eu only]
- EU版から BR(ブラジル), FI(フィンランド), NO(ノルウェー), SE(スウェーデン) を削除
- 対象ファイル: サインアップStep3の国リスト + チェックアウトの国ドロップダウン
- `euOnlyCountries`配列から該当4件を除去

#### D. Wise支払いテキスト追加 [eu only]
- チェックアウト/支払い画面にWise送金手順の説明テキストを追加
- 対象: `/app/src/app/checkout/payment/page.tsx`付近
- テキスト内容: 「Wiseでの送金方法」的な案内（具体文言は要確認 → 仮テキストで実装）

### Phase 2: 機能追加（設計要）

#### F. 追跡番号 + メモ欄 [master → eu]
- 管理画面の注文詳細に「追跡番号」「メモ」フィールドを追加
- DBスキーマ変更: Orderモデルに`trackingNumber`(String?), `memo`(String?)追加
- 管理画面UI: 入力・保存・表示
- 顧客向けメール通知に追跡番号を含める（任意）

#### A+B. お客様の声カルーセル [master → eu] ※谷口確認待ち
- トップページに「Customer Voice」セクション追加
- Instagram DMから受け取った開封/配送動画・スクショを表示
- カルーセルUI（スワイプ対応）
- 素材形式（動画URL/スクショ画像）と掲載件数は谷口さん確認待ち
