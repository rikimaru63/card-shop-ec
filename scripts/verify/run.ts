/**
 * 純粋ロジックの検証スクリプト (EU ブランチ版)。
 *   実行: npx tsx scripts/verify/run.ts
 * EU は国リストを共通モジュール化していない (checkout/signup にインライン保持) ため、
 * ここでは共有ロジック (CSRF 判定 / 商品並び順) のみを検証する。
 * 国リストの追加は checkout/signup の配列を直接確認する。
 * いずれかの assert が失敗したら exit code 1 で終了する。
 */
import { shouldCompleteOrigin } from "../../src/lib/security/origin-guard"
import { buildProductOrderBy } from "../../src/lib/products/sort"
import {
  shouldApplySearch,
  filterProductsBySearch,
} from "../../src/lib/admin/product-search"

let passed = 0
let failed = 0
const failures: string[] = []

function check(name: string, cond: boolean): void {
  if (cond) {
    passed++
  } else {
    failed++
    failures.push(name)
    // eslint-disable-next-line no-console
    console.error(`  ✗ ${name}`)
  }
}

function eq(name: string, actual: unknown, expected: unknown): void {
  check(`${name} (=${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`,
    JSON.stringify(actual) === JSON.stringify(expected))
}

const ORIGIN = "https://samuraicardhub-eu.com"

// ===== 1) Origin 補完の CSRF 判定 =====
console.log("[1] origin-guard (shouldCompleteOrigin)")
check("no cookie -> reject", shouldCompleteOrigin({
  hasSessionCookie: false, referer: null, secFetchSite: null, expectedOrigin: ORIGIN,
}) === false)
check("cookie + headers stripped -> complete (Adrian fix)", shouldCompleteOrigin({
  hasSessionCookie: true, referer: null, secFetchSite: null, expectedOrigin: ORIGIN,
}) === true)
check("cookie + same-origin referer -> complete", shouldCompleteOrigin({
  hasSessionCookie: true, referer: `${ORIGIN}/checkout`, secFetchSite: null, expectedOrigin: ORIGIN,
}) === true)
check("cookie + cross-site referer -> reject", shouldCompleteOrigin({
  hasSessionCookie: true, referer: "https://evil.example.com/x", secFetchSite: null, expectedOrigin: ORIGIN,
}) === false)
check("cookie + sec-fetch same-site -> reject", shouldCompleteOrigin({
  hasSessionCookie: true, referer: null, secFetchSite: "same-site", expectedOrigin: ORIGIN,
}) === false)
check("cookie + sec-fetch cross-site -> reject", shouldCompleteOrigin({
  hasSessionCookie: true, referer: null, secFetchSite: "cross-site", expectedOrigin: ORIGIN,
}) === false)
check("cookie + sec-fetch none -> reject", shouldCompleteOrigin({
  hasSessionCookie: true, referer: null, secFetchSite: "none", expectedOrigin: ORIGIN,
}) === false)
check("cookie + sec-fetch same-origin -> complete", shouldCompleteOrigin({
  hasSessionCookie: true, referer: null, secFetchSite: "same-origin", expectedOrigin: ORIGIN,
}) === true)
check("cookie + malformed referer -> complete", shouldCompleteOrigin({
  hasSessionCookie: true, referer: "not a url", secFetchSite: null, expectedOrigin: ORIGIN,
}) === true)

// ===== 2) 商品並び順の生成 =====
console.log("[2] product sort (buildProductOrderBy)")
eq("default -> featured then createdAt", buildProductOrderBy(undefined), [{ featured: "desc" }, { createdAt: "desc" }])
eq("newest -> featured then createdAt", buildProductOrderBy("newest"), [{ featured: "desc" }, { createdAt: "desc" }])
eq("featured -> featured then createdAt", buildProductOrderBy("featured"), [{ featured: "desc" }, { createdAt: "desc" }])
eq("price-asc -> price asc", buildProductOrderBy("price-asc"), [{ price: "asc" }])
eq("price-desc -> price desc", buildProductOrderBy("price-desc"), [{ price: "desc" }])
eq("name-asc -> name asc", buildProductOrderBy("name-asc"), [{ name: "asc" }])

// ===== 4) 管理画面 商品テキスト検索 (filterProductsBySearch) =====
console.log("[4] admin product search (filterProductsBySearch)")

// 短語ガード: 空 / 空白 / 1 文字は絞り込まない、2 文字以上で絞り込む
check("shouldApplySearch '' -> false", shouldApplySearch("") === false)
check("shouldApplySearch '   ' -> false", shouldApplySearch("   ") === false)
check("shouldApplySearch 'a' (1 char) -> false", shouldApplySearch("a") === false)
check("shouldApplySearch ' a ' (trim 1 char) -> false", shouldApplySearch(" a ") === false)
check("shouldApplySearch 'ab' -> true", shouldApplySearch("ab") === true)
check("shouldApplySearch ' ab ' (trim 2 char) -> true", shouldApplySearch(" ab ") === true)

const searchSample = [
  { name: "Pikachu VMAX", nameJa: "ピカチュウVMAX", cardNumber: "044/185", sku: "PKM-PIKA-001", cardSet: "Vivid Voltage" },
  { name: "Charizard ex", nameJa: "リザードンex", cardNumber: "006/165", sku: "PKM-CHAR-002", cardSet: "Pokemon 151" },
  { name: "Luffy Leader", nameJa: null, cardNumber: null, sku: "OP-LUFFY-003", cardSet: "Romance Dawn" },
]
const names = (arr: { name: string }[]) => arr.map((p) => p.name)

// name 部分一致 (大文字小文字無視)
eq("search 'pika' -> Pikachu (name, case-insensitive)",
  names(filterProductsBySearch(searchSample, "pika")), ["Pikachu VMAX"])
// nameJa (日本語名) 一致
eq("search 'リザードン' -> Charizard (nameJa)",
  names(filterProductsBySearch(searchSample, "リザードン")), ["Charizard ex"])
// cardNumber 一致
eq("search '006/165' -> Charizard (cardNumber)",
  names(filterProductsBySearch(searchSample, "006/165")), ["Charizard ex"])
// sku 一致 (大文字小文字無視)
eq("search 'op-luffy' -> Luffy (sku, case-insensitive)",
  names(filterProductsBySearch(searchSample, "op-luffy")), ["Luffy Leader"])
// cardSet はテキスト検索対象に含めない (ファセットで絞るため)
eq("search 'vivid' (cardSet only) -> none",
  names(filterProductsBySearch(searchSample, "vivid")), [])
// 一致なし
eq("search 'zzz' -> none", names(filterProductsBySearch(searchSample, "zzz")), [])
// null セーフティ: nameJa/cardNumber が null の商品でも落ちない
eq("search 'luffy' -> Luffy (null nameJa/cardNumber safe)",
  names(filterProductsBySearch(searchSample, "luffy")), ["Luffy Leader"])

// 短語ガード適用時は「同一参照」で元配列を返す (React.memo bailout の前提)
check("filter '' returns same array reference", filterProductsBySearch(searchSample, "") === searchSample)
check("filter 'a' (1 char) returns same array reference", filterProductsBySearch(searchSample, "a") === searchSample)
check("filter 'a' (1 char) returns all rows", filterProductsBySearch(searchSample, "a").length === searchSample.length)

// 複数一致 (共通部分文字列): "pkm" は sku 2件に一致
eq("search 'pkm' -> 2 products by sku",
  names(filterProductsBySearch(searchSample, "pkm")), ["Pikachu VMAX", "Charizard ex"])

// ===== 結果 =====
console.log("")
if (failed === 0) {
  console.log(`✅ ALL PASSED: ${passed} checks`)
  process.exit(0)
} else {
  console.error(`❌ FAILED: ${failed} / ${passed + failed} checks`)
  console.error("Failures:\n - " + failures.join("\n - "))
  process.exit(1)
}
