import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rowsToCsv, csvResponseHeaders, formatDateKey } from "@/lib/reports/csv"
import { resolvePeriod } from "@/lib/reports/stats"

export const dynamic = "force-dynamic"

// 注文一覧を CSV で書き出す。
// クエリ: ?period=thisMonth|lastMonth|last3months|last1year|custom&from=YYYY-MM-DD&to=YYYY-MM-DD
//        ?status=PENDING,SHIPPED,...  (任意、カンマ区切り)
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const period = resolvePeriod({
    period: sp.get("period") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
  })
  const statusParam = sp.get("status")
  const statuses = statusParam ? statusParam.split(",").filter(Boolean) : null

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: period.from, lte: period.to },
      ...(statuses && statuses.length > 0 ? { status: { in: statuses as any } } : {}),
    },
    include: {
      items: { select: { quantity: true, snapshot: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const rows = orders.map((o) => {
    const items = o.items.map((it) => {
      const snap = (it.snapshot as any) ?? {}
      const name = snap.name ?? snap.productName ?? "(unknown)"
      return `${name} ×${it.quantity}`
    }).join(" / ")

    const ship = (o.shippingAddress as any) ?? {}
    const shippingAddress = [
      ship.firstName,
      ship.lastName,
      ship.street1,
      ship.street2,
      ship.city,
      ship.state,
      ship.postalCode,
      ship.country,
    ].filter(Boolean).join(" ")

    return [
      o.orderNumber,
      o.createdAt.toISOString(),
      o.email,
      o.status,
      o.paymentStatus,
      o.paymentMethod ?? "",
      Number(o.subtotal),
      Number(o.shipping),
      Number(o.customsFee ?? 0),
      Number(o.tax ?? 0),
      Number(o.total),
      o.currency,
      o.items.length,
      items,
      shippingAddress,
      o.trackingNumber ?? "",
      o.shippedAt ? o.shippedAt.toISOString() : "",
      o.deliveredAt ? o.deliveredAt.toISOString() : "",
    ]
  })

  const csv = rowsToCsv(
    [
      "注文番号",
      "注文日時 (UTC)",
      "メール",
      "注文ステータス",
      "決済ステータス",
      "決済方法",
      "小計",
      "送料",
      "関税",
      "税",
      "合計",
      "通貨",
      "商品点数",
      "商品明細",
      "配送先",
      "追跡番号",
      "発送日時",
      "配達日時",
    ],
    rows
  )

  const filename = `orders_${formatDateKey(period.from)}_${formatDateKey(period.to)}.csv`
  return new NextResponse(csv, {
    status: 200,
    headers: csvResponseHeaders(filename),
  })
}
