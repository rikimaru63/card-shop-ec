// 公開フロント (トップ/一覧/検索) の商品並び順を生成する純粋関数。
//
// 背景:
//   公開 API `/api/products` は従来デフォルトで { createdAt: 'desc' } (登録の新しい順)
//   だけを返し、管理画面が設定する featured (トップ固定) / sortOrder を一切参照して
//   いなかった。そのため「特定カードをトップに固定」や「価格を変えても順位が上がる」
//   といった運用が公開側に反映されない状態だった。
//
// 方針:
//   - 既定 (newest / featured / popular など) では featured=true の商品を最上位に固定し、
//     その中は登録の新しい順とする。featured が全件 false の間は実質 createdAt 順のままで、
//     既存挙動からのデグレは起きない (チェックを入れて初めて並びが変わる)。
//   - 価格順・名前順をユーザーが明示選択した場合は、その意図を尊重して純粋にその順で並べる。

import type { Prisma } from '@prisma/client'

/**
 * sortBy クエリ値から Prisma の orderBy 配列を生成する。
 * 配列で返すのは、第1キー featured → 第2キー createdAt の多段ソートを表現するため。
 */
export function buildProductOrderBy(
  sortBy: string | null | undefined
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sortBy) {
    case 'price-asc':
      return [{ price: 'asc' }]
    case 'price-desc':
      return [{ price: 'desc' }]
    case 'name-asc':
    case 'name':
      return [{ name: 'asc' }]
    case 'newest':
    case 'popular':
    case 'featured':
    default:
      // featured (トップ固定) を最優先、その中は新着順。
      return [{ featured: 'desc' }, { createdAt: 'desc' }]
  }
}
