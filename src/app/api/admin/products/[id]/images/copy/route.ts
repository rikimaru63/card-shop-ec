import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadImage } from '@/lib/cloudinary'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * POST - コピー元商品の画像を、新商品用に「独立した実体」として複製する。
 *
 * 重要(既存商品保護): 画像 URL をそのまま共有すると、後で片方の商品の画像を削除した際に
 * 共有実体（VPS/Cloudinary 上のファイル）が消え、コピー元の画像まで壊れる。これを避けるため、
 * 元画像のバイトを取得し直し、uploadImage() で新規アップロードして別実体を作る。
 *
 * body: { images: { url: string; alt?: string }[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })
    if (!product) {
      return NextResponse.json({ error: '商品が見つかりません' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const sources: { url?: unknown; alt?: unknown }[] = Array.isArray(body?.images)
      ? body.images
      : []

    if (sources.length === 0) {
      return NextResponse.json({ success: true, copied: 0, failed: 0 })
    }

    // 既存画像の最大 order を取得し、その続きから採番する（追加済みの新規画像と衝突させない）。
    const lastImage = await prisma.productImage.findFirst({
      where: { productId: params.id },
      orderBy: { order: 'desc' },
    })
    let nextOrder = lastImage ? lastImage.order + 1 : 0

    const createdImages = []
    const failedUrls: string[] = []

    for (const src of sources) {
      const url = typeof src?.url === 'string' ? src.url : ''
      if (!url) continue

      try {
        // 元画像のバイトを取得（VPS 画像サーバー / Cloudinary いずれの公開 URL でも可）。
        const res = await fetch(url)
        if (!res.ok) throw new Error(`source fetch failed: ${res.status}`)
        const buffer = Buffer.from(await res.arrayBuffer())

        // 新規アップロード = 独立した実体を生成（元商品と非共有）。
        const uploaded = await uploadImage(buffer, `products/${params.id}`)

        const image = await prisma.productImage.create({
          data: {
            url: uploaded.url,
            alt: typeof src.alt === 'string' && src.alt ? src.alt : product.name,
            order: nextOrder,
            productId: params.id,
          },
        })
        createdImages.push(image)
        nextOrder += 1
      } catch (e) {
        console.error('Failed to copy image:', url, e)
        failedUrls.push(url)
      }
    }

    return NextResponse.json({
      success: true,
      copied: createdImages.length,
      failed: failedUrls.length,
      images: createdImages,
    })
  } catch (error) {
    console.error('Error copying images:', error)
    return NextResponse.json({ error: '画像の複製に失敗しました' }, { status: 500 })
  }
}
