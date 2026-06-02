// CSV エンコードユーティリティ
// - フィールドにカンマ・改行・引用符が含まれる場合は引用符で囲み、内部の引用符は二重化する。
// - 先頭に BOM を付ける (Excel が UTF-8 を正しく認識するため)。

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return ""
  const isNumber = typeof value === "number" || typeof value === "bigint"
  let s = String(value)
  // CSV Formula Injection 対策: 文字列フィールドで先頭が = + - @ TAB CR のとき、
  // Excel/Sheets が数式として評価しないよう先頭にシングルクォートを付与する。
  // 数値型はそのまま (数値計算用途を壊さない)。
  if (!isNumber && /^[=+\-@\t\r]/.test(s)) {
    s = "'" + s
  }
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function rowsToCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvField).join(",")
  const bodyLines = rows.map((row) => row.map(escapeCsvField).join(","))
  return ["﻿" + headerLine, ...bodyLines].join("\r\n")
}

// YYYY-MM-DD 形式 (タイムゾーンを考慮しない簡易フォーマット — ファイル名/集計キー用途)
export function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// CSV レスポンス用 Headers
export function csvResponseHeaders(filename: string): Record<string, string> {
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  }
}
