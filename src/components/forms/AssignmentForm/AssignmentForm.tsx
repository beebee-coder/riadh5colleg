// src/components/forms/AssignmentForm/AssignmentForm.tsx
"use client";

import React from 'react';
import type { AssignmentFormProps } from '../types';

const AssignmentForm: React.FC<AssignmentFormProps> = ({ type, initialData, setOpen }) => {
  // Placeholder for the form implementation
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{type === 'create' ? 'Créer un nouveau devoir' : 'Modifier le devoir'}</h2>
      <p className="text-muted-foreground">Le formulaire pour les devoirs est en cours de construction.</p>
    </div>
  );
};

export default AssignmentForm;
