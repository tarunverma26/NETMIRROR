'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // If this is the admin login page, don't show the admin sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-cinema-black flex">
      {/* Fixed/Sticky Admin Navigation Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
