// Server Action の Origin ヘッダー欠落補完を「安全に」許可してよいかを判定する純粋関数。
//
// 背景:
//   Coolify/Traefik や一部地域の CDN edge を経由すると、正規顧客の Server Action
//   POST から Origin ヘッダーが剥がれて届くことがある。Next.js は Origin が無いと
//   "Missing origin header from a forwarded Server Actions request." で reject するため、
//   Confirm Order ボタンが「押しても無反応」になっていた (ブルネイ顧客 Wen Chad,
//   リピーター顧客 Adrian の事例)。middleware で自サイト Origin を補完して救う。
//
// CSRF 安全性の考え方 (二重防御):
//   (1) NextAuth の session cookie は SameSite=lax。攻撃者の別ドメインからの
//       cross-site POST/fetch には cookie が乗らない → hasSessionCookie=false で弾ける。
//   (2) ブラウザが付与する Sec-Fetch-Site / Referer で「明確にクロスサイト」と判る
//       リクエストは補完しない。
//
// 旧実装の問題:
//   「Referer か Sec-Fetch-Site のどちらかが same-origin であること」を AND 必須に
//   していたため、プロキシが Origin に加えて Referer も Sec-Fetch-Site も剥がす環境では
//   全条件が false になり、正規顧客まで弾いていた。
//
// 本実装の方針:
//   「session cookie があり、かつ "明確なクロスサイトの証拠" が無い」場合に補完する。
//   ヘッダーが欠落 (= 判定不能) のときは、SameSite=lax cookie の保証に委ねて補完する。
//   ヘッダーが存在し、かつ別オリジンを指している場合のみ拒否する。

export interface OriginGuardInput {
  /** next-auth / admin の session cookie が存在するか (SameSite=lax 前提) */
  hasSessionCookie: boolean
  /** Referer ヘッダー値 (無ければ null) */
  referer: string | null
  /** Sec-Fetch-Site ヘッダー値 (無ければ null) */
  secFetchSite: string | null
  /** 自サイトの期待 origin (例: https://samuraicardhub.com) */
  expectedOrigin: string
}

/**
 * Origin 欠落の Server Action POST に対し、自サイト Origin を補完してよいかを返す。
 * @returns true = 補完して通す / false = 補完しない (Next.js が reject)
 */
export function shouldCompleteOrigin(input: OriginGuardInput): boolean {
  const { hasSessionCookie, referer, secFetchSite, expectedOrigin } = input

  // 大前提: session cookie が無ければ補完しない。
  // SameSite=lax により、攻撃者ドメインからの cross-site POST には cookie が乗らないため、
  // この一点で大半の CSRF を遮断できる。
  if (!hasSessionCookie) return false

  // 明確なクロスサイトの証拠 1: Referer が存在し、別オリジンを指している。
  // parse 不能な Referer は「判定不能」として扱い、これ単独では拒否しない
  // (プロキシによる改変の可能性があるため)。
  if (referer) {
    let refererOrigin: string | null = null
    try {
      refererOrigin = new URL(referer).origin
    } catch {
      refererOrigin = null
    }
    if (refererOrigin !== null && refererOrigin !== expectedOrigin) {
      return false
    }
  }

  // Sec-Fetch-Site はブラウザが fetch spec で強制設定し JS からは偽装不可。
  // 正規の Server Action fetch は必ず 'same-origin' になる。よって 'same-origin' のみ許可し、
  //   - 'same-site'  : 同一サイトの別サブドメイン (例 evil.samuraicardhub.com) → 拒否
  //   - 'cross-site' : 別サイト → 拒否
  //   - 'none'       : ユーザー直接遷移等 (Server Action fetch では発生しない) → 拒否
  // ヘッダー欠落 (null) のみ、プロキシ剥がしの正規顧客 (Adrian/ブルネイ顧客) 救済のため許可し、
  // session cookie の SameSite=lax 保証に委ねる。
  if (secFetchSite !== null && secFetchSite !== 'same-origin') {
    return false
  }

  // ここまで来た = session cookie 有り + 明確なクロスサイト証拠なし → 補完して通す。
  return true
}
