/*
  Warnings:

  - You are about to drop the column `description` on the `assignments` table. All the data in the column will be lost.
  - The primary key for the `chatroom_messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `chatroom_messages` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `optionalGroupId` on the `students` table. All the data in the column will be lost.
  - The primary key for the `teacher_constraints` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AgentAdministratif` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OptionalSubjectGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ClassroomToSubjectRequirement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `class_assignments` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `classes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,name]` on the table `schedule_drafts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,chatroomSessionId]` on the table `session_participants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subjectId]` on the table `subject_requirements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `chatroom_sessions` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `lessons` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_userId_fkey";

-- DropForeignKey
ALTER TABLE "AgentAdministratif" DROP CONSTRAINT "AgentAdministratif_userId_fkey";

-- DropForeignKey
ALTER TABLE "_ClassroomToSubjectRequirement" DROP CONSTRAINT "_ClassroomToSubjectRequirement_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClassroomToSubjectRequirement" DROP CONSTRAINT "_ClassroomToSubjectRequirement_B_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_studentId_fkey";

-- DropForeignKey
ALTER TABLE "class_assignments" DROP CONSTRAINT "class_assignments_classId_fkey";

-- DropForeignKey
ALTER TABLE "class_assignments" DROP CONSTRAINT "class_assignments_teacherAssignmentId_fkey";

-- DropForeignKey
ALTER TABLE "exams" DROP CONSTRAINT "exams_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_classId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_scheduleDraftId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "results" DROP CONSTRAINT "results_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "results" DROP CONSTRAINT "results_examId_fkey";

-- DropForeignKey
ALTER TABLE "results" DROP CONSTRAINT "results_studentId_fkey";

-- DropForeignKey
ALTER TABLE "schedule_drafts" DROP CONSTRAINT "schedule_drafts_userId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_optionalGroupId_fkey";

-- DropForeignKey
ALTER TABLE "subject_requirements" DROP CONSTRAINT "subject_requirements_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "teacher_assignments" DROP CONSTRAINT "teacher_assignments_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "teacher_assignments" DROP CONSTRAINT "teacher_assignments_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "teacher_constraints" DROP CONSTRAINT "teacher_constraints_teacherId_fkey";

-- DropIndex
DROP INDEX "attendances_studentId_lessonId_date_key";

-- AlterTable
ALTER TABLE "announcements" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "assignments" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "chatroom_messages" DROP CONSTRAINT "chatroom_messages_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "chatroom_messages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "chatroom_sessions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "classes" ALTER COLUMN "capacity" SET DEFAULT 25;

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "schedule_drafts" ADD COLUMN     "students" JSONB;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "optionalGroupId";

-- AlterTable
ALTER TABLE "subject_requirements" ADD COLUMN     "allowedRoomIds" INTEGER[];

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "requiresRoom" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "teacher_assignments" ADD COLUMN     "classIds" INTEGER[];

-- AlterTable
ALTER TABLE "teacher_constraints" DROP CONSTRAINT "teacher_constraints_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "teacher_constraints_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "teacher_constraints_id_seq";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'TEACHER';

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "AgentAdministratif";

-- DropTable
DROP TABLE "OptionalSubjectGroup";

-- DropTable
DROP TABLE "_ClassroomToSubjectRequirement";

-- DropTable
DROP TABLE "class_assignments";

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "phone" TEXT,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_administratifs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "phone" TEXT,

    CONSTRAINT "agent_administratifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optional_subject_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "maxSelections" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "optional_subject_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_userId_key" ON "admins"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_administratifs_userId_key" ON "agent_administratifs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "optional_subject_groups_name_key" ON "optional_subject_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "classes_name_key" ON "classes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_drafts_userId_name_key" ON "schedule_drafts"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_userId_chatroomSessionId_key" ON "session_participants"("userId", "chatroomSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_requirements_subjectId_key" ON "subject_requirements"("subjectId");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_administratifs" ADD CONSTRAINT "agent_administratifs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_scheduleDraftId_fkey" FOREIGN KEY ("scheduleDraftId") REFERENCES "schedule_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_requirements" ADD CONSTRAINT "subject_requirements_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
