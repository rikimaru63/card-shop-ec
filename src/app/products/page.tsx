"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/products/product-card"
import { ProductFilters } from "@/components/products/product-filters"
import { ProductSort } from "@/components/products/product-sort"
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Filter,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  nameJa?: string
  slug: string
  price: number
  comparePrice?: number
  stock: number
  condition?: string
  rarity?: string
  category?: {
    id: string
    name: string
    slug: string
  }
  image?: string
  featured?: boolean
  isNewArrival?: boolean
  isRecommended?: boolean
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

// 価格スライダー上限(ProductFilters の MAX_PRICE_LIMIT と揃える)。
// これ以上のときは maxPrice を送らない＝上限なし扱い。
const PRICE_MAX = 10000000
const ITEMS_PER_PAGE = 24

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Filter state
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, PRICE_MAX],
    rarities: [] as string[],
    conditions: [] as string[],
    productTypes: [] as string[],
    inStock: false
  })

  // フィルタ/ソート/ページが変わるたび、API にサーバー側フィルタ+ページングを依頼する。
  // (従来は全件取得→クライアント絞り込みで既定12件しか読めず、One Piece/Other が0件になっていた)
  useEffect(() => {
    const controller = new AbortController()

    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
          sortBy
        })
        if (filters.categories.length > 0) params.set('category', filters.categories.join(','))
        if (filters.rarities.length > 0) params.set('rarity', filters.rarities.join(','))
        if (filters.conditions.length > 0) params.set('condition', filters.conditions.join(','))
        if (filters.productTypes.length > 0) params.set('productType', filters.productTypes.join(','))
        if (filters.priceRange[0] > 0) params.set('minPrice', String(filters.priceRange[0]))
        if (filters.priceRange[1] < PRICE_MAX) params.set('maxPrice', String(filters.priceRange[1]))
        if (filters.inStock) params.set('inStock', 'true')

        const response = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
          setPagination(data.pagination || null)
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Failed to fetch products:', error)
        }
      } finally {
        // 中断された(より新しいリクエストに置き換わった)場合は loading を触らない。
        // 進行中の最新リクエスト側がローディング表示を維持し、ちらつきを防ぐ。
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchProducts()
    return () => controller.abort()
  }, [filters, sortBy, currentPage])

  // フィルタ変更時は1ページ目へ戻してから再取得する
  const handleFiltersChange = (next: typeof filters) => {
    setFilters(next)
    setCurrentPage(1)
  }
  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  const totalCount = pagination?.total ?? 0
  const totalPages = pagination?.totalPages ?? 1

  // 商品データをProductCard用に変換
  const transformProduct = (product: Product) => ({
    id: product.id,
    name: product.nameJa || product.name,
    image: product.image || "/placeholder-card.svg",
    price: product.price,
    comparePrice: product.comparePrice,
    category: product.category?.name || "Other",
    rarity: product.rarity,
    condition: product.condition,
    stock: product.stock,
    isNew: product.isNewArrival,
    // featured(トップ固定) も「おすすめ」バッジ表示の対象に含める
    isFeatured: product.featured || product.isRecommended
  })

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, PRICE_MAX],
      rarities: [],
      conditions: [],
      productTypes: [],
      inStock: false
    })
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <a href="/" className="hover:text-primary">Home</a>
            <span>/</span>
            <span>Products</span>
          </div>
          <h1 className="text-3xl font-bold">All Products</h1>
          <p className="text-muted-foreground mt-2">
            {loading ? 'Loading...' : `${totalCount.toLocaleString()} products found`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and View Options */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2">
                  {/* Mobile Filter Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>

                  <ProductSort
                    value={sortBy}
                    onChange={handleSortChange}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">View:</span>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Filters */}
            {showMobileFilters && (
              <div className="lg:hidden mb-6">
                <ProductFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            )}

            {/* Product Area: Loading / Grid / Empty */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : products.length > 0 ? (
              <div className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              )}>
                {products.map((product) => (
                  <ProductCard key={product.id} {...transformProduct(product)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border">
                <p className="text-muted-foreground">No products match your criteria</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        )
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-2">...</span>
                      }
                      return null
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
