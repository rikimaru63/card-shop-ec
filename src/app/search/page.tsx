"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, Filter, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/products/product-card"
import { ProductFilters } from "@/components/products/product-filters"
import { ProductSort } from "@/components/products/product-sort"

interface Product {
  id: string;
  name: string;
  nameJa?: string;
  image: string;
  price: number;
  comparePrice?: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  rarity?: string;
  condition?: string;
  cardSet?: string;
  cardNumber?: string;
  stock: number;
  isNewArrival: boolean;
  isRecommended: boolean;
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")
  
  // Filter state
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 10000000],
    rarities: [] as string[],
    conditions: [] as string[],
    productTypes: [] as string[],
    inStock: false
  })

  // API検索関数
  const fetchProducts = useCallback(async (query: string, sort: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        search: query,
        limit: '100',
        sortBy: sort === 'relevance' ? 'newest' : sort
      })

      // Apply filters
      if (filters.inStock) {
        params.append('inStock', 'true')
      }
      if (filters.priceRange[0] > 0) {
        params.append('minPrice', filters.priceRange[0].toString())
      }
      if (filters.priceRange[1] < 10000000) {
        params.append('maxPrice', filters.priceRange[1].toString())
      }

      const response = await fetch(`/api/products?${params.toString()}`)
      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setSearchResults(data.products || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [filters])

  // 検索実行（デバウンス付き）
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(searchQuery, sortBy)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, sortBy, fetchProducts])

  // クライアント側フィルタリング（カテゴリ、レアリティ、状態）
  const filteredResults = searchResults.filter(product => {
    if (filters.categories.length > 0 && !filters.categories.includes(product.category?.slug || '')) {
      return false
    }
    if (filters.rarities.length > 0 && (!product.rarity || !filters.rarities.includes(product.rarity))) {
      return false
    }
    if (filters.conditions.length > 0 && (!product.condition || !filters.conditions.includes(product.condition))) {
      return false
    }
    return true
  })

  // クライアント側ソート
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price
      case "price-desc":
        return b.price - a.price
      case "name-asc":
        return a.name.localeCompare(b.name)
      case "relevance":
      default:
        return 0
    }
  })

  // 検索候補
  const searchSuggestions = [
    "Pikachu",
    "Charizard",
    "Luffy",
    "Nami",
    "SAR",
    "PSA",
    "BOX"
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto">
              {[
                { name: "Pokemon Cards", slug: "pokemon-cards" },
                { name: "One Piece Cards", slug: "onepiece-cards" },
                { name: "Other", slug: "other-cards" }
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="p-4 bg-white rounded-lg border hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold">{cat.name}</h3>
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
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      image={product.image}
                      price={product.price}
                      comparePrice={product.comparePrice}
                      category={product.category?.name || ''}
                      rarity={product.rarity}
                      condition={product.condition}
                      stock={product.stock}
                      isNew={product.isNewArrival}
                      isFeatured={product.isRecommended}
                    />
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
                        priceRange: [0, 10000000],
                        rarities: [],
                        conditions: [],
                        productTypes: [],
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