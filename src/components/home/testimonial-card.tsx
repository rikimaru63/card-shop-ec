"use client"

import { Star } from "lucide-react"

export interface Testimonial {
  id: string
  customerName: string
  content: string
  imageUrl: string | null
  rating: number
  displayOrder: number
}

interface TestimonialCardProps {
  testimonial: Testimonial
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const initials = testimonial.customerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="select-none px-2">
      {/* iPhone モックアップ外枠 */}
      <div className="relative mx-auto w-full max-w-[280px] rounded-[2rem] border-[3px] border-gray-800 bg-gray-800 p-1.5 shadow-xl">
        {/* ノッチ */}
        <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-gray-800" />

        {/* スクリーン */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-white">
          {/* インスタDM風ヘッダー */}
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 pb-2 pt-7">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-red-400 to-yellow-400 text-[11px] font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {testimonial.customerName}
              </p>
            </div>
          </div>

          {/* メッセージエリア */}
          <div className="min-h-[200px] px-3 py-3">
            {testimonial.imageUrl ? (
              /* 画像がある場合 */
              <div className="overflow-hidden rounded-xl">
                <img
                  src={testimonial.imageUrl}
                  alt={`${testimonial.customerName}'s review`}
                  className="h-auto w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              /* テキストのみの場合：チャットバブル風 */
              <div className="flex justify-start">
                <div className="relative max-w-[85%] rounded-2xl rounded-tl-sm bg-gray-100 px-3.5 py-2.5">
                  <p className="text-sm leading-relaxed text-gray-800">
                    {testimonial.content}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 星評価フッター */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <div className="flex items-center justify-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < testimonial.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
