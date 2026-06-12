// 国コード (ISO 3166-1 alpha-2) → 日本語国名の対応表。
// 注文の shippingAddress.country および PageView.country はこのコード形式で保存される。
// レポート表示用に日本語名へ変換する。未知のコードはコードそのものを返す。

// チェックアウト/サインアップで選択可能な国 (baseCountries + euOnlyCountries) を網羅。
// 将来 CDN の geo ヘッダー由来で未掲載コードが来ても fallback でコード表示されるため安全。
const COUNTRY_NAMES_JA: Record<string, string> = {
  US: "アメリカ",
  GB: "イギリス",
  AU: "オーストラリア",
  CA: "カナダ",
  DE: "ドイツ",
  FR: "フランス",
  IT: "イタリア",
  ES: "スペイン",
  NL: "オランダ",
  BE: "ベルギー",
  CH: "スイス",
  AT: "オーストリア",
  SE: "スウェーデン",
  NO: "ノルウェー",
  DK: "デンマーク",
  FI: "フィンランド",
  JP: "日本",
  SG: "シンガポール",
  HK: "香港",
  TW: "台湾",
  KR: "韓国",
  NZ: "ニュージーランド",
  MX: "メキシコ",
  BR: "ブラジル",
  BN: "ブルネイ",
  CZ: "チェコ",
  ID: "インドネシア",
  MY: "マレーシア",
  PH: "フィリピン",
  TH: "タイ",
  // 2026-06 クライアント要望で追加した配送先国 (US/EU 両対応)
  AL: "アルバニア",
  TR: "トルコ",
  BY: "ベラルーシ",
  MT: "マルタ",
  MO: "マカオ",
  SK: "スロバキア",
  GR: "ギリシャ",
  HU: "ハンガリー",
  BA: "ボスニア・ヘルツェゴビナ",
  UA: "ウクライナ",
  // よく来そうな近隣国の補助エントリ (geo ヘッダー由来で来る可能性)
  IE: "アイルランド",
  PT: "ポルトガル",
  PL: "ポーランド",
  CN: "中国",
  IN: "インド",
}

// 国コードを正規化する。null/空文字/不正値は null を返す。
export function normalizeCountryCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const code = raw.trim().toUpperCase()
  // ISO alpha-2 (英字2文字) のみ受け付ける。"XX"/"T1" 等の CDN 特殊値は除外。
  if (!/^[A-Z]{2}$/.test(code)) return null
  if (code === "XX" || code === "T1") return null
  return code
}

// 国コードを日本語表示名に変換する。null/未知のコードのフォールバックを含む。
export function countryDisplayName(code: string | null | undefined): string {
  if (!code) return "不明"
  const normalized = code.trim().toUpperCase()
  return COUNTRY_NAMES_JA[normalized] ?? normalized
}
