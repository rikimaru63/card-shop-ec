import Link from "next/link"
import { ArrowLeft, Download, ShoppingCart, TrendingUp, XCircle, JapaneseYen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getReportSummary, getTopProducts, getDailyRevenue, resolvePeriod } from "@/lib/reports/stats"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: { period?: string; from?: string; to?: string }
}

const PERIOD_OPTIONS: { key: string; label: string }[] = [
  { key: "thisMonth", label: "今月" },
  { key: "lastMonth", label: "先月" },
  { key: "last3months", label: "過去 3 ヶ月" },
  { key: "last1year", label: "過去 1 年" },
]

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: typeof JapaneseYen
  iconBg: string
  iconColor: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const period = resolvePeriod(searchParams)

  const [summary, topProducts, daily] = await Promise.all([
    getReportSummary(period.from, period.to),
    getTopProducts(period.from, period.to, 10),
    getDailyRevenue(period.from, period.to),
  ])

  const exportQuery = new URLSearchParams({
    period: period.key,
    from: period.from.toISOString().slice(0, 10),
    to: period.to.toISOString().slice(0, 10),
  }).toString()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  ダッシュボードに戻る
                </Button>
              </Link>
            </div>
            <Link href={`/api/admin/reports/export?${exportQuery}`}>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                CSV ダウンロード
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold">売上レポート</h1>
          <p className="text-sm text-muted-foreground">期間: {period.label}</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 期間選択 */}
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm font-semibold mb-3">期間を選択</p>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <Link key={opt.key} href={`/admin/reports?period=${opt.key}`}>
                <Button
                  variant={period.key === opt.key ? "default" : "outline"}
                  size="sm"
                >
                  {opt.label}
                </Button>
              </Link>
            ))}
          </div>
          {/* カスタム期間 */}
          <form action="/admin/reports" method="get" className="mt-4 flex flex-wrap items-end gap-2">
            <input type="hidden" name="period" value="custom" />
            <div>
              <label className="block text-xs text-muted-foreground mb-1">開始日</label>
              <input
                type="date"
                name="from"
                defaultValue={period.from.toISOString().slice(0, 10)}
                className="border rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">終了日</label>
              <input
                type="date"
                name="to"
                defaultValue={period.to.toISOString().slice(0, 10)}
                className="border rounded px-3 py-1.5 text-sm"
              />
            </div>
            <Button type="submit" variant={period.key === "custom" ? "default" : "outline"} size="sm">
              カスタム期間で表示
            </Button>
          </form>
        </div>

        {/* 集計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={JapaneseYen}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            label="総売上 (決済完了分)"
            value={`¥${summary.totalRevenue.toLocaleString()}`}
            sub={`${summary.completedOrders} 件の決済完了`}
          />
          <StatCard
            icon={ShoppingCart}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            label="総注文数"
            value={`${summary.totalOrders} 件`}
            sub={`うちキャンセル ${summary.cancelledOrders} 件`}
          />
          <StatCard
            icon={TrendingUp}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            label="平均注文単価"
            value={`¥${Math.round(summary.avgOrderValue).toLocaleString()}`}
            sub="決済完了注文の平均"
          />
          <StatCard
            icon={XCircle}
            iconBg="bg-red-100"
            iconColor="text-red-600"
            label="キャンセル率"
            value={`${summary.cancellationRate.toFixed(1)}%`}
            sub="期間内の全注文に対する比率"
          />
        </div>

        {/* 売れ筋 Top 10 */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">売れ筋商品 Top 10</h2>
            <p className="text-xs text-muted-foreground mt-1">期間内に決済完了した注文を集計</p>
          </div>
          {topProducts.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">期間内に決済完了の注文はありません</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">#</th>
                  <th className="text-left px-4 py-2 font-medium">商品名</th>
                  <th className="text-left px-4 py-2 font-medium">SKU</th>
                  <th className="text-right px-4 py-2 font-medium">販売数</th>
                  <th className="text-right px-4 py-2 font-medium">売上</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.productId} className="border-t">
                    <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-2 text-right">{p.quantitySold}</td>
                    <td className="px-4 py-2 text-right font-semibold">¥{p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 日別売上 */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">日別売上 (決済完了分)</h2>
          </div>
          {daily.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">期間内に決済完了の注文はありません</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">日付</th>
                  <th className="text-right px-4 py-2 font-medium">注文数</th>
                  <th className="text-right px-4 py-2 font-medium">売上</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((d) => (
                  <tr key={d.date} className="border-t">
                    <td className="px-4 py-2 font-mono">{d.date}</td>
                    <td className="px-4 py-2 text-right">{d.orderCount}</td>
                    <td className="px-4 py-2 text-right font-semibold">¥{d.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
