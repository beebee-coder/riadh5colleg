// src/components/forms/types.ts
import type { EntityType } from "@/lib/redux/api/entityApi/config";
import type { Teacher, Subject, Class, Student, Grade, Parent, Lesson, Exam, Assignment, Event, Announcement, Result, Attendance, Classroom } from "@/types";
import type { Dispatch, SetStateAction } from "react";
import type { UseMutation } from '@reduxjs/toolkit/query/react';
import type { MutationDefinition } from '@reduxjs/toolkit/query';

// A generic type for the data prop, mapping entity type to its data structure
type EntityDataMap = {
    grade: Grade;
    subject: Subject;
    class: Class;
    teacher: Teacher;
    student: Student;
    parent: Parent;
    lesson: Lesson;
    exam: Exam;
    assignment: Assignment;
    event: Event;
    announcement: Announcement;
    result: Result;
    attendance: Attendance;
    classroom: Classroom;
    quiz: any; // quiz type is not defined yet
};

type RelatedDataMap = {
    subject: { teachers?: Teacher[] };
    class: { grades?: Grade[]; students?: Student[] };
    teacher: { subjects?: Subject[]; classes?: Class[] };
    student: { grades?: Grade[]; classes?: Class[]; parents?: Parent[] };
    lesson: { subjects?: Subject[]; classes?: Class[]; teachers?: Teacher[]; classrooms?: Classroom[] };
    exam: { lessons?: Lesson[] };
    assignment: { lessons?: Lesson[], subjects?: Subject[], classes?: Class[] };
    event: { classes?: Class[] };
    announcement: { classes?: Class[] };
    result: { students?: Student[]; exams?: Exam[]; assignments?: Assignment[] };
    attendance: { students?: Student[]; lessons?: Lesson[] };
    classroom: {};
    grade: {};
    parent: {};
    quiz: {};
}

// This is the new centralized type definition for the props.
export interface FormContainerProps {
  table: EntityType;
  type: "create" | "update" | "delete";
  data?: EntityDataMap[EntityType];
  id?: string | number; // The ID for a "delete" operation.
  relatedData?: RelatedDataMap[EntityType];
}

// Specific prop type for TeacherForm
export interface TeacherFormProps {
  type: 'create' | 'update';
  initialData?: Partial<Teacher> & { user?: Partial<Pick<any, 'username' | 'email'>>, subjects?: Partial<Pick<Subject, 'id' | 'name'>>[] } | null;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  availableSubjects?: Subject[];
  allClasses?: Class[];
}

export interface AssignmentFormProps {
  type: 'create' | 'update';
  data?: Assignment;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  relatedData?: { lessons?: Lesson[] };
}

export interface UseAssignmentFormProps extends AssignmentFormProps {
    createAssignment: UseMutation<MutationDefinition<any, any, any, any, any>>;
    updateAssignment: UseMutation<MutationDefinition<any, any, any, any, any>>;
}

export interface AttendanceFormProps {
  type: "create" | "update";
  data?: Attendance;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    students?: Pick<Student, 'id' | 'name' | 'surname'>[];
    lessons?: Pick<Lesson, 'id' | 'name'>[];
  };
}

// ... other form-specific props can be added here
