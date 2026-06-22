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
import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
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
import { filterProductsBySearch } from '@/lib/admin/product-search';

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
    /** Search query supplied by the parent (used when hideSearch is true). Filters in-memory. */
    searchQuery?: string;
    /**
     * Whether manual drag-reorder is allowed. The parent passes false when any
     * server-side filter/sort is active, because dragging a filtered subset would
     * corrupt the global sortOrder. Defaults to true (standalone usage).
     */
    allowReorder?: boolean;
}

type RowCallbacks = {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onProductUpdate: (productId: string, updates: Partial<Product>) => void;
};

/**
 * 1 行ぶんのセル群（ドラッグハンドル列を除く）。インライン編集（価格・在庫）の状態を内包する。
 * React.memo でラップし、product 参照とコールバックが安定していれば再描画を bailout する。
 * これにより、検索で絞り込んだ際に「変化した行だけ」を再描画できる。
 */
const ProductRowCells = memo(function ProductRowCells({
  product,
  onEdit,
  onDelete,
  onProductUpdate,
}: { product: ProductWithImages } & RowCallbacks) {
  // === Inline edit state ===
  const [editingField, setEditingField] = useState<'price' | 'stock' | 'name' | null>(null);
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
  const startEdit = (field: 'price' | 'stock' | 'name') => {
    setEditingField(field);
    setEditValue(
      field === 'price'
        ? String(Number(product.price))
        : field === 'stock'
          ? String(product.stock)
          : product.name
    );
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingField) return;

    // === 商品名（文字列）の保存 ===
    // 価格・在庫と異なり数値検証は行わず、空文字禁止と上限チェックのみ。
    // 商品名を変えても更新APIは slug(URL) を再生成しないため、既存リンク/SEOは不変。
    if (editingField === 'name') {
      const trimmed = editValue.trim();
      if (trimmed.length === 0 || trimmed.length > 200) {
        toast({
          title: "Invalid value",
          description: trimmed.length === 0
            ? "Product name cannot be empty."
            : "Product name is too long (max 200).",
          variant: "destructive",
        });
        setEditingField(null);
        return;
      }
      // 変更が無ければ保存しない
      if (trimmed === product.name) {
        setEditingField(null);
        return;
      }

      setSaving(true);
      try {
        const response = await fetch(`/api/admin/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });

        if (!response.ok) throw new Error('Failed to save');

        const updated = await response.json();

        onProductUpdate(product.id, {
          name: updated.name,
          updatedAt: updated.updatedAt,
        });

        toast({ title: "Saved", description: "Name updated." });
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
      return;
    }

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
    <>
      <TableCell>
        {product.images.length > 0 && (
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            width={60}
            height={60}
            className="object-cover rounded-md"
            unoptimized
            loading="lazy"
          />
        )}
      </TableCell>
      {/* Name - inline editable */}
      <TableCell
        className="font-medium max-w-[300px] cursor-pointer hover:bg-blue-50 transition-colors"
        onDoubleClick={() => startEdit('name')}
      >
        {editingField === 'name' ? (
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="h-7 w-full text-sm"
            disabled={saving}
            maxLength={200}
          />
        ) : (
          <span className="block truncate" title={product.name}>
            {product.name}
          </span>
        )}
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
    </>
  );
});

// Sortable row component (drag handle + cells). Used only in the default reorder view.
const SortableRow = memo(function SortableRow({
  product,
  onEdit,
  onDelete,
  onProductUpdate,
}: { product: ProductWithImages } & RowCallbacks) {
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
      <ProductRowCells
        product={product}
        onEdit={onEdit}
        onDelete={onDelete}
        onProductUpdate={onProductUpdate}
      />
    </TableRow>
  );
});

// Plain (non-draggable) row. Used while searching/filtering so dnd-kit's per-row
// context subscription is removed and React.memo can fully bail out.
const PlainRow = memo(function PlainRow({
  product,
  onEdit,
  onDelete,
  onProductUpdate,
}: { product: ProductWithImages } & RowCallbacks) {
  return (
    <TableRow>
      <TableCell className="w-[40px]">
        {/* Non-interactive placeholder to keep column alignment with the reorder view */}
        <span className="inline-flex p-1 text-gray-200" aria-hidden="true">
          <GripVertical className="h-4 w-4" />
        </span>
      </TableCell>
      <ProductRowCells
        product={product}
        onEdit={onEdit}
        onDelete={onDelete}
        onProductUpdate={onProductUpdate}
      />
    </TableRow>
  );
});

export function ProductList({
  initialProducts,
  onRefresh,
  hideSearch,
  searchQuery,
  allowReorder,
}: ProductListProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  // Internal search state is only used in standalone mode (built-in search bar).
  const [internalSearch, setInternalSearch] = useState('');

  // The effective search term: parent-controlled when hideSearch, else the built-in bar.
  const effectiveSearch = hideSearch ? (searchQuery ?? '') : internalSearch;

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

  // Filter products based on the effective search query (in-memory, instant).
  // Returns the same array reference when not searching, so memoized rows bail out.
  const filteredProducts = useMemo(
    () => filterProductsBySearch(products, effectiveSearch),
    [products, effectiveSearch]
  );

  // ===== ページネーション =====
  // 商品が 4,000 件超のため、全行の <Image> を一度に描画すると next/image の最適化要求が
  // 一斉発火し、サーバー(next-server)のイベントループを固着させる。表示行をページ単位に
  // 限定して、一度に描画するサムネ枚数を抑える（2026-06-18 障害の恒久対策）。
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  // 検索/フィルタやページサイズが変わったら先頭ページへ戻す（並べ替え・編集では戻さない）。
  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSearch, pageSize]);

  // 件数が減ってページ範囲を超えたら最終ページへ丸める（削除・絞り込み時）。
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // 現在ページに表示する行だけを切り出す。
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Stable id list for SortableContext — 現在ページの行のみ並べ替え対象にする。
  const itemIds = useMemo(() => pagedProducts.map((p) => p.id), [pagedProducts]);

  // Reorder is only safe in the true default view: no text search AND no
  // server-side filter/sort active (allowReorder). Otherwise dragging a subset
  // would persist wrong sortOrder values for the whole catalog.
  const canReorder = (allowReorder ?? true) && !effectiveSearch.trim();

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

  const handleEditClick = useCallback((productId: string) => {
    sessionStorage.setItem('productListScrollPosition', window.scrollY.toString());
    router.push(`/admin/products/${productId}/edit`);
  }, [router]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  const handleDeleteClick = useCallback((productId: string) => {
    setProductToDeleteId(productId);
    setIsDeleteDialogOpen(true);
  }, []);

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

  // Handle inline edit updates from a row
  const handleProductUpdate = useCallback((productId: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, ...updates } : p
    ));
  }, []);

  // Handle drag end - reorder products
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Defensive: reorder only when allowed (UI does not render dnd otherwise).
    if (!canReorder) {
      toast({
        title: "Note",
        description: "Clear search and filters to reorder products.",
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
  }, [products, initialProducts, canReorder]);

  const tableHeader = (
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
  );

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
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {internalSearch && (
              <button
                onClick={() => setInternalSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {internalSearch && (
            <p className="text-sm text-gray-500 mt-2">
              {filteredProducts.length} products found
            </p>
          )}
          {!internalSearch && (
            <p className="text-xs text-gray-400 mt-2">
              💡 Drag rows to reorder products. Order is saved automatically.
            </p>
          )}
        </div>
      )}

      <div className="rounded-md border">
        {canReorder ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              {tableHeader}
              <TableBody>
                <SortableContext
                  items={itemIds}
                  strategy={verticalListSortingStrategy}
                >
                  {pagedProducts.map((product) => (
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
        ) : (
          <Table>
            {tableHeader}
            <TableBody>
              {pagedProducts.map((product) => (
                <PlainRow
                  key={product.id}
                  product={product}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onProductUpdate={handleProductUpdate}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ページネーション操作（1ページの表示件数を絞り、サムネ一斉描画を防ぐ） */}
      {filteredProducts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm">
          <div className="text-gray-500">
            {filteredProducts.length} 件中 {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredProducts.length)} 件を表示
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="admin-page-size" className="text-gray-500">表示件数</label>
            <select
              id="admin-page-size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1 bg-background"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              前へ
            </Button>
            <span className="px-1 tabular-nums">{currentPage} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              次へ
            </Button>
          </div>
        </div>
      )}

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
