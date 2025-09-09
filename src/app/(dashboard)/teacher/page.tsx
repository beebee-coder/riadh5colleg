// src/app/(dashboard)/teacher/page.tsx
import { getServerSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { fetchAllDataForWizard } from "@/lib/data-fetching/fetch-wizard-data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import TimetableDisplay from "@/components/schedule/TimetableDisplay";
import type { WizardData } from "@/types/index";
import TeacherStatsCards from "@/components/teacher/TeacherStatsCards";
import TeacherShortcuts from "@/components/teacher/TeacherShortcuts";

// Server component to fetch data and pass it to the client component
export default async function TeacherPage() {
  console.log("🧑‍🏫 [TeacherPage] Rendu de la page d'accueil de l'enseignant. Vérification de la session.");
  const session = await getServerSession();

  if (!session?.user?.id || session.user.role !== Role.TEACHER) {
    console.warn("🧑‍🏫 [TeacherPage] Session invalide ou rôle incorrect. Redirection...");
    redirect(session ? `/${(session.user.role as string).toLowerCase()}` : `/login`);
    return null; // Stop rendering
  }

  const teacherFromDb = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: {
          subjects: true,
          lessons: true,
        },
      },
    },
  });

  if (!teacherFromDb) {
    console.error("🧑‍🏫 [TeacherPage] Profil enseignant non trouvé pour l'ID utilisateur:", session.user.id);
    return (
      <div className="p-4 md:p-6 text-center">
        <Card className="inline-block p-8">
          <CardHeader>
            <CardTitle>Profil Enseignant Non Trouvé</CardTitle>
            <CardDescription>
              Aucun profil d'enseignant n'est associé à ce compte. Veuillez contacter l'administration.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const wizardData: WizardData = await fetchAllDataForWizard();

  console.log("🧑‍🏫 [TeacherPage] Rendu de l'emploi du temps.");
  return (
    <div className="flex-1 p-4 flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row gap-6">
            <div className="w-full xl:w-1/3">
                <TeacherStatsCards stats={teacherFromDb._count} />
            </div>
            <div className="w-full xl:w-2/3">
                <TeacherShortcuts teacherId={teacherFromDb.id} />
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Mon Emploi du Temps</CardTitle>
                <CardDescription>
                    Votre emploi du temps personnel pour la semaine.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TimetableDisplay
                    wizardData={wizardData}
                    viewMode={"teacher"}
                    selectedViewId={teacherFromDb.id}
                />
            </CardContent>
        </Card>
    </div>
  );
}
