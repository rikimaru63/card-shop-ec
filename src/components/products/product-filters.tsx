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
  category?: string // "pokemon-cards" | "onepiece-cards" | undefined
}

// ポケモンカードのレアリティ
const pokemonRarities = [
  { id: "MUR", label: "MUR" },
  { id: "SAR", label: "SAR" },
  { id: "SR", label: "SR" },
  { id: "AR", label: "AR" },
  { id: "RR", label: "RR" },
  { id: "R", label: "R" },
  { id: "MA", label: "MA" },
  { id: "BWR", label: "BWR" },
  { id: "UR", label: "UR" },
  { id: "ACE", label: "ACE" },
  { id: "RRR", label: "RRR" },
  { id: "CSR", label: "CSR" },
  { id: "CHR", label: "CHR" },
  { id: "HR", label: "HR" },
  { id: "SSR", label: "SSR" },
  { id: "S", label: "S" },
  { id: "K", label: "K" },
  { id: "A", label: "A" },
  { id: "PR", label: "PR" },
]

// ワンピースカードのレアリティ
const onepieceRarities = [
  { id: "SEC", label: "SEC" },
  { id: "SR", label: "SR" },
  { id: "R", label: "R" },
  { id: "L", label: "L" },
]

// 全レアリティ（カテゴリ未選択時）
const allRarities = [...pokemonRarities, ...onepieceRarities.filter(r => r.id !== "SR" && r.id !== "R")]

// Conditions matching database values (GRADE_A, GRADE_B, GRADE_C, PSA, SEALED)
const conditions = [
  { id: "SEALED", label: "Sealed / New", description: "Factory sealed, brand new" },
  { id: "GRADE_A", label: "Grade A - Excellent", description: "Near mint condition" },
  { id: "GRADE_B", label: "Grade B - Good", description: "Light wear, good condition" },
  { id: "GRADE_C", label: "Grade C - Played", description: "Visible wear or damage" },
  { id: "PSA", label: "PSA Graded", description: "Professionally graded cards" },
]

const priceRanges = [
  { id: "0-3000", label: "Under ¥3,000", min: 0, max: 3000 },
  { id: "3000-5000", label: "¥3,000 - ¥5,000", min: 3000, max: 5000 },
  { id: "5000-10000", label: "¥5,000 - ¥10,000", min: 5000, max: 10000 },
  { id: "10000-30000", label: "¥10,000 - ¥30,000", min: 10000, max: 30000 },
  { id: "30000-50000", label: "¥30,000 - ¥50,000", min: 30000, max: 50000 },
  { id: "50000-100000", label: "¥50,000 - ¥100,000", min: 50000, max: 100000 },
  { id: "100000+", label: "¥100,000+", min: 100000, max: 10000000 }
]

export function ProductFilters({ filters, onFiltersChange, category }: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    price: true,
    rarity: true,
    condition: true,
    availability: true
  })

  // カテゴリに応じてレアリティを取得
  const getCurrentRarities = () => {
    if (category === "onepiece-cards") return onepieceRarities
    if (category === "pokemon-cards") return pokemonRarities
    return allRarities
  }

  const rarities = getCurrentRarities()

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
      priceRange: [0, 10000000],
      rarities: [],
      conditions: [],
      inStock: false
    })
  }

  const activeFiltersCount =
    filters.rarities.length +
    filters.conditions.length +
    (filters.inStock ? 1 : 0) +
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000000 ? 1 : 0)

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
            {filters.rarities.map(rarity => (
              <Badge
                key={rarity}
                variant="secondary"
                className="pl-2 pr-1 py-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => handleRarityChange(rarity, false)}
              >
                {rarity}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {filters.conditions.map(conditionId => {
              const condition = conditions.find(c => c.id === conditionId)
              return (
                <Badge
                  key={conditionId}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleConditionChange(conditionId, false)}
                >
                  {condition?.label || conditionId}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )
            })}
            {(filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000000) && (
              <Badge
                variant="secondary"
                className="pl-2 pr-1 py-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => handlePriceRangeChange([0, 10000000])}
              >
                ¥{filters.priceRange[0].toLocaleString()} - ¥{filters.priceRange[1].toLocaleString()}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {filters.inStock && (
              <Badge
                variant="secondary"
                className="pl-2 pr-1 py-1 cursor-pointer hover:bg-secondary/80"
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
      <div className="space-y-6">
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
                max={100000}
                min={0}
                step={1000}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm">
                <div className="px-3 py-1 bg-secondary rounded">
                  ¥{filters.priceRange[0].toLocaleString()}
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="px-3 py-1 bg-secondary rounded">
                  {filters.priceRange[1] >= 100000 ? '¥100,000+' : `¥${filters.priceRange[1].toLocaleString()}`}
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
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {rarities.map(rarity => {
                const isChecked = filters.rarities.includes(rarity.id)

                return (
                  <div key={rarity.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rarity-${rarity.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleRarityChange(rarity.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`rarity-${rarity.id}`}
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
                const isChecked = filters.conditions.includes(condition.id)

                return (
                  <div key={condition.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={condition.id}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleConditionChange(condition.id, checked as boolean)
                      }
                      className="mt-0.5"
                    />
                    <div className="flex flex-col">
                      <Label
                        htmlFor={condition.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {condition.label}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {condition.description}
                      </span>
                    </div>
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