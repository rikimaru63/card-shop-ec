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
