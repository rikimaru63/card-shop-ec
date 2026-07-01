"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Globe,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Database,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// 配送対象国の型（この画面内でのみ使用）
interface ShippingCountry {
  id: string
  code: string
  name: string
  nameJa: string | null
  enabledUS: boolean
  enabledEU: boolean
  order: number
  isActive: boolean
}

export default function ShippingCountriesPage() {
  const [countries, setCountries] = useState<ShippingCountry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 「国を追加」フォームの入力値
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [nameJa, setNameJa] = useState("")
  const [newEnabledUS, setNewEnabledUS] = useState(true)
  const [newEnabledEU, setNewEnabledEU] = useState(true)
  const [adding, setAdding] = useState(false)

  // 初期データ投入・行更新中の状態
  const [seeding, setSeeding] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  // 一覧を取得する（order の昇順で並べ替え）
  const fetchCountries = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/shipping-countries")
      const data = await response.json()
      if (response.ok) {
        const list: ShippingCountry[] = Array.isArray(data) ? data : []
        list.sort((a, b) => a.order - b.order)
        setCountries(list)
      } else {
        setError(data.error || "国リストの取得に失敗しました")
      }
    } catch (err) {
      setError("通信エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  // 画面を開いたときに一覧を取得
  useEffect(() => {
    fetchCountries()
  }, [])

  // 成功メッセージを数秒後に自動で消す
  const flashSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  // 国を追加する
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedCode = code.trim().toUpperCase()
    if (trimmedCode.length !== 2) {
      setError("国コードは2文字で入力してください（例: JP, US, DE）")
      return
    }
    if (!name.trim()) {
      setError("英語名を入力してください")
      return
    }

    setAdding(true)
    try {
      const response = await fetch("/api/admin/shipping-countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmedCode,
          name: name.trim(),
          nameJa: nameJa.trim() || undefined,
          enabledUS: newEnabledUS,
          enabledEU: newEnabledEU,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        // フォームをリセットして一覧を再取得
        setCode("")
        setName("")
        setNameJa("")
        setNewEnabledUS(true)
        setNewEnabledEU(true)
        await fetchCountries()
        flashSuccess(`「${trimmedCode}」を追加しました`)
      } else {
        setError(data.error || "国の追加に失敗しました")
      }
    } catch (err) {
      setError("通信エラーが発生しました")
    } finally {
      setAdding(false)
    }
  }

  // US表示・EU表示のチェックを変更して即保存（楽観更新 → 失敗時は再取得で戻す）
  const handleToggle = async (
    country: ShippingCountry,
    field: "enabledUS" | "enabledEU",
    value: boolean
  ) => {
    setError(null)
    setSuccess(null)
    setSavingId(country.id)

    // 楽観更新（画面を即座に反映）
    setCountries((prev) =>
      prev.map((c) => (c.id === country.id ? { ...c, [field]: value } : c))
    )

    try {
      const response = await fetch(
        `/api/admin/shipping-countries/${country.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        }
      )
      const data = await response.json()
      if (response.ok) {
        flashSuccess("保存しました")
      } else {
        setError(data.error || "保存に失敗しました")
        await fetchCountries()
      }
    } catch (err) {
      setError("通信エラーが発生しました")
      await fetchCountries()
    } finally {
      setSavingId(null)
    }
  }

  // 国を削除する
  const handleDelete = async (country: ShippingCountry) => {
    if (!confirm("この国を削除しますか？")) {
      return
    }
    setError(null)
    setSuccess(null)
    setSavingId(country.id)
    try {
      const response = await fetch(
        `/api/admin/shipping-countries/${country.id}`,
        { method: "DELETE" }
      )
      if (response.ok) {
        await fetchCountries()
        flashSuccess(`「${country.code}」を削除しました`)
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.error || "削除に失敗しました")
      }
    } catch (err) {
      setError("通信エラーが発生しました")
    } finally {
      setSavingId(null)
    }
  }

  // 初期データを一括投入する（冪等なので既存データがあっても押せる）
  const handleSeed = async () => {
    if (
      !confirm(
        "主要な国の初期データを投入します。よろしいですか？（既にある国は変更されません）"
      )
    ) {
      return
    }
    setError(null)
    setSuccess(null)
    setSeeding(true)
    try {
      const response = await fetch("/api/admin/shipping-countries/seed", {
        method: "POST",
      })
      const data = await response.json()
      if (response.ok) {
        await fetchCountries()
        flashSuccess("初期データを投入しました")
      } else {
        setError(data.error || "初期データの投入に失敗しました")
      }
    } catch (err) {
      setError("通信エラーが発生しました")
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">配送対象国の管理</h1>
              <p className="text-sm text-muted-foreground">
                会員登録・注文画面の「国/地域」の選択肢を編集します
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 説明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-900">
                ここで追加・削除した国が、会員登録と注文画面の「国/地域」の選択肢に反映されます。
                「US表示」は米国サイト、「EU表示」は欧州サイトでの表示可否を切り替えます。
              </p>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">エラー</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* 成功表示 */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* 国を追加フォーム */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Plus className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">国を追加</h2>
            </div>
            <form onSubmit={handleAdd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="code">
                    国コード（2文字） <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="JP"
                    maxLength={2}
                    className="mt-1 uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="name">
                    英語名 <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Japan"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nameJa">日本語名（任意）</Label>
                  <Input
                    id="nameJa"
                    value={nameJa}
                    onChange={(e) => setNameJa(e.target.value)}
                    placeholder="日本"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEnabledUS}
                    onChange={(e) => setNewEnabledUS(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">US表示</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEnabledEU}
                    onChange={(e) => setNewEnabledEU(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">EU表示</span>
                </label>
              </div>

              <div className="mt-4">
                <Button type="submit" disabled={adding}>
                  {adding ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  追加
                </Button>
              </div>
            </form>
          </div>

          {/* 一覧テーブル */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                登録済みの国（{countries.length}件）
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCountries}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                再読み込み
              </Button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                読み込み中...
              </div>
            ) : countries.length === 0 ? (
              // 一覧が空のとき：初期データ投入を案内
              <div className="p-8 text-center">
                <Database className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                <p className="text-muted-foreground mb-2">
                  まだ国が登録されていません。
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  下のボタンで主要な国をまとめて投入できます。
                </p>
                <Button onClick={handleSeed} disabled={seeding}>
                  {seeding ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  初期データを投入する
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">国コード</th>
                      <th className="text-left p-3 font-medium">英語名</th>
                      <th className="text-left p-3 font-medium">日本語名</th>
                      <th className="text-center p-3 font-medium">US表示</th>
                      <th className="text-center p-3 font-medium">EU表示</th>
                      <th className="text-center p-3 font-medium">削除</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {countries.map((country) => (
                      <tr key={country.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono">{country.code}</td>
                        <td className="p-3">{country.name}</td>
                        <td className="p-3 text-muted-foreground">
                          {country.nameJa || "—"}
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={country.enabledUS}
                            disabled={savingId === country.id}
                            onChange={(e) =>
                              handleToggle(
                                country,
                                "enabledUS",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={country.enabledEU}
                            disabled={savingId === country.id}
                            onChange={(e) =>
                              handleToggle(
                                country,
                                "enabledEU",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(country)}
                            disabled={savingId === country.id}
                            aria-label={`${country.code} を削除`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 初期データ投入（一覧に既存データがある場合も冪等に押せる） */}
          {!loading && countries.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold">初期データの投入</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                主要な国をまとめて投入します。既に登録済みの国は変更されないため、
                何度押しても安全です（不足している国だけが追加されます）。
              </p>
              <Button
                variant="outline"
                onClick={handleSeed}
                disabled={seeding}
              >
                {seeding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                初期データを投入する
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
