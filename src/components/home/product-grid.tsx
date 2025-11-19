"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/store/cart-store"
import { useWishlistStore } from "@/store/wishlist-store"
import { cn } from "@/lib/utils"

const mockProducts = [
  {
    id: "1",
    name: "Pikachu ex",
    cardSet: "Scarlet ex",
    cardNumber: "025/165",
    rarity: "RR",
    condition: "Near Mint",
    price: 1500,
    image: "/placeholder-card.jpg",
    stock: 10
  },
  {
    id: "2",
    name: "Charizard ex SAR",
    cardSet: "Violet ex",
    cardNumber: "006/078",
    rarity: "SAR",
    condition: "Mint",
    price: 15000,
    image: "/placeholder-card.jpg",
    stock: 1
  },
  {
    id: "3",
    name: "Mewtwo V SR",
    cardSet: "Pokemon 151",
    cardNumber: "150/165",
    rarity: "SR",
    condition: "Near Mint",
    price: 3000,
    image: "/placeholder-card.jpg",
    stock: 5
  },
  {
    id: "4",
    name: "Erika's Invitation SAR",
    cardSet: "Pokemon 151",
    cardNumber: "196/165",
    rarity: "SAR",
    condition: "Mint",
    price: 8500,
    image: "/placeholder-card.jpg",
    stock: 3
  },
  {
    id: "5",
    name: "Iono SAR",
    cardSet: "Clay Burst",
    cardNumber: "091/071",
    rarity: "SAR",
    condition: "Near Mint",
    price: 12000,
    image: "/placeholder-card.jpg",
    stock: 2
  },
  {
    id: "6",
    name: "Lugia V SR",
    cardSet: "Paradigm Trigger",
    cardNumber: "110/098",
    rarity: "SR",
    condition: "Near Mint",
    price: 2800,
    image: "/placeholder-card.jpg",
    stock: 8
  },
  {
    id: "7",
    name: "Giratina VSTAR UR",
    cardSet: "Lost Abyss",
    cardNumber: "125/100",
    rarity: "UR",
    condition: "Mint",
    price: 5500,
    image: "/placeholder-card.jpg",
    stock: 4
  },
  {
    id: "8",
    name: "Radiant Greninja",
    cardSet: "Astral Radiance",
    cardNumber: "013/100",
    rarity: "Radiant",
    condition: "Near Mint",
    price: 800,
    image: "/placeholder-card.jpg",
    stock: 15
  },
  {
    id: "9",
    name: "Mew ex SAR",
    cardSet: "Pokemon 151",
    cardNumber: "205/165",
    rarity: "SAR",
    condition: "Mint",
    price: 18000,
    image: "/placeholder-card.jpg",
    stock: 1
  },
  {
    id: "10",
    name: "Penny SAR",
    cardSet: "Violet ex",
    cardNumber: "101/078",
    rarity: "SAR",
    condition: "Near Mint",
    price: 4500,
    image: "/placeholder-card.jpg",
    stock: 6
  },
  {
    id: "11",
    name: "Adaman SAR",
    cardSet: "Space Juggler",
    cardNumber: "073/067",
    rarity: "SAR",
    condition: "Mint",
    price: 9800,
    image: "/placeholder-card.jpg",
    stock: 2
  },
  {
    id: "12",
    name: "Serena SR",
    cardSet: "Incandescent Arcana",
    cardNumber: "081/068",
    rarity: "SR",
    condition: "Near Mint",
    price: 6200,
    image: "/placeholder-card.jpg",
    stock: 4
  }
]

export function ProductGrid() {
  const [sortBy, setSortBy] = useState("newest")
  const [addedToCart, setAddedToCart] = useState<string | null>(null)
  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  const handleAddToCart = (product: typeof mockProducts[0], e: React.MouseEvent) => {
    e.preventDefault()
    addToCart({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      category: product.cardSet,
      rarity: product.rarity,
      condition: product.condition,
      stock: product.stock
    })
    setAddedToCart(product.id)
    setTimeout(() => setAddedToCart(null), 2000)
  }

  const handleToggleWishlist = (product: typeof mockProducts[0], e: React.MouseEvent) => {
    e.preventDefault()
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        category: product.cardSet,
        rarity: product.rarity,
        condition: product.condition,
        stock: product.stock
      })
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pokemon Cards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mockProducts.length} products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* 商品グリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mockProducts.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group"
          >
            <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
              {/* 商品画像 */}
              <div className="relative aspect-[3/4] bg-gray-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs mt-1">{product.cardSet}</p>
                  </div>
                </div>
                
                {/* バッジ */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.stock <= 3 && product.stock > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      Only {product.stock} left
                    </Badge>
                  )}
                  {product.rarity === "SAR" && (
                    <Badge className="text-xs bg-yellow-500">
                      SAR
                    </Badge>
                  )}
                  {product.rarity === "UR" && (
                    <Badge className="text-xs bg-purple-500">
                      UR
                    </Badge>
                  )}
                </div>

                {/* ホバーアクション */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={(e) => handleToggleWishlist(product, e)}
                  >
                    <Heart className={cn(
                      "h-4 w-4 transition-colors",
                      isInWishlist(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                    )} />
                  </Button>
                </div>
              </div>

              {/* 商品情報 */}
              <div className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {product.cardSet} {product.cardNumber}
                </p>
                
                <div className="flex items-center gap-1 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {product.rarity}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {product.condition}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">
                    ¥{product.price.toLocaleString()}
                  </span>
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={addedToCart === product.id || product.stock === 0}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {addedToCart === product.id ? "Added!" : product.stock === 0 ? "Out" : "Add"}
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ページネーション */}
      <div className="mt-8 flex justify-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-blue-600 text-white">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
