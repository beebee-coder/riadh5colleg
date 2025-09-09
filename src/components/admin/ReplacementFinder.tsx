// src/components/admin/ReplacementFinder.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Wand2, User, CalendarIcon, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { findReplacement, ReplacementSolution } from '@/ai/flows/find-replacement-flow';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReplacementSolutionCard from './ReplacementSolutionCard';

interface ReplacementFinderProps {
  teachers: { id: string; name: string; surname: string }[];
}

export default function ReplacementFinder({ teachers }: ReplacementFinderProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [solutions, setSolutions] = useState<ReplacementSolution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleFindReplacements = async () => {
    if (!selectedTeacherId || !selectedDate) {
      toast({
        variant: 'destructive',
        title: 'Informations manquantes',
        description: 'Veuillez sélectionner un professeur et une date.',
      });
      return;
    }
    
    setIsLoading(true);
    setSolutions([]);
    setError(null);

    try {
      const result = await findReplacement({
        teacherId: selectedTeacherId,
        date: selectedDate.toISOString().split('T')[0],
      });
      setSolutions(result);
    } catch (e: any) {
      console.error(e);
      setError("Une erreur est survenue lors de la recherche de remplacements. L'IA n'a peut-être pas pu trouver de solution viable.");
      toast({
        variant: 'destructive',
        title: 'Erreur de recherche',
        description: "Une erreur est survenue lors de la recherche de remplacements.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <LabelledSelector
            icon={User}
            label="Professeur à remplacer"
            placeholder="Sélectionner un professeur"
            value={selectedTeacherId}
            onValueChange={setSelectedTeacherId}
            items={teachers.map(t => ({ value: t.id, label: `${t.name} ${t.surname}` }))}
          />
        </div>
        <div className="flex flex-col items-center">
            <LabelledSelector
                icon={CalendarIcon}
                label="Date de l'absence"
                placeholder=''
            >
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                />
            </LabelledSelector>
        </div>
      </div>
      
      <Button
        onClick={handleFindReplacements}
        disabled={isLoading || !selectedTeacherId || !selectedDate}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" />
        )}
        {isLoading ? 'Recherche en cours...' : 'Trouver des solutions de remplacement'}
      </Button>
      
      {isLoading && (
        <div className="text-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">L'IA analyse les emplois du temps...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle />
              Recherche échouée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {solutions.length > 0 && !isLoading && (
        <div className="space-y-6 pt-6 border-t">
            <h2 className="text-2xl font-bold text-center">Solutions proposées pour {selectedTeacher?.name} {selectedTeacher?.surname}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {solutions.map((solution, index) => (
                    <ReplacementSolutionCard key={index} solution={solution} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
}

const LabelledSelector = ({ icon: Icon, label, children, ...props }: { icon: React.ElementType, label: string, children?: React.ReactNode, placeholder?: string, value?: string, onValueChange?: (value: string) => void, items?: { value: string, label: string }[] }) => (
    <div>
        <label className="text-sm font-medium text-muted-foreground flex items-center mb-2">
            <Icon className="mr-2 h-4 w-4" />
            {label}
        </label>
        {props.items ? (
             <Select value={props.value} onValueChange={props.onValueChange}>
                <SelectTrigger>
                    <SelectValue placeholder={props.placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {props.items.map(item => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        ) : children}
    </div>
);