// src/lib/constants.ts
import { 
  Home, Calendar, BarChart, BookUser, GraduationCap, Users, Book, School, 
  BookCopy, PencilLine, ClipboardList, BookCheck, ClipboardCheck, MessageSquare, 
  Megaphone, UserCircle, Settings 
} from 'lucide-react';
import type { SessionTemplate } from '@/lib/redux/slices/session/types';

export const ITEM_PER_PAGE = 10;
export const SESSION_COOKIE_NAME = 'appSessionToken';

export const dayLabels: Record<string, string> = {
    MONDAY: 'Lundi',
    TUESDAY: 'Mardi',
    WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi',
    FRIDAY: 'Vendredi',
    SATURDAY: 'Samedi',
    SUNDAY: 'Dimanche',
};

// Keywords to identify subjects that should be taught in labs/split groups
export const labSubjectKeywords: string[] = ['physique', 'informatique', 'sciences', 'technique'];
export const sectionOptions: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
export const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const attendanceMap: { [key: string]: { present: number; absent: number } } = {
  Lun: { present: 0, absent: 0 },
  Mar: { present: 0, absent: 0 },
  Mer: { present: 0, absent: 0 },
  Jeu: { present: 0, absent: 0 },
  Ven: { present: 0, absent: 0 },
  Sam: { present: 0, absent: 0 },
};

export const menuItems: Array<{
  title: string;
  items: Array<{
    icon: React.ElementType;
    label: string;
    href: string;
    visible: string[]; 
  }>;
}> = [
  {
    title: "MENU",
    items: [
      { icon: Home, label: "Accueil", href: "/accueil", visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT", "AGENT_ADMINISTRATIF"], },
      { icon: Calendar, label: "Planificateur", href: "/shuddle", visible: ["ADMIN"], },
      { icon: BarChart, label: "Rapports", href: "/admin/reports", visible: ["ADMIN"], },
      { icon: BookUser, label: "Enseignants", href: "/list/teachers", visible: ["ADMIN", "TEACHER"], },
      { icon: GraduationCap, label: "Étudiants", href: "/list/students", visible: ["ADMIN", "TEACHER"], },
      { icon: Users, label: "Parents", href: "/list/parents", visible: ["ADMIN", "TEACHER"], },
      { icon: Book, label: "Matières", href: "/list/subjects", visible: ["ADMIN"], },
      { icon: School, label: "Classes", href: "/list/classes", visible: ["ADMIN", "TEACHER"], },
      { icon: BookCopy, label: "Cours", href: "/list/lessons", visible: ["ADMIN", "TEACHER"], },
      { icon: PencilLine, label: "Examens", href: "/list/exams", visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], },
      { icon: ClipboardList, label: "Devoirs", href: "/list/assignments", visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], },
      { icon: BookCheck, label: "Résultats", href: "/list/results", visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], },
      { icon: ClipboardCheck, label: "Présence", href: "/list/attendance", visible: ["ADMIN", "TEACHER"], },
      { icon: Calendar, label: "Événements", href: "/list/events", visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], },
      { icon: MessageSquare, label: "Chatroom", href: "/list/chatroom/dashboard", visible: ["TEACHER"] },
      { icon: MessageSquare, label: "Chatroom", href: "/list/chatroom/student", visible: ["STUDENT"] },
      { icon: MessageSquare, label: "Chatroom", href: "/admin/chatroom", visible: ["ADMIN"] },
      { icon: MessageSquare, label: "Messages", href: "/list/messages", visible: ["ADMIN", "TEACHER", "PARENT"] },
      { icon: Megaphone, label: "Annonces", href: "/list/announcements", visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], },
    ],
  },
  {
    title: "AUTRE",
    items: [
      { icon: UserCircle, label: "Profil", href: "/profile", visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT", "AGENT_ADMINISTRATIF"], },
      { icon: Settings, label: "Paramètres", href: "/settings", visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT", "AGENT_ADMINISTRATIF"], },
    ],
  },
];

export const SESSION_TEMPLATES: SessionTemplate[] = [];
