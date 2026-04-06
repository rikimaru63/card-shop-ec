# Cloudinary → VPS Image Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cloudinaryから全2,363枚の商品画像をVPSにサルベージし、VPSのNginxコンテナから直接配信する構成に切り替える。完了後Cloudinaryを解約。

**Architecture:** VPS上にNginxコンテナを立て、画像ファイルを静的配信する。Traefikがimages.samuraicardhub.comへのリクエストをNginxに転送。アプリ側はDB内の画像URLを新ドメインに一括書き換え。Cloudinaryの依存を完全に除去。

**Tech Stack:** Docker (Nginx), Traefik (Coolify proxy), PostgreSQL, Next.js

---

## File Structure

### VPS上の新規作成
- `/root/image-server/docker-compose.yml` — Nginx画像配信コンテナ定義
- `/root/image-server/nginx.conf` — Nginx設定（キャッシュ、CORS、圧縮）
- `/root/image-server/images/products/` — サルベージした画像ファイル格納先

### アプリ側の変更
- Modify: `next.config.js` — `images.remotePatterns`にVPSドメイン追加
- Modify: `src/lib/cloudinary.ts` — アップロード先をVPS APIに変更
- Create: `src/app/api/admin/upload/route.ts` — VPS向け画像アップロードAPI
- Modify: `src/app/api/products/route.ts` — 画像フォールバックパス更新（影響確認のみ）

---

## Task 1: Cloudinaryから全画像をVPSにダウンロード

**実行場所:** VPS (ssh root@100.114.184.59)

- [ ] **Step 1: バックアップディレクトリを作成**

```bash
ssh root@100.114.184.59 "mkdir -p /root/image-server/images/products"
```

- [ ] **Step 2: DBから画像URL一覧をエクスポート**

```bash
ssh root@100.114.184.59 'docker exec qgcg0c8s08w44400c44ww0w0 psql -U postgres -d postgres -t -A -c "SELECT id, url, \"productId\" FROM \"ProductImage\" ORDER BY \"productId\";" > /root/image-server/image-list.csv'
```

- [ ] **Step 3: ダウンロードスクリプトを作成してVPSに転送**

VPS上に `/root/image-server/download.sh` を作成:

```bash
#!/bin/bash
SAVE_DIR="/root/image-server/images/products"
INPUT="/root/image-server/image-list.csv"
TOTAL=$(wc -l < "$INPUT")
COUNT=0
FAIL=0
SUCCESS=0

echo "=== Cloudinary Image Salvage ==="
echo "Total images: $TOTAL"

while IFS='|' read -r img_id url product_id; do
  [ -z "$url" ] && continue
  COUNT=$((COUNT + 1))

  # URLからCloudinary public_idを抽出してファイル名にする
  # 例: https://res.cloudinary.com/.../products/cmj7b2vgb/bq1igso.jpg → cmj7b2vgb_bq1igso.jpg
  BASENAME=$(echo "$url" | sed 's|.*/products/||' | tr '/' '_')
  [ -z "$BASENAME" ] && BASENAME="${img_id}.jpg"
  FILEPATH="${SAVE_DIR}/${BASENAME}"

  if [ -f "$FILEPATH" ] && [ -s "$FILEPATH" ]; then
    SUCCESS=$((SUCCESS + 1))
    [ $((COUNT % 100)) -eq 0 ] && echo "[$COUNT/$TOTAL] Progress... ($SUCCESS ok, $FAIL fail)"
    continue
  fi

  HTTP_CODE=$(curl -s -w "%{http_code}" -o "$FILEPATH" --max-time 30 "$url")

  if [ "$HTTP_CODE" = "200" ] && [ -s "$FILEPATH" ]; then
    SUCCESS=$((SUCCESS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "[$COUNT/$TOTAL] FAIL (HTTP $HTTP_CODE): $BASENAME"
    rm -f "$FILEPATH"
  fi

  [ $((COUNT % 100)) -eq 0 ] && echo "[$COUNT/$TOTAL] Progress... ($SUCCESS ok, $FAIL fail)"
done < "$INPUT"

echo ""
echo "=== Complete ==="
echo "Success: $SUCCESS / $TOTAL"
echo "Failed: $FAIL"
echo "Total size: $(du -sh $SAVE_DIR | cut -f1)"
```

- [ ] **Step 4: ダウンロードを実行**

```bash
ssh root@100.114.184.59 "chmod +x /root/image-server/download.sh && /root/image-server/download.sh"
```

Expected: 2,363枚すべてダウンロード成功。失敗があれば再実行（冪等設計）。

- [ ] **Step 5: ダウンロード結果を検証**

```bash
ssh root@100.114.184.59 "echo 'Files: ' && ls -1 /root/image-server/images/products/ | wc -l && echo 'Size: ' && du -sh /root/image-server/images/products/"
```

Expected: Files: 2363, Size: 200-500MB程度

---

## Task 2: VPS上にNginx画像配信サーバーを構築

**実行場所:** VPS

- [ ] **Step 1: Nginx設定ファイルを作成**

VPS上に `/root/image-server/nginx.conf` を作成:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;

    # 画像配信
    location /products/ {
        # CORSヘッダー
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Cache-Control "public, max-age=31536000, immutable" always;

        # 画像MIME types
        types {
            image/jpeg jpg jpeg;
            image/png png;
            image/webp webp;
            image/svg+xml svg;
            image/gif gif;
        }

        try_files $uri =404;
    }

    # ヘルスチェック
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

- [ ] **Step 2: Docker Compose定義を作成**

VPS上に `/root/image-server/docker-compose.yml` を作成:

```yaml
version: "3.8"

services:
  image-server:
    image: nginx:alpine
    container_name: samurai-image-server
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./images:/usr/share/nginx/html:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.samurai-images-https.rule=Host(`images.samuraicardhub.com`)"
      - "traefik.http.routers.samurai-images-https.entryPoints=https"
      - "traefik.http.routers.samurai-images-https.tls=true"
      - "traefik.http.routers.samurai-images-https.tls.certresolver=letsencrypt"
      - "traefik.http.routers.samurai-images-http.rule=Host(`images.samuraicardhub.com`)"
      - "traefik.http.routers.samurai-images-http.entryPoints=http"
      - "traefik.http.routers.samurai-images-http.middlewares=redirect-to-https"
      - "traefik.http.services.samurai-images.loadbalancer.server.port=80"
    networks:
      - coolify

networks:
  coolify:
    external: true
```

- [ ] **Step 3: コンテナを起動**

```bash
ssh root@100.114.184.59 "cd /root/image-server && docker compose up -d"
```

- [ ] **Step 4: Traefikネットワークに接続されているか確認**

```bash
ssh root@100.114.184.59 "docker network inspect coolify --format='{{range .Containers}}{{.Name}} {{end}}' | tr ' ' '\n' | grep samurai"
```

Expected: `samurai-image-server` が表示される

- [ ] **Step 5: ヘルスチェック（ローカル）**

```bash
ssh root@100.114.184.59 "curl -s http://localhost:\$(docker port samurai-image-server 80 | cut -d: -f2)/health"
```

Expected: `OK`

---

## Task 3: DNSにimages.samuraicardhub.comを設定

**実行場所:** DNS管理画面（Cloudflare等）

- [ ] **Step 1: 現在のDNSレコードを確認**

samuraicardhub.comのDNS設定を確認。VPSのIPに向いているAレコードを確認。

- [ ] **Step 2: サブドメインのAレコードを追加**

```
Type: A
Name: images
Value: (VPSのパブリックIP)
TTL: 300 (初期は短く)
Proxy: OFF (Cloudflareプロキシ無効 — Let's Encrypt証明書発行のため)
```

- [ ] **Step 3: DNS伝播を確認**

```bash
dig images.samuraicardhub.com +short
```

Expected: VPSのIPが返る

- [ ] **Step 4: HTTPS疎通確認**

```bash
curl -sI "https://images.samuraicardhub.com/health"
```

Expected: `HTTP/2 200` + `OK`

- [ ] **Step 5: 画像配信テスト**

DBから1件のURLを取得し、新URLで画像が取れるか確認:

```bash
# 元URL: https://res.cloudinary.com/djuthqgt4/image/upload/v.../products/XXXXX/YYYYY.jpg
# 新URL: https://images.samuraicardhub.com/products/XXXXX_YYYYY.jpg
ssh root@100.114.184.59 "ls /root/image-server/images/products/ | head -1"
# → そのファイル名で:
curl -sI "https://images.samuraicardhub.com/products/<filename>"
```

Expected: `HTTP/2 200`, `Content-Type: image/jpeg`

---

## Task 4: DB内の画像URLを一括書き換え

**実行場所:** VPS (PostgreSQL直接操作)

- [ ] **Step 1: 書き換え対象の確認**

```bash
ssh root@100.114.184.59 'docker exec qgcg0c8s08w44400c44ww0w0 psql -U postgres -d postgres -c "SELECT COUNT(*) FROM \"ProductImage\" WHERE url LIKE '\''%cloudinary%'\'';"'
```

Expected: 2363

- [ ] **Step 2: URL変換マッピングスクリプトを作成**

VPS上に `/root/image-server/update-urls.sql` を作成。Cloudinary URLのパターン:
```
https://res.cloudinary.com/djuthqgt4/image/upload/v{version}/products/{folder}/{filename}.{ext}
```

新URLのパターン:
```
https://images.samuraicardhub.com/products/{folder}_{filename}.{ext}
```

SQL:

```sql
-- まずバックアップテーブル作成
CREATE TABLE IF NOT EXISTS "ProductImage_backup" AS SELECT * FROM "ProductImage";

-- URL書き換え
-- Cloudinary URL: .../products/FOLDER/FILENAME.ext
-- 新URL: https://images.samuraicardhub.com/products/FOLDER_FILENAME.ext
UPDATE "ProductImage"
SET url = 'https://images.samuraicardhub.com/products/' ||
  REPLACE(
    SUBSTRING(url FROM '/products/(.+)$'),
    '/', '_'
  )
WHERE url LIKE '%res.cloudinary.com%';
```

- [ ] **Step 3: バックアップを確認**

```bash
ssh root@100.114.184.59 'docker exec qgcg0c8s08w44400c44ww0w0 psql -U postgres -d postgres -c "SELECT COUNT(*) FROM \"ProductImage_backup\";"'
```

Expected: 2363

- [ ] **Step 4: URL書き換えを実行**

```bash
ssh root@100.114.184.59 'docker exec qgcg0c8s08w44400c44ww0w0 psql -U postgres -d postgres -f /root/image-server/update-urls.sql'
```

注意: SQLファイルはコンテナ内から見える場所に置く必要がある。代わりにSQL文を直接実行する。

```bash
ssh root@100.114.184.59 'docker exec qgcg0c8s08w44400c44ww0w0 psql -U postgres -d postgres -c "
CREATE TABLE IF NOT EXISTS \"ProductImage_backup\" AS SELECT * FROM \"ProductImage\";
"'

ssh root@100.114.184.59 'docker exec qgcg0c8s08w44400c44ww0w0 psql -U postgres -d postgres -c "
UPDATE \"ProductImage\"
SET url = '\''https://images.samuraicardhub.com/products/'\'' ||
  REPLACE(
    SUBSTRING(url FROM '\''/products/(.+)$'\''),
    '\''/'\'', '\''_'\''
  )
WHERE url LIKE '\''%res.cloudinary.com%'\'';
"'
```

- [ ] **Step 5: 書き換え結果を検証**

```bash
ssh root@100.114.184.59 'docker exec qgcg0c8s08w44400c44ww0w0 psql -U postgres -d postgres -c "SELECT url FROM \"ProductImage\" LIMIT 3;"'
```

Expected: `https://images.samuraicardhub.com/products/...` 形式のURL

- [ ] **Step 6: 画像が実際にアクセスできるか検証**

```bash
# DBから新URLを1件取得してcurlで確認
ssh root@100.114.184.59 'docker exec qgcg0c8s08w44400c44ww0w0 psql -U postgres -d postgres -t -A -c "SELECT url FROM \"ProductImage\" LIMIT 1;"'
# → そのURLをcurl
curl -sI "<上記のURL>"
```

Expected: `HTTP/2 200`

---

## Task 5: Next.jsアプリの画像設定を更新

**実行場所:** ローカル開発環境 (C:\Users\admin\Desktop\開発\SamuraiCardhub)

**Files:**
- Modify: `next.config.js`

- [ ] **Step 1: next.config.jsにVPS画像ドメインを追加**

`next.config.js` の `images.remotePatterns` に追加:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'cloudinary.com', 'res.cloudinary.com', 'images.unsplash.com', 'images.samuraicardhub.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.samuraicardhub.com',
      },
    ],
    dangerouslyAllowSVG: true,
  },
}

module.exports = nextConfig
```

- [ ] **Step 2: ビルド確認**

```bash
cd "C:/Users/admin/Desktop/開発/SamuraiCardhub" && npx next build 2>&1 | tail -10
```

Expected: Build成功

- [ ] **Step 3: コミット**

```bash
git add next.config.js
git commit -m "feat: VPS画像サーバーのドメインをNext.js設定に追加"
```

---

## Task 6: 新しい画像アップロードをVPS対応に変更

**実行場所:** ローカル開発環境

**Files:**
- Create: `src/app/api/admin/upload/route.ts`
- Modify: `src/lib/cloudinary.ts`

- [ ] **Step 1: VPS画像アップロードAPIを作成**

Create `src/app/api/admin/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthorized } from '@/lib/admin-auth'
import { randomUUID } from 'crypto'

const IMAGE_SERVER_DIR = process.env.IMAGE_SERVER_PATH || '/root/image-server/images'
const IMAGE_SERVER_URL = process.env.IMAGE_SERVER_URL || 'https://images.samuraicardhub.com'

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'products'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ファイルサイズチェック (10MB上限)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // 画像タイプチェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // ファイル名生成
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${randomUUID()}.${ext}`
    const relativePath = `${folder}/${filename}`

    // VPSに直接保存（アプリとVPSが同一サーバー）
    const { writeFile, mkdir } = await import('fs/promises')
    const path = await import('path')
    const saveDir = path.join(IMAGE_SERVER_DIR, folder)
    await mkdir(saveDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(saveDir, filename), buffer)

    const url = `${IMAGE_SERVER_URL}/${relativePath}`

    return NextResponse.json({
      url,
      publicId: relativePath,
      width: 0,
      height: 0,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: cloudinary.tsのuploadImage関数を更新**

`src/lib/cloudinary.ts` を更新。Cloudinaryの代わりにVPSアップロードAPIを呼ぶように変更:

```typescript
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary (kept for legacy compatibility)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
}

/**
 * Upload image to VPS image server.
 * Falls back to Cloudinary if VPS upload is not configured.
 */
export async function uploadImage(
  file: Buffer | string,
  folder: string = 'products'
): Promise<UploadResult> {
  const imageServerPath = process.env.IMAGE_SERVER_PATH
  const imageServerUrl = process.env.IMAGE_SERVER_URL

  if (imageServerPath && imageServerUrl) {
    // VPS直接書き込み
    const { writeFile, mkdir } = await import('fs/promises')
    const path = await import('path')
    const { randomUUID } = await import('crypto')

    const filename = `${randomUUID()}.jpg`
    const saveDir = path.join(imageServerPath, folder)
    await mkdir(saveDir, { recursive: true })

    let buffer: Buffer
    if (Buffer.isBuffer(file)) {
      buffer = file
    } else {
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '')
      buffer = Buffer.from(base64Data, 'base64')
    }

    await writeFile(path.join(saveDir, filename), buffer)

    return {
      url: `${imageServerUrl}/${folder}/${filename}`,
      publicId: `${folder}/${filename}`,
      width: 0,
      height: 0,
    }
  }

  // Fallback: Cloudinary
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          })
        }
      }
    )

    if (Buffer.isBuffer(file)) {
      uploadStream.end(file)
    } else {
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      uploadStream.end(buffer)
    }
  })
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    // VPS画像の場合
    if (publicId.startsWith('products/')) {
      const imageServerPath = process.env.IMAGE_SERVER_PATH
      if (imageServerPath) {
        const { unlink } = await import('fs/promises')
        const path = await import('path')
        await unlink(path.join(imageServerPath, publicId))
        return true
      }
    }
    // Cloudinary画像の場合
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Failed to delete image:', error)
    return false
  }
}

export { cloudinary }
```

- [ ] **Step 3: 本番環境変数に追加**

Coolifyの環境変数に以下を追加:

```
IMAGE_SERVER_PATH=/root/image-server/images
IMAGE_SERVER_URL=https://images.samuraicardhub.com
```

注意: アプリコンテナからVPSのファイルシステムにアクセスするために、docker-composeでボリュームマウントが必要。Coolifyの設定でカスタムボリュームを追加:

```
/root/image-server/images:/root/image-server/images
```

- [ ] **Step 4: ビルド確認**

```bash
cd "C:/Users/admin/Desktop/開発/SamuraiCardhub" && npx next build 2>&1 | tail -10
```

- [ ] **Step 5: コミット**

```bash
git add src/app/api/admin/upload/route.ts src/lib/cloudinary.ts
git commit -m "feat: 画像アップロード先をVPS画像サーバーに変更（Cloudinaryフォールバック付き）"
```

---

## Task 7: デプロイと最終検証

**実行場所:** VPS + ブラウザ

- [ ] **Step 1: コード変更をプッシュしてCoolifyでデプロイ**

```bash
git push origin master
```

Coolifyが自動デプロイを実行する。

- [ ] **Step 2: サイトの画像表示を確認**

ブラウザで https://samuraicardhub.com を開き、商品画像が表示されることを確認。

- [ ] **Step 3: 画像URLが新ドメインになっているか確認**

```bash
curl -s "https://samuraicardhub.com/api/products?limit=3" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for p in data.get('products', [])[:3]:
    print(f\"{p['name'][:30]}  →  {p['image'][:60]}\")
"
```

Expected: `https://images.samuraicardhub.com/products/...` 形式

- [ ] **Step 4: 管理画面から新規画像アップロードをテスト**

管理画面で任意の商品を編集し、画像をアップロード。アップロード後のURLが `images.samuraicardhub.com` になっていることを確認。

- [ ] **Step 5: ロールバック用にDB URLバックアップを保持**

```bash
ssh root@100.114.184.59 'docker exec qgcg0c8s08w44400c44ww0w0 psql -U postgres -d postgres -c "SELECT COUNT(*) FROM \"ProductImage_backup\";"'
```

バックアップテーブルが残っていることを確認。問題があれば:

```sql
-- ロールバック
UPDATE "ProductImage" pi
SET url = bk.url
FROM "ProductImage_backup" bk
WHERE pi.id = bk.id;
```

---

## Task 8: Cloudinary解約

**実行場所:** Cloudinaryダッシュボード

- [ ] **Step 1: 全画像が正常に配信されていることを再確認（24時間後）**

Task 7完了後、24時間運用して問題ないことを確認。

- [ ] **Step 2: CloudinaryプランをFreeにダウングレード**

Cloudinary Dashboard → Billing → Plan Details → Change Plan → Free

- [ ] **Step 3: 環境変数からCloudinary設定を削除（任意）**

Cloudinaryフォールバックを残しておく場合は環境変数はそのまま。完全除去する場合は:

```
CLOUDINARY_CLOUD_NAME=（削除）
CLOUDINARY_API_KEY=（削除）
CLOUDINARY_API_SECRET=（削除）
```

- [ ] **Step 4: バックアップテーブルを削除（1週間後）**

問題なく運用できることを確認後:

```sql
DROP TABLE IF EXISTS "ProductImage_backup";
```
