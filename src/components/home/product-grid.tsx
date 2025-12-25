"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ShoppingCart, Heart, Loader2, TrendingUp, TrendingDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/store/cart-store"
import { useWishlistStore } from "@/store/wishlist-store"
import { cn } from "@/lib/utils"

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
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export function ProductGrid() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("newest")
  const [addedToCart, setAddedToCart] = useState<string | null>(null)

  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  // Get filter params from URL
  const getFilterParams = () => {
    const params: Record<string, string> = {}

    // Card set filter (can be comma-separated)
    const cardSet = searchParams.get("cardSet")
    if (cardSet) params.cardSet = cardSet

    // Rarity filter (can be comma-separated)
    const rarity = searchParams.get("rarity")
    if (rarity) params.rarity = rarity

    // Condition filter (can be comma-separated)
    const condition = searchParams.get("condition")
    if (condition) params.condition = condition

    // Product type filter
    const productType = searchParams.get("productType")
    if (productType) params.productType = productType

    // Price range
    const minPrice = searchParams.get("minPrice")
    if (minPrice) params.minPrice = minPrice

    const maxPrice = searchParams.get("maxPrice")
    if (maxPrice) params.maxPrice = maxPrice

    // In stock only
    const inStock = searchParams.get("inStock")
    if (inStock === "true") params.inStock = "true"

    // Game filter (for category filtering)
    const game = searchParams.get("game")
    if (game) params.game = game

    return params
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchParams])

  // Fetch products from API
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      setError(null)

      try {
        const filterParams = getFilterParams()
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '12',
          sortBy: sortBy,
          ...filterParams
        })

        const response = await fetch(`/api/products?${params}`)

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json()
        setProducts(data.products)
        setPagination(data.pagination)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [currentPage, sortBy, searchParams])

  // Check if filters are active
  const hasActiveFilters = searchParams.toString().length > 0

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const cartItem = {
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      category: product.cardSet || 'Pokemon Cards',
      rarity: product.rarity || undefined,
      condition: product.condition || undefined,
      stock: product.stock
    }

    addToCart(cartItem)
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
        rarity: product.rarity || undefined,
        condition: product.condition || undefined,
        stock: product.stock
      })
    }
  }

  // Format rarity for display
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

  // Format condition for display
  const formatCondition = (condition: string | null): string => {
    if (!condition) return ''
    const map: { [key: string]: string } = {
      'MINT': 'Mint',
      'NEAR_MINT': 'Near Mint',
      'LIGHTLY_PLAYED': 'Lightly Played',
      'MODERATELY_PLAYED': 'Moderately Played',
      'HEAVILY_PLAYED': 'Heavily Played',
      'DAMAGED': 'Damaged'
    }
    return map[condition] || condition
  }

  // Price change indicator
  const getPriceChange = (product: Product) => {
    if (!product.previousPrice || product.previousPrice === product.price) return null
    const isUp = product.price > product.previousPrice
    return {
      isUp,
      icon: isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />,
      label: isUp ? 'Up' : 'Down',
      color: isUp ? 'text-red-500 bg-red-50 border-red-200' : 'text-green-500 bg-green-50 border-green-200'
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">All Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${pagination?.total || 0} products`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Product Grid */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const priceChange = getPriceChange(product)
              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] bg-gray-100">
                    <Link href={`/products/${product.id}`} className="absolute inset-0 z-0">
                      {product.image && product.image.startsWith('http') ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center ${product.image && product.image.startsWith('http') ? 'hidden' : ''}`}>
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">🖼️</span>
                          </div>
                          <p className="text-sm text-gray-400">No Image</p>
                        </div>
                      </div>
                    </Link>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-10">
                      {priceChange && (
                        <Badge className={`text-xs border ${priceChange.color}`}>
                          {priceChange.icon}
                          <span className="ml-1">{priceChange.label}</span>
                        </Badge>
                      )}
                      {product.featured && (
                        <Badge className="text-xs bg-blue-500">
                          Featured
                        </Badge>
                      )}
                      {product.lowStock && product.stock > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Only {product.stock} left
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

                    {/* Wishlist Button */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
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

                  {/* Product Info */}
                  <div className="p-3">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-medium text-sm line-clamp-2 mb-1 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-2">
                      {product.cardSet} {product.cardNumber}
                    </p>

                    <div className="flex items-center gap-1 mb-2">
                      {product.rarity && (
                        <Badge variant="outline" className="text-xs">
                          {formatRarity(product.rarity)}
                        </Badge>
                      )}
                      {product.condition && (
                        <Badge variant="secondary" className="text-xs">
                          {formatCondition(product.condition)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-blue-600">
                          ¥{product.price.toLocaleString()}
                        </span>
                        {product.previousPrice && product.previousPrice !== product.price && (
                          <span className="text-xs text-muted-foreground line-through ml-1">
                            ¥{product.previousPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
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
              )
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>

                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
