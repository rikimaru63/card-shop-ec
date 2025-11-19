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

interface Filters {
  categories: string[]
  priceRange: number[]
  rarities: string[]
  conditions: string[]
  inStock: boolean
}

interface ProductFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

const categories = [
  { id: "pokemon", label: "Pokemon", count: 1245 },
  { id: "yugioh", label: "Yu-Gi-Oh!", count: 892 },
  { id: "mtg", label: "Magic: The Gathering", count: 2341 },
  { id: "onepiece", label: "One Piece", count: 456 },
  { id: "sports", label: "Sports Cards", count: 678 },
  { id: "digimon", label: "Digimon", count: 234 },
  { id: "cardfight", label: "Cardfight!! Vanguard", count: 123 },
  { id: "weiss", label: "Weiss Schwarz", count: 89 }
]

const rarities = [
  { id: "common", label: "Common" },
  { id: "uncommon", label: "Uncommon" },
  { id: "rare", label: "Rare" },
  { id: "super-rare", label: "Super Rare" },
  { id: "ultra-rare", label: "Ultra Rare" },
  { id: "secret-rare", label: "Secret Rare" },
  { id: "mythic-rare", label: "Mythic Rare" },
  { id: "leader", label: "Leader" },
  { id: "rookie", label: "Rookie" }
]

const conditions = [
  { id: "mint", label: "Mint (M)" },
  { id: "near-mint", label: "Near Mint (NM)" },
  { id: "lightly-played", label: "Lightly Played (LP)" },
  { id: "moderately-played", label: "Moderately Played (MP)" },
  { id: "heavily-played", label: "Heavily Played (HP)" },
  { id: "damaged", label: "Damaged (D)" },
  { id: "psa-10", label: "PSA 10" },
  { id: "psa-9", label: "PSA 9" },
  { id: "psa-8", label: "PSA 8" },
  { id: "bgs-10", label: "BGS 10" },
  { id: "bgs-9.5", label: "BGS 9.5" }
]

const priceRanges = [
  { id: "0-25", label: "Under $25", min: 0, max: 25 },
  { id: "25-50", label: "$25 - $50", min: 25, max: 50 },
  { id: "50-100", label: "$50 - $100", min: 50, max: 100 },
  { id: "100-250", label: "$100 - $250", min: 100, max: 250 },
  { id: "250-500", label: "$250 - $500", min: 250, max: 500 },
  { id: "500-1000", label: "$500 - $1000", min: 500, max: 1000 },
  { id: "1000+", label: "Over $1000", min: 1000, max: 100000 }
]

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    rarity: true,
    condition: false,
    availability: false
  })

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const label = categories.find(c => c.id === categoryId)?.label || categoryId
    if (checked) {
      onFiltersChange({
        ...filters,
        categories: [...filters.categories, label]
      })
    } else {
      onFiltersChange({
        ...filters,
        categories: filters.categories.filter(c => c !== label)
      })
    }
  }

  const handleRarityChange = (rarityId: string, checked: boolean) => {
    const label = rarities.find(r => r.id === rarityId)?.label || rarityId
    const formattedLabel = label.replace("-", " ").split(" ").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ")
    
    if (checked) {
      onFiltersChange({
        ...filters,
        rarities: [...filters.rarities, formattedLabel]
      })
    } else {
      onFiltersChange({
        ...filters,
        rarities: filters.rarities.filter(r => r !== formattedLabel)
      })
    }
  }

  const handleConditionChange = (conditionId: string, checked: boolean) => {
    const condition = conditions.find(c => c.id === conditionId)
    if (!condition) return
    
    // Extract just the condition name without the abbreviation
    const label = condition.label.split(" (")[0]
    
    if (checked) {
      onFiltersChange({
        ...filters,
        conditions: [...filters.conditions, label]
      })
    } else {
      onFiltersChange({
        ...filters,
        conditions: filters.conditions.filter(c => c !== label)
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
      priceRange: [0, 100000],
      rarities: [],
      conditions: [],
      inStock: false
    })
  }

  const activeFiltersCount = 
    filters.categories.length + 
    filters.rarities.length + 
    filters.conditions.length + 
    (filters.inStock ? 1 : 0) +
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 100000 ? 1 : 0)

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Filters</h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.categories.map(category => (
              <Badge
                key={category}
                variant="secondary"
                className="pl-2 pr-1 py-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => handleCategoryChange(
                  categories.find(c => c.label === category)?.id || "",
                  false
                )}
              >
                {category}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {filters.rarities.map(rarity => (
              <Badge
                key={rarity}
                variant="secondary"
                className="pl-2 pr-1 py-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  const rarityId = rarities.find(r => 
                    r.label.replace("-", " ").split(" ").map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(" ") === rarity
                  )?.id || ""
                  handleRarityChange(rarityId, false)
                }}
              >
                {rarity}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {(filters.priceRange[0] !== 0 || filters.priceRange[1] !== 100000) && (
              <Badge
                variant="secondary"
                className="pl-2 pr-1 py-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => handlePriceRangeChange([0, 100000])}
              >
                ${filters.priceRange[0]} - ${filters.priceRange[1]}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-6">
        {/* Category Filter */}
        <Collapsible
          open={openSections.category}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, category: open }))}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h4 className="font-semibold">Category</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.category ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-3">
              {categories.map(category => {
                const isChecked = filters.categories.includes(category.label)
                return (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={category.id}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={category.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {category.label}
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({category.count})
                    </span>
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
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h4 className="font-semibold">Price Range</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.price ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-4">
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceRangeChange}
                max={5000}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm">
                <div className="px-3 py-1 bg-secondary rounded">
                  ${filters.priceRange[0]}
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="px-3 py-1 bg-secondary rounded">
                  ${filters.priceRange[1]}+
                </div>
              </div>
              <div className="space-y-2 pt-2">
                {priceRanges.map(range => (
                  <Button
                    key={range.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => handlePriceRangeChange([range.min, range.max])}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Rarity Filter */}
        <Collapsible
          open={openSections.rarity}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, rarity: open }))}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h4 className="font-semibold">Rarity</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.rarity ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-3">
              {rarities.map(rarity => {
                const formattedLabel = rarity.label.replace("-", " ").split(" ").map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(" ")
                const isChecked = filters.rarities.includes(formattedLabel)
                
                return (
                  <div key={rarity.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={rarity.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => 
                        handleRarityChange(rarity.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={rarity.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {rarity.label}
                    </Label>
                  </div>
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
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h4 className="font-semibold">Condition</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.condition ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-3">
              {conditions.map(condition => {
                const label = condition.label.split(" (")[0]
                const isChecked = filters.conditions.includes(label)
                
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
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h4 className="font-semibold">Availability</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.availability ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
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