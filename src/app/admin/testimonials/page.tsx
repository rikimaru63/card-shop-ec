"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  ArrowUp,
  ArrowDown,
  MessageSquare,
} from "lucide-react"

export const dynamic = 'force-dynamic'

interface Testimonial {
  id: string
  customerName: string
  content: string
  imageUrl: string | null
  rating: number
  isVisible: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formImageUrl, setFormImageUrl] = useState("")
  const [formRating, setFormRating] = useState(5)
  const [formVisible, setFormVisible] = useState(true)

  const fetchTestimonials = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/testimonials")
      const data = await res.json()
      setTestimonials(data)
    } catch {
      toast({ title: "Error", description: "Failed to fetch testimonials", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTestimonials() }, [])

  const openCreateDialog = () => {
    setSelectedTestimonial(null)
    setFormName("")
    setFormContent("")
    setFormImageUrl("")
    setFormRating(5)
    setFormVisible(true)
    setEditDialogOpen(true)
  }

  const openEditDialog = (t: Testimonial) => {
    setSelectedTestimonial(t)
    setFormName(t.customerName)
    setFormContent(t.content)
    setFormImageUrl(t.imageUrl || "")
    setFormRating(t.rating)
    setFormVisible(t.isVisible)
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formContent.trim()) {
      toast({ title: "Error", description: "Name and content are required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const body = {
        customerName: formName,
        content: formContent,
        imageUrl: formImageUrl || null,
        rating: formRating,
        isVisible: formVisible,
        displayOrder: selectedTestimonial?.displayOrder ?? testimonials.length,
      }

      const url = selectedTestimonial
        ? `/api/admin/testimonials/${selectedTestimonial.id}`
        : "/api/admin/testimonials"

      const res = await fetch(url, {
        method: selectedTestimonial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast({ title: "Saved", description: selectedTestimonial ? "Testimonial updated" : "Testimonial created" })
        setEditDialogOpen(false)
        fetchTestimonials()
      } else {
        throw new Error("Save failed")
      }
    } catch {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTestimonial) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/testimonials/${selectedTestimonial.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: "Testimonial deleted" })
        setDeleteDialogOpen(false)
        setSelectedTestimonial(null)
        fetchTestimonials()
      } else {
        throw new Error("Delete failed")
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const toggleVisibility = async (t: Testimonial) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !t.isVisible }),
      })
      if (res.ok) {
        setTestimonials(prev =>
          prev.map(item => item.id === t.id ? { ...item, isVisible: !item.isVisible } : item)
        )
      }
    } catch {
      toast({ title: "Error", description: "Failed to toggle visibility", variant: "destructive" })
    }
  }

  const moveOrder = async (t: Testimonial, direction: "up" | "down") => {
    const idx = testimonials.findIndex(item => item.id === t.id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= testimonials.length) return

    const other = testimonials[swapIdx]
    try {
      await Promise.all([
        fetch(`/api/admin/testimonials/${t.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: other.displayOrder }),
        }),
        fetch(`/api/admin/testimonials/${other.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: t.displayOrder }),
        }),
      ])
      fetchTestimonials()
    } catch {
      toast({ title: "Error", description: "Failed to reorder", variant: "destructive" })
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-gray-600" />
          <h1 className="text-3xl font-bold">Customer Testimonials</h1>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead className="w-24">Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : testimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No testimonials yet. Click &quot;Add Testimonial&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              testimonials.map((t, idx) => (
                <TableRow key={t.id}>
                  <TableCell className="text-gray-400">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{t.customerName}</TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-sm text-gray-600 truncate">{t.content}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex">{renderStars(t.rating)}</div>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleVisibility(t)}>
                      {t.isVisible ? (
                        <Badge className="bg-green-100 text-green-800 cursor-pointer hover:opacity-80">
                          <Eye className="h-3 w-3 mr-1" /> Visible
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 cursor-pointer hover:opacity-80">
                          <EyeOff className="h-3 w-3 mr-1" /> Hidden
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveOrder(t, "up")}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveOrder(t, "down")}
                        disabled={idx === testimonials.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => { setSelectedTestimonial(t); setDeleteDialogOpen(true) }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            <DialogTitle>{selectedTestimonial ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
            <DialogDescription>
              {selectedTestimonial ? "Update customer testimonial details." : "Add a new customer testimonial."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. John D." />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Customer's testimonial..." rows={4} />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} placeholder="https://res.cloudinary.com/..." />
            </div>
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button key={i} onClick={() => setFormRating(i + 1)}>
                    <Star className={`h-6 w-6 cursor-pointer ${i < formRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-200"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="visible"
                checked={formVisible}
                onChange={(e) => setFormVisible(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="visible">Visible on frontend</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Testimonial</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the testimonial from &quot;{selectedTestimonial?.customerName}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
