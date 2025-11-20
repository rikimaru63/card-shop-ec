# カート機能デバッグガイド

**日時**: 2025-11-19  
**問題**: カートに追加ボタンを押してもカートに追加されない

---

## 🔍 デバッグログを追加しました

以下のコンソールログを追加したので、ブラウザの開発者ツールで確認できます。

### 追加したログ:

1. **商品グリッド** (`src/components/home/product-grid.tsx`)
   ```
   🛒 Adding to cart: [商品名]
   📦 Cart item: [アイテム詳細]
   ✅ Added to cart successfully
   ```

2. **カートストア** (`src/store/cart-store.ts`)
   ```
   🏪 Cart Store: addItem called with: [アイテム]
   📊 Current cart state: [現在のカート]
   🔄 Item exists, incrementing quantity (既存の場合)
   ➕ Adding new item to cart (新規の場合)
   ✅ New cart: [更新後のカート]
   ```

3. **ヘッダー** (`src/components/layout/header.tsx`)
   ```
   🔢 Header: Cart total items: [個数]
   ```

---

## 📋 デバッグ手順

### ステップ1: ブラウザの開発者ツールを開く
1. サイトにアクセス: https://card-shop-ec-orpin.vercel.app
2. **F12キー**を押す（または右クリック → 「検証」）
3. **Console**タブを選択

### ステップ2: カートに追加を試す
1. 商品の「Add」ボタンをクリック
2. コンソールを確認

### ステップ3: ログを確認

#### ✅ 正常な場合のログ例:
```
🛒 Adding to cart: Pikachu ex
📦 Cart item: { id: "clx...", name: "Pikachu ex", price: 1500, ... }
🏪 Cart Store: addItem called with: { id: "clx...", name: "Pikachu ex", ... }
📊 Current cart state: []
➕ Adding new item to cart
✅ New cart: [{ id: "clx...", name: "Pikachu ex", quantity: 1, ... }]
✅ Added to cart successfully
🔢 Header: Cart total items: 1
```

#### ❌ 問題がある場合の可能性:

**ケース1: ボタンが反応していない**
```
(ログが何も出ない)
```
→ **原因**: クリックイベントが発火していない
→ **考えられる理由**: 
  - Linkコンポーネントがクリックを横取りしている
  - JavaScriptが無効化されている
  - ボタンが別の要素で覆われている

**ケース2: addItemが呼ばれていない**
```
🛒 Adding to cart: Pikachu ex
📦 Cart item: { ... }
✅ Added to cart successfully
(🏪 Cart Store のログが出ない)
```
→ **原因**: useCartStoreが正しく動作していない
→ **考えられる理由**:
  - Zustandの初期化エラー
  - localStorageへのアクセス権限がない
  - ブラウザの設定でlocalStorageが無効

**ケース3: カートストアは更新されるがヘッダーが反応しない**
```
🛒 Adding to cart: Pikachu ex
🏪 Cart Store: addItem called with: { ... }
✅ New cart: [{ ... }]
✅ Added to cart successfully
🔢 Header: Cart total items: 0  ← 0のまま！
```
→ **原因**: ヘッダーのカウンター更新が遅延している
→ **考えられる理由**:
  - Zustandのselector関数が正しく動作していない
  - Reactの再レンダリングが発生していない

**ケース4: LocalStorageエラー**
```
Error: QuotaExceededError
```
→ **原因**: ブラウザのストレージ容量が満杯
→ **解決策**: ブラウザのキャッシュをクリア

---

## 🔧 トラブルシューティング

### 問題1: ログが全く出ない場合

**確認事項**:
- [ ] JavaScriptが有効になっているか
- [ ] ブラウザのコンソールが正しく開いているか
- [ ] ページが完全に読み込まれているか
- [ ] ネットワークエラーがないか

**解決策**:
```
1. ページをリロード（Ctrl+F5）
2. ブラウザのキャッシュをクリア
3. シークレットモードで試す
4. 別のブラウザで試す
```

### 問題2: "Add"ボタンを押しても何も起きない

**確認事項**:
- [ ] ボタンに`disabled`属性がついていないか
- [ ] 商品の在庫が0ではないか
- [ ] クリックイベントがpreventDefaultされているか

**デバッグコード追加**:
商品グリッドコンポーネントで、ボタンに以下を追加:
```tsx
onClick={(e) => {
  console.log('Button clicked!')
  handleAddToCart(product, e)
}}
```

### 問題3: LocalStorageにアクセスできない

**エラー例**:
```
DOMException: Failed to read the 'localStorage' property from 'Window'
```

**原因**:
- プライベートブラウジングモード
- ブラウザの設定でCookieが無効
- クロスオリジン問題

**解決策**:
```
1. 通常モードでブラウザを開く
2. ブラウザ設定 → プライバシー → Cookieを有効化
3. F12 → Application → Local Storage → 確認
```

### 問題4: カートには追加されるがヘッダーのカウンターが0のまま

**確認コード**:
```javascript
// ブラウザのコンソールで実行
const cartData = localStorage.getItem('cart-storage')
console.log('Cart in localStorage:', JSON.parse(cartData))
```

**期待される出力**:
```json
{
  "state": {
    "items": [
      {
        "id": "clx...",
        "name": "Pikachu ex",
        "quantity": 1,
        "price": 1500
      }
    ]
  },
  "version": 0
}
```

**もしitemsが空の場合**:
→ カートストアの`addItem`が正しく動作していない

---

## 🧪 手動テスト手順

### テスト1: 基本的なカート追加
1. ホームページにアクセス
2. F12でコンソールを開く
3. 「Pikachu ex」の「Add」ボタンをクリック
4. コンソールに以下のログが出ることを確認:
   ```
   🛒 Adding to cart: Pikachu ex
   🏪 Cart Store: addItem called
   ✅ New cart: [...]
   🔢 Header: Cart total items: 1
   ```
5. ヘッダーのカートアイコンに「1」のバッジが表示されることを確認

### テスト2: 同じ商品を2回追加
1. 同じ商品の「Add」ボタンを再度クリック
2. コンソールに以下が出ることを確認:
   ```
   🔄 Item exists, incrementing quantity
   ✅ Updated cart: [{ ..., quantity: 2 }]
   🔢 Header: Cart total items: 2
   ```
3. ヘッダーのバッジが「2」になることを確認

### テスト3: 異なる商品を追加
1. 別の商品（例: Charizard ex SAR）の「Add」ボタンをクリック
2. ヘッダーのバッジが「3」になることを確認
3. `/cart`ページに移動
4. 2つの商品が表示されることを確認:
   - Pikachu ex (数量: 2)
   - Charizard ex SAR (数量: 1)

### テスト4: ページリロード後の永続性
1. カートに商品を追加
2. ページをリロード（F5）
3. ヘッダーのカウンターが維持されていることを確認
4. `/cart`ページで商品が残っていることを確認

### テスト5: LocalStorageの確認
1. F12 → **Application**タブ（Chromeの場合）
2. 左サイドバー → **Local Storage** → `https://card-shop-ec-orpin.vercel.app`
3. `cart-storage`キーを探す
4. 値に商品データが入っていることを確認

---

## 🐛 既知の問題と回避策

### 問題A: Linkコンポーネント内のボタンクリックが無視される

**症状**: ボタンをクリックすると商品詳細ページに飛んでしまう

**原因**: Linkコンポーネントがクリックイベントをキャッチしている

**修正済み**: `e.stopPropagation()`を追加

**確認方法**: 
```tsx
<Button onClick={(e) => {
  e.preventDefault()
  e.stopPropagation() // ← これがあるか確認
  handleAddToCart(product, e)
}}>
```

### 問題B: Zustandのpersist middlewareが動作しない

**症状**: カート追加は成功するがリロードすると消える

**原因**: SSR環境でlocalStorageにアクセスできない

**回避策**: Zustandのpersist設定を確認
```typescript
persist(
  (set, get) => ({ /* state */ }),
  {
    name: 'cart-storage', // ← これがあるか確認
  }
)
```

### 問題C: 大量の商品を追加するとlocalStorageがいっぱいになる

**症状**: `QuotaExceededError`

**原因**: ブラウザのlocalStorageは5MBまで

**回避策**: 
```
1. カートをクリア
2. ブラウザキャッシュをクリア
3. 商品画像をlocalStorageに保存しない（URLのみ保存）
```

---

## 📊 期待される動作

### 正常に動作している場合:

1. ✅ 「Add」ボタンをクリックするとログが出る
2. ✅ カートストアが更新される
3. ✅ ヘッダーのカウンターが増える
4. ✅ `/cart`ページで商品が表示される
5. ✅ ページリロード後も商品が残っている
6. ✅ LocalStorageに商品データが保存される

### チェックリスト:

- [ ] コンソールに`🛒 Adding to cart`が表示される
- [ ] コンソールに`🏪 Cart Store: addItem called`が表示される
- [ ] コンソールに`✅ New cart`または`✅ Updated cart`が表示される
- [ ] ヘッダーのカートバッジが増える
- [ ] ボタンが「Added!」に変わる（2秒間）
- [ ] LocalStorageの`cart-storage`に商品が保存される
- [ ] `/cart`ページで商品が表示される

---

## 🔗 関連ファイル

**カート機能の実装ファイル**:
- `src/store/cart-store.ts` - Zustandストア
- `src/components/home/product-grid.tsx` - 商品グリッド
- `src/components/layout/header.tsx` - ヘッダー（カウンター）
- `src/app/cart/page.tsx` - カートページ

**デバッグコミット**: `[最新コミットID]`

---

## 📝 報告テンプレート

問題が発生した場合、以下の情報を提供してください:

```
【環境】
- ブラウザ: Chrome / Firefox / Safari / Edge
- バージョン: [バージョン番号]
- OS: Windows / Mac / Linux / iOS / Android
- デバイス: PC / スマホ / タブレット

【再現手順】
1. ホームページにアクセス
2. [商品名]の「Add」ボタンをクリック
3. [結果]

【コンソールログ】
```
(ここにF12で確認したログを貼り付け)
```

【LocalStorage】
```
(F12 → Application → Local Storage → cart-storage の内容)
```

【スクリーンショット】
(可能であれば画面キャプチャを添付)
```

---

**最終更新**: 2025-11-19  
**デプロイURL**: https://card-shop-ec-orpin.vercel.app

