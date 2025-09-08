/*
  Warnings:

  - You are about to drop the column `createdAt` on the `chatroom_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `chatroom_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `maxSelections` on the `optional_subject_groups` table. All the data in the column will be lost.
  - You are about to drop the column `grades` on the `schedule_drafts` table. All the data in the column will be lost.
  - You are about to drop the column `students` on the `schedule_drafts` table. All the data in the column will be lost.
  - You are about to drop the column `chatroomSessionId` on the `session_participants` table. All the data in the column will be lost.
  - You are about to drop the column `leftAt` on the `session_participants` table. All the data in the column will be lost.
  - The `allowedRoomIds` column on the `subject_requirements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `requiresRoom` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `classIds` on the `teacher_assignments` table. All the data in the column will be lost.
  - You are about to drop the `_OptionalSubjects` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[subjectId]` on the table `optional_subject_groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,sessionId]` on the table `session_participants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `admins` required. This step will fail if there are existing NULL values in that column.
  - Made the column `surname` on table `admins` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `agent_administratifs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `surname` on table `agent_administratifs` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `subjectId` to the `optional_subject_groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionId` to the `session_participants` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `students` required. This step will fail if there are existing NULL values in that column.
  - Made the column `username` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "_OptionalSubjects" DROP CONSTRAINT "_OptionalSubjects_A_fkey";

-- DropForeignKey
ALTER TABLE "_OptionalSubjects" DROP CONSTRAINT "_OptionalSubjects_B_fkey";

-- DropForeignKey
ALTER TABLE "lesson_requirements" DROP CONSTRAINT "lesson_requirements_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "session_participants" DROP CONSTRAINT "session_participants_chatroomSessionId_fkey";

-- DropIndex
DROP INDEX "classes_name_key";

-- DropIndex
DROP INDEX "classrooms_name_key";

-- DropIndex
DROP INDEX "optional_subject_groups_name_key";

-- DropIndex
DROP INDEX "schedule_drafts_userId_name_key";

-- DropIndex
DROP INDEX "session_participants_userId_chatroomSessionId_key";

-- DropIndex
DROP INDEX "subject_requirements_subjectId_key";

-- DropIndex
DROP INDEX "subjects_name_key";

-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "surname" SET NOT NULL;

-- AlterTable
ALTER TABLE "agent_administratifs" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "surname" SET NOT NULL;

-- AlterTable
ALTER TABLE "chatroom_sessions" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "supervisorId" TEXT,
ALTER COLUMN "capacity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "optional_subject_groups" DROP COLUMN "maxSelections",
ADD COLUMN     "subjectId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "schedule_drafts" DROP COLUMN "grades",
DROP COLUMN "students";

-- AlterTable
ALTER TABLE "session_participants" DROP COLUMN "chatroomSessionId",
DROP COLUMN "leftAt",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "optionalGroupId" INTEGER,
ALTER COLUMN "address" SET NOT NULL;

-- AlterTable
ALTER TABLE "subject_requirements" DROP COLUMN "allowedRoomIds",
ADD COLUMN     "allowedRoomIds" JSONB;

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "requiresRoom",
ADD COLUMN     "optionalGroupId" INTEGER;

-- AlterTable
ALTER TABLE "teacher_assignments" DROP COLUMN "classIds";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'VISITOR',
ALTER COLUMN "twoFactorEnabled" DROP DEFAULT;

-- DropTable
DROP TABLE "_OptionalSubjects";

-- CreateTable
CREATE TABLE "class_assignments" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "teacherAssignmentId" INTEGER NOT NULL,

    CONSTRAINT "class_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StudentOptionalSubjects" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_GradeToScheduleDraft" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ClassroomToSubjectRequirement" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_StudentOptionalSubjects_AB_unique" ON "_StudentOptionalSubjects"("A", "B");

-- CreateIndex
CREATE INDEX "_StudentOptionalSubjects_B_index" ON "_StudentOptionalSubjects"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GradeToScheduleDraft_AB_unique" ON "_GradeToScheduleDraft"("A", "B");

-- CreateIndex
CREATE INDEX "_GradeToScheduleDraft_B_index" ON "_GradeToScheduleDraft"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassroomToSubjectRequirement_AB_unique" ON "_ClassroomToSubjectRequirement"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassroomToSubjectRequirement_B_index" ON "_ClassroomToSubjectRequirement"("B");

-- CreateIndex
CREATE UNIQUE INDEX "optional_subject_groups_subjectId_key" ON "optional_subject_groups"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_userId_sessionId_key" ON "session_participants"("userId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_optionalGroupId_fkey" FOREIGN KEY ("optionalGroupId") REFERENCES "optional_subject_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_constraints" ADD CONSTRAINT "teacher_constraints_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_teacherAssignmentId_fkey" FOREIGN KEY ("teacherAssignmentId") REFERENCES "teacher_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optional_subject_groups" ADD CONSTRAINT "optional_subject_groups_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chatroom_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentOptionalSubjects" ADD CONSTRAINT "_StudentOptionalSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentOptionalSubjects" ADD CONSTRAINT "_StudentOptionalSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GradeToScheduleDraft" ADD CONSTRAINT "_GradeToScheduleDraft_A_fkey" FOREIGN KEY ("A") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GradeToScheduleDraft" ADD CONSTRAINT "_GradeToScheduleDraft_B_fkey" FOREIGN KEY ("B") REFERENCES "schedule_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassroomToSubjectRequirement" ADD CONSTRAINT "_ClassroomToSubjectRequirement_A_fkey" FOREIGN KEY ("A") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassroomToSubjectRequirement" ADD CONSTRAINT "_ClassroomToSubjectRequirement_B_fkey" FOREIGN KEY ("B") REFERENCES "subject_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
