"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Product, ProductImage, Category } from "@prisma/client"
import { ProductList } from "@/components/admin/ProductList"
import {
  AdminProductFilters,
  AdminFilters,
  DEFAULT_ADMIN_FILTERS,
} from "@/components/admin/AdminProductFilters"

type ProductWithImages = Product & {
  images: ProductImage[]
  category: Category | null
}

interface AdminProductsClientProps {
  initialProducts: ProductWithImages[]
}

export function AdminProductsClient({ initialProducts }: AdminProductsClientProps) {
  const [filters, setFilters] = useState<AdminFilters>(DEFAULT_ADMIN_FILTERS)
  const [products, setProducts] = useState<ProductWithImages[]>(initialProducts)
  const [totalCount, setTotalCount] = useState(initialProducts.length)
  const [loading, setLoading] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  // Check if any filter is active (beyond defaults)
  const hasActiveFilters =
    filters.search !== "" ||
    filters.game !== "" ||
    filters.cardSet.length > 0 ||
    filters.rarity.length > 0 ||
    filters.condition.length > 0 ||
    filters.productType !== "" ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.inStock ||
    filters.published !== "" ||
    filters.sortBy !== "sortOrder"

  // Fetch filtered products from admin API
  const fetchProducts = useCallback(async (f: AdminFilters) => {
    // If all defaults, use initialProducts
    if (
      f.search === "" &&
      f.game === "" &&
      f.cardSet.length === 0 &&
      f.rarity.length === 0 &&
      f.condition.length === 0 &&
      f.productType === "" &&
      f.minPrice === "" &&
      f.maxPrice === "" &&
      !f.inStock &&
      f.published === "" &&
      f.sortBy === "sortOrder"
    ) {
      setProducts(initialProducts)
      setTotalCount(initialProducts.length)
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.set("limit", "500") // Fetch all matching for client-side reorder

      if (f.search) params.set("search", f.search)
      if (f.game) params.set("game", f.game)
      if (f.cardSet.length > 0) params.set("cardSet", f.cardSet.join(","))
      if (f.rarity.length > 0) params.set("rarity", f.rarity.join(","))
      if (f.condition.length > 0) params.set("condition", f.condition.join(","))
      if (f.productType) params.set("productType", f.productType)
      if (f.minPrice) params.set("minPrice", f.minPrice)
      if (f.maxPrice) params.set("maxPrice", f.maxPrice)
      if (f.inStock) params.set("inStock", "true")
      if (f.published) params.set("published", f.published)
      if (f.sortBy) params.set("sortBy", f.sortBy)

      const res = await fetch(`/api/admin/products?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch")

      const data = await res.json()
      setProducts(data.products)
      setTotalCount(data.pagination.total)
    } catch (error) {
      console.error("Failed to fetch filtered products:", error)
    } finally {
      setLoading(false)
    }
  }, [initialProducts])

  // Debounced fetch when filters change
  useEffect(() => {
    // Skip the initial render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Use longer debounce for search (typing), shorter for button clicks
    const delay = filters.search !== DEFAULT_ADMIN_FILTERS.search ? 400 : 150

    debounceTimer.current = setTimeout(() => {
      fetchProducts(filters)
    }, delay)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [filters, fetchProducts])

  // Refresh handler for after delete
  const handleRefresh = useCallback(() => {
    fetchProducts(filters)
  }, [filters, fetchProducts])

  return (
    <div className="space-y-4">
      <AdminProductFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={totalCount}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-2">
          <span className="text-sm text-muted-foreground animate-pulse">
            Loading...
          </span>
        </div>
      )}

      {/* Product list - reuse existing component */}
      <ProductList
        initialProducts={products}
        onRefresh={handleRefresh}
        hideSearch
      />
    </div>
  )
}
