/**
 * 管理画面 商品一覧のテキスト検索ロジック（純粋関数）。
 *
 * 背景: 以前は 1 文字打つたびに /api/admin/products へ全件問い合わせ（往復）していたため
 * 画面反映に 3〜7 秒かかっていた。本モジュールは、初回ロードで配布済みの全商品を
 * ブラウザ内で即時に絞り込むためのロジックを提供する（通信ゼロ）。
 *
 * 検索対象フィールドはサーバー側（src/app/api/admin/products/route.ts の search 条件）と
 * 1:1 で一致させる: name / nameJa / cardNumber / sku の大文字小文字を無視した部分一致。
 * （cardSet は別途ファセットフィルタで絞り込むため、テキスト検索には含めない。）
 */

/** これ未満の文字数では絞り込みを行わない（1 文字だとほぼ全件一致し描画が最重になるため）。 */
export const MIN_SEARCH_LENGTH = 2

/** テキスト検索の対象となる商品フィールド（null/undefined を許容）。 */
export interface SearchableProduct {
  name: string
  nameJa?: string | null
  cardNumber?: string | null
  sku?: string | null
}

/**
 * 与えられたクエリで絞り込みを実行すべきか判定する。
 * 空文字・空白のみ・1 文字（MIN_SEARCH_LENGTH 未満）は絞り込まない（= 全件表示）。
 */
export function shouldApplySearch(query: string): boolean {
  return query.trim().length >= MIN_SEARCH_LENGTH
}

/**
 * 1 商品が、正規化済み（trim + 小文字化）クエリに一致するか判定する。
 * name / nameJa / cardNumber / sku のいずれかに部分一致すれば true。
 */
export function productMatchesSearch(
  product: SearchableProduct,
  normalizedQuery: string
): boolean {
  const fields = [product.name, product.nameJa, product.cardNumber, product.sku]
  return fields.some((field) => (field ?? '').toLowerCase().includes(normalizedQuery))
}

/**
 * 商品配列をテキストクエリで絞り込む。
 * 絞り込み不要（shouldApplySearch=false）のときは、参照を保ったまま元配列をそのまま返す
 * （React.memo の bailout が効くよう、各要素の参照を変えないことが重要）。
 */
export function filterProductsBySearch<T extends SearchableProduct>(
  products: T[],
  query: string
): T[] {
  if (!shouldApplySearch(query)) {
    return products
  }
  const normalizedQuery = query.trim().toLowerCase()
  return products.filter((product) => productMatchesSearch(product, normalizedQuery))
}
