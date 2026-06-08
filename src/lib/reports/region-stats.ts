// リージョン (US/EU) 別 + 流入国別の集計クエリ。
// レポートページ (Server Component) と CSV エクスポート API の両方から呼ばれる。
//
// 重要 (money 型の地雷):
//   Order.total は PostgreSQL の money 型。AVG(money) は未定義のため Prisma の `_avg` は
//   500 を起こす。客単価は必ず _sum / _count から JavaScript 側で計算する。
import { prisma } from "@/lib/prisma"
import { normalizeCountryCode, countryDisplayName } from "./countries"

export type RegionKey = "us" | "eu"

const REGION_LABELS: Record<RegionKey, string> = {
  us: "アメリカ (US)",
  eu: "ヨーロッパ (EU)",
}

export interface RegionSummaryRow {
  region: RegionKey
  label: string
  visits: number // ページ表示回数 (PageView 件数)
  uniqueVisitors: number // ユニーク訪問者数 (ipHash の異なり数)
  orders: number // 決済完了注文数
  revenue: number // 決済完了売上
  avgOrderValue: number // 客単価 (revenue / orders)
}

// US / EU を左右に並べて比較するためのサマリ。
// 注文は site が明示記録されたもののみ集計対象 (記録開始前の null 注文は両リージョンに含めない)。
export async function getRegionSummary(from: Date, to: Date): Promise<RegionSummaryRow[]> {
  const regions: RegionKey[] = ["us", "eu"]

  const [visitGroups, uniqGroups, orderGroups] = await Promise.all([
    // 訪問数 (site 別)
    prisma.pageView.groupBy({
      by: ["site"],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    // ユニーク訪問者 = (site, ipHash) の組み合わせ数。ipHash が null の行は除外。
    prisma.pageView.groupBy({
      by: ["site", "ipHash"],
      where: { createdAt: { gte: from, lte: to }, ipHash: { not: null } },
    }),
    // 注文集計 (site 別, 決済完了のみ)
    prisma.order.groupBy({
      by: ["site"],
      where: { createdAt: { gte: from, lte: to }, paymentStatus: "COMPLETED" },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ])

  const visitMap = new Map(visitGroups.map((g) => [g.site, g._count._all]))

  const uniqMap = new Map<string, number>()
  for (const g of uniqGroups) {
    uniqMap.set(g.site, (uniqMap.get(g.site) ?? 0) + 1)
  }

  const orderMap = new Map(
    orderGroups.map((g) => [g.site, { revenue: Number(g._sum.total ?? 0), count: g._count._all }])
  )

  return regions.map((region) => {
    const order = orderMap.get(region) ?? { revenue: 0, count: 0 }
    return {
      region,
      label: REGION_LABELS[region],
      visits: visitMap.get(region) ?? 0,
      uniqueVisitors: uniqMap.get(region) ?? 0,
      orders: order.count,
      revenue: order.revenue,
      avgOrderValue: order.count > 0 ? order.revenue / order.count : 0,
    }
  })
}

export interface CountryRow {
  code: string | null // 国コード (ISO alpha-2)。null = 不明。
  name: string // 日本語表示名
  visits: number // 国別リーチ数 (PageView.country)
  orders: number // 決済完了注文数
  revenue: number // 売上
  avgOrderValue: number // 客単価
}

// 流入国別の内訳。
// - 注文系 (orders/revenue/avgOrderValue): Order.shippingAddress JSON の country から JS 集計。
// - リーチ数 (visits): PageView.country から集計 (記録開始前は 0 のまま)。
// site を指定するとそのリージョンに絞り込む (未指定なら全体)。
export async function getCountryBreakdown(
  from: Date,
  to: Date,
  site?: RegionKey
): Promise<CountryRow[]> {
  const [orders, visitGroups] = await Promise.all([
    // 国は shippingAddress JSON 内のため groupBy 不可 → 必要最小フィールドを取得し JS 集計
    prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        paymentStatus: "COMPLETED",
        ...(site ? { site } : {}),
      },
      select: { shippingAddress: true, total: true },
    }),
    prisma.pageView.groupBy({
      by: ["country"],
      where: {
        createdAt: { gte: from, lte: to },
        country: { not: null },
        ...(site ? { site } : {}),
      },
      _count: { _all: true },
    }),
  ])

  const UNKNOWN_KEY = "__unknown__"
  const map = new Map<string, { code: string | null; visits: number; orders: number; revenue: number }>()
  const ensure = (code: string | null) => {
    const key = code ?? UNKNOWN_KEY
    let cur = map.get(key)
    if (!cur) {
      cur = { code, visits: 0, orders: 0, revenue: 0 }
      map.set(key, cur)
    }
    return cur
  }

  for (const o of orders) {
    const addr = o.shippingAddress as { country?: unknown } | null
    const code = normalizeCountryCode(addr?.country)
    const row = ensure(code)
    row.orders += 1
    row.revenue += Number(o.total ?? 0)
  }

  for (const g of visitGroups) {
    const code = normalizeCountryCode(g.country)
    const row = ensure(code)
    row.visits += g._count._all
  }

  return Array.from(map.values())
    .map((r) => ({
      code: r.code,
      name: countryDisplayName(r.code),
      visits: r.visits,
      orders: r.orders,
      revenue: r.revenue,
      avgOrderValue: r.orders > 0 ? r.revenue / r.orders : 0,
    }))
    .sort((a, b) => {
      // 不明 (code === null) は常に末尾
      if (a.code === null && b.code !== null) return 1
      if (b.code === null && a.code !== null) return -1
      // 売上 → 注文数 → リーチ数 の順で降順
      if (b.revenue !== a.revenue) return b.revenue - a.revenue
      if (b.orders !== a.orders) return b.orders - a.orders
      return b.visits - a.visits
    })
}
