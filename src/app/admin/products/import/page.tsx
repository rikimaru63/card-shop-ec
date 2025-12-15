"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ImportProductsPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [result, setResult] = useState<{success: number, failed: number, errors: string[], created?: number, updated?: number, message?: string} | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: 0,
        failed: 1,
        errors: ['アップロードに失敗しました']
      })
    } finally {
      setLoading(false)
    }
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
        <div className="max-w-3xl mx-auto space-y-6">
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
                onClick={handleImport}
                disabled={!file || loading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'インポート中...' : 'インポート開始'}
              </Button>
            </div>
          </div>

          {/* 結果表示 */}
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
                  {result.created !== undefined && result.created > 0 && (
                    <span className="text-sm text-blue-600">（新規: {result.created}件）</span>
                  )}
                  {result.updated !== undefined && result.updated > 0 && (
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
