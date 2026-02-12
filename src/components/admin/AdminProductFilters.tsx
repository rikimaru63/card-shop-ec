"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ChevronDown,
  Filter,
  Search,
  X,
} from "lucide-react"
import {
  CARD_GAMES,
  PRODUCT_TYPES,
  CONDITIONS,
  CARD_SETS,
  POKEMON_RARITIES,
  ONEPIECE_RARITIES,
  ALL_RARITIES,
  fetchFilterOptions,
  type FilterOptionsData,
} from "@/lib/filter-config"

// ============================================
// Types
// ============================================
export interface AdminFilters {
  search: string
  game: string
  cardSet: string[]
  rarity: string[]
  condition: string[]
  productType: string
  minPrice: string
  maxPrice: string
  inStock: boolean
  published: string
  sortBy: string
}

export const DEFAULT_ADMIN_FILTERS: AdminFilters = {
  search: "",
  game: "",
  cardSet: [],
  rarity: [],
  condition: [],
  productType: "",
  minPrice: "",
  maxPrice: "",
  inStock: false,
  published: "",
  sortBy: "sortOrder",
}

type DisplayOption = { id: string; code: string; label: string }
type CardSetsData = {
  pokemon: { label: string; value: string }[]
  onepiece: { label: string; value: string }[]
  other: { label: string; value: string }[]
}

// ============================================
// Component
// ============================================
interface AdminProductFiltersProps {
  filters: AdminFilters
  onFiltersChange: (filters: AdminFilters) => void
  totalCount?: number
}

export function AdminProductFilters({
  filters,
  onFiltersChange,
  totalCount,
}: AdminProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ? parseInt(filters.minPrice) : 0,
    filters.maxPrice ? parseInt(filters.maxPrice) : 100000,
  ])

  // Dynamic filter options from API
  const [games, setGames] = useState<DisplayOption[]>(
    CARD_GAMES.map((g) => ({ id: g.id, code: g.id, label: g.label }))
  )
  const [productTypes, setProductTypes] = useState<DisplayOption[]>(
    PRODUCT_TYPES.map((t) => ({ id: t.id, code: t.id, label: t.label }))
  )
  const [conditions, setConditions] = useState<DisplayOption[]>(
    CONDITIONS.map((c) => ({ id: c.id, code: c.id, label: c.label }))
  )
  const [raritiesByGame, setRaritiesByGame] = useState<{
    pokemon: DisplayOption[]
    onepiece: DisplayOption[]
    other: DisplayOption[]
    all: DisplayOption[]
  }>({
    pokemon: POKEMON_RARITIES.map((r) => ({ id: r.id, code: r.id, label: r.label })),
    onepiece: ONEPIECE_RARITIES.map((r) => ({ id: r.id, code: r.id, label: r.label })),
    other: [],
    all: ALL_RARITIES.map((r) => ({ id: r.id, code: r.id, label: r.label })),
  })
  const [cardSets, setCardSets] = useState<CardSetsData>({
    pokemon: [...CARD_SETS.pokemon],
    onepiece: [...CARD_SETS.onepiece],
    other: [],
  })

  // Fetch dynamic filter options on mount
  useEffect(() => {
    fetchFilterOptions().then((data: FilterOptionsData) => {
      if (data.games?.length > 0) {
        setGames(data.games.map((g) => ({ id: g.id, code: g.code, label: g.label })))
      }
      if (data.productTypes?.length > 0) {
        setProductTypes(data.productTypes.map((t) => ({ id: t.id, code: t.code, label: t.label })))
      }
      if (data.conditions?.length > 0) {
        setConditions(data.conditions.map((c) => ({ id: c.id, code: c.code, label: c.label })))
      }
      if (data.rarities) {
        const pokemonR = data.rarities.POKEMON?.map((r) => ({ id: r.id, code: r.code, label: r.label })) || []
        const onepieceR = data.rarities.ONEPIECE?.map((r) => ({ id: r.id, code: r.code, label: r.label })) || []
        const otherR = data.rarities.OTHER?.map((r) => ({ id: r.id, code: r.code, label: r.label })) || []
        setRaritiesByGame({
          pokemon: pokemonR,
          onepiece: onepieceR,
          other: otherR,
          all: [...pokemonR, ...onepieceR, ...otherR],
        })
      }
      if (data.cardSets) {
        setCardSets({
          pokemon: data.cardSets.POKEMON?.map((s) => ({ label: s.label, value: s.value })) || [],
          onepiece: data.cardSets.ONEPIECE?.map((s) => ({ label: s.label, value: s.value })) || [],
          other: data.cardSets.OTHER?.map((s) => ({ label: s.label, value: s.value })) || [],
        })
      }
    })
  }, [])

  // Derived: available sets & rarities based on selected game
  const availableSets = filters.game
    ? cardSets[filters.game as keyof typeof cardSets] || []
    : [...cardSets.pokemon, ...cardSets.onepiece, ...cardSets.other]

  const availableRarities = filters.game === "pokemon"
    ? raritiesByGame.pokemon
    : filters.game === "onepiece"
    ? raritiesByGame.onepiece
    : raritiesByGame.all

  // Count active filters (excluding search and sort)
  const activeCount =
    (filters.game ? 1 : 0) +
    filters.cardSet.length +
    filters.rarity.length +
    filters.condition.length +
    (filters.productType ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.published ? 1 : 0)

  const clearAll = () => {
    setPriceRange([0, 100000])
    onFiltersChange({ ...DEFAULT_ADMIN_FILTERS })
  }

  const update = (partial: Partial<AdminFilters>) => {
    onFiltersChange({ ...filters, ...partial })
  }

  const toggleArrayFilter = (
    key: "cardSet" | "rarity" | "condition",
    value: string
  ) => {
    const current = filters[key]
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    update({ [key]: next })
  }

  // Apply price range from slider
  const applyPriceRange = () => {
    update({
      minPrice: priceRange[0] > 0 ? priceRange[0].toString() : "",
      maxPrice: priceRange[1] < 100000 ? priceRange[1].toString() : "",
    })
  }

  return (
    <div className="space-y-3">
      {/* Top row: Search + Sort + Filter toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search name, card no., SKU..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-10 pr-10 h-9"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(v) => update({ sortBy: v })}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sortOrder">Manual Order</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="price-asc">Price: Low→High</SelectItem>
            <SelectItem value="price-desc">Price: High→Low</SelectItem>
            <SelectItem value="name-asc">Name: A→Z</SelectItem>
            <SelectItem value="stock-asc">Stock: Low→High</SelectItem>
            <SelectItem value="stock-desc">Stock: High→Low</SelectItem>
            <SelectItem value="updatedAt">Last Updated</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter toggle */}
        <Button
          variant={activeCount > 0 ? "default" : "outline"}
          size="sm"
          className="h-9"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs bg-white/20 text-current">
              {activeCount}
            </Badge>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>

        {/* Total count */}
        {totalCount !== undefined && (
          <span className="text-sm text-muted-foreground">
            {totalCount} products
          </span>
        )}

        {/* Clear all */}
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground hover:text-destructive"
            onClick={clearAll}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.game && (
            <Badge
              variant="secondary"
              className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => update({ game: "", cardSet: [], rarity: [] })}
            >
              {games.find((g) => g.code === filters.game)?.label || filters.game}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.productType && (
            <Badge
              variant="secondary"
              className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => update({ productType: "" })}
            >
              {productTypes.find((t) => t.code === filters.productType)?.label || filters.productType}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.cardSet.map((cs) => (
            <Badge
              key={cs}
              variant="secondary"
              className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => toggleArrayFilter("cardSet", cs)}
            >
              {availableSets.find((s) => s.value === cs)?.label || cs}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {filters.rarity.map((r) => (
            <Badge
              key={r}
              variant="secondary"
              className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => toggleArrayFilter("rarity", r)}
            >
              {r}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {filters.condition.map((c) => (
            <Badge
              key={c}
              variant="secondary"
              className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => toggleArrayFilter("condition", c)}
            >
              {conditions.find((co) => co.code === c)?.label || c}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {(filters.minPrice || filters.maxPrice) && (
            <Badge
              variant="secondary"
              className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => {
                setPriceRange([0, 100000])
                update({ minPrice: "", maxPrice: "" })
              }}
            >
              ¥{filters.minPrice || "0"} - ¥{filters.maxPrice || "∞"}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.inStock && (
            <Badge
              variant="secondary"
              className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => update({ inStock: false })}
            >
              In Stock
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.published && (
            <Badge
              variant="secondary"
              className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => update({ published: "" })}
            >
              {filters.published === "true" ? "Published" : "Unpublished"}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Expanded filter panel */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="border rounded-lg p-4 bg-gray-50/50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Card Game */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Card Game
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {games.map((g) => (
                    <Button
                      key={g.code}
                      variant={filters.game === g.code ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        if (filters.game === g.code) {
                          update({ game: "", cardSet: [], rarity: [] })
                        } else {
                          update({ game: g.code, cardSet: [], rarity: [] })
                        }
                      }}
                    >
                      {g.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Product Type */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Product Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {productTypes.map((t) => (
                    <Button
                      key={t.code}
                      variant={filters.productType === t.code ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() =>
                        update({
                          productType: filters.productType === t.code ? "" : t.code,
                        })
                      }
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Published */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Status
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={filters.published === "true" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() =>
                      update({ published: filters.published === "true" ? "" : "true" })
                    }
                  >
                    Published
                  </Button>
                  <Button
                    variant={filters.published === "false" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() =>
                      update({ published: filters.published === "false" ? "" : "false" })
                    }
                  >
                    Unpublished
                  </Button>
                </div>
              </div>

              {/* In Stock */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Availability
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={filters.inStock}
                    onCheckedChange={(checked) =>
                      update({ inStock: checked === true })
                    }
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            {/* Row 2: Card Sets + Rarity + Condition + Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card Sets */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Card Sets
                  {filters.game && (
                    <span className="text-muted-foreground ml-1">
                      ({games.find((g) => g.code === filters.game)?.label})
                    </span>
                  )}
                </label>
                <div className="space-y-1 max-h-36 overflow-y-auto border rounded-md p-2 bg-white">
                  {availableSets.length === 0 && (
                    <span className="text-xs text-muted-foreground">No sets available</span>
                  )}
                  {availableSets.map((set) => (
                    <label
                      key={set.value}
                      className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-primary"
                    >
                      <Checkbox
                        checked={filters.cardSet.includes(set.value)}
                        onCheckedChange={() => toggleArrayFilter("cardSet", set.value)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="truncate">{set.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rarity */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Rarity
                </label>
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto border rounded-md p-2 bg-white">
                  {availableRarities.map((r) => (
                    <Button
                      key={r.code}
                      variant={filters.rarity.includes(r.code) ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => toggleArrayFilter("rarity", r.code)}
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Condition
                </label>
                <div className="space-y-1 border rounded-md p-2 bg-white">
                  {conditions.map((c) => (
                    <label
                      key={c.code}
                      className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-primary"
                    >
                      <Checkbox
                        checked={filters.condition.includes(c.code)}
                        onCheckedChange={() => toggleArrayFilter("condition", c.code)}
                        className="h-3.5 w-3.5"
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Price Range
                </label>
                <div className="border rounded-md p-2 bg-white space-y-2">
                  <Slider
                    value={priceRange}
                    onValueChange={(v) => setPriceRange(v as [number, number])}
                    min={0}
                    max={100000}
                    step={500}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>¥{priceRange[0].toLocaleString()}</span>
                    <span>¥{priceRange[1].toLocaleString()}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-6"
                    onClick={applyPriceRange}
                  >
                    Apply Price
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
