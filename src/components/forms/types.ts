// src/components/forms/types.ts
import type { EntityType } from "@/lib/redux/api/entityApi/config";
import { Teacher, Subject, User } from "@/types";

// This is the new centralized type definition for the props.
export interface FormContainerProps {
  table: EntityType;
  type: "create" | "update" | "delete";
  data?: Record<string, unknown> | null; // The initial data for an "update" form.
  id?: string | number; // The ID for a "delete" operation.
  relatedData?: Record<string, unknown> | null; // Any extra data the form might need (e.g., list of teachers for a subject form).
}

// Specific prop type for TeacherForm
export interface TeacherFormProps {
  type: 'create' | 'update';
  initialData?: Partial<Teacher> & { user?: Partial<Pick<User, 'username' | 'email'>>, subjects?: Partial<Pick<Subject, 'id' | 'name'>>[] } | null;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  availableSubjects?: Subject[];
  allClasses?: any[];
}
