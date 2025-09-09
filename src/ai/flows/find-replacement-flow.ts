// src/ai/flows/find-replacement-flow.ts
'use server';

/**
 * @fileOverview An AI agent for finding teacher replacements.
 *
 * - findReplacement - Finds replacement solutions for an absent teacher on a specific date.
 * - FindReplacementInput - The input type for the findReplacement function.
 * - ReplacementSolution - The output type for one of the proposed solutions.
 */
import { ai } from '@/lib/genkit';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { Day, Lesson } from '@prisma/client';
import { format } from 'date-fns';

// --- Input and Output Schemas ---
const FindReplacementInputSchema = z.object({
  teacherId: z.string().describe('The ID of the teacher who is absent.'),
  date: z.string().describe('The date of the absence in YYYY-MM-DD format.'),
});
export type FindReplacementInput = z.infer<typeof FindReplacementInputSchema>;

const ReplacementSolutionSchema = z.object({
  type: z.enum(['internal', 'cancel', 'split']).describe('The type of solution proposed.'),
  description: z.string().describe('A detailed, human-readable description of the solution.'),
  impact: z.string().describe("The impact of this solution (e.g., 'Minimal', 'Moderate', 'High')."),
  conflicts: z.array(z.string()).describe('Any potential conflicts or considerations.'),
  replacementTeacher: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
  }).describe('The teacher proposed for the replacement, if applicable.'),
  affectedLessons: z.array(z.object({
      id: z.number(),
      subject: z.string(),
      class: z.string(),
      startTime: z.string(),
      endTime: z.string(),
  })).describe('The specific lessons affected by this solution.'),
});
export type ReplacementSolution = z.infer<typeof ReplacementSolutionSchema>;


// --- Main Exported Function ---
export async function findReplacement(
  input: FindReplacementInput
): Promise<ReplacementSolution[]> {
  return findReplacementFlow(input);
}


// --- Genkit Flow Definition ---
const findReplacementFlow = ai.defineFlow(
  {
    name: 'findReplacementFlow',
    inputSchema: FindReplacementInputSchema,
    outputSchema: z.array(ReplacementSolutionSchema),
  },
  async (input) => {
    // 1. Fetch all necessary data from the database
    const absentTeacher = await prisma.teacher.findUnique({ where: { id: input.teacherId } });
    if (!absentTeacher) {
      throw new Error('Absent teacher not found');
    }

    const allTeachers = await prisma.teacher.findMany({ include: { subjects: true } });
    const allLessons = await prisma.lesson.findMany({ include: { class: true, subject: true } });
    const absenceDate = new Date(input.date);
    const dayOfWeek = format(absenceDate, 'EEEE').toUpperCase() as Day;

    const absentTeacherLessons = allLessons.filter(
      (lesson) => lesson.teacherId === input.teacherId && lesson.day === dayOfWeek
    );
    
    if (absentTeacherLessons.length === 0) {
      return [{
        type: 'internal',
        description: "Aucun cours n'est prévu pour ce professeur à la date sélectionnée. Aucune action n'est nécessaire.",
        impact: 'Aucun',
        conflicts: [],
        replacementTeacher: {},
        affectedLessons: [],
      }];
    }

    // Prepare context for the AI prompt
    const context = {
      absentTeacher: {
        id: absentTeacher.id,
        name: `${absentTeacher.name} ${absentTeacher.surname}`,
      },
      absentTeacherLessons: absentTeacherLessons.map(l => ({
        id: l.id,
        subject: l.subject.name,
        class: l.class?.name || 'N/A',
        startTime: l.startTime.toISOString(),
        endTime: l.endTime.toISOString(),
        day: l.day,
      })),
      availableTeachers: allTeachers
        .filter((t) => t.id !== input.teacherId)
        .map((t) => ({
          id: t.id,
          name: `${t.name} ${t.surname}`,
          subjects: t.subjects.map(s => s.name),
          availability: allLessons
            .filter((l) => l.teacherId === t.id && l.day === dayOfWeek)
            .map((l) => ({
              startTime: l.startTime.toISOString(),
              endTime: l.endTime.toISOString(),
            })),
        })),
    };

    const { output } = await replacementPrompt(context);
    return output ?? [];
  }
);


// --- Genkit Prompt Definition ---
const replacementPrompt = ai.definePrompt({
  name: 'replacementPrompt',
  input: {
      schema: z.any()
  },
  output: {
    schema: z.array(ReplacementSolutionSchema),
  },
  prompt: `
    You are an expert school administrator specializing in finding last-minute replacements for absent teachers.
    Your goal is to provide three distinct, creative, and viable solutions.

    **Current Situation:**
    - Absent Teacher: {{{absentTeacher.name}}} (ID: {{{absentTeacher.id}}})
    - Lessons to Cover: 
      {{#each absentTeacherLessons}}
      - Lesson ID: {{id}}, Subject: {{subject}}, Class: {{class}}, Time: {{startTime}} to {{endTime}}
      {{/each}}

    **Available Teachers and their schedule on the day of absence:**
    {{#each availableTeachers}}
    - Teacher: {{name}} (ID: {{id}}), Teaches: {{#each subjects}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
      - Availability Conflicts: 
        {{#each availability}}
          - Busy from {{startTime}} to {{endTime}}
        {{else}}
          - Completely free today.
        {{/each}}
    {{/each}}

    **Your Task:**
    Analyze the situation and provide three distinct solutions. For each solution, follow these rules:
    1.  **Prioritize internal replacements:** Find another teacher who is free during the lesson slot AND is qualified to teach the subject.
    2.  **Consider class cancellation:** If no suitable replacement is found, cancelling the class is an option.
    3.  **Propose creative solutions:** Think about splitting a class, merging it with another, or assigning a study hall.
    4.  **Format the output strictly** according to the 'ReplacementSolution' JSON schema.
    5.  **For each solution, describe it clearly**, state the impact, list any potential conflicts, and identify the replacement teacher if applicable.
    6.  **The 'affectedLessons' array must contain all the lessons of the absent teacher** that are addressed by that specific solution.
    7.  If you propose a replacement, ensure the replacement teacher is NOT already teaching another class during the affected lesson's timeslot.
  `,
});
