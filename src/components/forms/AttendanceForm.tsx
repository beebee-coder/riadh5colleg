// src/components/forms/AttendanceForm.tsx
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateAttendanceMutation, useUpdateAttendanceMutation } from "@/lib/redux/api/entityApi/index";
import { attendanceSchema, type AttendanceSchema } from "@/lib/formValidationSchemas";
import type { Dispatch, SetStateAction } from "react";
import type { Student, LessonWithDetails } from "@/types";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// --- Types ---
interface AttendanceFormProps {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    students?: Pick<Student, 'id' | 'name' | 'surname'>[];
    lessons?: Pick<LessonWithDetails, 'id' | 'name'>[];
  };
}

// --- Hook Logic ---
const useAttendanceForm = ({ type, data, setOpen }: AttendanceFormProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: data ? {
      ...data,
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : undefined,
      present: data.present ?? false,
    } : {
      present: true,
    },
  });

  const isPresent = watch("present");
  const router = useRouter();
  const [createAttendance, { isLoading: isCreating, isSuccess: createSuccess, error: createErrorData }] = useCreateAttendanceMutation();
  const [updateAttendance, { isLoading: isUpdating, isSuccess: updateSuccess, error: updateErrorData }] = useUpdateAttendanceMutation();
  const isLoading = isCreating || isUpdating;

  const onSubmit: SubmitHandler<AttendanceSchema> = async (formData) => {
    try {
      if (type === "create") {
        await createAttendance(formData).unwrap();
      } else if (data?.id) {
        await updateAttendance({ ...formData, id: data.id }).unwrap();
      }
      toast({ title: `Présence ${type === "create" ? "enregistrée" : "mise à jour"} avec succès !` });
      setOpen(false);
      reset();
      router.refresh();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Échec de l'opération", description: err.data?.message || "Une erreur est survenue." });
    }
  };

  return { register, handleSubmit, errors, isLoading, isPresent, onSubmit, setValue, createErrorData, updateErrorData };
};

// --- Form Fields Component ---
interface FormFieldsProps {
  register: any;
  errors: any;
  isLoading: boolean;
  isPresent: boolean;
  setValue: any;
  students: { id: string; name: string; surname: string }[];
  lessons: { id: number; name: string }[];
  isUpdate: boolean;
}

const FormFields = ({ register, errors, isLoading, isPresent, setValue, students, lessons, isUpdate }: FormFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="flex flex-col gap-2 w-full">
      <Label>Étudiant</Label>
      <select
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
        {...register("studentId")}
        disabled={isLoading || isUpdate}
      >
        <option value="">Sélectionner un étudiant</option>
        {students.map((student) => (
          <option value={student.id} key={student.id}>
            {student.name} {student.surname}
          </option>
        ))}
      </select>
      {errors.studentId && <p className="text-xs text-red-400">{errors.studentId.message as string}</p>}
    </div>
    <div className="flex flex-col gap-2 w-full">
      <Label>Cours</Label>
      <select
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
        {...register("lessonId")}
        disabled={isLoading || isUpdate}
      >
        <option value="">Sélectionner un cours</option>
        {lessons.map((lesson) => (
          <option value={String(lesson.id)} key={lesson.id}>{lesson.name}</option>
        ))}
      </select>
      {errors.lessonId && <p className="text-xs text-red-400">{errors.lessonId.message as string}</p>}
    </div>
    <InputField
      label="Date"
      name="date"
      type="date"
      register={register}
      error={errors?.date}
      disabled={isLoading}
    />
    <div className="flex items-center space-x-2 pt-6">
      <Checkbox
        id="present"
        checked={isPresent}
        onCheckedChange={(checked) => setValue("present", checked as boolean)}
        disabled={isLoading}
      />
      <Label htmlFor="present" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Présent(e)
      </Label>
      {errors.present && <p className="text-xs text-red-400">{errors.present.message as string}</p>}
    </div>
  </div>
);


// --- Main Component ---
const AttendanceForm = ({ type, data, setOpen, relatedData }: AttendanceFormProps) => {
  const {
    register,
    handleSubmit,
    errors,
    isLoading,
    isPresent,
    onSubmit,
    setValue,
    createErrorData,
    updateErrorData,
  } = useAttendanceForm({ type, data, setOpen, relatedData });

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Enregistrer une Présence" : "Mettre à jour une Présence"}
      </h1>

      <FormFields
        register={register}
        errors={errors}
        isLoading={isLoading}
        isPresent={isPresent}
        setValue={setValue}
        students={relatedData?.students || []}
        lessons={relatedData?.lessons || []}
        isUpdate={type === 'update'}
      />
      
      {(createErrorData || updateErrorData) && (
        <span className="text-red-500 text-sm mt-2">
          {(createErrorData as any)?.data?.message || (updateErrorData as any)?.data?.message || "Une erreur s'est produite."}
        </span>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Traitement..." : (type === "create" ? "Enregistrer" : "Mettre à jour")}
      </Button>
    </form>
  );
};

export default AttendanceForm;
