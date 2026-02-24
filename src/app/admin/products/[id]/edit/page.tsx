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

// Types for API data
interface OptionItem {
  id: string
  code: string
  label: string
  labelJa?: string | null
}

interface RarityItem {
  id: string
  game: string
  code: string
  label: string
}

interface CardSetItem {
  id: string
  game: string
  label: string
  value: string
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(true)
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

  // Options from API
  const [cardTypes, setCardTypes] = useState<OptionItem[]>([
    { id: "1", code: "pokemon", label: "ポケモンカード" },
    { id: "2", code: "onepiece", label: "ワンピースカード" },
    { id: "3", code: "other", label: "その他" },
  ])
  const [productTypes, setProductTypes] = useState<OptionItem[]>([
    { id: "1", code: "SINGLE", label: "シングルカード" },
    { id: "2", code: "BOX", label: "BOX・パック" },
    { id: "3", code: "OTHER", label: "その他" },
  ])
  const [conditions, setConditions] = useState<OptionItem[]>([
    { id: "1", code: "GRADE_A", label: "A：美品" },
    { id: "2", code: "GRADE_B", label: "B：良品" },
    { id: "3", code: "GRADE_C", label: "C：ダメージ" },
    { id: "4", code: "PSA", label: "PSA鑑定済み" },
    { id: "5", code: "SEALED", label: "未開封" },
  ])
  const [raritiesByGame, setRaritiesByGame] = useState<{
    pokemon: RarityItem[]
    onepiece: RarityItem[]
    other: RarityItem[]
  }>({
    pokemon: [],
    onepiece: [],
    other: []
  })
  const [cardSetsByGame, setCardSetsByGame] = useState<{
    pokemon: CardSetItem[]
    onepiece: CardSetItem[]
    other: CardSetItem[]
  }>({
    pokemon: [],
    onepiece: [],
    other: []
  })

  const getCurrentSets = () => {
    const gameKey = formData.cardType as keyof typeof cardSetsByGame
    return cardSetsByGame[gameKey] || []
  }

  const getCurrentRarities = () => {
    const gameKey = formData.cardType as keyof typeof raritiesByGame
    return raritiesByGame[gameKey] || []
  }

  const gradingCompanies = [
    "なし", "PSA", "BGS", "CGC", "ACE"
  ]

  // Fetch options from API
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [filterRes, cardSetsRes] = await Promise.all([
          fetch('/api/filter-options'),
          fetch('/api/card-sets')
        ])

        if (filterRes.ok) {
          const filterData = await filterRes.json()

          if (filterData.games?.length > 0) {
            setCardTypes(filterData.games.map((g: OptionItem) => ({
              id: g.id,
              code: g.code,
              label: g.labelJa || g.label
            })))
          }

          if (filterData.productTypes?.length > 0) {
            setProductTypes(filterData.productTypes.map((t: OptionItem) => ({
              id: t.id,
              code: t.code,
              label: t.labelJa || t.label
            })))
          }

          if (filterData.conditions?.length > 0) {
            setConditions(filterData.conditions.map((c: OptionItem) => ({
              id: c.id,
              code: c.code,
              label: c.labelJa || c.label
            })))
          }

          if (filterData.rarities) {
            setRaritiesByGame({
              pokemon: filterData.rarities.POKEMON || [],
              onepiece: filterData.rarities.ONEPIECE || [],
              other: filterData.rarities.OTHER || []
            })
          }
        }

        if (cardSetsRes.ok) {
          const cardSetsData = await cardSetsRes.json()
          if (cardSetsData.grouped) {
            setCardSetsByGame({
              pokemon: cardSetsData.grouped.pokemon || [],
              onepiece: cardSetsData.grouped.onepiece || [],
              other: cardSetsData.grouped.other || []
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch options:', error)
      } finally {
        setOptionsLoading(false)
      }
    }

    fetchOptions()
  }, [])

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
                    disabled={optionsLoading}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.cardType}
                    onChange={(e) => setFormData({...formData, cardType: e.target.value, cardSet: "", rarity: ""})}
                  >
                    {cardTypes.map(type => (
                      <option key={type.code} value={type.code}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productType">商品タイプ *</Label>
                  <select
                    id="productType"
                    disabled={optionsLoading}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.productType}
                    onChange={(e) => setFormData({...formData, productType: e.target.value})}
                  >
                    {productTypes.map(type => (
                      <option key={type.code} value={type.code}>{type.label}</option>
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
                    disabled={optionsLoading}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.cardSet}
                    onChange={(e) => setFormData({...formData, cardSet: e.target.value})}
                  >
                    <option value="">選択してください</option>
                    {getCurrentSets().map(set => (
                      <option key={set.value} value={set.value}>{set.label}</option>
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
                    disabled={optionsLoading}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.rarity}
                    onChange={(e) => setFormData({...formData, rarity: e.target.value})}
                  >
                    <option value="">選択してください</option>
                    {getCurrentRarities().map(rarity => (
                      <option key={rarity.code} value={rarity.code}>{rarity.label}</option>
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
                    disabled={optionsLoading}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  >
                    <option value="">選択してください</option>
                    {conditions.map(condition => (
                      <option key={condition.code} value={condition.code}>{condition.label}</option>
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
