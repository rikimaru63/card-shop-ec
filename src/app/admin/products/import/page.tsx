"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ImportProductsPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{success: number, failed: number, errors: string[]} | null>(null)

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
    const csvContent = `カード名,パック名,カードナンバー,レアリティ,コンディション,価格,在庫数,言語,キラカード,初版,グレーディング済み,鑑定会社,グレード,商品説明
ピカチュウex,スカーレットex,025/165,RR (ダブルレア),A (極美品),1500,10,JP,TRUE,FALSE,FALSE,,,
リザードンex,バイオレットex,006/078,SAR (スペシャルアートレア),S (完美品),15000,1,JP,TRUE,FALSE,TRUE,PSA,10,PSA10 美品
ミュウツーV,151,150/165,SR (スーパーレア),B (美品),3000,5,JP,TRUE,FALSE,FALSE,,,
`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'pokemon_card_template.csv'
    link.click()
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
                  まず、テンプレートファイルをダウンロードして、商品情報を入力してください。
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
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">必須項目:</div>
                <div className="text-muted-foreground">
                  カード名, パック名, レアリティ, コンディション, 価格, 在庫数
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">オプション:</div>
                <div className="text-muted-foreground">
                  カードナンバー, 言語, キラカード, 初版, グレーディング情報, 商品説明
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">TRUE/FALSE:</div>
                <div className="text-muted-foreground">
                  キラカード, 初版, グレーディング済み (TRUE または FALSE で入力)
                </div>
              </div>
            </div>
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">成功: {result.success}件</span>
                  </div>
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
