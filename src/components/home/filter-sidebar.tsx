"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import {
  CARD_SETS,
  CARD_GAMES,
  PRODUCT_TYPES,
  CONDITIONS,
  POKEMON_RARITIES,
  ONEPIECE_RARITIES,
  fetchFilterOptions,
  type FilterOptionsData,
} from "@/lib/filter-config"


interface FilterSidebarProps {
  className?: string
}

// Type for card sets
type CardSetsData = {
  pokemon: { label: string; value: string }[]
  onepiece: { label: string; value: string }[]
  other: { label: string; value: string }[]
}

// Type for display options
type DisplayOption = { id: string; code: string; label: string }

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

  // Filter options from API
  const [cardSets, setCardSets] = useState<CardSetsData>({
    pokemon: [...CARD_SETS.pokemon],
    onepiece: [...CARD_SETS.onepiece],
    other: []
  })
  const [games, setGames] = useState<DisplayOption[]>(
    CARD_GAMES.map(g => ({ id: g.id, code: g.id, label: g.label }))
  )
  const [productTypes, setProductTypes] = useState<DisplayOption[]>(
    PRODUCT_TYPES.map(t => ({ id: t.id, code: t.id, label: t.label }))
  )
  const [conditions, setConditions] = useState<DisplayOption[]>(
    CONDITIONS.map(c => ({ id: c.id, code: c.id, label: c.label }))
  )
  const [raritiesByGame, setRaritiesByGame] = useState<{
    pokemon: DisplayOption[]
    onepiece: DisplayOption[]
    other: DisplayOption[]
  }>({
    pokemon: POKEMON_RARITIES.map(r => ({ id: r.id, code: r.id, label: r.label })),
    onepiece: ONEPIECE_RARITIES.map(r => ({ id: r.id, code: r.id, label: r.label })),
    other: []
  })

  // Fetch all filter options from API on mount
  useEffect(() => {
    fetchFilterOptions().then((data: FilterOptionsData) => {
      // Update games
      if (data.games?.length > 0) {
        setGames(data.games.map(g => ({ id: g.id, code: g.code, label: g.label })))
      }
      // Update product types
      if (data.productTypes?.length > 0) {
        setProductTypes(data.productTypes.map(t => ({ id: t.id, code: t.code, label: t.label })))
      }
      // Update conditions
      if (data.conditions?.length > 0) {
        setConditions(data.conditions.map(c => ({ id: c.id, code: c.code, label: c.label })))
      }
      // Update rarities by game
      if (data.rarities) {
        setRaritiesByGame({
          pokemon: data.rarities.POKEMON?.map(r => ({ id: r.id, code: r.code, label: r.label })) || [],
          onepiece: data.rarities.ONEPIECE?.map(r => ({ id: r.id, code: r.code, label: r.label })) || [],
          other: data.rarities.OTHER?.map(r => ({ id: r.id, code: r.code, label: r.label })) || []
        })
      }
      // Update card sets
      if (data.cardSets) {
        setCardSets({
          pokemon: data.cardSets.POKEMON?.map(s => ({ label: s.label, value: s.value })) || [],
          onepiece: data.cardSets.ONEPIECE?.map(s => ({ label: s.label, value: s.value })) || [],
          other: data.cardSets.OTHER?.map(s => ({ label: s.label, value: s.value })) || []
        })
      }
    })
  }, [])

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

  // Auto-apply: update URL whenever any filter state changes
  // Skip the first render (initialization from URL) using a ref
  const isInitialized = useRef(false)

  useEffect(() => {
    // Skip auto-apply during initial URL → state sync
    if (!isInitialized.current) {
      isInitialized.current = true
      return
    }

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
    ? cardSets[selectedGame as keyof typeof cardSets] || []
    : [...cardSets.pokemon, ...cardSets.onepiece, ...cardSets.other]

  // Get rarities based on selected game
  const availableRarities = selectedGame === "pokemon"
    ? raritiesByGame.pokemon
    : selectedGame === "onepiece"
    ? raritiesByGame.onepiece
    : [...raritiesByGame.pokemon, ...raritiesByGame.onepiece, ...raritiesByGame.other]

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
            {games.map((game) => (
              <Button
                key={game.code}
                variant={selectedGame === game.code ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => {
                  setSelectedGame(selectedGame === game.code ? null : game.code)
                  // Clear sets when switching games
                  if (selectedGame !== game.code) {
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
            {productTypes.map((type) => (
              <Button
                key={type.code}
                variant={selectedProductType === type.code ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setSelectedProductType(
                  selectedProductType === type.code ? null : type.code
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
                ({selectedGame === "pokemon" ? "Pokemon" : selectedGame === "onepiece" ? "One Piece" : "Other"})
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
            {availableRarities.map((rarity) => (
              <Button
                key={rarity.code}
                variant={selectedRarities.includes(rarity.code) ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => toggleRarity(rarity.code)}
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
            {conditions.map((condition) => (
              <label
                key={condition.code}
                className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
              >
                <Checkbox
                  id={condition.code}
                  checked={selectedConditions.includes(condition.code)}
                  onCheckedChange={() => toggleCondition(condition.code)}
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

      </div>
    </div>
  )
}
