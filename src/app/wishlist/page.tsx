"use client"

import Link from "next/link"
import { Heart, ShoppingCart, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/products/product-card"
import { useWishlistStore } from "@/store/wishlist-store"
import { useCartStore } from "@/store/cart-store"

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore()
  const addToCart = useCartStore((state) => state.addItem)

  const handleMoveAllToCart = () => {
    items.forEach(item => {
      addToCart({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        category: item.category,
        rarity: item.rarity,
        condition: item.condition,
        stock: item.stock
      })
    })
    clearWishlist()
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg border p-12">
              <Heart className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h1>
              <p className="text-muted-foreground mb-8">
                Save your favorite cards to your wishlist for easy access later.
              </p>
              <Link href="/products">
                <Button size="lg">
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* ページヘッダー */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Wishlist</h1>
              <p className="text-muted-foreground mt-2">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearWishlist}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
              <Button
                onClick={handleMoveAllToCart}
                disabled={items.length === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 戻るボタン */}
        <Link href="/products">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>

        {/* ウィッシュリストアイテム */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image}
              price={item.price}
              category={item.category || ""}
              rarity={item.rarity}
              condition={item.condition}
              stock={item.stock}
            />
          ))}
        </div>

        {/* 情報セクション */}
        <div className="mt-12 bg-white rounded-lg border p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl font-semibold mb-4">About Your Wishlist</h2>
            <p className="text-muted-foreground mb-6">
              Your wishlist items are saved locally in your browser. Sign in to sync your wishlist across devices and never lose your favorite cards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-red-500" />
                <span>Items are saved automatically</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span>Move to cart when ready to purchase</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}