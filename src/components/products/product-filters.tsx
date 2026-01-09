"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import {
  CARD_GAMES,
  PRODUCT_TYPES,
  CONDITIONS,
  PRICE_RANGES,
  MAX_PRICE_LIMIT,
  getRaritiesByGame,
} from "@/lib/filter-config"

interface Filters {
  categories: string[]
  priceRange: number[]
  rarities: string[]
  conditions: string[]
  productTypes: string[]
  inStock: boolean
}

interface ProductFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  category?: string // "pokemon-cards" | "onepiece-cards" | undefined
}

// Map CARD_GAMES to use categorySlug as id for this component
const cardGames = CARD_GAMES.map(g => ({ id: g.categorySlug, label: g.label }))

export function ProductFilters({ filters, onFiltersChange, category }: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    cardGame: true,
    productType: true,
    price: true,
    rarity: true,
    condition: true,
    availability: true
  })

  // Get rarities based on category
  const rarities = getRaritiesByGame(category)

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({
        ...filters,
        categories: [...filters.categories, categoryId]
      })
    } else {
      onFiltersChange({
        ...filters,
        categories: filters.categories.filter(c => c !== categoryId)
      })
    }
  }

  const handleProductTypeChange = (typeId: string, checked: boolean) => {
    const newTypes = filters.productTypes || []
    if (checked) {
      onFiltersChange({
        ...filters,
        productTypes: [...newTypes, typeId]
      })
    } else {
      onFiltersChange({
        ...filters,
        productTypes: newTypes.filter(t => t !== typeId)
      })
    }
  }

  const handleRarityChange = (rarityId: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({
        ...filters,
        rarities: [...filters.rarities, rarityId]
      })
    } else {
      onFiltersChange({
        ...filters,
        rarities: filters.rarities.filter(r => r !== rarityId)
      })
    }
  }

  const handleConditionChange = (conditionId: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({
        ...filters,
        conditions: [...filters.conditions, conditionId]
      })
    } else {
      onFiltersChange({
        ...filters,
        conditions: filters.conditions.filter(c => c !== conditionId)
      })
    }
  }

  const handlePriceRangeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: value
    })
  }

  const handleClearAll = () => {
    onFiltersChange({
      categories: [],
      priceRange: [0, MAX_PRICE_LIMIT],
      rarities: [],
      conditions: [],
      productTypes: [],
      inStock: false
    })
  }

  const activeFiltersCount =
    filters.categories.length +
    filters.rarities.length +
    filters.conditions.length +
    (filters.productTypes?.length || 0) +
    (filters.inStock ? 1 : 0) +
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== MAX_PRICE_LIMIT ? 1 : 0)

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <h3 className="font-semibold text-lg">Filters</h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground h-8 px-2"
          >
            Clear all ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="mb-4 pb-4 border-b">
          <div className="flex flex-wrap gap-1.5">
            {filters.categories.map(catId => {
              const cat = cardGames.find(c => c.id === catId)
              return (
                <Badge
                  key={catId}
                  variant="secondary"
                  className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleCategoryChange(catId, false)}
                >
                  {cat?.label || catId}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )
            })}
            {(filters.productTypes || []).map(typeId => {
              const type = PRODUCT_TYPES.find(t => t.id === typeId)
              return (
                <Badge
                  key={typeId}
                  variant="secondary"
                  className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleProductTypeChange(typeId, false)}
                >
                  {type?.label || typeId}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )
            })}
            {filters.rarities.map(rarity => (
              <Badge
                key={rarity}
                variant="secondary"
                className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
                onClick={() => handleRarityChange(rarity, false)}
              >
                {rarity}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {filters.conditions.map(conditionId => {
              const condition = CONDITIONS.find(c => c.id === conditionId)
              return (
                <Badge
                  key={conditionId}
                  variant="secondary"
                  className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleConditionChange(conditionId, false)}
                >
                  {condition?.label || conditionId}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )
            })}
            {(filters.priceRange[0] !== 0 || filters.priceRange[1] !== MAX_PRICE_LIMIT) && (
              <Badge
                variant="secondary"
                className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
                onClick={() => handlePriceRangeChange([0, MAX_PRICE_LIMIT])}
              >
                ¥{filters.priceRange[0].toLocaleString()} - ¥{filters.priceRange[1].toLocaleString()}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {filters.inStock && (
              <Badge
                variant="secondary"
                className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
                onClick={() => onFiltersChange({ ...filters, inStock: false })}
              >
                In Stock
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-4">
        {/* Card Game Filter - Only show if no category is pre-selected */}
        {!category && (
          <Collapsible
            open={openSections.cardGame}
            onOpenChange={(open) => setOpenSections(prev => ({ ...prev, cardGame: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
              <h4 className="font-medium text-sm">Card Game</h4>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.cardGame ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2">
                {cardGames.map(game => {
                  const isChecked = filters.categories.includes(game.id)
                  return (
                    <div key={game.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`game-${game.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleCategoryChange(game.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`game-${game.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {game.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Product Type Filter */}
        <Collapsible
          open={openSections.productType}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, productType: open }))}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
            <h4 className="font-medium text-sm">Product Type</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.productType ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-2">
              {PRODUCT_TYPES.map(type => {
                const isChecked = (filters.productTypes || []).includes(type.id)
                return (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleProductTypeChange(type.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`type-${type.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {type.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Price Range Filter */}
        <Collapsible
          open={openSections.price}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, price: open }))}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
            <h4 className="font-medium text-sm">Price Range</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.price ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-3">
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceRangeChange}
                max={100000}
                min={0}
                step={1000}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs">
                <div className="px-2 py-1 bg-secondary rounded">
                  ¥{filters.priceRange[0].toLocaleString()}
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="px-2 py-1 bg-secondary rounded">
                  {filters.priceRange[1] >= 100000 ? '¥100,000+' : `¥${filters.priceRange[1].toLocaleString()}`}
                </div>
              </div>
              <div className="space-y-1">
                {PRICE_RANGES.map(range => (
                  <Button
                    key={range.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7 px-2"
                    onClick={() => handlePriceRangeChange([range.min, range.max])}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Rarity Filter - Chip/Badge Style */}
        <Collapsible
          open={openSections.rarity}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, rarity: open }))}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
            <h4 className="font-medium text-sm">Rarity</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.rarity ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="flex flex-wrap gap-2">
              {rarities.map(rarity => {
                const isSelected = filters.rarities.includes(rarity.id)
                return (
                  <button
                    key={rarity.id}
                    onClick={() => handleRarityChange(rarity.id, !isSelected)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-secondary border-input"
                    }`}
                  >
                    {rarity.label}
                  </button>
                )
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Condition Filter */}
        <Collapsible
          open={openSections.condition}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, condition: open }))}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
            <h4 className="font-medium text-sm">Condition</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.condition ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-2">
              {CONDITIONS.map(condition => {
                const isChecked = filters.conditions.includes(condition.id)
                return (
                  <div key={condition.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={condition.id}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleConditionChange(condition.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={condition.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {condition.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Availability Filter */}
        <Collapsible
          open={openSections.availability}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, availability: open }))}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
            <h4 className="font-medium text-sm">Availability</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.availability ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={filters.inStock}
                onCheckedChange={(checked) =>
                  onFiltersChange({
                    ...filters,
                    inStock: checked as boolean
                  })
                }
              />
              <Label
                htmlFor="in-stock"
                className="text-sm font-normal cursor-pointer"
              >
                In Stock Only
              </Label>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
