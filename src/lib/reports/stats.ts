// レポート用の集計クエリをまとめる。
// レポートページ (Server Component) と CSV エクスポート API の両方から呼ばれる。
import { prisma } from "@/lib/prisma"

export type PeriodKey = "thisMonth" | "lastMonth" | "last3months" | "last1year" | "custom"

export interface ResolvedPeriod {
  from: Date
  to: Date
  key: PeriodKey
  label: string
}

// URL searchParams から期間を解決する。日付不正時は今月にフォールバック。
export function resolvePeriod(params: { period?: string; from?: string; to?: string }): ResolvedPeriod {
  const now = new Date()
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

  const key = (params.period as PeriodKey) || "thisMonth"

  if (key === "custom" && params.from && params.to) {
    const from = new Date(params.from)
    const to = new Date(params.to)
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999)
      return { from, to, key: "custom", label: `${params.from} 〜 ${params.to}` }
    }
  }

  if (key === "lastMonth") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return {
      from: startOfMonth(lastMonth),
      to: endOfMonth(lastMonth),
      key: "lastMonth",
      label: "先月",
    }
  }

  if (key === "last3months") {
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    return { from, to: endOfMonth(now), key: "last3months", label: "過去 3 ヶ月" }
  }

  if (key === "last1year") {
    const from = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)
    return { from, to: endOfMonth(now), key: "last1year", label: "過去 1 年" }
  }

  return { from: startOfMonth(now), to: endOfMonth(now), key: "thisMonth", label: "今月" }
}

// レポートのリージョン絞り込み。"us" / "eu" を指定するとそのサイトの注文のみ集計。
// undefined なら全リージョン (記録開始前の site=null 注文も含む) を集計する。
export type ReportRegion = "us" | "eu"

// 注文の site フィルタを where 句に展開するヘルパー (undefined なら何も足さない)
const siteWhere = (site?: ReportRegion) => (site ? { site } : {})

// 集計対象は「決済完了 (COMPLETED)」のみ。キャンセル率はキャンセル/全注文で算出。
// NOTE: Order.total は PostgreSQL の money 型で、AVG(money) は未定義 (除算演算子なし)。
//       Prisma の `_avg` を使うと SQL に AVG(money) が発行されて 500 になるため、
//       _sum と _count から JavaScript 側で平均を計算する。
export async function getReportSummary(from: Date, to: Date, site?: ReportRegion) {
  const [completedAgg, allCount, cancelledCount] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: from, lte: to },
        paymentStatus: "COMPLETED",
        ...siteWhere(site),
      },
      _sum: { total: true, subtotal: true, shipping: true },
      _count: { _all: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: from, lte: to }, ...siteWhere(site) },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: from, lte: to },
        OR: [{ status: "CANCELLED" }, { paymentStatus: "CANCELLED" }],
        ...siteWhere(site),
      },
    }),
  ])

  const totalRevenue = Number(completedAgg._sum.total ?? 0)
  const completedOrders = completedAgg._count._all
  const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0
  const cancellationRate = allCount > 0 ? (cancelledCount / allCount) * 100 : 0

  return {
    totalRevenue,
    completedOrders,
    totalOrders: allCount,
    cancelledOrders: cancelledCount,
    avgOrderValue,
    cancellationRate,
  }
}

// 売れ筋 Top 10 (決済完了注文のみ対象)
export async function getTopProducts(from: Date, to: Date, limit = 10, site?: ReportRegion) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        createdAt: { gte: from, lte: to },
        paymentStatus: "COMPLETED",
        ...siteWhere(site),
      },
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: limit,
  })

  const productIds = grouped.map((g) => g.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  return grouped.map((g) => ({
    productId: g.productId,
    name: productMap.get(g.productId)?.name ?? "(deleted)",
    sku: productMap.get(g.productId)?.sku ?? "",
    quantitySold: g._sum.quantity ?? 0,
    revenue: Number(g._sum.total ?? 0),
  }))
}

// 日別売上 (決済完了のみ、from〜to の各日)
export async function getDailyRevenue(from: Date, to: Date, site?: ReportRegion) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      paymentStatus: "COMPLETED",
      ...siteWhere(site),
    },
    select: { createdAt: true, total: true },
    orderBy: { createdAt: "asc" },
  })

  const map = new Map<string, { revenue: number; count: number }>()
  for (const o of orders) {
    const d = o.createdAt
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const cur = map.get(key) ?? { revenue: 0, count: 0 }
    cur.revenue += Number(o.total)
    cur.count += 1
    map.set(key, cur)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, revenue: v.revenue, orderCount: v.count }))
}
