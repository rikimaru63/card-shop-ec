"use client"

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, GripVertical, Loader2 } from 'lucide-react'

interface ProductImage {
  id: string
  url: string
  alt: string | null
  order: number
}

interface ImageUploadProps {
  productId: string
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
}

export default function ImageUpload({ productId, images, onImagesChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newImages: ProductImage[] = []

    // Convert FileList to array for better Edge compatibility
    const fileArray: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file) fileArray.push(file)
    }

    for (const file of fileArray) {
      const formData = new FormData()
      // Explicitly set filename for Edge compatibility
      formData.append('file', file, file.name)

      try {
        const response = await fetch(`/api/admin/products/${productId}/images`, {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header - let browser set it with boundary
        })

        if (response.ok) {
          const data = await response.json()
          if (data.image) {
            newImages.push(data.image)
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Upload failed:', response.status, errorData)
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages])
    }

    setUploading(false)
    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }

  const handleDelete = async (imageId: string) => {
    if (!confirm('この画像を削除しますか？')) return

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images?imageId=${imageId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        onImagesChange(images.filter(img => img.id !== imageId))
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    // Update order
    newImages.forEach((img, i) => {
      img.order = i
    })

    onImagesChange(newImages)
    setDraggedIndex(index)
  }, [draggedIndex, images, onImagesChange])

  const handleDragEnd = useCallback(async () => {
    if (draggedIndex === null) return

    // Save new order to server
    try {
      await fetch(`/api/admin/products/${productId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img, index) => ({ id: img.id, order: index }))
        })
      })
    } catch (error) {
      console.error('Order update error:', error)
    }

    setDraggedIndex(null)
  }, [draggedIndex, images, productId])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">商品画像</h3>
        <span className="text-xs text-gray-500">{images.length}枚</span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2
              ${draggedIndex === index ? 'border-blue-500 opacity-50' : 'border-transparent'}
              hover:border-gray-300 cursor-move`}
          >
            <Image
              src={image.url}
              alt={image.alt || '商品画像'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />

            {/* Order badge */}
            {index === 0 && (
              <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                メイン
              </span>
            )}

            {/* Drag handle and delete button */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <GripVertical className="h-6 w-6 text-white" />
              <button
                onClick={() => handleDelete(image.id)}
                className="p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload button */}
        <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 hover:bg-gray-100 transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">追加</span>
            </>
          )}
        </label>
      </div>

      <p className="text-xs text-gray-500">
        ドラッグ＆ドロップで順序を変更できます。最初の画像がメイン画像になります。
      </p>
    </div>
  )
}
