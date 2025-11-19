"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  ArrowLeft,
  Download,
  Upload
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"

// Mock data
const products = [
  {
    id: "1",
    sku: "PKM-CZ-001",
    name: "Charizard VMAX - Darkness Ablaze",
    category: "Pokemon",
    price: 189.99,
    stock: 5,
    status: "active",
    rarity: "Ultra Rare",
    condition: "Near Mint"
  },
  {
    id: "2",
    sku: "YGO-BE-001",
    name: "Blue-Eyes White Dragon - LOB-001",
    category: "Yu-Gi-Oh!",
    price: 499.99,
    stock: 1,
    status: "active",
    rarity: "Secret Rare",
    condition: "Mint"
  },
  {
    id: "3",
    sku: "MTG-BL-001",
    name: "Black Lotus - Alpha Edition",
    category: "Magic: The Gathering",
    price: 49999.99,
    stock: 1,
    status: "active",
    rarity: "Mythic Rare",
    condition: "Lightly Played"
  },
  {
    id: "4",
    sku: "PKM-PK-001",
    name: "Pikachu VMAX - Vivid Voltage",
    category: "Pokemon",
    price: 79.99,
    stock: 8,
    status: "active",
    rarity: "Secret Rare",
    condition: "Near Mint"
  },
  {
    id: "5",
    sku: "YGO-DM-001",
    name: "Dark Magician - SDY-006",
    category: "Yu-Gi-Oh!",
    price: 34.99,
    stock: 15,
    status: "active",
    rarity: "Ultra Rare",
    condition: "Near Mint"
  },
  {
    id: "6",
    sku: "OP-LF-001",
    name: "Monkey D. Luffy - OP01-003",
    category: "One Piece",
    price: 89.99,
    stock: 10,
    status: "active",
    rarity: "Leader",
    condition: "Near Mint"
  },
  {
    id: "7",
    sku: "SPT-MJ-001",
    name: "Michael Jordan - 1986 Fleer Rookie",
    category: "Sports Cards",
    price: 24999.99,
    stock: 1,
    status: "active",
    rarity: "Rookie",
    condition: "PSA 9"
  },
  {
    id: "8",
    sku: "MTG-SR-001",
    name: "Sol Ring - Commander",
    category: "Magic: The Gathering",
    price: 2.99,
    stock: 50,
    status: "active",
    rarity: "Common",
    condition: "Near Mint"
  }
]

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Product Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage your inventory and products
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Link href="/admin/products/import">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  CSVインポート
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Link href="/admin/products/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  商品追加
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">In Stock</p>
            <p className="text-2xl font-bold">
              {products.filter(p => p.stock > 0).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Low Stock</p>
            <p className="text-2xl font-bold text-orange-600">
              {products.filter(p => p.stock <= 5 && p.stock > 0).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">
              {products.filter(p => p.stock === 0).length}
            </p>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {product.rarity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {product.condition}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="font-semibold">
                    ${product.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.stock === 0 
                          ? "destructive" 
                          : product.stock <= 5 
                          ? "secondary"
                          : "default"
                      }
                    >
                      {product.stock} units
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}