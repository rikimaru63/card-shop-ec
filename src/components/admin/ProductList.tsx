"use client";

import { Product, ProductImage, Category } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import { useState, useEffect } from 'react';
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
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';

type ProductWithImages = Product & { images: ProductImage[]; category: Category | null };

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
}

export function ProductList({ initialProducts }: ProductListProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);

  // Sync products state when initialProducts prop changes (after router.refresh())
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

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
        router.refresh();
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">画像</TableHead>
              <TableHead>商品名</TableHead>
              <TableHead className="w-[80px]">カテゴリ</TableHead>
              <TableHead className="w-[80px]">タイプ</TableHead>
              <TableHead className="w-[70px]">状態</TableHead>
              <TableHead className="w-[80px]">価格</TableHead>
              <TableHead className="w-[50px]">在庫</TableHead>
              <TableHead className="text-right w-[140px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
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
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      編集
                    </Button>
                  </Link>
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
