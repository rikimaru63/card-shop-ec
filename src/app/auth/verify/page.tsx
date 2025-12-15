"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      setMessage('確認リンクが無効です')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message)
          // Redirect to signin after 3 seconds
          setTimeout(() => router.push('/auth/signin'), 3000)
        } else {
          setStatus('error')
          setMessage(data.message)
        }
      } catch (error) {
        setStatus('error')
        setMessage('確認に失敗しました。もう一度お試しください。')
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && <Loader2 className="h-16 w-16 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle className="h-16 w-16 text-green-500" />}
            {status === 'error' && <XCircle className="h-16 w-16 text-red-500" />}
            {status === 'no-token' && <Mail className="h-16 w-16 text-gray-400" />}
          </div>
          <CardTitle>
            {status === 'loading' && '確認中...'}
            {status === 'success' && '確認完了'}
            {status === 'error' && '確認失敗'}
            {status === 'no-token' && 'メール確認'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              3秒後にログインページへ移動します...
            </p>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                リンクの有効期限が切れているか、既に確認済みの可能性があります。
              </p>
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full">
                  ログインページへ
                </Button>
              </Link>
            </div>
          )}

          {status === 'no-token' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                登録時に送信された確認メールのリンクをクリックしてください。
              </p>
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full">
                  ログインページへ
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
