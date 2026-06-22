/**
 * 「既存商品からコピーして新規登録」のためのフィールド変換ロジック（純粋関数）。
 *
 * 背景: 新規登録フォーム(new/page.tsx)に「商品情報をコピー」機能を追加する。
 * コピー元商品 → 新規フォームの formData への詰め替えは分岐が多くバグの温床になるため、
 * UI から切り離した純粋関数に集約し、ユニットテストで挙動を固定する。
 *
 * クライアントが運用に合わせて挙動を選べるよう、3つの切り替え（画像引継ぎ / 在庫リセット /
 * 商品名サフィックス）をオプションで受け取る。既定値はユーザー合意の初期値に一致させる。
 */

import { categorySlugToCardType } from "@/lib/admin/category-map"

/** コピー元として参照する商品（GET /api/admin/products/[id] の戻り値の必要部分）。 */
export interface CopySourceProduct {
  name: string
  category?: { slug?: string | null } | null
  productType?: string | null
  cardSet?: string | null
  cardNumber?: string | null
  rarity?: string | null
  condition?: string | null
  price?: number | string | null
  stock?: number | string | null
  language?: string | null
  foil?: boolean | null
  firstEdition?: boolean | null
  graded?: boolean | null
  gradingCompany?: string | null
  grade?: string | null
  hasShrink?: boolean | null
  description?: string | null
  images?: { url: string; alt?: string | null }[] | null
}

/** コピー時の挙動切り替え（クライアントがダイアログ上で選択）。 */
export interface CopyOptions {
  /** コピー元の画像も引き継ぐか（独立した実体として再アップロードされる）。 */
  copyImages: boolean
  /** 在庫数を 0 にリセットするか（false の場合はコピー元の在庫をそのまま入れる）。 */
  resetStock: boolean
  /** 商品名の末尾に「のコピー」を付けるか（重複登録の取り違え防止用）。 */
  appendCopySuffix: boolean
}

/** ユーザー合意の初期値: 画像引継ぎON / 在庫0スタート / 商品名はそのまま。 */
export const DEFAULT_COPY_OPTIONS: CopyOptions = {
  copyImages: true,
  resetStock: true,
  appendCopySuffix: false,
}

/** 商品名サフィックス。 */
export const COPY_NAME_SUFFIX = "のコピー"

/** new/page.tsx の formData と同じ形（すべて文字列/真偽値ベース）。 */
export interface CopyFormData {
  name: string
  cardType: string
  productType: string
  cardSet: string
  cardNumber: string
  rarity: string
  condition: string
  price: string
  stock: string
  language: string
  foil: boolean
  firstEdition: boolean
  graded: boolean
  gradingCompany: string
  grade: string
  hasShrink: boolean
  description: string
}

/** 引き継ぐ画像（再アップロード対象）の参照。 */
export interface CopyImageRef {
  url: string
  alt: string
}

const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v))
const bool = (v: unknown): boolean => v === true

/**
 * コピー元商品 → 新規登録フォームの formData を構築する。
 * 一意性に関わる値（sku/slug/id）や日時はここでは扱わない（作成API側で新規採番）。
 */
export function buildCopyFormData(
  source: CopySourceProduct,
  options: CopyOptions = DEFAULT_COPY_OPTIONS
): CopyFormData {
  const baseName = str(source.name)
  const name = options.appendCopySuffix ? `${baseName}${COPY_NAME_SUFFIX}` : baseName

  const stock = options.resetStock ? "0" : str(source.stock)

  return {
    name,
    cardType: categorySlugToCardType(source.category?.slug),
    productType: str(source.productType) || "SINGLE",
    cardSet: str(source.cardSet),
    cardNumber: str(source.cardNumber),
    rarity: str(source.rarity),
    condition: str(source.condition),
    price: str(source.price),
    stock,
    language: str(source.language) || "JP",
    foil: bool(source.foil),
    firstEdition: bool(source.firstEdition),
    graded: bool(source.graded),
    gradingCompany: str(source.gradingCompany),
    grade: str(source.grade),
    hasShrink: bool(source.hasShrink),
    description: str(source.description),
  }
}

/**
 * 引き継ぐ画像 URL のリストを返す。copyImages が false なら空配列。
 * alt はコピー元の alt、無ければ商品名で補完する。
 */
export function selectCopyImageRefs(
  source: CopySourceProduct,
  options: CopyOptions = DEFAULT_COPY_OPTIONS
): CopyImageRef[] {
  if (!options.copyImages) return []
  const images = source.images ?? []
  return images
    .filter((img) => img && typeof img.url === "string" && img.url.length > 0)
    .map((img) => ({ url: img.url, alt: str(img.alt) || str(source.name) }))
}
