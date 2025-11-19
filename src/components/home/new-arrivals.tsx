"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { ProductCard } from "@/components/products/product-card"
import { cn } from "@/lib/utils"

// Mock data - 実際はAPIから取得
const newArrivals = [
  {
    id: "new1",
    name: "Luffy Gear 5 - OP05",
    image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=600&fit=crop",
    price: 129.99,
    category: "One Piece",
    rarity: "Secret Rare",
    condition: "Near Mint",
    stock: 3,
    rating: 5.0,
    isNew: true,
    isFeatured: true
  },
  {
    id: "new2",
    name: "Arceus VSTAR - Brilliant Stars",
    image: "https://images.unsplash.com/photo-1609813040801-8b09a342bd73?w=400&h=600&fit=crop",
    price: 69.99,
    comparePrice: 89.99,
    category: "Pokemon",
    rarity: "Ultra Rare",
    condition: "Near Mint",
    stock: 7,
    rating: 4.7,
    isNew: true,
    isFeatured: false
  },
  {
    id: "new3",
    name: "Exodia the Forbidden One - 25th Anniversary",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=600&fit=crop",
    price: 199.99,
    category: "Yu-Gi-Oh!",
    rarity: "Ultra Rare",
    condition: "Mint",
    stock: 2,
    rating: 5.0,
    isNew: true,
    isFeatured: false
  },
  {
    id: "new4",
    name: "Sheoldred, the Apocalypse - Dominaria",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc4e?w=400&h=600&fit=crop",
    price: 89.99,
    category: "Magic: The Gathering",
    rarity: "Mythic Rare",
    condition: "Near Mint",
    stock: 4,
    rating: 4.8,
    isNew: true,
    isFeatured: false
  },
  {
    id: "new5",
    name: "Zoro - OP06 Wings of the Captain",
    image: "https://images.unsplash.com/photo-1626121602187-1313288432fe?w=400&h=600&fit=crop",
    price: 54.99,
    category: "One Piece",
    rarity: "Super Rare",
    condition: "Near Mint",
    stock: 8,
    rating: 4.6,
    isNew: true,
    isFeatured: false
  },
  {
    id: "new6",
    name: "Miraidon ex - Violet",
    image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=600&fit=crop",
    price: 44.99,
    category: "Pokemon",
    rarity: "Ultra Rare",
    condition: "Near Mint",
    stock: 10,
    rating: 4.5,
    isNew: true,
    isFeatured: false
  },
  {
    id: "new7",
    name: "Kashtira Fenrir - PHHY",
    image: "https://images.unsplash.com/photo-1609813040801-8b09a342bd73?w=400&h=600&fit=crop",
    price: 79.99,
    category: "Yu-Gi-Oh!",
    rarity: "Secret Rare",
    condition: "Near Mint",
    stock: 3,
    rating: 4.9,
    isNew: true,
    isFeatured: false
  },
  {
    id: "new8",
    name: "The One Ring - Tales of Middle Earth",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=600&fit=crop",
    price: 2499.99,
    category: "Magic: The Gathering",
    rarity: "Mythic Rare",
    condition: "Near Mint",
    stock: 1,
    rating: 5.0,
    isNew: true,
    isFeatured: true
  }
]

export function NewArrivals() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    window.addEventListener("resize", checkScrollButtons)
    return () => window.removeEventListener("resize", checkScrollButtons)
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320 // Width of one card + gap
      const currentScroll = scrollContainerRef.current.scrollLeft
      const targetScroll = direction === "left" 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth"
      })
      
      setTimeout(checkScrollButtons, 300)
    }
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        {/* セクションヘッダー */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">New Arrivals</h2>
              <p className="text-muted-foreground">Fresh cards just added to our collection</p>
            </div>
          </div>
          <Link
            href="/products?filter=new"
            className="hidden md:flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            View All New
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* カルーセルコンテナ */}
        <div className="relative">
          {/* スクロールボタン - 左 */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10",
              "h-12 w-12 rounded-full bg-white shadow-lg",
              "flex items-center justify-center",
              "transition-all duration-200",
              canScrollLeft 
                ? "opacity-100 hover:scale-110 cursor-pointer" 
                : "opacity-0 cursor-default pointer-events-none"
            )}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* スクロールボタン - 右 */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10",
              "h-12 w-12 rounded-full bg-white shadow-lg",
              "flex items-center justify-center",
              "transition-all duration-200",
              canScrollRight 
                ? "opacity-100 hover:scale-110 cursor-pointer" 
                : "opacity-0 cursor-default pointer-events-none"
            )}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* 商品カルーセル */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {newArrivals.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[280px]">
                <ProductCard {...product} />
              </div>
            ))}
          </div>
        </div>

        {/* モバイル用のView Allリンク */}
        <div className="text-center mt-8 md:hidden">
          <Link
            href="/products?filter=new"
            className="inline-flex items-center gap-2 text-primary font-semibold"
          >
            View All New Arrivals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* インジケーター */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(newArrivals.length / 4) }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                index === 0 ? "bg-primary w-6" : "bg-gray-300"
              )}
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({
                    left: index * 1280,
                    behavior: "smooth"
                  })
                }
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}