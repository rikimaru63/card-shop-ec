"use client";

import { Product, ProductImage, Category } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';
import { deleteProduct } from '@/app/admin/products/actions';
import { useRouter } from 'next/navigation';
import { ImageIcon, Search, X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ProductWithImages = Product & { images: ProductImage[]; category: Category | null };

// Display labels
const productTypeLabels: { [key: string]: string } = {
  'SINGLE': 'Single',
  'BOX': 'BOX',
  'OTHER': 'Other',
};

const conditionLabels: { [key: string]: string } = {
  'GRADE_A': 'A',
  'GRADE_B': 'B',
  'GRADE_C': 'C',
  'PSA': 'PSA',
  'SEALED': 'Sealed',
};

const categoryLabels: { [key: string]: string } = {
  'pokemon-cards': 'Pokémon',
  'onepiece-cards': 'One Piece',
  'other-cards': 'Other',
};

interface ProductListProps {
    initialProducts: ProductWithImages[];
    onRefresh?: () => void;
    /** When true, hides the built-in search bar (parent handles search) */
    hideSearch?: boolean;
}

// Sortable row component
function SortableRow({
  product,
  onEdit,
  onDelete,
  onProductUpdate,
}: {
  product: ProductWithImages;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onProductUpdate: (productId: string, updates: Partial<Product>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#f0f9ff' : undefined,
  };

  // === Inline edit state ===
  const [editingField, setEditingField] = useState<'price' | 'stock' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField]);

  // Start editing
  const startEdit = (field: 'price' | 'stock') => {
    setEditingField(field);
    setEditValue(
      field === 'price'
        ? String(Number(product.price))
        : String(product.stock)
    );
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingField) return;

    const numValue = editingField === 'price' ? parseFloat(editValue) : parseInt(editValue, 10);
    if (isNaN(numValue) || (editingField === 'price' && numValue <= 0) || (editingField === 'stock' && numValue < 0)) {
      toast({
        title: "Invalid value",
        description: editingField === 'price' ? "Price must be greater than 0." : "Stock cannot be negative.",
        variant: "destructive",
      });
      setEditingField(null);
      return;
    }

    // Skip save if value hasn't changed
    const currentValue = editingField === 'price' ? Number(product.price) : product.stock;
    if (numValue === currentValue) {
      setEditingField(null);
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, string> = {};
      payload[editingField] = editValue;

      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save');

      const updated = await response.json();

      // Notify parent to update state
      onProductUpdate(product.id, {
        price: updated.price,
        stock: updated.stock,
        updatedAt: updated.updatedAt,
      });

      toast({
        title: "Saved",
        description: `${editingField === 'price' ? 'Price' : 'Stock'} updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setEditingField(null);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Key handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[40px]">
        <button
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        {product.images.length > 0 && (
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            width={60}
            height={60}
            className="object-cover rounded-md"
          />
        )}
      </TableCell>
      <TableCell className="font-medium max-w-[300px] truncate" title={product.name}>
        {product.name}
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {product.cardNumber || '-'}
      </TableCell>
      <TableCell className="text-sm">
        {product.category ? categoryLabels[product.category.slug] || product.category.name : '-'}
      </TableCell>
      <TableCell className="text-sm">
        {productTypeLabels[product.productType || ''] || product.productType || '-'}
      </TableCell>
      <TableCell className="text-sm">
        {conditionLabels[product.condition || ''] || product.condition || '-'}
      </TableCell>
      {/* Price - inline editable */}
      <TableCell
        className="cursor-pointer hover:bg-blue-50 transition-colors"
        onDoubleClick={() => startEdit('price')}
      >
        {editingField === 'price' ? (
          <div className="flex items-center gap-1">
            <span className="text-gray-400">¥</span>
            <Input
              ref={inputRef}
              type="number"
              min="0"
              step="1"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveEdit}
              className="h-7 w-24 text-sm"
              disabled={saving}
            />
          </div>
        ) : (
          <span title="Double-click to edit">
            ¥{Number(product.price).toLocaleString()}
          </span>
        )}
      </TableCell>
      {/* Stock - inline editable */}
      <TableCell
        className="cursor-pointer hover:bg-blue-50 transition-colors"
        onDoubleClick={() => startEdit('stock')}
      >
        {editingField === 'stock' ? (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              type="number"
              min="0"
              step="1"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveEdit}
              className="h-7 w-16 text-sm"
              disabled={saving}
            />
          </div>
        ) : (
          <span title="Double-click to edit">{product.stock}</span>
        )}
      </TableCell>
      {/* Updated date */}
      <TableCell className="text-sm text-gray-500 whitespace-nowrap">
        {product.updatedAt
          ? new Date(product.updatedAt).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
          : '-'}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          className="mr-2"
          onClick={() => onEdit(product.id)}
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(product.id)}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function ProductList({ initialProducts, onRefresh, hideSearch }: ProductListProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync products state when initialProducts prop changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    const query = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      const name = product.name?.toLowerCase() || '';
      const cardNumber = product.cardNumber?.toLowerCase() || '';
      const cardSet = product.cardSet?.toLowerCase() || '';
      return name.includes(query) || cardNumber.includes(query) || cardSet.includes(query);
    });
  }, [products, searchQuery]);

  // Restore scroll position on mount
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('productListScrollPosition');
    if (savedScrollPosition) {
      const scrollY = parseInt(savedScrollPosition, 10);
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 100);
      sessionStorage.removeItem('productListScrollPosition');
    }
  }, []);

  const handleEditClick = (productId: string) => {
    sessionStorage.setItem('productListScrollPosition', window.scrollY.toString());
    router.push(`/admin/products/${productId}/edit`);
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (productId: string) => {
    setProductToDeleteId(productId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDeleteId) {
      const result = await deleteProduct(productToDeleteId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully.",
        });
        setProducts(products.filter(product => product.id !== productToDeleteId));
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete product.",
          variant: "destructive",
        });
      }
      setIsDeleteDialogOpen(false);
      setProductToDeleteId(null);
    }
  };

  // Handle inline edit updates from SortableRow
  const handleProductUpdate = useCallback((productId: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, ...updates } : p
    ));
  }, []);

  // Handle drag end - reorder products
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Only allow reorder when not searching
    if (searchQuery.trim()) {
      toast({
        title: "Note",
        description: "Clear search to reorder products.",
      });
      return;
    }

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);

    const newProducts = arrayMove(products, oldIndex, newIndex);
    setProducts(newProducts);

    // Build reorder payload
    const items = newProducts.map((p, index) => ({
      id: p.id,
      sortOrder: index,
    }));

    try {
      const response = await fetch('/api/admin/products/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      toast({
        title: "Saved",
        description: "Product order updated.",
      });
    } catch (error) {
      // Revert on failure
      setProducts(initialProducts);
      toast({
        title: "Error",
        description: "Failed to save product order.",
        variant: "destructive",
      });
    }
  }, [products, initialProducts, searchQuery]);

  const isDragDisabled = !!searchQuery.trim();

  return (
    <>
      {/* Search bar - hidden when parent handles search */}
      {!hideSearch && (
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, card no., card set..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-2">
              {filteredProducts.length} products found
            </p>
          )}
          {!searchQuery && (
            <p className="text-xs text-gray-400 mt-2">
              💡 Drag rows to reorder products. Order is saved automatically.
            </p>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Card No.</TableHead>
                <TableHead className="w-[80px]">Category</TableHead>
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead className="w-[70px]">Condition</TableHead>
                <TableHead className="w-[80px]">Price</TableHead>
                <TableHead className="w-[50px]">Stock</TableHead>
                <TableHead className="w-[110px]">Updated</TableHead>
                <TableHead className="text-right w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={filteredProducts.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
                disabled={isDragDisabled}
              >
                {filteredProducts.map((product) => (
                  <SortableRow
                    key={product.id}
                    product={product}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onProductUpdate={handleProductUpdate}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
