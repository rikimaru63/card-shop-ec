"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Product, ProductImage, Category } from "@prisma/client"
import { ProductList } from "@/components/admin/ProductList"
import {
  AdminProductFilters,
  AdminFilters,
  DEFAULT_ADMIN_FILTERS,
} from "@/components/admin/AdminProductFilters"
import { filterProductsBySearch } from "@/lib/admin/product-search"

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

  // テキスト検索はサーバーへ送らずクライアント側で絞り込む（往復を排除）。
  // サーバー往復が必要なのは構造化フィルタ／並び替えが有効なときだけ。
  const hasActiveServerFilters =
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

  // 構造化フィルタ部分だけのキー。これが変わったときだけサーバー往復する
  // （= テキスト検索の打鍵では再 fetch しない）。
  const serverFilterKey = useMemo(
    () =>
      JSON.stringify({
        game: filters.game,
        cardSet: filters.cardSet,
        rarity: filters.rarity,
        condition: filters.condition,
        productType: filters.productType,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock,
        published: filters.published,
        sortBy: filters.sortBy,
      }),
    [
      filters.game,
      filters.cardSet,
      filters.rarity,
      filters.condition,
      filters.productType,
      filters.minPrice,
      filters.maxPrice,
      filters.inStock,
      filters.published,
      filters.sortBy,
    ]
  )

  // フィルタバーに表示する件数（テキスト検索の絞り込み後の見かけ件数）。
  // ProductList と同じ純粋関数を使い、表示行数と一致させる。
  const displayCount = useMemo(
    () => filterProductsBySearch(products, filters.search).length,
    [products, filters.search]
  )

  // Fetch filtered products from admin API (server-side filters only)
  const fetchProducts = useCallback(
    async (f: AdminFilters) => {
      const serverFiltersActive =
        f.game !== "" ||
        f.cardSet.length > 0 ||
        f.rarity.length > 0 ||
        f.condition.length > 0 ||
        f.productType !== "" ||
        f.minPrice !== "" ||
        f.maxPrice !== "" ||
        f.inStock ||
        f.published !== "" ||
        f.sortBy !== "sortOrder"

      // 構造化フィルタが無ければ、配布済みの全件をそのまま使う（往復なし）。
      if (!serverFiltersActive) {
        setProducts(initialProducts)
        setTotalCount(initialProducts.length)
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const params = new URLSearchParams()
        // 管理画面にはページネーションUIが無いため、一度に全商品を取得する。
        // 現状商品数(~2,460)を十分上回る値に設定。
        // TODO: 商品数が5,000件を超える見込みになった時点でページネーションUI実装を検討すること。
        params.set("limit", "10000")
        params.set("page", "1")

        // NOTE: search は送らない。テキスト検索はクライアント側 (ProductList) で行う。
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
    },
    [initialProducts]
  )

  // Debounced fetch — only when a server-side filter changes (not on search keystrokes)
  useEffect(() => {
    // Skip the initial render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      fetchProducts(filters)
    }, 200)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
    // serverFilterKey が変わったときだけ再実行する（filters.search の変化では発火させない）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverFilterKey, fetchProducts])

  // Refresh handler for after delete
  const handleRefresh = useCallback(() => {
    // サーバー側フィルタが有効なときだけ再取得する。既定／検索のみのビューでは
    // 再取得すると古い SSR スナップショット(initialProducts)へ巻き戻り、
    // 削除直後の商品が復活してしまうため、ProductList のローカル除去に委ねる。
    if (hasActiveServerFilters) {
      fetchProducts(filters)
    }
  }, [filters, fetchProducts, hasActiveServerFilters])

  return (
    <div className="space-y-4">
      <AdminProductFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={displayCount}
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
        searchQuery={filters.search}
        allowReorder={!hasActiveServerFilters}
      />
    </div>
  )
}
