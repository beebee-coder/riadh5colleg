// src/app/(dashboard)/admin/page.tsx
export const dynamic = 'force-dynamic';
import AdminPageClient from "@/components/dashboard/admin/AdminPageClient";
import AdminStatsGrid from "@/components/dashboard/admin/AdminStatsGrid";
import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";
import prisma from "@/lib/prisma";
import type { AnnouncementWithClass, Event } from "@/types";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {

  const announcements: AnnouncementWithClass[] = (await prisma.announcement.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
          class: { select: { name: true } },
      },
  })).map(a => ({...a, date: a.date.toISOString()})) as unknown as AnnouncementWithClass[];

  const events: Event[] = (await prisma.event.findMany({
      orderBy: { startTime: 'asc' },
  })).map(e => ({...e, startTime: e.startTime.toISOString(), endTime: e.endTime.toISOString()})) as unknown as Event[];

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
