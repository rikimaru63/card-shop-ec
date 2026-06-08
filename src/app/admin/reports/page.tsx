import Link from "next/link"
import { ArrowLeft, Download, ShoppingCart, TrendingUp, XCircle, JapaneseYen, Globe, Eye, Users, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getReportSummary, getTopProducts, getDailyRevenue, resolvePeriod, type ReportRegion } from "@/lib/reports/stats"
import { getRegionSummary, getCountryBreakdown } from "@/lib/reports/region-stats"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: { period?: string; from?: string; to?: string; region?: string }
}

const PERIOD_OPTIONS: { key: string; label: string }[] = [
  { key: "thisMonth", label: "今月" },
  { key: "lastMonth", label: "先月" },
  { key: "last3months", label: "過去 3 ヶ月" },
  { key: "last1year", label: "過去 1 年" },
]

const REGION_OPTIONS: { key: string; label: string }[] = [
  { key: "all", label: "全体" },
  { key: "us", label: "アメリカ (US)" },
  { key: "eu", label: "ヨーロッパ (EU)" },
]

// searchParams.region を "us" / "eu" / undefined(全体) に正規化 (大文字小文字を許容)
function resolveRegion(raw?: string): ReportRegion | undefined {
  const v = raw?.toLowerCase()
  return v === "us" ? "us" : v === "eu" ? "eu" : undefined
}

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
  const region = resolveRegion(searchParams.region)

  const [summary, topProducts, daily, regionSummary, countryRows] = await Promise.all([
    getReportSummary(period.from, period.to, region),
    getTopProducts(period.from, period.to, 10, region),
    getDailyRevenue(period.from, period.to, region),
    getRegionSummary(period.from, period.to),
    getCountryBreakdown(period.from, period.to, region),
  ])

  // 期間 + 地域を保持したまま一部だけ上書きしてクエリ文字列を作るヘルパー
  const makeQuery = (over: Record<string, string | undefined>): string => {
    const p = new URLSearchParams()
    p.set("period", period.key)
    if (period.key === "custom") {
      p.set("from", period.from.toISOString().slice(0, 10))
      p.set("to", period.to.toISOString().slice(0, 10))
    }
    if (region) p.set("region", region)
    for (const [k, v] of Object.entries(over)) {
      if (v === undefined) p.delete(k)
      else p.set(k, v)
    }
    return p.toString()
  }

  const exportQuery = makeQuery({})
  const regionLabel = region === "us" ? "アメリカ (US)" : region === "eu" ? "ヨーロッパ (EU)" : "全体"

  // 「全体」表示時、リージョン記録前 (site=null) の注文を「全体集計 − US/EU合計」で算出。
  // これにより US + EU が全体総計と一致しない理由を画面で明示できる (追加クエリ不要)。
  const trackedOrders = regionSummary.reduce((s, r) => s + r.orders, 0)
  const trackedRevenue = regionSummary.reduce((s, r) => s + r.revenue, 0)
  const untrackedOrders = !region ? Math.max(0, summary.completedOrders - trackedOrders) : 0
  const untrackedRevenue = !region ? Math.max(0, summary.totalRevenue - trackedRevenue) : 0

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
          <p className="text-sm text-muted-foreground">
            期間: {period.label} ／ 地域: {regionLabel}
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 期間選択 */}
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm font-semibold mb-3">期間を選択</p>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <Link key={opt.key} href={`/admin/reports?${makeQuery({ period: opt.key })}`}>
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
            {region && <input type="hidden" name="region" value={region} />}
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

          {/* 地域選択 */}
          <p className="text-sm font-semibold mt-6 mb-3">地域で絞り込み</p>
          <div className="flex flex-wrap gap-2">
            {REGION_OPTIONS.map((opt) => {
              const isActive = (opt.key === "all" && !region) || opt.key === region
              return (
                <Link
                  key={opt.key}
                  href={`/admin/reports?${makeQuery({ region: opt.key === "all" ? undefined : opt.key })}`}
                >
                  <Button variant={isActive ? "default" : "outline"} size="sm">
                    {opt.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        {/* 集計カード (選択中の地域) */}
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
            label="客単価 (平均注文単価)"
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

        {/* リージョン別サマリ (US / EU 比較) */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-500" />
              <h2 className="font-semibold">リージョン別サマリ (US / EU 比較)</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              期間内の US サイトと EU サイトを並べて比較します。アクセス数は全期間で記録済みです。
              注文・売上・客単価は「リージョン記録の開始後」に発生した注文のみ集計します。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            {regionSummary.map((r) => (
              <div key={r.region} className="p-6">
                <h3 className="font-semibold text-lg mb-4">{r.label}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" /> アクセス数
                    </p>
                    <p className="text-xl font-bold">{r.visits.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> ユニーク訪問者
                    </p>
                    <p className="text-xl font-bold">{r.uniqueVisitors.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" /> 注文数 (決済完了)
                    </p>
                    <p className="text-xl font-bold">{r.orders.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <JapaneseYen className="h-3 w-3" /> 売上
                    </p>
                    <p className="text-xl font-bold">¥{r.revenue.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> 客単価 (平均注文単価)
                    </p>
                    <p className="text-xl font-bold">¥{Math.round(r.avgOrderValue).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!region && untrackedOrders > 0 && (
            <div className="px-6 py-3 border-t bg-amber-50">
              <p className="text-xs text-amber-900">
                ※ この他に「リージョン記録の開始前」の注文が {untrackedOrders.toLocaleString()} 件
                (¥{untrackedRevenue.toLocaleString()}) あり、上部の「全体」集計には含まれています
                (US / EU いずれにも振り分けられません)。今後の注文は自動で US / EU に分かれます。
              </p>
            </div>
          )}
        </div>

        {/* 流入国別の内訳 */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-teal-500" />
              <h2 className="font-semibold">流入国別の内訳{region ? `（${regionLabel}）` : ""}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              注文の「お届け先の国」ごとに、注文数・売上・客単価を集計します。
              リーチ数 (アクセス数) は国情報の記録開始後に表示されます (CDN の geo 機能が必要)。
            </p>
          </div>
          {countryRows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">期間内に対象データはありません</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">国・地域</th>
                  <th className="text-right px-4 py-2 font-medium">リーチ数</th>
                  <th className="text-right px-4 py-2 font-medium">注文数</th>
                  <th className="text-right px-4 py-2 font-medium">売上</th>
                  <th className="text-right px-4 py-2 font-medium">客単価</th>
                </tr>
              </thead>
              <tbody>
                {countryRows.map((c) => (
                  <tr key={c.code ?? "__unknown__"} className="border-t">
                    <td className="px-4 py-2">
                      {c.name}
                      {c.code && <span className="text-xs text-muted-foreground ml-1">({c.code})</span>}
                    </td>
                    <td className="px-4 py-2 text-right">{c.visits.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{c.orders.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-semibold">¥{c.revenue.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      {c.orders > 0 ? `¥${Math.round(c.avgOrderValue).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* データの読み方メモ (非エンジニア向け) */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 space-y-1">
            <p>
              <strong>「リージョン記録の開始後」とは:</strong> 注文に US/EU の印を付ける仕組みを今回追加したため、
              それ以前の注文は US/EU いずれにも振り分けられません (全体の集計には含まれます)。今後の注文から正しく分かれます。
            </p>
            <p>
              <strong>国別「リーチ数」が 0 の場合:</strong> 訪問者の国を記録する仕組みを今回追加したばかりです。
              アクセス元の国を取得するには CDN (Cloudflare 等) の geo 機能が有効である必要があります。注文の国別集計は今すぐ利用できます。
            </p>
          </div>
        </div>

        {/* 売れ筋 Top 10 */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">売れ筋商品 Top 10{region ? `（${regionLabel}）` : ""}</h2>
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
            <h2 className="font-semibold">日別売上 (決済完了分){region ? `（${regionLabel}）` : ""}</h2>
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
