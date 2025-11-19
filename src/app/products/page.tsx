"use client"

import { useState, useMemo } from "react"
import { ProductCard } from "@/components/products/product-card"
import { ProductFilters } from "@/components/products/product-filters"
import { ProductSort } from "@/components/products/product-sort"
import { 
  ChevronLeft, 
  ChevronRight,
  LayoutGrid,
  List,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Mock data - 実際はAPIから取得
const mockProducts = [
  {
    id: "1",
    name: "Charizard VMAX - Darkness Ablaze",
    image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=600&fit=crop",
    price: 189.99,
    comparePrice: 219.99,
    category: "Pokemon",
    rarity: "Ultra Rare",
    condition: "Near Mint",
    stock: 5,
    rating: 4.8,
    isNew: false,
    isFeatured: true
  },
  {
    id: "2",
    name: "Pikachu VMAX - Vivid Voltage",
    image: "https://images.unsplash.com/photo-1609813040801-8b09a342bd73?w=400&h=600&fit=crop",
    price: 79.99,
    comparePrice: 99.99,
    category: "Pokemon",
    rarity: "Secret Rare",
    condition: "Near Mint",
    stock: 8,
    rating: 4.9,
    isNew: true,
    isFeatured: false
  },
  {
    id: "3",
    name: "Blue-Eyes White Dragon - LOB-001",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=600&fit=crop",
    price: 499.99,
    comparePrice: 599.99,
    category: "Yu-Gi-Oh!",
    rarity: "Secret Rare",
    condition: "Mint",
    stock: 1,
    rating: 5.0,
    isNew: false,
    isFeatured: true
  },
  {
    id: "4",
    name: "Dark Magician - SDY-006",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc4e?w=400&h=600&fit=crop",
    price: 34.99,
    category: "Yu-Gi-Oh!",
    rarity: "Ultra Rare",
    condition: "Near Mint",
    stock: 15,
    rating: 4.5,
    isNew: false,
    isFeatured: false
  },
  {
    id: "5",
    name: "Black Lotus - Alpha Edition",
    image: "https://images.unsplash.com/photo-1626121602187-1313288432fe?w=400&h=600&fit=crop",
    price: 49999.99,
    category: "Magic: The Gathering",
    rarity: "Mythic Rare",
    condition: "Lightly Played",
    stock: 1,
    rating: 5.0,
    isNew: false,
    isFeatured: true
  },
  {
    id: "6",
    name: "Sol Ring - Commander",
    image: "https://images.unsplash.com/photo-1609813040801-8b09a342bd73?w=400&h=600&fit=crop",
    price: 2.99,
    category: "Magic: The Gathering",
    rarity: "Common",
    condition: "Near Mint",
    stock: 50,
    rating: 4.3,
    isNew: false,
    isFeatured: false
  },
  {
    id: "7",
    name: "Monkey D. Luffy - OP01-003",
    image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=600&fit=crop",
    price: 89.99,
    comparePrice: 109.99,
    category: "One Piece",
    rarity: "Leader",
    condition: "Near Mint",
    stock: 10,
    rating: 4.7,
    isNew: true,
    isFeatured: false
  },
  {
    id: "8",
    name: "Roronoa Zoro - OP01-025",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=600&fit=crop",
    price: 45.99,
    category: "One Piece",
    rarity: "Super Rare",
    condition: "Near Mint",
    stock: 7,
    rating: 4.6,
    isNew: true,
    isFeatured: false
  },
  {
    id: "9",
    name: "Michael Jordan - 1986 Fleer Rookie",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc4e?w=400&h=600&fit=crop",
    price: 24999.99,
    category: "Sports Cards",
    rarity: "Rookie",
    condition: "PSA 9",
    stock: 1,
    rating: 5.0,
    isNew: false,
    isFeatured: true
  },
  {
    id: "10",
    name: "LeBron James - 2003 Topps Rookie",
    image: "https://images.unsplash.com/photo-1626121602187-1313288432fe?w=400&h=600&fit=crop",
    price: 1899.99,
    category: "Sports Cards",
    rarity: "Rookie",
    condition: "PSA 10",
    stock: 2,
    rating: 4.9,
    isNew: false,
    isFeatured: false
  }
]

export default function ProductsPage() {
  const [products] = useState(mockProducts)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  // フィルター状態
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 100000],
    rarities: [] as string[],
    conditions: [] as string[],
    inStock: false
  })

  const itemsPerPage = 12

  // フィルタリングとソート
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    // カテゴリーフィルター
    if (filters.categories.length > 0) {
      filtered = filtered.filter(p => filters.categories.includes(p.category))
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
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case "featured":
      default:
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
    }

    return filtered
  }, [products, filters, sortBy])

  // ページネーション
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage)
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* ページヘッダー */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <a href="/" className="hover:text-primary">Home</a>
            <span>/</span>
            <span>All Products</span>
          </div>
          <h1 className="text-3xl font-bold">All Trading Cards</h1>
          <p className="text-muted-foreground mt-2">
            {filteredAndSortedProducts.length} products available
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* サイドバーフィルター（デスクトップ） */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilters 
              filters={filters}
              onFiltersChange={setFilters}
            />
          </aside>

          {/* メインコンテンツ */}
          <div className="flex-1">
            {/* ソートとビューオプション */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2">
                  {/* モバイルフィルターボタン */}
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

            {/* モバイルフィルター */}
            {showMobileFilters && (
              <div className="lg:hidden mb-6">
                <ProductFilters 
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
            )}

            {/* 商品グリッド/リスト */}
            {paginatedProducts.length > 0 ? (
              <div className={cn(
                viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              )}>
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border">
                <p className="text-muted-foreground">No products found matching your filters.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setFilters({
                    categories: [],
                    priceRange: [0, 100000],
                    rarities: [],
                    conditions: [],
                    inStock: false
                  })}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* ページネーション */}
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