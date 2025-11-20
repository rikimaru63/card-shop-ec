# システム引き継ぎドキュメント - Pokemon Card Shop

**プロジェクト名**: Card Shop EC  
**作成日**: 2025-11-19  
**最終更新**: 2025-11-19  
**バージョン**: 0.1.0  
**対象者**: 新規開発者、保守担当者

---

## 📋 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [システムアーキテクチャ](#2-システムアーキテクチャ)
3. [開発環境セットアップ](#3-開発環境セットアップ)
4. [ディレクトリ構成](#4-ディレクトリ構成)
5. [主要機能と実装](#5-主要機能と実装)
6. [データベース設計](#6-データベース設計)
7. [API仕様](#7-api仕様)
8. [デプロイ手順](#8-デプロイ手順)
9. [運用管理](#9-運用管理)
10. [トラブルシューティング](#10-トラブルシューティング)

---

## 1. プロジェクト概要

### 1.1 プロジェクト情報

| 項目 | 内容 |
|-----|------|
| **プロジェクト名** | Card Shop EC (Pokemon Card Shop) |
| **目的** | ポケモンカードのオンライン販売プラットフォーム |
| **対象市場** | 英語圏（多言語対応予定：英語・日本語） |
| **主要機能** | 商品閲覧、カート、決済、管理画面、CSV一括登録 |
| **本番URL** | https://card-shop-ec-orpin.vercel.app |
| **リポジトリ** | https://github.com/rikimaru63/card-shop-ec |
| **ローカルパス** | `C:\Users\admin\Desktop\開発\card_hp\my-awesome-project\card-shop-ec` |

### 1.2 技術スタック

#### フロントエンド
- **フレームワーク**: Next.js 14.0.4 (App Router)
- **言語**: TypeScript 5.3.3
- **UIライブラリ**: 
  - Shadcn/UI (Radix UI ベース)
  - Tailwind CSS 3.4.0
- **状態管理**: 
  - Zustand 4.5.7 (カート・ウィッシュリスト)
  - React Query (データフェッチ)
- **フォーム**: React Hook Form 7.48.2 + Zod 3.22.4

#### バックエンド
- **フレームワーク**: Next.js API Routes
- **認証**: NextAuth.js 4.24.13
- **ORM**: Prisma 5.7.1
- **データベース**: Supabase (PostgreSQL 15)

#### インフラ
- **ホスティング**: Vercel
- **データベース**: Supabase
- **バージョン管理**: Git + GitHub
- **CI/CD**: Vercel自動デプロイ

### 1.3 主要依存パッケージ

```json
{
  "next": "14.0.4",
  "react": "^18.2.0",
  "typescript": "^5.3.3",
  "@prisma/client": "^5.7.1",
  "next-auth": "^4.24.13",
  "zustand": "^4.5.7",
  "tailwindcss": "^3.4.0"
}
```

---

## 2. システムアーキテクチャ

### 2.1 全体構成図

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Pages      │  │  Components  │  │    Stores    │ │
│  │ (App Router) │  │  (Shadcn/UI) │  │  (Zustand)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │
                          │ HTTP/REST
                          │
┌─────────────────────────▼───────────────────────────────┐
│                  Backend (Next.js API)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Routes                                       │  │
│  │  - /api/products (GET, POST)                     │  │
│  │  - /api/products/[id] (GET, PUT, DELETE)         │  │
│  │  - /api/admin/products (Admin CRUD)              │  │
│  │  - /api/auth/[...nextauth] (NextAuth)            │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │ Prisma ORM                    │
└─────────────────────────┼───────────────────────────────┘
                          │
                          │ PostgreSQL Protocol
                          │
┌─────────────────────────▼───────────────────────────────┐
│              Supabase (PostgreSQL Database)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tables:                                          │  │
│  │  - Product (商品)                                 │  │
│  │  - Category (カテゴリ)                            │  │
│  │  - User (ユーザー)                                │  │
│  │  - Order (注文)                                   │  │
│  │  - Cart (カート)                                  │  │
│  │  - Wishlist (ウィッシュリスト)                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 データフロー

#### 商品表示フロー
```
1. ユーザーがホームページにアクセス
   ↓
2. ProductGrid コンポーネントがマウント
   ↓
3. useEffect で /api/products を fetch
   ↓
4. API が Prisma経由でSupabaseにクエリ
   ↓
5. 商品データ（12件）を取得
   ↓
6. フロントエンドでレンダリング
```

#### カート追加フロー
```
1. ユーザーが「Add」ボタンをクリック
   ↓
2. handleAddToCart 関数が実行
   ↓
3. useCartStore の addItem を呼び出し
   ↓
4. Zustand が状態を更新
   ↓
5. localStorage に永続化 (cart-storage)
   ↓
6. Header コンポーネントが自動再レンダリング
   ↓
7. カートバッジが更新
```

### 2.3 認証フロー

```
1. ユーザーが /auth/signin にアクセス
   ↓
2. NextAuth の SignIn ページ表示
   ↓
3. メール・パスワード入力
   ↓
4. /api/auth/[...nextauth] に POST
   ↓
5. Credentials Provider が認証処理
   ↓
6. bcrypt でパスワード検証
   ↓
7. JWT トークン発行
   ↓
8. Cookie にセッション保存
   ↓
9. ユーザーページにリダイレクト
```

---

## 3. 開発環境セットアップ

### 3.1 必要なツール

| ツール | バージョン | 用途 | インストール方法 |
|--------|-----------|------|-----------------|
| **Node.js** | v22.17.0 以上 | JavaScript実行環境 | https://nodejs.org/ |
| **npm** | 11.6.2 以上 | パッケージマネージャー | Node.js に同梱 |
| **Git** | 2.50.0 以上 | バージョン管理 | https://git-scm.com/ |
| **VS Code** | 最新 | エディタ（推奨） | https://code.visualstudio.com/ |
| **Supabase CLI** | 2.58.5 以上 | DB管理（オプション） | `npm install -g supabase` |

### 3.2 初回セットアップ手順

#### ステップ1: リポジトリのクローン

```bash
# 作業ディレクトリに移動
cd C:\Users\admin\Desktop\開発\card_hp\my-awesome-project

# リポジトリをクローン（既存の場合はスキップ）
git clone https://github.com/rikimaru63/card-shop-ec.git
cd card-shop-ec

# または既存のディレクトリで最新化
git pull origin master
```

#### ステップ2: 依存パッケージのインストール

```bash
# Node modules をインストール
npm install

# Prisma クライアントを生成
npm run db:generate
```

**想定出力**:
```
added 574 packages in 45s
✔ Generated Prisma Client
```

#### ステップ3: 環境変数の設定

```bash
# .env.local ファイルを作成（既存の場合は確認のみ）
# 以下の内容をコピー
```

**`.env.local` の内容**:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://rzxbwmxkmrseyobmffkn.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eGJ3bXhrbXJzZXlvYm1mZmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNjU0NzEsImV4cCI6MjA3ODg0MTQ3MX0.Phr_M0eJW3PkT_gKXiOJsDwypMZ9mz9Xs39aJu4TBlE"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eGJ3bXhrbXJzZXlvYm1mZmtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI2NTQ3MSwiZXhwIjoyMDc4ODQxNDcxfQ.ayVvhfdNa5gN8IUlcco4bt9iwvFG6MkRnUD7qls8Oi8"

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:S_6361acb!!@db.rzxbwmxkmrseyobmffkn.supabase.co:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="zvP5EJiDxXAguiMIG2hzMVDF8vh/Yg8AUIpjwAM6nmw="

# Google OAuth (未設定)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

⚠️ **重要**: 本番環境では `NEXTAUTH_URL` を変更:
```env
NEXTAUTH_URL="https://card-shop-ec-orpin.vercel.app"
```

#### ステップ4: データベースの初期化

```bash
# Prisma スキーマをデータベースに適用
npm run db:push

# シードデータ（12商品）を投入
npm run db:seed
```

**想定出力**:
```
🌱 Starting database seed...
📁 Creating categories...
✅ Created category: Pokemon Cards
🃏 Creating products...
  ✓ Created: Pikachu ex (PKM-SCA-025-PIK)
  ✓ Created: Charizard ex SAR (PKM-VIO-006-CHA)
  ...
✅ Successfully created 12 products
🎉 Database seed completed!
```

#### ステップ5: 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev
```

**ブラウザで確認**:
- http://localhost:3000 にアクセス
- 12商品が表示されることを確認
- カート・ウィッシュリストが動作することを確認

### 3.3 VS Code 推奨設定

**推奨拡張機能**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**`.vscode/settings.json`**:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## 4. ディレクトリ構成

### 4.1 全体構成

```
card-shop-ec/
├── .env.local                  # 環境変数（ローカル）
├── .env.example                # 環境変数のサンプル
├── package.json                # 依存関係定義
├── tsconfig.json               # TypeScript設定
├── tailwind.config.ts          # Tailwind設定
├── next.config.js              # Next.js設定
├── components.json             # Shadcn/UI設定
│
├── prisma/
│   ├── schema.prisma           # データベーススキーマ
│   └── seed.ts                 # シードスクリプト
│
├── public/                     # 静的ファイル
│   └── placeholder-card.jpg    # カード画像プレースホルダー
│
└── src/
    ├── app/                    # App Router (ページ)
    │   ├── layout.tsx          # ルートレイアウト
    │   ├── page.tsx            # ホームページ
    │   │
    │   ├── api/                # API Routes
    │   │   ├── products/
    │   │   │   ├── route.ts           # GET /api/products
    │   │   │   └── [id]/route.ts      # GET/PUT/DELETE /api/products/[id]
    │   │   ├── admin/
    │   │   │   └── products/
    │   │   │       ├── route.ts       # POST /api/admin/products
    │   │   │       └── [id]/route.ts  # PUT/DELETE /api/admin/products/[id]
    │   │   └── auth/
    │   │       ├── [...nextauth]/route.ts  # NextAuth
    │   │       └── register/route.ts       # ユーザー登録
    │   │
    │   ├── products/           # 商品ページ
    │   │   ├── page.tsx        # 商品一覧
    │   │   └── [id]/page.tsx   # 商品詳細
    │   │
    │   ├── cart/
    │   │   └── page.tsx        # カートページ
    │   │
    │   ├── wishlist/
    │   │   └── page.tsx        # ウィッシュリストページ
    │   │
    │   ├── checkout/
    │   │   ├── page.tsx        # チェックアウト
    │   │   └── success/page.tsx # 購入完了
    │   │
    │   ├── admin/              # 管理画面
    │   │   ├── page.tsx        # ダッシュボード
    │   │   └── products/
    │   │       ├── page.tsx    # 商品一覧
    │   │       ├── new/page.tsx    # 商品登録
    │   │       └── import/page.tsx # CSV一括登録
    │   │
    │   └── auth/               # 認証ページ
    │       ├── signin/page.tsx
    │       └── signup/page.tsx
    │
    ├── components/             # Reactコンポーネント
    │   ├── ui/                 # Shadcn/UI コンポーネント
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── badge.tsx
    │   │   └── ...             # その他UIコンポーネント
    │   │
    │   ├── layout/             # レイアウトコンポーネント
    │   │   ├── header.tsx      # ヘッダー（ナビ、カートカウンター）
    │   │   └── footer.tsx      # フッター
    │   │
    │   ├── home/               # ホームページ用
    │   │   ├── hero-section.tsx       # ヒーローセクション
    │   │   ├── product-grid.tsx       # 商品グリッド（重要）
    │   │   ├── filter-sidebar.tsx     # フィルタサイドバー
    │   │   └── category-grid.tsx      # カテゴリグリッド
    │   │
    │   └── products/           # 商品関連
    │       ├── product-card.tsx       # 商品カード
    │       ├── product-filters.tsx    # フィルタ
    │       └── product-sort.tsx       # ソート
    │
    ├── store/                  # Zustand ストア
    │   ├── cart-store.ts       # カートストア（重要）
    │   └── wishlist-store.ts   # ウィッシュリストストア
    │
    ├── lib/                    # ユーティリティ
    │   ├── prisma.ts           # Prisma クライアント
    │   ├── utils.ts            # 汎用ユーティリティ
    │   ├── utils/
    │   │   └── sku.ts          # SKU生成ロジック
    │   └── supabase/
    │       ├── client.ts       # Supabase クライアント
    │       └── server.ts       # Supabase サーバークライアント
    │
    ├── types/                  # 型定義
    │   └── next-auth.d.ts      # NextAuth 型拡張
    │
    └── styles/
        └── globals.css         # グローバルCSS
```

### 4.2 重要ファイルの説明

#### 🔴 最重要ファイル

| ファイル | 役割 | 編集頻度 |
|---------|------|---------|
| `src/components/home/product-grid.tsx` | 商品一覧表示、カート追加 | 高 |
| `src/store/cart-store.ts` | カート状態管理 | 中 |
| `src/app/api/products/route.ts` | 商品取得API | 中 |
| `prisma/schema.prisma` | データベーススキーマ | 中 |
| `.env.local` | 環境変数 | 低 |

#### 🟡 重要ファイル

| ファイル | 役割 |
|---------|------|
| `src/components/layout/header.tsx` | ヘッダー、カートカウンター |
| `src/app/cart/page.tsx` | カートページ |
| `src/app/api/admin/products/route.ts` | 管理者用商品作成API |
| `prisma/seed.ts` | データベースシード |

---

## 5. 主要機能と実装

### 5.1 商品表示機能

**ファイル**: `src/components/home/product-grid.tsx`

**処理フロー**:
```typescript
1. useEffect で /api/products を fetch
   ↓
2. products 配列に格納
   ↓
3. map() でループしてProductCardを表示
   ↓
4. ページネーション・ソート機能
```

**重要な実装ポイント**:
```typescript
// API から商品取得
useEffect(() => {
  async function fetchProducts() {
    const response = await fetch(`/api/products?page=${currentPage}&limit=12&sortBy=${sortBy}`)
    const data = await response.json()
    setProducts(data.products)
    setPagination(data.pagination)
  }
  fetchProducts()
}, [currentPage, sortBy])
```

**ソート機能**:
- `newest`: 最新順（作成日降順）
- `price-asc`: 価格昇順
- `price-desc`: 価格降順
- `popular`: 人気順（現在は最新順と同じ）

### 5.2 カート機能

**ファイル**: `src/store/cart-store.ts`

**Zustand ストアの実装**:
```typescript
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => { /* 追加ロジック */ },
      removeItem: (id) => { /* 削除ロジック */ },
      updateQuantity: (id, quantity) => { /* 数量更新 */ },
      clearCart: () => { /* カート全削除 */ },
      getTotalItems: () => { /* 合計個数 */ },
      getTotalPrice: () => { /* 合計金額 */ }
    }),
    { name: 'cart-storage' } // localStorage のキー名
  )
)
```

**カートに追加する実装例**:
```typescript
// ProductGrid.tsx
const addToCart = useCartStore((state) => state.addItem)

const handleAddToCart = (product) => {
  addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    stock: product.stock,
    category: product.cardSet
  })
}
```

**localStorage の構造**:
```json
{
  "state": {
    "items": [
      {
        "id": "clx123...",
        "name": "Pikachu ex",
        "price": 1500,
        "quantity": 2,
        "stock": 10,
        "image": "/placeholder-card.jpg"
      }
    ]
  },
  "version": 0
}
```

### 5.3 認証機能

**ファイル**: `src/app/api/auth/[...nextauth]/route.ts`

**NextAuth 設定**:
```typescript
const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      async authorize(credentials) {
        // メール・パスワード認証
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (user && bcrypt.compareSync(credentials.password, user.hashedPassword)) {
          return { id: user.id, email: user.email, name: user.name }
        }
        
        return null
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      return session
    }
  }
})
```

**認証チェック例**:
```typescript
// API Route での認証チェック
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 認証済みの処理...
}
```

### 5.4 管理機能

#### 商品登録フォーム

**ファイル**: `src/app/admin/products/new/page.tsx`

**フォーム構成**:
```typescript
const formData = {
  name: "",              // 商品名（必須）
  nameJa: "",           // 日本語名
  cardSet: "",          // セット名
  cardNumber: "",       // カード番号
  rarity: "",           // レアリティ
  condition: "",        // 状態
  price: "",            // 価格（必須）
  stock: "",            // 在庫数（必須）
  language: "JP",       // 言語
  foil: false,          // ホイル加工
  firstEdition: false,  // 初版
  graded: false,        // グレード品
  gradingCompany: "",   // グレーディング会社
  grade: "",            // グレード
  description: ""       // 説明
}
```

**送信処理**:
```typescript
const handleSubmit = async (e) => {
  e.preventDefault()
  
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      categoryId: "pokemon-cards"
    })
  })
  
  if (response.ok) {
    router.push("/admin/products")
  }
}
```

---

## 6. データベース設計

### 6.1 ER図

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   User      │       │   Product    │       │  Category   │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)      │       │ id (PK)     │
│ email       │◄──┐   │ sku (UK)     │   ┌──►│ name        │
│ name        │   │   │ name         │   │   │ slug (UK)   │
│ password    │   │   │ nameJa       │   │   │ parentId    │
│ role        │   │   │ slug (UK)    │   │   └─────────────┘
│ createdAt   │   │   │ description  │   │         │
└─────────────┘   │   │ cardSet      │   │         │
      │           │   │ cardNumber   │   │         ▼
      │           │   │ rarity       │   │   (自己参照)
      │           │   │ condition    │   │
      ▼           │   │ price        │   │
┌─────────────┐   │   │ stock        │   │
│   Order     │   │   │ categoryId  ─┼───┘
├─────────────┤   │   │ createdAt    │
│ id (PK)     │   │   └──────────────┘
│ userId (FK) ├───┘         │
│ orderNumber │             │
│ subtotal    │             ▼
│ total       │       ┌──────────────┐
│ status      │       │ ProductImage │
└─────────────┘       ├──────────────┤
      │               │ id (PK)      │
      │               │ productId(FK)│
      ▼               │ url          │
┌─────────────┐       │ order        │
│  OrderItem  │       └──────────────┘
├─────────────┤
│ id (PK)     │
│ orderId(FK) │
│ productId   │
│ quantity    │
│ price       │
└─────────────┘
```

### 6.2 主要テーブル定義

#### Product (商品)

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | String(cuid) | NO | auto | 主キー |
| sku | String | NO | - | 商品コード（一意） |
| name | String | NO | - | 商品名（英語） |
| nameJa | String | YES | null | 商品名（日本語） |
| slug | String | NO | - | URLスラッグ（一意） |
| description | Text | YES | null | 商品説明 |
| cardSet | String | YES | null | カードセット名 |
| cardNumber | String | YES | null | カード番号 |
| rarity | Enum | YES | null | レアリティ |
| condition | Enum | YES | null | 状態 |
| language | String | NO | "EN" | 言語 |
| foil | Boolean | NO | false | ホイル加工 |
| firstEdition | Boolean | NO | false | 初版 |
| graded | Boolean | NO | false | グレード品 |
| gradingCompany | String | YES | null | グレーディング会社 |
| grade | String | YES | null | グレード |
| price | Decimal | NO | - | 価格 |
| comparePrice | Decimal | YES | null | 比較価格 |
| stock | Int | NO | 0 | 在庫数 |
| lowStock | Int | NO | 5 | 低在庫閾値 |
| published | Boolean | NO | true | 公開状態 |
| featured | Boolean | NO | false | 注目商品 |
| categoryId | String | NO | - | カテゴリID（FK） |
| createdAt | DateTime | NO | now() | 作成日時 |
| updatedAt | DateTime | NO | now() | 更新日時 |

**インデックス**:
- `sku` (UNIQUE)
- `slug` (UNIQUE)
- `categoryId`
- `cardSet`
- `price`
- `stock`

#### User (ユーザー)

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | String(cuid) | NO | auto | 主キー |
| email | String | NO | - | メールアドレス（一意） |
| name | String | YES | null | 表示名 |
| hashedPassword | String | YES | null | ハッシュ化パスワード |
| image | String | YES | null | プロフィール画像URL |
| role | Enum | NO | CUSTOMER | 権限（CUSTOMER/ADMIN/STAFF） |
| emailVerified | DateTime | YES | null | メール確認日時 |
| createdAt | DateTime | NO | now() | 作成日時 |
| updatedAt | DateTime | NO | now() | 更新日時 |

#### Category (カテゴリ)

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | String(cuid) | NO | auto | 主キー |
| name | String | NO | - | カテゴリ名 |
| slug | String | NO | - | URLスラッグ（一意） |
| description | String | YES | null | 説明 |
| parentId | String | YES | null | 親カテゴリID（自己参照） |
| createdAt | DateTime | NO | now() | 作成日時 |

**現在のカテゴリ構造**:
```
Pokemon Cards (親)
├─ Booster Packs (子)
├─ Single Cards (子)
├─ Graded Cards (子)
└─ Promo Cards (子)
```

### 6.3 Enum 定義

```prisma
enum UserRole {
  CUSTOMER      // 一般ユーザー
  STAFF         // スタッフ
  ADMIN         // 管理者
  SUPER_ADMIN   // スーパー管理者
}

enum Rarity {
  COMMON        // コモン
  UNCOMMON      // アンコモン
  RARE          // レア
  SUPER_RARE    // スーパーレア（SR）
  ULTRA_RARE    // ウルトラレア（UR）
  SECRET_RARE   // シークレットレア（SAR, AR, CHR含む）
  PROMO         // プロモ
}

enum Condition {
  MINT                 // 完美品（S）
  NEAR_MINT           // 極美品（A）
  LIGHTLY_PLAYED      // 美品（B）
  MODERATELY_PLAYED   // 良好（C）
  HEAVILY_PLAYED      // 並品（D）
  DAMAGED             // 劣化品（E）
}

enum OrderStatus {
  PENDING     // 保留
  PROCESSING  // 処理中
  SHIPPED     // 発送済み
  DELIVERED   // 配達完了
  CANCELLED   // キャンセル
  REFUNDED    // 返金済み
}
```

---

## 7. API仕様

### 7.1 エンドポイント一覧

| メソッド | エンドポイント | 認証 | 説明 |
|---------|--------------|-----|------|
| GET | `/api/products` | 不要 | 商品一覧取得 |
| GET | `/api/products/[id]` | 不要 | 商品詳細取得 |
| POST | `/api/admin/products` | 必要 | 商品作成 |
| PUT | `/api/admin/products/[id]` | 必要 | 商品更新 |
| DELETE | `/api/admin/products/[id]` | 必要 | 商品削除 |
| GET | `/api/admin/products` | 必要 | 管理者用商品一覧 |
| POST | `/api/auth/register` | 不要 | ユーザー登録 |
| GET/POST | `/api/auth/[...nextauth]` | - | NextAuth認証 |

### 7.2 詳細仕様

#### GET /api/products

**説明**: 公開商品の一覧を取得（ページネーション、フィルタ、ソート対応）

**クエリパラメータ**:
```
page          : ページ番号（デフォルト: 1）
limit         : 1ページの件数（デフォルト: 12）
sortBy        : ソート順（newest, price-asc, price-desc, popular）
category      : カテゴリスラッグでフィルタ
rarity        : レアリティでフィルタ
condition     : 状態でフィルタ
cardSet       : カードセットでフィルタ
search        : 検索キーワード（name, nameJa, description）
minPrice      : 最小価格
maxPrice      : 最大価格
```

**リクエスト例**:
```http
GET /api/products?page=1&limit=12&sortBy=price-asc&rarity=SECRET_RARE&minPrice=5000&maxPrice=20000
```

**レスポンス**:
```json
{
  "products": [
    {
      "id": "clx123abc",
      "sku": "PKM-VIO-006-CHA",
      "name": "Charizard ex SAR",
      "nameJa": "リザードンex SAR",
      "slug": "charizard-ex-sar-violet-006",
      "cardSet": "Violet ex",
      "cardNumber": "006/078",
      "rarity": "SECRET_RARE",
      "condition": "MINT",
      "price": 15000,
      "comparePrice": null,
      "stock": 1,
      "lowStock": true,
      "image": "/placeholder-card.jpg",
      "category": {
        "id": "clx456def",
        "name": "Pokemon Cards",
        "slug": "pokemon-cards"
      },
      "language": "JP",
      "foil": true,
      "firstEdition": false,
      "graded": false,
      "featured": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 12,
    "totalPages": 1,
    "hasMore": false
  }
}
```

#### POST /api/admin/products

**説明**: 新規商品を作成（管理者のみ）

**認証**: 必要（NextAuth session）

**リクエストボディ**:
```json
{
  "name": "Pikachu VMAX",
  "nameJa": "ピカチュウVMAX",
  "cardSet": "Vivid Voltage",
  "cardNumber": "044/185",
  "rarity": "RRR (トリプルレア)",
  "condition": "A (極美品)",
  "price": 2500,
  "stock": 15,
  "language": "JP",
  "foil": true,
  "firstEdition": false,
  "graded": false,
  "description": "Powerful Pikachu VMAX card from Vivid Voltage set."
}
```

**レスポンス（成功時 201）**:
```json
{
  "id": "clx789ghi",
  "sku": "PKM-VIV-044-X3K",
  "slug": "pikachu-vmax-vivid-voltage-044",
  "name": "Pikachu VMAX",
  "price": 2500,
  "stock": 15,
  "createdAt": "2025-11-19T12:00:00.000Z"
}
```

**エラーレスポンス**:
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 400 Bad Request
{
  "error": "Missing required fields: name, price, stock"
}

// 409 Conflict (重複SKU)
{
  "error": "Product with this SKU or slug already exists"
}
```

### 7.3 SKU生成ロジック

**ファイル**: `src/lib/utils/sku.ts`

**アルゴリズム**:
```typescript
function generateSKU(cardSet?: string, cardNumber?: string): string {
  // 1. セットコード（3文字）
  const setCode = cardSet
    ? cardSet.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(3, 'X')
    : 'UNK'
  
  // 2. カード番号（3桁）
  const num = cardNumber
    ? cardNumber.replace(/[^0-9]/g, '').padStart(3, '0').substring(0, 3)
    : Date.now().toString().slice(-6)
  
  // 3. ランダム文字列（3文字）
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  
  // 4. 組み合わせ
  return `PKM-${setCode}-${num}-${random}`
}
```

**生成例**:
```
Input:  cardSet="Scarlet ex", cardNumber="025/165"
Output: "PKM-SCA-025-A3F"

Input:  cardSet="Violet ex", cardNumber="006/078"
Output: "PKM-VIO-006-B7K"

Input:  cardSet="Pokemon 151", cardNumber="150/165"
Output: "PKM-POK-150-C2M"
```

---

## 8. デプロイ手順

### 8.1 Vercel デプロイ設定

**前提条件**:
- GitHub リポジトリが存在
- Vercel アカウントが作成済み
- リポジトリとVercelが連携済み

**自動デプロイフロー**:
```
1. ローカルで git commit
   ↓
2. git push origin master
   ↓
3. GitHub にプッシュ
   ↓
4. Vercel が自動検知
   ↓
5. ビルド開始（npm run build）
   ↓
6. デプロイ完了
   ↓
7. 本番URL更新
```

**現在の本番URL**:
```
https://card-shop-ec-orpin.vercel.app
```

### 8.2 環境変数設定（Vercel）

**Vercel Dashboard**:
1. https://vercel.com/dashboard にログイン
2. プロジェクト `card-shop-ec` を選択
3. **Settings** → **Environment Variables**
4. 以下を設定:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rzxbwmxkmrseyobmffkn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
DATABASE_URL=postgresql://postgres:S_6361acb!!@db.rzxbwmxkmrseyobmffkn.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=https://card-shop-ec-orpin.vercel.app
NEXTAUTH_SECRET=zvP5EJiDxXAguiMIG2hzMVDF8vh/Yg8AUIpjwAM6nmw=

# Google OAuth (未設定)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

**重要**: 環境変数を変更した後は再デプロイが必要

### 8.3 手動デプロイ

```bash
# 1. 最新のコードをコミット
git add -A
git commit -m "feat: Add new feature"

# 2. リモートにプッシュ
git push origin master

# 3. Vercel が自動的にデプロイ開始
# または Vercel CLI で手動デプロイ:
npx vercel --prod
```

### 8.4 ビルドコマンド（Vercel設定）

**Build Command**:
```bash
npm run build
```

**Output Directory**:
```
.next
```

**Install Command**:
```bash
npm install
```

**Framework Preset**: Next.js

---

## 9. 運用管理

### 9.1 よく使うコマンド

#### 開発

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番モードで起動（ローカル確認）
npm run start

# ESLint チェック
npm run lint
```

#### データベース

```bash
# Prisma スキーマを DB に適用
npm run db:push

# マイグレーション作成・実行
npm run db:migrate

# Prisma Studio 起動（GUIでDB確認）
npm run db:studio

# Prisma クライアント再生成
npm run db:generate

# シードデータ投入
npm run db:seed
```

#### Git

```bash
# 変更をステージング
git add -A

# コミット
git commit -m "commit message"

# プッシュ（デプロイトリガー）
git push origin master

# ブランチ作成
git checkout -b feature/new-feature

# 変更を破棄
git checkout -- <file>

# リモート最新を取得
git pull origin master
```

### 9.2 商品追加の運用フロー

#### 方法1: 管理画面から手動登録

```
1. /admin/products/new にアクセス
2. フォームに入力
   - 商品名（必須）
   - カードセット
   - カード番号
   - レアリティ
   - 状態
   - 価格（必須）
   - 在庫数（必須）
3. 「保存」ボタンクリック
4. 商品一覧に表示されることを確認
5. ホームページで確認
```

#### 方法2: CSV一括登録（未実装）

```
1. CSV テンプレートをダウンロード
2. Excel等で商品データを入力
3. /admin/products/import にアクセス
4. CSVファイルをアップロード
5. インポート結果を確認
6. エラーがあれば修正して再実行
```

**CSV フォーマット例**:
```csv
name,nameJa,cardSet,cardNumber,rarity,condition,price,stock,language,foil,firstEdition,graded,gradingCompany,grade,description
Pikachu ex,ピカチュウex,Scarlet ex,025/165,RR,MINT,1500,10,EN,false,false,false,,,Electric-type Pokemon card
Charizard ex SAR,リザードンex SAR,Violet ex,006/078,SAR,MINT,15000,1,JP,true,false,false,,,Ultra rare special art
```

#### 方法3: API経由（プログラム）

```bash
curl -X POST https://card-shop-ec-orpin.vercel.app/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Test Card",
    "price": 1000,
    "stock": 5,
    "cardSet": "Test Set",
    "rarity": "RARE"
  }'
```

### 9.3 データベースバックアップ

**Supabase での自動バックアップ**:
- Supabase は自動的に毎日バックアップを取得
- 7日間保持（Freeプラン）
- ダッシュボードから復元可能

**手動バックアップ**:
```bash
# pg_dump でダンプ
pg_dump -h db.rzxbwmxkmrseyobmffkn.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -b \
  -v \
  -f backup_$(date +%Y%m%d).dump

# または Supabase CLI
supabase db dump -f backup.sql
```

**リストア**:
```bash
# pg_restore
pg_restore -h db.rzxbwmxkmrseyobmffkn.supabase.co \
  -U postgres \
  -d postgres \
  -v backup_20251119.dump
```

---

## 10. トラブルシューティング

### 10.1 よくある問題と解決策

#### 問題1: `npm install` でエラー

**エラー例**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**解決策**:
```bash
# node_modules と package-lock.json を削除
rm -rf node_modules package-lock.json

# クリーンインストール
npm install --legacy-peer-deps

# または
npm ci
```

#### 問題2: Prisma クライアントが見つからない

**エラー例**:
```
Error: @prisma/client did not initialize yet
```

**解決策**:
```bash
# Prisma クライアントを再生成
npm run db:generate

# または
npx prisma generate
```

#### 問題3: DATABASE_URL が見つからない

**エラー例**:
```
Environment variable not found: DATABASE_URL
```

**解決策**:
```bash
# .env.local ファイルが存在するか確認
ls -la .env.local

# なければ作成
cp .env.example .env.local

# 内容を確認・編集
nano .env.local
```

#### 問題4: ポート 3000 が既に使用中

**エラー例**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解決策**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# または別のポートで起動
PORT=3001 npm run dev
```

#### 問題5: カートに追加できない

**確認ポイント**:
```bash
# 1. ブラウザのコンソールでエラー確認（F12）
# 2. localStorage が有効か確認
localStorage.getItem('cart-storage')

# 3. JavaScript が有効か確認
console.log('JavaScript is working')

# 4. Zustand ストアが初期化されているか
# ページソースで bundle.js が読み込まれているか確認
```

#### 問題6: ビルドエラー（型エラー）

**エラー例**:
```
Type error: Property 'id' does not exist on type ...
```

**解決策**:
```bash
# TypeScript の型定義を確認
# src/types/ 配下のファイルを確認

# 型キャッシュをクリア
rm -rf .next
npm run build
```

### 10.2 ログ確認

#### Vercel ログ

```
1. Vercel Dashboard にログイン
2. プロジェクトを選択
3. Deployments タブ
4. 最新デプロイをクリック
5. "View Function Logs" でAPI Routeのログ確認
```

#### ローカルログ

```bash
# 開発サーバーのコンソールログ
npm run dev
# → コンソールに出力

# ブラウザのコンソールログ
# F12 → Console タブ
```

### 10.3 緊急時対応

#### サイトがダウンした場合

```
1. Vercel Status を確認
   https://www.vercel-status.com/

2. デプロイ履歴を確認
   前回の正常なデプロイにロールバック

3. Supabase Status を確認
   https://status.supabase.com/

4. 環境変数が正しいか確認
   Vercel Dashboard → Settings → Environment Variables
```

#### データベース接続エラー

```bash
# Supabase Dashboard で確認
https://supabase.com/dashboard/project/rzxbwmxkmrseyobmffkn

# Pause されていないか確認
# Connection string が正しいか確認

# Prisma で接続テスト
npx prisma db pull
```

---

## 11. 今後の開発タスク

### 11.1 優先度別タスク

#### P0 - 緊急（すぐに必要）

- [ ] カート機能の動作確認と修正（デバッグログで調査中）
- [ ] Google OAuth 設定（CLIENT_ID, CLIENT_SECRET）
- [ ] 商品画像アップロード機能

#### P1 - 高（近日中に必要）

- [ ] CSV 一括インポート実装
- [ ] 商品詳細ページの完全実装
- [ ] フィルタ機能のAPI連携
- [ ] 管理画面：商品編集・削除
- [ ] 多言語化（i18n）実装

#### P2 - 中（余裕があれば）

- [ ] 検索機能の実装
- [ ] レビューシステム
- [ ] 在庫アラート機能
- [ ] メール通知（注文確認等）
- [ ] クーポン機能

#### P3 - 低（将来的に）

- [ ] おすすめ商品アルゴリズム
- [ ] ウィッシュリスト共有
- [ ] 価格変動通知
- [ ] アクセス解析（Google Analytics）
- [ ] パフォーマンス最適化

### 11.2 技術的負債

- ESLint警告の修正（`any` 型の削除）
- コンソールログの削除（本番環境）
- 未使用コンポーネントの削除
- テストコードの追加（Jest）
- エラーハンドリングの統一

---

## 12. 連絡先・リソース

### 12.1 重要リンク

| 項目 | URL |
|------|-----|
| **本番サイト** | https://card-shop-ec-orpin.vercel.app |
| **GitHub** | https://github.com/rikimaru63/card-shop-ec |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/rzxbwmxkmrseyobmffkn |
| **Next.js Docs** | https://nextjs.org/docs |
| **Prisma Docs** | https://www.prisma.io/docs |
| **Shadcn/UI** | https://ui.shadcn.com/ |

### 12.2 ドキュメント

**プロジェクト内ドキュメント**:
- `README.md` - プロジェクト概要
- `IMPLEMENTATION_PLAN.md` - 実装計画
- `IMPLEMENTATION_COMPLETE.md` - 実装完了報告
- `CART_DEBUG_GUIDE.md` - カート機能デバッグガイド
- `CART_VERIFICATION.md` - カート動作確認手順
- `TEST_CHECKLIST.md` - テストチェックリスト
- `TEST_RESULTS.md` - テスト結果
- `FIXES_SUMMARY.md` - バグ修正サマリー

### 12.3 パスワード・認証情報

**⚠️ 重要: 以下は厳重に管理してください**

```
Supabase Project:
- Project ID: rzxbwmxkmrseyobmffkn
- Database Password: S_6361acb!!
- Region: us-east-1

GitHub:
- Repository: rikimaru63/card-shop-ec
- Branch: master

NextAuth:
- Secret: zvP5EJiDxXAguiMIG2hzMVDF8vh/Yg8AUIpjwAM6nmw=
```

**これらは `.env.local` に保存され、Gitには含まれません（.gitignore）**

---

## 付録A: コマンドリファレンス

```bash
# === 開発 ===
npm run dev              # 開発サーバー起動 (localhost:3000)
npm run build            # 本番ビルド
npm run start            # 本番モードで起動
npm run lint             # ESLint チェック

# === データベース ===
npm run db:push          # スキーマを DB に適用
npm run db:migrate       # マイグレーション作成・実行
npm run db:studio        # Prisma Studio 起動 (GUI)
npm run db:generate      # Prisma クライアント生成
npm run db:seed          # シードデータ投入

# === Git ===
git status               # 変更確認
git add -A               # 全変更をステージング
git commit -m "message"  # コミット
git push origin master   # プッシュ（デプロイトリガー）
git pull origin master   # 最新取得

# === トラブルシューティング ===
rm -rf node_modules package-lock.json && npm install  # クリーンインストール
rm -rf .next && npm run build                          # ビルドキャッシュクリア
npx prisma generate                                    # Prisma 再生成
```

---

**ドキュメント作成日**: 2025-11-19  
**最終更新日**: 2025-11-19  
**作成者**: Claude Code  
**バージョン**: 1.0.0

---

## 更新履歴

| 日付 | 版 | 変更内容 | 担当者 |
|------|---|---------|--------|
| 2025-11-19 | 1.0.0 | 初版作成 | Claude |

---

**このドキュメントについて**:
- 新規開発者がプロジェクトを引き継ぐために必要な全情報を記載
- 定期的に更新し、最新状態を保つこと
- 不明点があれば、GitHub の Issues で質問推奨
