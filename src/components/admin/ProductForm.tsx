
// src/components/admin/ProductForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { createProduct, updateProduct } from '@/app/admin/products/actions';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Product, ProductImage } from '@prisma/client';

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

  const handleSubmit = async (formData: FormData) => {
    setErrors({}); // Clear previous errors
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
      router.refresh(); // Refresh the product list
      if (onSuccess) {
        onSuccess(); // Close modal or reset form
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
        <Label htmlFor="price" className="text-right">
          Price
        </Label>
        <Input id="price" name="price" type="number" step="0.01" className="col-span-3" defaultValue={initialData?.price ? initialData.price.toString() : ''} />
        {errors.price && <p className="col-span-4 text-right text-red-500 text-sm">{errors.price[0]}</p>}
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
      <div className="flex justify-end">
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  );
}
