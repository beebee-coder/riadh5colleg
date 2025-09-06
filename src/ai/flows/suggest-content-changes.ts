// Implemented the Genkit flow for suggesting content changes based on new information, using a tool to decide its usefulness.
'use server';
/**
 * @fileOverview AI-powered content suggestion flow.
 *
 * This module defines a Genkit flow that suggests changes to existing content by
 * evaluating the relevance of new information. It uses an LLM to determine if
 * the new information enhances the content and incorporates it accordingly.
 *
 * @module suggest-content-changes
 *
 * @exported
 * - `suggestContentChanges`:  The main function to trigger content change suggestions.
 * - `SuggestContentChangesInput`: The input type for the `suggestContentChanges` function.
 * - `SuggestContentChangesOutput`: The output type for the `suggestContentChanges` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the flow
const SuggestContentChangesInputSchema = z.object({
  existingContent: z.string().describe('The existing content of the page.'),
  newInformation: z.string().describe('The new information to consider adding to the content.'),
});

export type SuggestContentChangesInput = z.infer<typeof SuggestContentChangesInputSchema>;

// Define the output schema for the flow
const SuggestContentChangesOutputSchema = z.object({
  suggestedContent: z.string().describe('The suggested content with incorporated new information, if relevant.'),
  reasoning: z.string().describe('The AI reasoning for including or excluding the new information.'),
});

export type SuggestContentChangesOutput = z.infer<typeof SuggestContentChangesOutputSchema>;

// Define the tool to evaluate the usefulness of new information
const evaluateInformationUsefulness = ai.defineTool({
  name: 'evaluateInformationUsefulness',
  description: 'Evaluates whether the new information is useful and relevant to the existing content.',
  inputSchema: z.object({
    existingContent: z.string().describe('The existing content of the page.'),
    newInformation: z.string().describe('The new information to evaluate.'),
  }),
  outputSchema: z.object({
    isUseful: z.boolean().describe('Whether the new information is useful for the existing content.'),
    reason: z.string().describe('The reason for the usefulness evaluation.'),
  }),
},
async (input) => {
  // Mock implementation of the tool.  In a real application, this would use an LLM or other method
  // to determine if the new information is useful.
  console.log(`Evaluating if ${input.newInformation} is useful for ${input.existingContent}`);
  const isUseful = input.newInformation.length > 0; // Simple heuristic: if the new information is not empty, consider it useful.
  const reason = isUseful ? 'The new information is not empty.' : 'The new information is empty.';
  return {isUseful, reason};
});

// Define the prompt for suggesting content changes
const suggestContentChangesPrompt = ai.definePrompt({
  name: 'suggestContentChangesPrompt',
  input: {schema: SuggestContentChangesInputSchema},
  output: {schema: SuggestContentChangesOutputSchema},
  tools: [evaluateInformationUsefulness],
  prompt: `You are a content improvement assistant. Your task is to improve the existing content by incorporating new information if it is relevant and useful.\n\nFirst, use the evaluateInformationUsefulness tool to determine if the new information is useful for the existing content. If it is, incorporate it into the existing content in a natural and coherent way. If it is not, explain why it is not useful and return the original content.\n\nExisting Content: {{{existingContent}}}\nNew Information: {{{newInformation}}}`,
});

// Define the Genkit flow
const suggestContentChangesFlow = ai.defineFlow({
    name: 'suggestContentChangesFlow',
    inputSchema: SuggestContentChangesInputSchema,
    outputSchema: SuggestContentChangesOutputSchema,
  },
  async input => {
    const {output} = await suggestContentChangesPrompt(input);
    return output!;
  }
);

/**
 * Suggests changes to the page content based on new information.
 * @param input - The input for suggesting content changes.
 * @returns A promise that resolves to the suggested content changes.
 */
export async function suggestContentChanges(input: SuggestContentChangesInput): Promise<SuggestContentChangesOutput> {
  return suggestContentChangesFlow(input);
}
