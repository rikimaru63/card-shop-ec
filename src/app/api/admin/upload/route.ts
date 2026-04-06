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

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${randomUUID()}.${ext}`
    const relativePath = `${folder}/${filename}`

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
