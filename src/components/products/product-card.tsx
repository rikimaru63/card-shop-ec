"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, ShoppingCart, Star, Check, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatPrice } from "@/lib/utils"
import { formatCategoryName, formatConditionLabel } from "@/lib/filter-config"
import { useCartStore } from "@/store/cart-store"
import { useWishlistStore } from "@/store/wishlist-store"

type ProductType = 'SINGLE' | 'BOX' | 'OTHER'

interface ProductCardProps {
  id: string
  name: string
  image: string
  price: number
  comparePrice?: number
  category: string
  productType?: ProductType
  rarity?: string
  condition?: string
  stock: number
  rating?: number
  isNew?: boolean
  isFeatured?: boolean
}

export function ProductCard({
  id,
  name,
  image,
  price,
  comparePrice,
  category,
  productType,
  rarity,
  condition,
  stock,
  rating = 0,
  isNew = false,
  isFeatured = false
}: ProductCardProps) {
  const [showAddedToCart, setShowAddedToCart] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const isWishlisted = isInWishlist(id)

  const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0
  const isOutOfStock = stock === 0
  const isLowStock = stock > 0 && stock <= 5

  // Check if image URL is valid - must start with http (Cloudinary)
  const hasValidImage = image && image.startsWith('http') && !imageError
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart({
      id,
      name,
      image,
      price,
      category,
      productType,
      rarity,
      condition,
      stock
    }, quantity)
    setShowAddedToCart(true)
    setQuantity(1)
    setTimeout(() => setShowAddedToCart(false), 2000)
  }

  const handleQuantityChange = (e: React.MouseEvent, delta: number) => {
    e.preventDefault()
    e.stopPropagation()
    const newQty = quantity + delta
    if (newQty >= 1 && newQty <= stock) {
      setQuantity(newQty)
    }
  }
  
  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isWishlisted) {
      removeFromWishlist(id)
    } else {
      addToWishlist({
        id,
        name,
        image,
        price,
        category,
        rarity,
        condition,
        stock
      })
    }
  }

  return (
    <div className="group relative bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300">
      {/* バッジ */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {isNew && (
          <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-md">
            NEW
          </span>
        )}
        {isFeatured && (
          <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-md">
            FEATURED
          </span>
        )}
        {discount > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-md">
            -{discount}%
          </span>
        )}
      </div>

      {/* ウィッシュリストボタン */}
      <button 
        onClick={handleToggleWishlist}
        className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Heart className={cn(
          "h-4 w-4 transition-colors",
          isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"
        )} />
      </button>

      <Link href={`/products/${id}`}>
        {/* 画像 */}
        <div
          className="relative overflow-hidden rounded-t-xl"
          style={{ aspectRatio: '3/4', backgroundColor: '#e2e8f0' }}
        >
          {/* プレースホルダー（常に表示、画像がロードされたら隠れる） */}
          {!(hasValidImage && imageLoaded) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#e2e8f0'
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}
              >
                <span style={{ fontSize: '32px' }}>🖼️</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>No Image</span>
            </div>
          )}

          {/* 実際の画像 */}
          {hasValidImage && (
            <img
              src={image}
              alt={name}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              className="group-hover:scale-105 transition-transform duration-500"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          {/* ホバーオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <span className="px-4 py-2 bg-white text-foreground font-semibold rounded-md">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          {/* カテゴリー */}
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
            {formatCategoryName(category)}
          </p>

          {/* タイトル */}
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>

          {/* メタ情報 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {rarity && (
              <span className="px-2 py-0.5 bg-secondary text-xs font-medium rounded">
                {rarity}
              </span>
            )}
            {condition && (
              <span className="px-2 py-0.5 bg-secondary text-xs font-medium rounded">
                {formatConditionLabel(condition)}
              </span>
            )}
          </div>

          {/* レーティング */}
          {rating > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < Math.floor(rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({rating})</span>
            </div>
          )}

          {/* 価格 */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">
                {formatPrice(price)}
              </span>
              {comparePrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(comparePrice)}
                </span>
              )}
            </div>
            {isLowStock && !isOutOfStock && (
              <p className="text-xs text-orange-600 font-medium mt-1">
                Only {stock} left in stock
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* 数量選択 & カートボタン */}
      <div className="px-4 pb-4 space-y-2">
        {!isOutOfStock && (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={(e) => handleQuantityChange(e, -1)}
              disabled={quantity <= 1}
              className="h-7 w-7 flex items-center justify-center rounded border border-input bg-background hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[36px] text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={(e) => handleQuantityChange(e, 1)}
              disabled={quantity >= stock}
              className="h-7 w-7 flex items-center justify-center rounded border border-input bg-background hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
        <Button
          size="sm"
          className="w-full"
          disabled={isOutOfStock || showAddedToCart}
          onClick={handleAddToCart}
        >
          {showAddedToCart ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              カートに追加しました
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isOutOfStock ? "在庫切れ" : "カートに追加"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}