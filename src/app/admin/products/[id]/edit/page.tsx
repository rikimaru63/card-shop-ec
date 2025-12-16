"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import ImageUpload from "@/components/admin/ImageUpload"

interface ProductImage {
  id: string
  url: string
  alt: string | null
  order: number
}

interface Product {
  id: string
  name: string
  cardSet: string | null
  cardNumber: string | null
  rarity: string | null
  condition: string | null
  price: number
  stock: number
  language: string
  foil: boolean
  firstEdition: boolean
  graded: boolean
  gradingCompany: string | null
  grade: string | null
  description: string | null
  images: ProductImage[]
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [_product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [formData, setFormData] = useState({
    name: "",
    cardSet: "",
    cardNumber: "",
    rarity: "",
    condition: "",
    price: "",
    stock: "",
    language: "JP",
    foil: false,
    firstEdition: false,
    graded: false,
    gradingCompany: "",
    grade: "",
    description: "",
  })

  const pokemonSets = [
    "スカーレットex", "バイオレットex", "トリプレットビート",
    "スノーハザード", "クレイバースト", "ナイトワンダラー",
    "151", "レイジングサーフ", "古代の咆哮", "未来の一閃",
    "シャイニートレジャーex", "ワイルドフォース", "サイバージャッジ",
    "クリムゾンヘイズ", "ダークファンタズマ", "スペースジャグラー",
    "タイムゲイザー", "ロストアビス", "白熱のアルカナ",
    "パラダイムトリガー", "VSTARユニバース", "その他"
  ]

  const rarities = [
    { value: "COMMON", label: "C (コモン)" },
    { value: "UNCOMMON", label: "U (アンコモン)" },
    { value: "RARE", label: "R (レア)" },
    { value: "SUPER_RARE", label: "SR (スーパーレア)" },
    { value: "ULTRA_RARE", label: "UR (ウルトラレア)" },
    { value: "SECRET_RARE", label: "SAR (シークレットレア)" },
    { value: "PROMO", label: "プロモ" }
  ]

  const conditions = [
    { value: "MINT", label: "S (完美品)" },
    { value: "NEAR_MINT", label: "A (極美品)" },
    { value: "LIGHTLY_PLAYED", label: "B (美品)" },
    { value: "MODERATELY_PLAYED", label: "C (良好)" },
    { value: "HEAVILY_PLAYED", label: "D (並品)" },
    { value: "DAMAGED", label: "E (劣化品)" }
  ]

  const gradingCompanies = [
    "なし", "PSA", "BGS", "CGC", "ACE"
  ]

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        setImages(data.images || [])
        setFormData({
          name: data.name || "",
          cardSet: data.cardSet || "",
          cardNumber: data.cardNumber || "",
          rarity: data.rarity || "",
          condition: data.condition || "",
          price: String(data.price || ""),
          stock: String(data.stock || ""),
          language: data.language || "JP",
          foil: data.foil || false,
          firstEdition: data.firstEdition || false,
          graded: data.graded || false,
          gradingCompany: data.gradingCompany || "",
          grade: data.grade || "",
          description: data.description || "",
        })
      } else {
        toast({
          title: "エラー",
          description: "商品情報の取得に失敗しました",
          variant: "destructive"
        })
        router.push("/admin/products")
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
        }),
      })

      if (response.ok) {
        toast({
          title: "保存完了",
          description: "商品情報を更新しました"
        })
        router.push("/admin/products")
      } else {
        toast({
          title: "エラー",
          description: "商品情報の更新に失敗しました",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to update product:", error)
      toast({
        title: "エラー",
        description: "商品情報の更新に失敗しました",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
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
              <h1 className="text-2xl font-bold">商品編集</h1>
              <p className="text-sm text-muted-foreground">
                商品情報を編集できます
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          {/* 画像アップロード */}
          <div className="bg-white rounded-lg border p-6">
            <ImageUpload
              productId={productId}
              images={images}
              onImagesChange={setImages}
            />
          </div>

          <div className="bg-white rounded-lg border p-6 space-y-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">基本情報</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">カード名 *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="例: ピカチュウex"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardSet">パック名</Label>
                  <select
                    id="cardSet"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.cardSet}
                    onChange={(e) => setFormData({...formData, cardSet: e.target.value})}
                  >
                    <option value="">選択してください</option>
                    {pokemonSets.map(set => (
                      <option key={set} value={set}>{set}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">カードナンバー</Label>
                  <Input
                    id="cardNumber"
                    placeholder="例: 025/165"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rarity">レアリティ</Label>
                  <select
                    id="rarity"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.rarity}
                    onChange={(e) => setFormData({...formData, rarity: e.target.value})}
                  >
                    <option value="">選択してください</option>
                    {rarities.map(rarity => (
                      <option key={rarity.value} value={rarity.value}>{rarity.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 状態・グレーディング */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">状態・グレーディング</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">コンディション</Label>
                  <select
                    id="condition"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  >
                    <option value="">選択してください</option>
                    {conditions.map(condition => (
                      <option key={condition.value} value={condition.value}>{condition.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.graded}
                      onChange={(e) => setFormData({...formData, graded: e.target.checked})}
                    />
                    グレーディング済み
                  </Label>
                </div>

                {formData.graded && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="gradingCompany">鑑定会社</Label>
                      <select
                        id="gradingCompany"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.gradingCompany}
                        onChange={(e) => setFormData({...formData, gradingCompany: e.target.value})}
                      >
                        <option value="">選択してください</option>
                        {gradingCompanies.map(company => (
                          <option key={company} value={company}>{company}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grade">グレード</Label>
                      <Input
                        id="grade"
                        placeholder="例: 10, 9.5"
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 仕様 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">仕様</h2>

              <div className="flex gap-4">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.foil}
                    onChange={(e) => setFormData({...formData, foil: e.target.checked})}
                  />
                  キラカード
                </Label>

                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.firstEdition}
                    onChange={(e) => setFormData({...formData, firstEdition: e.target.checked})}
                  />
                  初版
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">言語</Label>
                <select
                  id="language"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                >
                  <option value="JP">日本語</option>
                  <option value="EN">英語</option>
                  <option value="KO">韓国語</option>
                  <option value="ZH">中国語</option>
                </select>
              </div>
            </div>

            {/* 価格・在庫 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">価格・在庫</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">販売価格 (円) *</Label>
                  <Input
                    id="price"
                    type="number"
                    required
                    min="0"
                    step="1"
                    placeholder="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">在庫数 *</Label>
                  <Input
                    id="stock"
                    type="number"
                    required
                    min="0"
                    placeholder="10"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* 備考 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">備考</h2>

              <div className="space-y-2">
                <Label htmlFor="description">商品説明</Label>
                <textarea
                  id="description"
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="商品の詳細説明、傷や特徴など"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            {/* アクション */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "保存中..." : "保存する"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
