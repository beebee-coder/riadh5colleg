// src/app/(dashboard)/admin/page.tsx
'use client';
import AdminPageClient from "@/components/dashboard/admin/AdminPageClient";
import AdminStatsGrid from "@/components/dashboard/admin/AdminStatsGrid";
import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";

export default function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <AdminPageClient>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3">
          <AdminStatsGrid />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <AdminSidebar searchParams={searchParams} />
        </div>
      </div>
    </AdminPageClient>
  );
}
