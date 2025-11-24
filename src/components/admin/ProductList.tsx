
"use client";

import { Product, ProductImage } from '@prisma/client';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProductForm } from '@/components/admin/ProductForm';
import { useState } from 'react';
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

type ProductWithImages = Product & { images: ProductImage[] };

interface ProductListProps {
    initialProducts: ProductWithImages[];
}

export function ProductList({ initialProducts }: ProductListProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithImages | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  const handleEditClick = (product: ProductWithImages) => {
    setSelectedProduct(product);
    setIsEditProductModalOpen(true);
  };

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
        router.refresh();
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

  const handleSuccess = () => {
    setIsAddProductModalOpen(false);
    setIsEditProductModalOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
          <DialogTrigger asChild>
            <Button>Add Product</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                      width={80}
                      height={80}
                      className="object-cover rounded-md"
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => handleEditClick(product)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(product.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedProduct && (
        <Dialog open={isEditProductModalOpen} onOpenChange={setIsEditProductModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              initialData={selectedProduct}
              productId={selectedProduct.id}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
