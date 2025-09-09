// src/components/forms/AttendanceForm/types.ts
import type { Dispatch, SetStateAction } from "react";
import type { Student, LessonWithDetails } from "@/types";
import type { AttendanceSchema } from "@/lib/formValidationSchemas";
import { FieldErrors, SubmitHandler, UseFormHandleSubmit, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

export interface AttendanceFormProps {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    students?: Pick<Student, 'id' | 'name' | 'surname'>[];
    lessons?: Pick<LessonWithDetails, 'id' | 'name'>[];
  };
}

export interface AttendanceFormReturn {
  register: UseFormRegister<AttendanceSchema>;
  handleSubmit: UseFormHandleSubmit<AttendanceSchema>;
  errors: FieldErrors<AttendanceSchema>;
  isLoading: boolean;
  isPresent: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  setValue: UseFormSetValue<AttendanceSchema>;
  createIsError: boolean;
  updateIsError: boolean;
  createErrorData: FetchBaseQueryError | SerializedError | undefined;
  updateErrorData: FetchBaseQueryError | SerializedError | undefined;
}
