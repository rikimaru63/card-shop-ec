import { NextRequest, NextResponse } from "next/server"
import { getReportSummary, getTopProducts, getDailyRevenue, resolvePeriod } from "@/lib/reports/stats"
import { rowsToCsv, csvResponseHeaders, formatDateKey } from "@/lib/reports/csv"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const period = resolvePeriod({
    period: sp.get("period") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
  })

  const [summary, topProducts, daily] = await Promise.all([
    getReportSummary(period.from, period.to),
    getTopProducts(period.from, period.to, 50),
    getDailyRevenue(period.from, period.to),
  ])

  // 3 セクション (集計サマリ / 売れ筋 / 日別売上) を 1 ファイルにまとめる
  const lines: string[] = []
  lines.push(
    rowsToCsv(
      ["セクション", "期間ラベル", "開始日", "終了日"],
      [["集計サマリ", period.label, formatDateKey(period.from), formatDateKey(period.to)]]
    )
  )
  lines.push("")
  lines.push(
    rowsToCsv(
      ["項目", "値"],
      [
        ["総売上 (決済完了)", summary.totalRevenue],
        ["決済完了注文数", summary.completedOrders],
        ["総注文数", summary.totalOrders],
        ["キャンセル注文数", summary.cancelledOrders],
        ["平均注文単価", Math.round(summary.avgOrderValue)],
        ["キャンセル率 (%)", summary.cancellationRate.toFixed(2)],
      ]
    )
  )
  lines.push("")
  lines.push("# 売れ筋商品 Top 50")
  lines.push(
    rowsToCsv(
      ["順位", "商品名", "SKU", "販売数", "売上"],
      topProducts.map((p, i) => [i + 1, p.name, p.sku, p.quantitySold, p.revenue])
    )
  )
  lines.push("")
  lines.push("# 日別売上")
  lines.push(
    rowsToCsv(
      ["日付", "注文数", "売上"],
      daily.map((d) => [d.date, d.orderCount, d.revenue])
    )
  )

  const filename = `report_${formatDateKey(period.from)}_${formatDateKey(period.to)}.csv`
  return new NextResponse(lines.join("\r\n"), {
    status: 200,
    headers: csvResponseHeaders(filename),
  })
}
