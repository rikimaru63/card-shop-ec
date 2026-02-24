"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Sparkles, Gamepad2, Package, Shield, Database } from "lucide-react"

export const dynamic = 'force-dynamic'

// Types
interface RarityOption {
  id: string
  game: string
  code: string
  label: string
  order: number
  isActive: boolean
}

interface GameOption {
  id: string
  code: string
  label: string
  labelJa: string | null
  categorySlug: string | null
  order: number
  isActive: boolean
}

interface ProductTypeOption {
  id: string
  code: string
  label: string
  labelJa: string | null
  order: number
  isActive: boolean
}

interface ConditionOption {
  id: string
  code: string
  label: string
  labelJa: string | null
  description: string | null
  order: number
  isActive: boolean
}

export default function FilterSettingsPage() {
  // Data states
  const [rarities, setRarities] = useState<RarityOption[]>([])
  const [games, setGames] = useState<GameOption[]>([])
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([])
  const [conditions, setConditions] = useState<ConditionOption[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'rarity' | 'game' | 'productType' | 'condition'>('rarity')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({})

  // Seeding state
  const [seeding, setSeeding] = useState(false)

  // Fetch all data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [raritiesRes, gamesRes, typesRes, conditionsRes] = await Promise.all([
        fetch('/api/admin/rarities'),
        fetch('/api/admin/game-options'),
        fetch('/api/admin/product-types'),
        fetch('/api/admin/conditions')
      ])

      setRarities(await raritiesRes.json())
      setGames(await gamesRes.json())
      setProductTypes(await typesRes.json())
      setConditions(await conditionsRes.json())
    } catch (error) {
      toast({ title: "エラー", description: "データの取得に失敗しました", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Seed initial data
  const handleSeed = async () => {
    if (!confirm('初期データを投入しますか？既存のデータはスキップされます。')) return

    setSeeding(true)
    try {
      const response = await fetch('/api/admin/filter-options/seed', { method: 'POST' })
      const data = await response.json()

      if (response.ok) {
        toast({
          title: "シード完了",
          description: `レアリティ: ${data.results.rarities.created}件作成, ゲーム: ${data.results.games.created}件作成, 商品タイプ: ${data.results.productTypes.created}件作成, コンディション: ${data.results.conditions.created}件作成`
        })
        fetchData()
      } else {
        throw new Error(data.error || 'Failed')
      }
    } catch (error) {
      toast({ title: "エラー", description: "シードに失敗しました", variant: "destructive" })
    } finally {
      setSeeding(false)
    }
  }

  // Open create dialog
  const handleCreate = (type: typeof dialogType) => {
    setDialogType(type)
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      game: 'POKEMON',
      code: '',
      label: '',
      labelJa: '',
      categorySlug: '',
      description: '',
      order: 0,
      isActive: true
    })
    setDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (type: typeof dialogType, item: RarityOption | GameOption | ProductTypeOption | ConditionOption) => {
    setDialogType(type)
    setIsCreating(false)
    setEditingId(item.id)
    setFormData(item as unknown as Record<string, string | number | boolean>)
    setDialogOpen(true)
  }

  // Save item
  const handleSave = async () => {
    const endpoints: Record<string, string> = {
      rarity: '/api/admin/rarities',
      game: '/api/admin/game-options',
      productType: '/api/admin/product-types',
      condition: '/api/admin/conditions'
    }

    const url = isCreating
      ? endpoints[dialogType]
      : `${endpoints[dialogType]}/${editingId}`

    try {
      const response = await fetch(url, {
        method: isCreating ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({ title: "成功", description: isCreating ? "作成しました" : "更新しました" })
        setDialogOpen(false)
        fetchData()
      } else {
        throw new Error('Failed')
      }
    } catch (error) {
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
    }
  }

  // Delete item
  const handleDelete = async (type: typeof dialogType, id: string) => {
    if (!confirm('削除してもよろしいですか？')) return

    const endpoints: Record<string, string> = {
      rarity: '/api/admin/rarities',
      game: '/api/admin/game-options',
      productType: '/api/admin/product-types',
      condition: '/api/admin/conditions'
    }

    try {
      const response = await fetch(`${endpoints[type]}/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: "成功", description: "削除しました" })
        fetchData()
      }
    } catch (error) {
      toast({ title: "エラー", description: "削除に失敗しました", variant: "destructive" })
    }
  }

  // Toggle active status
  const handleToggleActive = async (type: typeof dialogType, id: string, isActive: boolean) => {
    const endpoints: Record<string, string> = {
      rarity: '/api/admin/rarities',
      game: '/api/admin/game-options',
      productType: '/api/admin/product-types',
      condition: '/api/admin/conditions'
    }

    try {
      await fetch(`${endpoints[type]}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      fetchData()
    } catch (error) {
      toast({ title: "エラー", description: "更新に失敗しました", variant: "destructive" })
    }
  }

  // Render form fields based on dialog type
  const renderFormFields = () => {
    switch (dialogType) {
      case 'rarity':
        return (
          <>
            <div className="space-y-2">
              <Label>ゲーム *</Label>
              <Select
                value={formData.game as string}
                onValueChange={(v) => setFormData({ ...formData, game: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POKEMON">ポケモン</SelectItem>
                  <SelectItem value="ONEPIECE">ワンピース</SelectItem>
                  <SelectItem value="OTHER">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>コード *</Label>
              <Input
                value={formData.code as string}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="SAR, UR, SR..."
              />
            </div>
            <div className="space-y-2">
              <Label>表示名 *</Label>
              <Input
                value={formData.label as string}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="SAR"
              />
            </div>
          </>
        )

      case 'game':
        return (
          <>
            <div className="space-y-2">
              <Label>コード *</Label>
              <Input
                value={formData.code as string}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="pokemon, onepiece..."
              />
            </div>
            <div className="space-y-2">
              <Label>表示名 (英語) *</Label>
              <Input
                value={formData.label as string}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Pokemon"
              />
            </div>
            <div className="space-y-2">
              <Label>表示名 (日本語)</Label>
              <Input
                value={formData.labelJa as string || ''}
                onChange={(e) => setFormData({ ...formData, labelJa: e.target.value })}
                placeholder="ポケモン"
              />
            </div>
            <div className="space-y-2">
              <Label>カテゴリスラッグ</Label>
              <Input
                value={formData.categorySlug as string || ''}
                onChange={(e) => setFormData({ ...formData, categorySlug: e.target.value })}
                placeholder="pokemon-cards"
              />
            </div>
          </>
        )

      case 'productType':
        return (
          <>
            <div className="space-y-2">
              <Label>コード *</Label>
              <Input
                value={formData.code as string}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="SINGLE, BOX..."
              />
            </div>
            <div className="space-y-2">
              <Label>表示名 (英語) *</Label>
              <Input
                value={formData.label as string}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Single Cards"
              />
            </div>
            <div className="space-y-2">
              <Label>表示名 (日本語)</Label>
              <Input
                value={formData.labelJa as string || ''}
                onChange={(e) => setFormData({ ...formData, labelJa: e.target.value })}
                placeholder="シングルカード"
              />
            </div>
          </>
        )

      case 'condition':
        return (
          <>
            <div className="space-y-2">
              <Label>コード *</Label>
              <Input
                value={formData.code as string}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="GRADE_A, SEALED..."
              />
            </div>
            <div className="space-y-2">
              <Label>表示名 (英語) *</Label>
              <Input
                value={formData.label as string}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Grade A (Near Mint)"
              />
            </div>
            <div className="space-y-2">
              <Label>表示名 (日本語)</Label>
              <Input
                value={formData.labelJa as string || ''}
                onChange={(e) => setFormData({ ...formData, labelJa: e.target.value })}
                placeholder="グレードA（美品）"
              />
            </div>
            <div className="space-y-2">
              <Label>説明</Label>
              <Input
                value={formData.description as string || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ほぼ傷なし、美品"
              />
            </div>
          </>
        )
    }
  }

  const dialogTitles: Record<string, string> = {
    rarity: 'レアリティ',
    game: 'ゲームタイプ',
    productType: '商品タイプ',
    condition: 'コンディション'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">フィルター設定</h1>
          <p className="text-muted-foreground mt-1">
            フィルターに表示される項目を管理します
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleSeed}
          disabled={seeding}
        >
          <Database className="h-4 w-4 mr-2" />
          {seeding ? '処理中...' : '初期データ投入'}
        </Button>
      </div>

      <Tabs defaultValue="rarities">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rarities" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            レアリティ
          </TabsTrigger>
          <TabsTrigger value="games" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            ゲーム
          </TabsTrigger>
          <TabsTrigger value="productTypes" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            商品タイプ
          </TabsTrigger>
          <TabsTrigger value="conditions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            コンディション
          </TabsTrigger>
        </TabsList>

        {/* Rarities Tab */}
        <TabsContent value="rarities" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              ゲームごとのレアリティを管理 ({rarities.length}件)
            </p>
            <Button onClick={() => handleCreate('rarity')}>
              <Plus className="h-4 w-4 mr-2" />追加
            </Button>
          </div>
          <div className="bg-white rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ゲーム</TableHead>
                  <TableHead>コード</TableHead>
                  <TableHead>表示名</TableHead>
                  <TableHead>順序</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">読み込み中...</TableCell></TableRow>
                ) : rarities.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">データがありません</TableCell></TableRow>
                ) : (
                  rarities.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><Badge variant="outline">{item.game}</Badge></TableCell>
                      <TableCell className="font-mono">{item.code}</TableCell>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{item.order}</TableCell>
                      <TableCell>
                        <Switch checked={item.isActive} onCheckedChange={() => handleToggleActive('rarity', item.id, item.isActive)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit('rarity', item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete('rarity', item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">カードゲームの種類 ({games.length}件)</p>
            <Button onClick={() => handleCreate('game')}><Plus className="h-4 w-4 mr-2" />追加</Button>
          </div>
          <div className="bg-white rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>コード</TableHead>
                  <TableHead>表示名</TableHead>
                  <TableHead>日本語名</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>順序</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">読み込み中...</TableCell></TableRow>
                ) : games.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">データがありません</TableCell></TableRow>
                ) : (
                  games.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.code}</TableCell>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{item.labelJa || '-'}</TableCell>
                      <TableCell>{item.categorySlug || '-'}</TableCell>
                      <TableCell>{item.order}</TableCell>
                      <TableCell>
                        <Switch checked={item.isActive} onCheckedChange={() => handleToggleActive('game', item.id, item.isActive)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit('game', item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete('game', item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Product Types Tab */}
        <TabsContent value="productTypes" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">商品タイプ ({productTypes.length}件)</p>
            <Button onClick={() => handleCreate('productType')}><Plus className="h-4 w-4 mr-2" />追加</Button>
          </div>
          <div className="bg-white rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>コード</TableHead>
                  <TableHead>表示名</TableHead>
                  <TableHead>日本語名</TableHead>
                  <TableHead>順序</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">読み込み中...</TableCell></TableRow>
                ) : productTypes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">データがありません</TableCell></TableRow>
                ) : (
                  productTypes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.code}</TableCell>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{item.labelJa || '-'}</TableCell>
                      <TableCell>{item.order}</TableCell>
                      <TableCell>
                        <Switch checked={item.isActive} onCheckedChange={() => handleToggleActive('productType', item.id, item.isActive)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit('productType', item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete('productType', item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">コンディション ({conditions.length}件)</p>
            <Button onClick={() => handleCreate('condition')}><Plus className="h-4 w-4 mr-2" />追加</Button>
          </div>
          <div className="bg-white rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>コード</TableHead>
                  <TableHead>表示名</TableHead>
                  <TableHead>日本語名</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>順序</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">読み込み中...</TableCell></TableRow>
                ) : conditions.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">データがありません</TableCell></TableRow>
                ) : (
                  conditions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.code}</TableCell>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{item.labelJa || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                      <TableCell>{item.order}</TableCell>
                      <TableCell>
                        <Switch checked={item.isActive} onCheckedChange={() => handleToggleActive('condition', item.id, item.isActive)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit('condition', item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete('condition', item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreating ? '新規作成' : '編集'}: {dialogTitles[dialogType]}</DialogTitle>
            <DialogDescription>フィルターに表示される項目を{isCreating ? '追加' : '編集'}します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {renderFormFields()}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>表示順序</Label>
                <Input
                  type="number"
                  value={formData.order as number}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>状態</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={formData.isActive as boolean}
                    onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
                  />
                  <span>{formData.isActive ? '有効' : '無効'}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave}>{isCreating ? '作成' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
