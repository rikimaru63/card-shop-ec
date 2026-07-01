import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'
import { baseCountries, euOnlyCountries } from '@/lib/config/countries'
import { countryDisplayName } from '@/lib/reports/countries'

export const dynamic = 'force-dynamic'

// 投入する 1 件分のデータ形状 (ShippingCountry モデルに対応)
type ShippingCountrySeed = {
  code: string
  name: string
  nameJa: string | null
  enabledUS: boolean
  enabledEU: boolean
  order: number
}

/**
 * 国コード (ISO 3166-1 alpha-2) から日本語名を引く。
 *
 * 注意: src/lib/reports/countries.ts の日本語名マップ (COUNTRY_NAMES_JA) は
 *       export されていないため直接 import できない。代わりに公開関数
 *       countryDisplayName を利用する。この関数は未知コードの場合に
 *       「コードそのもの (大文字)」を返す仕様なので、その場合は
 *       「日本語名なし」とみなして null に変換する。
 */
function resolveNameJa(code: string): string | null {
  const ja = countryDisplayName(code)
  return ja === code.toUpperCase() ? null : ja
}

// POST - 配送先国マスタ (ShippingCountry) をシード投入する (管理者専用)
// baseCountries / euOnlyCountries を単一ソースとして DB へ流し込む。
// upsert 方式のため何度実行しても安全 (冪等)。
export async function POST(request: NextRequest) {
  try {
    // 認証: 管理者以外は 401 で弾く
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    // 投入対象を組み立てる。code の重複を防ぐため既出コードを記録しておく。
    const records: ShippingCountrySeed[] = []
    const seen = new Set<string>()

    // baseCountries: US / EU の両方で有効。order は配列の index。
    baseCountries.forEach((country, index) => {
      records.push({
        code: country.code,
        name: country.name,
        nameJa: resolveNameJa(country.code),
        enabledUS: true,
        enabledEU: true,
        order: index,
      })
      seen.add(country.code)
    })

    // euOnlyCountries: EU のみ有効 (US は無効)。
    // baseCountries と同一 code のもの (HK / KR / SG など) は
    // 「両対応」を優先して base 側を採用し、euOnly 側は投入しない。
    // order は baseCountries.length + euOnly 配列内の index。
    euOnlyCountries.forEach((country, index) => {
      if (seen.has(country.code)) return
      records.push({
        code: country.code,
        name: country.name,
        nameJa: resolveNameJa(country.code),
        enabledUS: false,
        enabledEU: true,
        order: baseCountries.length + index,
      })
      seen.add(country.code)
    })

    // upsert で投入 (既存があれば更新、無ければ作成)。冪等。
    const results = await Promise.all(
      records.map((record) =>
        prisma.shippingCountry.upsert({
          where: { code: record.code },
          update: {
            name: record.name,
            nameJa: record.nameJa,
            enabledUS: record.enabledUS,
            enabledEU: record.enabledEU,
            order: record.order,
          },
          create: {
            code: record.code,
            name: record.name,
            nameJa: record.nameJa,
            enabledUS: record.enabledUS,
            enabledEU: record.enabledEU,
            order: record.order,
          },
        })
      )
    )

    return NextResponse.json({
      message: '配送先国マスタを投入しました',
      total: results.length,
      upserted: results.length,
    }, { status: 200 })

  } catch (error) {
    console.error('配送先国シード処理でエラー:', error)
    return NextResponse.json(
      { error: 'シード処理に失敗しました' },
      { status: 500 }
    )
  }
}
