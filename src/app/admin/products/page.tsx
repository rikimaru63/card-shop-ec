"use client"

import { useState, useEffect, useCallback } from 'react'
import { ProductList } from '@/components/admin/ProductList'
import Link from 'next/link'
import { Download, FileSpreadsheet, Plus, Loader2 } from 'lucide-react'

interface ProductImage {
  id: string
  url: string
  alt: string | null
  order: number
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  productType?: string | null
  condition?: string | null
  cardNumber?: string | null
  cardSet?: string | null
  images: ProductImage[]
  category: Category | null
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products?limit=1000', {
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Listen for focus to refresh data when returning to page
  useEffect(() => {
    const handleFocus = () => {
      fetchProducts()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchProducts])

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">商品管理</h1>
        <div className="flex gap-3">
          <a
            href="/api/admin/products/export"
            download
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            CSVエクスポート
          </a>
          <Link
            href="/admin/products/import"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSVインポート
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            新規商品
          </Link>
        </div>
      </div>
      <ProductList initialProducts={products} onRefresh={fetchProducts} />
    </div>
  )
}
