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
  productType: string
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
  hasShrink: boolean
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
    cardType: "pokemon", // pokemon or onepiece
    productType: "SINGLE", // SINGLE or BOX
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
    hasShrink: false,
    description: "",
  })

  const cardTypes = [
    { value: "pokemon", label: "ポケモンカード" },
    { value: "onepiece", label: "ワンピースカード" },
  ]

  const productTypes = [
    { value: "SINGLE", label: "シングルカード" },
    { value: "BOX", label: "BOX・パック" },
  ]

  const pokemonSets = [
    // SV シリーズ
    "スカーレットex", "バイオレットex", "トリプレットビート",
    "スノーハザード", "クレイバースト", "ナイトワンダラー",
    "151", "レイジングサーフ", "古代の咆哮", "未来の一閃",
    "シャイニートレジャーex", "ワイルドフォース", "サイバージャッジ",
    "クリムゾンヘイズ", "変幻の仮面", "ステラミラクル",
    "超電ブレイカー", "テラスタルフェス", "バトルパートナーズ",
    "楽園ドラゴーナ", "ナイトワンダラー/楽園ドラゴーナ",
    // ソード＆シールド シリーズ
    "VSTARユニバース", "ハイクラスパック", "パラダイムトリガー",
    "白銀のランス", "漆黒のガイスト", "白銀のランス/漆黒のガイスト",
    "イーブイヒーローズ", "蒼空ストリーム", "摩天パーフェクト",
    "フュージョンアーツ", "スターバース", "ダークファンタズマ",
    "スターバース/ダークファンタズマ", "タイムゲイザー", "スペースジャグラー",
    "タイムゲイザー/スペースジャグラー", "ロストアビス", "ポケモンGO",
    // サン＆ムーン シリーズ
    "GXウルトラシャイニー", "タッグボルト", "ダブルブレイズ",
    "ナイトユニゾン", "迅雷スパーク", "ドリームリーグ",
    "オルタージェネシス", "ソルガレオ&ルナアーラGX",
    // その他・特別パック
    "スタートデッキ", "GXスタートデッキ", "バトルマスターデッキ",
    "ポケモンカード Classic", "シンジュ団", "ダイヤモンド団",
    "シンジュ団/ダイヤモンド団", "ワイルドフォース/サイバージャッジ",
    "古代の咆哮/未来の一閃",
    "プロモーションカード", "その他"
  ]

  const onepieceSets = [
    "ROMANCE DAWN【OP-01】", "頂上決戦【OP-02】", "強大な敵【OP-03】",
    "謀略の王国【OP-04】", "新時代の主役【OP-05】", "双璧の覇者【OP-06】",
    "500年後の未来【OP-07】", "二つの伝説【OP-08】", "四皇覚醒【OP-09】",
    "ロイヤルブラッドライン【OP-10】",
    "スタートデッキ", "プロモーションカード", "その他"
  ]

  const getCurrentSets = () => {
    return formData.cardType === "pokemon" ? pokemonSets : onepieceSets
  }

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
    { value: "GRADE_A", label: "A：美品", description: "ほぼ新品同様。目立った傷や汚れなし" },
    { value: "GRADE_B", label: "B：良品", description: "多少の使用感あり。軽微な傷がある場合あり" },
    { value: "GRADE_C", label: "C：ダメージ", description: "目立つ傷や汚れあり。プレイ用として使用可能" },
    { value: "PSA", label: "PSA", description: "PSA鑑定済みカード" },
    { value: "SEALED", label: "未開封", description: "未開封の新品" }
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
        console.log('Fetched product data:', {
          name: data.name,
          condition: data.condition,
          rarity: data.rarity,
          cardSet: data.cardSet
        })
        setProduct(data)
        setImages(data.images || [])
        // Determine card type from category
        const cardType = data.category?.slug === "onepiece-cards" ? "onepiece" : "pokemon"
        setFormData({
          name: data.name || "",
          cardType: cardType,
          productType: data.productType || "SINGLE",
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
          hasShrink: data.hasShrink || false,
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
        router.refresh()
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
                  <Label htmlFor="cardType">カードタイプ *</Label>
                  <select
                    id="cardType"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.cardType}
                    onChange={(e) => setFormData({...formData, cardType: e.target.value, cardSet: ""})}
                  >
                    {cardTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productType">商品タイプ *</Label>
                  <select
                    id="productType"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.productType}
                    onChange={(e) => setFormData({...formData, productType: e.target.value})}
                  >
                    {productTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">商品名 *</Label>
                  <Input
                    id="name"
                    required
                    placeholder={formData.productType === "BOX" ? "例: シャイニートレジャーex BOX" : (formData.cardType === "pokemon" ? "例: ピカチュウex" : "例: モンキー・D・ルフィ")}
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
                    {getCurrentSets().map(set => (
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

              <div className="flex flex-wrap gap-4">
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

                {formData.productType === "BOX" && (
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.hasShrink}
                      onChange={(e) => setFormData({...formData, hasShrink: e.target.checked})}
                    />
                    シュリンク付き
                  </Label>
                )}
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
