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
  Bell,
  AlertTriangle,
  AlertCircle,
  Tag,
  Calendar
} from "lucide-react"

export const dynamic = 'force-dynamic'

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  isActive: boolean
  priority: number
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

const typeLabels: Record<string, string> = {
  INFO: "お知らせ",
  WARNING: "注意",
  URGENT: "緊急",
  PROMOTION: "キャンペーン"
}

const typeColors: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800",
  WARNING: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-800",
  PROMOTION: "bg-green-100 text-green-800"
}

const typeIcons: Record<string, React.ReactNode> = {
  INFO: <Bell className="h-4 w-4" />,
  WARNING: <AlertTriangle className="h-4 w-4" />,
  URGENT: <AlertCircle className="h-4 w-4" />,
  PROMOTION: <Tag className="h-4 w-4" />
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "INFO",
    isActive: true,
    priority: 0,
    startDate: "",
    endDate: ""
  })

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/announcements')
      const data = await response.json()
      setAnnouncements(data)
    } catch (error) {
      toast({
        title: "エラー",
        description: "お知らせの取得に失敗しました",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleCreate = () => {
    setIsCreating(true)
    setFormData({
      title: "",
      content: "",
      type: "INFO",
      isActive: true,
      priority: 0,
      startDate: "",
      endDate: ""
    })
    setEditDialogOpen(true)
  }

  const handleEdit = (announcement: Announcement) => {
    setIsCreating(false)
    setSelectedAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isActive: announcement.isActive,
      priority: announcement.priority,
      startDate: announcement.startDate ? announcement.startDate.split('T')[0] : "",
      endDate: announcement.endDate ? announcement.endDate.split('T')[0] : ""
    })
    setEditDialogOpen(true)
  }

  const handleDelete = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const url = isCreating
        ? '/api/admin/announcements'
        : `/api/admin/announcements/${selectedAnnouncement?.id}`

      const method = isCreating ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null
        })
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: isCreating ? "お知らせを作成しました" : "お知らせを更新しました"
        })
        setEditDialogOpen(false)
        fetchAnnouncements()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "操作に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedAnnouncement) return

    try {
      const response = await fetch(`/api/admin/announcements/${selectedAnnouncement.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "お知らせを削除しました"
        })
        setDeleteDialogOpen(false)
        fetchAnnouncements()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "削除に失敗しました",
        variant: "destructive"
      })
    }
  }

  const toggleActive = async (announcement: Announcement) => {
    try {
      const response = await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...announcement,
          isActive: !announcement.isActive
        })
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: announcement.isActive ? "お知らせを非表示にしました" : "お知らせを表示しました"
        })
        fetchAnnouncements()
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">お知らせ管理</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>

      {/* Announcements Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイプ</TableHead>
              <TableHead>タイトル</TableHead>
              <TableHead>表示期間</TableHead>
              <TableHead>優先度</TableHead>
              <TableHead>状態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  お知らせがありません
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>
                    <Badge className={`${typeColors[announcement.type]} flex items-center gap-1 w-fit`}>
                      {typeIcons[announcement.type]}
                      {typeLabels[announcement.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{announcement.title}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {announcement.content}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {announcement.startDate || announcement.endDate ? (
                        <span>
                          {formatDate(announcement.startDate)} ~ {formatDate(announcement.endDate)}
                        </span>
                      ) : (
                        <span className="text-gray-400">制限なし</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{announcement.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={announcement.isActive}
                      onCheckedChange={() => toggleActive(announcement)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(announcement)}
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
            <DialogTitle>{isCreating ? "新規お知らせ" : "お知らせを編集"}</DialogTitle>
            <DialogDescription>
              ホームページに表示されるお知らせを{isCreating ? "作成" : "編集"}します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>タイプ</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">お知らせ</SelectItem>
                  <SelectItem value="WARNING">注意</SelectItem>
                  <SelectItem value="URGENT">緊急</SelectItem>
                  <SelectItem value="PROMOTION">キャンペーン</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>タイトル *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="お知らせのタイトル"
              />
            </div>

            <div className="space-y-2">
              <Label>内容 *</Label>
              <textarea
                className="w-full px-3 py-2 rounded-md border border-input bg-background min-h-[100px]"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="お知らせの内容"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>開始日</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>終了日</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>優先度</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500">数字が大きいほど上に表示</p>
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
            <Button onClick={handleSave} disabled={!formData.title || !formData.content}>
              {isCreating ? "作成" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>お知らせを削除</DialogTitle>
            <DialogDescription>
              「{selectedAnnouncement?.title}」を削除しますか？この操作は取り消せません。
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
