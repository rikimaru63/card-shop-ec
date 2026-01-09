import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'
import { CardGame } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Initial card sets data
const INITIAL_CARD_SETS = {
  POKEMON: [
    // SV Series (latest first)
    { label: "Battle Partners", value: "バトルパートナーズ", code: "SV9a", order: 1 },
    { label: "Terastal Fest", value: "テラスタルフェス", code: "SV9", order: 2 },
    { label: "Paradise Dragona", value: "楽園ドラゴーナ", code: "SV8a", order: 3 },
    { label: "Super Electric Breaker", value: "超電ブレイカー", code: "SV8", order: 4 },
    { label: "Night Wanderer", value: "ナイトワンダラー", code: "SV7a", order: 5 },
    { label: "Stellar Miracle", value: "ステラミラクル", code: "SV7", order: 6 },
    { label: "Mask of Change", value: "変幻の仮面", code: "SV6a", order: 7 },
    { label: "Crimson Haze", value: "クリムゾンヘイズ", code: "SV6", order: 8 },
    { label: "Cyber Judge", value: "サイバージャッジ", code: "SV5a", order: 9 },
    { label: "Wild Force", value: "ワイルドフォース", code: "SV5K", order: 10 },
    { label: "Shiny Treasure ex", value: "シャイニートレジャーex", code: "SV4a", order: 11 },
    { label: "Future Flash", value: "未来の一閃", code: "SV4M", order: 12 },
    { label: "Ancient Roar", value: "古代の咆哮", code: "SV4K", order: 13 },
    { label: "Raging Surf", value: "レイジングサーフ", code: "SV3a", order: 14 },
    { label: "Pokemon 151", value: "151", code: "SV2a", order: 15 },
    { label: "Clay Burst", value: "クレイバースト", code: "SV2D", order: 16 },
    { label: "Snow Hazard", value: "スノーハザード", code: "SV2P", order: 17 },
    { label: "Triplet Beat", value: "トリプレットビート", code: "SV1a", order: 18 },
    { label: "Violet ex", value: "バイオレットex", code: "SV1V", order: 19 },
    { label: "Scarlet ex", value: "スカーレットex", code: "SV1S", order: 20 },
    // Sword & Shield Series
    { label: "VSTAR Universe", value: "VSTARユニバース", code: "S12a", order: 30 },
    { label: "Paradigm Trigger", value: "パラダイムトリガー", code: "S12", order: 31 },
    { label: "Lost Abyss", value: "ロストアビス", code: "S11", order: 32 },
    { label: "Pokemon GO", value: "ポケモンGO", code: "S10b", order: 33 },
    { label: "Dark Phantasma", value: "ダークファンタズマ", code: "S10a", order: 34 },
    { label: "Time Gazer", value: "タイムゲイザー", code: "S10D", order: 35 },
    { label: "Space Juggler", value: "スペースジャグラー", code: "S10P", order: 36 },
    { label: "Star Birth", value: "スターバース", code: "S9", order: 37 },
    { label: "Fusion Arts", value: "フュージョンアーツ", code: "S8", order: 38 },
    { label: "Blue Sky Stream", value: "蒼空ストリーム", code: "S7R", order: 39 },
    { label: "Eevee Heroes", value: "イーブイヒーローズ", code: "S6a", order: 40 },
    // Sun & Moon Series
    { label: "GX Ultra Shiny", value: "GXウルトラシャイニー", code: "SM8b", order: 50 },
    { label: "Tag Bolt", value: "タッグボルト", code: "SM9", order: 51 },
    { label: "Dream League", value: "ドリームリーグ", code: "SM11b", order: 52 },
    // Special
    { label: "Promo Cards", value: "プロモーションカード", code: "PROMO", order: 90 },
    { label: "Other", value: "その他", code: null, order: 99 },
  ],
  ONEPIECE: [
    { label: "Royal Bloodline (OP-10)", value: "ロイヤルブラッドライン【OP-10】", code: "OP-10", order: 1 },
    { label: "Four Emperors (OP-09)", value: "四皇覚醒【OP-09】", code: "OP-09", order: 2 },
    { label: "Two Legends (OP-08)", value: "二つの伝説【OP-08】", code: "OP-08", order: 3 },
    { label: "500 Years Future (OP-07)", value: "500年後の未来【OP-07】", code: "OP-07", order: 4 },
    { label: "Wings of Captain (OP-06)", value: "双璧の覇者【OP-06】", code: "OP-06", order: 5 },
    { label: "Awakening of New Era (OP-05)", value: "新時代の主役【OP-05】", code: "OP-05", order: 6 },
    { label: "Kingdoms of Intrigue (OP-04)", value: "謀略の王国【OP-04】", code: "OP-04", order: 7 },
    { label: "Pillars of Strength (OP-03)", value: "強大な敵【OP-03】", code: "OP-03", order: 8 },
    { label: "Paramount War (OP-02)", value: "頂上決戦【OP-02】", code: "OP-02", order: 9 },
    { label: "Romance Dawn (OP-01)", value: "ROMANCE DAWN【OP-01】", code: "OP-01", order: 10 },
    { label: "Starter Deck", value: "スタートデッキ", code: "ST", order: 50 },
    { label: "Promo Cards", value: "プロモーションカード", code: "PROMO", order: 90 },
    { label: "Other", value: "その他", code: null, order: 99 },
  ],
}

// POST - Seed card sets (admin only, one-time use)
export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if already seeded
    const existingCount = await prisma.cardSet.count()
    if (existingCount > 0) {
      return NextResponse.json({
        message: `Database already has ${existingCount} card sets. Skipping seed.`,
        skipped: true,
        count: existingCount
      })
    }

    // Seed Pokemon card sets
    const pokemonSets = await Promise.all(
      INITIAL_CARD_SETS.POKEMON.map(set =>
        prisma.cardSet.create({
          data: {
            game: CardGame.POKEMON,
            label: set.label,
            value: set.value,
            code: set.code,
            order: set.order,
            isActive: true
          }
        })
      )
    )

    // Seed One Piece card sets
    const onepieceSets = await Promise.all(
      INITIAL_CARD_SETS.ONEPIECE.map(set =>
        prisma.cardSet.create({
          data: {
            game: CardGame.ONEPIECE,
            label: set.label,
            value: set.value,
            code: set.code,
            order: set.order,
            isActive: true
          }
        })
      )
    )

    return NextResponse.json({
      message: 'Card sets seeded successfully',
      count: {
        pokemon: pokemonSets.length,
        onepiece: onepieceSets.length,
        total: pokemonSets.length + onepieceSets.length
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error seeding card sets:', error)
    return NextResponse.json(
      { error: 'シード処理に失敗しました' },
      { status: 500 }
    )
  }
}
