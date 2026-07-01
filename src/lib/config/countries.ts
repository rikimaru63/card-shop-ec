// 配送先・会員登録で選択できる「国」の単一ソース。
//
// 背景:
//   以前は checkout/page.tsx と auth/signup/page.tsx に同じ国配列がコピペ重複しており、
//   片方だけ編集するとサインアップとチェックアウトで選べる国が食い違う温床になっていた
//   (実際 EU 版では signup と checkout の国リストがずれている)。ここに一本化し、
//   両画面とレポートが同じ定義を参照するようにする。
//
// 値の形式:
//   code は ISO 3166-1 alpha-2。これがそのまま Order.shippingAddress.country /
//   Address.country に保存され、レポートの国別集計キーになる。
//   日本語表示名は src/lib/reports/countries.ts (COUNTRY_NAMES_JA) 側に持つ。

export interface Country {
  code: string
  name: string
}

export const baseCountries: Country[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "KR", name: "South Korea" },
  { code: "NZ", name: "New Zealand" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  // 2026-06 クライアント要望で追加 (US/EU 両対応)
  { code: "AL", name: "Albania" },
  { code: "TR", name: "Turkey" },
  { code: "BY", name: "Belarus" },
  { code: "MT", name: "Malta" },
  { code: "MO", name: "Macao" },
  { code: "SK", name: "Slovakia" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "UA", name: "Ukraine" },
  // 2026-07 クライアント要望で追加 (US/EU 両対応)
  { code: "PH", name: "Philippines" }, // 従来は euOnly のみ→US でも要望が出たため base(両対応)へ昇格
  { code: "IN", name: "India" },
]

export const euOnlyCountries: Country[] = [
  { code: "CZ", name: "Czech Republic" },
  { code: "HK", name: "Hong Kong" },
  { code: "ID", name: "Indonesia" },
  { code: "KR", name: "South Korea" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  // 2026-07 EU 加盟国 (EU 版のみ表示・US では非表示)。EU の DB 統一時に欧州の国が
  // 消えないよう、base ではなく euOnly に登録する (US の baseCountries には波及しない)。
  { code: "PT", name: "Portugal" },
  { code: "IE", name: "Ireland" },
  { code: "PL", name: "Poland" },
  { code: "RO", name: "Romania" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "SI", name: "Slovenia" },
  { code: "LT", name: "Lithuania" },
  { code: "LV", name: "Latvia" },
  { code: "EE", name: "Estonia" },
  { code: "LU", name: "Luxembourg" },
  { code: "CY", name: "Cyprus" },
]

/**
 * region ("US" | "EU") に応じて選択可能な国の一覧を返す。
 * - US: baseCountries をそのまま (配列順)。
 * - EU: baseCountries + euOnlyCountries を名前順ソート。
 * いずれも code 重複は除去する (EU で base と euOnly に HK/KR/SG が重複する既存問題の予防)。
 */
export function getSelectableCountries(
  region: string = process.env.NEXT_PUBLIC_REGION || "US"
): Country[] {
  const merged = region === "EU"
    ? [...baseCountries, ...euOnlyCountries]
    : [...baseCountries]

  // code 重複を除去 (最初に現れたものを優先)
  const seen = new Set<string>()
  const deduped = merged.filter((c) => {
    if (seen.has(c.code)) return false
    seen.add(c.code)
    return true
  })

  return region === "EU"
    ? deduped.sort((a, b) => a.name.localeCompare(b.name))
    : deduped
}
