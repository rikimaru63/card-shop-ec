"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, Mail } from "lucide-react"

const countries = [
  { code: "JP", name: "Japan" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "KR", name: "South Korea" },
  { code: "NZ", name: "New Zealand" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
]

export default function SignUpPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Account info
    email: "",
    password: "",
    confirmPassword: "",
    // Personal info
    firstName: "",
    lastName: "",
    phone: "",
    // Address
    country: "",
    postalCode: "",
    state: "",
    city: "",
    street1: "",
    street2: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleNext = () => {
    setError("")

    if (step === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError("すべての必須項目を入力してください")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError("パスワードが一致しません")
        return
      }
      if (formData.password.length < 8) {
        setError("パスワードは8文字以上で入力してください")
        return
      }
    }

    if (step === 2) {
      if (!formData.firstName || !formData.lastName) {
        setError("氏名を入力してください")
        return
      }
    }

    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Final validation
    if (!formData.country || !formData.postalCode || !formData.state || !formData.city || !formData.street1) {
      setError("住所の必須項目を入力してください")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          address: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            country: formData.country,
            postalCode: formData.postalCode,
            state: formData.state,
            city: formData.city,
            street1: formData.street1,
            street2: formData.street2 || undefined,
            phone: formData.phone || undefined,
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "登録に失敗しました")
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError("登録に失敗しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <CardTitle>確認メールを送信しました</CardTitle>
            <CardDescription>
              {formData.email} に確認メールを送信しました。
              メール内のリンクをクリックして、登録を完了してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </AlertDescription>
            </Alert>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                ログインページへ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">アカウント作成</CardTitle>
          <CardDescription>
            ステップ {step} / 3
          </CardDescription>
          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Account Info */}
            {step === 1 && (
              <>
                <h3 className="font-semibold">アカウント情報</h3>
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="8文字以上"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">パスワード（確認） *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="もう一度入力"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <>
                <h3 className="font-semibold">お客様情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">名 (First Name) *</Label>
                    <Input
                      id="firstName"
                      placeholder="Taro"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">姓 (Last Name) *</Label>
                    <Input
                      id="lastName"
                      placeholder="Yamada"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">電話番号（任意）</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+81 90-1234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">配送に関するご連絡に使用します</p>
                </div>
              </>
            )}

            {/* Step 3: Shipping Address */}
            {step === 3 && (
              <>
                <h3 className="font-semibold">配送先住所 (Shipping Address)</h3>
                <div className="space-y-2">
                  <Label htmlFor="country">国 (Country) *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="国を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">郵便番号 (Postal Code) *</Label>
                    <Input
                      id="postalCode"
                      placeholder="123-4567"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">都道府県/州 (State) *</Label>
                    <Input
                      id="state"
                      placeholder="Tokyo"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">市区町村 (City) *</Label>
                  <Input
                    id="city"
                    placeholder="Shibuya-ku"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street1">住所1 (Address Line 1) *</Label>
                  <Input
                    id="street1"
                    placeholder="1-2-3 Shibuya"
                    value={formData.street1}
                    onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street2">住所2 (Address Line 2)</Label>
                  <Input
                    id="street2"
                    placeholder="Building name, Room number"
                    value={formData.street2}
                    onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">建物名・部屋番号など（任意）</p>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <div className="flex gap-2 w-full">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                  戻る
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={handleNext} className="flex-1">
                  次へ
                </Button>
              ) : (
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    "アカウントを作成"
                  )}
                </Button>
              )}
            </div>

            <p className="text-sm text-center text-gray-600">
              既にアカウントをお持ちですか？{" "}
              <Link href="/auth/signin" className="text-primary hover:underline">
                ログイン
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
