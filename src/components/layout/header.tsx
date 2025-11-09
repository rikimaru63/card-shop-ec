"use client"

import Link from "next/link"
import { useState } from "react"
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  X, 
  ChevronDown,
  User,
  Heart
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const categories = [
  {
    name: "Pokemon",
    href: "/products/pokemon",
    subcategories: [
      { name: "Booster Boxes", href: "/products/pokemon/booster-boxes" },
      { name: "Single Cards", href: "/products/pokemon/singles" },
      { name: "Graded Cards", href: "/products/pokemon/graded" },
      { name: "Japanese Cards", href: "/products/pokemon/japanese" },
    ]
  },
  {
    name: "Yu-Gi-Oh!",
    href: "/products/yugioh",
    subcategories: [
      { name: "Booster Boxes", href: "/products/yugioh/booster-boxes" },
      { name: "Single Cards", href: "/products/yugioh/singles" },
      { name: "Structure Decks", href: "/products/yugioh/structure-decks" },
    ]
  },
  {
    name: "Magic: The Gathering",
    href: "/products/mtg",
    subcategories: [
      { name: "Booster Boxes", href: "/products/mtg/booster-boxes" },
      { name: "Single Cards", href: "/products/mtg/singles" },
      { name: "Commander Decks", href: "/products/mtg/commander" },
    ]
  },
  {
    name: "One Piece",
    href: "/products/onepiece",
    subcategories: [
      { name: "Booster Boxes", href: "/products/onepiece/booster-boxes" },
      { name: "Starter Decks", href: "/products/onepiece/starter-decks" },
    ]
  },
  {
    name: "Sports Cards",
    href: "/products/sports",
    subcategories: [
      { name: "Basketball", href: "/products/sports/basketball" },
      { name: "Baseball", href: "/products/sports/baseball" },
      { name: "Football", href: "/products/sports/football" },
    ]
  }
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [cartCount] = useState(0) // TODO: カート状態管理と連携

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b">
      {/* 上部バー - プロモーションメッセージ */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
        <p>Free Shipping on Orders Over $100 | Worldwide Delivery</p>
      </div>

      {/* メインヘッダー */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">CardShop</span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden lg:flex items-center space-x-1">
            {categories.map((category) => (
              <div
                key={category.name}
                className="relative"
                onMouseEnter={() => setActiveCategory(category.name)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  href={category.href}
                  className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1"
                >
                  {category.name}
                  <ChevronDown className="h-3 w-3" />
                </Link>
                
                {/* ドロップダウンメニュー */}
                {activeCategory === category.name && (
                  <div className="absolute top-full left-0 w-56 bg-white rounded-lg shadow-lg border mt-1 py-2">
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className="block px-4 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-primary transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* 検索バー */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search cards, sets, or products..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* 右側のアクション */}
          <div className="flex items-center space-x-2">
            {/* モバイル検索トグル */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* ウィッシュリスト */}
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
            </Button>

            {/* アカウント */}
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>

            {/* カート */}
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>

            {/* モバイルメニュー */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* モバイル検索バー */}
        {isSearchOpen && (
          <div className="md:hidden py-3 border-t">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4">
            {categories.map((category) => (
              <div key={category.name} className="py-2">
                <Link
                  href={category.href}
                  className="font-medium text-foreground/80 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}