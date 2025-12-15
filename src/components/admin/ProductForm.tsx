
// src/components/admin/ProductForm.tsx
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFormStatus } from 'react-dom';
import { createProduct, updateProduct } from '@/app/admin/products/actions';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Product, ProductImage } from '@prisma/client';

// 関税率（20%）
const DUTY_RATE = 1.2;

interface ProductFormProps {
  initialData?: (Product & { images: ProductImage[] }) | null;
  productId?: string;
  onSuccess?: () => void;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (isEditing ? '保存中...' : '登録中...') : isEditing ? '変更を保存' : '商品を登録'}
    </Button>
  );
}

export function ProductForm({ initialData, productId, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const isEditing = !!productId;

  // 編集時は、DBに保存されている販売価格から原価を逆算
  const initialBasePrice = initialData?.price
    ? (Number(initialData.price) / DUTY_RATE).toFixed(2)
    : '';

  const [basePrice, setBasePrice] = useState(initialBasePrice);
  const [isNewArrival, setIsNewArrival] = useState(initialData?.isNewArrival || false);
  const [isRecommended, setIsRecommended] = useState(initialData?.isRecommended || false);

  // 販売価格のリアルタイム計算
  const sellingPrice = useMemo(() => {
    const price = parseFloat(basePrice);
    if (isNaN(price) || price <= 0) return null;
    return (price * DUTY_RATE).toFixed(2);
  }, [basePrice]);

  const handleSubmit = async (formData: FormData) => {
    setErrors({}); // Clear previous errors

    // basePriceをformDataに追加（Server Actionで使用）
    formData.set('basePrice', basePrice);
    formData.set('isNewArrival', isNewArrival.toString());
    formData.set('isRecommended', isRecommended.toString());

    let result;
    if (isEditing) {
      result = await updateProduct(productId!, formData);
    } else {
      result = await createProduct(formData);
    }

    if (!result.success && result.errors) {
      setErrors(result.errors);
      toast({
        title: 'エラー',
        description: result.message || `商品の${isEditing ? '更新' : '登録'}に失敗しました。`,
        variant: 'destructive',
      });
    } else if (result.success) {
      toast({
        title: '成功',
        description: `商品を${isEditing ? '更新' : '登録'}しました。`,
      });
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } else if (result.message) {
      toast({
        title: 'エラー',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <form action={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          商品名
        </Label>
        <Input id="name" name="name" className="col-span-3" defaultValue={initialData?.name || ''} />
        {errors.name && <p className="col-span-4 text-right text-red-500 text-sm">{errors.name[0]}</p>}
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="basePrice" className="text-right">
          原価
        </Label>
        <div className="col-span-3 space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="basePrice"
              name="basePrice"
              type="number"
              step="0.01"
              min="0"
              className="pl-7"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {/* 販売価格プレビュー */}
          {sellingPrice && (
            <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <p className="text-sm text-green-800">
                <span className="font-medium">販売価格（関税20%込）:</span>{' '}
                <span className="font-bold">${sellingPrice}</span>
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            原価を入力してください。販売価格は自動的に20%の関税が加算されます。
          </p>
        </div>
        {errors.basePrice && <p className="col-span-4 text-right text-red-500 text-sm">{errors.basePrice[0]}</p>}
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="stock" className="text-right">
          在庫数
        </Label>
        <Input id="stock" name="stock" type="number" className="col-span-3" defaultValue={initialData?.stock !== undefined ? initialData.stock.toString() : ''} />
        {errors.stock && <p className="col-span-4 text-right text-red-500 text-sm">{errors.stock[0]}</p>}
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="imageUrl" className="text-right">
          画像URL
        </Label>
        <Input id="imageUrl" name="imageUrl" type="url" className="col-span-3" defaultValue={initialData?.images?.[0]?.url || 'https://placehold.co/400x600'} />
        {errors.imageUrl && <p className="col-span-4 text-right text-red-500 text-sm">{errors.imageUrl[0]}</p>}
      </div>

      {/* Feature Flags */}
      <div className="grid grid-cols-4 items-start gap-4 pt-2">
        <Label className="text-right pt-1">
          表示設定
        </Label>
        <div className="col-span-3 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isNewArrival"
              checked={isNewArrival}
              onCheckedChange={(checked) => setIsNewArrival(checked === true)}
            />
            <Label htmlFor="isNewArrival" className="text-sm font-normal cursor-pointer">
              新着商品
              <span className="ml-2 text-xs text-muted-foreground">(「新着商品」セクションに表示)</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRecommended"
              checked={isRecommended}
              onCheckedChange={(checked) => setIsRecommended(checked === true)}
            />
            <Label htmlFor="isRecommended" className="text-sm font-normal cursor-pointer">
              おすすめ商品
              <span className="ml-2 text-xs text-muted-foreground">(「おすすめ商品」セクションに表示)</span>
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  );
}
