# カート機能確認手順

## ❗ 重要: エラーログの確認

ご提示いただいたエラーログは**別のサイト**からのものです:

```
sfd8q2ch3k.execute-api.us-east-2.amazonaws.com  ← AWS API Gateway
ApolloError  ← GraphQLクライアント
```

これらは当カードショップサイトには存在しないため、以下のいずれかです:
1. ブラウザ拡張機能のエラー
2. 別のタブで開いているサイトのエラー
3. バックグラウンドプロセスのエラー

---

## ✅ 正しい確認手順

### 1. コンソールをクリアする
```
1. F12で開発者ツールを開く
2. Consoleタブを選択
3. 🚫マーク（Clear console）をクリック
4. または Ctrl+L でクリア
```

### 2. フィルタを設定する
```
Consoleタブの上部に「Filter」という入力欄があります
そこに以下を入力して、関連ログのみ表示:

🛒

または

cart
```

### 3. ページをリロードして再テスト
```
1. Ctrl+Shift+R（強制リロード）
2. コンソールがクリアされていることを確認
3. 商品の「Add」ボタンをクリック
4. 以下のログが出るか確認:
   🛒 Adding to cart: [商品名]
```

---

## 🔍 期待されるログ（正しい場合）

```
🛒 Adding to cart: Pikachu ex
📦 Cart item: {id: "...", name: "Pikachu ex", price: 1500, ...}
🏪 Cart Store: addItem called with: {...}
📊 Current cart state: []
➕ Adding new item to cart
✅ New cart: [{...}]
✅ Added to cart successfully
🔢 Header: Cart total items: 1
```

---

## 🐛 ログが出ない場合のチェックリスト

### チェック1: 正しいサイトを開いているか
- [ ] URL: `https://card-shop-ec-orpin.vercel.app`
- [ ] タイトル: "CardShop"または類似
- [ ] ヘッダーに"Pokemon Cards"が表示されている

### チェック2: JavaScriptが有効か
```
F12 → Console に以下を入力:
console.log('JavaScript is working!')

→ "JavaScript is working!" が表示されればOK
```

### チェック3: Addボタンが実際にクリックされているか
```
ボタンをクリックした時に:
- ボタンが「Added!」に変わる（2秒間）
- または何も起きない ← 問題！
```

### チェック4: ブラウザ拡張機能を無効化
```
1. シークレットモード/プライベートブラウジングで開く
2. または拡張機能を一時的に全て無効化
3. 再度テスト
```

---

## 🧪 簡易テストコード

コンソールに以下を貼り付けて実行してください:

```javascript
// カートストアが存在するか確認
console.log('Testing cart functionality...')

// LocalStorageを確認
const cartData = localStorage.getItem('cart-storage')
console.log('Cart in localStorage:', cartData)

// もし何もなければ手動で追加
if (!cartData) {
  console.log('Cart is empty, this is normal for first visit')
}

// Addボタンを探す
const addButtons = document.querySelectorAll('button')
const cartButtons = Array.from(addButtons).filter(btn => 
  btn.textContent?.includes('Add') || btn.textContent?.includes('Added')
)
console.log('Found Add buttons:', cartButtons.length)

// 最初のAddボタンをクリック（自動テスト）
if (cartButtons.length > 0) {
  console.log('Clicking first Add button...')
  cartButtons[0].click()
  
  setTimeout(() => {
    const newCartData = localStorage.getItem('cart-storage')
    console.log('Cart after click:', newCartData)
    
    if (newCartData && newCartData !== cartData) {
      console.log('✅ SUCCESS: Cart was updated!')
    } else {
      console.log('❌ FAILED: Cart was not updated')
    }
  }, 1000)
} else {
  console.log('❌ No Add buttons found on page')
}
```

---

## 📸 スクリーンショット確認ポイント

以下の画面キャプチャを撮影していただけると、問題を特定できます:

1. **ページ全体**
   - URL バーが見える状態
   - 商品が表示されている状態

2. **開発者ツール（F12）**
   - Console タブ
   - クリア後の状態
   - Add ボタンクリック後の状態

3. **Application タブ**
   - F12 → Application → Local Storage
   - `cart-storage` の中身

---

## 🔧 手動でカートに追加するテスト

もしボタンが動かない場合、手動でカートに追加できるか確認:

```javascript
// コンソールに以下を貼り付けて実行
const testProduct = {
  id: "test-123",
  name: "Test Product",
  image: "/placeholder.jpg",
  price: 1000,
  category: "Pokemon Cards",
  stock: 10
}

// LocalStorageに直接書き込み
const cartData = {
  state: {
    items: [
      { ...testProduct, quantity: 1 }
    ]
  },
  version: 0
}

localStorage.setItem('cart-storage', JSON.stringify(cartData))
console.log('Test product added to cart manually')
console.log('Please reload the page (F5) and check if cart counter shows "1"')
```

→ リロード後、ヘッダーのカートアイコンに「1」が表示されれば、ストレージは正常

---

## 📞 報告フォーマット

以下の情報をご提供ください:

```
【ブラウザ情報】
ブラウザ: Chrome / Firefox / Safari / Edge
バージョン: [ブラウザのバージョン]

【確認したURL】
https://card-shop-ec-orpin.vercel.app

【コンソールログ（クリア後）】
(F12でコンソールをクリアしてからAddボタンをクリックした後のログ)


【LocalStorage の内容】
(F12 → Application → Local Storage → cart-storage の値)


【テストコード実行結果】
(上記の簡易テストコードを実行した結果)


【動作】
□ Addボタンをクリックしても何も起きない
□ Addボタンが「Added!」に変わる
□ ヘッダーのカートカウンターが変わる
□ /cart ページで商品が表示される
```

---

## 🎯 次のステップ

1. **コンソールをクリア**して再テスト
2. **シークレットモード**で試す
3. **簡易テストコード**を実行
4. 結果を教えてください

問題が続く場合、追加のデバッグコードを投入します。
