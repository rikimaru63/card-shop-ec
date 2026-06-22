"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Search, Loader2, ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import {
  DEFAULT_COPY_OPTIONS,
  type CopyOptions,
  type CopySourceProduct,
} from "@/lib/admin/product-copy"

interface SearchResultProduct {
  id: string
  name: string
  cardNumber?: string | null
  cardSet?: string | null
  price: number | string
  stock: number
  images?: { url: string }[]
}

interface CopyProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 選択した商品の詳細と、選んだコピーオプションを親へ渡す。 */
  onApply: (source: CopySourceProduct, options: CopyOptions) => void
}

/**
 * 「既存商品からコピー」用の検索ダイアログ。
 * 商品名/カード番号/SKU で検索 → 選択 → 詳細取得 → onApply で親フォームへ流し込む。
 * コピーの挙動（画像引継ぎ / 在庫リセット / 商品名サフィックス）はここのチェックボックスで選べる。
 */
export function CopyProductModal({ open, onOpenChange, onApply }: CopyProductModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResultProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [options, setOptions] = useState<CopyOptions>(DEFAULT_COPY_OPTIONS)

  // モーダルを開くたびに状態を初期化（オプションは既定値に戻す）。
  useEffect(() => {
    if (open) {
      setQuery("")
      setResults([])
      setOptions(DEFAULT_COPY_OPTIONS)
      setApplyingId(null)
    }
  }, [open])

  // 入力をデバウンスして検索（2文字以上）。
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=20`)
        if (res.ok) {
          const data = await res.json()
          setResults(Array.isArray(data.products) ? data.products : [])
        } else {
          setResults([])
        }
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [query, open])

  const handleSelect = useCallback(
    async (id: string) => {
      setApplyingId(id)
      try {
        const res = await fetch(`/api/admin/products/${id}`)
        if (!res.ok) throw new Error("fetch failed")
        const detail = (await res.json()) as CopySourceProduct
        onApply(detail, options)
        onOpenChange(false)
      } catch {
        toast({
          title: "エラー",
          description: "商品情報の取得に失敗しました",
          variant: "destructive",
        })
      } finally {
        setApplyingId(null)
      }
    },
    [options, onApply, onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>商品情報をコピー</DialogTitle>
          <DialogDescription>
            コピーしたい商品を検索して選ぶと、その情報が登録フォームに入力されます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 検索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              autoFocus
              placeholder="商品名・カード番号・SKUで検索（2文字以上）"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* コピーの設定（クライアントが運用に合わせて選択） */}
          <div className="rounded-md border bg-gray-50 p-3 space-y-2">
            <p className="text-xs font-medium text-gray-600">コピーの設定</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={options.copyImages}
                onChange={(e) => setOptions((o) => ({ ...o, copyImages: e.target.checked }))}
              />
              画像も引き継ぐ（別画像として複製。あとで差し替え・追加も可能）
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={options.resetStock}
                onChange={(e) => setOptions((o) => ({ ...o, resetStock: e.target.checked }))}
              />
              在庫数を0にする（オフ：コピー元の在庫をそのまま入れる）
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={options.appendCopySuffix}
                onChange={(e) => setOptions((o) => ({ ...o, appendCopySuffix: e.target.checked }))}
              />
              商品名の末尾に「のコピー」を付ける
            </label>
          </div>

          {/* 結果一覧 */}
          <div className="h-72 overflow-y-auto rounded-md border p-2">
            {searching ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                検索中...
              </div>
            ) : query.trim().length < 2 ? (
              <p className="flex items-center justify-center h-full text-sm text-gray-400">
                2文字以上で検索してください
              </p>
            ) : results.length === 0 ? (
              <p className="flex items-center justify-center h-full text-sm text-gray-400">
                該当する商品がありません
              </p>
            ) : (
              <ul className="space-y-1">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={applyingId !== null}
                      onClick={() => handleSelect(p.id)}
                      className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors disabled:opacity-50"
                    >
                      <span className="relative h-10 w-10 shrink-0 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                        {p.images?.[0]?.url ? (
                          <Image
                            src={p.images[0].url}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="object-cover h-10 w-10"
                            unoptimized
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-gray-300" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-sm">{p.name}</span>
                        <span className="block text-xs text-gray-500 truncate">
                          {p.cardNumber ? `No.${p.cardNumber}・` : ""}
                          {p.cardSet || ""}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap text-right">
                        ¥{Number(p.price).toLocaleString()}
                        <br />
                        在庫{p.stock}
                      </span>
                      {applyingId === p.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-amber-600">
            ※ 同じカード番号・状態・パックの組み合わせはそのままだと重複エラーになります。コピー後にカード番号や状態を調整してください。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
