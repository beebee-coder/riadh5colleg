// src/app/(dashboard)/admin/page.tsx
export const dynamic = 'force-dynamic';
import AdminPageClient from "@/components/dashboard/admin/AdminPageClient";
import AdminStatsGrid from "@/components/dashboard/admin/AdminStatsGrid";
import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {

  // Data fetching is now handled directly within the AdminSidebar component.
  // This simplifies the AdminPage and co-locates data fetching with the component that uses the data.
  
  return (
    <AdminPageClient>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3">
          <AdminStatsGrid />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <AdminSidebar 
            searchParams={searchParams}
          />
        </div>
      </div>
    </AdminPageClient>
  );
}
