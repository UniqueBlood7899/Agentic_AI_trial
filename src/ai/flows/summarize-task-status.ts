// Summarizes the status of a given task, providing a high-level overview of progress.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTaskStatusInputSchema = z.object({
  taskId: z.string().describe('The ID of the task to summarize.'),
  stepsTaken: z.string().describe('A description of the steps taken by the agent so far.')
});
export type SummarizeTaskStatusInput = z.infer<typeof SummarizeTaskStatusInputSchema>;

const SummarizeTaskStatusOutputSchema = z.object({
  summary: z.string().describe('A summarized status update of the task.'),
  progress: z.string().describe('A one-sentence summary of the agent\'s progress.')
});
export type SummarizeTaskStatusOutput = z.infer<typeof SummarizeTaskStatusOutputSchema>;

export async function summarizeTaskStatus(input: SummarizeTaskStatusInput): Promise<SummarizeTaskStatusOutput> {
  return summarizeTaskStatusFlow(input);
}

const summarizeTaskStatusPrompt = ai.definePrompt({
  name: 'summarizeTaskStatusPrompt',
  input: {schema: SummarizeTaskStatusInputSchema},
  output: {schema: SummarizeTaskStatusOutputSchema},
  prompt: `You are an AI assistant responsible for providing concise summaries of task statuses. Given the task ID and the steps taken so far, provide a summarized update and a one-sentence progress report.

Task ID: {{{taskId}}}
Steps Taken: {{{stepsTaken}}}

Summary: `,
});

const summarizeTaskStatusFlow = ai.defineFlow(
  {
    name: 'summarizeTaskStatusFlow',
    inputSchema: SummarizeTaskStatusInputSchema,
    outputSchema: SummarizeTaskStatusOutputSchema,
  },
  async input => {
    const {output} = await summarizeTaskStatusPrompt(input);
    return {
      ...output,
      progress: `The agent has taken the following steps: ${input.stepsTaken}`
    } as SummarizeTaskStatusOutput;
  }
);
