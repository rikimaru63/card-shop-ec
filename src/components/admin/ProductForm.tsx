
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
      {pending ? (isEditing ? 'Saving...' : 'Adding...') : isEditing ? 'Save Changes' : 'Add Product'}
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
        title: 'Error',
        description: result.message || `Failed to ${isEditing ? 'update' : 'add'} product.`,
        variant: 'destructive',
      });
    } else if (result.success) {
      toast({
        title: 'Success',
        description: `Product ${isEditing ? 'updated' : 'added'} successfully.`,
      });
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } else if (result.message) {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <form action={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <Input id="name" name="name" className="col-span-3" defaultValue={initialData?.name || ''} />
        {errors.name && <p className="col-span-4 text-right text-red-500 text-sm">{errors.name[0]}</p>}
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="basePrice" className="text-right">
          Base Price
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
                <span className="font-medium">Selling Price (incl. 20% duty):</span>{' '}
                <span className="font-bold">${sellingPrice}</span>
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Enter the base price. 20% duty will be automatically added for the selling price.
          </p>
        </div>
        {errors.basePrice && <p className="col-span-4 text-right text-red-500 text-sm">{errors.basePrice[0]}</p>}
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="stock" className="text-right">
          Stock
        </Label>
        <Input id="stock" name="stock" type="number" className="col-span-3" defaultValue={initialData?.stock !== undefined ? initialData.stock.toString() : ''} />
        {errors.stock && <p className="col-span-4 text-right text-red-500 text-sm">{errors.stock[0]}</p>}
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="imageUrl" className="text-right">
          Image URL
        </Label>
        <Input id="imageUrl" name="imageUrl" type="url" className="col-span-3" defaultValue={initialData?.images?.[0]?.url || 'https://placehold.co/400x600'} />
        {errors.imageUrl && <p className="col-span-4 text-right text-red-500 text-sm">{errors.imageUrl[0]}</p>}
      </div>

      {/* Feature Flags */}
      <div className="grid grid-cols-4 items-start gap-4 pt-2">
        <Label className="text-right pt-1">
          Features
        </Label>
        <div className="col-span-3 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isNewArrival"
              checked={isNewArrival}
              onCheckedChange={(checked) => setIsNewArrival(checked === true)}
            />
            <Label htmlFor="isNewArrival" className="text-sm font-normal cursor-pointer">
              New Arrival
              <span className="ml-2 text-xs text-muted-foreground">(Show in "New Arrivals" section)</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRecommended"
              checked={isRecommended}
              onCheckedChange={(checked) => setIsRecommended(checked === true)}
            />
            <Label htmlFor="isRecommended" className="text-sm font-normal cursor-pointer">
              Recommended
              <span className="ml-2 text-xs text-muted-foreground">(Show in "Recommended Picks" section)</span>
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
