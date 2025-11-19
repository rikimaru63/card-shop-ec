#!/bin/bash
# Supabase自動セットアップスクリプト

set -e

echo "=== Supabase自動セットアップ開始 ==="

# 1. プロジェクト一覧確認
echo "既存プロジェクト確認中..."
npx supabase projects list

# 2. 新規プロジェクト作成（既存がない場合）
read -p "新規プロジェクトを作成しますか？ (y/n): " CREATE_NEW

if [ "$CREATE_NEW" = "y" ]; then
  echo "プロジェクト作成中..."
  npx supabase projects create card-shop-ec \
    --org-id $(npx supabase orgs list --format json | jq -r '.[0].id') \
    --db-password $(openssl rand -base64 32) \
    --region ap-northeast-1
else
  read -p "使用するProject Ref IDを入力: " PROJECT_REF
fi

# 3. プロジェクトとリンク
echo "プロジェクトリンク中..."
npx supabase link --project-ref ${PROJECT_REF}

# 4. 接続情報取得
echo "接続情報取得中..."
DB_URL=$(npx supabase db dump --project-ref ${PROJECT_REF} --dump-connection-string)
SUPABASE_URL=$(npx supabase projects api-keys --project-ref ${PROJECT_REF} --format json | jq -r '.url')
ANON_KEY=$(npx supabase projects api-keys --project-ref ${PROJECT_REF} --format json | jq -r '.anon')
SERVICE_KEY=$(npx supabase projects api-keys --project-ref ${PROJECT_REF} --format json | jq -r '.service_role')

# 5. .env.local生成
echo "環境変数ファイル生成中..."
cat > .env.local <<EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SERVICE_KEY}"
DATABASE_URL="${DB_URL}"

# NextAuth
NEXTAUTH_URL="https://card-shop-ec-orpin.vercel.app"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF

echo ".env.local作成完了"

# 6. Prismaマイグレーション
echo "Prismaマイグレーション実行中..."
npx prisma db push

# 7. Vercel環境変数設定
echo "Vercel環境変数設定中..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production < <(echo "${SUPABASE_URL}")
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < <(echo "${ANON_KEY}")
vercel env add SUPABASE_SERVICE_ROLE_KEY production < <(echo "${SERVICE_KEY}")
vercel env add DATABASE_URL production < <(echo "${DB_URL}")
vercel env add NEXTAUTH_URL production < <(echo "https://card-shop-ec-orpin.vercel.app")
vercel env add NEXTAUTH_SECRET production < <(echo "$(openssl rand -base64 32)")

echo "=== セットアップ完了 ==="
echo "次のコマンドでデプロイ: vercel --prod"
