"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    "スカーレットex", "バイオレットex", "トリプレットビート",
    "スノーハザード", "クレイバースト", "ナイトワンダラー",
    "151", "レイジングサーフ", "古代の咆哮", "未来の一閃",
    "シャイニートレジャーex", "ワイルドフォース", "サイバージャッジ",
    "クリムゾンヘイズ", "変幻の仮面", "ステラミラクル",
    "超電ブレイカー", "テラスタルフェス", "バトルパートナーズ",
    "その他"
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
    "C (コモン)", "U (アンコモン)", "R (レア)", 
    "RR (ダブルレア)", "RRR (トリプルレア)", 
    "SR (スーパーレア)", "UR (ウルトラレア)",
    "SAR (スペシャルアートレア)", "AR (アートレア)",
    "K (かがやく)", "CHR (キャラクターレア)",
    "CSR (キャラクタースーパーレア)", "プロモ"
  ]

  const conditions = [
    { value: "GRADE_A", label: "A：美品 - ほぼ新品同様。目立った傷や汚れなし" },
    { value: "GRADE_B", label: "B：良品 - 多少の使用感あり。軽微な傷がある場合あり" },
    { value: "GRADE_C", label: "C：ダメージ - 目立つ傷や汚れあり。プレイ用として使用可能" },
    { value: "PSA", label: "PSA - PSA鑑定済みカード" },
    { value: "SEALED", label: "未開封 - 未開封の新品" }
  ]

  const gradingCompanies = [
    "なし", "PSA", "BGS", "CGC", "ACE"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const skuPrefix = formData.cardType === "pokemon" ? "PKM" : "OPC"
    const categorySlug = formData.cardType === "pokemon" ? "pokemon-cards" : "onepiece-cards"

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          categoryId: categorySlug,
          sku: `${skuPrefix}-${formData.cardSet}-${formData.cardNumber || Date.now()}`,
        }),
      })

      if (response.ok) {
        router.push("/admin/products")
      }
    } catch (error) {
      console.error("Failed to create product:", error)
    } finally {
      setLoading(false)
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
              <h1 className="text-2xl font-bold">新規商品登録</h1>
              <p className="text-sm text-muted-foreground">
                ポケモンカードの商品情報を入力してください
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg border p-6 space-y-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">基本情報</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardType">カードタイプ *</Label>
                  <select
                    id="cardType"
                    required
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
                    required
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
                  <Label htmlFor="cardSet">パック名 *</Label>
                  <select
                    id="cardSet"
                    required
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
                  <Label htmlFor="rarity">レアリティ *</Label>
                  <select
                    id="rarity"
                    required
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.rarity}
                    onChange={(e) => setFormData({...formData, rarity: e.target.value})}
                  >
                    <option value="">選択してください</option>
                    {rarities.map(rarity => (
                      <option key={rarity} value={rarity}>{rarity}</option>
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
                  <Label htmlFor="condition">コンディション *</Label>
                  <select
                    id="condition"
                    required
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
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "登録中..." : "登録する"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
