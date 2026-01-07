"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

// Card game types
const CARD_GAMES = [
  { id: "pokemon", label: "Pokemon" },
  { id: "onepiece", label: "One Piece" }
]

// Card sets with English labels and Japanese DB values
const CARD_SETS = {
  pokemon: [
    // SV Series
    { label: "Scarlet ex", value: "スカーレットex" },
    { label: "Violet ex", value: "バイオレットex" },
    { label: "Triplet Beat", value: "トリプレットビート" },
    { label: "Snow Hazard", value: "スノーハザード" },
    { label: "Clay Burst", value: "クレイバースト" },
    { label: "Pokemon 151", value: "151" },
    { label: "Raging Surf", value: "レイジングサーフ" },
    { label: "Ancient Roar", value: "古代の咆哮" },
    { label: "Future Flash", value: "未来の一閃" },
    { label: "Shiny Treasure ex", value: "シャイニートレジャーex" },
    { label: "Wild Force", value: "ワイルドフォース" },
    { label: "Cyber Judge", value: "サイバージャッジ" },
    { label: "Wild Force / Cyber Judge", value: "ワイルドフォース/サイバージャッジ" },
    { label: "Crimson Haze", value: "クリムゾンヘイズ" },
    { label: "Mask of Change", value: "変幻の仮面" },
    { label: "Stellar Miracle", value: "ステラミラクル" },
    { label: "Super Electric Breaker", value: "超電ブレイカー" },
    { label: "Terastal Fest", value: "テラスタルフェス" },
    { label: "Battle Partners", value: "バトルパートナーズ" },
    { label: "Night Wanderer", value: "ナイトワンダラー" },
    { label: "Paradise Dragona", value: "楽園ドラゴーナ" },
    { label: "Night Wanderer / Paradise Dragona", value: "ナイトワンダラー/楽園ドラゴーナ" },
    // Sword & Shield Series
    { label: "VSTAR Universe", value: "VSTARユニバース" },
    { label: "High Class Pack", value: "ハイクラスパック" },
    { label: "Paradigm Trigger", value: "パラダイムトリガー" },
    { label: "Silver Lance", value: "白銀のランス" },
    { label: "Jet-Black Spirit", value: "漆黒のガイスト" },
    { label: "Silver Lance / Jet-Black Spirit", value: "白銀のランス/漆黒のガイスト" },
    { label: "Eevee Heroes", value: "イーブイヒーローズ" },
    { label: "Blue Sky Stream", value: "蒼空ストリーム" },
    { label: "Skyscraping Perfect", value: "摩天パーフェクト" },
    { label: "Fusion Arts", value: "フュージョンアーツ" },
    { label: "Star Birth", value: "スターバース" },
    { label: "Dark Phantasma", value: "ダークファンタズマ" },
    { label: "Star Birth / Dark Phantasma", value: "スターバース/ダークファンタズマ" },
    { label: "Time Gazer", value: "タイムゲイザー" },
    { label: "Space Juggler", value: "スペースジャグラー" },
    { label: "Time Gazer / Space Juggler", value: "タイムゲイザー/スペースジャグラー" },
    { label: "Lost Abyss", value: "ロストアビス" },
    { label: "Pokemon GO", value: "ポケモンGO" },
    // Sun & Moon Series
    { label: "GX Ultra Shiny", value: "GXウルトラシャイニー" },
    { label: "Tag Bolt", value: "タッグボルト" },
    { label: "Double Blaze", value: "ダブルブレイズ" },
    { label: "Night Unison", value: "ナイトユニゾン" },
    { label: "Thunderclap Spark", value: "迅雷スパーク" },
    { label: "Dream League", value: "ドリームリーグ" },
    { label: "Alter Genesis", value: "オルタージェネシス" },
    // Special / Starter Decks
    { label: "Start Deck", value: "スタートデッキ" },
    { label: "GX Start Deck", value: "GXスタートデッキ" },
    { label: "Battle Master Deck", value: "バトルマスターデッキ" },
    { label: "Pokemon Card Classic", value: "ポケモンカード Classic" },
    { label: "Ancient Roar / Future Flash", value: "古代の咆哮/未来の一閃" },
    { label: "Promo Cards", value: "プロモーションカード" },
    { label: "Other", value: "その他" }
  ],
  onepiece: [
    { label: "Romance Dawn (OP-01)", value: "ROMANCE DAWN【OP-01】" },
    { label: "Paramount War (OP-02)", value: "頂上決戦【OP-02】" },
    { label: "Pillars of Strength (OP-03)", value: "強大な敵【OP-03】" },
    { label: "Kingdoms of Intrigue (OP-04)", value: "謀略の王国【OP-04】" },
    { label: "Awakening of New Era (OP-05)", value: "新時代の主役【OP-05】" },
    { label: "Wings of Captain (OP-06)", value: "双璧の覇者【OP-06】" },
    { label: "500 Years Future (OP-07)", value: "500年後の未来【OP-07】" },
    { label: "Two Legends (OP-08)", value: "二つの伝説【OP-08】" },
    { label: "Four Emperors (OP-09)", value: "四皇覚醒【OP-09】" },
    { label: "Royal Bloodline (OP-10)", value: "ロイヤルブラッドライン【OP-10】" },
    { label: "Starter Deck", value: "スタートデッキ" },
    { label: "Promo Cards", value: "プロモーションカード" },
    { label: "Other", value: "その他" }
  ]
}

// Rarity options (matching database enum)
const RARITIES = [
  { id: "SECRET_RARE", label: "SAR / SEC" },
  { id: "ULTRA_RARE", label: "UR" },
  { id: "SUPER_RARE", label: "SR" },
  { id: "RARE", label: "R" },
  { id: "UNCOMMON", label: "UC" },
  { id: "COMMON", label: "C" },
  { id: "PROMO", label: "PROMO" }
]

// Condition options (matching database enum)
const CONDITIONS = [
  { id: "GRADE_A", label: "Grade A (Near Mint)" },
  { id: "GRADE_B", label: "Grade B (Good)" },
  { id: "GRADE_C", label: "Grade C (Played)" },
  { id: "PSA", label: "PSA Graded" },
  { id: "SEALED", label: "Sealed / New" }
]

// Product type options
const PRODUCT_TYPES = [
  { id: "SINGLE", label: "Single Cards" },
  { id: "BOX", label: "BOX / Sealed" }
]

interface FilterSidebarProps {
  className?: string
}

export function FilterSidebar({ className }: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Local state for filters
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedSets, setSelectedSets] = useState<string[]>([])
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null)
  const [inStockOnly, setInStockOnly] = useState(false)

  // Initialize filters from URL on mount
  useEffect(() => {
    const game = searchParams.get("game")
    const sets = searchParams.get("cardSet")?.split(",").filter(Boolean) || []
    const rarities = searchParams.get("rarity")?.split(",").filter(Boolean) || []
    const conditions = searchParams.get("condition")?.split(",").filter(Boolean) || []
    const productType = searchParams.get("productType")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const inStock = searchParams.get("inStock") === "true"

    if (game) setSelectedGame(game)
    if (sets.length > 0) setSelectedSets(sets)
    if (rarities.length > 0) setSelectedRarities(rarities)
    if (conditions.length > 0) setSelectedConditions(conditions)
    if (productType) setSelectedProductType(productType)
    if (minPrice || maxPrice) {
      setPriceRange([
        minPrice ? parseInt(minPrice) : 0,
        maxPrice ? parseInt(maxPrice) : 100000
      ])
    }
    setInStockOnly(inStock)
  }, [searchParams])

  // Update URL with filters
  const updateFilters = useCallback(() => {
    const params = new URLSearchParams()

    if (selectedGame) params.set("game", selectedGame)
    if (selectedSets.length > 0) params.set("cardSet", selectedSets.join(","))
    if (selectedRarities.length > 0) params.set("rarity", selectedRarities.join(","))
    if (selectedConditions.length > 0) params.set("condition", selectedConditions.join(","))
    if (selectedProductType) params.set("productType", selectedProductType)
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString())
    if (priceRange[1] < 100000) params.set("maxPrice", priceRange[1].toString())
    if (inStockOnly) params.set("inStock", "true")

    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, pathname, selectedGame, selectedSets, selectedRarities, selectedConditions, selectedProductType, priceRange, inStockOnly])

  // Clear all filters
  const clearFilters = () => {
    setSelectedGame(null)
    setSelectedSets([])
    setSelectedRarities([])
    setSelectedConditions([])
    setSelectedProductType(null)
    setPriceRange([0, 100000])
    setInStockOnly(false)
    router.push(pathname, { scroll: false })
  }

  // Toggle functions
  const toggleSet = (value: string) => {
    setSelectedSets(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    )
  }

  const toggleRarity = (rarity: string) => {
    setSelectedRarities(prev =>
      prev.includes(rarity) ? prev.filter(r => r !== rarity) : [...prev, rarity]
    )
  }

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    )
  }

  // Get available sets based on selected game (with label/value pairs)
  const availableSets = selectedGame
    ? CARD_SETS[selectedGame as keyof typeof CARD_SETS]
    : [...CARD_SETS.pokemon, ...CARD_SETS.onepiece]

  // Check if any filters are active
  const hasActiveFilters = selectedGame || selectedSets.length > 0 ||
    selectedRarities.length > 0 || selectedConditions.length > 0 ||
    selectedProductType || priceRange[0] > 0 || priceRange[1] < 100000 || inStockOnly

  return (
    <div className={cn("bg-white rounded-lg border p-4 sticky top-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={clearFilters}
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Card Game Type */}
        <div>
          <h3 className="font-medium text-sm mb-3">Card Game</h3>
          <div className="flex flex-wrap gap-2">
            {CARD_GAMES.map((game) => (
              <Button
                key={game.id}
                variant={selectedGame === game.id ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => {
                  setSelectedGame(selectedGame === game.id ? null : game.id)
                  // Clear sets when switching games
                  if (selectedGame !== game.id) {
                    setSelectedSets([])
                  }
                }}
              >
                {game.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Type */}
        <div>
          <h3 className="font-medium text-sm mb-3">Product Type</h3>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_TYPES.map((type) => (
              <Button
                key={type.id}
                variant={selectedProductType === type.id ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setSelectedProductType(
                  selectedProductType === type.id ? null : type.id
                )}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="font-medium text-sm mb-3">Price Range</h3>
          <div className="space-y-3">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={100000}
              step={500}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <span>¥{priceRange[0].toLocaleString()}</span>
              <span>¥{priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card Sets */}
        <div>
          <h3 className="font-medium text-sm mb-3">
            Card Sets
            {selectedGame && (
              <span className="text-xs text-muted-foreground ml-1">
                ({selectedGame === "pokemon" ? "Pokemon" : "One Piece"})
              </span>
            )}
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {availableSets.map((set) => (
              <label
                key={set.value}
                className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
              >
                <Checkbox
                  id={set.value}
                  checked={selectedSets.includes(set.value)}
                  onCheckedChange={() => toggleSet(set.value)}
                />
                <span className="truncate">{set.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rarity */}
        <div>
          <h3 className="font-medium text-sm mb-3">Rarity</h3>
          <div className="flex flex-wrap gap-2">
            {RARITIES.map((rarity) => (
              <Button
                key={rarity.id}
                variant={selectedRarities.includes(rarity.id) ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => toggleRarity(rarity.id)}
              >
                {rarity.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <h3 className="font-medium text-sm mb-3">Condition</h3>
          <div className="space-y-2">
            {CONDITIONS.map((condition) => (
              <label
                key={condition.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
              >
                <Checkbox
                  id={condition.id}
                  checked={selectedConditions.includes(condition.id)}
                  onCheckedChange={() => toggleCondition(condition.id)}
                />
                <span>{condition.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* In Stock Only */}
        <div>
          <h3 className="font-medium text-sm mb-3">Stock</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
            <Checkbox
              id="in-stock"
              checked={inStockOnly}
              onCheckedChange={(checked) => setInStockOnly(checked === true)}
            />
            <span>In Stock Only</span>
          </label>
        </div>

        {/* Apply Button */}
        <Button className="w-full" onClick={updateFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
