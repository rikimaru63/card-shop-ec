"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { Upload, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImagePreviewProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  maxImages?: number
}

export function ImagePreview({ images, onImagesChange, maxImages = 5 }: ImagePreviewProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Create preview URLs when images change
  useEffect(() => {
    // Clean up old URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url))

    // Create new URLs
    const urls = images.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)

    // Cleanup on unmount
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [images])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length
    const filesToAdd = fileArray.slice(0, remainingSlots)

    if (filesToAdd.length > 0) {
      onImagesChange([...images, ...filesToAdd])
    }

    // Reset input
    e.target.value = ''
  }

  const handleDelete = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
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

    onImagesChange(newImages)
    setDraggedIndex(index)
  }, [draggedIndex, images, onImagesChange])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">商品画像プレビュー</h3>
        <span className="text-xs text-gray-500">
          {images.length}/{maxImages}枚
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2
              ${draggedIndex === index ? 'border-blue-500 opacity-50' : 'border-transparent'}
              hover:border-gray-300 cursor-move`}
          >
            {previewUrls[index] && (
              <Image
                src={previewUrls[index]}
                alt={file.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            )}

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
                onClick={() => handleDelete(index)}
                className="p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* File name tooltip */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {file.name}
            </div>
          </div>
        ))}

        {/* Upload button */}
        {images.length < maxImages && (
          <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 hover:bg-gray-100 transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="mt-2 text-sm text-gray-500">追加</span>
          </label>
        )}
      </div>

      <p className="text-xs text-gray-500">
        ドラッグ＆ドロップで順序を変更できます。最初の画像がメイン画像になります。
      </p>
    </div>
  )
}
