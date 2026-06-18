/**
 * カードタイプ(pokemon / onepiece / other) と カテゴリ slug の対応を一元管理する。
 *
 * 背景(2026-06-18 client 報告): 新規出品フォーム(new/page.tsx)と編集フォーム(edit/page.tsx)が
 * それぞれ「pokemon か否か」「onepiece-cards か否か」の【2択分岐】で変換していたため、
 * 「その他(other)」を選ぶと取りこぼされ、ワンピース/ポケモンへ誤分類されていた。
 * 変換ロジックをここに集約し、3カテゴリを取りこぼさないことをユニットテストで保証する。
 *
 * 注意: DB のカテゴリ slug は pokemon-cards / onepiece-cards / other-cards。
 * (trading-cards も DB に存在するが、出品フォームの選択肢は上記3種のみ)
 */

export type CardType = "pokemon" | "onepiece" | "other"

const CARD_TYPE_TO_SLUG: Record<CardType, string> = {
  pokemon: "pokemon-cards",
  onepiece: "onepiece-cards",
  other: "other-cards",
}

const CARD_TYPE_TO_SKU_PREFIX: Record<CardType, string> = {
  pokemon: "PKM",
  onepiece: "OPC",
  other: "OTH",
}

/** cardType → カテゴリ slug。未知値は pokemon-cards にフォールバック(作成APIの既定と一致)。 */
export function cardTypeToCategorySlug(cardType: string): string {
  return CARD_TYPE_TO_SLUG[cardType as CardType] ?? "pokemon-cards"
}

/** カテゴリ slug → cardType。未知/未設定はフォームの既定値 pokemon にフォールバック。 */
export function categorySlugToCardType(slug: string | null | undefined): CardType {
  switch (slug) {
    case "onepiece-cards":
      return "onepiece"
    case "other-cards":
      return "other"
    case "pokemon-cards":
      return "pokemon"
    default:
      return "pokemon"
  }
}

/** cardType → SKU 接頭辞。未知値は PKM にフォールバック。 */
export function cardTypeToSkuPrefix(cardType: string): string {
  return CARD_TYPE_TO_SKU_PREFIX[cardType as CardType] ?? "PKM"
}
