import { v2 as cloudinary } from 'cloudinary'

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
 * VPS画像サーバーに画像をアップロードする。
 * VPSが未設定の場合はCloudinaryにフォールバックする。
 */
export async function uploadImage(
  file: Buffer | string,
  folder: string = 'products'
): Promise<UploadResult> {
  const imageServerPath = process.env.IMAGE_SERVER_PATH
  const imageServerUrl = process.env.IMAGE_SERVER_URL

  if (imageServerPath && imageServerUrl) {
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
    const imageServerPath = process.env.IMAGE_SERVER_PATH
    if (imageServerPath && !publicId.includes('cloudinary')) {
      const { unlink } = await import('fs/promises')
      const path = await import('path')
      await unlink(path.join(imageServerPath, publicId))
      return true
    }
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Failed to delete image:', error)
    return false
  }
}

export { cloudinary }
