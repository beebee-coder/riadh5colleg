// src/components/forms/AttendanceForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import FormFields from "./AttendanceForm/FormFields";
import useAttendanceForm from "./AttendanceForm/useAttendanceForm";
import type { AttendanceFormProps } from "./types";

const AttendanceForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: AttendanceFormProps) => {
  const {
    register,
    handleSubmit,
    errors,
    isLoading,
    isPresent,
    onSubmit,
    setValue,
    createIsError,
    updateIsError,
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
      
      {(createIsError || updateIsError) && (
        <span className="text-destructive text-sm mt-2">
          Erreur: {(createErrorData as any)?.data?.message || 
           (updateErrorData as any)?.data?.message || 
           "Une erreur s'est produite."}
        </span>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Traitement..." : 
         (type === "create" ? "Enregistrer" : "Mettre à jour")}
      </Button>
    </form>
  );
};

export default AttendanceForm;
