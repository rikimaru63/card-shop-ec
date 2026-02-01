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
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  'SINGLE': 'シングル',
  'BOX': 'BOX',
  'OTHER': 'その他',
};

const conditionLabels: { [key: string]: string } = {
  'GRADE_A': 'A：美品',
  'GRADE_B': 'B：良品',
  'GRADE_C': 'C：ダメージ',
  'PSA': 'PSA',
  'SEALED': '未開封',
};

const categoryLabels: { [key: string]: string } = {
  'pokemon-cards': 'ポケモン',
  'onepiece-cards': 'ワンピース',
  'other-cards': 'その他',
};

interface ProductListProps {
    initialProducts: ProductWithImages[];
    onRefresh?: () => void;
}

// Sortable row component
function SortableRow({
  product,
  onEdit,
  onDelete,
}: {
  product: ProductWithImages;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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
      <TableCell>¥{Number(product.price).toLocaleString()}</TableCell>
      <TableCell>{product.stock}</TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          className="mr-2"
          onClick={() => onEdit(product.id)}
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          編集
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(product.id)}
        >
          削除
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function ProductList({ initialProducts, onRefresh }: ProductListProps) {
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
          title: "削除完了",
          description: "商品を削除しました",
        });
        setProducts(products.filter(product => product.id !== productToDeleteId));
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast({
          title: "エラー",
          description: result.message || "商品の削除に失敗しました",
          variant: "destructive",
        });
      }
      setIsDeleteDialogOpen(false);
      setProductToDeleteId(null);
    }
  };

  // Handle drag end - reorder products
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Only allow reorder when not searching
    if (searchQuery.trim()) {
      toast({
        title: "お知らせ",
        description: "並び替えるには検索をクリアしてください",
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
        title: "保存完了",
        description: "商品の並び順を更新しました",
      });
    } catch (error) {
      // Revert on failure
      setProducts(initialProducts);
      toast({
        title: "エラー",
        description: "並び順の保存に失敗しました",
        variant: "destructive",
      });
    }
  }, [products, initialProducts, searchQuery]);

  const isDragDisabled = !!searchQuery.trim();

  return (
    <>
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="商品名、カードNo.、カードセットで検索..."
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
            {filteredProducts.length}件の商品が見つかりました
          </p>
        )}
        {!searchQuery && (
          <p className="text-xs text-gray-400 mt-2">
            💡 行をドラッグして商品の並び順を変更できます。順序は自動保存されます。
          </p>
        )}
      </div>

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
                <TableHead className="w-[80px]">画像</TableHead>
                <TableHead>商品名</TableHead>
                <TableHead className="w-[100px]">カードNo.</TableHead>
                <TableHead className="w-[80px]">カテゴリ</TableHead>
                <TableHead className="w-[80px]">タイプ</TableHead>
                <TableHead className="w-[70px]">状態</TableHead>
                <TableHead className="w-[80px]">価格</TableHead>
                <TableHead className="w-[50px]">在庫</TableHead>
                <TableHead className="text-right w-[140px]">操作</TableHead>
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
            <AlertDialogTitle>商品を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。商品データは完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
