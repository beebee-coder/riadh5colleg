-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'AGENT_ADMINISTRATIF', 'VISITOR');

-- CreateEnum
CREATE TYPE "UserSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Day" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "TimePreference" AS ENUM ('AM', 'PM', 'ANY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "img" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "twoFactorEnabled" BOOLEAN DEFAULT false,
    "twoFactorCode" TEXT,
    "twoFactorCodeExpires" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "phone" TEXT,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "img" TEXT,
    "bloodType" TEXT,
    "birthday" TIMESTAMP(3),
    "sex" "UserSex",

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "img" TEXT,
    "bloodType" TEXT,
    "birthday" TIMESTAMP(3),
    "sex" "UserSex",
    "classId" INTEGER,
    "gradeId" INTEGER,
    "parentId" TEXT,
    "optionalGroupId" INTEGER,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "img" TEXT,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentAdministratif" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "phone" TEXT,
    "poste" TEXT,

    CONSTRAINT "AgentAdministratif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "capacity" INTEGER NOT NULL,
    "gradeId" INTEGER NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "weeklyHours" INTEGER,
    "coefficient" INTEGER,
    "isOptional" BOOLEAN DEFAULT false,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "capacity" INTEGER NOT NULL,
    "building" TEXT,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "day" "Day" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "classId" INTEGER,
    "teacherId" TEXT NOT NULL,
    "classroomId" INTEGER,
    "optionalSubjectId" INTEGER,
    "scheduleDraftId" TEXT,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "lessonId" INTEGER NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "lessonId" INTEGER NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" SERIAL NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "studentId" TEXT NOT NULL,
    "examId" INTEGER,
    "assignmentId" INTEGER,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "present" BOOLEAN NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" INTEGER NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "classId" INTEGER,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "classId" INTEGER,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatroom_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CLASS',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "hostId" TEXT NOT NULL,
    "classId" INTEGER,

    CONSTRAINT "chatroom_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_participants" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "chatroomSessionId" TEXT NOT NULL,

    CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatroom_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "chatroomSessionId" TEXT NOT NULL,

    CONSTRAINT "chatroom_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_drafts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolConfig" JSONB,
    "classes" JSONB,
    "subjects" JSONB,
    "teachers" JSONB,
    "rooms" JSONB,
    "grades" JSONB,

    CONSTRAINT "schedule_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_requirements" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "hours" INTEGER NOT NULL,
    "scheduleDraftId" TEXT NOT NULL,

    CONSTRAINT "lesson_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_constraints" (
    "id" SERIAL NOT NULL,
    "teacherId" TEXT NOT NULL,
    "day" "Day" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "description" TEXT,
    "scheduleDraftId" TEXT NOT NULL,

    CONSTRAINT "teacher_constraints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_requirements" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "timePreference" "TimePreference" NOT NULL DEFAULT 'ANY',
    "scheduleDraftId" TEXT NOT NULL,

    CONSTRAINT "subject_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" SERIAL NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "scheduleDraftId" TEXT NOT NULL,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_assignments" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "teacherAssignmentId" INTEGER NOT NULL,

    CONSTRAINT "class_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionalSubjectGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "OptionalSubjectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OptionalSubjects" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_TeacherSubjects" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ClassroomToSubjectRequirement" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "parents_userId_key" ON "parents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentAdministratif_userId_key" ON "AgentAdministratif"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "grades_level_key" ON "grades"("level");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_name_key" ON "classrooms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_studentId_lessonId_date_key" ON "attendances"("studentId", "lessonId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_requirements_classId_subjectId_scheduleDraftId_key" ON "lesson_requirements"("classId", "subjectId", "scheduleDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignments_teacherId_subjectId_scheduleDraftId_key" ON "teacher_assignments"("teacherId", "subjectId", "scheduleDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "_OptionalSubjects_AB_unique" ON "_OptionalSubjects"("A", "B");

-- CreateIndex
CREATE INDEX "_OptionalSubjects_B_index" ON "_OptionalSubjects"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TeacherSubjects_AB_unique" ON "_TeacherSubjects"("A", "B");

-- CreateIndex
CREATE INDEX "_TeacherSubjects_B_index" ON "_TeacherSubjects"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassroomToSubjectRequirement_AB_unique" ON "_ClassroomToSubjectRequirement"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassroomToSubjectRequirement_B_index" ON "_ClassroomToSubjectRequirement"("B");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_optionalGroupId_fkey" FOREIGN KEY ("optionalGroupId") REFERENCES "OptionalSubjectGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAdministratif" ADD CONSTRAINT "AgentAdministratif_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_scheduleDraftId_fkey" FOREIGN KEY ("scheduleDraftId") REFERENCES "schedule_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatroom_sessions" ADD CONSTRAINT "chatroom_sessions_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_chatroomSessionId_fkey" FOREIGN KEY ("chatroomSessionId") REFERENCES "chatroom_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatroom_messages" ADD CONSTRAINT "chatroom_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatroom_messages" ADD CONSTRAINT "chatroom_messages_chatroomSessionId_fkey" FOREIGN KEY ("chatroomSessionId") REFERENCES "chatroom_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_drafts" ADD CONSTRAINT "schedule_drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_requirements" ADD CONSTRAINT "lesson_requirements_scheduleDraftId_fkey" FOREIGN KEY ("scheduleDraftId") REFERENCES "schedule_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_requirements" ADD CONSTRAINT "lesson_requirements_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_constraints" ADD CONSTRAINT "teacher_constraints_scheduleDraftId_fkey" FOREIGN KEY ("scheduleDraftId") REFERENCES "schedule_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_constraints" ADD CONSTRAINT "teacher_constraints_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_requirements" ADD CONSTRAINT "subject_requirements_scheduleDraftId_fkey" FOREIGN KEY ("scheduleDraftId") REFERENCES "schedule_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_requirements" ADD CONSTRAINT "subject_requirements_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_scheduleDraftId_fkey" FOREIGN KEY ("scheduleDraftId") REFERENCES "schedule_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_teacherAssignmentId_fkey" FOREIGN KEY ("teacherAssignmentId") REFERENCES "teacher_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionalSubjects" ADD CONSTRAINT "_OptionalSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionalSubjects" ADD CONSTRAINT "_OptionalSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherSubjects" ADD CONSTRAINT "_TeacherSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherSubjects" ADD CONSTRAINT "_TeacherSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassroomToSubjectRequirement" ADD CONSTRAINT "_ClassroomToSubjectRequirement_A_fkey" FOREIGN KEY ("A") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassroomToSubjectRequirement" ADD CONSTRAINT "_ClassroomToSubjectRequirement_B_fkey" FOREIGN KEY ("B") REFERENCES "subject_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
