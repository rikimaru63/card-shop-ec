"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, FileDown, Eye, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

type PreviewChange = {
  row: number
  name: string
  currentPrice: number | null
  newPrice: number
  diff: number | null
  currentStock: number | null
  newStock: number
  action: 'UPDATE' | 'CREATE'
}

type PreviewResult = {
  mode: 'preview'
  changes: PreviewChange[]
  summary: {
    total: number
    updates: number
    creates: number
    noChange: number
  }
  errors: string[]
}

type ApplyResult = {
  mode: 'apply'
  success: number
  failed: number
  errors: string[]
  created: number
  updated: number
  message: string
}

export default function ImportProductsPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [result, setResult] = useState<ApplyResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setPreview(null)
      setResult(null)
    }
  }

  const handlePreview = async () => {
    if (!file) return

    setLoading(true)
    setPreview(null)
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/admin/products/import?mode=preview', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.mode === 'preview') {
        setPreview(data)
      }
    } catch (error) {
      setPreview({
        mode: 'preview',
        changes: [],
        summary: { total: 0, updates: 0, creates: 0, noChange: 0 },
        errors: ['プレビューの取得に失敗しました']
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!file) return

    setApplying(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/admin/products/import?mode=apply', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)
      setPreview(null)
    } catch (error) {
      setResult({
        mode: 'apply',
        success: 0,
        failed: 1,
        errors: ['インポートに失敗しました'],
        created: 0,
        updated: 0,
        message: ''
      })
    } finally {
      setApplying(false)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setFile(null)
  }

  const downloadTemplate = () => {
    const csvContent = `namae,kosuu,kakaku,codition,categori
ピカチュウex,10,1500,New,Pokemon
リザードンex,1,15000,Used A,Pokemon
ミュウツーV,5,3000,Used B,Pokemon
`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'product_template.csv'
    link.click()
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/admin/products/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/products">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">CSVインポート</h1>
              <p className="text-sm text-muted-foreground">
                CSVファイルから一括で商品を登録できます
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 現在の商品をエクスポート */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <FileDown className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">
                  現在の商品をエクスポート
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  登録済みの商品データをCSVファイルでダウンロードできます。
                </p>
                <Button onClick={handleExport} disabled={exporting} variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  {exporting ? 'エクスポート中...' : '商品データをエクスポート'}
                </Button>
              </div>
            </div>
          </div>

          {/* テンプレートダウンロード */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">
                  CSVテンプレートをダウンロード
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  新しく商品を登録する場合は、テンプレートをダウンロードして商品情報を入力してください。
                </p>
                <Button onClick={downloadTemplate} variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  テンプレートダウンロード
                </Button>
              </div>
            </div>
          </div>

          {/* CSVフォーマット説明 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">CSVフォーマット</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-3 py-2 text-left">カラム名</th>
                    <th className="border px-3 py-2 text-left">説明</th>
                    <th className="border px-3 py-2 text-left">必須</th>
                    <th className="border px-3 py-2 text-left">例</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-3 py-2 font-mono">namae</td>
                    <td className="border px-3 py-2">商品名</td>
                    <td className="border px-3 py-2 text-green-600">必須</td>
                    <td className="border px-3 py-2">ピカチュウex</td>
                  </tr>
                  <tr>
                    <td className="border px-3 py-2 font-mono">kosuu</td>
                    <td className="border px-3 py-2">在庫数</td>
                    <td className="border px-3 py-2 text-gray-500">任意</td>
                    <td className="border px-3 py-2">10</td>
                  </tr>
                  <tr>
                    <td className="border px-3 py-2 font-mono">kakaku</td>
                    <td className="border px-3 py-2">価格（円）</td>
                    <td className="border px-3 py-2 text-green-600">必須</td>
                    <td className="border px-3 py-2">1500</td>
                  </tr>
                  <tr>
                    <td className="border px-3 py-2 font-mono">codition</td>
                    <td className="border px-3 py-2">状態</td>
                    <td className="border px-3 py-2 text-gray-500">任意</td>
                    <td className="border px-3 py-2">New, Used A, Used B, Used C, Used D, Damaged</td>
                  </tr>
                  <tr>
                    <td className="border px-3 py-2 font-mono">categori</td>
                    <td className="border px-3 py-2">カテゴリ</td>
                    <td className="border px-3 py-2 text-gray-500">任意</td>
                    <td className="border px-3 py-2">Pokemon</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ※ 同じ商品名が既に存在する場合は、価格・在庫数・状態・カテゴリが更新されます。
            </p>
          </div>

          {/* ファイルアップロード */}
          {!preview && !result && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">CSVファイルをアップロード</h2>
              
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="p-4 bg-gray-50 rounded-full">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">
                      クリックしてファイルを選択
                    </p>
                    <p className="text-sm text-muted-foreground">
                      または、ファイルをドラッグ＆ドロップ
                    </p>
                  </div>
                </label>
                
                {file && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <Button
                  onClick={handlePreview}
                  disabled={!file || loading}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {loading ? '解析中...' : 'プレビュー（変更内容を確認）'}
                </Button>
              </div>
            </div>
          )}

          {/* プレビュー結果 */}
          {preview && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">変更プレビュー</h2>
              </div>

              {/* サマリー */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{preview.summary.total}</p>
                  <p className="text-xs text-muted-foreground">合計</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{preview.summary.creates}</p>
                  <p className="text-xs text-blue-600">新規作成</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">{preview.summary.updates}</p>
                  <p className="text-xs text-orange-600">更新</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-400">{preview.summary.noChange}</p>
                  <p className="text-xs text-muted-foreground">変更なし</p>
                </div>
              </div>

              {/* エラー表示 */}
              {preview.errors.length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <h3 className="font-medium text-sm text-red-700">エラー ({preview.errors.length}件)</h3>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {preview.errors.map((error, i) => (
                      <p key={i} className="text-sm text-red-700">{error}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* 変更一覧テーブル */}
              {preview.changes.length > 0 && (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border px-3 py-2 text-left">行</th>
                        <th className="border px-3 py-2 text-left">商品名</th>
                        <th className="border px-3 py-2 text-left">操作</th>
                        <th className="border px-3 py-2 text-right">現在価格</th>
                        <th className="border px-3 py-2 text-right">新価格</th>
                        <th className="border px-3 py-2 text-right">差額</th>
                        <th className="border px-3 py-2 text-right">在庫変更</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.changes.map((change, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="border px-3 py-2 text-gray-500">{change.row}</td>
                          <td className="border px-3 py-2 font-medium">{change.name}</td>
                          <td className="border px-3 py-2">
                            {change.action === 'CREATE' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                新規
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                更新
                              </span>
                            )}
                          </td>
                          <td className="border px-3 py-2 text-right">
                            {change.currentPrice !== null ? formatPrice(change.currentPrice) : '—'}
                          </td>
                          <td className="border px-3 py-2 text-right font-medium">
                            {formatPrice(change.newPrice)}
                          </td>
                          <td className={`border px-3 py-2 text-right font-medium ${
                            change.diff === null ? 'text-gray-400' :
                            change.diff > 0 ? 'text-green-600' :
                            change.diff < 0 ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {change.diff === null ? '—' :
                             change.diff > 0 ? `+${formatPrice(change.diff)}` :
                             change.diff < 0 ? `${formatPrice(change.diff)}` : '±0'}
                          </td>
                          <td className="border px-3 py-2 text-right text-sm">
                            {change.action === 'CREATE' ? (
                              <span className="text-blue-600">{change.newStock}</span>
                            ) : (
                              <span>
                                {change.currentStock} → {change.newStock}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {preview.changes.length === 0 && preview.errors.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  変更対象の商品はありません。すべて現在のデータと同じです。
                </p>
              )}

              {/* アクションボタン */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleApply}
                  disabled={applying || (preview.changes.length === 0 && preview.errors.length === 0)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {applying ? '反映中...' : `反映する（${preview.changes.length}件）`}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={applying}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          )}

          {/* 反映結果 */}
          {result && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">インポート結果</h2>
              
              <div className="space-y-4">
                {result.message && (
                  <p className="text-green-700 bg-green-50 px-4 py-2 rounded-lg">
                    {result.message}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">成功: {result.success}件</span>
                  </div>
                  {result.created > 0 && (
                    <span className="text-sm text-blue-600">（新規: {result.created}件）</span>
                  )}
                  {result.updated > 0 && (
                    <span className="text-sm text-orange-600">（更新: {result.updated}件）</span>
                  )}
                  {result.failed > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">失敗: {result.failed}件</span>
                    </div>
                  )}
                </div>

                {result.errors.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium text-sm mb-2">エラー詳細:</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                      {result.errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-700">{error}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button onClick={() => router.push('/admin/products')}>
                    商品一覧に戻る
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null)
                      setPreview(null)
                      setResult(null)
                    }}
                  >
                    新しいファイルをアップロード
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
