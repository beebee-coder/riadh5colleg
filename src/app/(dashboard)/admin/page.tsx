// src/app/(dashboard)/admin/page.tsx
'use client';
import AdminPageClient from "@/components/dashboard/admin/AdminPageClient";
import AdminStatsGrid from "@/components/dashboard/admin/AdminStatsGrid";
import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";
import prisma from "@/lib/prisma";
import type { AnnouncementWithClass, Event } from "@/types";

// The data fetching function is now part of the page component
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
    
    return {
        announcements: JSON.parse(JSON.stringify(announcements)) as AnnouncementWithClass[],
        events: JSON.parse(JSON.stringify(events)) as Event[],
    };
}


export default async function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {

  const { announcements, events } = await getSidebarData();

  return (
    <AdminPageClient>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3">
          <AdminStatsGrid />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <AdminSidebar 
            searchParams={searchParams}
            initialAnnouncements={announcements}
            initialEvents={events}
          />
        </div>
      </div>
    </AdminPageClient>
  );
}
