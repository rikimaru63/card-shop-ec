"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  Calendar
} from "lucide-react"

export const dynamic = 'force-dynamic'

interface CardSet {
  id: string
  game: string
  label: string
  value: string
  code: string | null
  releaseDate: string | null
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

const gameLabels: Record<string, string> = {
  POKEMON: "ポケモン",
  ONEPIECE: "ワンピース",
  OTHER: "その他"
}

const gameColors: Record<string, string> = {
  POKEMON: "bg-yellow-100 text-yellow-800",
  ONEPIECE: "bg-red-100 text-red-800",
  OTHER: "bg-gray-100 text-gray-800"
}

export default function CardSetsPage() {
  const [cardSets, setCardSets] = useState<CardSet[]>([])
  const [loading, setLoading] = useState(true)
  const [filterGame, setFilterGame] = useState<string>("all")

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCardSet, setSelectedCardSet] = useState<CardSet | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    game: "POKEMON",
    label: "",
    value: "",
    code: "",
    releaseDate: "",
    isActive: true,
    order: 0
  })

  const fetchCardSets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/card-sets')
      const data = await response.json()
      setCardSets(data)
    } catch (error) {
      toast({
        title: "エラー",
        description: "カードセットの取得に失敗しました",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCardSets()
  }, [])

  const handleCreate = () => {
    setIsCreating(true)
    setFormData({
      game: "POKEMON",
      label: "",
      value: "",
      code: "",
      releaseDate: "",
      isActive: true,
      order: 0
    })
    setEditDialogOpen(true)
  }

  const handleEdit = (cardSet: CardSet) => {
    setIsCreating(false)
    setSelectedCardSet(cardSet)
    setFormData({
      game: cardSet.game,
      label: cardSet.label,
      value: cardSet.value,
      code: cardSet.code || "",
      releaseDate: cardSet.releaseDate ? cardSet.releaseDate.split('T')[0] : "",
      isActive: cardSet.isActive,
      order: cardSet.order
    })
    setEditDialogOpen(true)
  }

  const handleDelete = (cardSet: CardSet) => {
    setSelectedCardSet(cardSet)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const url = isCreating
        ? '/api/admin/card-sets'
        : `/api/admin/card-sets/${selectedCardSet?.id}`

      const method = isCreating ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          code: formData.code || null,
          releaseDate: formData.releaseDate || null
        })
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: isCreating ? "カードセットを作成しました" : "カードセットを更新しました"
        })
        setEditDialogOpen(false)
        fetchCardSets()
      } else {
        const error = await response.json()
        throw new Error(error.error || '操作に失敗しました')
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "操作に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedCardSet) return

    try {
      const response = await fetch(`/api/admin/card-sets/${selectedCardSet.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "カードセットを削除しました"
        })
        setDeleteDialogOpen(false)
        fetchCardSets()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "削除に失敗しました",
        variant: "destructive"
      })
    }
  }

  const toggleActive = async (cardSet: CardSet) => {
    try {
      const response = await fetch(`/api/admin/card-sets/${cardSet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !cardSet.isActive
        })
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: cardSet.isActive ? "カードセットを非表示にしました" : "カードセットを表示しました"
        })
        fetchCardSets()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "更新に失敗しました",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Filter card sets
  const filteredCardSets = filterGame === "all"
    ? cardSets
    : cardSets.filter(cs => cs.game === filterGame)

  // Count by game
  const countByGame = {
    POKEMON: cardSets.filter(cs => cs.game === 'POKEMON').length,
    ONEPIECE: cardSets.filter(cs => cs.game === 'ONEPIECE').length,
    OTHER: cardSets.filter(cs => cs.game === 'OTHER').length
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">カードセット管理</h1>
          <p className="text-muted-foreground mt-1">
            新弾をここから追加すると、フィルターに反映されます
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新規追加
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">ポケモン</span>
          </div>
          <p className="text-2xl font-bold mt-2">{countByGame.POKEMON} セット</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-red-600" />
            <span className="font-medium">ワンピース</span>
          </div>
          <p className="text-2xl font-bold mt-2">{countByGame.ONEPIECE} セット</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-gray-600" />
            <span className="font-medium">その他</span>
          </div>
          <p className="text-2xl font-bold mt-2">{countByGame.OTHER} セット</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label>フィルター:</Label>
        <Select value={filterGame} onValueChange={setFilterGame}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて ({cardSets.length})</SelectItem>
            <SelectItem value="POKEMON">ポケモン ({countByGame.POKEMON})</SelectItem>
            <SelectItem value="ONEPIECE">ワンピース ({countByGame.ONEPIECE})</SelectItem>
            <SelectItem value="OTHER">その他 ({countByGame.OTHER})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Card Sets Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ゲーム</TableHead>
              <TableHead>表示名 (英語)</TableHead>
              <TableHead>値 (日本語)</TableHead>
              <TableHead>コード</TableHead>
              <TableHead>発売日</TableHead>
              <TableHead>順序</TableHead>
              <TableHead>状態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : filteredCardSets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  カードセットがありません
                </TableCell>
              </TableRow>
            ) : (
              filteredCardSets.map((cardSet) => (
                <TableRow key={cardSet.id}>
                  <TableCell>
                    <Badge className={`${gameColors[cardSet.game]} w-fit`}>
                      {gameLabels[cardSet.game]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{cardSet.label}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cardSet.value}
                  </TableCell>
                  <TableCell>
                    {cardSet.code ? (
                      <Badge variant="outline">{cardSet.code}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(cardSet.releaseDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{cardSet.order}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={cardSet.isActive}
                      onCheckedChange={() => toggleActive(cardSet)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cardSet)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(cardSet)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isCreating ? "新規カードセット" : "カードセットを編集"}</DialogTitle>
            <DialogDescription>
              フィルターに表示されるカードセットを{isCreating ? "追加" : "編集"}します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ゲーム *</Label>
              <Select
                value={formData.game}
                onValueChange={(value) => setFormData({ ...formData, game: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POKEMON">ポケモン</SelectItem>
                  <SelectItem value="ONEPIECE">ワンピース</SelectItem>
                  <SelectItem value="OTHER">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>表示名 (英語) *</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="例: Battle Partners"
              />
              <p className="text-xs text-gray-500">フィルターに表示される名前</p>
            </div>

            <div className="space-y-2">
              <Label>値 (日本語) *</Label>
              <Input
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="例: バトルパートナーズ"
              />
              <p className="text-xs text-gray-500">商品のカードセット名とマッチング用</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>セットコード</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="例: SV9, OP-10"
                />
              </div>
              <div className="space-y-2">
                <Label>発売日</Label>
                <Input
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>表示順序</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500">小さいほど上に表示</p>
              </div>
              <div className="space-y-2">
                <Label>表示状態</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <span className="text-sm">{formData.isActive ? "表示" : "非表示"}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={!formData.label || !formData.value}>
              {isCreating ? "追加" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カードセットを削除</DialogTitle>
            <DialogDescription>
              「{selectedCardSet?.label}」を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
