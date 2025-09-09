// src/app/(dashboard)/admin/page.tsx
import AdminPageClient from "@/components/dashboard/admin/AdminPageClient";
import AdminStatsGrid from "@/components/dashboard/admin/AdminStatsGrid";
import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";
import prisma from "@/lib/prisma";
import type { AnnouncementWithClass, Event } from "@/types";

export const dynamic = 'force-dynamic';

// This data fetching function now correctly runs on the server.
async function getSidebarData() {
    console.log("👑 [AdminSidebar] Récupération des annonces et des événements depuis Prisma.");
    const announcements = await prisma.announcement.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
            class: { select: { name: true } },
        },
    });

    const events = await prisma.event.findMany({
        orderBy: { startTime: 'asc' },
    });
    
    // We can remove JSON.parse(JSON.stringify(...)) as Next.js handles serialization
    // between Server and Client Components.
    return {
        announcements,
        events,
    };
}


export default async function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {

  // Data is fetched on the server before the page is rendered.
  const { announcements, events } = await getSidebarData();

  return (
    // AdminPageClient remains a Client Component to handle client-side logic like Redux hooks.
    <AdminPageClient>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3">
          {/* AdminStatsGrid can be a Server Component if it fetches its own data,
              or it can receive data as props. */}
          <AdminStatsGrid />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* We pass the server-fetched data as props to the client-side sidebar. */}
          <AdminSidebar 
            searchParams={searchParams}
            initialAnnouncements={announcements as AnnouncementWithClass[]}
            initialEvents={events as Event[]}
          />
        </div>
      </div>
    </AdminPageClient>
  );
}