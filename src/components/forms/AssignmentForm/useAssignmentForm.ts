// src/components/forms/AssignmentForm/useAssignmentForm.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { assignmentSchema } from "@/lib/formValidationSchemas";
import type { AssignmentSchema } from "@/types/schemas";
import type { UseAssignmentFormProps } from "../types";

const useAssignmentForm = ({
  type,
  data,
  setOpen,
  createAssignment,
  updateAssignment
}: UseAssignmentFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: data ? {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    } : {},
  });

  const router = useRouter();

  const actualOnSubmit: SubmitHandler<AssignmentSchema> = async (formData: AssignmentSchema) => {
    try {
      if (type === "create") {
        await createAssignment(formData).unwrap();
      } else if (data?.id) {
        await updateAssignment({ ...formData, id: data.id }).unwrap();
      }
      toast({ title: `Devoir ${type === "create" ? "créé" : "mis à jour"} avec succès !` });
      setOpen(false);
      reset();
      router.refresh();
    } catch (err: any) {
        const errorMessage = err?.data?.message || `Impossible de ${type === "create" ? "créer" : "mettre à jour"} le devoir.`;
        toast({ variant: "destructive", title: "Erreur", description: errorMessage });
    }
  };

  return {
    register,
    errors,
    handleSubmit,
    actualOnSubmit,
  };
};

export default useAssignmentForm;
