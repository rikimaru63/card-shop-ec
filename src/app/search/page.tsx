"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, Filter, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/products/product-card"
import { ProductFilters } from "@/components/products/product-filters"
import { ProductSort } from "@/components/products/product-sort"

// Mock search function - 実際はAPIを使用
const searchProducts = (query: string) => {
  const allProducts = [
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
    }
  ]

  if (!query) return allProducts
  
  const lowerQuery = query.toLowerCase()
  return allProducts.filter(product => 
    product.name.toLowerCase().includes(lowerQuery) ||
    product.category.toLowerCase().includes(lowerQuery) ||
    (product.rarity && product.rarity.toLowerCase().includes(lowerQuery))
  )
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  comparePrice?: number;
  category: string;
  rarity?: string;
  condition?: string;
  stock: number;
  rating?: number;
  isNew: boolean;
  isFeatured: boolean;
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")
  
  // フィルター状態
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 100000],
    rarities: [] as string[],
    conditions: [] as string[],
    inStock: false
  })

  // 検索実行
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        setIsSearching(true)
        const results = searchProducts(searchQuery)
        setSearchResults(results)
        setIsSearching(false)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  // フィルタリング
  const filteredResults = searchResults.filter(product => {
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false
    }
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false
    }
    if (filters.rarities.length > 0 && (!product.rarity || !filters.rarities.includes(product.rarity))) {
      return false
    }
    if (filters.conditions.length > 0 && (!product.condition || !filters.conditions.includes(product.condition))) {
      return false
    }
    if (filters.inStock && product.stock === 0) {
      return false
    }
    return true
  })

  // ソート
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price
      case "price-desc":
        return b.price - a.price
      case "name":
        return a.name.localeCompare(b.name)
      case "rating":
        return (b.rating || 0) - (a.rating || 0)
      case "relevance":
      default:
        return 0
    }
  })

  // 検索候補
  const searchSuggestions = [
    "Charizard",
    "Pikachu",
    "Blue-Eyes White Dragon",
    "Black Lotus",
    "Pokemon Booster Box",
    "PSA 10",
    "First Edition",
    "Japanese Cards"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* 検索ヘッダー */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 検索バー */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for cards, sets, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base w-full"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <ProductSort value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* 検索候補 */}
          {!searchQuery && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Popular searches:</span>
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchQuery(suggestion)}
                  className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* 検索結果数 */}
          {searchQuery && !isSearching && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-semibold text-foreground">{sortedResults.length}</span> results 
                for "<span className="font-semibold text-foreground">{searchQuery}</span>"
              </p>
              <Link href="/products">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Browse All
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 検索前の状態 */}
        {!searchQuery && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Search Trading Cards</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Enter a search term above to find cards, or browse our categories below
            </p>
            
            {/* カテゴリーリンク */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {["Pokemon", "Yu-Gi-Oh!", "Magic: The Gathering", "One Piece"].map((category) => (
                <Link
                  key={category}
                  href={`/products?category=${category}`}
                  className="p-4 bg-white rounded-lg border hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold">{category}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 検索中 */}
        {isSearching && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Searching...</p>
          </div>
        )}

        {/* 検索結果 */}
        {searchQuery && !isSearching && (
          <div className="flex gap-8">
            {/* サイドバーフィルター（デスクトップ） */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <ProductFilters 
                filters={filters}
                onFiltersChange={setFilters}
              />
            </aside>

            {/* モバイルフィルター */}
            {showFilters && (
              <div className="lg:hidden fixed inset-0 z-50 bg-background">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowFilters(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
                  <ProductFilters 
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                </div>
              </div>
            )}

            {/* 検索結果グリッド */}
            <div className="flex-1">
              {sortedResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedResults.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <p className="text-muted-foreground mb-4">
                    No products found matching your search.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setFilters({
                        categories: [],
                        priceRange: [0, 100000],
                        rarities: [],
                        conditions: [],
                        inStock: false
                      })
                    }}
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}