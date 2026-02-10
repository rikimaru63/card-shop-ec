import { prisma } from "@/lib/prisma"
import { Eye } from "lucide-react"

type Period = "today" | "week" | "month"

async function getProductRanking(period: Period, limit = 10) {
  const now = new Date()
  let since: Date

  switch (period) {
    case "today":
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case "week":
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
      break
    case "month":
      since = new Date(now.getFullYear(), now.getMonth(), 1)
      break
  }

  // Get page views for product pages grouped by path
  const results = await prisma.pageView.groupBy({
    by: ["path"],
    where: {
      createdAt: { gte: since },
      path: { startsWith: "/products/" },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  })

  // Extract slugs and fetch product names
  const slugs = results.map((r) => {
    const parts = r.path.split("/")
    return parts[parts.length - 1]
  })

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, name: true, id: true },
  })

  const productMap = new Map(products.map((p) => [p.slug, p]))

  return results.map((r) => {
    const slug = r.path.split("/").pop() || ""
    const product = productMap.get(slug)
    return {
      path: r.path,
      name: product?.name || slug,
      views: r._count.id,
    }
  })
}

export async function AccessRanking() {
  const [todayRanking, weekRanking, monthRanking] = await Promise.all([
    getProductRanking("today"),
    getProductRanking("week"),
    getProductRanking("month"),
  ])

  return (
    <div className="mt-8 bg-white rounded-lg border">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">商品アクセスランキング</h2>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RankingColumn title="今日" data={todayRanking} />
          <RankingColumn title="今週" data={weekRanking} />
          <RankingColumn title="今月" data={monthRanking} />
        </div>
      </div>
    </div>
  )
}

function RankingColumn({
  title,
  data,
}: {
  title: string
  data: { name: string; views: number; path: string }[]
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">データなし</p>
      ) : (
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={item.path} className="flex items-center gap-3">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0
                    ? "bg-yellow-100 text-yellow-800"
                    : i === 1
                    ? "bg-gray-100 text-gray-800"
                    : i === 2
                    ? "bg-orange-100 text-orange-800"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                {i + 1}
              </span>
              <span className="text-sm flex-1 truncate">{item.name}</span>
              <span className="text-sm font-medium text-muted-foreground">
                {item.views.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
