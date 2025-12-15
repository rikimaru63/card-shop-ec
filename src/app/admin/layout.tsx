
// src/app/admin/layout.tsx
import Link from 'next/link';
import { Toaster } from '@/components/ui/toaster';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <nav className="space-y-2">
          <h2 className="text-xl font-bold mb-4">管理パネル</h2>
          <Link href="/admin" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            ダッシュボード
          </Link>
          <Link href="/admin/products" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            商品管理
          </Link>
          <Link href="/admin/orders" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            注文管理
          </Link>
          <Link href="/admin/users" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            顧客管理
          </Link>
          <hr className="my-4 border-gray-600" />
          <Link href="/" className="block px-3 py-2 rounded-md hover:bg-gray-700 text-gray-400">
            サイトを見る →
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
