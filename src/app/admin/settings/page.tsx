"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Database, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MigrationResult {
  success: boolean
  message: string
  results?: {
    total: number
    updated: number
    skipped: number
    alreadyCorrect: number
    errors: string[]
  }
}

interface PreviewData {
  summary: {
    total: number
    alreadyCorrect: number
    willUpdate: number
    unknown: number
  }
  products: Array<{
    id: string
    name: string
    currentRarity: string
    newRarity: string
    status: string
  }>
}

export default function AdminSettingsPage() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePreview = async () => {
    setLoading(true)
    setError(null)
    setMigrationResult(null)

    try {
      const response = await fetch("/api/admin/migrate-rarity")
      const data = await response.json()

      if (response.ok) {
        setPreviewData(data)
      } else {
        setError(data.error || "Failed to fetch preview")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleMigrate = async () => {
    if (!confirm("レアリティデータを一括更新します。よろしいですか？")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/migrate-rarity", {
        method: "POST"
      })
      const data = await response.json()

      if (response.ok) {
        setMigrationResult(data)
        setPreviewData(null)
      } else {
        setError(data.error || "Migration failed")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">管理設定</h1>
              <p className="text-sm text-muted-foreground">データベース管理・マイグレーション</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Rarity Migration Section */}
        <div className="bg-white rounded-lg border p-6 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Database className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold">レアリティデータ移行</h2>
              <p className="text-sm text-muted-foreground">
                日本語のレアリティ文字列をデータベースのenum値に変換します
              </p>
            </div>
          </div>

          {/* Mapping Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-3">変換マッピング</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SR (スーパーレア)</span>
                <span className="font-mono">→ SUPER_RARE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">UR (ウルトラレア)</span>
                <span className="font-mono">→ ULTRA_RARE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SAR, AR, CHR, etc.</span>
                <span className="font-mono">→ SECRET_RARE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">R, RR, RRR</span>
                <span className="font-mono">→ RARE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">U (アンコモン)</span>
                <span className="font-mono">→ UNCOMMON</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">C (コモン)</span>
                <span className="font-mono">→ COMMON</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <Button
              onClick={handlePreview}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              プレビュー
            </Button>
            <Button
              onClick={handleMigrate}
              disabled={loading || !previewData}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              マイグレーション実行
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">エラー</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Migration Result */}
          {migrationResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">マイグレーション完了</span>
              </div>
              {migrationResult.results && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-2xl font-bold text-gray-900">{migrationResult.results.total}</p>
                    <p className="text-xs text-muted-foreground">総商品数</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-2xl font-bold text-green-600">{migrationResult.results.updated}</p>
                    <p className="text-xs text-muted-foreground">更新済み</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-2xl font-bold text-blue-600">{migrationResult.results.alreadyCorrect}</p>
                    <p className="text-xs text-muted-foreground">既に正常</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-2xl font-bold text-orange-600">{migrationResult.results.skipped}</p>
                    <p className="text-xs text-muted-foreground">スキップ</p>
                  </div>
                </div>
              )}
              {migrationResult.results?.errors && migrationResult.results.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-orange-800 mb-2">警告:</p>
                  <ul className="text-sm text-orange-700 list-disc list-inside">
                    {migrationResult.results.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {migrationResult.results.errors.length > 5 && (
                      <li>...他 {migrationResult.results.errors.length - 5} 件</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Preview Data */}
          {previewData && (
            <div className="border rounded-lg overflow-hidden">
              {/* Summary */}
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-medium mb-3">プレビュー結果</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-2 bg-white rounded border">
                    <p className="text-2xl font-bold">{previewData.summary.total}</p>
                    <p className="text-xs text-muted-foreground">総商品数</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <p className="text-2xl font-bold text-green-600">{previewData.summary.willUpdate}</p>
                    <p className="text-xs text-muted-foreground">更新対象</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <p className="text-2xl font-bold text-blue-600">{previewData.summary.alreadyCorrect}</p>
                    <p className="text-xs text-muted-foreground">既に正常</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <p className="text-2xl font-bold text-orange-600">{previewData.summary.unknown}</p>
                    <p className="text-xs text-muted-foreground">不明</p>
                  </div>
                </div>
              </div>

              {/* Product List */}
              {previewData.products.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium">商品名</th>
                        <th className="text-left p-3 font-medium">現在の値</th>
                        <th className="text-left p-3 font-medium">変換後</th>
                        <th className="text-left p-3 font-medium">ステータス</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {previewData.products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="p-3 truncate max-w-xs">{product.name}</td>
                          <td className="p-3 font-mono text-xs">{product.currentRarity}</td>
                          <td className="p-3 font-mono text-xs">{product.newRarity}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-1 text-xs rounded ${
                              product.status === "already_correct"
                                ? "bg-blue-100 text-blue-800"
                                : product.status === "will_update"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {product.status === "already_correct" ? "正常" :
                               product.status === "will_update" ? "更新" : "不明"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
