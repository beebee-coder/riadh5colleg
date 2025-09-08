// src/components/dashboard/admin/AdminSidebar.tsx
'use client'
import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import type { AnnouncementWithClass, Event } from "@/types";

interface AdminSidebarProps {
  searchParams: { [key: string]: string | string[] | undefined };
  initialAnnouncements: AnnouncementWithClass[];
  initialEvents: Event[];
}

const AdminSidebar = ({ searchParams, initialAnnouncements, initialEvents }: AdminSidebarProps) => {
    const eventDates = initialEvents.map((event: { startTime: Date }) => new Date(event.startTime).toISOString().split('T')[0]);
    const uniqueEventDates = [...new Set(eventDates)] as string[];
    
    return (
        <>
            <EventCalendarContainer 
                date={searchParams.date}
                events={initialEvents} // Pass events directly
                eventDates={uniqueEventDates} // Pass dates for highlighting
            />
            <div className="flex-1 min-h-0">
                <Announcements initialAnnouncements={initialAnnouncements} />
            </div>
        </>
    );
};

export default AdminSidebar;
