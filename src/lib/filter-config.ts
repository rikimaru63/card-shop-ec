/**
 * Shared filter configuration for the card shop
 * Used by both FilterSidebar and ProductFilters components
 */

// ============================================
// Card Game Types
// ============================================
export const CARD_GAMES = [
  { id: "pokemon", label: "Pokemon", categorySlug: "pokemon-cards" },
  { id: "onepiece", label: "One Piece", categorySlug: "onepiece-cards" },
  { id: "other", label: "Other", categorySlug: "other-cards" },
] as const

export type CardGameId = typeof CARD_GAMES[number]["id"]

// ============================================
// Product Types (matching database enum)
// ============================================
export const PRODUCT_TYPES = [
  { id: "SINGLE", label: "Single Cards" },
  { id: "BOX", label: "Sealed Box & Packs" },
  { id: "OTHER", label: "Other" },
] as const

export type ProductTypeId = typeof PRODUCT_TYPES[number]["id"]

// ============================================
// Rarities
// ============================================

// Pokemon rarities
export const POKEMON_RARITIES = [
  { id: "SAR", label: "SAR" },
  { id: "UR", label: "UR" },
  { id: "SR", label: "SR" },
  { id: "HR", label: "HR" },
  { id: "AR", label: "AR" },
  { id: "RRR", label: "RRR" },
  { id: "RR", label: "RR" },
  { id: "R", label: "R" },
  { id: "SSR", label: "SSR" },
  { id: "CSR", label: "CSR" },
  { id: "CHR", label: "CHR" },
  { id: "MUR", label: "MUR" },
  { id: "ACE", label: "ACE" },
  { id: "MA", label: "MA" },
  { id: "BWR", label: "BWR" },
  { id: "S", label: "S" },
  { id: "K", label: "K" },
  { id: "A", label: "A" },
  { id: "PR", label: "PROMO" },
] as const

// One Piece rarities
export const ONEPIECE_RARITIES = [
  { id: "SEC", label: "SEC" },
  { id: "SR", label: "SR" },
  { id: "R", label: "R" },
  { id: "L", label: "L" },
] as const

// Combined rarities for all games view
export const ALL_RARITIES = [
  { id: "SAR", label: "SAR" },
  { id: "SEC", label: "SEC" },
  { id: "UR", label: "UR" },
  { id: "SR", label: "SR" },
  { id: "HR", label: "HR" },
  { id: "AR", label: "AR" },
  { id: "RRR", label: "RRR" },
  { id: "RR", label: "RR" },
  { id: "R", label: "R" },
  { id: "L", label: "L" },
  { id: "PR", label: "PROMO" },
] as const

// Helper function to get rarities by game
export function getRaritiesByGame(game?: string | null) {
  if (game === "pokemon" || game === "pokemon-cards") return POKEMON_RARITIES
  if (game === "onepiece" || game === "onepiece-cards") return ONEPIECE_RARITIES
  return ALL_RARITIES
}

// ============================================
// Conditions (matching database enum)
// ============================================
export const CONDITIONS = [
  { id: "SEALED", label: "Sealed / New" },
  { id: "GRADE_A", label: "Grade A (Near Mint)" },
  { id: "GRADE_B", label: "Grade B (Good)" },
  { id: "GRADE_C", label: "Grade C (Played)" },
  { id: "PSA", label: "PSA Graded" },
] as const

export type ConditionId = typeof CONDITIONS[number]["id"]

// ============================================
// Price Ranges
// ============================================
export const PRICE_RANGES = [
  { id: "0-1000", label: "Under ¥1,000", min: 0, max: 1000 },
  { id: "1000-3000", label: "¥1,000 - ¥3,000", min: 1000, max: 3000 },
  { id: "3000-5000", label: "¥3,000 - ¥5,000", min: 3000, max: 5000 },
  { id: "5000-10000", label: "¥5,000 - ¥10,000", min: 5000, max: 10000 },
  { id: "10000-30000", label: "¥10,000 - ¥30,000", min: 10000, max: 30000 },
  { id: "30000-50000", label: "¥30,000 - ¥50,000", min: 30000, max: 50000 },
  { id: "50000+", label: "¥50,000+", min: 50000, max: 10000000 },
] as const

export const DEFAULT_PRICE_RANGE = { min: 0, max: 100000 }
export const MAX_PRICE_LIMIT = 10000000

// ============================================
// Card Sets
// ============================================
export const CARD_SETS = {
  pokemon: [
    // SV Series
    { label: "Scarlet ex", value: "スカーレットex" },
    { label: "Violet ex", value: "バイオレットex" },
    { label: "Triplet Beat", value: "トリプレットビート" },
    { label: "Snow Hazard", value: "スノーハザード" },
    { label: "Clay Burst", value: "クレイバースト" },
    { label: "Pokemon 151", value: "151" },
    { label: "Raging Surf", value: "レイジングサーフ" },
    { label: "Ancient Roar", value: "古代の咆哮" },
    { label: "Future Flash", value: "未来の一閃" },
    { label: "Shiny Treasure ex", value: "シャイニートレジャーex" },
    { label: "Wild Force", value: "ワイルドフォース" },
    { label: "Cyber Judge", value: "サイバージャッジ" },
    { label: "Crimson Haze", value: "クリムゾンヘイズ" },
    { label: "Mask of Change", value: "変幻の仮面" },
    { label: "Stellar Miracle", value: "ステラミラクル" },
    { label: "Super Electric Breaker", value: "超電ブレイカー" },
    { label: "Terastal Fest", value: "テラスタルフェス" },
    { label: "Battle Partners", value: "バトルパートナーズ" },
    { label: "Night Wanderer", value: "ナイトワンダラー" },
    { label: "Paradise Dragona", value: "楽園ドラゴーナ" },
    // Sword & Shield Series
    { label: "VSTAR Universe", value: "VSTARユニバース" },
    { label: "Paradigm Trigger", value: "パラダイムトリガー" },
    { label: "Eevee Heroes", value: "イーブイヒーローズ" },
    { label: "Blue Sky Stream", value: "蒼空ストリーム" },
    { label: "Fusion Arts", value: "フュージョンアーツ" },
    { label: "Star Birth", value: "スターバース" },
    { label: "Dark Phantasma", value: "ダークファンタズマ" },
    { label: "Time Gazer", value: "タイムゲイザー" },
    { label: "Space Juggler", value: "スペースジャグラー" },
    { label: "Lost Abyss", value: "ロストアビス" },
    { label: "Pokemon GO", value: "ポケモンGO" },
    // Sun & Moon Series
    { label: "GX Ultra Shiny", value: "GXウルトラシャイニー" },
    { label: "Tag Bolt", value: "タッグボルト" },
    { label: "Dream League", value: "ドリームリーグ" },
    // Special
    { label: "Promo Cards", value: "プロモーションカード" },
    { label: "Other", value: "その他" },
  ],
  onepiece: [
    { label: "Romance Dawn (OP-01)", value: "ROMANCE DAWN【OP-01】" },
    { label: "Paramount War (OP-02)", value: "頂上決戦【OP-02】" },
    { label: "Pillars of Strength (OP-03)", value: "強大な敵【OP-03】" },
    { label: "Kingdoms of Intrigue (OP-04)", value: "謀略の王国【OP-04】" },
    { label: "Awakening of New Era (OP-05)", value: "新時代の主役【OP-05】" },
    { label: "Wings of Captain (OP-06)", value: "双璧の覇者【OP-06】" },
    { label: "500 Years Future (OP-07)", value: "500年後の未来【OP-07】" },
    { label: "Two Legends (OP-08)", value: "二つの伝説【OP-08】" },
    { label: "Four Emperors (OP-09)", value: "四皇覚醒【OP-09】" },
    { label: "Royal Bloodline (OP-10)", value: "ロイヤルブラッドライン【OP-10】" },
    { label: "Starter Deck", value: "スタートデッキ" },
    { label: "Promo Cards", value: "プロモーションカード" },
    { label: "Other", value: "その他" },
  ],
} as const

// Helper function to get card sets by game
export function getCardSetsByGame(game?: string | null) {
  if (game === "pokemon" || game === "pokemon-cards") return CARD_SETS.pokemon
  if (game === "onepiece" || game === "onepiece-cards") return CARD_SETS.onepiece
  return [...CARD_SETS.pokemon, ...CARD_SETS.onepiece]
}

// ============================================
// Filter State Types
// ============================================
export interface FilterState {
  categories: string[]
  priceRange: [number, number]
  rarities: string[]
  conditions: string[]
  productTypes: string[]
  cardSets: string[]
  inStock: boolean
}

export const DEFAULT_FILTER_STATE: FilterState = {
  categories: [],
  priceRange: [0, MAX_PRICE_LIMIT],
  rarities: [],
  conditions: [],
  productTypes: [],
  cardSets: [],
  inStock: false,
}

// ============================================
// URL Parameter Helpers
// ============================================
export function filtersToURLParams(filters: Partial<FilterState>): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.categories?.length) {
    params.set("category", filters.categories.join(","))
  }
  if (filters.rarities?.length) {
    params.set("rarity", filters.rarities.join(","))
  }
  if (filters.conditions?.length) {
    params.set("condition", filters.conditions.join(","))
  }
  if (filters.productTypes?.length) {
    params.set("productType", filters.productTypes.join(","))
  }
  if (filters.cardSets?.length) {
    params.set("cardSet", filters.cardSets.join(","))
  }
  if (filters.priceRange) {
    if (filters.priceRange[0] > 0) {
      params.set("minPrice", filters.priceRange[0].toString())
    }
    if (filters.priceRange[1] < MAX_PRICE_LIMIT) {
      params.set("maxPrice", filters.priceRange[1].toString())
    }
  }
  if (filters.inStock) {
    params.set("inStock", "true")
  }

  return params
}

export function urlParamsToFilters(searchParams: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {}

  const category = searchParams.get("category")
  if (category) filters.categories = category.split(",").filter(Boolean)

  const rarity = searchParams.get("rarity")
  if (rarity) filters.rarities = rarity.split(",").filter(Boolean)

  const condition = searchParams.get("condition")
  if (condition) filters.conditions = condition.split(",").filter(Boolean)

  const productType = searchParams.get("productType")
  if (productType) filters.productTypes = productType.split(",").filter(Boolean)

  const cardSet = searchParams.get("cardSet")
  if (cardSet) filters.cardSets = cardSet.split(",").filter(Boolean)

  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  if (minPrice || maxPrice) {
    filters.priceRange = [
      minPrice ? parseInt(minPrice) : 0,
      maxPrice ? parseInt(maxPrice) : MAX_PRICE_LIMIT,
    ]
  }

  const inStock = searchParams.get("inStock")
  if (inStock === "true") filters.inStock = true

  return filters
}
