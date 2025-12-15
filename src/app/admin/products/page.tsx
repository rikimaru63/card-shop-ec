
// src/app/admin/products/page.tsx
import { PrismaClient } from '@prisma/client';
import { ProductList } from '@/components/admin/ProductList';
import Link from 'next/link';
import { FileSpreadsheet, Plus } from 'lucide-react';

// Force dynamic rendering to avoid build-time DB queries
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      images: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">商品管理</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/products/import"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSVインポート
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            新規商品
          </Link>
        </div>
      </div>
      <ProductList initialProducts={products} />
    </div>
  );
}
