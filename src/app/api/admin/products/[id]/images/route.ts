import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadImage, deleteImage } from '@/lib/cloudinary'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// GET - Get all images for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const images = await prisma.productImage.findMany({
      where: { productId: params.id },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { error: '画像の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST - Add image to product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!product) {
      return NextResponse.json(
        { error: '商品が見つかりません' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const alt = (formData.get('alt') as string) || product.name

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '対応していないファイル形式です' },
        { status: 400 }
      )
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadResult = await uploadImage(buffer, `products/${params.id}`)

    // Get the highest order number for this product
    const lastImage = await prisma.productImage.findFirst({
      where: { productId: params.id },
      orderBy: { order: 'desc' }
    })
    const nextOrder = lastImage ? lastImage.order + 1 : 0

    // Create image record
    const image = await prisma.productImage.create({
      data: {
        url: uploadResult.url,
        alt: alt,
        order: nextOrder,
        productId: params.id
      }
    })

    return NextResponse.json({
      success: true,
      image
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: '画像のアップロードに失敗しました' },
      { status: 500 }
    )
  }
}

// PUT - Update image order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { images } = body // Array of { id, order }

    if (!Array.isArray(images)) {
      return NextResponse.json(
        { error: '無効なリクエストです' },
        { status: 400 }
      )
    }

    // Update each image's order
    await Promise.all(
      images.map(({ id, order }) =>
        prisma.productImage.update({
          where: { id, productId: params.id },
          data: { order }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating image order:', error)
    return NextResponse.json(
      { error: '画像の順序更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE - Delete image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json(
        { error: '画像IDが指定されていません' },
        { status: 400 }
      )
    }

    // Get image
    const image = await prisma.productImage.findUnique({
      where: { id: imageId }
    })

    if (!image || image.productId !== params.id) {
      return NextResponse.json(
        { error: '画像が見つかりません' },
        { status: 404 }
      )
    }

    // Extract public_id from URL and delete from Cloudinary
    const urlParts = image.url.split('/')
    const publicIdWithExtension = urlParts.slice(-2).join('/')
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '')
    await deleteImage(publicId)

    // Delete from database
    await prisma.productImage.delete({
      where: { id: imageId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: '画像の削除に失敗しました' },
      { status: 500 }
    )
  }
}
