/**
 * 純粋ロジックの検証スクリプト (自動テスト基盤が無いリポジトリ向け)。
 *   実行: npx tsx scripts/verify/run.ts
 * 対象:
 *   1) Origin 補完の CSRF 判定 (Adrian / ブルネイ顧客の Confirm Order 救済)
 *   2) 商品並び順の生成 (トップ固定 featured の反映)
 *   3) 選択可能な国リスト (10か国追加・重複なし・日本語名の整合)
 * いずれかの assert が失敗したら exit code 1 で終了する。
 */
import { shouldCompleteOrigin } from "../../src/lib/security/origin-guard"
import { buildProductOrderBy } from "../../src/lib/products/sort"
import { getSelectableCountries, baseCountries } from "../../src/lib/config/countries"
import { countryDisplayName } from "../../src/lib/reports/countries"

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

const ORIGIN = "https://samuraicardhub.com"

// ===== 1) Origin 補完の CSRF 判定 =====
console.log("[1] origin-guard (shouldCompleteOrigin)")

// cookie が無ければ常に拒否
check("no cookie -> reject", shouldCompleteOrigin({
  hasSessionCookie: false, referer: null, secFetchSite: null, expectedOrigin: ORIGIN,
}) === false)

// ★ Adrian/ブルネイ救済: cookie あり + Referer/Sec-Fetch 両方欠落 (プロキシ剥がし) -> 補完する
check("cookie + headers stripped -> complete (Adrian fix)", shouldCompleteOrigin({
  hasSessionCookie: true, referer: null, secFetchSite: null, expectedOrigin: ORIGIN,
}) === true)

// cookie あり + Referer が同一オリジン -> 補完
check("cookie + same-origin referer -> complete", shouldCompleteOrigin({
  hasSessionCookie: true, referer: `${ORIGIN}/checkout`, secFetchSite: null, expectedOrigin: ORIGIN,
}) === true)

// cookie あり + Referer が別オリジン (明確なクロスサイト) -> 拒否
check("cookie + cross-site referer -> reject", shouldCompleteOrigin({
  hasSessionCookie: true, referer: "https://evil.example.com/x", secFetchSite: null, expectedOrigin: ORIGIN,
}) === false)

// cookie あり + Sec-Fetch-Site: cross-site -> 拒否
check("cookie + sec-fetch cross-site -> reject", shouldCompleteOrigin({
  hasSessionCookie: true, referer: null, secFetchSite: "cross-site", expectedOrigin: ORIGIN,
}) === false)

// cookie あり + Sec-Fetch-Site: same-origin -> 補完
check("cookie + sec-fetch same-origin -> complete", shouldCompleteOrigin({
  hasSessionCookie: true, referer: null, secFetchSite: "same-origin", expectedOrigin: ORIGIN,
}) === true)

// cookie あり + Sec-Fetch-Site: same-site (サブドメイン) -> 拒否 (厳格化後)
check("cookie + sec-fetch same-site -> reject", shouldCompleteOrigin({
  hasSessionCookie: true, referer: null, secFetchSite: "same-site", expectedOrigin: ORIGIN,
}) === false)

// cookie あり + Sec-Fetch-Site: none (Server Action fetch では発生しない) -> 拒否 (厳格化後)
check("cookie + sec-fetch none -> reject", shouldCompleteOrigin({
  hasSessionCookie: true, referer: null, secFetchSite: "none", expectedOrigin: ORIGIN,
}) === false)

// cookie あり + 壊れた Referer -> 判定不能扱いで補完 (これ単独では拒否しない)
check("cookie + malformed referer -> complete", shouldCompleteOrigin({
  hasSessionCookie: true, referer: "not a url", secFetchSite: null, expectedOrigin: ORIGIN,
}) === true)

// 攻撃シナリオ: 別オリジン Referer は Sec-Fetch が無くても拒否される
check("cross-site referer wins over missing sec-fetch -> reject", shouldCompleteOrigin({
  hasSessionCookie: true, referer: "https://attacker.test/", secFetchSite: null, expectedOrigin: ORIGIN,
}) === false)

// ===== 2) 商品並び順の生成 =====
console.log("[2] product sort (buildProductOrderBy)")
eq("default -> featured then createdAt", buildProductOrderBy(undefined), [{ featured: "desc" }, { createdAt: "desc" }])
eq("newest -> featured then createdAt", buildProductOrderBy("newest"), [{ featured: "desc" }, { createdAt: "desc" }])
eq("featured -> featured then createdAt", buildProductOrderBy("featured"), [{ featured: "desc" }, { createdAt: "desc" }])
eq("popular -> featured then createdAt", buildProductOrderBy("popular"), [{ featured: "desc" }, { createdAt: "desc" }])
eq("price-asc -> price asc", buildProductOrderBy("price-asc"), [{ price: "asc" }])
eq("price-desc -> price desc", buildProductOrderBy("price-desc"), [{ price: "desc" }])
eq("name-asc -> name asc", buildProductOrderBy("name-asc"), [{ name: "asc" }])
eq("name -> name asc", buildProductOrderBy("name"), [{ name: "asc" }])

// ===== 3) 選択可能な国リスト =====
console.log("[3] countries (getSelectableCountries)")
const NEW_CODES = ["AL", "TR", "BY", "MT", "MO", "SK", "GR", "HU", "BA", "UA"]
const usList = getSelectableCountries("US")
const usCodes = usList.map((c) => c.code)
const euList = getSelectableCountries("EU")
const euCodes = euList.map((c) => c.code)

// 追加10か国が US リストに存在する
for (const code of NEW_CODES) {
  check(`US includes ${code}`, usCodes.includes(code))
  check(`EU includes ${code}`, euCodes.includes(code))
}

// US / EU いずれも code 重複が無い
check("US has no duplicate codes", new Set(usCodes).size === usCodes.length)
check("EU has no duplicate codes", new Set(euCodes).size === euCodes.length)

// EU は base を内包し、かつ名前順にソートされている
check("EU is a superset of base codes", baseCountries.every((c) => euCodes.includes(c.code)))
const euNames = euList.map((c) => c.name)
check("EU is sorted by name", euNames.every((n, i) => i === 0 || euNames[i - 1].localeCompare(n) <= 0))

// 選択可能な全コードに日本語名が定義されている (レポートでコード生表示にならない)
const allCodes = Array.from(new Set(usCodes.concat(euCodes)))
for (const code of allCodes) {
  check(`JA name exists for ${code}`, countryDisplayName(code) !== code && countryDisplayName(code) !== "不明")
}

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
