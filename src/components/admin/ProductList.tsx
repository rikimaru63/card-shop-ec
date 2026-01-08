"use client";

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
import { useState, useEffect, useMemo } from 'react';
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
import { ImageIcon, Search, X } from 'lucide-react';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductWithImages {
  id: string;
  name: string;
  price: number | { toNumber: () => number };
  stock: number;
  productType?: string | null;
  condition?: string | null;
  cardNumber?: string | null;
  cardSet?: string | null;
  images: ProductImage[];
  category: Category | null;
}

// 表示用のラベルマッピング
const productTypeLabels: { [key: string]: string } = {
  'SINGLE': 'シングル',
  'BOX': 'BOX',
  'OTHER': 'その他',
};

const conditionLabels: { [key: string]: string } = {
  'GRADE_A': 'A',
  'GRADE_B': 'B',
  'GRADE_C': 'C',
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

export function ProductList({ initialProducts, onRefresh }: ProductListProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync products state when initialProducts prop changes (after router.refresh())
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Filter products based on search query (name, cardNumber, cardSet)
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
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 100);
      sessionStorage.removeItem('productListScrollPosition');
    }
  }, []);

  // Save scroll position before navigating to edit page
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
          title: "成功",
          description: "商品を削除しました。",
        });
        setProducts(products.filter(product => product.id !== productToDeleteId));
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast({
          title: "エラー",
          description: result.message || "商品の削除に失敗しました。",
          variant: "destructive",
        });
      }
      setIsDeleteDialogOpen(false);
      setProductToDeleteId(null);
    }
  };

  return (
    <>
      {/* 検索バー */}
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
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
                    onClick={() => handleEditClick(product.id)}
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    編集
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(product.id)}
                  >
                    削除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。商品データは完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>削除する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
