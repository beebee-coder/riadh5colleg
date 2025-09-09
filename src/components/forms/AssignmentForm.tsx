// src/components/forms/AssignmentForm.tsx
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import FormFields from "./AssignmentForm/FormFields";
import useAssignmentForm from "./AssignmentForm/useAssignmentForm";
import type { AssignmentFormProps } from "./types";
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from "@/lib/redux/api/entityApi";

const AssignmentForm = ({type,data,setOpen, relatedData}: AssignmentFormProps) => {

  const [createAssignment, { isLoading: isCreating, isError: createIsError, error: createErrorData }] = useCreateAssignmentMutation();
  const [updateAssignment, { isLoading: isUpdating, isError: updateIsError, error: updateErrorData }] = useUpdateAssignmentMutation();
  
  const { register,errors,handleSubmit,actualOnSubmit } = useAssignmentForm({
    type,
    data,
    setOpen,
    relatedData,
    createAssignment,
    updateAssignment
  });

  const isLoading = isCreating || isUpdating;

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(actualOnSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouveau Devoir" : "Mettre à jour le Devoir"}
      </h1>

      <FormFields 
        register={register} 
        errors={errors} 
        isLoading={isLoading} 
        lessons={relatedData?.lessons || []} 
      />
      
      {(createIsError || updateIsError) && (
        <span className="text-destructive text-sm mt-2">
          Erreur: {(createErrorData as any)?.data?.message || 
                 (updateErrorData as any)?.data?.message || 
                 "Une erreur s'est produite."}
        </span>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Traitement en cours..." : 
         (type === "create" ? "Créer le Devoir" : "Mettre à jour le Devoir")}
      </Button>
    </form>
  );
};

export default AssignmentForm;
