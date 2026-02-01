"use client"

import { useState, useEffect, useMemo } from "react"
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
  }
  image?: string
  isNewArrival?: boolean
  isRecommended?: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Filter state
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 10000000],
    rarities: [] as string[],
    conditions: [] as string[],
    productTypes: [] as string[],
    inStock: false
  })

  // 商品データを取得
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const itemsPerPage = 12

  // フィルタリングとソート
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    // カテゴリーフィルター
    if (filters.categories.length > 0) {
      filtered = filtered.filter(p => p.category && filters.categories.includes(p.category.name))
    }

    // 価格フィルター
    filtered = filtered.filter(
      p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    )

    // レアリティフィルター
    if (filters.rarities.length > 0) {
      filtered = filtered.filter(p => p.rarity && filters.rarities.includes(p.rarity))
    }

    // コンディションフィルター
    if (filters.conditions.length > 0) {
      filtered = filtered.filter(p => p.condition && filters.conditions.includes(p.condition))
    }

    // 在庫フィルター
    if (filters.inStock) {
      filtered = filtered.filter(p => p.stock > 0)
    }

    // ソート
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "newest":
        filtered.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0))
        break
      case "featured":
      default:
        filtered.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0))
    }

    return filtered
  }, [products, filters, sortBy])

  // ページネーション
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage)
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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
    isFeatured: product.isRecommended
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
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
            {filteredAndSortedProducts.length} products found
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilters
              filters={filters}
              onFiltersChange={setFilters}
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
                    onChange={setSortBy}
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
                  onFiltersChange={setFilters}
                />
              </div>
            )}

            {/* Product Grid/List */}
            {paginatedProducts.length > 0 ? (
              <div className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              )}>
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} {...transformProduct(product)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border">
                <p className="text-muted-foreground">No products match your criteria</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setFilters({
                    categories: [],
                    priceRange: [0, 10000000],
                    rarities: [],
                    conditions: [],
                    productTypes: [],
                    inStock: false
                  })}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
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
