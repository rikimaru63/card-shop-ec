
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
          <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
          <Link href="/admin/dashboard" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            Dashboard
          </Link>
          <Link href="/admin/products" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            Products
          </Link>
          <Link href="/admin/orders" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            Orders
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
