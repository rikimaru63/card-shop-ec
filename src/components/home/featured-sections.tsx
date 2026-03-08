"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingCart, Heart, Loader2, TrendingUp, TrendingDown, Sparkles, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/store/cart-store"
import { useWishlistStore } from "@/store/wishlist-store"
import { cn } from "@/lib/utils"

type ProductType = 'SINGLE' | 'BOX' | 'OTHER'

interface Product {
  id: string
  name: string
  cardSet: string | null
  cardNumber: string | null
  rarity: string | null
  condition: string | null
  price: number
  previousPrice: number | null
  image: string
  stock: number
  lowStock: boolean
  featured: boolean
  isNewArrival: boolean
  isRecommended: boolean
  productType?: ProductType
}

interface ProductSectionProps {
  title: string
  icon: React.ReactNode
  products: Product[]
  loading: boolean
  bgClass?: string
}

function ProductSection({ title, icon, products, loading, bgClass = "" }: ProductSectionProps) {
  const [addedToCart, setAddedToCart] = useState<string | null>(null)
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const qty = selectedQty[product.id] || 1
    addToCart({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      category: product.cardSet || 'Pokemon Cards',
      productType: product.productType,
      rarity: product.rarity || undefined,
      condition: product.condition || undefined,
      stock: product.stock
    }, qty)
    setAddedToCart(product.id)
    setTimeout(() => setAddedToCart(null), 2000)
  }

  const handleToggleWishlist = (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        category: product.cardSet || 'Pokemon Cards',
        productType: product.productType,
        rarity: product.rarity || undefined,
        condition: product.condition || undefined,
        stock: product.stock
      })
    }
  }

  const formatRarity = (rarity: string | null): string => {
    if (!rarity) return ''
    const map: { [key: string]: string } = {
      'SECRET_RARE': 'SAR',
      'ULTRA_RARE': 'UR',
      'SUPER_RARE': 'SR',
      'RARE': 'R',
      'UNCOMMON': 'U',
      'COMMON': 'C',
      'PROMO': 'PROMO'
    }
    return map[rarity] || rarity
  }

  // Price change indicator
  const getPriceChange = (product: Product) => {
    if (!product.previousPrice || product.previousPrice === product.price) return null
    const isUp = product.price > product.previousPrice
    return {
      isUp,
      icon: isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />,
      label: isUp ? 'Up' : 'Down',
      color: isUp ? 'text-red-500 bg-red-50' : 'text-green-500 bg-green-50'
    }
  }

  if (loading) {
    return (
      <div className={`py-8 ${bgClass}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            {icon}
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className={`py-8 ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <Link href="/products" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.slice(0, 5).map((product) => {
            const priceChange = getPriceChange(product)
            return (
              <div
                key={product.id}
                className="group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <div className="relative aspect-[3/4] bg-gray-100">
                  <Link href={`/products/${product.id}`} className="absolute inset-0 z-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-gray-400 text-center p-2">
                        <p className="text-xs font-medium line-clamp-2">{product.name}</p>
                      </div>
                    </div>
                  </Link>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-10">
                    {priceChange && (
                      <Badge className={`text-xs ${priceChange.color}`}>
                        {priceChange.icon}
                        <span className="ml-1">{priceChange.label}</span>
                      </Badge>
                    )}
                    {product.rarity && ['SECRET_RARE', 'ULTRA_RARE'].includes(product.rarity) && (
                      <Badge className={cn(
                        "text-xs",
                        product.rarity === 'SECRET_RARE' ? "bg-yellow-500" : "bg-purple-500"
                      )}>
                        {formatRarity(product.rarity)}
                      </Badge>
                    )}
                  </div>

                  {/* Wishlist */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={(e) => handleToggleWishlist(product, e)}
                    >
                      <Heart className={cn(
                        "h-3 w-3 transition-colors",
                        isInWishlist(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                      )} />
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-2">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-medium text-xs line-clamp-2 mb-1 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="text-sm font-bold text-blue-600">
                        ¥{product.price.toLocaleString()}
                      </span>
                      {product.previousPrice && product.previousPrice !== product.price && (
                        <span className="text-xs text-muted-foreground line-through ml-1">
                          ¥{product.previousPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {product.stock > 1 && (
                        <select
                          value={selectedQty[product.id] || 1}
                          onChange={(e) => {
                            e.stopPropagation()
                            setSelectedQty((prev) => ({ ...prev, [product.id]: Number(e.target.value) }))
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-10 text-xs border rounded px-0.5"
                        >
                          {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      )}
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={addedToCart === product.id || product.stock === 0}
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function FeaturedSections() {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedProducts() {
      setLoading(true)
      try {
        // Fetch recommended and new arrivals in parallel
        const [recResponse, newResponse] = await Promise.all([
          fetch('/api/products?isRecommended=true&limit=5'),
          fetch('/api/products?isNewArrival=true&limit=5')
        ])

        if (recResponse.ok) {
          const recData = await recResponse.json()
          setRecommendedProducts(recData.products)
        }
        if (newResponse.ok) {
          const newData = await newResponse.json()
          setNewArrivals(newData.products)
        }
      } catch (error) {
        console.error('Error fetching featured products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  return (
    <>
      {/* Recommended Picks */}
      <ProductSection
        title="Recommended Picks"
        icon={<Sparkles className="h-5 w-5 text-yellow-500" />}
        products={recommendedProducts}
        loading={loading}
        bgClass="bg-gradient-to-r from-yellow-50 to-orange-50"
      />

      {/* New Arrivals */}
      <ProductSection
        title="New Arrivals"
        icon={<Clock className="h-5 w-5 text-blue-500" />}
        products={newArrivals}
        loading={loading}
        bgClass="bg-gradient-to-r from-blue-50 to-indigo-50"
      />
    </>
  )
}
