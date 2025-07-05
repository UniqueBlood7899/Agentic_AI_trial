// This is an auto-generated file from Firebase Studio.

'use server';

/**
 * @fileOverview An AI agent that debugs and corrects code errors.
 *
 * - debugCodeErrors - A function that handles the code debugging and correction process.
 * - DebugCodeErrorsInput - The input type for the debugCodeErrors function.
 * - DebugCodeErrorsOutput - The return type for the debugCodeErrors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DebugCodeErrorsInputSchema = z.object({
  code: z.string().describe('The code to be debugged.'),
  language: z.string().describe('The programming language of the code.'),
  task: z.string().describe('The original task the code was intended to perform.'),
});
export type DebugCodeErrorsInput = z.infer<typeof DebugCodeErrorsInputSchema>;

const DebugCodeErrorsOutputSchema = z.object({
  originalCode: z.string().describe('The original code submitted for debugging.'),
  correctedCode: z.string().describe('The corrected code after debugging.'),
  explanation: z.string().describe('Explanation of the error and how it was fixed.'),
  rerunInstructions: z.string().describe('Instructions to rerun the code after correction.'),
});
export type DebugCodeErrorsOutput = z.infer<typeof DebugCodeErrorsOutputSchema>;

export async function debugCodeErrors(input: DebugCodeErrorsInput): Promise<DebugCodeErrorsOutput> {
  return debugCodeErrorsFlow(input);
}

const debugCodeErrorsPrompt = ai.definePrompt({
  name: 'debugCodeErrorsPrompt',
  input: {schema: DebugCodeErrorsInputSchema},
  output: {schema: DebugCodeErrorsOutputSchema},
  prompt: `You are an expert debugging assistant. You will receive code, the programming language it is written in, and the task it was intended to perform. If the code has an error, you will identify, explain, and fix the error. If the code does not have an error, you will state that there is no error and return the original code.

Original Task: {{{task}}}
Programming Language: {{{language}}}
Code: {{{code}}}

Your response should include the corrected code, an explanation of the error and how you fixed it, and instructions to rerun the code after correction. Return the original code unchanged if there is no error.

Ensure the output is valid and runnable.
`,
});

const debugCodeErrorsFlow = ai.defineFlow(
  {
    name: 'debugCodeErrorsFlow',
    inputSchema: DebugCodeErrorsInputSchema,
    outputSchema: DebugCodeErrorsOutputSchema,
  },
  async input => {
    const {output} = await debugCodeErrorsPrompt(input);
    return output!;
  }
);
