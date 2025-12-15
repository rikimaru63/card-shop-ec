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
import { Search, UserCog, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react"

export const dynamic = 'force-dynamic'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  emailVerified: string | null
  image: string | null
  _count: {
    orders: number
  }
}

interface UserDetail extends User {
  orders: Array<{
    id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
  }>
  addresses: Array<{
    id: string
    name: string
    address: string
    city: string
  }>
  _count: {
    orders: number
    reviews: number
  }
}

const roleLabels: Record<string, string> = {
  CUSTOMER: "顧客",
  STAFF: "スタッフ",
  ADMIN: "管理者",
  SUPER_ADMIN: "スーパー管理者"
}

const roleColors: Record<string, string> = {
  CUSTOMER: "bg-gray-100 text-gray-800",
  STAFF: "bg-blue-100 text-blue-800",
  ADMIN: "bg-purple-100 text-purple-800",
  SUPER_ADMIN: "bg-red-100 text-red-800"
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState("")


  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter && roleFilter !== "all") params.set('role', roleFilter)
      params.set('page', page.toString())

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      setUsers(data.users || [])
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (error) {
      toast({
        title: "エラー",
        description: "ユーザーの取得に失敗しました",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const fetchUserDetail = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()
      setSelectedUser(data)
      return data
    } catch (error) {
      toast({
        title: "エラー",
        description: "ユーザー詳細の取得に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleViewDetail = async (user: User) => {
    await fetchUserDetail(user.id)
    setDetailDialogOpen(true)
  }

  const handleEditRole = async (user: User) => {
    await fetchUserDetail(user.id)
    setNewRole(user.role)
    setRoleDialogOpen(true)
  }

  const handleRoleUpdate = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "ユーザーロールを更新しました"
        })
        setRoleDialogOpen(false)
        fetchUsers()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ロールの更新に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "ユーザーを削除しました"
        })
        setDeleteDialogOpen(false)
        fetchUsers()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ユーザーの削除に失敗しました",
        variant: "destructive"
      })
    }
  }

  const confirmDelete = async (user: User) => {
    await fetchUserDetail(user.id)
    setDeleteDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">顧客管理</h1>
        <span className="text-gray-500">{total}人のユーザー</span>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="名前またはメールで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">検索</Button>
        </form>

        <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ロール" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="CUSTOMER">顧客</SelectItem>
            <SelectItem value="STAFF">スタッフ</SelectItem>
            <SelectItem value="ADMIN">管理者</SelectItem>
            <SelectItem value="SUPER_ADMIN">スーパー管理者</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ユーザー</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>ロール</TableHead>
              <TableHead>注文数</TableHead>
              <TableHead>登録日</TableHead>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  ユーザーが見つかりません
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.image ? (
                          <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {(user.name || user.email)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{user.name || "未設定"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>{user._count.orders}件</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(user)}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => confirmDelete(user)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              {total}件中 {(page - 1) * 20 + 1} - {Math.min(page * 20, total)}件
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1 text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ユーザー詳細</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">名前</label>
                  <p className="font-medium">{selectedUser.name || "未設定"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">メールアドレス</label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">ロール</label>
                  <p>
                    <Badge className={roleColors[selectedUser.role]}>
                      {roleLabels[selectedUser.role]}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">登録日</label>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">注文数</label>
                  <p className="font-medium">{selectedUser._count.orders}件</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">レビュー数</label>
                  <p className="font-medium">{selectedUser._count.reviews}件</p>
                </div>
              </div>

              {selectedUser.orders.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">最近の注文</h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {selectedUser.orders.map((order) => (
                      <div key={order.id} className="flex justify-between items-center text-sm">
                        <span>#{order.orderNumber}</span>
                        <span>¥{Number(order.total).toLocaleString()}</span>
                        <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Edit Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ロールを変更</DialogTitle>
            <DialogDescription>
              {selectedUser?.name || selectedUser?.email} のロールを変更します
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOMER">顧客</SelectItem>
              <SelectItem value="STAFF">スタッフ</SelectItem>
              <SelectItem value="ADMIN">管理者</SelectItem>
              <SelectItem value="SUPER_ADMIN">スーパー管理者</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleRoleUpdate}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザーを削除</DialogTitle>
            <DialogDescription>
              本当に {selectedUser?.name || selectedUser?.email} を削除しますか？
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
