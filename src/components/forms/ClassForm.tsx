// src/components/forms/ClassForm.tsx
"use client";

import React, { useEffect } from "react";
import { useForm, type SubmitHandler, UseFormRegister, FieldErrors, UseFormSetValue, UseFormHandleSubmit } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useCreateClassMutation, useUpdateClassMutation } from "@/lib/redux/api/entityApi";
import { classSchema, type ClassSchema } from "@/lib/formValidationSchemas";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import { Label } from "@/components/ui/label";
import { MultiSelectField } from "@/components/forms/MultiSelectField";
import type { ClassWithDetails, Grade, Student } from "@/types";
import type { Dispatch, SetStateAction } from "react";

// --- Types (colocated for simplicity) ---
interface ClassFormProps {
    type: "create" | "update";
    data?: ClassWithDetails;
    setOpen: Dispatch<SetStateAction<boolean>>;
    relatedData?: { 
      grades?: Grade[];
      students?: Student[];
    };
}

// --- HOOK LOGIC (useClassForm) ---

const useClassForm = ({
  type,
  data,
  setOpen,
}: ClassFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ClassSchema>({ 
    resolver: zodResolver(classSchema),
    defaultValues: data ? { 
      name: data.name,
      abbreviation: data.abbreviation || '',
      capacity: data.capacity || 0,
      gradeLevel: data.grade?.level,
      studentIds: data.students?.map((s: { id: string }) => s.id) || [],
    } : { 
      capacity: 25,
      studentIds: [],
    },
  });

  const selectedStudents = watch("studentIds") || [];
  const router = useRouter();
  const [createClass, { 
    isLoading: isCreating, 
    isSuccess: createSuccess, 
  }] = useCreateClassMutation();
  
  const [updateClass, { 
    isLoading: isUpdating, 
    isSuccess: updateSuccess, 
  }] = useUpdateClassMutation();

  const isLoading = isCreating || isUpdating;

  const actualOnSubmit: SubmitHandler<ClassSchema> = async (formData) => {
    try {
      if (type === "create") {
        await createClass(formData).unwrap();
      } else if (data?.id) {
        await updateClass({ ...formData, id: data.id }).unwrap();
      }
      toast({ title: `Classe ${type === "create" ? "créée" : "mise à jour"} avec succès !`});
      setOpen(false);
      reset();
      router.refresh();
    } catch (err: any) {
        const errorMessage = err?.data?.message || `Impossible de ${type === 'create' ? 'créer' : 'mettre à jour'} la classe.`;
        toast({ variant: "destructive", title: "Échec de l'opération", description: errorMessage });
    }
  };

  const onSubmit = handleSubmit(actualOnSubmit);

  return {
    register,
    handleSubmit,
    errors,
    isLoading,
    onSubmit,
    setValue,
    selectedStudents,
  };
};

// --- FORM FIELDS COMPONENT ---

interface FormFieldsProps {
  register: UseFormRegister<ClassSchema>;
  errors: FieldErrors<ClassSchema>;
  isLoading: boolean;
  grades: { id: number; level: number }[];
  students: { id: string; name: string; surname: string }[];
  setValue: UseFormSetValue<ClassSchema>;
  selectedStudents: string[];
}

const FormFields = ({ 
  register, 
  errors, 
  isLoading, 
  grades, 
  students,
  setValue,
  selectedStudents,
}: FormFieldsProps) => {

  const studentOptions = students.map(s => ({ value: s.id, label: `${s.name} ${s.surname}` }));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Nom de la Classe"
          name="name"
          register={register as any}
          error={errors?.name}
          disabled={isLoading}
        />
        <InputField
          label="Abréviation"
          name="abbreviation"
          register={register as any}
          error={errors?.abbreviation}
          disabled={isLoading}
        />
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Capacité"
            name="capacity"
            type="number"
            register={register as any}
            error={errors?.capacity}
            disabled={isLoading}
          />
           <div className="flex flex-col gap-2 w-full">
            <Label>Niveau</Label>
            <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
                {...register("gradeLevel")}
                disabled={isLoading}
            >
                <option value="">Sélectionner un niveau</option>
                {grades.map((grade) => (
                    <option value={String(grade.level)} key={grade.id}>
                        {grade.level}
                    </option>
                ))}
            </select>
            {errors.gradeLevel?.message && <p className="text-xs text-red-400">{String(errors.gradeLevel.message)}</p>}
        </div>
      </div>
      
      <MultiSelectField
        label="Élèves assignés"
        options={studentOptions}
        selected={selectedStudents}
        onChange={(selected) => setValue("studentIds", selected, { shouldValidate: true })}
        placeholder="Rechercher et sélectionner des élèves..."
        disabled={isLoading}
      />
    </>
  );
};


// --- MAIN COMPONENT ---
const ClassForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: ClassFormProps) => {
  const {
    register,
    handleSubmit,
    errors,
    isLoading,
    onSubmit,
    setValue,
    selectedStudents,
  } = useClassForm({ type, data, setOpen, relatedData });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer une Nouvelle Classe" : "Mettre à jour la Classe"}
      </h1>

      <FormFields 
        register={register}
        errors={errors}
        isLoading={isLoading}
        grades={relatedData?.grades || []}
        students={relatedData?.students || []}
        setValue={setValue}
        selectedStudents={selectedStudents}
      />
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Traitement en cours..." : 
         (type === "create" ? "Créer la Classe" : "Mettre à jour la Classe")}
      </Button>
    </form>
  );
};

export default ClassForm;
