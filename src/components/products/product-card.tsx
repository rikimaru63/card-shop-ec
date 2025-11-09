"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/utils"

interface ProductCardProps {
  id: string
  name: string
  image: string
  price: number
  comparePrice?: number
  category: string
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
  rarity,
  condition,
  stock,
  rating = 0,
  isNew = false,
  isFeatured = false
}: ProductCardProps) {
  const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0
  const isOutOfStock = stock === 0
  const isLowStock = stock > 0 && stock <= 5

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
      <button className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <Heart className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors" />
      </button>

      <Link href={`/products/${id}`}>
        {/* 画像 */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl bg-gradient-to-b from-secondary to-background">
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
            {category}
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
                {condition}
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

      {/* カートボタン */}
      <div className="px-4 pb-4">
        <Button
          size="sm"
          className="w-full"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.preventDefault()
            // TODO: カート追加処理
            console.log("Add to cart:", id)
          }}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  )
}