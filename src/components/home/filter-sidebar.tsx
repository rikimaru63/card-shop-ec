"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"

export function FilterSidebar() {
  const [priceRange, setPriceRange] = useState([0, 50000])

  const sets = [
    "Scarlet ex", "Violet ex", "Pokemon 151",
    "Clay Burst", "Snow Hazard", "Triplet Beat",
    "Paradigm Trigger", "Incandescent Arcana", "Lost Abyss"
  ]

  const rarities = [
    "SAR", "UR", "SR", "RRR", "RR", "AR", "CHR", "Radiant"
  ]

  const conditions = [
    "Mint", "Near Mint", "Lightly Played", "Moderately Played"
  ]

  return (
    <div className="bg-white rounded-lg border p-4 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" className="text-xs">
          Clear
        </Button>
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <h3 className="font-medium text-sm mb-3">Price Range</h3>
          <div className="space-y-3">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={50000}
              step={100}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <span>¥{priceRange[0].toLocaleString()}</span>
              <span>¥{priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Sets */}
        <div>
          <h3 className="font-medium text-sm mb-3">Card Sets</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sets.map((set) => (
              <label key={set} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox id={set} />
                <span>{set}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rarity */}
        <div>
          <h3 className="font-medium text-sm mb-3">Rarity</h3>
          <div className="flex flex-wrap gap-2">
            {rarities.map((rarity) => (
              <Button
                key={rarity}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {rarity}
              </Button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <h3 className="font-medium text-sm mb-3">Condition</h3>
          <div className="space-y-2">
            {conditions.map((condition) => (
              <label key={condition} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox id={condition} />
                <span>{condition}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Other Filters */}
        <div>
          <h3 className="font-medium text-sm mb-3">Other</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox id="foil" />
              <span>Holo Only</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox id="graded" />
              <span>Graded Only</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox id="first-edition" />
              <span>1st Edition Only</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox id="in-stock" />
              <span>In Stock Only</span>
            </label>
          </div>
        </div>

        <Button className="w-full">
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
