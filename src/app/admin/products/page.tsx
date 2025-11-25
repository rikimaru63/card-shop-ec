
// src/app/admin/products/page.tsx
import { PrismaClient } from '@prisma/client';
import { ProductList } from '@/components/admin/ProductList';

// Force dynamic rendering to avoid build-time DB queries
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      images: true, // Include product images
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Product Management</h1>
      <ProductList initialProducts={products} />
    </div>
  );
}
