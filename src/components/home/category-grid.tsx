import Link from "next/link"
import { ArrowRight } from "lucide-react"

const categories = [
  {
    name: "All Pokemon Cards",
    description: "Browse our full collection",
    image: "⚡",
    color: "from-yellow-400 to-red-500",
    href: "/products",
    count: "1,000+ Cards"
  },
  {
    name: "Scarlet & Violet",
    description: "Latest expansion series",
    image: "🔴",
    color: "from-red-500 to-violet-600",
    href: "/products?set=scarlet-violet",
    count: "New Arrivals"
  },
  {
    name: "Graded Cards",
    description: "PSA, BGS, CGC certified",
    image: "💎",
    color: "from-gray-600 to-gray-800",
    href: "/products?graded=true",
    count: "Premium Quality"
  }
]

export function CategoryGrid() {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        {/* セクションヘッダー */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore our extensive collection of trading cards from your favorite games
          </p>
        </div>

        {/* カテゴリーグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group relative overflow-hidden rounded-2xl bg-white border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-6">
                {/* アイコンとグラデーション背景 */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${category.color} opacity-10 rounded-bl-full`} />
                
                <div className="relative z-10">
                  {/* アイコン */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${category.color} mb-4`}>
                    <span className="text-3xl">{category.image}</span>
                  </div>

                  {/* コンテンツ */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">
                      {category.count}
                    </span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTAボタン */}
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}