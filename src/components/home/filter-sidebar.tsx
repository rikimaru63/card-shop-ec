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

// Card sets organized by game (Japanese names to match database)
const CARD_SETS = {
  pokemon: [
    "スカーレットex",
    "バイオレットex",
    "トリプレットビート",
    "スノーハザード",
    "クレイバースト",
    "ナイトワンダラー",
    "151",
    "レイジングサーフ",
    "古代の咆哮",
    "未来の一閃",
    "シャイニートレジャーex",
    "ワイルドフォース",
    "サイバージャッジ",
    "クリムゾンヘイズ",
    "変幻の仮面",
    "ステラミラクル",
    "超電ブレイカー",
    "テラスタルフェス",
    "バトルパートナーズ",
    "その他"
  ],
  onepiece: [
    "ROMANCE DAWN【OP-01】",
    "頂上決戦【OP-02】",
    "強大な敵【OP-03】",
    "謀略の王国【OP-04】",
    "新時代の主役【OP-05】",
    "双璧の覇者【OP-06】",
    "500年後の未来【OP-07】",
    "二つの伝説【OP-08】",
    "四皇覚醒【OP-09】",
    "ロイヤルブラッドライン【OP-10】",
    "スタートデッキ",
    "プロモーションカード",
    "その他"
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
  const toggleSet = (set: string) => {
    setSelectedSets(prev =>
      prev.includes(set) ? prev.filter(s => s !== set) : [...prev, set]
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

  // Get available sets based on selected game
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
                key={set}
                className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
              >
                <Checkbox
                  id={set}
                  checked={selectedSets.includes(set)}
                  onCheckedChange={() => toggleSet(set)}
                />
                <span className="truncate">{set}</span>
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
